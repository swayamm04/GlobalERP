const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, deleteSupplier } = require('../controllers/supplierController');

// All routes are private/admin in this context
router.route('/')
    .get(getSuppliers)
    .post(createSupplier);

router.route('/:id')
    .delete(deleteSupplier);

module.exports = router;
