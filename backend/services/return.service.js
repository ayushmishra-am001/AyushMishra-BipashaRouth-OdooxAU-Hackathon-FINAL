const db = require('../db/pool');
const AppError = require('../utils/appError');
const lateFeeService = require('./late-fee.service');

const FIELDS = 'id, order_id, returned_at, condition_notes, damage_reported, late_hours, late_fee_charged, stock_updated';

/**
 * Compute how many whole hours late a return is.
 *
 * order_items.end_date is a DATE (no time-of-day), so "due back by
 * end_date" is treated as end_date 23:59:59 (i.e. the customer has the
 * whole end_date to return). late_hours is measured from the LATEST
 * end_date across all items on the order (the order isn't fully returned
 * until every item on it is back), floored at 0 for on-time/early returns.
 */
function computeLateHours(orderItems, now = new Date()) {
  if (!orderItems.length) return 0;

  let latestEndDate = null;
  for (const item of orderItems) {
    const endDate = new Date(item.end_date);
    if (!latestEndDate || endDate > latestEndDate) {
      latestEndDate = endDate;
    }
  }

  // Due at the end of the latest end_date (23:59:59.999 that day)
  const dueAt = new Date(latestEndDate);
  dueAt.setUTCHours(23, 59, 59, 999);

  const diffMs = now.getTime() - dueAt.getTime();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60));
}

/**
 * Record a return for an order (admin-only).
 * - Inserts return_records (condition_notes, damage_reported, late_hours)
 * - Calls the Step 5.2 TODO hook (late-fee.service.calculateLateFee) —
 *   currently a stub that always returns null, so late_fee_charged stays
 *   null ("not yet charged") until Step 5.2 implements the real math
 * - Restocks product_variants.stock_qty (+qty) for every order_item that
 *   has a variant_id — order_items without a variant have no stock field
 *   to restock (products table carries no stock_qty column), so those are
 *   skipped
 * - Sets return_records.stock_updated = true once restocking succeeds
 * All in one transaction.
 */
async function createReturn({ order_id, condition_notes, damage_reported }) {
  // Verify order exists
  const orderRes = await db.query('SELECT id FROM orders WHERE id = $1', [order_id]);
  if (!orderRes.rows.length) {
    throw new AppError('Order not found', 404);
  }

  // Prevent double-return of the same order
  const existingRes = await db.query('SELECT id FROM return_records WHERE order_id = $1', [order_id]);
  if (existingRes.rows.length) {
    throw new AppError('This order has already been returned', 400);
  }

  const itemsRes = await db.query(
    'SELECT product_id, variant_id, end_date, qty FROM order_items WHERE order_id = $1',
    [order_id]
  );
  const orderItems = itemsRes.rows;
  if (!orderItems.length) {
    throw new AppError('Order has no items to return', 400);
  }

  const lateHours = computeLateHours(orderItems);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // TODO hook for Step 5.2 — see services/late-fee.service.js
    const lateFeeCharged = await lateFeeService.calculateLateFee(order_id, lateHours);

    const returnResult = await client.query(
      `INSERT INTO return_records (order_id, condition_notes, damage_reported, late_hours, late_fee_charged, stock_updated)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING ${FIELDS}`,
      [order_id, condition_notes || null, damage_reported || false, lateHours, lateFeeCharged]
    );
    const returnRecord = returnResult.rows[0];

    // Restock: +qty back onto each item's variant (items without a variant
    // have nothing to restock at product level in this schema)
    for (const item of orderItems) {
      if (item.variant_id) {
        await client.query(
          'UPDATE product_variants SET stock_qty = stock_qty + $1 WHERE id = $2',
          [item.qty, item.variant_id]
        );
      }
    }

    const updatedResult = await client.query(
      `UPDATE return_records SET stock_updated = true WHERE id = $1 RETURNING ${FIELDS}`,
      [returnRecord.id]
    );

    await client.query('COMMIT');

    return updatedResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get a single return record by ID
 */
async function getReturnById(id) {
  const result = await db.query(`SELECT ${FIELDS} FROM return_records WHERE id = $1`, [id]);
  if (!result.rows.length) {
    throw new AppError('Return record not found', 404);
  }
  return result.rows[0];
}

/**
 * List return records, optionally filtered by order_id
 */
async function getAllReturns(filters = {}) {
  const clauses = [];
  const values = [];
  let paramIndex = 1;

  if (filters.order_id) {
    clauses.push(`order_id = $${paramIndex}`);
    values.push(filters.order_id);
    paramIndex++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT ${FIELDS} FROM return_records ${where} ORDER BY returned_at DESC`,
    values
  );
  return result.rows;
}

module.exports = { createReturn, getReturnById, getAllReturns, computeLateHours };
