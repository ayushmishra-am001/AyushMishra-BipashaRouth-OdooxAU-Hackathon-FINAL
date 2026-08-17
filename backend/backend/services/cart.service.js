const pool = require('../db/pool');
const AppError = require('../utils/appError');
const browseService = require('./browse.service');

const CART_FIELDS = 'id, user_id, status';
const CART_ITEM_FIELDS = 'id, cart_id, product_id, variant_id, start_date, end_date, qty, price_snapshot';

/**
 * Get or create active cart for a user
 */
async function getOrCreateCart(userId) {
  // Check if active cart exists
  let { rows } = await pool.query(
    `SELECT ${CART_FIELDS} FROM carts WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  if (rows[0]) return rows[0];

  // Create new active cart
  ({ rows } = await pool.query(
    `INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING ${CART_FIELDS}`,
    [userId]
  ));

  return rows[0];
}

/**
 * Get cart with all items
 */
async function getCart(userId) {
  const cart = await getOrCreateCart(userId);

  const { rows: items } = await pool.query(
    `SELECT ${CART_ITEM_FIELDS} FROM cart_items WHERE cart_id = $1 ORDER BY id ASC`,
    [cart.id]
  );

  return {
    ...cart,
    items,
  };
}

/**
 * Add item to cart
 * Computes price_snapshot from browse service pricing at the time of add
 */
async function addItem(userId, { product_id: productId, variant_id: variantId, start_date: startDate, end_date: endDate, qty }) {
  // Validate product exists
  const { rows: productRows } = await pool.query(
    `SELECT id FROM products WHERE id = $1`,
    [productId]
  );
  if (!productRows[0]) throw new AppError('Product not found', 404);

  // Validate variant if provided
  if (variantId) {
    const { rows: variantRows } = await pool.query(
      `SELECT id FROM product_variants WHERE id = $1 AND product_id = $2`,
      [variantId, productId]
    );
    if (!variantRows[0]) throw new AppError('Variant not found', 404);
  }

  // Get or create cart
  const cart = await getOrCreateCart(userId);

  // Get pricing from browse service (this includes pricelist-aware pricing)
  const product = await browseService.getByIdPublic(productId, false); // false = don't use admin mode

  // For now, use the first available price from pricing object (hour, day, week, month)
  // In a real scenario, the frontend would specify which unit is being rented
  // For this step, we'll take the "day" price as default if available
  let priceSnapshot = product.pricing.day || product.base_price;

  // Insert cart item
  const { rows } = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, variant_id, start_date, end_date, qty, price_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${CART_ITEM_FIELDS}`,
    [cart.id, productId, variantId || null, startDate, endDate, qty, priceSnapshot]
  );

  return rows[0];
}

/**
 * Update cart item
 */
async function updateItem(userId, itemId, { product_id: productId, variant_id: variantId, start_date: startDate, end_date: endDate, qty }) {
  // Get the item and verify it belongs to user's active cart
  const { rows: itemRows } = await pool.query(
    `SELECT ci.${CART_ITEM_FIELDS}
     FROM cart_items ci
     JOIN carts c ON ci.cart_id = c.id
     WHERE ci.id = $1 AND c.user_id = $2 AND c.status = 'active'`,
    [itemId, userId]
  );

  if (!itemRows[0]) throw new AppError('Cart item not found', 404);

  const item = itemRows[0];

  // If product or variant changes, recalculate price_snapshot
  let priceSnapshot = item.price_snapshot;
  if (productId && productId !== item.product_id) {
    const product = await browseService.getByIdPublic(productId, false);
    priceSnapshot = product.pricing.day || product.base_price;
  }

  // Update item
  const { rows } = await pool.query(
    `UPDATE cart_items SET
       product_id = COALESCE($1, product_id),
       variant_id = COALESCE($2, variant_id),
       start_date = COALESCE($3, start_date),
       end_date = COALESCE($4, end_date),
       qty = COALESCE($5, qty),
       price_snapshot = $6
     WHERE id = $7
     RETURNING ${CART_ITEM_FIELDS}`,
    [productId || null, variantId || null, startDate || null, endDate || null, qty ?? null, priceSnapshot, itemId]
  );

  return rows[0];
}

/**
 * Delete cart item
 */
async function deleteItem(userId, itemId) {
  // Verify item belongs to user's active cart
  const { rows: itemRows } = await pool.query(
    `SELECT ci.id
     FROM cart_items ci
     JOIN carts c ON ci.cart_id = c.id
     WHERE ci.id = $1 AND c.user_id = $2 AND c.status = 'active'`,
    [itemId, userId]
  );

  if (!itemRows[0]) throw new AppError('Cart item not found', 404);

  await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
}

module.exports = { getCart, addItem, updateItem, deleteItem };
