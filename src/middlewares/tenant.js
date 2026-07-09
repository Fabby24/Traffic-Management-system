const { prisma } = require('../config/database');
const logger = require('../utils/logger');

//Tenant Resolution Middleware
//Sets organization context for each request
 
const tenantMiddleware = async (req, res, next) => {
    try {
        const publicRoutes = [
            '/api/v1/auth/login',
            '/api/v1/auth/register',
            '/api/v1/auth/forgot-password',
            '/api/v1/auth/reset-password',
            '/health',
            '/'
        ];

        if (publicRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }

        // Get organization from JWT (set by auth middleware)
        const organizationId = req.user?.organization_id;
        
        if (!organizationId) {
            return res.status(401).json({
                success: false,
                message: 'Organization context required'
            });
        }

        // Fetch organization with validation
        const organization = await prisma.organization.findFirst({
            where: {
                id: organizationId,
                status: 'active',
                deleted_at: null
            },
            include: {
                organization_settings: true
            }
        });

        if (!organization) {
            return res.status(401).json({
                success: false,
                message: 'Organization not found or inactive'
            });
        }

        // Set organization context on request
        req.tenant = {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            settings: organization.organization_settings || {},
            theme: organization.theme || {},
            timezone: organization.timezone || 'UTC'
        };

        // Set PostgreSQL session variables for RLS
        await prisma.$executeRaw`
            SELECT set_config('app.current_tenant_id', ${organization.id}::text, false)
        `;
        await prisma.$executeRaw`
            SELECT set_config('app.current_user_id', ${req.user.user_id}::text, false)
        `;
        await prisma.$executeRaw`
            SELECT set_config('app.current_user_role', ${req.user.role}::text, false)
        `;

        next();

    } catch (error) {
        logger.error('Tenant middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resolve tenant context'
        });
    }
};

module.exports = tenantMiddleware;