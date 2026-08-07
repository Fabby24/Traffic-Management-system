const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { rbacMiddleware } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validation');
const {
    createTaskValidator,
    updateTaskValidator,
} = require('../validators/taskValidator');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Task statistics (accessible by all authenticated users)
router.get('/stats', TaskController.getTaskStats);
router.get('/board', TaskController.getBoardStats);

// Task CRUD operations
router.get('/', TaskController.getTasks);
router.get('/:id', TaskController.getTask);

// Create task (Project Manager, Org Admin)
router.post(
    '/',
    rbacMiddleware(['tasks:write']),
    validate(createTaskValidator),
    TaskController.createTask
);

// Update task (Project Manager, assigned user, Org Admin)
router.put(
    '/:id',
    validate(updateTaskValidator),
    TaskController.updateTask
);

// Archive task (Project Manager, Org Admin)
router.patch(
    '/:id/archive',
    rbacMiddleware(['tasks:write']),
    TaskController.archiveTask
);

// Delete task (Project Manager, Org Admin)
router.delete(
    '/:id',
    rbacMiddleware(['tasks:delete']),
    TaskController.deleteTask
);

module.exports = router;