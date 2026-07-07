const Client = require('../models/Clientmodel');
const { validationResult } = require('express-validator');

class ClientController {
    // Get all clients with pagination and filters
    // GET /api/v1/clients
    async getAllClients(req, res) {
        try {
            const { page, limit, search, status, industry, priority, assigned_to } = req.query;
            
            const result = await Client.findAll({
                page,
                limit,
                search,
                status,
                industry,
                priority,
                assigned_to
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch clients',
                error: error.message
            });
        }
    }

    //Get client by ID
    //GET /api/v1/clients/:id
    async getClientById(req, res) {
        try {
            const client = await Client.findById(req.params.id);
            
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                data: { client }
            });
        } catch (error) {
            console.error('Error fetching client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client',
                error: error.message
            });
        }
    }

    //Create new client
    //POST /api/v1/clients
    async createClient(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const data = req.body;
            data.created_by = req.user.id;

            // Check if email already exists
            const exists = await Client.emailExists(data.email);
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'A client with this email already exists'
                });
            }

            const clientId = await Client.create(data);
            const client = await Client.findById(clientId);

            res.status(201).json({
                success: true,
                message: 'Client created successfully',
                data: { client }
            });
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create client',
                error: error.message
            });
        }
    }

    //Update client
    //PUT /api/v1/clients/:id
    async updateClient(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const clientId = req.params.id;

            // Check if client exists
            const existingClient = await Client.findById(clientId);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Check if email already exists (excluding current client)
            const emailExists = await Client.emailExists(req.body.email, clientId);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'A client with this email already exists'
                });
            }

            const updated = await Client.update(clientId, req.body);
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update client'
                });
            }

            const client = await Client.findById(clientId);

            res.json({
                success: true,
                message: 'Client updated successfully',
                data: { client }
            });
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update client',
                error: error.message
            });
        }
    }

    //Update client status
    //PATCH /api/v1/clients/:id/status
    async updateClientStatus(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { status } = req.body;
            const clientId = req.params.id;

            // Check if client exists
            const existingClient = await Client.findById(clientId);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const updated = await Client.updateStatus(clientId, status);
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update client status'
                });
            }

            const client = await Client.findById(clientId);

            res.json({
                success: true,
                message: `Client ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { client }
            });
        } catch (error) {
            console.error('Error updating client status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update client status',
                error: error.message
            });
        }
    }

    //Archive client (soft delete)
    //DELETE /api/v1/clients/:id
    async archiveClient(req, res) {
        try {
            const clientId = req.params.id;

            // Check if client exists
            const existingClient = await Client.findById(clientId);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const archived = await Client.archive(clientId);
            if (!archived) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to archive client'
                });
            }

            res.json({
                success: true,
                message: 'Client archived successfully'
            });
        } catch (error) {
            console.error('Error archiving client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive client',
                error: error.message
            });
        }
    }

    // Restore archived client
    //POST /api/v1/clients/:id/restore
    async restoreClient(req, res) {
        try {
            const clientId = req.params.id;

            const restored = await Client.restore(clientId);
            if (!restored) {
                return res.status(400).json({
                    success: false,
                    message: 'Client not found or already restored'
                });
            }

            const client = await Client.findById(clientId);

            res.json({
                success: true,
                message: 'Client restored successfully',
                data: { client }
            });
        } catch (error) {
            console.error('Error restoring client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restore client',
                error: error.message
            });
        }
    }

    //Permanently delete client
    //DELETE /api/v1/clients/:id/permanent
    async deleteClient(req, res) {
        try {
            const clientId = req.params.id;

            // Check if client exists
            const existingClient = await Client.findById(clientId);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const deleted = await Client.delete(clientId);
            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to delete client'
                });
            }

            res.json({
                success: true,
                message: 'Client deleted permanently'
            });
        } catch (error) {
            console.error('Error deleting client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete client',
                error: error.message
            });
        }
    }

    //Get client statistics
    //GET /api/v1/clients/stats
    async getClientStats(req, res) {
        try {
            const stats = await Client.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error fetching client stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client statistics',
                error: error.message
            });
        }
    }

    //Bulk status update
    //POST /api/v1/clients/bulk-status
    async bulkStatusUpdate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { ids, status } = req.body;
            
            const updated = await Client.bulkStatusUpdate(ids, status);

            res.json({
                success: true,
                message: `${updated} clients ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { updatedCount: updated }
            });
        } catch (error) {
            console.error('Error in bulk status update:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update clients',
                error: error.message
            });
        }
    }

    // Bulk archive
    //POST /api/v1/clients/bulk-archive
    async bulkArchive(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { ids } = req.body;
            
            const archived = await Client.bulkArchive(ids);

            res.json({
                success: true,
                message: `${archived} clients archived successfully`,
                data: { archivedCount: archived }
            });
        } catch (error) {
            console.error('Error in bulk archive:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive clients',
                error: error.message
            });
        }
    }

    //Bulk delete (permanent)
    //POST /api/v1/clients/bulk-delete
    async bulkDelete(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { ids } = req.body;
            
            const deleted = await Client.bulkDelete(ids);

            res.json({
                success: true,
                message: `${deleted} clients deleted permanently`,
                data: { deletedCount: deleted }
            });
        } catch (error) {
            console.error('Error in bulk delete:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete clients',
                error: error.message
            });
        }
    }
}

module.exports = new ClientController();