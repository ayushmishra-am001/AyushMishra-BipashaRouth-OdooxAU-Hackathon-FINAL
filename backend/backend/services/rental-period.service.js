const pool = require('../db/pool');
const AppError = require('../utils/appError');
const productService = require('./product.service');

const FIELDS = 'id, product_id, min_duration, max_duration, unit';

async function create({ product_id: productId, min_duration: minDuration, max_duration: maxDuration, unit }) {
  await productService.getById(productId); // 404 if parent product missing

  const { rows } = await pool.query(
    `INSERT INTO rental_periods (product_id, min_duration, max_duration, unit)
     VALUES ($1, $2, $3, $4)
     RETURNING ${FIELDS}`,
    [productId, minDuration, maxDuration ?? null, unit]
  );
  return rows[0];
}

async function list({ product_id: productId } = {}) {
  const clauses = [];
  const params = [];

  if (productId) {
    params.push(productId);
    clauses.push(`product_id = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM rental_periods ${where} ORDER BY id ASC`,
    params
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM rental_periods WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Rental period not found', 404);
  return rows[0];
}

async function update(id, { min_duration: minDuration, max_duration: maxDuration, unit }) {
  await getById(id); // 404 if missing

  const { rows } = await pool.query(
    `UPDATE rental_periods SET
       min_duration = COALESCE($1, min_duration),
       max_duration = COALESCE($2, max_duration),
       unit = COALESCE($3, unit)
     WHERE id = $4
     RETURNING ${FIELDS}`,
    [minDuration ?? null, maxDuration ?? null, unit || null, id]
  );
  return rows[0];
}

async function remove(id) {
  await getById(id); // 404 if missing
  await pool.query('DELETE FROM rental_periods WHERE id = $1', [id]);
}

module.exports = { create, list, getById, update, remove };
