const { body } = require('express-validator');

const updateOrganizationValidator = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('logo')
        .optional()
        .isURL().withMessage('Logo must be a valid URL'),

    body('contact_email')
        .optional()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('timezone')
        .optional()
        .isString().withMessage('Invalid timezone'),
];

const updateSettingsValidator = [
    body('brand_color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    body('brand_secondary')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    body('logo_url')
        .optional()
        .isURL().withMessage('Logo URL must be a valid URL'),

    body('favicon_url')
        .optional()
        .isURL().withMessage('Favicon URL must be a valid URL'),

    body('allow_self_registration')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('require_email_verification')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('allow_google_auth')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('allow_microsoft_auth')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('task_assignment_email')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('task_deadline_reminder')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('project_update_email')
        .optional()
        .isBoolean().withMessage('Must be true or false'),

    body('currency')
        .optional()
        .isString().withMessage('Invalid currency'),
];

module.exports = {
    updateOrganizationValidator,
    updateSettingsValidator,
};