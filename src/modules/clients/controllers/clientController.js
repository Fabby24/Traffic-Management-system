const ClientService = require('../services/clientService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class ClientController {
    /**
     * Get all clients
     * GET /api/v1/clients
     */
    async getClients(req, res) {
        try {
            const {
                page,
                limit,
                search,
                status,
                industry,
                priority,
                assignedTo,
                sortBy,
                sortOrder,
            } = req.query;

            const organizationId = req.user.organization_id;

            const result = await ClientService.getClients({
                organizationId,
                page,
                limit,
                search,
                status,
                industry,
                priority,
                assignedTo,
                sortBy,
                sortOrder,
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get clients error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch clients',
                error: error.message,
            });
        }
    }

    /**
     * Get client by ID
     * GET /api/v1/clients/:id
     */
    async getClient(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const clientId = req.params.id;

            const client = await ClientService.getClient(organizationId, clientId);

            res.json({
                success: true,
                data: { client },
            });
        } catch (error) {
            logger.error('Get client error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Client not found',
            });
        }
    }

    /**
     * Get client statistics
     * GET /api/v1/clients/stats
     */
    async getClientStats(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const stats = await ClientService.getClientStats(organizationId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Get client stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client statistics',
                error: error.message,
            });
        }
    }

    /**
     * Create client
     * POST /api/v1/clients
     */
    async createClient(req, res) {
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

            const client = await ClientService.createClient(organizationId, userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Client created successfully',
                data: { client },
            });
        } catch (error) {
            logger.error('Create client error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create client',
            });
        }
    }

    /**
     * Update client
     * PUT /api/v1/clients/:id
     */
    async updateClient(req, res) {
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
            const clientId = req.params.id;

            const client = await ClientService.updateClient(
                organizationId,
                userId,
                clientId,
                req.body
            );

            res.json({
                success: true,
                message: 'Client updated successfully',
                data: { client },
            });
        } catch (error) {
            logger.error('Update client error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update client',
            });
        }
    }

    /**
     * Update client status
     * PATCH /api/v1/clients/:id/status
     */
    async updateClientStatus(req, res) {
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
            const clientId = req.params.id;
            const { status } = req.body;

            const client = await ClientService.updateClientStatus(
                organizationId,
                userId,
                clientId,
                status
            );

            res.json({
                success: true,
                message: `Client ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { client },
            });
        } catch (error) {
            logger.error('Update client status error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update client status',
            });
        }
    }

    /**
     * Archive client
     * DELETE /api/v1/clients/:id
     */
    async archiveClient(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const clientId = req.params.id;

            await ClientService.archiveClient(organizationId, userId, clientId);

            res.json({
                success: true,
                message: 'Client archived successfully',
            });
        } catch (error) {
            logger.error('Archive client error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to archive client',
            });
        }
    }

    /**
     * Restore archived client
     * POST /api/v1/clients/:id/restore
     */
    async restoreClient(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const clientId = req.params.id;

            const client = await ClientService.restoreClient(organizationId, userId, clientId);

            res.json({
                success: true,
                message: 'Client restored successfully',
                data: { client },
            });
        } catch (error) {
            logger.error('Restore client error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to restore client',
            });
        }
    }

    /**
     * Permanently delete client
     * DELETE /api/v1/clients/:id/permanent
     */
    async deleteClient(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const clientId = req.params.id;

            await ClientService.deleteClient(organizationId, userId, clientId);

            res.json({
                success: true,
                message: 'Client deleted permanently',
            });
        } catch (error) {
            logger.error('Delete client error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete client',
            });
        }
    }

    /**
     * Bulk status update
     * POST /api/v1/clients/bulk-status
     */
    async bulkStatusUpdate(req, res) {
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
            const { clientIds, status } = req.body;

            const count = await ClientService.bulkStatusUpdate(
                organizationId,
                userId,
                clientIds,
                status
            );

            res.json({
                success: true,
                message: `${count} clients ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk status update error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update clients',
            });
        }
    }

    /**
     * Bulk archive clients
     * POST /api/v1/clients/bulk-archive
     */
    async bulkArchive(req, res) {
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
            const { clientIds } = req.body;

            const count = await ClientService.bulkArchive(
                organizationId,
                userId,
                clientIds
            );

            res.json({
                success: true,
                message: `${count} clients archived successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk archive error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to archive clients',
            });
        }
    }

    /**
     * Bulk delete clients
     * POST /api/v1/clients/bulk-delete
     */
    async bulkDelete(req, res) {
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
            const { clientIds } = req.body;

            const count = await ClientService.bulkDelete(
                organizationId,
                userId,
                clientIds
            );

            res.json({
                success: true,
                message: `${count} clients deleted permanently`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk delete error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete clients',
            });
        }
    }
}

module.exports = new ClientController();