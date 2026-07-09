const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController')
const auth = require('../../../middlewares/auth');
const role = require('../middlewares/role');
const userValidators = require('../validators/userValidator');

router.use(auth)
router.use(role('admin'));

//user management routes
router.get('/', UserController.getAllUsers);

router.get(
    '/:id',
    userValidators.getById,
    UserController.getUserById
);

// Create a new user
router.post(
    '/',
    userValidators.createUser,
    UserController.createUser
);

//update user
router.put(
    '/:id',
    userValidators.updateUser,
    UserController.updateUser
);

router.patch(
    '/:id/status',
    userValidators.updateStatus,
    UserController.updateUserStatus
);

router.patch(
  '/:id/role',
  userValidators.updateRole,
  UserController.updateUserRole
);

router.delete(
  '/:id',
  userValidators.deleteUser,
  UserController.deleteUser
);

// invite user
router.post(
  '/invite',
  userValidators.inviteUser,
  UserController.inviteUser
);

//bulk status update
router.post(
  '/bulk-status',
  userValidators.bulkStatusUpdate,
  UserController.bulkStatusUpdate
);

//bulk delete
router.post(
  '/bulk-delete',
  userValidators.bulkDelete,
  UserController.bulkDelete
);

module.exports = router;