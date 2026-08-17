const express = require('express');
const variantController = require('../controllers/variant.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router({ mergeParams: true });

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', variantController.create);
router.get('/', variantController.listByProduct);
router.get('/:variantId', variantController.getById);
router.put('/:variantId', variantController.update);
router.delete('/:variantId', variantController.remove);

module.exports = router;
