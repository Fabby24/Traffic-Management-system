const ProjectService = require('../services/projectService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class ProjectController {
    /**
     * Get all projects
     * GET /api/v1/projects
     */
    async getProjects(req, res) {
        try {
            const {
                page,
                limit,
                search,
                status,
                priority,
                projectType,
                department,
                healthStatus,
                managerId,
                clientId,
                assignedToMe,
                sortBy,
                sortOrder,
                includeArchived,
            } = req.query;

            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const userRole = req.user.role;

            const result = await ProjectService.getProjects({
                organizationId,
                userId,
                userRole,
                page,
                limit,
                search,
                status,
                priority,
                projectType,
                department,
                healthStatus,
                managerId,
                clientId,
                assignedToMe: assignedToMe === 'true',
                sortBy,
                sortOrder,
                includeArchived: includeArchived === 'true',
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get projects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch projects',
                error: error.message,
            });
        }
    }

    /**
     * Get project by ID
     * GET /api/v1/projects/:id
     */
    async getProject(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const projectId = req.params.id;

            const project = await ProjectService.getProject(organizationId, projectId);

            res.json({
                success: true,
                data: { project },
            });
        } catch (error) {
            logger.error('Get project error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Project not found',
            });
        }
    }

    /**
     * Get project statistics
     * GET /api/v1/projects/stats
     */
    async getProjectStats(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const stats = await ProjectService.getProjectStats(organizationId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Get project stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project statistics',
                error: error.message,
            });
        }
    }

    /**
     * Create project
     * POST /api/v1/projects
     */
    async createProject(req, res) {
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

            const project = await ProjectService.createProject(organizationId, userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: { project },
            });
        } catch (error) {
            logger.error('Create project error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create project',
            });
        }
    }

    /**
     * Update project
     * PUT /api/v1/projects/:id
     */
    async updateProject(req, res) {
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
            const projectId = req.params.id;

            const project = await ProjectService.updateProject(
                organizationId,
                userId,
                projectId,
                req.body
            );

            res.json({
                success: true,
                message: 'Project updated successfully',
                data: { project },
            });
        } catch (error) {
            logger.error('Update project error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update project',
            });
        }
    }

    /**
     * Archive project
     * PATCH /api/v1/projects/:id/archive
     */
    async archiveProject(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const projectId = req.params.id;

            await ProjectService.archiveProject(organizationId, userId, projectId);

            res.json({
                success: true,
                message: 'Project archived successfully',
            });
        } catch (error) {
            logger.error('Archive project error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to archive project',
            });
        }
    }

    /**
     * Restore project
     * PATCH /api/v1/projects/:id/restore
     */
    async restoreProject(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const projectId = req.params.id;

            await ProjectService.restoreProject(organizationId, userId, projectId);

            res.json({
                success: true,
                message: 'Project restored successfully',
            });
        } catch (error) {
            logger.error('Restore project error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to restore project',
            });
        }
    }

    /**
     * Delete project (soft delete)
     * DELETE /api/v1/projects/:id
     */
    async deleteProject(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const projectId = req.params.id;

            await ProjectService.deleteProject(organizationId, userId, projectId);

            res.json({
                success: true,
                message: 'Project deleted successfully',
            });
        } catch (error) {
            logger.error('Delete project error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete project',
            });
        }
    }

    /**
     * Bulk archive projects
     * POST /api/v1/projects/bulk-archive
     */
    async bulkArchiveProjects(req, res) {
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
            const { projectIds } = req.body;

            const count = await ProjectService.bulkArchiveProjects(
                organizationId,
                userId,
                projectIds
            );

            res.json({
                success: true,
                message: `${count} projects archived successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk archive error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to archive projects',
            });
        }
    }

    /**
     * Bulk delete projects
     * POST /api/v1/projects/bulk-delete
     */
    async bulkDeleteProjects(req, res) {
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
            const { projectIds } = req.body;

            const count = await ProjectService.bulkDeleteProjects(
                organizationId,
                userId,
                projectIds
            );

            res.json({
                success: true,
                message: `${count} projects deleted successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk delete error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete projects',
            });
        }
    }
}

module.exports = new ProjectController();