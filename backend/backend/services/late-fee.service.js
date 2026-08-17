const pool = require('../db/pool');

// Hours per billing unit for each rate_type. No calendar-month awareness —
// 'monthly' is treated as a flat 30-day unit, a documented simplification
// since order_items.end_date is a plain DATE with no notion of "this
// customer's month".
const HOURS_PER_UNIT = {
  hourly: 1,
  daily: 24,
  weekly: 24 * 7,
  monthly: 24 * 30,
};

/**
 * Find the applicable late_fee_rules row for a product: the most specific
 * product_id match, falling back to a global rule (product_id IS NULL) if
 * no product-specific rule exists. Returns null if neither is configured.
 */
async function findApplicableRule(productId) {
  const specific = await pool.query(
    `SELECT id, product_id, rate_type, rate_amount, grace_period_hours, max_fee
     FROM late_fee_rules WHERE product_id = $1 ORDER BY id ASC LIMIT 1`,
    [productId]
  );
  if (specific.rows[0]) return specific.rows[0];

  const global = await pool.query(
    `SELECT id, product_id, rate_type, rate_amount, grace_period_hours, max_fee
     FROM late_fee_rules WHERE product_id IS NULL ORDER BY id ASC LIMIT 1`
  );
  return global.rows[0] || null;
}

/**
 * Fee for a single order_item line, given the order-wide lateHours and the
 * item's own qty. Grace period and rate are per-rule (i.e. per-product),
 * so each line is evaluated against its own matching rule independently.
 * rate_amount is treated as a per-unit-rented rate, so it's multiplied by
 * qty; max_fee (if set) caps this line's fee after that multiplication —
 * there's no order-level max_fee field in the schema, so lines are capped
 * individually and then summed.
 */
function feeForLine(rule, lateHours, qty) {
  if (!rule) return 0;

  const chargeableHours = Math.max(0, lateHours - (rule.grace_period_hours || 0));
  if (chargeableHours === 0) return 0;

  const hoursPerUnit = HOURS_PER_UNIT[rule.rate_type];
  const units = Math.ceil(chargeableHours / hoursPerUnit);

  let fee = units * rule.rate_amount * qty;
  if (rule.max_fee != null) fee = Math.min(fee, rule.max_fee);

  return fee;
}

/**
 * Compute the late fee to charge for a return.
 *
 * Called from services/return.service.js at the moment a return is
 * recorded, with the order-wide lateHours already computed there
 * (see return.service.js:computeLateHours). Looks up each order_item's
 * product, finds the matching late_fee_rules row (product-specific, else
 * the global product_id IS NULL rule), and sums each line's fee.
 *
 * Returns 0 (not null) when the order is on time, or when it's late but no
 * rule — product-specific or global — is configured for any of its
 * products, since a late fee engine now exists to answer that question.
 * (Before this step, the stub returned null to mean "not implemented yet";
 * that placeholder is gone now that real math runs here.)
 */
async function calculateLateFee(orderId, lateHours) {
  if (!lateHours || lateHours <= 0) return 0;

  const { rows: items } = await pool.query(
    'SELECT product_id, qty FROM order_items WHERE order_id = $1',
    [orderId]
  );
  if (!items.length) return 0;

  let total = 0;
  for (const item of items) {
    const rule = await findApplicableRule(item.product_id);
    total += feeForLine(rule, lateHours, item.qty);
  }

  return total;
}

module.exports = { calculateLateFee };
