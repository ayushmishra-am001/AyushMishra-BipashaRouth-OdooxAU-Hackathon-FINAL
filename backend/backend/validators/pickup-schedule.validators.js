const AppError = require('../utils/appError');

const STATUSES = ['pending', 'done'];

/**
 * Validate input for POST /api/v1/pickup-schedules
 */
function validatePickupSchedule({ order_id, scheduled_at, notes }) {
  if (!order_id || typeof order_id !== 'number') {
    throw new AppError('order_id is required and must be a number', 400);
  }

  if (!scheduled_at || typeof scheduled_at !== 'string' || isNaN(Date.parse(scheduled_at))) {
    throw new AppError('scheduled_at is required and must be a valid date/time string', 400);
  }

  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    throw new AppError('notes must be a string', 400);
  }
}

/**
 * Validate input for PUT /api/v1/pickup-schedules/:id
 * All fields optional — only what's provided is checked.
 */
function validatePickupScheduleUpdate({ scheduled_at, status, notes }) {
  if (scheduled_at !== undefined && scheduled_at !== null) {
    if (typeof scheduled_at !== 'string' || isNaN(Date.parse(scheduled_at))) {
      throw new AppError('scheduled_at must be a valid date/time string', 400);
    }
  }

  if (status !== undefined && status !== null && !STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400);
  }

  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    throw new AppError('notes must be a string', 400);
  }
}

module.exports = {
  validatePickupSchedule,
  validatePickupScheduleUpdate,
  STATUSES,
};
