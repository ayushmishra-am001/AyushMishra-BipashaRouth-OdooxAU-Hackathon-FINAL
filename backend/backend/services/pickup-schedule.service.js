const db = require('../db/pool');
const AppError = require('../utils/appError');

// NOTE: db/schema.sql's pickup_schedules table does not have a created_at
// column (the CORE SCHEMA CONTRACT in the master spec lists one, but the
// actual table built in Step 0.1 omits it). Queries here only select
// columns that really exist: id, order_id, scheduled_at, status, notes.
const FIELDS = 'id, order_id, scheduled_at, status, notes';

/**
 * Create a pickup schedule for an order (admin-only)
 */
async function createPickupSchedule({ order_id, scheduled_at, notes }) {
  // Verify parent order exists
  const orderRes = await db.query('SELECT id FROM orders WHERE id = $1', [order_id]);
  if (!orderRes.rows.length) {
    throw new AppError('Order not found', 404);
  }

  const result = await db.query(
    `INSERT INTO pickup_schedules (order_id, scheduled_at, status, notes)
     VALUES ($1, $2, 'pending', $3)
     RETURNING ${FIELDS}`,
    [order_id, scheduled_at, notes || null]
  );

  return result.rows[0];
}

/**
 * List pickup schedules, optionally filtered by date and/or status.
 * `date` filters to pickups scheduled on that calendar date (YYYY-MM-DD).
 */
async function getAllPickupSchedules(filters = {}) {
  const clauses = [];
  const values = [];
  let paramIndex = 1;

  if (filters.status) {
    clauses.push(`status = $${paramIndex}`);
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.date) {
    clauses.push(`scheduled_at::date = $${paramIndex}`);
    values.push(filters.date);
    paramIndex++;
  }

  if (filters.order_id) {
    clauses.push(`order_id = $${paramIndex}`);
    values.push(filters.order_id);
    paramIndex++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT ${FIELDS} FROM pickup_schedules ${where} ORDER BY scheduled_at ASC`,
    values
  );

  return result.rows;
}

/**
 * Get a single pickup schedule by ID
 */
async function getPickupScheduleById(id) {
  const result = await db.query(
    `SELECT ${FIELDS} FROM pickup_schedules WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new AppError('Pickup schedule not found', 404);
  }

  return result.rows[0];
}

/**
 * Update a pickup schedule — mark done, reschedule, or edit notes (admin-only)
 */
async function updatePickupSchedule(id, { scheduled_at, status, notes }) {
  // Verify it exists
  await getPickupScheduleById(id);

  const result = await db.query(
    `UPDATE pickup_schedules
     SET scheduled_at = COALESCE($1, scheduled_at),
         status = COALESCE($2, status),
         notes = COALESCE($3, notes)
     WHERE id = $4
     RETURNING ${FIELDS}`,
    [scheduled_at || null, status || null, notes !== undefined ? notes : null, id]
  );

  return result.rows[0];
}

module.exports = {
  createPickupSchedule,
  getAllPickupSchedules,
  getPickupScheduleById,
  updatePickupSchedule,
};
