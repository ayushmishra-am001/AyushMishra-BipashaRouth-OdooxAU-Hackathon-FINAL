const pool = require('../db/pool');
const AppError = require('../utils/appError');
const password = require('../utils/password');
const { signToken } = require('../utils/token');
const { saveImage } = require('../utils/imageUpload');
const ROLES = require('../constants/roles');
const env = require('../config/env');

const PUBLIC_USER_FIELDS = 'id, name, email, role, phone, address, profile_image, created_at';

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
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_USER_FIELDS}`,
    [name, email, passwordHash, finalRole, phone || null]
  );

  const user = rows[0];
  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
}

async function login({ email, password: plainPassword }) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  // Same error for "no such user" and "wrong password" — don't leak which one it was.
  const matches = user ? await password.compare(plainPassword, user.password_hash) : false;
  if (!user || !matches) {
    throw new AppError('Invalid credentials', 401);
  }

  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

  const token = signToken({ id: user.id, role: user.role });
  delete user.password_hash;
  delete user.last_login_at;
  return { user, token };
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

module.exports = { register, login, getById, updateProfile };
