const express = require('express');
const router = express.Router();
const { getPurchaseOrders, createPurchaseOrder, updatePOStatus } = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPurchaseOrders)
    .post(protect, createPurchaseOrder);

router.route('/:id/status')
    .put(protect, updatePOStatus);

module.exports = router;
