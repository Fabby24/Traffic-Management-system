const AuthService = require('../services/authService');

const auth = async (req, res, next) =>{
    try{
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide a token'
            });
        }
        const decoded = AuthService.verifyToken(token);
        req.user = decoded

        //attaching user to the request
        req.user = decoded;

        next();
    } catch(error){
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        })
    }
}

module.exports = auth