const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validation');
const {
    createClientValidator,
    updateClientValidator,
    updateStatusValidator,
    bulkActionValidator,
} = require('../validators/clientValidator');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Client statistics (accessible by all authenticated users)
router.get('/stats', ClientController.getClientStats);

// Client CRUD operations
router.get('/', ClientController.getClients);
router.get('/:id', ClientController.getClient);

// Create client (Organization Admin only)
router.post(
    '/',
    rbacMiddleware(['clients:write']),
    validate(createClientValidator),
    ClientController.createClient
);

// Update client (Organization Admin only)
router.put(
    '/:id',
    rbacMiddleware(['clients:write']),
    validate(updateClientValidator),
    ClientController.updateClient
);

// Update client status (Organization Admin only)
router.patch(
    '/:id/status',
    rbacMiddleware(['clients:write']),
    validate(updateStatusValidator),
    ClientController.updateClientStatus
);

// Archive client (Organization Admin only)
router.delete(
    '/:id',
    rbacMiddleware(['clients:write']),
    ClientController.archiveClient
);

// Restore archived client (Organization Admin only)
router.post(
    '/:id/restore',
    rbacMiddleware(['clients:write']),
    ClientController.restoreClient
);

// Permanently delete client (Organization Admin only)
router.delete(
    '/:id/permanent',
    rbacMiddleware(['clients:delete']),
    ClientController.deleteClient
);

// Bulk actions (Organization Admin only)
router.post(
    '/bulk-status',
    rbacMiddleware(['clients:write']),
    validate(bulkActionValidator),
    ClientController.bulkStatusUpdate
);

router.post(
    '/bulk-archive',
    rbacMiddleware(['clients:write']),
    validate(bulkActionValidator),
    ClientController.bulkArchive
);

router.post(
    '/bulk-delete',
    rbacMiddleware(['clients:delete']),
    validate(bulkActionValidator),
    ClientController.bulkDelete
);

module.exports = router;