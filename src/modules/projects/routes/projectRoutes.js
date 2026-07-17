const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validation');
const {
    createProjectValidator,
    updateProjectValidator,
    bulkActionValidator,
} = require('../validators/projectValidator');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Project statistics (accessible by all authenticated users)
router.get('/stats', ProjectController.getProjectStats);

// Bulk actions (Organization Admin only)
router.post(
    '/bulk-archive',
    rbacMiddleware(['projects:write']),
    validate(bulkActionValidator),
    ProjectController.bulkArchiveProjects
);
router.post(
    '/bulk-delete',
    rbacMiddleware(['projects:delete']),
    validate(bulkActionValidator),
    ProjectController.bulkDeleteProjects
);

// Project CRUD operations
router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProject);

// Create project (Organization Admin only)
router.post(
    '/',
    rbacMiddleware(['projects:write']),
    validate(createProjectValidator),
    ProjectController.createProject
);

// Update project (Organization Admin only)
router.put(
    '/:id',
    rbacMiddleware(['projects:write']),
    validate(updateProjectValidator),
    ProjectController.updateProject
);

// Archive/Restore project (Organization Admin only)
router.patch(
    '/:id/archive',
    rbacMiddleware(['projects:write']),
    ProjectController.archiveProject
);
router.patch(
    '/:id/restore',
    rbacMiddleware(['projects:write']),
    ProjectController.restoreProject
);

// Delete project (Organization Admin only)
router.delete(
    '/:id',
    rbacMiddleware(['projects:delete']),
    ProjectController.deleteProject
);

// Bulk actions (Organization Admin only)
router.post(
    '/bulk-archive',
    rbacMiddleware(['projects:write']),
    validate(bulkActionValidator),
    ProjectController.bulkArchiveProjects
);
router.post(
    '/bulk-delete',
    rbacMiddleware(['projects:delete']),
    validate(bulkActionValidator),
    ProjectController.bulkDeleteProjects
);

module.exports = router;