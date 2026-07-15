const { prisma } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../../utils/logger');
const { sendInvitationEmail, sendWelcomeEmail } = require('../../../utils/email');

class UserService {
    // get  all users
    static async getUsers({ organizationId, userRole, page = 1, limit = 10, search = '', role = '', status = '' }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

    
        let where = {
            deleted_at: null,
        };

        // This ensures Organization Admins and Team Members only see their org's users
        if (userRole !== 'super_admin' && organizationId) {
            where.organization_id = organizationId;
        }

        // Add search filters
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Add role filter
        if (role) {
            where.role = role;
        }

        // Add status filter
        if (status) {
            where.status = status;
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users with organization info
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                status: true,
                profile_image: true,
                last_login: true,
                created_at: true,
                updated_at: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limitNum,
        });

        return {
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get single user
     */
    static async getUser(organizationId, userId) {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                organization_id: organizationId,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                status: true,
                profile_image: true,
                last_login: true,
                created_at: true,
                updated_at: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Invite team member
     */
    static async inviteUser(organizationId, invitedBy, email, role = 'team_member') {
        // Check if user already exists in this organization
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                organization_id: organizationId,
            },
        });

        if (existingUser) {
            throw new Error('User already exists in this organization');
        }

        const globalUser = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: null,
            },
        });

        if (globalUser) {
            throw new Error('User already registered in another organization');
        }

        // Generate invitation token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 168); // 7 days

        // Get organization details
        const organization = await prisma.organization.findFirst({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        // Create user with inactive status
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                first_name: '',
                last_name: '',
                role: role,
                status: 'inactive',
                organization_id: organizationId,
            },
        });

        // Create invitation record
        await prisma.invitation.create({
            data: {
                email,
                token: inviteToken,
                expires_at: expiresAt,
                user_id: user.id,
                invited_by: invitedBy,
                organization_id: organizationId,
            },
        });

        await sendInvitationEmail(email, organization.name, role, inviteToken);

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: invitedBy,
                action: 'user_invited',
                entity_type: 'user',
                entity_id: user.id,
                changes: {
                    email,
                    role,
                },
            },
        });

        logger.info(`User invited: ${email} to organization ${organizationId}`);

        return { user, inviteToken };
    }

    /**
     * Accept invitation
     */
    static async acceptInvitation(token, password, firstName, lastName) {
        // Find valid invitation
        const invitation = await prisma.invitation.findFirst({
            where: {
                token,
                expires_at: { gt: new Date() },
                used_at: null,
            },
            include: {
                user: true,
                organization: true,
            },
        });

        if (!invitation) {
            throw new Error('Invalid or expired invitation');
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user
        const user = await prisma.user.update({
            where: { id: invitation.user_id },
            data: {
                password: hashedPassword,
                first_name: firstName,
                last_name: lastName,
                status: 'active',
            },
        });

        // Mark invitation as used
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { used_at: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: invitation.organization_id,
                user_id: user.id,
                action: 'invitation_accepted',
                entity_type: 'user',
                entity_id: user.id,
                changes: {
                    email: user.email,
                    timestamp: new Date().toISOString(),
                },
            },
        });

        // Send welcome email
        await sendWelcomeEmail(user.email, user.first_name, invitation.organization.name);

        logger.info(`Invitation accepted: ${user.email}`);

        return user;
    }

    /**
     * Update user
     */
    static async updateUser(organizationId, userId, data, requestingUserId) {
        const { first_name, last_name, role, status } = data;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Prevent org admin from changing their own role
        if (role && userId === requestingUserId) {
            throw new Error('Cannot change your own role');
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                first_name: first_name || existingUser.first_name,
                last_name: last_name || existingUser.last_name,
                role: role || existingUser.role,
                status: status || existingUser.status,
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                status: true,
                profile_image: true,
                last_login: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: requestingUserId,
                action: 'user_updated',
                entity_type: 'user',
                entity_id: user.id,
                changes: data,
            },
        });

        return user;
    }

    /**
     * Update user status
     */
    static async updateUserStatus(organizationId, userId, status, requestingUserId) {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Prevent deactivating yourself
        if (status === 'inactive' && userId === requestingUserId) {
            throw new Error('Cannot deactivate your own account');
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                status: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: requestingUserId,
                action: `user_${status}`,
                entity_type: 'user',
                entity_id: user.id,
                changes: { status },
            },
        });

        return updated;
    }

    /**
     * Delete user (soft delete)
     */
    static async deleteUser(organizationId, userId, requestingUserId) {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Prevent deleting yourself
        if (userId === requestingUserId) {
            throw new Error('Cannot delete your own account');
        }

        // Soft delete
        await prisma.user.update({
            where: { id: userId },
            data: { deleted_at: new Date() },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: requestingUserId,
                action: 'user_deleted',
                entity_type: 'user',
                entity_id: user.id,
                changes: { email: user.email },
            },
        });

        return true;
    }

    /**
     * Bulk status update
     */
    static async bulkStatusUpdate(organizationId, userIds, status, requestingUserId) {
        // Prevent deactivating yourself
        const currentUser = await prisma.user.findFirst({
            where: {
                id: requestingUserId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (status === 'inactive' && userIds.includes(currentUser.id)) {
            throw new Error('Cannot deactivate your own account');
        }

        const result = await prisma.user.updateMany({
            where: {
                id: { in: userIds },
                organization_id: organizationId,
                deleted_at: null,
            },
            data: { status },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: requestingUserId,
                action: `bulk_users_${status}`,
                entity_type: 'user',
                entity_id: organizationId,
                changes: { userIds, status },
            },
        });

        return result.count;
    }

    /**
     * Bulk delete users
     */
    static async bulkDeleteUsers(organizationId, userIds, requestingUserId) {
        // Prevent deleting yourself
        const currentUser = await prisma.user.findFirst({
            where: {
                id: requestingUserId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (userIds.includes(currentUser.id)) {
            throw new Error('Cannot delete your own account');
        }

        const result = await prisma.user.updateMany({
            where: {
                id: { in: userIds },
                organization_id: organizationId,
                deleted_at: null,
            },
            data: { deleted_at: new Date() },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: requestingUserId,
                action: 'bulk_users_deleted',
                entity_type: 'user',
                entity_id: organizationId,
                changes: { userIds },
            },
        });

        return result.count;
    }
}

module.exports = UserService;