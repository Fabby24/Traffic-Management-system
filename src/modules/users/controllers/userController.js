const UserService = require('../services/userSerivices');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class UserController {

    async getUsers(req, res) {
        try {
            const { page, limit, search, role, status } = req.query;
            const userRole = req.user.role;
            const organizationId = req.user.role === 'super_admin' ? null : req.user.organization_id;

            const result = await UserService.getUsers({
                organizationId,
                userRole,
                page,
                limit,
                search,
                role,
                status,
            });

            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Get users error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }
    }


    async getUser(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.params.id;

            const user = await UserService.getUser(organizationId, userId);

            res.json({ success: true, data: { user } });
        } catch (error) {
            logger.error('Get user error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'User not found',
            });
        }
    }

    async inviteUser(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const organizationId = req.user.organization_id;
            const invitedBy = req.user.user_id;
            const { email, role } = req.body;

            const result = await UserService.inviteUser(organizationId, invitedBy, email, role);

            res.status(201).json({
                success: true,
                message: 'Invitation sent successfully',
                data: {
                    email: result.user.email,
                    role: result.user.role,
                },
            });
        } catch (error) {
            logger.error('Invite user error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to send invitation',
            });
        }
    }

    async acceptInvitation(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { token, password, first_name, last_name } = req.body;

            const user = await UserService.acceptInvitation(token, password, first_name, last_name);

            res.json({
                success: true,
                message: 'Invitation accepted successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role,
                    },
                },
            });
        } catch (error) {
            logger.error('Accept invitation error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to accept invitation',
            });
        }
    }

    async updateUser(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const organizationId = req.user.organization_id;
            const requestingUserId = req.user.user_id; // ✅ added
            const userId = req.params.id;
            const { first_name, last_name, role, status } = req.body;

            const user = await UserService.updateUser(
                organizationId,
                userId,
                { first_name, last_name, role, status },
                requestingUserId // ✅ passed
            );

            res.json({
                success: true,
                message: 'User updated successfully',
                data: { user },
            });
        } catch (error) {
            logger.error('Update user error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update user',
            });
        }
    }

    async updateUserStatus(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const organizationId = req.user.organization_id;
            const requestingUserId = req.user.user_id; // ✅ added
            const userId = req.params.id;
            const { status } = req.body;

            const user = await UserService.updateUserStatus(
                organizationId,
                userId,
                status,
                requestingUserId // ✅ passed
            );

            res.json({
                success: true,
                message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { user },
            });
        } catch (error) {
            logger.error('Update user status error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update user status',
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const requestingUserId = req.user.user_id; // ✅ added
            const userId = req.params.id;

            await UserService.deleteUser(
                organizationId,
                userId,
                requestingUserId // ✅ passed
            );

            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            logger.error('Delete user error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete user',
            });
        }
    }

    async bulkStatusUpdate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const organizationId = req.user.organization_id;
            const requestingUserId = req.user.user_id; // ✅ added
            const { userIds, status } = req.body;

            const count = await UserService.bulkStatusUpdate(
                organizationId,
                userIds,
                status,
                requestingUserId // ✅ passed
            );

            res.json({
                success: true,
                message: `${count} users ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk status update error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update users',
            });
        }
    }

    async bulkDeleteUsers(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const organizationId = req.user.organization_id;
            const requestingUserId = req.user.user_id; // ✅ added
            const { userIds } = req.body;

            const count = await UserService.bulkDeleteUsers(
                organizationId,
                userIds,
                requestingUserId // ✅ passed
            );

            res.json({
                success: true,
                message: `${count} users deleted successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error('Bulk delete error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete users',
            });
        }
    }
}

module.exports = new UserController();