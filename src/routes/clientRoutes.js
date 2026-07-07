const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const clientValidators = require('../validators/clientValidator');

// All routes require authentication and admin role
router.use(auth);
router.use(role('admin'));

// Get client statistics
router.get('/stats', ClientController.getClientStats);

// Get all clients with pagination and filters
router.get(
    '/',
    clientValidators.getAllClients,
    ClientController.getAllClients
);

// Get single client
router.get(
    '/:id',
    clientValidators.getById,
    ClientController.getClientById
);

// Create new client
router.post(
    '/',
    clientValidators.createClient,
    ClientController.createClient
);

// Update client
router.put(
    '/:id',
    clientValidators.updateClient,
    ClientController.updateClient
);

// Update client status
router.patch(
    '/:id/status',
    clientValidators.updateStatus,
    ClientController.updateClientStatus
);

// Archive client (soft delete)
router.delete(
    '/:id',
    clientValidators.deleteClient,
    ClientController.archiveClient
);

// Restore archived client
router.post(
    '/:id/restore',
    clientValidators.getById,
    ClientController.restoreClient
);

// Permanently delete client
router.delete(
    '/:id/permanent',
    clientValidators.deleteClient,
    ClientController.deleteClient
);

// Bulk actions
router.post(
    '/bulk-status',
    clientValidators.bulkAction,
    ClientController.bulkStatusUpdate
);

router.post(
    '/bulk-archive',
    clientValidators.bulkAction,
    ClientController.bulkArchive
);

router.post(
    '/bulk-delete',
    clientValidators.bulkAction,
    ClientController.bulkDelete
);

module.exports = router;