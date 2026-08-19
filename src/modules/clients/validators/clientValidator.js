const { body, param } = require('express-validator');
const {
    CLIENT_STATUS,
    CLIENT_PRIORITY,
    CONTACT_METHODS,
    INDUSTRIES,
} = require('../constants/clientConstants');

const createClientValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Client name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('company')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),

    body('website')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isURL().withMessage('Invalid URL format'),

    body('industry')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(INDUSTRIES).withMessage('Invalid industry'),

    body('status')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(Object.values(CLIENT_STATUS)).withMessage('Invalid status'),

    body('priority')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(Object.values(CLIENT_PRIORITY)).withMessage('Invalid priority'),

    body('preferred_contact')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(Object.values(CONTACT_METHODS)).withMessage('Invalid contact method'),

    body('tags')
        .optional({ nullable: true, checkFalsy: true })
        .isArray().withMessage('Tags must be an array'),

    body('tags.*')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('Each tag must be a string'),

    body('assigned_to')
        .optional({ nullable: true })
        .isString().withMessage('Invalid user ID'),
];

const updateClientValidator = [
    param('id')
        .isString().withMessage('Invalid client ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('company')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),

    body('website')
        .optional()
        .trim()
        .isURL().withMessage('Invalid URL format'),

    body('industry')
        .optional()
        .isIn(INDUSTRIES).withMessage('Invalid industry'),

    body('status')
        .optional()
        .isIn(Object.values(CLIENT_STATUS)).withMessage('Invalid status'),

    body('priority')
        .optional()
        .isIn(Object.values(CLIENT_PRIORITY)).withMessage('Invalid priority'),

    body('preferred_contact')
        .optional()
        .isIn(Object.values(CONTACT_METHODS)).withMessage('Invalid contact method'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),

    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string'),

    body('assigned_to')
        .optional({ nullable: true })
        .isString().withMessage('Invalid user ID'),
];

const updateStatusValidator = [
    param('id')
        .isString().withMessage('Invalid client ID'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(Object.values(CLIENT_STATUS)).withMessage('Status must be active or inactive'),
];

const bulkActionValidator = [
    body('clientIds')
        .isArray({ min: 1 }).withMessage('At least one client ID is required')
        .custom((value) => value.every(id => typeof id === 'string' && id.length > 0))
        .withMessage('Invalid client IDs'),

    body('status')
        .optional()
        .isIn(Object.values(CLIENT_STATUS)).withMessage('Invalid status'),
];

module.exports = {
    createClientValidator,
    updateClientValidator,
    updateStatusValidator,
    bulkActionValidator,
};