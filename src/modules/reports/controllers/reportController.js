const ReportService = require('../services/reportService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class ReportController {
    /**
     * Get project performance report
     * GET /api/v1/reports/projects
     */
    async getProjectReport(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { startDate, endDate, status, projectId } = req.query;

            const report = await ReportService.getProjectReport(organizationId, {
                startDate,
                endDate,
                status,
                projectId,
            });

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            logger.error('Get project report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate project report',
                error: error.message,
            });
        }
    }

    /**
     * Get task report
     * GET /api/v1/reports/tasks
     */
    async getTaskReport(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { startDate, endDate, status, priority, assignedTo, projectId } = req.query;

            const report = await ReportService.getTaskReport(organizationId, {
                startDate,
                endDate,
                status,
                priority,
                assignedTo,
                projectId,
            });

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            logger.error('Get task report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate task report',
                error: error.message,
            });
        }
    }

    /**
     * Get time report
     * GET /api/v1/reports/time
     */
    async getTimeReport(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { startDate, endDate, userId, projectId, taskId } = req.query;

            const report = await ReportService.getTimeReport(organizationId, {
                startDate,
                endDate,
                userId,
                projectId,
                taskId,
            });

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            logger.error('Get time report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate time report',
                error: error.message,
            });
        }
    }

    /**
     * Get client report
     * GET /api/v1/reports/clients
     */
    async getClientReport(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { startDate, endDate, status } = req.query;

            const report = await ReportService.getClientReport(organizationId, {
                startDate,
                endDate,
                status,
            });

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            logger.error('Get client report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate client report',
                error: error.message,
            });
        }
    }

    /**
     * Get dashboard analytics
     * GET /api/v1/reports/analytics
     */
    async getDashboardAnalytics(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const analytics = await ReportService.getDashboardAnalytics(organizationId);

            res.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            logger.error('Get dashboard analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard analytics',
                error: error.message,
            });
        }
    }
}

module.exports = new ReportController();