const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authControllers');
const authMiddleware = require('../../../middlewares/auth');
const tenantMiddleware = require('../../../middlewares/tenant');
const { validate } = require('../../../middlewares/validation');
const passport = require('../../../config/passport');
const {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator
} = require('../validators/authValidator');


// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        session: false,
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    }),
    AuthController.googleCallback
);

// Public routes
router.post(
    '/register',
    validate(registerValidator),
    AuthController.register
);

router.post(
    '/login',
    validate(loginValidator),
    AuthController.login
);

router.post(
    '/forgot-password',
    validate(forgotPasswordValidator),
    AuthController.forgotPassword
);

router.post(
    '/reset-password',
    validate(resetPasswordValidator),
    AuthController.resetPassword
);

// Protected routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/profile', AuthController.getProfile);
router.post('/change-password', validate(changePasswordValidator), AuthController.changePassword);
router.post('/logout', AuthController.logout);

module.exports = router;