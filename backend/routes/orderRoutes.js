const express = require('express');
const router = express.Router();
const { getOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Temporarily removing protect for smoother dev/testing as requested previously
// router.get('/', protect, getOrders);
router.get('/', getOrders);

module.exports = router;
