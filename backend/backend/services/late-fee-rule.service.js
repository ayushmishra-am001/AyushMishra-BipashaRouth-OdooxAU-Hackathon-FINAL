const pool = require('../db/pool');
const AppError = require('../utils/appError');
const productService = require('./product.service');

const FIELDS = 'id, product_id, rate_type, rate_amount, grace_period_hours, max_fee';

async function create({
  product_id: productId,
  rate_type: rateType,
  rate_amount: rateAmount,
  grace_period_hours: gracePeriodHours,
  max_fee: maxFee,
}) {
  if (productId) await productService.getById(productId); // 404 if parent product missing

  const { rows } = await pool.query(
    `INSERT INTO late_fee_rules (product_id, rate_type, rate_amount, grace_period_hours, max_fee)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${FIELDS}`,
    [productId ?? null, rateType, rateAmount, gracePeriodHours ?? 0, maxFee ?? null]
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
    `SELECT ${FIELDS} FROM late_fee_rules ${where} ORDER BY id ASC`,
    params
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM late_fee_rules WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Late fee rule not found', 404);
  return rows[0];
}

async function update(id, {
  product_id: productId,
  rate_type: rateType,
  rate_amount: rateAmount,
  grace_period_hours: gracePeriodHours,
  max_fee: maxFee,
}) {
  await getById(id); // 404 if missing
  if (productId) await productService.getById(productId); // 404 if new parent product missing

  const { rows } = await pool.query(
    `UPDATE late_fee_rules SET
       product_id = COALESCE($1, product_id),
       rate_type = COALESCE($2, rate_type),
       rate_amount = COALESCE($3, rate_amount),
       grace_period_hours = COALESCE($4, grace_period_hours),
       max_fee = COALESCE($5, max_fee)
     WHERE id = $6
     RETURNING ${FIELDS}`,
    [productId ?? null, rateType || null, rateAmount ?? null, gracePeriodHours ?? null, maxFee ?? null, id]
  );
  return rows[0];
}

async function remove(id) {
  await getById(id); // 404 if missing
  await pool.query('DELETE FROM late_fee_rules WHERE id = $1', [id]);
}

module.exports = { create, list, getById, update, remove };
