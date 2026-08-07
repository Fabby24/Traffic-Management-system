const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');
const {
    CLIENT_STATUS,
    CLIENT_PRIORITY,
} = require('../constants/clientConstants');

class ClientService {
    /**
     * Get all clients with pagination and filters
     */
    static async getClients({
        organizationId,
        page = 1,
        limit = 10,
        search = '',
        status = '',
        industry = '',
        priority = '',
        assignedTo = '',
        sortBy = 'created_at',
        sortOrder = 'desc',
    }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build filter conditions
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (industry) {
            where.industry = industry;
        }

        if (priority) {
            where.priority = priority;
        }

        if (assignedTo) {
            where.assigned_to = assignedTo;
        }

        // Build sorting
        const orderBy = {};
        if (sortBy === 'assignee') {
            orderBy.assignee = { first_name: sortOrder };
        } else {
            orderBy[sortBy] = sortOrder;
        }

        // Get total count
        const total = await prisma.client.count({ where });

        // Get clients
        const clients = await prisma.client.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                _count: {
                    select: {
                        projects: {
                            where: {
                                deleted_at: null,
                            },
                        },
                    },
                },
            },
            orderBy,
            skip: offset,
            take: limitNum,
        });

        // Parse tags JSON
        const parsedClients = clients.map(client => ({
            ...client,
            tags: client.tags || [],
        }));

        return {
            clients: parsedClients,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get client by ID
     */
    static async getClient(organizationId, clientId) {
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organization_id: organizationId,
                deleted_at: null,
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        profile_image: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                projects: {
                    where: {
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        project_code: true,
                        lifecycle_status: true,
                        completion_percentage: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        projects: {
                            where: {
                                deleted_at: null,
                            },
                        },
                    },
                },
            },
        });

        if (!client) {
            throw new Error('Client not found');
        }

        // Parse tags JSON
        return {
            ...client,
            tags: client.tags || [],
        };
    }

    /**
     * Get client statistics
     */
    static async getClientStats(organizationId) {
        const [
            total,
            active,
            inactive,
            highPriority,
            mediumPriority,
            lowPriority,
            industryBreakdown,
            assignedBreakdown,
        ] = await Promise.all([
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    status: CLIENT_STATUS.ACTIVE,
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    status: CLIENT_STATUS.INACTIVE,
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    priority: CLIENT_PRIORITY.HIGH,
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    priority: CLIENT_PRIORITY.MEDIUM,
                    deleted_at: null,
                },
            }),
            prisma.client.count({
                where: {
                    organization_id: organizationId,
                    priority: CLIENT_PRIORITY.LOW,
                    deleted_at: null,
                },
            }),
            prisma.client.groupBy({
                by: ['industry'],
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    industry: {
                        not: null,
                    },
                },
                _count: true,
            }),
            prisma.client.groupBy({
                by: ['assigned_to'],
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    assigned_to: {
                        not: null,
                    },
                },
                _count: true,
            }),
        ]);

        // Get user names for assigned breakdown
        const userIds = assignedBreakdown.map(b => b.assigned_to).filter(id => id !== null);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                first_name: true,
                last_name: true,
            },
        });

        const assignedData = assignedBreakdown.map(b => {
            const user = users.find(u => u.id === b.assigned_to);
            return {
                user_id: b.assigned_to,
                user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
                count: b._count,
            };
        });

        return {
            total,
            active,
            inactive,
            highPriority,
            mediumPriority,
            lowPriority,
            industryBreakdown: industryBreakdown.map(b => ({
                industry: b.industry || 'Unspecified',
                count: b._count,
            })),
            assignedBreakdown: assignedData,
        };
    }

    /**
     * Create client
     */
    static async createClient(organizationId, userId, data) {
        const {
            name,
            company,
            email,
            phone,
            website,
            industry,
            logo,
            tags = [],
            status = CLIENT_STATUS.ACTIVE,
            priority = CLIENT_PRIORITY.MEDIUM,
            preferred_contact = 'email',
            timezone = 'UTC',
            notes,
            billing_contact,
            payment_terms,
            currency = 'USD',
            tax_number,
            assigned_to,
        } = data;

        // Check if email already exists in this organization
        const existing = await prisma.client.findFirst({
            where: {
                organization_id: organizationId,
                email,
                deleted_at: null,
            },
        });

        if (existing) {
            throw new Error('Client with this email already exists');
        }

        // Verify assigned user exists and belongs to organization
        if (assigned_to) {
            const user = await prisma.user.findFirst({
                where: {
                    id: assigned_to,
                    organization_id: organizationId,
                    deleted_at: null,
                },
            });

            if (!user) {
                throw new Error('Assigned user not found');
            }
        }

        // Create client
        const client = await prisma.client.create({
            data: {
                organization_id: organizationId,
                name,
                company: company || '',
                email,
                phone: phone || '',
                website: website || '',
                industry: industry || '',
                logo: logo || null,
                tags: tags,
                status: status || CLIENT_STATUS.ACTIVE,
                priority: priority || CLIENT_PRIORITY.MEDIUM,
                preferred_contact: preferred_contact || 'email',
                timezone: timezone || 'UTC',
                notes: notes || '',
                billing_contact: billing_contact || '',
                payment_terms: payment_terms || '',
                currency: currency || 'USD',
                tax_number: tax_number || '',
                assigned_to: assigned_to || null,
                created_by: userId,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'client_created',
                entity_type: 'client',
                entity_id: client.id,
                changes: {
                    name,
                    email,
                    status,
                    priority,
                },
            },
        });

        logger.info(`Client created: ${name} (${email}) by user ${userId}`);

        return this.getClient(organizationId, client.id);
    }

    /**
     * Update client
     */
    static async updateClient(organizationId, userId, clientId, data) {
        const existing = await this.getClient(organizationId, clientId);

        if (!existing) {
            throw new Error('Client not found');
        }

        const {
            name,
            company,
            email,
            phone,
            website,
            industry,
            logo,
            tags,
            status,
            priority,
            preferred_contact,
            timezone,
            notes,
            billing_contact,
            payment_terms,
            currency,
            tax_number,
            assigned_to,
        } = data;

        // Check email uniqueness if changed
        if (email && email !== existing.email) {
            const duplicate = await prisma.client.findFirst({
                where: {
                    organization_id: organizationId,
                    email,
                    deleted_at: null,
                    id: { not: clientId },
                },
            });

            if (duplicate) {
                throw new Error('Client with this email already exists');
            }
        }

        // Verify assigned user exists and belongs to organization
        if (assigned_to && assigned_to !== existing.assigned_to) {
            const user = await prisma.user.findFirst({
                where: {
                    id: assigned_to,
                    organization_id: organizationId,
                    deleted_at: null,
                },
            });

            if (!user) {
                throw new Error('Assigned user not found');
            }
        }

        // Update client
        const client = await prisma.client.update({
            where: { id: clientId },
            data: {
                name: name || existing.name,
                company: company !== undefined ? company : existing.company,
                email: email || existing.email,
                phone: phone !== undefined ? phone : existing.phone,
                website: website !== undefined ? website : existing.website,
                industry: industry !== undefined ? industry : existing.industry,
                logo: logo !== undefined ? logo : existing.logo,
                tags: tags !== undefined ? tags : existing.tags,
                status: status || existing.status,
                priority: priority || existing.priority,
                preferred_contact: preferred_contact || existing.preferred_contact,
                timezone: timezone || existing.timezone,
                notes: notes !== undefined ? notes : existing.notes,
                billing_contact: billing_contact !== undefined ? billing_contact : existing.billing_contact,
                payment_terms: payment_terms !== undefined ? payment_terms : existing.payment_terms,
                currency: currency || existing.currency,
                tax_number: tax_number !== undefined ? tax_number : existing.tax_number,
                assigned_to: assigned_to !== undefined ? (assigned_to || null) : existing.assigned_to,
                updated_at: new Date(),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'client_updated',
                entity_type: 'client',
                entity_id: client.id,
                changes: {
                    name,
                    email,
                    status,
                    priority,
                    assigned_to,
                },
            },
        });

        logger.info(`Client updated: ${client.name} (${client.email}) by user ${userId}`);

        return this.getClient(organizationId, client.id);
    }

    /**
     * Update client status
     */
    static async updateClientStatus(organizationId, userId, clientId, status) {
        const client = await this.getClient(organizationId, clientId);

        if (!client) {
            throw new Error('Client not found');
        }

        const updated = await prisma.client.update({
            where: { id: clientId },
            data: { status },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: `client_${status}`,
                entity_type: 'client',
                entity_id: client.id,
                changes: { status },
            },
        });

        logger.info(`Client ${status}: ${client.name} by user ${userId}`);

        return this.getClient(organizationId, client.id);
    }

    /**
     * Archive client (soft delete)
     */
    static async archiveClient(organizationId, userId, clientId) {
        const client = await this.getClient(organizationId, clientId);

        if (!client) {
            throw new Error('Client not found');
        }

        await prisma.client.update({
            where: { id: clientId },
            data: {
                deleted_at: new Date(),
                status: CLIENT_STATUS.INACTIVE,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'client_archived',
                entity_type: 'client',
                entity_id: client.id,
                changes: {
                    name: client.name,
                    email: client.email,
                },
            },
        });

        logger.info(`Client archived: ${client.name} by user ${userId}`);

        return true;
    }

    /**
     * Restore archived client
     */
    static async restoreClient(organizationId, userId, clientId) {
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organization_id: organizationId,
                deleted_at: { not: null },
            },
        });

        if (!client) {
            throw new Error('Archived client not found');
        }

        await prisma.client.update({
            where: { id: clientId },
            data: {
                deleted_at: null,
                status: CLIENT_STATUS.ACTIVE,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'client_restored',
                entity_type: 'client',
                entity_id: client.id,
                changes: {
                    name: client.name,
                    email: client.email,
                },
            },
        });

        logger.info(`Client restored: ${client.name} by user ${userId}`);

        return this.getClient(organizationId, client.id);
    }

    /**
     * Permanently delete client
     */
    static async deleteClient(organizationId, userId, clientId) {
        const client = await this.getClient(organizationId, clientId);

        if (!client) {
            throw new Error('Client not found');
        }

        // Check if client has projects
        if (client.projects && client.projects.length > 0) {
            throw new Error('Cannot delete client with existing projects. Archive the client instead.');
        }

        await prisma.client.delete({
            where: { id: clientId },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'client_deleted',
                entity_type: 'client',
                entity_id: client.id,
                changes: {
                    name: client.name,
                    email: client.email,
                },
            },
        });

        logger.info(`Client permanently deleted: ${client.name} by user ${userId}`);

        return true;
    }

    /**
     * Bulk status update
     */
    static async bulkStatusUpdate(organizationId, userId, clientIds, status) {
        const result = await prisma.client.updateMany({
            where: {
                id: { in: clientIds },
                organization_id: organizationId,
                deleted_at: null,
            },
            data: { status },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: `bulk_clients_${status}`,
                entity_type: 'client',
                entity_id: organizationId,
                changes: { clientIds, status },
            },
        });

        logger.info(`Bulk status update: ${result.count} clients ${status} by user ${userId}`);

        return result.count;
    }

    /**
     * Bulk archive clients
     */
    static async bulkArchive(organizationId, userId, clientIds) {
        const result = await prisma.client.updateMany({
            where: {
                id: { in: clientIds },
                organization_id: organizationId,
                deleted_at: null,
            },
            data: {
                deleted_at: new Date(),
                status: CLIENT_STATUS.INACTIVE,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'bulk_clients_archived',
                entity_type: 'client',
                entity_id: organizationId,
                changes: { clientIds },
            },
        });

        logger.info(`Bulk archive: ${result.count} clients archived by user ${userId}`);

        return result.count;
    }

    /**
     * Bulk delete clients
     */
    static async bulkDelete(organizationId, userId, clientIds) {
        // Check if any clients have projects
        const clientsWithProjects = await prisma.client.findMany({
            where: {
                id: { in: clientIds },
                organization_id: organizationId,
                projects: { some: { deleted_at: null } },
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (clientsWithProjects.length > 0) {
            const names = clientsWithProjects.map(c => c.name).join(', ');
            throw new Error(`Cannot delete clients with projects: ${names}`);
        }

        const result = await prisma.client.deleteMany({
            where: {
                id: { in: clientIds },
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'bulk_clients_deleted',
                entity_type: 'client',
                entity_id: organizationId,
                changes: { clientIds },
            },
        });

        logger.info(`Bulk delete: ${result.count} clients deleted by user ${userId}`);

        return result.count;
    }

    /**
     * Check if email exists
     */
    static async emailExists(organizationId, email, excludeId = null) {
        const where = {
            organization_id: organizationId,
            email,
            deleted_at: null,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const client = await prisma.client.findFirst({
            where,
            select: { id: true },
        });

        return !!client;
    }
}

module.exports = ClientService;