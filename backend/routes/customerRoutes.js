const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getCustomers);
router.route('/:id').get(protect, getCustomerById);

module.exports = router;
