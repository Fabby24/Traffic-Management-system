const AuthService = require('../services/authService');
const logger = require('../utils/logger');

//JWT Authentication Middleware
//Verifies token and sets user on request
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide a valid token.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Verify token
        const decoded = AuthService.verifyToken(token);
        
        // Set user on request
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            first_name: decoded.first_name,
            last_name: decoded.last_name,
            role: decoded.role,
            organization_id: decoded.organization_id,
            permissions: decoded.permissions || []
        };

        // Log user activity (optional)
        logger.debug(`Authenticated user: ${decoded.email} (${decoded.role})`);

        next();

    } catch (error) {
        logger.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;