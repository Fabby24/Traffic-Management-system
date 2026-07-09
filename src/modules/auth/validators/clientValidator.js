const { body, param, query } = require('express-validator');

const clientValidators = {
    // Get all clients with filters
    getAllClients: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isString().withMessage('Search must be a string'),
        query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
        query('industry').optional().isString().withMessage('Industry must be a string'),
        query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
        query('assigned_to').optional().isInt({ min: 1 }).withMessage('Invalid user ID'),
    ],

    // Get client by ID
    getById: [
        param('id').isInt({ min: 1 }).withMessage('Invalid client ID'),
    ],

    // Create client
    createClient: [
        body('name')
            .trim()
            .notEmpty().withMessage('Client name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        
        body('company')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
        
        body('phone')
            .optional()
            .trim()
            .isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
        
        body('website')
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isURL().withMessage('Invalid URL format'),
        
        body('industry')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
        
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Invalid status'),
        
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
        
        body('preferred_contact')
            .optional()
            .isIn(['email', 'phone', 'whatsapp', 'teams', 'slack']).withMessage('Invalid contact method'),
        
        body('timezone')
            .optional()
            .isString().withMessage('Invalid timezone'),
        
        body('assigned_to')
            .optional({ nullable: true, checkFalsy: true })
            .isInt({ min: 1 }).withMessage('Invalid user ID'),
        
        body('tags')
            .optional()
            .isArray().withMessage('Tags must be an array'),
        
        body('tags.*')
            .optional()
            .isString().withMessage('Each tag must be a string'),
    ],

    // Update client
    updateClient: [
        param('id').isInt({ min: 1 }).withMessage('Invalid client ID'),
        
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
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isURL().withMessage('Invalid URL format'),
        
        body('industry')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
        
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Invalid status'),
        
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
        
        body('preferred_contact')
            .optional()
            .isIn(['email', 'phone', 'whatsapp', 'teams', 'slack']).withMessage('Invalid contact method'),
        
        body('timezone')
            .optional()
            .isString().withMessage('Invalid timezone'),
        
        body('assigned_to')
            .optional({ nullable: true, checkFalsy: true })
            .isInt({ min: 1 }).withMessage('Invalid user ID'),
        
        body('tags')
            .optional()
            .isArray().withMessage('Tags must be an array'),
        
        body('tags.*')
            .optional()
            .isString().withMessage('Each tag must be a string'),
    ],

    // Update client status
    updateStatus: [
        param('id').isInt({ min: 1 }).withMessage('Invalid client ID'),
        body('status')
            .notEmpty().withMessage('Status is required')
            .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
    ],

    // Delete client
    deleteClient: [
        param('id').isInt({ min: 1 }).withMessage('Invalid client ID'),
    ],

    // Bulk action
    bulkAction: [
        body('ids')
            .isArray({ min: 1 }).withMessage('At least one client ID is required')
            .custom((value) => value.every(id => Number.isInteger(id) && id > 0))
            .withMessage('Invalid client IDs'),
    ],
};

module.exports = clientValidators;