// One-off CLI to create the first admin account, since signup always creates
// a 'customer'. Run once after the schema is loaded.
//   node server/scripts/seed-admin.js "Admin Name" admin@example.com password123
const pool = require('../db/pool');
const password = require('../utils/password');
const ROLES = require('../constants/roles');

async function run() {
  const [, , name, email, plainPassword] = process.argv;
  if (!name || !email || !plainPassword) {
    console.log('Usage: node server/scripts/seed-admin.js "Admin Name" admin@example.com password123');
    process.exit(1);
  }

  const passwordHash = await password.hash(plainPassword);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [name, email, passwordHash, ROLES.ADMIN]
  );

  console.log('Admin created (or already existed).');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
