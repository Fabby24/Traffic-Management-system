const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class NotificationService {
    /**
     * Create a notification
     */
    static async createNotification({
        organization_id,
        user_id,
        type = 'info',
        title,
        message,
        channel = 'in_app',
        link = null,
    }) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    organization_id,
                    user_id,
                    type,
                    title,
                    message,
                    channel,
                    link,
                    created_at: new Date(),
                },
            });

            logger.info(`Notification created for user ${user_id}: ${title}`);
            return notification;
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create task assignment notification
     */
    static async notifyTaskAssigned(task, assignedTo, assignedBy) {
        const title = 'Task Assigned';
        const message = `${assignedBy.first_name} ${assignedBy.last_name} assigned "${task.title}" to you`;
        const link = `/tasks/${task.id}`;

        return this.createNotification({
            organization_id: task.organization_id,
            user_id: assignedTo.id,
            type: 'info',
            title,
            message,
            channel: 'both',
            link,
        });
    }

    /**
     * Create task status change notification
     */
    static async notifyTaskStatusChanged(task, changedBy, oldStatus, newStatus) {
        const title = 'Task Status Updated';
        const message = `${changedBy.first_name} ${changedBy.last_name} changed "${task.title}" from ${oldStatus} to ${newStatus}`;
        const link = `/tasks/${task.id}`;

        // Notify assignee if not the one who changed it
        if (task.assigned_to && task.assigned_to !== changedBy.id) {
            await this.createNotification({
                organization_id: task.organization_id,
                user_id: task.assigned_to,
                type: 'info',
                title,
                message,
                channel: 'in_app',
                link,
            });
        }

        // Notify project manager if task is ready for review
        if (newStatus === 'ready_for_review') {
            const projectManagers = await prisma.projectMember.findMany({
                where: {
                    project_id: task.project_id,
                    role: 'project_manager',
                    invitation_status: 'accepted',
                },
                include: {
                    user: true,
                },
            });

            for (const pm of projectManagers) {
                if (pm.user_id !== changedBy.id) {
                    await this.createNotification({
                        organization_id: task.organization_id,
                        user_id: pm.user_id,
                        type: 'warning',
                        title: 'Task Ready for Review',
                        message: `${changedBy.first_name} ${changedBy.last_name} marked "${task.title}" as ready for review`,
                        channel: 'both',
                        link: `/tasks/${task.id}`,
                    });
                }
            }
        }

        // Notify assignee when task is reviewed
        if (newStatus === 'completed' || newStatus === 'needs_changes') {
            if (task.assigned_to && task.assigned_to !== changedBy.id) {
                const statusMessage = newStatus === 'completed' ? 'approved' : 'requested changes on';
                await this.createNotification({
                    organization_id: task.organization_id,
                    user_id: task.assigned_to,
                    type: newStatus === 'completed' ? 'success' : 'warning',
                    title: `Task ${newStatus === 'completed' ? 'Approved' : 'Changes Requested'}`,
                    message: `${changedBy.first_name} ${changedBy.last_name} ${statusMessage} "${task.title}"`,
                    channel: 'both',
                    link: `/tasks/${task.id}`,
                });
            }
        }
    }

    /**
     * Create task comment notification
     */
    static async notifyTaskCommented(task, comment, commenter) {
        // Notify assignee if not the commenter
        if (task.assigned_to && task.assigned_to !== commenter.id) {
            await this.createNotification({
                organization_id: task.organization_id,
                user_id: task.assigned_to,
                type: 'info',
                title: 'New Comment',
                message: `${commenter.first_name} ${commenter.last_name} commented on "${task.title}"`,
                channel: 'in_app',
                link: `/tasks/${task.id}`,
            });
        }

        // Notify project manager
        const projectManagers = await prisma.projectMember.findMany({
            where: {
                project_id: task.project_id,
                role: 'project_manager',
                invitation_status: 'accepted',
            },
            include: {
                user: true,
            },
        });

        for (const pm of projectManagers) {
            if (pm.user_id !== commenter.id && pm.user_id !== task.assigned_to) {
                await this.createNotification({
                    organization_id: task.organization_id,
                    user_id: pm.user_id,
                    type: 'info',
                    title: 'New Comment',
                    message: `${commenter.first_name} ${commenter.last_name} commented on "${task.title}"`,
                    channel: 'in_app',
                    link: `/tasks/${task.id}`,
                });
            }
        }
    }

    /**
     * Create project assignment notification
     */
    static async notifyProjectAssigned(project, assignedTo, assignedBy) {
        const title = 'Project Assigned';
        const message = `${assignedBy.first_name} ${assignedBy.last_name} assigned you to "${project.name}"`;
        const link = `/projects/${project.id}`;

        return this.createNotification({
            organization_id: project.organization_id,
            user_id: assignedTo.id,
            type: 'info',
            title,
            message,
            channel: 'both',
            link,
        });
    }

    /**
     * Get notifications for a user
     */
    static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const where = {
            user_id: userId,
            ...(unreadOnly && { read_at: null }),
        };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limitNum,
            }),
            prisma.notification.count({ where }),
        ]);

        return {
            notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
            unreadCount: await this.getUnreadCount(userId),
        };
    }

    /**
     * Get unread count
     */
    static async getUnreadCount(userId) {
        return prisma.notification.count({
            where: {
                user_id: userId,
                read_at: null,
            },
        });
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                user_id: userId,
            },
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return prisma.notification.update({
            where: { id: notificationId },
            data: { read_at: new Date() },
        });
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: {
                user_id: userId,
                read_at: null,
            },
            data: { read_at: new Date() },
        });
    }

    /**
     * Delete notification
     */
    static async deleteNotification(notificationId, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                user_id: userId,
            },
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return prisma.notification.delete({
            where: { id: notificationId },
        });
    }
}

module.exports = NotificationService;