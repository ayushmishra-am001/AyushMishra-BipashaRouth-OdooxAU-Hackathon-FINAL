const express = require('express');
const rentalPeriodController = require('../controllers/rental-period.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', rentalPeriodController.create);
router.get('/', rentalPeriodController.list);
router.get('/:id', rentalPeriodController.getById);
router.put('/:id', rentalPeriodController.update);
router.delete('/:id', rentalPeriodController.remove);

module.exports = router;
