const pool = require('../db/pool');
const AppError = require('../utils/appError');
const pricelistService = require('./pricelist.service');

const FIELDS = 'id, price_list_id, product_id, unit, price';

async function create(priceListId, { product_id: productId, unit, price }) {
  await pricelistService.getById(priceListId); // 404 if parent pricelist missing

  const { rows } = await pool.query(
    `INSERT INTO price_list_items (price_list_id, product_id, unit, price)
     VALUES ($1, $2, $3, $4)
     RETURNING ${FIELDS}`,
    [priceListId, productId, unit, price]
  );
  return rows[0];
}

async function listByPricelist(priceListId) {
  await pricelistService.getById(priceListId); // 404 if parent pricelist missing

  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM price_list_items WHERE price_list_id = $1 ORDER BY id ASC`,
    [priceListId]
  );
  return rows;
}

async function getById(priceListId, itemId) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM price_list_items WHERE id = $1 AND price_list_id = $2`,
    [itemId, priceListId]
  );
  if (!rows[0]) throw new AppError('Pricelist item not found', 404);
  return rows[0];
}

async function update(priceListId, itemId, { product_id: productId, unit, price }) {
  await getById(priceListId, itemId); // 404 if missing

  const { rows } = await pool.query(
    `UPDATE price_list_items SET
       product_id = COALESCE($1, product_id),
       unit = COALESCE($2, unit),
       price = COALESCE($3, price)
     WHERE id = $4 AND price_list_id = $5
     RETURNING ${FIELDS}`,
    [productId || null, unit || null, price ?? null, itemId, priceListId]
  );
  return rows[0];
}

async function remove(priceListId, itemId) {
  await getById(priceListId, itemId); // 404 if missing
  await pool.query('DELETE FROM price_list_items WHERE id = $1 AND price_list_id = $2', [itemId, priceListId]);
}

module.exports = { create, listByPricelist, getById, update, remove };
