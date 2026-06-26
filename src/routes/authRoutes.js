const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authControllers');
const auth = require('../middlewares/auth');
const authValidators = require('../validators/authValidator');

//public routes
router.post(
    '/register',
    authValidators.register,
    AuthController.register
);

router.post(
    '/login',
    authValidators.login,
    AuthController.login
);

router.post(
    '/forgot-password',
    authValidators.forgotPassword,
    AuthController.forgotPassword
);

router.post(
    '/reset-password',
    authValidators.resetPassword,
    AuthController.resetPassword
);

//protected routes
router.get(
    '/profile',
    auth,
    AuthController.getProfile
)

router.put(
    '/profile',
    auth,
    authValidators.updateProfile,
    AuthController.updateProfile
);

module.exports = router;