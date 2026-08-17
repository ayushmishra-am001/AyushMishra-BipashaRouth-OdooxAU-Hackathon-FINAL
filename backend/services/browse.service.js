const pool = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * Find the applicable pricelist for today:
 * 1. If is_default=true, use it
 * 2. Else find one where valid_from <= today AND (valid_to IS NULL OR valid_to >= today)
 * 3. If none, return null
 */
async function getApplicablePricelist() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // First try default
  let { rows } = await pool.query(
    `SELECT id FROM price_lists WHERE is_default = true LIMIT 1`
  );
  if (rows[0]) return rows[0].id;

  // Otherwise try date-based
  ({ rows } = await pool.query(
    `SELECT id FROM price_lists
     WHERE (valid_from IS NULL OR valid_from <= $1)
       AND (valid_to IS NULL OR valid_to >= $1)
     LIMIT 1`,
    [today]
  ));
  if (rows[0]) return rows[0].id;

  return null;
}

/**
 * Get pricing for a product from the applicable pricelist
 * Returns object: { hour: price, day: price, week: price, month: price }
 */
async function getPricingForProduct(productId, pricelistId) {
  const pricing = { hour: null, day: null, week: null, month: null };

  if (!pricelistId) {
    // No pricelist, use base_price for all units (this is a fallback)
    const { rows } = await pool.query(
      `SELECT base_price FROM products WHERE id = $1`,
      [productId]
    );
    if (rows[0]) {
      const basePrice = rows[0].base_price;
      pricing.hour = basePrice;
      pricing.day = basePrice;
      pricing.week = basePrice;
      pricing.month = basePrice;
    }
    return pricing;
  }

  const { rows } = await pool.query(
    `SELECT unit, price FROM price_list_items
     WHERE price_list_id = $1 AND product_id = $2`,
    [pricelistId, productId]
  );

  rows.forEach((row) => {
    pricing[row.unit] = row.price;
  });

  // Fill in missing units with base_price if no pricelist item exists
  const baseRes = await pool.query(
    `SELECT base_price FROM products WHERE id = $1`,
    [productId]
  );
  if (baseRes.rows[0]) {
    const basePrice = baseRes.rows[0].base_price;
    for (const unit of ['hour', 'day', 'week', 'month']) {
      if (pricing[unit] === null) {
        pricing[unit] = basePrice;
      }
    }
  }

  return pricing;
}

/**
 * Get variants for a product
 */
async function getVariantsForProduct(productId) {
  const { rows } = await pool.query(
    `SELECT id, attribute_name, attribute_value, price_delta, stock_qty
     FROM product_variants
     WHERE product_id = $1
     ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

/**
 * Get rental periods for a product
 */
async function getRentalPeriodsForProduct(productId) {
  const { rows } = await pool.query(
    `SELECT id, min_duration, max_duration, unit
     FROM rental_periods
     WHERE product_id = $1
     ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

/**
 * List products with pricing, variants, and rental periods
 * If adminMode=true, returns all products (including inactive); otherwise only active
 */
async function listPublic({ category, adminMode = false } = {}) {
  const pricelistId = await getApplicablePricelist();

  const clauses = [];
  const params = [];

  if (!adminMode) {
    clauses.push('active = true');
  }

  if (category) {
    params.push(category);
    clauses.push(`category = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows: products } = await pool.query(
    `SELECT id, name, description, category, sku, image, base_price, active, created_at
     FROM products
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  // Enrich each product with variants, rental periods, and pricing
  const enriched = await Promise.all(
    products.map(async (p) => ({
      ...p,
      variants: await getVariantsForProduct(p.id),
      rental_periods: await getRentalPeriodsForProduct(p.id),
      pricing: await getPricingForProduct(p.id, pricelistId),
    }))
  );

  return enriched;
}

/**
 * Get single product detail with pricing, variants, and rental periods
 * If adminMode=true, returns inactive products too; otherwise only active
 */
async function getByIdPublic(id, adminMode = false) {
  const activeFilter = adminMode ? '' : 'AND active = true';
  const { rows } = await pool.query(
    `SELECT id, name, description, category, sku, image, base_price, active, created_at
     FROM products
     WHERE id = $1 ${activeFilter}`,
    [id]
  );

  if (!rows[0]) throw new AppError('Product not found', 404);

  const product = rows[0];
  const pricelistId = await getApplicablePricelist();

  return {
    ...product,
    variants: await getVariantsForProduct(product.id),
    rental_periods: await getRentalPeriodsForProduct(product.id),
    pricing: await getPricingForProduct(product.id, pricelistId),
  };
}

module.exports = { listPublic, getByIdPublic };
