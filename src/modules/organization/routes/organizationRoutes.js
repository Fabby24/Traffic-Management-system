const express = require('express');
const router = express.Router();
const OrganizationController = require('../controllers/organizationController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware,  PERMISSIONS } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validation');
const {
    updateOrganizationValidator,
    updateSettingsValidator,
} = require('../validators/organizationValidator');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Organization details
router.get('/', OrganizationController.getOrganization);

// Organization stats (accessible by all authenticated users)
router.get('/stats', OrganizationController.getStats);

// Update organization (Organization Admin only)
router.put(
    '/',
    rbacMiddleware([PERMISSIONS.ORG_SETTINGS_WRITE]),
    validate(updateOrganizationValidator),
    OrganizationController.updateOrganization
);

// Update logo (Organization Admin only)
router.post(
    '/logo',
    rbacMiddleware([PERMISSIONS.ORG_SETTINGS_WRITE]),
    OrganizationController.updateLogo
);

// Organization settings
router.get('/settings', OrganizationController.getSettings);
router.put(
    '/settings',
    rbacMiddleware([PERMISSIONS.ORG_SETTINGS_WRITE]),
    validate(updateSettingsValidator),
    OrganizationController.updateSettings
);

module.exports = router;