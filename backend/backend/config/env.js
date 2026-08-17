require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

module.exports = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '24h',
  // Shared secret a signup request must present to create an 'admin' user
  // instead of a 'customer'. Keep this out of version control (.env only)
  // and hand it out only to people who should get admin access.
  adminSignupKey: process.env.ADMIN_SIGNUP_KEY || null,
};
