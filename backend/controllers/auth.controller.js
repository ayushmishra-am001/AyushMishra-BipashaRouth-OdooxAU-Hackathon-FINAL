const authService = require('../services/auth.service');
const { validateSignup, validateLogin, validateVerifyEmail, validateForgotPassword, validateResetPassword } = require('../validators/auth.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  validateSignup(req.body);
  const { user, token, message } = await authService.register(req.body);
  success(res, 201, { user, token }, message);
});

const verifyEmail = asyncHandler(async (req, res) => {
  validateVerifyEmail(req.body);
  const result = await authService.verifyEmail(req.body.token);
  success(res, 200, {}, result.message);
});

const login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const { user, token } = await authService.login(req.body);
  success(res, 200, { user, token }, 'Login successful');
});

const forgotPassword = asyncHandler(async (req, res) => {
  validateForgotPassword(req.body);
  const result = await authService.forgotPassword(req.body.email);
  success(res, 200, {}, result.message);
});

const resetPassword = asyncHandler(async (req, res) => {
  validateResetPassword(req.body);
  const result = await authService.resetPassword(req.body.token, req.body.password);
  success(res, 200, {}, result.message);
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user.id);
  success(res, 200, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, profile_image_base64: profileImageBase64 } = req.body;
  const user = await authService.updateProfile(req.user.id, { name, phone, address, profileImageBase64 });
  success(res, 200, user, 'Profile updated');
});

module.exports = { signup, verifyEmail, login, forgotPassword, resetPassword, me, updateProfile };
