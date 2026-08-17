const AppError = require('../utils/appError');
const ROLES = require('../constants/roles');
const { parseImageDataUri } = require('../utils/imageUpload');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ name, email, password, role, adminKey }) {
  if (!name || !name.trim()) throw new AppError('Name is required', 400);
  if (!email || !EMAIL_RE.test(email)) throw new AppError('A valid email is required', 400);
  if (!password || password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  if (role !== undefined && role !== null && role !== '' && ![ROLES.CUSTOMER, ROLES.ADMIN].includes(role)) {
    throw new AppError('Role must be either customer or admin', 400);
  }
  if (role === ROLES.ADMIN && (!adminKey || !adminKey.trim())) {
    throw new AppError('Admin key is required to create an admin account', 400);
  }
}

function validateLogin({ email, password }) {
  if (!email || !password) throw new AppError('Email and password are required', 400);
}

module.exports = { validateSignup, validateLogin, parseImageDataUri };
