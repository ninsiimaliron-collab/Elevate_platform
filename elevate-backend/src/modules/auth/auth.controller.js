const { success } = require('../../utils/apiResponse');
const authService = require('./auth.service');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    success(
      res,
      {
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        verificationRequired: result.user.role === 'youth'
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    success(
      res,
      {
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        passwordResetRequired: result.passwordResetRequired || false
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.refreshToken;
    const payload = req.refreshPayload;
    const result = await authService.refreshToken(token, payload);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    success(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.cookies?.refreshToken) {
      await authService.logout(req.user.sub, req.cookies.refreshToken);
    }
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    await authService.changePassword(req.user.sub, newPassword);
    success(res, null, 'Password changed successfully', 200);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    success(res, null, 'If the email exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    success(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

const verifyAccount = async (req, res, next) => {
  try {
    const data = await authService.verifyAccount(req.user.sub, req.body.password);
    success(res, data, data.alreadyVerified ? 'Your account is already verified' : 'Profile verification completed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyAccount,
  changePassword
};
