const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};

        if (type && type !== 'all') {
            query.customerType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }

        const customers = await Customer.find(query).sort({ updatedAt: -1 });
        res.status(200).json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            res.status(200).json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getCustomers,
    getCustomerById
};
