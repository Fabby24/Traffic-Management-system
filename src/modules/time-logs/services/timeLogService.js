const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class TimeLogService {
    /**
     * Get time logs with filters
     */
    static async getTimeLogs({
        organizationId,
        userId,
        filterUserId,
        task_id,
        project_id,
        date,
        from,
        to,
        page = 1,
        limit = 50,
    }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const where = {
            organization_id: organizationId,
        };

        if (filterUserId) {
            where.user_id = filterUserId;
        }

        if (task_id) {
            where.task_id = task_id;
        }

        if (project_id) {
            where.project_id = project_id;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            where.date = {
                gte: startDate,
                lt: endDate,
            };
        }

        if (from && to) {
            where.date = {
                gte: new Date(from),
                lte: new Date(to),
            };
        }

        const [logs, total] = await Promise.all([
            prisma.timeLog.findMany({
                where,
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            project_id: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { date: 'desc' },
                skip: offset,
                take: limitNum,
            }),
            prisma.timeLog.count({ where }),
        ]);

        return {
            logs,
            total,
            totalPages: Math.ceil(total / limitNum),
            page: pageNum,
            limit: limitNum,
        };
    }

    /**
     * Get daily summary
     */
    static async getDailySummary({ organizationId, userId, date }) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const where = {
            organization_id: organizationId,
            user_id: userId,
            date: {
                gte: startDate,
                lt: endDate,
            },
        };

        const [logs, totalHours] = await Promise.all([
            prisma.timeLog.findMany({
                where,
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: { date: 'desc' },
            }),
            prisma.timeLog.aggregate({
                where,
                _sum: { hours: true },
            }),
        ]);

        return {
            logs,
            total: totalHours._sum.hours || 0,
            count: logs.length,
        };
    }

    /**
     * Get weekly summary
     */
    static async getWeeklySummary({ organizationId, userId, from, to }) {
        const where = {
            organization_id: organizationId,
            user_id: userId,
            date: {
                gte: new Date(from),
                lte: new Date(to),
            },
        };

        const logs = await prisma.timeLog.findMany({
            where,
            select: {
                id: true,
                date: true,
                hours: true,
            },
        });

        // Group by day
        const dayMap = {};
        logs.forEach(log => {
            const key = log.date.toISOString().split('T')[0];
            if (!dayMap[key]) {
                dayMap[key] = 0;
            }
            dayMap[key] += log.hours || 0;
        });

        const summary = Object.keys(dayMap).map(key => ({
            date: key,
            hours: dayMap[key],
        }));

        const totalHours = summary.reduce((sum, d) => sum + d.hours, 0);

        return {
            summary,
            total: totalHours,
            count: logs.length,
        };
    }

    /**
     * Get organization weekly summary
     */
    static async getOrganizationWeeklySummary({ organizationId, from, to }) {
        const where = {
            organization_id: organizationId,
            date: {
                gte: new Date(from),
                lte: new Date(to),
            },
        };

        const logs = await prisma.timeLog.findMany({
            where,
            select: {
                date: true,
                hours: true,
            },
        });

        // Group by day
        const dayMap = {};
        logs.forEach(log => {
            const key = log.date.toISOString().split('T')[0];
            if (!dayMap[key]) {
                dayMap[key] = 0;
            }
            dayMap[key] += log.hours || 0;
        });

        const summary = Object.keys(dayMap).map(key => ({
            date: key,
            hours: dayMap[key],
        }));

        return summary;
    }
    
        /**
 * Get organization time tracking dashboard data
 */
