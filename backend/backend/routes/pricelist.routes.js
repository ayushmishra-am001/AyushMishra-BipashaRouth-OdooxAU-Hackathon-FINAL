const express = require('express');
const pricelistController = require('../controllers/pricelist.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', pricelistController.create);
router.get('/', pricelistController.list);
router.get('/:id', pricelistController.getById);
router.put('/:id', pricelistController.update);
router.delete('/:id', pricelistController.remove);

module.exports = router;
