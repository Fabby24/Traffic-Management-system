const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController')
const auth = require('../middlewares/auth');
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

module.exports = router;