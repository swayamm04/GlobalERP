const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/companySettingsController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, getSettings);
router.put('/', protect, superAdmin, updateSettings);

module.exports = router;
