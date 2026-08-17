const authService = require('../services/auth.service');
const { validateSignup, validateLogin } = require('../validators/auth.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  validateSignup(req.body);
  const { user, token } = await authService.register(req.body);
  success(res, 201, { user, token }, 'Signup successful');
});

const login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const { user, token } = await authService.login(req.body);
  success(res, 200, { user, token }, 'Login successful');
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

module.exports = { signup, login, me, updateProfile };
