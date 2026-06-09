const express = require('express');
const router = express.Router();
const { getOrders, createOrder, getOrderById, updateOrderStatus, markOrderAsPaid, addPayment, deleteOrder, updateOrder, getNextInvoiceNumber, clearDummyOrders, clearPastOrders, recalculateOldCalculations } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.get('/next-invoice-number', protect, getNextInvoiceNumber);
router.post('/recalculate-calculations', protect, recalculateOldCalculations);

router.route('/')
    .get(protect, getOrders)
    .post(protect, createOrder);

router.get('/:id', protect, getOrderById);
router.put('/:id', protect, updateOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/pay', protect, markOrderAsPaid);
router.delete('/dummy', protect, clearDummyOrders);
router.delete('/past', protect, clearPastOrders);
router.patch('/:id/payment', protect, addPayment);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
