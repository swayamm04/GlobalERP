const express = require('express');
const router = express.Router();
const { getEstimations, createEstimation } = require('../controllers/estimationController');
// Assuming authMiddleware exists based on other routes
// const { protect } = require('../middleware/authMiddleware');

router.get('/', getEstimations);
router.post('/', createEstimation);

module.exports = router;
