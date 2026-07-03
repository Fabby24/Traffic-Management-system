const User = require('../models/Usermodel');
const EmailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/db');

class UserController {
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      let conditions = [];
      let params = [];

      if (search) {
        conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0]?.total || 0;

      const usersQuery = `
        SELECT id, first_name, last_name, email, role, status, profile_image, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      const [users] = await db.execute(usersQuery, params);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { first_name, last_name, email, password, role = 'team_member', status = 'active' } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const userId = await User.createUser({ first_name, last_name, email, password, role, status });
      const user = await User.findById(userId);

      await EmailService.sendWelcomeEmail(email, first_name);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message,
      });
    }
  }

  async updateUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { first_name, last_name, role, status } = req.body;
      const userId = req.params.id;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (parseInt(userId) === req.user.id && role && role !== existingUser.role) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change your own role',
        });
      }

      await User.update(userId, {
        first_name: first_name || existingUser.first_name,
        last_name: last_name || existingUser.last_name,
        profile_image: existingUser.profile_image,
      });

      if (role && role !== existingUser.role) {
        await User.updateRole(userId, role);
      }

      if (status && status !== existingUser.status) {
        await User.updateStatus(userId, status);
      }

      const updatedUser = await User.findById(userId);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message,
      });
    }
  }

  async updateUserStatus(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status } = req.body;
      const userId = req.params.id;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (parseInt(userId) === req.user.id && status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }

      const user = await User.updateStatus(userId, status);

      res.json({
        success: true,
        message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: { user },
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message,
      });
    }
  }

  async updateUserRole(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { role } = req.body;
      const userId = req.params.id;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (parseInt(userId) === req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change your own role',
        });
      }

      const user = await User.updateRole(userId, role);

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        data: { user },
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (parseInt(userId) === req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      await User.delete(userId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message,
      });
    }
  }

  async inviteUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, role = 'team_member' } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      const tempPassword = crypto.randomBytes(8).toString('hex');

      const userId = await User.createUser({
        first_name: 'Invited',
        last_name: 'User',
        email,
        password: tempPassword,
        role,
        status: 'inactive',
      });

      const inviteLink = `${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(email)}&token=${tempPassword}`;

      await EmailService.sendInvitationEmail(email, role, inviteLink);

      res.json({
        success: true,
        message: 'Invitation sent successfully',
        data: { email, role }, 
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation',
        error: error.message,
      });
    }
  }

  async bulkStatusUpdate(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { userIds, status } = req.body;

      if (status === 'inactive' && userIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }

      await Promise.all(userIds.map(id => User.updateStatus(id, status)));

      res.json({
        success: true,
        message: `${userIds.length} users ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: { updatedCount: userIds.length },
      });
    } catch (error) {
      console.error('Error in bulk status update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update users',
        error: error.message,
      });
    }
  }

  async bulkDelete(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { userIds } = req.body;

      if (userIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      await Promise.all(userIds.map(id => User.delete(id)));

      res.json({
        success: true,
        message: `${userIds.length} users deleted successfully`,
        data: { deletedCount: userIds.length },
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete users',
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();