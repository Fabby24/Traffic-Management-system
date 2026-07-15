const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class DashboardController {
    /**
     * Get Super Admin Dashboard Stats
     * GET /api/v1/dashboard/super-admin
     */
    async getSuperAdminStats(req, res) {
        try {
            // Only super admin can access
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }

            const [
                totalOrganizations,
                totalUsers,
                totalClients,
                totalProjects,
                totalTasks,
                activeOrganizations,
                recentOrganizations,
            ] = await Promise.all([
                prisma.organization.count({ where: { deleted_at: null } }),
                prisma.user.count({ where: { deleted_at: null } }),
                prisma.client.count({ where: { deleted_at: null } }),
                prisma.project.count({ where: { deleted_at: null } }),
                prisma.task.count({ where: { deleted_at: null } }),
                prisma.organization.count({ where: { status: 'active', deleted_at: null } }),
                prisma.organization.findMany({
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                    take: 5,
                    include: {
                        _count: {
                            select: { users: true, projects: true },
                        },
                    },
                }),
            ]);

            // Organization growth over time (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const orgGrowth = await prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    COUNT(*) as count
                FROM organizations
                WHERE created_at >= ${sixMonthsAgo}
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month ASC
            `;

            res.json({
                success: true,
                data: {
                    totalOrganizations,
                    totalUsers,
                    totalClients,
                    totalProjects,
                    totalTasks,
                    activeOrganizations,
                    recentOrganizations,
                    organizationGrowth: orgGrowth,
                },
            });
        } catch (error) {
            logger.error('Super admin dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
            });
        }
    }

    /**
     * Get Organization Admin Dashboard Stats
     * GET /api/v1/dashboard/admin
     */
    async getAdminStats(req, res) {
        try {
            const organizationId = req.user.organization_id;

            const [
                totalUsers,
                totalClients,
                totalProjects,
                totalTasks,
                completedTasks,
                totalTimeLogged,
                recentActivity,
                taskStatusDistribution,
            ] = await Promise.all([
                prisma.user.count({
                    where: { organization_id: organizationId, deleted_at: null },
                }),
                prisma.client.count({
                    where: { organization_id: organizationId, deleted_at: null },
                }),
                prisma.project.count({
                    where: { organization_id: organizationId, deleted_at: null },
                }),
                prisma.task.count({
                    where: { organization_id: organizationId, deleted_at: null },
                }),
                prisma.task.count({
                    where: {
                        organization_id: organizationId,
                        status: 'completed',
                        deleted_at: null,
                    },
                }),
                prisma.timeLog.aggregate({
                    where: { organization_id: organizationId },
                    _sum: { hours: true },
                }),
                prisma.auditLog.findMany({
                    where: { organization_id: organizationId },
                    orderBy: { created_at: 'desc' },
                    take: 10,
                    include: {
                        user: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                }),
                prisma.task.groupBy({
                    by: ['status'],
                    where: { organization_id: organizationId, deleted_at: null },
                    _count: true,
                }),
            ]);

            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalClients,
                    totalProjects,
                    totalTasks,
                    completedTasks,
                    totalTimeLogged: totalTimeLogged._sum.hours || 0,
                    recentActivity,
                    taskStatusDistribution,
                },
            });
        } catch (error) {
            logger.error('Admin dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
            });
        }
    }

    /**
     * Get Team Member Dashboard Stats
     * GET /api/v1/dashboard/team
     */
    async getTeamStats(req, res) {
        try {
            const userId = req.user.user_id;
            const organizationId = req.user.organization_id;

            const [
                assignedTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                upcomingDeadlines,
                timeLoggedToday,
                recentTasks,
            ] = await Promise.all([
                prisma.task.count({
                    where: {
                        assigned_to: userId,
                        deleted_at: null,
                    },
                }),
                prisma.task.count({
                    where: {
                        assigned_to: userId,
                        status: 'completed',
                        deleted_at: null,
                    },
                }),
                prisma.task.count({
                    where: {
                        assigned_to: userId,
                        status: 'in_progress',
                        deleted_at: null,
                    },
                }),
                prisma.task.count({
                    where: {
                        assigned_to: userId,
                        due_date: { lt: new Date() },
                        status: { not: 'completed' },
                        deleted_at: null,
                    },
                }),
                prisma.task.findMany({
                    where: {
                        assigned_to: userId,
                        due_date: {
                            gte: new Date(),
                            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                        deleted_at: null,
                    },
                    orderBy: { due_date: 'asc' },
                    take: 5,
                    include: {
                        project: { select: { name: true } },
                    },
                }),
                prisma.timeLog.aggregate({
                    where: {
                        user_id: userId,
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        },
                    },
                    _sum: { hours: true },
                }),
                prisma.task.findMany({
                    where: {
                        assigned_to: userId,
                        deleted_at: null,
                    },
                    orderBy: { updated_at: 'desc' },
                    take: 5,
                    include: {
                        project: { select: { name: true } },
                    },
                }),
            ]);

            res.json({
                success: true,
                data: {
                    assignedTasks,
                    completedTasks,
                    inProgressTasks,
                    overdueTasks,
                    upcomingDeadlines,
                    timeLoggedToday: timeLoggedToday._sum.hours || 0,
                    recentTasks,
                },
            });
        } catch (error) {
            logger.error('Team dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
            });
        }
    }
}

module.exports = new DashboardController();