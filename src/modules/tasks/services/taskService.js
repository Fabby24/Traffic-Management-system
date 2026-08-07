const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');
const TaskHistoryService = require('./taskHistoryService');
const NotificationService = require('../../notifications/services/notificationService');

const {
    TASK_STATUS,
    TASK_PRIORITY,
    ALLOWED_STATUS_TRANSITIONS,
    TASK_ACTIONS,
} = require('../constants/taskContants');

class TaskService {
    /**
     * Get all tasks with pagination and filters
     */
    static async getTasks({
        organizationId,
        userId,
        userRole,
        projectId = null,
        page = 1,
        limit = 10,
        search = '',
        status = '',
        priority = '',
        assignedTo = '',
        createdBy = '',
        dueDateFrom = null,
        dueDateTo = null,
        sortBy = 'created_at',
        sortOrder = 'desc',
        includeArchived = false,
        assignedToMe = false,
    }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build filter conditions
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (!includeArchived) {
            where.status = { not: TASK_STATUS.ARCHIVED };
        }

        // Team members can only see tasks assigned to them
        if (userRole === 'team_member') {
            where.assigned_to = userId;
        }

        // Filter by project
        if (projectId) {
            where.project_id = projectId;
        }

        // Filter by assigned to me
        if (assignedToMe && userRole !== 'team_member') {
            where.assigned_to = userId;
        }

        // Search
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        // Priority filter
        if (priority) {
            where.priority = priority;
        }

        // Assigned to filter
        if (assignedTo) {
            where.assigned_to = assignedTo;
        }

        // Created by filter
        if (createdBy) {
            where.created_by = createdBy;
        }

        // Due date range
        if (dueDateFrom) {
            where.due_date = { gte: new Date(dueDateFrom) };
        }
        if (dueDateTo) {
            where.due_date = { ...where.due_date, lte: new Date(dueDateTo) };
        }

        // Build sorting
        const orderBy = {};
        if (sortBy === 'assigned_user') {
            orderBy.assigned_user = { first_name: sortOrder };
        } else if (sortBy === 'created_by_user') {
            orderBy.created_by_user = { first_name: sortOrder };
        } else if (sortBy === 'project') {
            orderBy.project = { name: sortOrder };
        } else {
            orderBy[sortBy] = sortOrder;
        }

        // Get total count
        const total = await prisma.task.count({ where });

        // Get tasks
        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        project_code: true,
                        color: true,
                    },
                },
                assigned_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        profile_image: true,
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
                subtasks: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                parent_task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        attachments: true,
                        dependencies: true,
                        dependent_tasks: true,
                    },
                },
            },
            orderBy,
            skip: offset,
            take: limitNum,
        });

        return {
            tasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get task by ID
     */
    static async getTask(organizationId, taskId) {
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                organization_id: organizationId,
                deleted_at: null,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        project_code: true,
                        color: true,
                        organization_id: true,
                    },
                },
                assigned_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        profile_image: true,
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
                parent_task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                subtasks: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        assigned_to: true,
                        due_date: true,
                    },
                },
                history: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                comments: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                profile_image: true,
                            },
                        },
                        replies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        first_name: true,
                                        last_name: true,
                                        profile_image: true,
                                    },
                                },
                            },
                        },
                    },
                },
                attachments: {
                    orderBy: { uploaded_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                dependencies: {
                    include: {
                        depends_on_task: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                },
                dependent_tasks: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        attachments: true,
                        history: true,
                    },
                },
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        return task;
    }

    /**
     * Create task
     */
    static async createTask(organizationId, userId, data) {
        const {
            project_id,
            parent_task_id,
            title,
            description,
            status = TASK_STATUS.TODO,
            priority = TASK_PRIORITY.MEDIUM,
            estimated_hours,
            due_date,
            assigned_to,
        } = data;

        // Validate project exists and user has access
        const project = await prisma.project.findFirst({
            where: {
                id: project_id,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Validate parent task if provided
        if (parent_task_id) {
            const parentTask = await prisma.task.findFirst({
                where: {
                    id: parent_task_id,
                    organization_id: organizationId,
                    project_id: project_id,
                    deleted_at: null,
                },
            });

            if (!parentTask) {
                throw new Error('Parent task not found in this project');
            }
        }

        // Validate assigned user is a project member
        if (assigned_to) {
            const assignedUser = await prisma.user.findFirst({
                where: {
                    id: assigned_to,
                    organization_id: organizationId,
                    deleted_at: null,
                },
            });

            if (!assignedUser) {
                throw new Error('Assigned user does not belong to this organization');
            }

            const member = await prisma.projectMember.findFirst({
                where: {
                    project_id: project_id,
                    user_id: assigned_to,
                },
            });

            if (!member) {
                throw new Error('Assigned user is not a member of this project');
            }
        }

        // Create task
        const task = await prisma.task.create({
            data: {
                organization_id: organizationId,
                project_id,
                parent_task_id: parent_task_id || null,
                title,
                description: description || '',
                status: status || TASK_STATUS.TODO,
                priority: priority || TASK_PRIORITY.MEDIUM,
                estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
                due_date: due_date ? new Date(due_date) : null,
                assigned_to: assigned_to || null,
                created_by: userId,
            },
        });

        // Create task history
        await TaskHistoryService.createHistory({
            task_id: task.id,
            user_id: userId,
            action: TASK_ACTIONS.CREATED,
            to_status: task.status,
            description: `Task "${task.title}" was created`,
        });

        // Send notification if task is assigned
        if (assigned_to) {
            const assignedUser = await prisma.user.findUnique({
                where: { id: assigned_to },
            });
            const createdBy = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (assignedUser && createdBy) {
                await NotificationService.notifyTaskAssigned(task, assignedUser, createdBy);
            }
        }

        // Update project progress
        await this.updateProjectProgress(organizationId, project_id);

        logger.info(`Task created: ${task.title} (${task.id}) by user ${userId}`);

        return this.getTask(organizationId, task.id);
    }

    /**
     * Update task
     */
    static async updateTask(organizationId, userId, taskId, data, userRole) {
        const existing = await this.getTask(organizationId, taskId);

        if (!existing) {
            throw new Error('Task not found');
        }

        // Check permissions
        const isProjectManager = await this.isProjectManager(organizationId, existing.project_id, userId);
        const isAssignedUser = existing.assigned_to === userId;

        // Only project manager or assigned user can update task
        if (!isProjectManager && !isAssignedUser) {
            throw new Error('You do not have permission to update this task');
        }

        // If not project manager, restrict what can be updated
        if (!isProjectManager) {
            const allowedFields = ['title', 'description', 'estimated_hours'];
            const invalidFields = Object.keys(data).filter(
                (key) => !allowedFields.includes(key) && key !== 'status'
            );
            if (invalidFields.length > 0) {
                throw new Error(`You cannot update: ${invalidFields.join(', ')}`);
            }
        }

        // Handle status change
        if (data.status && data.status !== existing.status) {
            await this.validateStatusTransition(existing.status, data.status, userRole, isProjectManager);
        }

        // Update task
        const updateData = {
            title: data.title || existing.title,
            description: data.description !== undefined ? data.description : existing.description,
            priority: data.priority || existing.priority,
            estimated_hours: data.estimated_hours !== undefined ? parseFloat(data.estimated_hours) : existing.estimated_hours,
            due_date: data.due_date ? new Date(data.due_date) : existing.due_date,
            status: data.status || existing.status,
            progress: data.progress !== undefined ? parseInt(data.progress) : existing.progress,
            assigned_to: data.assigned_to || existing.assigned_to,
            feedback: data.feedback !== undefined ? data.feedback : existing.feedback,
            blocked_reason: data.blocked_reason !== undefined ? data.blocked_reason : existing.blocked_reason,
        };

        // Only project manager can assign tasks
        if (data.assigned_to && data.assigned_to !== existing.assigned_to) {
            if (!isProjectManager) {
                throw new Error('Only project managers can reassign tasks');
            }

            // Validate new assignee is a project member
            const assignedUser = await prisma.user.findFirst({
                where: {
                    id: data.assigned_to,
                    organization_id: organizationId,
                    deleted_at: null,
                },
            });

            if (!assignedUser) {
                throw new Error('User does not belong to this organization');
            }

            const member = await prisma.projectMember.findFirst({
                where: {
                    project_id: existing.project_id,
                    user_id: data.assigned_to,
                },
            });

            if (!member) {
                throw new Error('User is not a member of this project');
            }
        }

        const task = await prisma.task.update({
            where: { id: taskId },
            data: updateData,
        });

        // Create task history for status change
        if (data.status && data.status !== existing.status) {
            await TaskHistoryService.createHistory({
                task_id: task.id,
                user_id: userId,
                action: TASK_ACTIONS.STATUS_CHANGED,
                from_status: existing.status,
                to_status: task.status,
                description: `Status changed from ${existing.status} to ${task.status}`,
                metadata: {
                    previous_status: existing.status,
                    new_status: task.status,
                },
            });

            //  Send notification for status change
            const changedBy = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (changedBy) {
                await NotificationService.notifyTaskStatusChanged(
                    task,
                    changedBy,
                    existing.status,
                    data.status
                );
            }
        }

        // Create task history for assignment change
        if (data.assigned_to && data.assigned_to !== existing.assigned_to) {
            const assignedUser = await prisma.user.findUnique({
                where: { id: data.assigned_to },
                select: { first_name: true, last_name: true },
            });

            await TaskHistoryService.createHistory({
                task_id: task.id,
                user_id: userId,
                action: TASK_ACTIONS.ASSIGNED,
                description: `Task assigned to ${assignedUser?.first_name} ${assignedUser?.last_name}`,
                metadata: {
                    assigned_to: data.assigned_to,
                },
            });

            //  Send notification for assignment change
            if (data.assigned_to) {
                const newAssignee = await prisma.user.findUnique({
                    where: { id: data.assigned_to },
                });
                const changedBy = await prisma.user.findUnique({
                    where: { id: userId },
                });
                if (newAssignee && changedBy) {
                    await NotificationService.notifyTaskAssigned(task, newAssignee, changedBy);
                }
            }
        }

        // Update project progress
        await this.updateProjectProgress(organizationId, existing.project_id);

        return this.getTask(organizationId, task.id);
    }

    static async getBoardStats(organizationId, projectId = null) {
    const where = {
        organization_id: organizationId,
        deleted_at: null,
        status: { not: 'archived' },
    };

    if (projectId) {
        where.project_id = projectId;
    }

    // Get tasks grouped by status
    const tasksByStatus = await prisma.task.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    // Get all tasks for the board
    const tasks = await prisma.task.findMany({
        where,
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
            assigned_user: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    profile_image: true,
                },
            },
            created_by_user: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                },
            },
            subtasks: {
                where: { deleted_at: null },
                select: {
                    id: true,
                    status: true,
                },
            },
        },
        orderBy: [
            { priority: 'desc' },
            { due_date: 'asc' },
        ],
    });

    // Get projects for filter
    const projects = await prisma.project.findMany({
        where: {
            organization_id: organizationId,
            deleted_at: null,
        },
        select: {
            id: true,
            name: true,
            color: true,
        },
        orderBy: { name: 'asc' },
    });

    // Get users for filter
    const users = await prisma.user.findMany({
        where: {
            organization_id: organizationId,
            deleted_at: null,
            status: 'active',
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
        },
        orderBy: { first_name: 'asc' },
    });

    return {
        tasks,
        projects,
        users,
        stats: tasksByStatus,
    };
}

    /**
     * Validate status transition
     */
    static async validateStatusTransition(fromStatus, toStatus, userRole, isProjectManager) {
        const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];

        if (!allowed.includes(toStatus)) {
            throw new Error(`Cannot transition from ${fromStatus} to ${toStatus}`);
        }

        // Only project managers can move to/from review statuses
        const reviewStatuses = ['ready_for_review', 'needs_changes', 'completed'];
        if (reviewStatuses.includes(toStatus) || reviewStatuses.includes(fromStatus)) {
            if (!isProjectManager && userRole !== 'org_admin') {
                throw new Error('Only project managers can perform review actions');
            }
        }

        return true;
    }

    /**
     * Check if user is a project manager
     */
    static async isProjectManager(organizationId, projectId, userId) {
        const member = await prisma.projectMember.findFirst({
            where: {
                project_id: projectId,
                user_id: userId,
                role: 'project_manager',
            },
        });

        return !!member;
    }

    /**
     * Update project progress based on tasks
     */
    static async updateProjectProgress(organizationId, projectId) {
        const tasks = await prisma.task.aggregate({
            where: {
                project_id: projectId,
                organization_id: organizationId,
                deleted_at: null,
                status: { not: 'archived' },
            },
            _count: true,
            _sum: {
                estimated_hours: true,
                actual_hours: true,
            },
        });

        const completedTasks = await prisma.task.count({
            where: {
                project_id: projectId,
                organization_id: organizationId,
                deleted_at: null,
                status: 'completed',
            },
        });

        const totalTasks = tasks._count || 0;
        const completed = completedTasks || 0;
        const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        await prisma.project.update({
            where: { id: projectId },
            data: {
                completion_percentage: progress,
                estimated_hours: tasks._sum.estimated_hours || 0,
                actual_hours: tasks._sum.actual_hours || 0,
            },
        });

        return { progress, totalTasks, completed };
    }

    /**
 * Get time logs for a user
 */
