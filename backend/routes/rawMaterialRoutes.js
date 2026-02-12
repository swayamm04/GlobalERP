const express = require('express');
const router = express.Router();
const { getRawMaterials, createRawMaterial, updateRawMaterial, addRawMaterialStock } = require('../controllers/rawMaterialController');

router.route('/')
    .get(getRawMaterials)
    .post(createRawMaterial);

router.route('/:id')
    .put(updateRawMaterial);

router.route('/:id/add-stock')
    .put(addRawMaterialStock);

module.exports = router;
