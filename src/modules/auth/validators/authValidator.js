const { body } = require('express-validator');

const registerValidator = [
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
    
    body('organization_name')
        .trim()
        .notEmpty().withMessage('Organization name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Organization name must be 2-100 characters'),
    
    body('organization_slug')
        .trim()
        .notEmpty().withMessage('Organization slug is required')
        .isLength({ min: 2, max: 100 }).withMessage('Organization slug must be 2-100 characters')
        .matches(/^[a-z0-9\-]+$/).withMessage('Slug can only contain lowercase letters, numbers and hyphens'),
    
    body('role')
        .optional()
        .isIn(['org_admin', 'team_member']).withMessage('Invalid role')
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
];

const resetPasswordValidator = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    
    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
];

const changePasswordValidator = [
    body('current_password')
        .notEmpty().withMessage('Current password is required'),
    
    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
];

module.exports = {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator
};