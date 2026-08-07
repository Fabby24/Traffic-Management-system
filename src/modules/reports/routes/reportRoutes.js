const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Report endpoints (Organization Admin only)
router.use(rbacMiddleware(['reports:read']));

// Project report
router.get('/projects', ReportController.getProjectReport);

// Task report
router.get('/tasks', ReportController.getTaskReport);

// Time report
router.get('/time', ReportController.getTimeReport);

// Client report
router.get('/clients', ReportController.getClientReport);

// Dashboard analytics
router.get('/analytics', ReportController.getDashboardAnalytics);

module.exports = router;