static async getTimeLogs(organizationId, userId, { date, from, to, limit = 50 }) {
    const where = {
        organization_id: organizationId,
        user_id: userId,
    };

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

    const timeLogs = await prisma.timeLog.findMany({
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
        },
        orderBy: { date: 'desc' },
        take: limit,
    });

    return timeLogs;
}

/**
 * Start time tracking for a task
 */
static async startTimeTracking(organizationId, userId, taskId) {
    // Check if task exists and belongs to organization
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
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
            task_id: taskId,
            date: new Date(),
            hours: 0,
            description: `Tracking time on ${task.title}`,
            billable: task.billable !== undefined ? task.billable : true,
            start_time: new Date(),
            end_time: null,
        },
    });

    // Create activity log
    await prisma.auditLog.create({
        data: {
            organization_id: organizationId,
            user_id: userId,
            action: 'time_tracking_started',
            entity_type: 'task',
            entity_id: taskId,
            changes: {
                time_log_id: timeLog.id,
            },
        },
    });

    return timeLog;
}

/**
 * Stop time tracking for a task
 */
static async stopTimeTracking(organizationId, userId, taskId) {
    const timeLog = await prisma.timeLog.findFirst({
        where: {
            user_id: userId,
            organization_id: organizationId,
            task_id: taskId,
            end_time: null,
        },
    });

    if (!timeLog) {
        throw new Error('No active time tracking session found for this task');
    }

    const startTime = new Date(timeLog.start_time);
    const endTime = new Date();
    const hours = (endTime - startTime) / (1000 * 60 * 60);

    const updated = await prisma.timeLog.update({
        where: { id: timeLog.id },
        data: {
            end_time: endTime,
            hours: Math.round(hours * 100) / 100,
        },
    });

    // Update task actual hours
    await prisma.task.update({
        where: { id: taskId },
        data: {
            actual_hours: {
                increment: Math.round(hours * 100) / 100,
            },
        },
    });

    await prisma.auditLog.create({
        data: {
            organization_id: organizationId,
            user_id: userId,
            action: 'time_tracking_stopped',
            entity_type: 'task',
            entity_id: taskId,
            changes: {
                time_log_id: timeLog.id,
                hours: Math.round(hours * 100) / 100,
            },
        },
    });

    return updated;
}

