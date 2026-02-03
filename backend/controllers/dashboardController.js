const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate total revenue
        const orders = await Order.find();
        const totalRevenue = orders.reduce((acc, order) => acc + order.amount, 0);

        const activeCustomers = await User.countDocuments(); // Simplified for now, can be real active customers logic later

        const recentOrders = await Order.find()
            .populate('product', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const formattedOrders = recentOrders.map(order => ({
            id: order._id,
            customer: order.customerName,
            product: order.product ? order.product.name : 'Unknown Product',
            amount: order.amount,
            status: order.status
        }));

        res.status(200).json({
            totalProducts,
            totalOrders,
            totalRevenue,
            activeCustomers,
            recentOrders: formattedOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats
};
