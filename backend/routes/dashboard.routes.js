const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/summary', dashboardController.getSummary);

module.exports = router;
