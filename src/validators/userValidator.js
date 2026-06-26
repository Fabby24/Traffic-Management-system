const { body, param } = require('express-validator');

const userValidators = {
  
  // Update user status validation
  updateStatus: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID'),
    
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
  ],

  //Update user role validation
  updateRole: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID'),
    
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'team_member']).withMessage('Invalid role')
  ],

  //Get user by ID validation
  getById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID')
  ],

  //Delete user validation
  deleteUser: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID')
  ]
};

module.exports = userValidators;