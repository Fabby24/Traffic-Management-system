const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

class AuthService {
    static async register(userData) {
        const {
            email,
            password,
            first_name,
            last_name,
            organization_name,
            organization_slug,
            role = 'org_admin'
        } = userData;

        try {
            // ✅ Fix 1 — email is not unique alone, use findFirst instead of findUnique
            const existingOrg = await prisma.organization.findFirst({
                where: { slug: organization_slug }
            });

            if (existingOrg) {
                throw new Error('Organization slug already taken');
            }

            const hashedPassword = await bcrypt.hash(
                password,
                parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            );

            const result = await prisma.$transaction(async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        name: organization_name,
                        slug: organization_slug,
                        contact_email: email,
                        status: 'active'
                    }
                });

                // ✅ Fix 2 — model is OrganizationSettings not OrganizationSetting
                await tx.organizationSettings.create({
                    data: {
                        organization_id: organization.id,
                        brand_color: '#2563EB',
                        brand_secondary: '#7C3AED',
                        allow_self_registration: true,
                        require_email_verification: false,
                        currency: 'USD'
                    }
                });

                // ✅ Fix 3 — check email uniqueness within org after org is created
                const existingUser = await tx.user.findFirst({
                    where: {
                        email,
                        organization_id: organization.id
                    }
                });

                if (existingUser) {
                    throw new Error('User with this email already exists');
                }

                const user = await tx.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        first_name,
                        last_name,
                        role: role === 'super_admin' ? 'super_admin' : 'org_admin',
                        status: 'active',
                        organization_id: organization.id
                    }
                });

                await tx.auditLog.create({
                    data: {
                        organization_id: organization.id,
                        user_id: user.id,
                        action: 'organization_created',
                        entity_type: 'organization',
                        entity_id: organization.id,
                        changes: { name: organization_name, slug: organization_slug }
                    }
                });

                await tx.auditLog.create({
                    data: {
                        organization_id: organization.id,
                        user_id: user.id,
                        action: 'user_created',
                        entity_type: 'user',
                        entity_id: user.id,
                        changes: { email, role: user.role }
                    }
                });

                return { user, organization };
            });

            sendWelcomeEmail(email, first_name, result.organization.name);

            const token = this.generateToken(result.user, result.organization);
            const { password: _, ...userWithoutPassword } = result.user;

            return {
                user: userWithoutPassword,
                organization: result.organization,
                token
            };

        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            // ✅ Fix 4 — email alone not unique, use findFirst
            const user = await prisma.user.findFirst({
                where: {
                    email,
                    deleted_at: null
                },
                include: { organization: true }
            });

            if (!user) {
                throw new Error('Invalid email or password');
            }

            if (user.status !== 'active') {
                throw new Error('Account is inactive. Please contact your administrator.');
            }

            if (user.organization.status !== 'active') {
                throw new Error('Organization is inactive. Please contact support.');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { last_login: new Date() }
            });

            await prisma.auditLog.create({
                data: {
                    organization_id: user.organization_id,
                    user_id: user.id,
                    action: 'user_login',
                    entity_type: 'user',
                    entity_id: user.id,
                    changes: { email: user.email, timestamp: new Date().toISOString() }
                }
            });

            const token = this.generateToken(user, user.organization);
            const { password: _, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                organization: user.organization,
                token
            };

        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    static generateToken(user, organization) {
        const payload = {
            user_id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            organization_id: organization.id,
            organization_slug: organization.slug,
            organization_name: organization.name,
            permissions: this.getPermissionsForRole(user.role)
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'studio-x-platform',
            audience: 'studio-x-api'
        });
    }

    static getPermissionsForRole(role) {
        const permissions = {
            super_admin: [
                'organizations:read', 'organizations:write', 'organizations:delete',
                'users:read', 'users:write', 'users:delete',
                'clients:read', 'clients:write', 'clients:delete',
                'projects:read', 'projects:write', 'projects:delete',
                'tasks:read', 'tasks:write', 'tasks:delete',
                'settings:read', 'settings:write',
                'reports:read', 'reports:write'
            ],
            org_admin: [
                'users:read', 'users:write',
                'clients:read', 'clients:write', 'clients:delete',
                'projects:read', 'projects:write', 'projects:delete',
                'tasks:read', 'tasks:write', 'tasks:delete',
                'settings:read', 'settings:write',
                'reports:read'
            ],
            team_member: [
                'tasks:read', 'tasks:write',
                'projects:read',
                'time:read', 'time:write'
            ]
        };

        return permissions[role] || [];
    }

    static async requestPasswordReset(email) {
        try {
            // ✅ Fix 5 — use findFirst for email lookup
            const user = await prisma.user.findFirst({
                where: { email, deleted_at: null },
                include: { organization: true }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // ✅ Fix 6 — correct model name is passwordResetToken not passwordReset
            await prisma.passwordResetToken.deleteMany({
                where: { user_id: user.id }
            });

            await prisma.passwordResetToken.create({
                data: {
                    user_id: user.id,
                    token,
                    expires_at: expiresAt
                }
            });

            await sendPasswordResetEmail(email, token, user.first_name);

            logger.info(`Password reset requested for: ${email}`);
            return { success: true };

        } catch (error) {
            logger.error('Password reset request error:', error);
            throw error;
        }
    }

    static async resetPassword(token, newPassword) {
        try {
            // ✅ Fix 7 — correct model name passwordResetToken
            const resetToken = await prisma.passwordResetToken.findFirst({
                where: {
                    token,
                    expires_at: { gt: new Date() },
                    used_at: null
                },
                include: { user: true } // ✅ Fix 8 — include user so we can get organization_id
            });

            if (!resetToken) {
                throw new Error('Invalid or expired reset token');
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            );

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: resetToken.user_id },
                    data: { password: hashedPassword }
                }),
                prisma.passwordResetToken.update({
                    where: { id: resetToken.id },
                    data: { used_at: new Date() }
                })
            ]);

            await prisma.auditLog.create({
                data: {
                    organization_id: resetToken.user.organization_id, // ✅ Fix 9 — use included user
                    user_id: resetToken.user_id,
                    action: 'password_reset',
                    entity_type: 'user',
                    entity_id: resetToken.user_id,
                    changes: { timestamp: new Date().toISOString() }
                }
            });

            logger.info(`Password reset for user: ${resetToken.user_id}`);
            return { success: true };

        } catch (error) {
            logger.error('Password reset error:', error);
            throw error;
        }
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'studio-x-platform',
                audience: 'studio-x-api'
            });
        } catch (error) {
            logger.error('Token verification error:', error);
            throw new Error('Invalid or expired token');
        }
    }

    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            );

            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            await prisma.auditLog.create({
                data: {
                    organization_id: user.organization_id,
                    user_id: userId,
                    action: 'password_changed',
                    entity_type: 'user',
                    entity_id: userId,
                    changes: { timestamp: new Date().toISOString() }
                }
            });

            return { success: true };

        } catch (error) {
            logger.error('Change password error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;