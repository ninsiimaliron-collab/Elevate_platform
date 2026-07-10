const express = require('express');

const controller = require('./auth.controller');
const { verifyAccessToken, verifyRefreshToken } = require('../../middleware/auth.middleware');
const { runValidation } = require('../../middleware/validate.middleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyAccountValidation
} = require('./auth.validation');

const router = express.Router();

router.post('/register', registerValidation, runValidation, controller.register);
router.post('/login', loginValidation, runValidation, controller.login);
router.post('/refresh-token', verifyRefreshToken, controller.refreshToken);
router.post('/logout', verifyAccessToken, controller.logout);
router.post('/change-password', verifyAccessToken, changePasswordValidation, runValidation, controller.changePassword);
router.post('/verify-account', verifyAccessToken, verifyAccountValidation, runValidation, controller.verifyAccount);
router.post('/forgot-password', forgotPasswordValidation, runValidation, controller.forgotPassword);
router.post('/reset-password', resetPasswordValidation, runValidation, controller.resetPassword);

module.exports = router;
