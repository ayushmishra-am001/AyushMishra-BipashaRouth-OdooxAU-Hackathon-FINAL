const crypto = require('crypto');
const pool = require('../db/pool');
const AppError = require('../utils/appError');
const password = require('../utils/password');
const { signToken } = require('../utils/token');
const { saveImage } = require('../utils/imageUpload');
const ROLES = require('../constants/roles');
const env = require('../config/env');
const emailService = require('./email.service');

const PUBLIC_USER_FIELDS = 'id, name, email, role, phone, address, profile_image, created_at, email_verified';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function register({ name, email, password: plainPassword, phone, role, adminKey }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  // Signup always creates a 'customer' unless the caller explicitly asked
  // for 'admin' AND presented the correct ADMIN_SIGNUP_KEY (set in .env).
  // The validator already confirmed a key was supplied when role is admin;
  // here we confirm it's the *right* key before actually granting the role.
  let finalRole = ROLES.CUSTOMER;
  if (role === ROLES.ADMIN) {
    if (!env.adminSignupKey) {
      throw new AppError('Admin signup is not enabled', 403);
    }
    if (adminKey !== env.adminSignupKey) {
      throw new AppError('Invalid admin key', 403);
    }
    finalRole = ROLES.ADMIN;
  }

  const passwordHash = await password.hash(plainPassword);
  const emailVerificationToken = generateToken();

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone, email_verification_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${PUBLIC_USER_FIELDS}`,
    [name, email, passwordHash, finalRole, phone || null, emailVerificationToken]
  );

  const user = rows[0];

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, name, emailVerificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't throw - user is registered, just email sending failed
  }

  const token = signToken({ id: user.id, role: user.role });
  return { user, token, message: 'Signup successful. Please check your email to verify your account.' };
}

async function verifyEmail(token) {
  const { rows } = await pool.query(
    'SELECT id, email FROM users WHERE email_verification_token = $1',
    [token]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  const user = rows[0];

  await pool.query(
    'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE id = $1',
    [user.id]
  );

  return { message: 'Email verified successfully. You can now login.' };
}

async function login({ email, password: plainPassword }) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  // Same error for "no such user" and "wrong password" — don't leak which one it was.
  const matches = user ? await password.compare(plainPassword, user.password_hash) : false;
  if (!user || !matches) {
    throw new AppError('Invalid credentials', 401);
  }

  // Optional: Check if email is verified
  if (!user.email_verified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

  const token = signToken({ id: user.id, role: user.role });
  delete user.password_hash;
  delete user.last_login_at;
  delete user.email_verification_token;
  delete user.password_reset_token;
  return { user, token };
}

async function forgotPassword(email) {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);

  if (rows.length === 0) {
    // Don't reveal if email exists for security reasons
    return { message: 'If that email address is in our system, we will send a password reset link.' };
  }

  const user = rows[0];
  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
    [resetToken, resetTokenExpiry, user.id]
  );

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(email, user.name, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new AppError('Failed to send password reset email. Please try again later.', 500);
  }

  return { message: 'If that email address is in our system, we will send a password reset link.' };
}

async function resetPassword(token, newPassword) {
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > now()',
    [token]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid or expired password reset token', 400);
  }

  const user = rows[0];
  const passwordHash = await password.hash(newPassword);

  await pool.query(
    'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
    [passwordHash, user.id]
  );

  return { message: 'Password has been reset successfully. Please login with your new password.' };
}

async function getById(userId) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw new AppError('User not found', 404);
  return rows[0];
}

async function updateProfile(userId, { name, phone, address, profileImageBase64 }) {
  const profileImagePath = profileImageBase64 ? saveImage(`user_${userId}`, profileImageBase64) : null;

  const { rows } = await pool.query(
    `UPDATE users SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       address = COALESCE($3, address),
       profile_image = COALESCE($4, profile_image)
     WHERE id = $5
     RETURNING ${PUBLIC_USER_FIELDS}`,
    [name || null, phone || null, address || null, profileImagePath, userId]
  );
  return rows[0];
}

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, getById, updateProfile };
