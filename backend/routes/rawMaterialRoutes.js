const express = require('express');
const router = express.Router();
const { getRawMaterials, createRawMaterial, updateRawMaterial, addRawMaterialStock } = require('../controllers/rawMaterialController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getRawMaterials)
    .post(protect, createRawMaterial);

router.route('/:id')
    .put(protect, updateRawMaterial);

router.route('/:id/add-stock')
    .put(protect, addRawMaterialStock);

module.exports = router;
