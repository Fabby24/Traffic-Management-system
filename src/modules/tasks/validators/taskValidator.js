const { body, param, query } = require('express-validator');
const { TASK_STATUS, TASK_PRIORITY } = require('../constants/taskContants');

const createTaskValidator = [
    body('project_id')
        .isString().withMessage('Project ID is required'),

    body('title')
        .trim()
        .notEmpty().withMessage('Task title is required')
        .isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),

    body('description')
        .optional({ nullable: true})
        .trim()
        .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),

    body('status')
        .optional({ nullable: true})
        .isIn(Object.values(TASK_STATUS)).withMessage('Invalid task status'),

    body('priority')
        .optional({ nullable: true})
        .isIn(Object.values(TASK_PRIORITY)).withMessage('Invalid priority'),

    body('estimated_hours')
        .optional({ nullable: true})
        .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

    body('due_date')
        .optional({ nullable: true})
        .isISO8601().withMessage('Invalid due date format'),

    body('assigned_to')
        .optional({ nullable: true})
        .isString().withMessage('Invalid user ID'),

    body('parent_task_id')
        .optional({ nullable: true})
        .isString().withMessage('Invalid parent task ID'),
];

const updateTaskValidator = [
    param('id')
        .isString().withMessage('Invalid task ID'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),

    body('status')
        .optional({ nullable: true})
        .isIn(Object.values(TASK_STATUS)).withMessage('Invalid task status'),

    body('priority')
        .optional({ nullable: true})
        .isIn(Object.values(TASK_PRIORITY)).withMessage('Invalid priority'),

    body('estimated_hours')
        .optional({ nullable: true})
        .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

    body('actual_hours')
        .optional({ nullable: true})
        .isFloat({ min: 0 }).withMessage('Actual hours must be a positive number'),

    body('progress')
        .optional({ nullable: true})
        .isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),

    body('due_date')
        .optional({ nullable: true})
        .isISO8601().withMessage('Invalid due date format'),

    body('assigned_to')
        .optional()
        .isString().withMessage('Invalid user ID'),

    body('feedback')
        .optional({ nullable: true})
        .trim(),

    body('blocked_reason')
        .optional({ nullable: true})
        .trim(),
];

module.exports = {
    createTaskValidator,
    updateTaskValidator,
};