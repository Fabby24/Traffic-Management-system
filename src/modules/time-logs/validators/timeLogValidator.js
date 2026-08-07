const { body } = require('express-validator');

const startTimerValidator = [
    body('task_id')
        .notEmpty().withMessage('Task ID is required')
        .isString().withMessage('Invalid task ID'),
];

const stopTimerValidator = [
    body('time_log_id')
        .notEmpty().withMessage('Time log ID is required')
        .isString().withMessage('Invalid time log ID'),
];

module.exports = {
    startTimerValidator,
    stopTimerValidator,
};