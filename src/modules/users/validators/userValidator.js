const { body, param, query } = require('express-validator');

const inviteUserValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(['org_admin', 'team_member']).withMessage('Invalid role'),
];

const acceptInviteValidator = [
    body('token')
        .notEmpty().withMessage('Invitation token is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
    body('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
];

const updateUserValidator = [
    param('id').isString().withMessage('Invalid user ID'),
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('role')
        .optional()
        .isIn(['org_admin', 'team_member']).withMessage('Invalid role'),
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const updateStatusValidator = [
    param('id').isString().withMessage('Invalid user ID'),
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const bulkActionValidator = [
    body('userIds')
        .isArray({ min: 1 }).withMessage('At least one user ID is required'),
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

module.exports = {
    inviteUserValidator,
    acceptInviteValidator,
    updateUserValidator,
    updateStatusValidator,
    bulkActionValidator,
};