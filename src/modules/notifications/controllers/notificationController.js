const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class NotificationController {
    /**
     * Get user notifications
     * GET /api/v1/notifications
     */
    async getNotifications(req, res) {
        try {
            const { page, limit, unreadOnly } = req.query;
            const userId = req.user.user_id;

            const result = await NotificationService.getUserNotifications(userId, {
                page,
                limit,
                unreadOnly: unreadOnly === 'true',
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message,
            });
        }
    }

    /**
     * Get unread count
     * GET /api/v1/notifications/unread-count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.user_id;

            const count = await NotificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count },
            });
        } catch (error) {
            logger.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message,
            });
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/v1/notifications/:id/read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.user_id;
            const notificationId = req.params.id;

            await NotificationService.markAsRead(notificationId, userId);

            res.json({
                success: true,
                message: 'Notification marked as read',
            });
        } catch (error) {
            logger.error('Mark as read error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to mark as read',
            });
        }
    }

    /**
     * Mark all notifications as read
     * POST /api/v1/notifications/mark-all-read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.user_id;

            await NotificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read',
            });
        } catch (error) {
            logger.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all as read',
                error: error.message,
            });
        }
    }

    /**
     * Delete notification
     * DELETE /api/v1/notifications/:id
     */
    async deleteNotification(req, res) {
        try {
            const userId = req.user.user_id;
            const notificationId = req.params.id;

            await NotificationService.deleteNotification(notificationId, userId);

            res.json({
                success: true,
                message: 'Notification deleted successfully',
            });
        } catch (error) {
            logger.error('Delete notification error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete notification',
            });
        }
    }
}

module.exports = new NotificationController();