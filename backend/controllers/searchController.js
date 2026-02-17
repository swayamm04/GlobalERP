const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');

// @desc    Global search across multiple entities
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({
                orders: [],
                products: [],
                customers: [],
                suppliers: []
            });
        }

        const searchRegex = new RegExp(q, 'i');
        const isObjectId = q.match(/^[0-9a-fA-F]{24}$/);

        // Search Orders
        const orderFilter = {
            $or: [
                { customerName: searchRegex }
            ]
        };
        if (isObjectId) {
            orderFilter.$or.push({ _id: q });
        }

        const orders = await Order.find(orderFilter)
            .limit(5)
            .select('_id customerName status grandTotal createdAt');

        // Search Products
        // First find categories that match the search
        const categories = await Category.find({ name: searchRegex }).select('_id');
        const categoryIds = categories.map(c => c._id);

        const products = await Product.find({
            $or: [
                { name: searchRegex },
                { category: { $in: categoryIds } }
            ]
        })
            .limit(5)
            .populate('category', 'name')
            .select('_id name category price stock');

        // Search Customers
        const customers = await Customer.find({
            $or: [
                { name: searchRegex },
                { companyName: searchRegex },
                { contact: searchRegex }
            ]
        })
            .limit(5)
            .select('_id name companyName contact customerType');

        // Search Suppliers
        const suppliers = await Supplier.find({
            $or: [
                { companyName: searchRegex },
                { contactPerson: searchRegex },
                { supplierId: searchRegex }
            ]
        })
            .limit(5)
            .select('_id companyName contactPerson supplierId');

        res.status(200).json({
            orders,
            products,
            customers,
            suppliers
        });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Server Error during search' });
    }
};

module.exports = {
    globalSearch
};
