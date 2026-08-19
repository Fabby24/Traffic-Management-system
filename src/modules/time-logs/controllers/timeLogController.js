const TimeLogService = require('../services/timeLogService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class TimeLogController {
    /**
     * Get time logs with filters
     * GET /api/v1/time-logs
     */
    async getTimeLogs(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { user_id, task_id, project_id, date, from, to, page, limit } = req.query;

            const result = await TimeLogService.getTimeLogs({
                organizationId,
                userId,
                filterUserId: user_id || userId,
                task_id,
                project_id,
                date,
                from,
                to,
                page,
                limit,
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get time logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch time logs',
                error: error.message,
            });
        }
    }

    /**
     * Get daily summary
     * GET /api/v1/time-logs/summary/daily
     */
    async getDailySummary(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { user_id, date } = req.query;

            const summary = await TimeLogService.getDailySummary({
                organizationId,
                userId: user_id || userId,
                date: date || new Date().toISOString().split('T')[0],
            });

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            logger.error('Get daily summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get daily summary',
                error: error.message,
            });
        }
    }

    /**
     * Get weekly summary
     * GET /api/v1/time-logs/summary/weekly
     */
    async getWeeklySummary(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { user_id, from, to } = req.query;

            const summary = await TimeLogService.getWeeklySummary({
                organizationId,
                userId: user_id || userId,
                from,
                to,
            });

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            logger.error('Get weekly summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get weekly summary',
                error: error.message,
            });
        }
    }

    //organiation weekly summary
    async getOrganizationWeeklySummary(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { from, to } = req.query;

            const summary = await TimeLogService.getOrganizationWeeklySummary({
                organizationId,
                from,
                to,
            });

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            logger.error('Get organization weekly summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get organization weekly summary',
                error: error.message,
            });
        }
    }

    /**
     * Get organization time tracking dashboard
     * GET /api/v1/time-logs/dashboard/organization
     */
    async getOrganizationDashboard(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const { date, period = 'week' } = req.query;

            const dashboard = await TimeLogService.getOrganizationDashboard({
                organizationId,
                date,
                period,
            });

            res.json({
                success: true,
                data: dashboard,
            });
        } catch (error) {
            logger.error('Get organization dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get organization time tracking dashboard',
                error: error.message,
            });
        }
    }
    /**
     * Start timer
     * POST /api/v1/time-logs/start
     */
    async startTimer(req, res) {
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
            const { task_id } = req.body;

            const timeLog = await TimeLogService.startTimer({
                organizationId,
                userId,
                task_id,
            });

            res.status(201).json({
                success: true,
                message: 'Timer started successfully',
                data: timeLog,
            });
        } catch (error) {
            logger.error('Start timer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to start timer',
            });
        }
    }

    /**
     * Stop timer
     * POST /api/v1/time-logs/stop
     */
    async stopTimer(req, res) {
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
            const { time_log_id } = req.body;

            const timeLog = await TimeLogService.stopTimer({
                organizationId,
                userId,
                time_log_id,
            });

            res.json({
                success: true,
                message: 'Timer stopped successfully',
                data: timeLog,
            });
        } catch (error) {
            logger.error('Stop timer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to stop timer',
            });
        }
    }

    /**
     * Pause timer
     * POST /api/v1/time-logs/pause
     */
    async pauseTimer(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { time_log_id } = req.body;

            const timeLog = await TimeLogService.pauseTimer({
                organizationId,
                userId,
                time_log_id,
            });

            res.json({
                success: true,
                message: 'Timer paused successfully',
                data: timeLog,
            });
        } catch (error) {
            logger.error('Pause timer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to pause timer',
            });
        }
    }

    /**
     * Resume timer
     * POST /api/v1/time-logs/resume
     */
    async resumeTimer(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { time_log_id } = req.body;

            const timeLog = await TimeLogService.resumeTimer({
                organizationId,
                userId,
                time_log_id,
            });

            res.json({
                success: true,
                message: 'Timer resumed successfully',
                data: timeLog,
            });
        } catch (error) {
            logger.error('Resume timer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to resume timer',
            });
        }
    }

    /**
     * Update time log
     * PUT /api/v1/time-logs/:id
     */
    async updateTimeLog(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const timeLogId = req.params.id;
            const { hours, description, billable } = req.body;

            const timeLog = await TimeLogService.updateTimeLog({
                organizationId,
                userId,
                timeLogId,
                hours,
                description,
                billable,
            });

            res.json({
                success: true,
                message: 'Time log updated successfully',
                data: timeLog,
            });
        } catch (error) {
            logger.error('Update time log error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update time log',
            });
        }
    }

    /**
     * Delete time log
     * DELETE /api/v1/time-logs/:id
     */
    async deleteTimeLog(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const timeLogId = req.params.id;

            await TimeLogService.deleteTimeLog({
                organizationId,
                userId,
                timeLogId,
            });

            res.json({
                success: true,
                message: 'Time log deleted successfully',
            });
        } catch (error) {
            logger.error('Delete time log error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete time log',
            });
        }
    }
}

module.exports = new TimeLogController();