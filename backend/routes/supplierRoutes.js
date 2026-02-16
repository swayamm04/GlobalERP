const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, deleteSupplier, updateSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

// All routes are private/admin in this context
router.route('/')
    .get(protect, getSuppliers)
    .post(protect, createSupplier);

router.route('/:id')
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);

module.exports = router;
