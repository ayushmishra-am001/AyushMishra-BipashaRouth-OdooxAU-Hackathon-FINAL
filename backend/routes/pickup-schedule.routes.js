const express = require('express');
const {
  createPickupScheduleHandler,
  getPickupSchedulesHandler,
  getPickupScheduleHandler,
  updatePickupScheduleHandler,
} = require('../controllers/pickup-schedule.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/pickup-schedules
 * Schedule a pickup for an order (admin-only)
 */
router.post('/', requireAuth, requireRole('admin'), createPickupScheduleHandler);

/**
 * GET /api/v1/pickup-schedules
 * List pickup schedules, filterable by ?date=, ?status=, ?order_id= (admin-only)
 */
router.get('/', requireAuth, requireRole('admin'), getPickupSchedulesHandler);

/**
 * GET /api/v1/pickup-schedules/:id
 * Fetch a single pickup schedule (admin-only)
 */
router.get('/:id', requireAuth, requireRole('admin'), getPickupScheduleHandler);

/**
 * PUT /api/v1/pickup-schedules/:id
 * Mark done, reschedule, or edit notes (admin-only)
 */
router.put('/:id', requireAuth, requireRole('admin'), updatePickupScheduleHandler);

module.exports = router;
