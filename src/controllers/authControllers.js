const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const { validationResult } = require('express-validator');

class AuthController{
    //register a new user
    async register(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try {
            const {first_name, last_name, email, password, role} = req.body;
            const {user, token} = await AuthService.register({
                first_name,
                last_name,
                email,
                password,
                role: role || 'team_member'
            });

            //sending welcome email
            EmailService.sendWelcomeEmail(email, first_name);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {user, token}
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //login user
    async login(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try {
            const {email, password} = req.body;
            const {user, token} = await AuthService.login(email, password);
            res.json({
                success: true,
                message: 'Login successful',
                data: {user, token}
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            })
        }
    }

    // request password reset
    async forgotPassword(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try{
            const {email} = req.body;
            const {user, token} = await AuthService.requestPasswordReset(email);

            await EmailService.sendPasswordResetEmail(email, user.first_name, token);

            res.json({
                success: true,
                message: 'Password reset email sent successfully',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // resetting password
    async resetPassword(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try {
            const {token, newPassword} = req.body;
            await AuthService.resetPassword(token, newPassword);
            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //getting user profile
    async getProfile(req, res) {
        try {
            const user = await AuthService.getProfile(req.user.id);

            res.json({
                success: true,
                data: { user }
            })
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            })
        }
    }

    //update user profile
    async updateProfile(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        } try {
            const {first_name, last_name, profile_image} = req.body;
            const user = await AuthService.updateProfile(req.user.id, {first_name, last_name, profile_image});
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();