const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');

// All routes require authentication
router.use(authMiddleware);
router.use(tenantMiddleware);

// Super Admin Dashboard
router.get(
    '/super-admin',
    rbacMiddleware(['organizations:read']),
    DashboardController.getSuperAdminStats
);

// Organization Admin Dashboard
router.get(
    '/admin',
    rbacMiddleware(['clients:read', 'projects:read']),
    DashboardController.getAdminStats
);

// Team Member Dashboard
router.get(
    '/team',
    rbacMiddleware(['tasks:read']),
    DashboardController.getTeamStats
);

module.exports = router;