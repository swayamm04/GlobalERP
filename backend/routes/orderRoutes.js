const express = require('express');
const router = express.Router();
const { getOrders, createOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Temporarily removing protect for smoother dev/testing
router.route('/')
    .get(getOrders)
    .post(createOrder);

module.exports = router;
