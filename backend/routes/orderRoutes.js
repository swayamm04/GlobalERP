const express = require('express');
const router = express.Router();
const { getOrders, createOrder, getOrderById, updateOrderStatus, markOrderAsPaid } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Temporarily removing protect for smoother dev/testing
router.route('/')
    .get(getOrders)
    .post(createOrder);

router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/pay', markOrderAsPaid);

module.exports = router;
