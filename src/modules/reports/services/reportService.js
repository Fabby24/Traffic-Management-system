const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class ReportService {
    /**
     * Get project performance report
     */
    static async getProjectReport(organizationId, { startDate, endDate, status, projectId }) {
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (startDate) {
            where.created_at = { gte: new Date(startDate) };
        }
        if (endDate) {
            where.created_at = { ...where.created_at, lte: new Date(endDate) };
        }
        if (status) {
            where.lifecycle_status = status;
        }
        if (projectId) {
            where.id = projectId;
        }

        // Get projects with task stats
        const projects = await prisma.project.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                },
                tasks: {
                    where: {
                        deleted_at: null,
                        status: { not: 'archived' },
                    },
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        estimated_hours: true,
                        actual_hours: true,
                        created_at: true,
                        due_date: true,
                        assigned_to: true,
                    },
                },
                _count: {
                    select: {
                        tasks: {
                            where: {
                                deleted_at: null,
                                status: { not: 'archived' },
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Process project data
        const reportData = projects.map(project => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
            const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress').length;
            const blockedTasks = project.tasks.filter(t => t.status === 'blocked').length;
            const todoTasks = project.tasks.filter(t => t.status === 'todo').length;
            const readyForReview = project.tasks.filter(t => t.status === 'ready_for_review').length;

            const totalEstimatedHours = project.tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
            const totalActualHours = project.tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Overdue tasks
            const now = new Date();
            const overdueTasks = project.tasks.filter(
                t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed' && t.status !== 'archived'
            );

            return {
                id: project.id,
                name: project.name,
                project_code: project.project_code,
                status: project.lifecycle_status,
                client: project.client,
                totalTasks,
                completedTasks,
                inProgressTasks,
                blockedTasks,
                todoTasks,
                readyForReview,
                overdueTasks: overdueTasks.length,
                totalEstimatedHours,
                totalActualHours,
                progress,
                budget: project.budget,
                created_at: project.created_at,
                due_date: project.due_date,
                completion_percentage: project.completion_percentage,
            };
        });

        // Summary stats
        const summary = {
            totalProjects: reportData.length,
            totalTasks: reportData.reduce((sum, p) => sum + p.totalTasks, 0),
            completedTasks: reportData.reduce((sum, p) => sum + p.completedTasks, 0),
            avgProgress: reportData.length > 0 ? Math.round(reportData.reduce((sum, p) => sum + p.progress, 0) / reportData.length) : 0,
            totalBudget: reportData.reduce((sum, p) => sum + (p.budget || 0), 0),
            totalEstimatedHours: reportData.reduce((sum, p) => sum + p.totalEstimatedHours, 0),
            totalActualHours: reportData.reduce((sum, p) => sum + p.totalActualHours, 0),
            overdueTasks: reportData.reduce((sum, p) => sum + p.overdueTasks, 0),
        };

        return {
            projects: reportData,
            summary,
        };
    }

    /**
     * Get task report
     */
    static async getTaskReport(organizationId, { startDate, endDate, status, priority, assignedTo, projectId }) {
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (startDate) {
            where.created_at = { gte: new Date(startDate) };
        }
        if (endDate) {
            where.created_at = { ...where.created_at, lte: new Date(endDate) };
        }
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        if (assignedTo) {
            where.assigned_to = assignedTo;
        }
        if (projectId) {
            where.project_id = projectId;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        project_code: true,
                    },
                },
                assigned_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                created_by_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                reviewed_by_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Process task data
        const reportData = tasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            project: task.project,
            assigned_to: task.assigned_user,
            created_by: task.created_by_user,
            reviewed_by: task.reviewed_by_user,
            estimated_hours: task.estimated_hours,
            actual_hours: task.actual_hours,
            created_at: task.created_at,
            due_date: task.due_date,
            feedback: task.feedback,
        }));

        // Summary stats
        const summary = {
            totalTasks: reportData.length,
            byStatus: {},
            byPriority: {},
            totalEstimatedHours: reportData.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
            totalActualHours: reportData.reduce((sum, t) => sum + (t.actual_hours || 0), 0),
            overdueTasks: reportData.filter(
                t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
            ).length,
        };

        // Group by status
        reportData.forEach(task => {
            summary.byStatus[task.status] = (summary.byStatus[task.status] || 0) + 1;
        });

        // Group by priority
        reportData.forEach(task => {
            summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + 1;
        });

        return {
            tasks: reportData,
            summary,
        };
    }

    /**
     * Get time report
     */
    static async getTimeReport(organizationId, { startDate, endDate, userId, projectId, taskId }) {
        const where = {
            organization_id: organizationId,
        };

        if (startDate) {
            where.date = { gte: new Date(startDate) };
        }
        if (endDate) {
            where.date = { ...where.date, lte: new Date(endDate) };
        }
        if (userId) {
            where.user_id = userId;
        }
        if (projectId) {
            where.project_id = projectId;
        }
        if (taskId) {
            where.task_id = taskId;
        }

        const timeLogs = await prisma.timeLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
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
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        // Process time data
        const reportData = timeLogs.map(log => ({
            id: log.id,
            date: log.date,
            hours: log.hours,
            description: log.description,
            billable: log.billable,
            user: log.user,
            task: log.task,
            project: log.project,
        }));

        // Summary stats
        const summary = {
            totalHours: reportData.reduce((sum, t) => sum + t.hours, 0),
            billableHours: reportData.filter(t => t.billable).reduce((sum, t) => sum + t.hours, 0),
            nonBillableHours: reportData.filter(t => !t.billable).reduce((sum, t) => sum + t.hours, 0),
            byUser: {},
            byProject: {},
            byDay: {},
        };

        // Group by user
        reportData.forEach(log => {
            const key = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown';
            summary.byUser[key] = (summary.byUser[key] || 0) + log.hours;
        });

        // Group by project
        reportData.forEach(log => {
            const key = log.project?.name || 'No Project';
            summary.byProject[key] = (summary.byProject[key] || 0) + log.hours;
        });

        // Group by day
        reportData.forEach(log => {
            const key = log.date ? new Date(log.date).toISOString().split('T')[0] : 'Unknown';
            summary.byDay[key] = (summary.byDay[key] || 0) + log.hours;
        });

        return {
            timeLogs: reportData,
            summary,
        };
    }

    /**
     * Get client report
     */
    static async getClientReport(organizationId, { startDate, endDate, status }) {
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (startDate) {
            where.created_at = { gte: new Date(startDate) };
        }
        if (endDate) {
            where.created_at = { ...where.created_at, lte: new Date(endDate) };
        }
        if (status) {
            where.status = status;
        }

        const clients = await prisma.client.findMany({
            where,
            include: {
                projects: {
                    where: {
                        deleted_at: null,
                    },
                    include: {
                        tasks: {
                            where: {
                                deleted_at: null,
                                status: { not: 'archived' },
                            },
                            select: {
                                id: true,
                                status: true,
                                estimated_hours: true,
                                actual_hours: true,
                            },
                        },
                        _count: {
                            select: {
                                tasks: {
                                    where: {
                                        deleted_at: null,
                                        status: { not: 'archived' },
                                    },
                                },
                            },
                        },
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Process client data
        const reportData = clients.map(client => {
            const totalProjects = client.projects.length;
            const activeProjects = client.projects.filter(p => p.lifecycle_status === 'active').length;
            const completedProjects = client.projects.filter(p => p.lifecycle_status === 'completed').length;
            
            const totalTasks = client.projects.reduce((sum, p) => sum + p.tasks.length, 0);
            const completedTasks = client.projects.reduce(
                (sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length, 0
            );
            
            const totalEstimatedHours = client.projects.reduce(
                (sum, p) => sum + p.tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0), 0
            );
            const totalActualHours = client.projects.reduce(
                (sum, p) => sum + p.tasks.reduce((s, t) => s + (t.actual_hours || 0), 0), 0
            );

            return {
                id: client.id,
                name: client.name,
                company: client.company,
                email: client.email,
                status: client.status,
                assignee: client.assignee,
                totalProjects,
                activeProjects,
                completedProjects,
                totalTasks,
                completedTasks,
                totalEstimatedHours,
                totalActualHours,
                created_at: client.created_at,
                projects: client.projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.lifecycle_status,
                    tasks: p.tasks.length,
                    progress: p.completion_percentage,
                })),
            };
        });

        // Summary stats
        const summary = {
            totalClients: reportData.length,
            activeClients: reportData.filter(c => c.status === 'active').length,
            totalProjects: reportData.reduce((sum, c) => sum + c.totalProjects, 0),
            totalTasks: reportData.reduce((sum, c) => sum + c.totalTasks, 0),
            completedTasks: reportData.reduce((sum, c) => sum + c.completedTasks, 0),
            totalEstimatedHours: reportData.reduce((sum, c) => sum + c.totalEstimatedHours, 0),
            totalActualHours: reportData.reduce((sum, c) => sum + c.totalActualHours, 0),
        };

        return {
            clients: reportData,
            summary,
        };
    }

    /**
     * Get dashboard analytics
     */
    static async getDashboardAnalytics(organizationId) {
        // Get project stats
        const projectStats = await prisma.project.groupBy({
            by: ['lifecycle_status'],
            where: {
                organization_id: organizationId,
                deleted_at: null,
            },
            _count: true,
        });

        // Get task stats
        const taskStats = await prisma.task.groupBy({
            by: ['status'],
            where: {
                organization_id: organizationId,
                deleted_at: null,
            },
            _count: true,
        });

        // Get priority stats
        const priorityStats = await prisma.task.groupBy({
            by: ['priority'],
            where: {
                organization_id: organizationId,
                deleted_at: null,
                status: { notIn: ['completed', 'archived'] },
            },
            _count: true,
        });

        // Get monthly creation stats (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyProjects = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as count
            FROM projects
            WHERE organization_id = ${organizationId}
                AND deleted_at IS NULL
                AND created_at >= ${sixMonthsAgo}
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month ASC
        `;

        // Get team workload
        const teamWorkload = await prisma.task.groupBy({
            by: ['assigned_to'],
            where: {
                organization_id: organizationId,
                deleted_at: null,
                status: { notIn: ['completed', 'archived'] },
            },
            _count: true,
        });

        const userIds = teamWorkload.map(tw => tw.assigned_to).filter(id => id !== null);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
            },
        });

        const workloadData = teamWorkload.map(tw => {
            const user = users.find(u => u.id === tw.assigned_to);
            return {
                user_id: tw.assigned_to,
                first_name: user?.first_name || 'Unknown',
                last_name: user?.last_name || '',
                task_count: tw._count,
            };
        });

        return {
            projectStats,
            taskStats,
            priorityStats,
            monthlyProjects: monthlyProjects.map(item => ({
                month: item.month,
                count: Number(item.count),
            })),
            teamWorkload: workloadData,
        };
    }
}

module.exports = ReportService;