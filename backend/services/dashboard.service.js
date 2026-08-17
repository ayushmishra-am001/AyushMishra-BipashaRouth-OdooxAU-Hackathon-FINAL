const pool = require('../db/pool');

/**
 * GET /api/v1/dashboard/summary (admin-only).
 *
 * Read-only aggregation across orders/order_items/pickup_schedules/
 * return_records/security_deposits — no create/update/delete here, so this
 * is a single function rather than the CRUD service shape used elsewhere.
 *
 * DEFINITIONS (the schema has no explicit "rental lifecycle" status column —
 * orders.status only ever moves 'pending' -> 'paid' per Steps 2.3/2.4, and
 * Step 4.2 deliberately left status untouched on return — so "active" /
 * "returned" here is inferred from the presence or absence of a matching
 * return_records row, not from orders.status):
 *
 * - activeRentals: orders with no return_records row yet (not yet returned).
 *   Counts both order_type values (online + offline) and both 'pending' and
 *   'paid' orders — see the SPEC NOTE below on overdueRentals for why this
 *   isn't narrowed to 'paid' only.
 * - rentalsDueToday: distinct orders with an order_item whose end_date is
 *   today, that haven't been returned yet.
 * - upcomingPickups: pickup_schedules with status='pending' scheduled within
 *   the next 7 days (inclusive).
 * - upcomingReturns: distinct orders with an order_item whose end_date falls
 *   in the next 7 days (inclusive of today), that haven't been returned yet.
 * - overdueRentals: distinct orders with an order_item whose end_date is in
 *   the past, where orders.status = 'pending' — this matches the master
 *   spec's literal wording ("status='pending' with end_date < now"). SPEC
 *   NOTE: since offline (quotation-confirmed) orders are created with
 *   status='pending' and nothing in the codebase currently transitions them
 *   to 'paid' (only the online payment-stub flow does that), this counts
 *   overdue *unpaid* online orders and essentially all overdue offline
 *   orders — a 'paid' online order that's overdue won't be flagged. Revisit
 *   if the intent was "any active, un-returned order that's overdue"
 *   regardless of payment status.
 * - revenueLast30Days: sum of orders.subtotal for orders created in the
 *   last 30 days (by orders.created_at).
 * - depositsHeld: sum of security_deposits.amount where status='held'.
 * - lateFeeCollection: sum of return_records.late_fee_charged (nulls
 *   treated as 0 — pre-Step-5.2 returns, if any, had null here).
 */
async function getSummary() {
  const [
    activeRentals,
    rentalsDueToday,
    upcomingPickups,
    upcomingReturns,
    overdueRentals,
    revenue,
    depositsHeld,
    lateFees,
  ] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) AS count FROM orders o
      WHERE NOT EXISTS (SELECT 1 FROM return_records r WHERE r.order_id = o.id)
    `),
    pool.query(`
      SELECT COUNT(DISTINCT oi.order_id) AS count FROM order_items oi
      WHERE oi.end_date = CURRENT_DATE
        AND NOT EXISTS (SELECT 1 FROM return_records r WHERE r.order_id = oi.order_id)
    `),
    pool.query(`
      SELECT COUNT(*) AS count FROM pickup_schedules
      WHERE status = 'pending'
        AND scheduled_at >= now()
        AND scheduled_at <= now() + interval '7 days'
    `),
    pool.query(`
      SELECT COUNT(DISTINCT oi.order_id) AS count FROM order_items oi
      WHERE oi.end_date >= CURRENT_DATE
        AND oi.end_date <= CURRENT_DATE + interval '7 days'
        AND NOT EXISTS (SELECT 1 FROM return_records r WHERE r.order_id = oi.order_id)
    `),
    pool.query(`
      SELECT COUNT(DISTINCT oi.order_id) AS count FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'pending' AND oi.end_date < CURRENT_DATE
    `),
    pool.query(`
      SELECT COALESCE(SUM(subtotal), 0) AS total FROM orders
      WHERE created_at >= now() - interval '30 days'
    `),
    pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM security_deposits WHERE status = 'held'
    `),
    pool.query(`
      SELECT COALESCE(SUM(late_fee_charged), 0) AS total FROM return_records
    `),
  ]);

  return {
    active_rentals: Number(activeRentals.rows[0].count),
    rentals_due_today: Number(rentalsDueToday.rows[0].count),
    upcoming_pickups: Number(upcomingPickups.rows[0].count),
    upcoming_returns: Number(upcomingReturns.rows[0].count),
    overdue_rentals: Number(overdueRentals.rows[0].count),
    revenue_last_30_days: Number(revenue.rows[0].total),
    security_deposits_held: Number(depositsHeld.rows[0].total),
    late_fee_collection: Number(lateFees.rows[0].total),
  };
}

module.exports = { getSummary };
