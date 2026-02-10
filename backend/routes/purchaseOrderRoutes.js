const express = require('express');
const router = express.Router();
const { getPurchaseOrders, createPurchaseOrder, updatePOStatus } = require('../controllers/purchaseOrderController');

router.route('/')
    .get(getPurchaseOrders)
    .post(createPurchaseOrder);

router.route('/:id/status')
    .put(updatePOStatus);

module.exports = router;