static async getOrganizationDashboard({organizationId, date, period = 'week' }) {
    // Get date range
    let startDate, endDate;
    const now = new Date();

    if (period === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date(now);
    } else if (period === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date(now);
    } else {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date(now);
    }

    // 1. Get total hours by user
    const userHours = await prisma.timeLog.groupBy({
        by: ['user_id'],
        where: {
            organization_id: organizationId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: { hours: true },
    });

    const userIds = userHours.map(u => u.user_id).filter(id => id !== null);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
        },
    });

    const userHoursData = userHours.map(uh => {
        const user = users.find(u => u.id === uh.user_id);
        return {
            user_id: uh.user_id,
            first_name: user?.first_name || 'Unknown',
            last_name: user?.last_name || '',
            email: user?.email || '',
            profile_image: user?.profile_image || '',
            total_hours: uh._sum.hours || 0,
        };
    });

    // 2. Get total hours by project
    const projectHours = await prisma.timeLog.groupBy({
        by: ['project_id'],
        where: {
            organization_id: organizationId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: { hours: true },
    });

    const projectIds = projectHours.map(ph => ph.project_id).filter(id => id !== null);
    const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: {
            id: true,
            name: true,
            color: true,
        },
    });

    const projectHoursData = projectHours.map(ph => {
        const project = projects.find(p => p.id === ph.project_id);
        return {
            project_id: ph.project_id,
            project_name: project?.name || 'Unknown Project',
            color: project?.color || '#2563EB',
            total_hours: ph._sum.hours || 0,
        };
    });

    // 3. Get daily breakdown
    const dailyBreakdown = await prisma.timeLog.groupBy({
        by: ['date'],
        where: {
            organization_id: organizationId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: { hours: true },
        orderBy: { date: 'asc' },
    });

    const dailyData = dailyBreakdown.map(d => ({
        date: d.date,
        hours: d._sum.hours || 0,
    }));

    // 4. Get billable vs non-billable
    const billableStats = await prisma.timeLog.aggregate({
        where: {
            organization_id: organizationId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: { hours: true },
    });

    const billableHours = await prisma.timeLog.aggregate({
        where: {
            organization_id: organizationId,
            billable: true,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: { hours: true },
    });

    // 5. Get recent time logs
    const recentLogs = await prisma.timeLog.findMany({
        where: {
            organization_id: organizationId,
        },
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
            user: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    profile_image: true,
                },
            },
            task: {
                select: {
                    id: true,
                    title: true,
                    project_id: true,
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
    });

    // 6. Get total hours (all time)
    const totalHours = await prisma.timeLog.aggregate({
        where: {
            organization_id: organizationId,
        },
        _sum: { hours: true },
    });

    // 7. Get active users with time logs today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeUsersToday = await prisma.timeLog.groupBy({
        by: ['user_id'],
        where: {
            organization_id: organizationId,
            date: {
                gte: today,
                lt: tomorrow,
            },
        },
        _sum: { hours: true },
    });

    return {
        period,
        dateRange: {
            from: startDate,
            to: endDate,
        },
        summary: {
            totalHours: totalHours._sum.hours || 0,
            periodHours: billableStats._sum.hours || 0,
            billableHours: billableHours._sum.hours || 0,
            nonBillableHours: (billableStats._sum.hours || 0) - (billableHours._sum.hours || 0),
            activeUsers: userHoursData.length,
            activeUsersToday: activeUsersToday.length,
        },
        userHours: userHoursData,
        projectHours: projectHoursData,
        dailyBreakdown: dailyData,
        recentLogs: recentLogs,
    };
}

    /**
     * Start timer
     */
    static async startTimer({ organizationId, userId, task_id }) {
        // Check if task exists
        const task = await prisma.task.findFirst({
            where: {
                id: task_id,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user has an active session
        const activeSession = await prisma.timeLog.findFirst({
            where: {
                user_id: userId,
                organization_id: organizationId,
                end_time: null,
            },
        });

        if (activeSession) {
            throw new Error('You already have an active time tracking session');
        }

        // Create time log entry
        const timeLog = await prisma.timeLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                task_id: task_id,
                project_id: task.project_id,
                date: new Date(),
                hours: 0,
                description: `Tracking time on ${task.title}`,
                billable: task.billable !== undefined ? task.billable : true,
                start_time: new Date(),
                end_time: null,
            },
        });

        logger.info(`Time tracking started for user ${userId} on task ${task_id}`);

        return timeLog;
    }

    /**
     * Stop timer
     */
    static async stopTimer({ organizationId, userId, time_log_id }) {
        const timeLog = await prisma.timeLog.findFirst({
            where: {
                id: time_log_id,
                user_id: userId,
                organization_id: organizationId,
                end_time: null,
            },
        });

        if (!timeLog) {
            throw new Error('No active time tracking session found');
        }

        const startTime = new Date(timeLog.start_time);
        const endTime = new Date();
        const hours = Math.round(((endTime - startTime) / (1000 * 60 * 60)) * 100) / 100;

        const updated = await prisma.timeLog.update({
            where: { id: timeLog.id },
            data: {
                end_time: endTime,
                hours: hours,
            },
        });

        // Update task actual hours
        if (timeLog.task_id) {
            await prisma.task.update({
                where: { id: timeLog.task_id },
                data: {
                    actual_hours: {
                        increment: hours,
                    },
                },
            });
        }

        logger.info(`Time tracking stopped for user ${userId}, hours: ${hours}`);

        return updated;
    }

    /**
     * Pause timer
     */
    static async pauseTimer({ organizationId, userId, time_log_id }) {
        const timeLog = await prisma.timeLog.findFirst({
            where: {
                id: time_log_id,
                user_id: userId,
                organization_id: organizationId,
                end_time: null,
            },
        });

        if (!timeLog) {
            throw new Error('No active time tracking session found');
        }

        const startTime = new Date(timeLog.start_time);
        const pauseTime = new Date();
        const hours = Math.round(((pauseTime - startTime) / (1000 * 60 * 60)) * 100) / 100;

        const updated = await prisma.timeLog.update({
            where: { id: timeLog.id },
            data: {
                end_time: pauseTime,
                hours: hours,
            },
        });

        // Create a new entry for the paused session
        // In a real implementation, you'd use a pause/resume mechanism
        // For now, we'll create a new log entry with the accumulated hours

        logger.info(`Time tracking paused for user ${userId}, hours: ${hours}`);

        return updated;
    }

    /**
     * Resume timer
     */
    static async resumeTimer({ organizationId, userId, time_log_id }) {
        // Check if user has an active session
        const activeSession = await prisma.timeLog.findFirst({
            where: {
                user_id: userId,
                organization_id: organizationId,
                end_time: null,
            },
        });

        if (activeSession) {
            throw new Error('You already have an active time tracking session');
        }

        const timeLog = await prisma.timeLog.findFirst({
            where: {
                id: time_log_id,
                user_id: userId,
                organization_id: organizationId,
            },
        });

        if (!timeLog) {
            throw new Error('Time log not found');
        }

        // Create a new session
        const newLog = await prisma.timeLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                task_id: timeLog.task_id,
                project_id: timeLog.project_id,
                date: new Date(),
                hours: 0,
                description: `Resumed tracking on ${timeLog.task?.title || 'task'}`,
                billable: timeLog.billable,
                start_time: new Date(),
                end_time: null,
            },
        });

        logger.info(`Time tracking resumed for user ${userId}`);

        return newLog;
    }

    /**
     * Update time log
     */
    static async updateTimeLog({ organizationId, userId, timeLogId, hours, description, billable }) {
        const timeLog = await prisma.timeLog.findFirst({
            where: {
                id: timeLogId,
                user_id: userId,
                organization_id: organizationId,
            },
        });

        if (!timeLog) {
            throw new Error('Time log not found');
        }

        // If hours changed, update task actual hours
        if (hours !== undefined && timeLog.task_id) {
            const difference = hours - (timeLog.hours || 0);
            if (difference !== 0) {
                await prisma.task.update({
                    where: { id: timeLog.task_id },
                    data: {
                        actual_hours: {
                            increment: difference,
                        },
                    },
                });
            }
        }

        const updated = await prisma.timeLog.update({
            where: { id: timeLogId },
            data: {
                hours: hours !== undefined ? hours : undefined,
                description: description !== undefined ? description : undefined,
                billable: billable !== undefined ? billable : undefined,
            },
        });

        logger.info(`Time log updated for user ${userId}`);

        return updated;
    }

    /**
     * Delete time log
     */
    static async deleteTimeLog({ organizationId, userId, timeLogId }) {
        const timeLog = await prisma.timeLog.findFirst({
            where: {
                id: timeLogId,
                user_id: userId,
                organization_id: organizationId,
            },
        });

        if (!timeLog) {
            throw new Error('Time log not found');
        }

        // Update task actual hours
        if (timeLog.task_id && timeLog.hours) {
            await prisma.task.update({
                where: { id: timeLog.task_id },
                data: {
                    actual_hours: {
                        decrement: timeLog.hours,
                    },
                },
            });
        }

        await prisma.timeLog.delete({
            where: { id: timeLogId },
        });

        logger.info(`Time log deleted for user ${userId}`);

        return true;
    }
}

module.exports = TimeLogService;