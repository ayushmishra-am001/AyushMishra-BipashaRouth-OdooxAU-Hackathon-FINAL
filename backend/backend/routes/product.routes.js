const express = require('express');
const productController = require('../controllers/product.controller');
const browseController = require('../controllers/browse.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

// Public endpoints - optional auth (admins see inactive products too)
router.use(optionalAuth);
router.get('/', browseController.listPublic);
router.get('/:id', browseController.getByIdPublic);

// Admin-only endpoints for write operations
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

module.exports = router;
