const pool = require('../db/pool');
const AppError = require('../utils/appError');
const productService = require('./product.service');

const FIELDS = 'id, product_id, attribute_name, attribute_value, price_delta, stock_qty';

async function create(productId, { attribute_name: attributeName, attribute_value: attributeValue, price_delta: priceDelta, stock_qty: stockQty }) {
  await productService.getById(productId); // 404 if parent product missing

  const { rows } = await pool.query(
    `INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_delta, stock_qty)
     VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, 0))
     RETURNING ${FIELDS}`,
    [productId, attributeName, attributeValue, priceDelta, stockQty]
  );
  return rows[0];
}

async function listByProduct(productId) {
  await productService.getById(productId); // 404 if parent product missing

  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

async function getById(productId, variantId) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM product_variants WHERE id = $1 AND product_id = $2`,
    [variantId, productId]
  );
  if (!rows[0]) throw new AppError('Variant not found', 404);
  return rows[0];
}

async function update(productId, variantId, { attribute_name: attributeName, attribute_value: attributeValue, price_delta: priceDelta, stock_qty: stockQty }) {
  await getById(productId, variantId); // 404 if missing

  const { rows } = await pool.query(
    `UPDATE product_variants SET
       attribute_name = COALESCE($1, attribute_name),
       attribute_value = COALESCE($2, attribute_value),
       price_delta = COALESCE($3, price_delta),
       stock_qty = COALESCE($4, stock_qty)
     WHERE id = $5 AND product_id = $6
     RETURNING ${FIELDS}`,
    [attributeName || null, attributeValue || null, priceDelta ?? null, stockQty ?? null, variantId, productId]
  );
  return rows[0];
}

async function remove(productId, variantId) {
  await getById(productId, variantId); // 404 if missing
  await pool.query('DELETE FROM product_variants WHERE id = $1 AND product_id = $2', [variantId, productId]);
}

module.exports = { create, listByProduct, getById, update, remove };
