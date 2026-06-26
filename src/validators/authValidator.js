const { body } = require('express-validator');

// registration validation rules
const authValidators = {
  register: [
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
      .isIn(['admin', 'team_member']).withMessage('Invalid role')
  ],

  // login validation rules
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  // Forgot password validation rules
  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail()
  ],

  //Reset password validation rules
  resetPassword: [
    body('token')
      .notEmpty().withMessage('Reset token is required'),
    
    body('new_password')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
  ],

  // Update profile validation rules
  updateProfile: [
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('First name contains invalid characters'),
    
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s\-']+$/).withMessage('Last name contains invalid characters')
  ]
};

module.exports = authValidators;