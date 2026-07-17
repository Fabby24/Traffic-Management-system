const { prisma } = require('../../../config/database');
const { generateSlug } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class ProjectService {
    /**
     * Generate project code
     */
    static generateProjectCode(organizationId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PRJ-${timestamp.slice(-4)}-${random}`;
    }

    /**
     * Get all projects with pagination, filters, and sorting
     */
    static async getProjects({
        organizationId,
        page = 1,
        limit = 10,
        search = '',
        status = '',
        priority = '',
        projectType = '',
        department = '',
        healthStatus = '',
        managerId = '',
        clientId = '',
        assignedToMe = false,
        userId = '',
        userRole = '',
        sortBy = 'created_at',
        sortOrder = 'desc',
        includeArchived = false,
    }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build filter conditions
        const where = {
            organization_id: organizationId,
            deleted_at: null,
        };

        if (userRole === 'team_member') {
            where.team_member = {
                some: {
                    user_id: userId,
                }
            }
        }

        if (assignedToMe && userRole ==='team_member') {
            where.team_member = {
                some: {
                    user_id: userId,
                }
            }
        }

        if (!includeArchived) {
            where.archived = false;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { project_code: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        if (projectType) {
            where.project_type = projectType;
        }

        if (department) {
            where.department = department;
        }

        if (healthStatus) {
            where.health_status = healthStatus;
        }

        if (managerId) {
            where.manager_id = managerId;
        }

        if (clientId) {
            where.client_id = clientId;
        }

        if (assignedToMe && userId) {
            where.team_members = {
                some: {
                    user_id: userId,
                },
            };
        }

        // Build sorting
        const orderBy = {};
        if (sortBy === 'manager') {
            orderBy.manager = { first_name: sortOrder };
        } else if (sortBy === 'client') {
            orderBy.client = { name: sortOrder };
        } else {
            orderBy[sortBy] = sortOrder;
        }

        // Get total count
        const total = await prisma.project.count({ where });

        // Get projects
        const projects = await prisma.project.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                },
                manager: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                created_by_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        activities: true,
                        notes: true,
                    },
                },
            },
            orderBy,
            skip: offset,
            take: limitNum,
        });

        return {
            projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get project by ID
     */
    static async getProject(organizationId, projectId) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization_id: organizationId,
                deleted_at: null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true,
                    },
                },
                manager: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        profile_image: true,
                    },
                },
                created_by_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                updated_by_user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                profile_image: true,
                            },
                        },
                    },
                },
                activities: {
                    orderBy: { created_at: 'desc' },
                    take: 20,
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                notes: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                attachments: {
                    orderBy: { uploaded_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        activities: true,
                        notes: true,
                        attachments: true,
                        team_members: true,
                    },
                },
            },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        return project;
    }

    /**
     * Get project statistics
     */
    static async getProjectStats(organizationId) {
        const [
            total,
            active,
            completed,
            overdue,
            progress,
            totalBudget,
            statusDistribution,
            priorityDistribution,
            typeDistribution,
            monthlyCreation,
        ] = await Promise.all([
            // Total projects
            prisma.project.count({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
            }),
            // Active projects
            prisma.project.count({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                    status: 'active',
                },
            }),
            // Completed projects
            prisma.project.count({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                    status: 'completed',
                },
            }),
            // Overdue projects
            prisma.project.count({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                    status: 'active',
                    due_date: {
                        lt: new Date(),
                    },
                },
            }),
            // Average progress
            prisma.project.aggregate({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
                _avg: {
                    completion_percentage: true,
                },
            }),
            // Total budget
            prisma.project.aggregate({
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
                _sum: {
                    budget: true,
                },
            }),
            // Status distribution
            prisma.project.groupBy({
                by: ['status'],
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
                _count: true,
            }),
            // Priority distribution
            prisma.project.groupBy({
                by: ['priority'],
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
                _count: true,
            }),
            // Type distribution
            prisma.project.groupBy({
                by: ['project_type'],
                where: {
                    organization_id: organizationId,
                    deleted_at: null,
                    archived: false,
                },
                _count: true,
            }),
            // Monthly creation (last 6 months)
            prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    COUNT(*) as count
                FROM projects
                WHERE organization_id = ${organizationId}
                    AND deleted_at IS NULL
                    AND created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month ASC
            `,
        ]);

        return {
            total: total || 0,
            active: active || 0,
            completed: completed || 0,
            overdue: overdue || 0,
            averageProgress: Math.round(progress._avg.completion_percentage || 0),
            totalBudget: totalBudget._sum.budget || 0,
            statusDistribution,
            priorityDistribution,
            typeDistribution,
            monthlyCreation: monthlyCreation.map(item => ({
                month: item.month,
                count: Number(item.count),
            })),
        };
    }

    /**
     * Create project
     */
    static async createProject(organizationId, userId, data) {
        const {
            name,
            client_id,
            description,
            status,
            priority,
            project_type,
            department,
            health_status,
            start_date,
            due_date,
            delivery_date,
            estimated_hours,
            budget,
            color,
            billable,
            is_internal,
            project_notes,
            manager_id,
            team_member_ids = [],
        } = data;

        // Generate project code
        const projectCode = this.generateProjectCode(organizationId);
        const slug = generateSlug(name);

        // Check if name exists in organization
        const existing = await prisma.project.findFirst({
            where: {
                organization_id: organizationId,
                name,
                deleted_at: null,
            },
        });

        if (existing) {
            throw new Error('Project with this name already exists');
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                organization_id: organizationId,
                project_code: projectCode,
                name,
                slug,
                client_id: client_id || null,
                description: description || '',
                status: status || 'planning',
                priority: priority || 'medium',
                project_type: project_type || 'web_design',
                department: department || 'design',
                health_status: health_status || 'on_track',
                start_date: start_date ? new Date(start_date) : null,
                due_date: due_date ? new Date(due_date) : null,
                delivery_date: delivery_date ? new Date(delivery_date) : null,
                estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
                budget: budget ? parseFloat(budget) : null,
                color: color || '#2563EB',
                billable: billable !== undefined ? billable : true,
                is_internal: is_internal !== undefined ? is_internal : false,
                project_notes: project_notes || '',
                manager_id: manager_id || null,
                created_by: userId,
            },
        });

        // Add team members
        if (team_member_ids.length > 0) {
            await prisma.projectMember.createMany({
                data: team_member_ids.map(memberId => ({
                    project_id: project.id,
                    user_id: memberId,
                })),
            });
        }

        // Create activity log
        await prisma.projectActivity.create({
            data: {
                project_id: project.id,
                user_id: userId,
                action: 'project_created',
                description: `Project "${name}" was created`,
                metadata: {
                    project_code: projectCode,
                    status,
                    priority,
                },
            },
        });

        logger.info(`Project created: ${name} (${projectCode}) by user ${userId}`);

        return this.getProject(organizationId, project.id);
    }

    /**
     * Update project
     */
    static async updateProject(organizationId, userId, projectId, data) {
        const existing = await this.getProject(organizationId, projectId);

        if (!existing) {
            throw new Error('Project not found');
        }

        const {
            name,
            client_id,
            description,
            status,
            priority,
            project_type,
            department,
            health_status,
            start_date,
            due_date,
            delivery_date,
            estimated_hours,
            actual_hours,
            budget,
            color,
            billable,
            is_internal,
            project_notes,
            manager_id,
            completion_percentage,
            team_member_ids,
        } = data;

        // Check name uniqueness
        if (name && name !== existing.name) {
            const duplicate = await prisma.project.findFirst({
                where: {
                    organization_id: organizationId,
                    name,
                    deleted_at: null,
                    id: { not: projectId },
                },
            });

            if (duplicate) {
                throw new Error('Project with this name already exists');
            }
        }

        // Update project
        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: name || existing.name,
                client_id: client_id !== undefined ? client_id || null : existing.client_id,
                description: description !== undefined ? description : existing.description,
                status: status || existing.status,
                priority: priority || existing.priority,
                project_type: project_type || existing.project_type,
                department: department || existing.department,
                health_status: health_status || existing.health_status,
                start_date: start_date ? new Date(start_date) : existing.start_date,
                due_date: due_date ? new Date(due_date) : existing.due_date,
                delivery_date: delivery_date ? new Date(delivery_date) : existing.delivery_date,
                estimated_hours: estimated_hours !== undefined ? parseFloat(estimated_hours) : existing.estimated_hours,
                actual_hours: actual_hours !== undefined ? parseFloat(actual_hours) : existing.actual_hours,
                budget: budget !== undefined ? parseFloat(budget) : existing.budget,
                color: color || existing.color,
                billable: billable !== undefined ? billable : existing.billable,
                is_internal: is_internal !== undefined ? is_internal : existing.is_internal,
                project_notes: project_notes !== undefined ? project_notes : existing.project_notes,
                manager_id: manager_id !== undefined ? (manager_id || null) : existing.manager_id,
                completion_percentage: completion_percentage !== undefined ? parseInt(completion_percentage) : existing.completion_percentage,
                updated_by: userId,
            },
        });

        // Update team members if provided
        if (team_member_ids !== undefined) {
            // Remove all existing team members
            await prisma.projectMember.deleteMany({
                where: { project_id: projectId },
            });

            // Add new team members
            if (team_member_ids.length > 0) {
                await prisma.projectMember.createMany({
                    data: team_member_ids.map(memberId => ({
                        project_id: projectId,
                        user_id: memberId,
                    })),
                });
            }
        }

        // Create activity log
        await prisma.projectActivity.create({
            data: {
                project_id: projectId,
                user_id: userId,
                action: 'project_updated',
                description: `Project "${project.name}" was updated`,
                metadata: {
                    changes: Object.keys(data),
                },
            },
        });

        logger.info(`Project updated: ${project.name} by user ${userId}`);

        return this.getProject(organizationId, projectId);
    }

    /**
     * Archive project
     */
    static async archiveProject(organizationId, userId, projectId) {
        const project = await this.getProject(organizationId, projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        if (project.archived) {
            throw new Error('Project is already archived');
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                archived: true,
                updated_by: userId,
            },
        });

        await prisma.projectActivity.create({
            data: {
                project_id: projectId,
                user_id: userId,
                action: 'project_archived',
                description: `Project "${project.name}" was archived`,
            },
        });

        logger.info(`Project archived: ${project.name} by user ${userId}`);

        return true;
    }

    /**
     * Restore project
     */
    static async restoreProject(organizationId, userId, projectId) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        if (!project.archived) {
            throw new Error('Project is not archived');
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                archived: false,
                updated_by: userId,
            },
        });

        await prisma.projectActivity.create({
            data: {
                project_id: projectId,
                user_id: userId,
                action: 'project_restored',
                description: `Project "${project.name}" was restored`,
            },
        });

        logger.info(`Project restored: ${project.name} by user ${userId}`);

        return true;
    }

    /**
     * Delete project (soft delete)
     */
    static async deleteProject(organizationId, userId, projectId) {
        const project = await this.getProject(organizationId, projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                deleted_at: new Date(),
                updated_by: userId,
            },
        });

        await prisma.projectActivity.create({
            data: {
                project_id: projectId,
                user_id: userId,
                action: 'project_deleted',
                description: `Project "${project.name}" was deleted`,
            },
        });

        logger.info(`Project deleted: ${project.name} by user ${userId}`);

        return true;
    }

    /**
     * Bulk archive projects
     */
    static async bulkArchiveProjects(organizationId, userId, projectIds) {
        const projects = await prisma.project.updateMany({
            where: {
                id: { in: projectIds },
                organization_id: organizationId,
                deleted_at: null,
                archived: false,
            },
            data: {
                archived: true,
                updated_by: userId,
            },
        });

        logger.info(`${projects.count} projects archived by user ${userId}`);

        return projects.count;
    }

    /**
     * Bulk delete projects
     */
    static async bulkDeleteProjects(organizationId, userId, projectIds) {
        const projects = await prisma.project.updateMany({
            where: {
                id: { in: projectIds },
                organization_id: organizationId,
                deleted_at: null,
            },
            data: {
                deleted_at: new Date(),
                updated_by: userId,
            },
        });

        logger.info(`${projects.count} projects deleted by user ${userId}`);

        return projects.count;
    }
}

module.exports = ProjectService;