const User = require('../models/Usermodel');
const jwt = require('jsonwebtoken');
const PasswordResetToken = require('../models/PasswordResetTokenmodel');

class AuthService {
    //registering a new user
    static async register(userData) {
        //check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        //create user
        const userId = await User.createUser(userData);

        const user = await User.findById(userId);

        //generate token
        const token = this.generateToken(user);
        return { user, token };
    }

    //login user
    static async login(email, password) {
        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (user.status !== 'active') {
            throw new Error('Account is inactive. Please contact admin for activation');
        }

        //verify password
        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        delete user.password; 

        //generate token
        const token = this.generateToken(user);
        return { user, token };
    }

    //generate JWT token
    static generateToken(user) {
        return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    }

    //verify jwt token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    //request password reset
    static async requestPasswordReset(email) {
        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        const token = await PasswordResetToken.create(user.id);
        return {user, token};
    }

    //reset password
    static async resetPassword(token, newPassword) {
        const resetToken = await PasswordResetToken.findByToken(token);
        if (!resetToken) {
            throw new Error('Invalid or expired password reset token');
        }

        await User.updatePassword(resetToken.user_id, newPassword);

        //delete used token
        await PasswordResetToken.delete(token);
        return true;
    }

    //getting user profile
    static async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
         return user;
    }

    //updating user profile
    static async updateProfile(userId, updatedData) {
        const user = await User.update(userId, updatedData);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}
module.exports = AuthService;