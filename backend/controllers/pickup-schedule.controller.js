const pickupScheduleService = require('../services/pickup-schedule.service');
const {
  validatePickupSchedule,
  validatePickupScheduleUpdate,
} = require('../validators/pickup-schedule.validators');

/**
 * POST /api/v1/pickup-schedules
 * Schedule a pickup for an order (admin-only)
 */
async function createPickupScheduleHandler(req, res, next) {
  try {
    const { order_id, scheduled_at, notes } = req.body;

    validatePickupSchedule({ order_id, scheduled_at, notes });

    const pickupSchedule = await pickupScheduleService.createPickupSchedule({
      order_id,
      scheduled_at,
      notes,
    });

    res.status(201).json({
      success: true,
      data: pickupSchedule,
      message: 'Pickup schedule created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/pickup-schedules
 * List pickup schedules, filterable by ?date= (YYYY-MM-DD), ?status=, ?order_id= (admin-only)
 */
async function getPickupSchedulesHandler(req, res, next) {
  try {
    const { date, status, order_id } = req.query;

    const filters = {};
    if (date) filters.date = date;
    if (status) filters.status = status;
    if (order_id) filters.order_id = parseInt(order_id, 10);

    const pickupSchedules = await pickupScheduleService.getAllPickupSchedules(filters);

    res.json({
      success: true,
      data: pickupSchedules,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/pickup-schedules/:id
 * Fetch a single pickup schedule (admin-only)
 */
async function getPickupScheduleHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const pickupSchedule = await pickupScheduleService.getPickupScheduleById(id);

    res.json({
      success: true,
      data: pickupSchedule,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/pickup-schedules/:id
 * Mark done, reschedule, or edit notes (admin-only)
 */
async function updatePickupScheduleHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { scheduled_at, status, notes } = req.body;

    validatePickupScheduleUpdate({ scheduled_at, status, notes });

    const pickupSchedule = await pickupScheduleService.updatePickupSchedule(id, {
      scheduled_at,
      status,
      notes,
    });

    res.json({
      success: true,
      data: pickupSchedule,
      message: 'Pickup schedule updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPickupScheduleHandler,
  getPickupSchedulesHandler,
  getPickupScheduleHandler,
  updatePickupScheduleHandler,
};
