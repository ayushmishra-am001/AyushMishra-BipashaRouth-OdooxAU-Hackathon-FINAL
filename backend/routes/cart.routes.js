const express = require('express');
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// GET /api/v1/cart — get current active cart with items
router.get('/', cartController.getCart);

// POST /api/v1/cart/items — add item to cart
router.post('/items', cartController.addItem);

// PUT /api/v1/cart/items/:id — update cart item
router.put('/items/:id', cartController.updateItem);

// DELETE /api/v1/cart/items/:id — delete cart item
router.delete('/items/:id', cartController.deleteItem);

module.exports = router;
