const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class TaskHistoryService {
    /**
     * Create task history entry
     */
    static async createHistory({
        task_id,
        user_id,
        action,
        from_status = null,
        to_status = null,
        description = '',
        metadata = {},
    }) {
        try {
            const history = await prisma.taskHistory.create({
                data: {
                    task_id,
                    user_id,
                    action,
                    from_status,
                    to_status,
                    description,
                    metadata,
                },
            });

            logger.debug(`Task history created: ${action} for task ${task_id}`);
            return history;
        } catch (error) {
            logger.error('Error creating task history:', error);
            throw error;
        }
    }

    /**
     * Get task history
     */
    static async getTaskHistory(taskId, limit = 50) {
        const history = await prisma.taskHistory.findMany({
            where: { task_id: taskId },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        return history;
    }

    /**
     * Get user activity
     */
    static async getUserActivity(userId, limit = 20) {
        const activity = await prisma.taskHistory.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        project_id: true,
                    },
                },
            },
        });

        return activity;
    }

    /**
     * Get project activity
     */
    static async getProjectActivity(projectId, limit = 50) {
        const activity = await prisma.taskHistory.findMany({
            where: {
                task: {
                    project_id: projectId,
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
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
                    },
                },
            },
        });

        return activity;
    }
}

module.exports = TaskHistoryService;