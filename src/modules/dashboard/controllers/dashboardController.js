const { prisma } = require('../../../config/database');
const logger = require('../../../utils/logger');

class DashboardController {

    async getSuperAdminStats(req, res) {
        try {
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const [orgCounts] = await prisma.$queryRaw`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= ${startOfMonth} THEN 1 END) as this_month,
                    COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} THEN 1 END) as last_month
                FROM organizations
                WHERE deleted_at IS NULL
            `;

            const [userCounts] = await prisma.$queryRaw`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= ${startOfMonth} THEN 1 END) as this_month,
                    COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} THEN 1 END) as last_month
                FROM users
                WHERE deleted_at IS NULL
            `;

            const [clientCounts] = await prisma.$queryRaw`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= ${startOfMonth} THEN 1 END) as this_month,
                    COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} THEN 1 END) as last_month
                FROM clients
                WHERE deleted_at IS NULL
            `;

            const [projectCounts] = await prisma.$queryRaw`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= ${startOfMonth} THEN 1 END) as this_month,
                    COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} THEN 1 END) as last_month
                FROM projects
                WHERE deleted_at IS NULL
            `;

            const [taskCounts] = await prisma.$queryRaw`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= ${startOfMonth} THEN 1 END) as this_month,
                    COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} THEN 1 END) as last_month
                FROM tasks
                WHERE deleted_at IS NULL
            `;

            const [activeOrgs] = await prisma.$queryRaw`
                SELECT COUNT(*) as count
                FROM organizations
                WHERE status = 'active' AND deleted_at IS NULL
            `;

            const recentOrganizations = await prisma.organization.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    created_at: true,
                    _count: {
                        select: { users: { where: { deleted_at: null } } },
                    },
                },
            });

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const growthData = await prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('day', created_at) as date,
                    COUNT(*) as count
                FROM organizations
                WHERE created_at >= ${thirtyDaysAgo} AND deleted_at IS NULL
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date ASC
            `;

            const recentActivity = await prisma.auditLog.findMany({
                orderBy: { created_at: 'desc' },
                take: 15,
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });

            const stats = {
                organizations: {
                    total: Number(orgCounts.total),
                    thisMonth: Number(orgCounts.this_month),
                    lastMonth: Number(orgCounts.last_month),
                },
                users: {
                    total: Number(userCounts.total) || 0,
                    thisMonth: Number(userCounts.this_month) || 0,
                    lastMonth: Number(userCounts.last_month) || 0,
                },
                clients: {
                    total: Number(clientCounts.total) || 0,
                    thisMonth: Number(clientCounts.this_month) || 0,
                    lastMonth: Number(clientCounts.last_month) || 0,
                },
                projects: {
                    total: Number(projectCounts.total) || 0,
                    thisMonth: Number(projectCounts.this_month) || 0,
                    lastMonth: Number(projectCounts.last_month) || 0,
                },
                tasks: {
                    total: Number(taskCounts.total) || 0,
                    thisMonth: Number(taskCounts.this_month) || 0,
                    lastMonth: Number(taskCounts.last_month) || 0,
                },
                activeOrganizations: Number(activeOrgs.count) || 0,
                recentOrganizations: recentOrganizations.map(org => ({
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    plan: 'free',
                    status: org.status,
                    userCount: org._count.users,
                    createdAt: org.created_at,
                })),
                growthData: growthData.map(item => ({
                    date: item.date,
                    count: Number(item.count) || 0,
                })),
                recentActivity: recentActivity.map(log => ({
                    id: log.id,
                    action: log.action,
                    entityType: log.entity_type,
                    entityId: log.entity_id,
                    createdAt: log.created_at,
                    user: log.user ? {
                        firstName: log.user.first_name,
                        lastName: log.user.last_name,
                        email: log.user.email,
                    } : null,
                })),
            };

            res.json({ success: true, data: stats });

        } catch (error) {
            logger.error('Super admin dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
                error: error.message,
            });
        }
    }

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
                prisma.project.findMany({
                    where: { organization_id: organizationId, deleted_at: null, archived: false },
                    orderBy: { updated_at: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        project_code: true,
                        priority: true,
                        completion_percentage: true,
                        due_date: true,
                        color: true,
                        created_at: true,
                    }
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
                    where: { assigned_to: userId, deleted_at: null },
                }),
                prisma.task.count({
                    where: { assigned_to: userId, status: 'completed', deleted_at: null },
                }),
                prisma.task.count({
                    where: { assigned_to: userId, status: 'in_progress', deleted_at: null },
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
                    include: { project: { select: { name: true } } },
                }),
                prisma.timeLog.aggregate({
                    where: {
                        user_id: userId,
                        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    },
                    _sum: { hours: true },
                }),
                prisma.task.findMany({
                    where: { assigned_to: userId, deleted_at: null },
                    orderBy: { updated_at: 'desc' },
                    take: 5,
                    include: { project: { select: { name: true } } },
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