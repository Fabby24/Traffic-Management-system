const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class ProjectMemberService {
    /**
     * Add member to project
     */
    static async addMember(organizationId, userId, projectId, memberUserId, role = 'team_member') {
        // Verify project exists
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

        // Verify user exists and belongs to organization
        const user = await prisma.user.findFirst({
            where: {
                id: memberUserId,
                organization_id: organizationId,
                deleted_at: null,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if already a member
        const existing = await prisma.projectMember.findFirst({
            where: {
                project_id: projectId,
                user_id: memberUserId,
            },
        });

        if (existing) {
            throw new Error('User is already a member of this project');
        }

        // Add member
        const member = await prisma.projectMember.create({
            data: {
                project_id: projectId,
                user_id: memberUserId,
                role: role,
                invitation_status: 'accepted',
                invited_by: userId,
                joined_at: new Date(),
            },
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
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'project_member_added',
                entity_type: 'project',
                entity_id: projectId,
                changes: {
                    user_id: memberUserId,
                    role: role,
                },
            },
        });

        logger.info(`User ${memberUserId} added to project ${projectId} as ${role}`);

        return member;
    }

    /**
     * Remove member from project
     */
    static async removeMember(organizationId, userId, projectId, memberUserId) {
        const member = await prisma.projectMember.findFirst({
            where: {
                project_id: projectId,
                user_id: memberUserId,
            },
            include: {
                project: true,
            },
        });

        if (!member) {
            throw new Error('Member not found');
        }

        // Prevent removing the last project manager
        const projectManagers = await prisma.projectMember.count({
            where: {
                project_id: projectId,
                role: 'project_manager',
            },
        });

        if (member.role === 'project_manager' && projectManagers <= 1) {
            throw new Error('Cannot remove the last project manager. Assign another project manager first.');
        }

        await prisma.projectMember.delete({
            where: {
                project_id_user_id: {
                    project_id: projectId,
                    user_id: memberUserId,
                },
            },
        });

        // Reassign tasks if removing a project manager
        if (member.role === 'project_manager') {
            // Optionally reassign tasks to another project manager
            const newManager = await prisma.projectMember.findFirst({
                where: {
                    project_id: projectId,
                    role: 'project_manager',
                    user_id: { not: memberUserId },
                },
            });

            // Log the removal
            await prisma.auditLog.create({
                data: {
                    organization_id: organizationId,
                    user_id: userId,
                    action: 'project_member_removed',
                    entity_type: 'project',
                    entity_id: projectId,
                    changes: {
                        user_id: memberUserId,
                        role: member.role,
                    },
                },
            });
        }

        logger.info(`User ${memberUserId} removed from project ${projectId}`);

        return true;
    }

    /**
     * Update member role
     */
    static async updateMemberRole(organizationId, userId, projectId, memberUserId, newRole) {
        const member = await prisma.projectMember.findFirst({
            where: {
                project_id: projectId,
                user_id: memberUserId,
            },
        });

        if (!member) {
            throw new Error('Member not found');
        }

        // Prevent removing the last project manager
        if (member.role === 'project_manager' && newRole !== 'project_manager') {
            const projectManagers = await prisma.projectMember.count({
                where: {
                    project_id: projectId,
                    role: 'project_manager',
                },
            });

            if (projectManagers <= 1) {
                throw new Error('Cannot remove the last project manager. Assign another project manager first.');
            }
        }

        const updated = await prisma.projectMember.update({
            where: {
                project_id_user_id: {
                    project_id: projectId,
                    user_id: memberUserId,
                },
            },
            data: {
                role: newRole,
            },
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
        });

        await prisma.auditLog.create({
            data: {
                organization_id: organizationId,
                user_id: userId,
                action: 'project_member_role_updated',
                entity_type: 'project',
                entity_id: projectId,
                changes: {
                    user_id: memberUserId,
                    old_role: member.role,
                    new_role: newRole,
                },
            },
        });

        logger.info(`User ${memberUserId} role updated to ${newRole} in project ${projectId}`);

        return updated;
    }

    /**
     * Get project members
     */
    static async getProjectMembers(organizationId, projectId) {
        const members = await prisma.projectMember.findMany({
            where: {
                project_id: projectId,
                invitation_status: 'accepted',
            },
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
            orderBy: [
                { role: 'asc' },
                { joined_at: 'asc' },
            ],
        });

        return members;
    }

    /**
     * Get projects for a user
     */
    static async getUserProjects(organizationId, userId, role = null) {
        const where = {
            user_id: userId,
            invitation_status: 'accepted',
        };

        if (role) {
            where.role = role;
        }

        const memberships = await prisma.projectMember.findMany({
            where,
            include: {
                project: {
                    include: {
                        _count: {
                            select: {
                                tasks: {
                                    where: {
                                        deleted_at: null,
                                        status: { not: 'archived' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                joined_at: 'desc',
            },
        });

        return memberships.map(m => ({
            ...m.project,
            role: m.role,
            joined_at: m.joined_at,
            taskCount: m.project._count.tasks,
        }));
    }

    /**
     * Check if user is project manager
     */
    static async isProjectManager(organizationId, projectId, userId) {
        const member = await prisma.projectMember.findFirst({
            where: {
                project_id: projectId,
                user_id: userId,
                role: 'project_manager',
                invitation_status: 'accepted',
            },
        });

        return !!member;
    }

    /**
     * Get project manager for a project
     */
    static async getProjectManagers(organizationId, projectId) {
        const managers = await prisma.projectMember.findMany({
            where: {
                project_id: projectId,
                role: 'project_manager',
                invitation_status: 'accepted',
            },
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
        });

        return managers;
    }
}

module.exports = ProjectMemberService;