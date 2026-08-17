const express = require('express');
const pricelistItemController = require('../controllers/pricelist-item.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router({ mergeParams: true });

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', pricelistItemController.create);
router.get('/', pricelistItemController.listByPricelist);
router.get('/:itemId', pricelistItemController.getById);
router.put('/:itemId', pricelistItemController.update);
router.delete('/:itemId', pricelistItemController.remove);

module.exports = router;
