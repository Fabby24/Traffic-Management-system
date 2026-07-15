const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validation');
const {
    inviteUserValidator,
    acceptInviteValidator,
    updateUserValidator,
    updateStatusValidator,
    bulkActionValidator,
} = require('../validators/userValidator');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Organization Admin only routes
router.use(rbacMiddleware(['users:read', 'users:write']));

// Get all users
router.get('/', UserController.getUsers);

// Get single user
router.get('/:id', UserController.getUser);

// Invite team member
router.post('/invite', validate(inviteUserValidator), UserController.inviteUser);

// Accept invitation (public - no auth required)
router.post('/accept-invite', validate(acceptInviteValidator), UserController.acceptInvitation);

// Update user
router.put('/:id', validate(updateUserValidator), UserController.updateUser);

// Update user status
router.patch('/:id/status', validate(updateStatusValidator), UserController.updateUserStatus);

// Delete user
router.delete('/:id', UserController.deleteUser);

// Bulk actions
router.post('/bulk-status', validate(bulkActionValidator), UserController.bulkStatusUpdate);
router.post('/bulk-delete', validate(bulkActionValidator), UserController.bulkDeleteUsers);

module.exports = router;