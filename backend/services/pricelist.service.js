const pool = require('../db/pool');
const AppError = require('../utils/appError');

const FIELDS = 'id, name, is_default, valid_from, valid_to';

async function create({ name, is_default: isDefault, valid_from: validFrom, valid_to: validTo }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isDefault) {
      await client.query('UPDATE price_lists SET is_default = false WHERE is_default = true');
    }

    const { rows } = await client.query(
      `INSERT INTO price_lists (name, is_default, valid_from, valid_to)
       VALUES ($1, COALESCE($2, false), $3, $4)
       RETURNING ${FIELDS}`,
      [name, isDefault, validFrom || null, validTo || null]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function list() {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM price_lists ORDER BY id ASC`);
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM price_lists WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Pricelist not found', 404);
  return rows[0];
}

async function update(id, { name, is_default: isDefault, valid_from: validFrom, valid_to: validTo }) {
  await getById(id); // 404 if missing

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isDefault === true) {
      await client.query('UPDATE price_lists SET is_default = false WHERE is_default = true AND id != $1', [id]);
    }

    const { rows } = await client.query(
      `UPDATE price_lists SET
         name = COALESCE($1, name),
         is_default = COALESCE($2, is_default),
         valid_from = COALESCE($3, valid_from),
         valid_to = COALESCE($4, valid_to)
       WHERE id = $5
       RETURNING ${FIELDS}`,
      [name || null, isDefault ?? null, validFrom || null, validTo || null, id]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function remove(id) {
  await getById(id); // 404 if missing
  await pool.query('DELETE FROM price_lists WHERE id = $1', [id]);
}

module.exports = { create, list, getById, update, remove };