/**
 * Pause time tracking
 */
static async pauseTimeTracking(organizationId, userId, taskId) {
    const timeLog = await prisma.timeLog.findFirst({
        where: {
            user_id: userId,
            organization_id: organizationId,
            task_id: taskId,
            end_time: null,
        },
    });

    if (!timeLog) {
        throw new Error('No active time tracking session found for this task');
    }

    const startTime = new Date(timeLog.start_time);
    const pauseTime = new Date();
    const hours = (pauseTime - startTime) / (1000 * 60 * 60);

    const updated = await prisma.timeLog.update({
        where: { id: timeLog.id },
        data: {
            end_time: pauseTime,
            hours: Math.round(hours * 100) / 100,
        },
    });

    // Create a new paused session (or mark as paused)
    // For simplicity, we'll create a new entry with zero hours
    // In a real implementation, you'd have a pause/resume mechanism

    await prisma.auditLog.create({
        data: {
            organization_id: organizationId,
            user_id: userId,
            action: 'time_tracking_paused',
            entity_type: 'task',
            entity_id: taskId,
            changes: {
                time_log_id: timeLog.id,
                paused_at: pauseTime,
            },
        },
    });

    return updated;
}

    /**
     * Delete task (soft delete)
     */
    static async deleteTask(organizationId, userId, taskId) {
        const task = await this.getTask(organizationId, taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user has permission
        const isProjectManager = await this.isProjectManager(organizationId, task.project_id, userId);
        if (!isProjectManager) {
            throw new Error('Only project managers can delete tasks');
        }

        await prisma.task.update({
            where: { id: taskId },
            data: {
                deleted_at: new Date(),
                archived_at: new Date(),
            },
        });

        await TaskHistoryService.createHistory({
            task_id: taskId,
            user_id: userId,
            action: TASK_ACTIONS.DELETED,
            description: `Task "${task.title}" was deleted`,
        });

        await this.updateProjectProgress(organizationId, task.project_id);

        return true;
    }

    /**
     * Archive task
     */
    static async archiveTask(organizationId, userId, taskId) {
        const task = await this.getTask(organizationId, taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Only completed tasks can be archived
        if (task.status !== 'completed') {
            throw new Error('Only completed tasks can be archived');
        }

        const isProjectManager = await this.isProjectManager(organizationId, task.project_id, userId);
        if (!isProjectManager) {
            throw new Error('Only project managers can archive tasks');
        }

        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'archived',
                archived_at: new Date(),
            },
        });

        await TaskHistoryService.createHistory({
            task_id: taskId,
            user_id: userId,
            action: TASK_ACTIONS.ARCHIVED,
            from_status: 'completed',
            to_status: 'archived',
            description: `Task "${task.title}" was archived`,
        });

        await this.updateProjectProgress(organizationId, task.project_id);

        return true;
    }

    /**
     * Get task statistics
     */
    static async getTaskStats(organizationId, projectId = null) {
        const where = {
            organization_id: organizationId,
            deleted_at: null,
            ...(projectId && { project_id: projectId }),
        };

        const [
            total,
            todo,
            inProgress,
            readyForReview,
            needsChanges,
            blocked,
            completed,
            archived,
            overdue,
        ] = await Promise.all([
            prisma.task.count({ where }),
            prisma.task.count({ where: { ...where, status: 'todo' } }),
            prisma.task.count({ where: { ...where, status: 'in_progress' } }),
            prisma.task.count({ where: { ...where, status: 'ready_for_review' } }),
            prisma.task.count({ where: { ...where, status: 'needs_changes' } }),
            prisma.task.count({ where: { ...where, status: 'blocked' } }),
            prisma.task.count({ where: { ...where, status: 'completed' } }),
            prisma.task.count({ where: { ...where, status: 'archived' } }),
            prisma.task.count({
                where: {
                    ...where,
                    due_date: { lt: new Date() },
                    status: { notIn: ['completed', 'archived'] },
                },
            }),
        ]);

        return {
            total,
            todo,
            inProgress,
            readyForReview,
            needsChanges,
            blocked,
            completed,
            archived,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }
}

module.exports = TaskService;