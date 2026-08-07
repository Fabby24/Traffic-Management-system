const OrganizationService = require('../services/organizationService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');

class OrganizationController {
    /**
     * Get organization details
     * GET /api/v1/organizations
     */
    async getOrganization(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const organization = await OrganizationService.getOrganization(organizationId);

            res.json({
                success: true,
                data: { organization },
            });
        } catch (error) {
            logger.error('Get organization error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Organization not found',
            });
        }
    }

    /**
     * Update organization
     * PUT /api/v1/organizations
     */
    async updateOrganization(req, res) {
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

            const organization = await OrganizationService.updateOrganization(
                organizationId,
                userId,
                req.body
            );

            res.json({
                success: true,
                message: 'Organization updated successfully',
                data: { organization },
            });
        } catch (error) {
            logger.error('Update organization error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update organization',
            });
        }
    }

    /**
     * Update organization logo
     * POST /api/v1/organizations/logo
     */
    async updateLogo(req, res) {
        try {
            const organizationId = req.user.organization_id;
            const userId = req.user.user_id;
            const { logo_url } = req.body;

            if (!logo_url) {
                return res.status(400).json({
                    success: false,
                    message: 'Logo URL is required',
                });
            }

            const organization = await OrganizationService.updateLogo(
                organizationId,
                userId,
                logo_url
            );

            res.json({
                success: true,
                message: 'Logo updated successfully',
                data: { logo: organization.logo },
            });
        } catch (error) {
            logger.error('Update logo error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update logo',
            });
        }
    }

    /**
     * Get organization settings
     * GET /api/v1/organizations/settings
     */
    async getSettings(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const settings = await OrganizationService.getSettings(organizationId);

            res.json({
                success: true,
                data: { settings },
            });
        } catch (error) {
            logger.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get organization settings',
            });
        }
    }

    /**
     * Update organization settings
     * PUT /api/v1/organizations/settings
     */
    async updateSettings(req, res) {
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

            const settings = await OrganizationService.updateSettings(
                organizationId,
                userId,
                req.body
            );

            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: { settings },
            });
        } catch (error) {
            logger.error('Update settings error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update settings',
            });
        }
    }

    /**
     * Get organization stats
     * GET /api/v1/organizations/stats
     */
    async getStats(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const stats = await OrganizationService.getStats(organizationId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Get organization stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get organization stats',
            });
        }
    }
}

module.exports = new OrganizationController();