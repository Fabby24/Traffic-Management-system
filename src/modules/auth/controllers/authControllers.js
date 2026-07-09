const AuthService = require('../../../services/authService');
const { validationResult } = require('express-validator');
const logger = require('../../../utils/logger');
const { prisma } = require('../../../config/database')

class AuthController {
    /**
     * Register a new user with organization
     * POST /api/v1/auth/register
     */
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { 
                email, 
                password, 
                first_name, 
                last_name, 
                organization_name, 
                organization_slug,
                role 
            } = req.body;

            const result = await AuthService.register({
                email,
                password,
                first_name,
                last_name,
                organization_name,
                organization_slug,
                role
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user: result.user,
                    organization: result.organization,
                    token: result.token
                }
            });

        } catch (error) {
            logger.error('Registration error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            const result = await AuthService.login(email, password);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    organization: result.organization,
                    token: result.token
                }
            });

        } catch (error) {
            logger.error('Login error:', error);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get current user profile
     * GET /api/v1/auth/profile
     */
    async getProfile(req, res) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.user_id },
                include: {
                    organization: {
                        include: {
                            settings_rel: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const { password, ...userWithoutPassword } = user;

            res.json({
                success: true,
                data: {
                    user: userWithoutPassword,
                    tenant: req.tenant
                }
            });

        } catch (error) {
            logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    }

    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            await AuthService.requestPasswordReset(email);

            res.json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });

        } catch (error) {
            logger.error('Forgot password error:', error);
            // Don't reveal if user exists or not for security
            res.json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });
        }
    }

    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { token, new_password } = req.body;

            await AuthService.resetPassword(token, new_password);

            res.json({
                success: true,
                message: 'Password reset successful'
            });

        } catch (error) {
            logger.error('Reset password error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { current_password, new_password } = req.body;
            const userId = req.user.user_id;

            await AuthService.changePassword(userId, current_password, new_password);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            logger.error('Change password error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Logout user
     * POST /api/v1/auth/logout
     */
    async logout(req, res) {
        try {
            // Create audit log
            await prisma.auditLog.create({
                data: {
                    organization_id: req.user.organization_id,
                    user_id: req.user.user_id,
                    action: 'user_logout',
                    entity_type: 'user',
                    entity_id: req.user.user_id,
                    changes: {
                        timestamp: new Date().toISOString()
                    }
                }
            });

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to logout'
            });
        }
    }
}

module.exports = new AuthController();