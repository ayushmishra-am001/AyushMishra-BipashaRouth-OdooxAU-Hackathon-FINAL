const express = require('express');
const depositController = require('../controllers/deposit.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/', depositController.list);
router.get('/:depositId', depositController.getById);
router.post('/:depositId/settle', depositController.settle);

module.exports = router;
