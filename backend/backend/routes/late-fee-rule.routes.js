const express = require('express');
const lateFeeRuleController = require('../controllers/late-fee-rule.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/', lateFeeRuleController.create);
router.get('/', lateFeeRuleController.list);
router.get('/:id', lateFeeRuleController.getById);
router.put('/:id', lateFeeRuleController.update);
router.delete('/:id', lateFeeRuleController.remove);

module.exports = router;
