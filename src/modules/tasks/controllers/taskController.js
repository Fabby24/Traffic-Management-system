const TaskService = require('../services/taskService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class TaskController {
    /**
     * Get all tasks
     * GET /api/v1/tasks
     */
    async getTasks(req, res) {
        try {
            const {
                projectId,
                page,
                limit,
                search,
                status,
                priority,
                assignedTo,
                createdBy,
                dueDateFrom,
                dueDateTo,
                sortBy,
                sortOrder,
                includeArchived,
                assignedToMe,
            } = req.query;

            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const userRole = req.user.role;

            const result = await TaskService.getTasks({
                organizationId,
                userId,
                userRole,
                projectId,
                page,
                limit,
                search,
                status,
                priority,
                assignedTo,
                createdBy,
                dueDateFrom,
                dueDateTo,
                sortBy,
                sortOrder,
                includeArchived: includeArchived === 'true',
                assignedToMe: assignedToMe === 'true',
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get tasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tasks',
                error: error.message,
            });
        }
    }

    /**
     * Get task by ID
     * GET /api/v1/tasks/:id
     */
    async getTask(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const taskId = req.params.id;

            const task = await TaskService.getTask(organizationId, taskId);

            res.json({
                success: true,
                data: { task },
            });
        } catch (error) {
            logger.error('Get task error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Task not found',
            });
        }
    }

    /**
     * Get task statistics
     * GET /api/v1/tasks/stats
     */
    async getTaskStats(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { projectId } = req.query;

            const stats = await TaskService.getTaskStats(organizationId, projectId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Get task stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task statistics',
                error: error.message,
            });
        }
    }

    /**
     * Create task
     * POST /api/v1/tasks
     */
    async createTask(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;

            const task = await TaskService.createTask(organizationId, userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: { task },
            });
        } catch (error) {
            logger.error('Create task error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create task',
            });
        }
    }

    /**
     * Update task
     * PUT /api/v1/tasks/:id
     */
    async updateTask(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const userRole = req.user.role;
            const taskId = req.params.id;

            const task = await TaskService.updateTask(
                organizationId,
                userId,
                taskId,
                req.body,
                userRole
            );

            res.json({
                success: true,
                message: 'Task updated successfully',
                data: { task },
            });
        } catch (error) {
            logger.error('Update task error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update task',
            });
        }
    }

    /**
     * Delete task
     * DELETE /api/v1/tasks/:id
     */
    async deleteTask(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const taskId = req.params.id;

            await TaskService.deleteTask(organizationId, userId, taskId);

            res.json({
                success: true,
                message: 'Task deleted successfully',
            });
        } catch (error) {
            logger.error('Delete task error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete task',
            });
        }
    }

    /**
     * Archive task
     * PATCH /api/v1/tasks/:id/archive
     */
    async archiveTask(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const taskId = req.params.id;

            await TaskService.archiveTask(organizationId, userId, taskId);

            res.json({
                success: true,
                message: 'Task archived successfully',
            });
        } catch (error) {
            logger.error('Archive task error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to archive task',
            });
        }
    }
    async getBoardStats(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { projectId } = req.query;

            const stats = await TaskService.getBoardStats(organizationId, projectId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Get board stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch board stats',
                error: error.message,
            });
        }
    }
}

module.exports = new TaskController();