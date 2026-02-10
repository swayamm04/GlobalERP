const express = require('express');
const router = express.Router();
const { getRawMaterials, createRawMaterial, updateRawMaterial } = require('../controllers/rawMaterialController');

router.route('/')
    .get(getRawMaterials)
    .post(createRawMaterial);

router.route('/:id')
    .put(updateRawMaterial);

module.exports = router;
