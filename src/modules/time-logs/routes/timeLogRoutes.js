const express = require('express');
const router = express.Router();
const TimeLogController = require('../controllers/timeLogController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { validate } = require('../../../middlewares/validation');
const {
    startTimerValidator,
    stopTimerValidator,
} = require('../validators/timeLogValidator');

// All routes require authentication
router.use(authMiddleware);
router.use(tenantMiddleware);

// Get time logs
router.get('/', TimeLogController.getTimeLogs);

// Daily summary
router.get('/summary/daily', TimeLogController.getDailySummary);

// Weekly summary
router.get('/summary/weekly', TimeLogController.getWeeklySummary);

// Start timer
router.post('/start', validate(startTimerValidator), TimeLogController.startTimer);

// Stop timer
router.post('/stop', validate(stopTimerValidator), TimeLogController.stopTimer);

// Pause timer
router.post('/pause', validate(stopTimerValidator), TimeLogController.pauseTimer);

// Resume timer
router.post('/resume', validate(stopTimerValidator), TimeLogController.resumeTimer);

// Update time log
router.put('/:id', TimeLogController.updateTimeLog);

// Delete time log
router.delete('/:id', TimeLogController.deleteTimeLog);

module.exports = router;