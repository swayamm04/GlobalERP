const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/companySettingsController');

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
