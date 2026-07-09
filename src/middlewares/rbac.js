const logger = require('../utils/logger');

//Role-Based Access Control Middleware
//Checks if user has required permissions
const rbacMiddleware = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            const userRole = req.user?.role;
            const userPermissions = req.user?.permissions || [];

            // Super admin bypass
            if (userRole === 'super_admin') {
                return next();
            }

            // If no permissions required, allow access
            if (requiredPermissions.length === 0) {
                return next();
            }

            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(
                perm => userPermissions.includes(perm)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    required: requiredPermissions,
                    user_has: userPermissions,
                    role: userRole
                });
            }

            next();

        } catch (error) {
            logger.error('RBAC middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

// Permission constants
const PERMISSIONS = {
    // User permissions
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
    USERS_DELETE: 'users:delete',
    
    // Client permissions
    CLIENTS_READ: 'clients:read',
    CLIENTS_WRITE: 'clients:write',
    CLIENTS_DELETE: 'clients:delete',
    
    // Project permissions
    PROJECTS_READ: 'projects:read',
    PROJECTS_WRITE: 'projects:write',
    PROJECTS_DELETE: 'projects:delete',
    
    // Task permissions
    TASKS_READ: 'tasks:read',
    TASKS_WRITE: 'tasks:write',
    TASKS_DELETE: 'tasks:delete',
    
    // Organization permissions
    ORG_SETTINGS_READ: 'settings:read',
    ORG_SETTINGS_WRITE: 'settings:write',
    
    // Report permissions
    REPORTS_READ: 'reports:read',
    REPORTS_WRITE: 'reports:write',
    
    // Time tracking
    TIME_READ: 'time:read',
    TIME_WRITE: 'time:write'
};

module.exports = {
    rbacMiddleware,
    PERMISSIONS
};