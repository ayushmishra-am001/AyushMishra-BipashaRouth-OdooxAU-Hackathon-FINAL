const pool = require('../db/pool');
const AppError = require('../utils/appError');

const FIELDS = 'id, name, description, category, sku, image, base_price, active, created_at';

async function create({ name, description, category, sku, image, base_price: basePrice, active }) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, category, sku, image, base_price, active)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
     RETURNING ${FIELDS}`,
    [name, description || null, category || null, sku || null, image || null, basePrice, active]
  );
  return rows[0];
}

async function list({ category, active } = {}) {
  const clauses = [];
  const params = [];

  if (category) {
    params.push(category);
    clauses.push(`category = $${params.length}`);
  }
  if (active !== undefined) {
    params.push(active);
    clauses.push(`active = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM products ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM products WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Product not found', 404);
  return rows[0];
}

async function update(id, { name, description, category, sku, image, base_price: basePrice, active }) {
  await getById(id); // 404 if missing

  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       category = COALESCE($3, category),
       sku = COALESCE($4, sku),
       image = COALESCE($5, image),
       base_price = COALESCE($6, base_price),
       active = COALESCE($7, active)
     WHERE id = $8
     RETURNING ${FIELDS}`,
    [name || null, description || null, category || null, sku || null, image || null, basePrice ?? null, active ?? null, id]
  );
  return rows[0];
}

async function remove(id) {
  await getById(id); // 404 if missing
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
}

module.exports = { create, list, getById, update, remove };
