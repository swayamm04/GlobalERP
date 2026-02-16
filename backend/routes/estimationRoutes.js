const express = require('express');
const router = express.Router();
const { getEstimations, createEstimation } = require('../controllers/estimationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getEstimations);
router.post('/', protect, createEstimation);

module.exports = router;
