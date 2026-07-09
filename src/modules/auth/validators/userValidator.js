const { body, param, query } = require('express-validator');

const userValidators = {
  // Get all users with filters
  getAllUsers: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('role').optional().isIn(['admin', 'team_member']).withMessage('Invalid role'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  ],

  // Get user by ID
  getById: [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  ],

  // Create user
  createUser: [
    body('first_name')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('First name contains invalid characters'),
    
    body('last_name')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('Last name contains invalid characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
    
    body('role')
      .optional()
      .isIn(['admin', 'team_member']).withMessage('Invalid role'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Invalid status'),
  ],

  // Update user
  updateUser: [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('First name contains invalid characters'),
    
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('Last name contains invalid characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('role')
      .optional()
      .isIn(['admin', 'team_member']).withMessage('Invalid role'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Invalid status'),
  ],

  // Update user status
  updateStatus: [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],

  // Update user role
  updateRole: [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'team_member']).withMessage('Invalid role'),
  ],

  // Delete user
  deleteUser: [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  ],

  // Invite user
  inviteUser: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('role')
      .optional()
      .isIn(['admin', 'team_member']).withMessage('Invalid role'),
  ],

  // Bulk action
  bulkAction: [
    body('userIds')
      .isArray({ min: 1 }).withMessage('At least one user ID is required')
      .custom((value) => value.every(id => Number.isInteger(id) && id > 0))
      .withMessage('Invalid user IDs'),
  ],

  bulkStatusUpdate: [
    body('userIds')
      .isArray({ min: 1 }).withMessage('At least one user ID is required')
      .custom((value) => value.every(id => Number.isInteger(id) && id > 0))
      .withMessage('Invalid user IDs'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],

  bulkDelete: [
    body('userIds')
      .isArray({ min: 1 }).withMessage('At least one user ID is required')
      .custom((value) => value.every(id => Number.isInteger(id) && id > 0))
      .withMessage('Invalid user IDs'),
  ],
};

module.exports = userValidators;