const { body, param, query } = require('express-validator');

const createProjectValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 2, max: 200 }).withMessage('Project name must be 2-200 characters'),

    body('client_id')
        .optional()
        .isString().withMessage('Invalid client ID'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),

    body('status')
        .optional()
        .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
        .withMessage('Invalid project status'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority'),

    body('project_type')
        .optional()
        .isIn(['branding', 'web_design', 'social_media', 'video_production', 'print', 'marketing_campaign', 'ui_ux', 'photography', 'content_creation', 'other'])
        .withMessage('Invalid project type'),

    body('department')
        .optional()
        .isIn(['design', 'development', 'marketing', 'content', 'strategy', 'other'])
        .withMessage('Invalid department'),

    body('health_status')
        .optional()
        .isIn(['on_track', 'at_risk', 'delayed'])
        .withMessage('Invalid health status'),

    body('start_date')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),

    body('due_date')
        .optional()
        .isISO8601().withMessage('Invalid due date format'),

    body('delivery_date')
        .optional()
        .isISO8601().withMessage('Invalid delivery date format'),

    body('estimated_hours')
        .optional()
        .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

    body('budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

    body('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    body('billable')
        .optional()
        .isBoolean().withMessage('Billable must be true or false'),

    body('is_internal')
        .optional()
        .isBoolean().withMessage('Internal must be true or false'),

    body('project_notes')
        .optional()
        .trim(),

    body('manager_id')
        .optional()
        .isString().withMessage('Invalid manager ID'),

    body('team_member_ids')
        .optional()
        .isArray().withMessage('Team member IDs must be an array'),
];

const updateProjectValidator = [
    param('id')
        .isString().withMessage('Invalid project ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Project name must be 2-200 characters'),

    body('client_id')
        .optional()
        .isString().withMessage('Invalid client ID'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),

    body('status')
        .optional()
        .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
        .withMessage('Invalid project status'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority'),

    body('project_type')
        .optional()
        .isIn(['branding', 'web_design', 'social_media', 'video_production', 'print', 'marketing_campaign', 'ui_ux', 'photography', 'content_creation', 'other'])
        .withMessage('Invalid project type'),

    body('department')
        .optional()
        .isIn(['design', 'development', 'marketing', 'content', 'strategy', 'other'])
        .withMessage('Invalid department'),

    body('health_status')
        .optional()
        .isIn(['on_track', 'at_risk', 'delayed'])
        .withMessage('Invalid health status'),

    body('start_date')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),

    body('due_date')
        .optional()
        .isISO8601().withMessage('Invalid due date format'),

    body('delivery_date')
        .optional()
        .isISO8601().withMessage('Invalid delivery date format'),

    body('estimated_hours')
        .optional()
        .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

    body('actual_hours')
        .optional()
        .isFloat({ min: 0 }).withMessage('Actual hours must be a positive number'),

    body('budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

    body('completion_percentage')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be 0-100'),

    body('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    body('billable')
        .optional()
        .isBoolean().withMessage('Billable must be true or false'),

    body('is_internal')
        .optional()
        .isBoolean().withMessage('Internal must be true or false'),

    body('project_notes')
        .optional()
        .trim(),

    body('manager_id')
        .optional()
        .isString().withMessage('Invalid manager ID'),

    body('team_member_ids')
        .optional()
        .isArray().withMessage('Team member IDs must be an array'),
];

const bulkActionValidator = [
    body('projectIds')
        .isArray({ min: 1 }).withMessage('At least one project ID is required')
        .custom((value) => value.every(id => typeof id === 'string' && id.length > 0))
        .withMessage('Invalid project IDs'),
];

module.exports = {
    createProjectValidator,
    updateProjectValidator,
    bulkActionValidator,
};