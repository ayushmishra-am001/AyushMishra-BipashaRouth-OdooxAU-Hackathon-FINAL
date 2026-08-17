const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.post('/image', requireAuth, requireRole(ROLES.ADMIN), uploadController.uploadImage);

module.exports = router;
