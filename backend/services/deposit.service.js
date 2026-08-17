const pool = require('../db/pool');
const AppError = require('../utils/appError');

const FIELDS = 'id, order_id, amount, status, refunded_amount, refunded_at';

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM security_deposits WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Security deposit not found', 404);
  return rows[0];
}

/**
 * Look up a deposit by its order_id. Every order has exactly one deposit
 * (created at checkout/quotation-confirm time — Steps 2.3/3.3), so this is
 * how the admin returns page finds the right deposit to settle without
 * needing to know a raw deposit ID (there's still no admin-scoped order
 * lookup endpoint, per the known gap from Steps 4.3/4.4, but order_id is
 * already visible on every return_records row the returns page displays).
 */
async function getByOrderId(orderId) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM security_deposits WHERE order_id = $1`, [orderId]);
  if (!rows[0]) throw new AppError('No security deposit found for this order', 404);
  return rows[0];
}

/**
 * Settle a security deposit (admin-only).
 *
 * - Deposit must currently be 'held' (400 if already refunded/partially_refunded —
 *   settling is a one-time action per deposit, same "no double-processing"
 *   pattern as return.service.js's double-return guard).
 * - Looks up the deposit's order's return_records row to read late_fee_charged
 *   (Step 5.2). A deposit can't be settled before the order has been returned —
 *   there's no late_fee_charged to settle against yet — so this throws 400 if
 *   no return_records row exists for the order.
 * - On-time return (late_fee_charged === 0): full refund — status='refunded',
 *   refunded_amount = amount.
 * - Late return (late_fee_charged > 0): deduct the fee from the deposit,
 *   refund the remainder — status='partially_refunded', refunded_amount =
 *   amount - late_fee_charged, floored at 0 (a late fee could in theory
 *   exceed the deposit itself; the customer isn't refunded a negative amount,
 *   though nothing here bills them for the shortfall — that's out of scope
 *   for this step).
 */
async function settle(depositId) {
  const deposit = await getById(depositId);

  if (deposit.status !== 'held') {
    throw new AppError(`Deposit has already been settled (status: ${deposit.status})`, 400);
  }

  const { rows: returnRows } = await pool.query(
    'SELECT late_fee_charged FROM return_records WHERE order_id = $1',
    [deposit.order_id]
  );
  if (!returnRows[0]) {
    throw new AppError('This order has not been returned yet — nothing to settle against', 400);
  }

  const lateFee = returnRows[0].late_fee_charged || 0;
  const refundedAmount = Math.max(0, deposit.amount - lateFee);
  const status = lateFee > 0 ? 'partially_refunded' : 'refunded';

  const { rows } = await pool.query(
    `UPDATE security_deposits
     SET status = $1, refunded_amount = $2, refunded_at = now()
     WHERE id = $3
     RETURNING ${FIELDS}`,
    [status, refundedAmount, depositId]
  );
  return rows[0];
}

module.exports = { getById, getByOrderId, settle };
