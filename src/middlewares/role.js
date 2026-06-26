const role = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            })
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        //checking if user role is allowed
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions. Access denied'
            })
        }

        next();
    }
}
module.exports = role;