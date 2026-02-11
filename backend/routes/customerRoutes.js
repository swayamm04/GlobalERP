const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById } = require('../controllers/customerController');
// const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getCustomers);
router.route('/:id').get(getCustomerById);

module.exports = router;
