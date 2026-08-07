const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class OrganizationService {
    /**
     * Get organization by ID
     */
    static async getOrganization(organizationId) {
        const organization = await prisma.organization.findFirst({
            where: {
                id: organizationId,
                deleted_at: null,
            },
            include: {
                settings_rel: true,
                _count: {
                    select: {
                        users: {
                            where: { deleted_at: null },
                        },
                        projects: {
                            where: { deleted_at: null },
                        },
                        clients: {
                            where: { deleted_at: null },
                        },
                    },
                },
            },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        return organization;
    }

    /**
     * Update organization
     */
    static async updateOrganization(organizationId, userId, data) {
        const {
            name,
            logo,
            contact_email,
            timezone,
            theme,
            settings,
        } = data;

        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data: {
                name: name || undefined,
                logo: logo || undefined,
                contact_email: contact_email || undefined,
                timezone: timezone || undefined,
                theme: theme || undefined,
                settings: settings || undefined,
                updated_by: userId,
            },
        });

        // Update organization settings if provided
        if (settings) {
            await prisma.organizationSettings.update({
                where: { organization_id: organizationId },
                data: {
                    brand_color: settings.brand_color || undefined,
                    brand_secondary: settings.brand_secondary || undefined,
                    logo_url: settings.logo_url || undefined,
                    currency: settings.currency || undefined,
                },
            });
        }

        logger.info(`Organization updated: ${organization.name} by user ${userId}`);

        return this.getOrganization(organizationId);
    }

    /**
     * Update organization logo
     */
    static async updateLogo(organizationId, userId, logoUrl) {
        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data: {
                logo: logoUrl,
                updated_by: userId,
            },
        });

        logger.info(`Organization logo updated: ${organization.name} by user ${userId}`);

        return organization;
    }

    /**
     * Update organization settings
     */
    static async updateSettings(organizationId, userId, settingsData) {
        const {
            brand_color,
            brand_secondary,
            logo_url,
            favicon_url,
            allow_self_registration,
            require_email_verification,
            allow_google_auth,
            allow_microsoft_auth,
            task_assignment_email,
            task_deadline_reminder,
            project_update_email,
            billing_email,
            billing_contact,
            tax_id,
            currency,
            payment_terms,
        } = settingsData;

        const settings = await prisma.organizationSettings.update({
            where: { organization_id: organizationId },
            data: {
                brand_color: brand_color || undefined,
                brand_secondary: brand_secondary || undefined,
                logo_url: logo_url || undefined,
                favicon_url: favicon_url || undefined,
                allow_self_registration: allow_self_registration !== undefined ? allow_self_registration : undefined,
                require_email_verification: require_email_verification !== undefined ? require_email_verification : undefined,
                allow_google_auth: allow_google_auth !== undefined ? allow_google_auth : undefined,
                allow_microsoft_auth: allow_microsoft_auth !== undefined ? allow_microsoft_auth : undefined,
                task_assignment_email: task_assignment_email !== undefined ? task_assignment_email : undefined,
                task_deadline_reminder: task_deadline_reminder !== undefined ? task_deadline_reminder : undefined,
                project_update_email: project_update_email !== undefined ? project_update_email : undefined,
                billing_email: billing_email || undefined,
                billing_contact: billing_contact || undefined,
                tax_id: tax_id || undefined,
                currency: currency || undefined,
                payment_terms: payment_terms || undefined,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'organization_settings_updated',
                entity_type: 'organization',
                entity_id: organizationId,
                changes: settingsData,
            },
        });

        logger.info(`Organization settings updated for ${organizationId} by user ${userId}`);

        return settings;
    }

    /**
     * Get organization settings
     */
    static async getSettings(organizationId) {
        const settings = await prisma.organizationSettings.findUnique({
            where: { organization_id: organizationId },
        });

        if (!settings) {
            // Create default settings if not exist
            return prisma.organizationSettings.create({
                data: {
                    organization_id: organizationId,
                    brand_color: '#2563EB',
                    brand_secondary: '#7C3AED',
                    currency: 'USD',
                },
            });
        }

        return settings;
    }

    /**
     * Get organization stats (for admin dashboard)
     */
    static async getStats(organizationId) {
        const [
            totalUsers,
            activeUsers,
            totalProjects,
            activeProjects,
            totalClients,
            activeClients,
            totalTasks,
            completedTasks,
        ] = await Promise.all([
            prisma.user.count({
                where: { organization_id: organizationId, deleted_at: null },
            }),
            prisma.user.count({
                where: { organization_id: organizationId, status: 'active', deleted_at: null },
            }),
            prisma.project.count({
                where: { organization_id: organizationId, deleted_at: null },
            }),
            prisma.project.count({
                where: {
                    organization_id: organizationId,
                    lifecycle_status: 'active',
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: { organization_id: organizationId, deleted_at: null },
            }),
            prisma.client.count({
                where: { organization_id: organizationId, status: 'active', deleted_at: null },
            }),
            prisma.task.count({
                where: { organization_id: organizationId, deleted_at: null },
            }),
            prisma.task.count({
                where: { organization_id: organizationId, status: 'completed', deleted_at: null },
            }),
        ]);

        return {
            totalUsers,
            activeUsers,
            totalProjects,
            activeProjects,
            totalClients,
            activeClients,
            totalTasks,
            completedTasks,
        };
    }
}

module.exports = OrganizationService;