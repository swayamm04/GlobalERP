const express = require('express');
const router = express.Router();
const { getOrders, createOrder, getOrderById, updateOrderStatus, markOrderAsPaid, addPayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getOrders)
    .post(protect, createOrder);

router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/pay', protect, markOrderAsPaid);
router.patch('/:id/payment', protect, addPayment);

module.exports = router;
