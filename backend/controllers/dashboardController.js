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
        const totalActiveOrders = await Order.countDocuments({ status: { $ne: 'Completed' } });

        // Calculate total revenue (only delivered orders)
        const orders = await Order.find({ status: 'Completed' });
        const totalRevenue = orders.reduce((acc, order) => acc + (order.grandTotal || 0), 0);

        const activeCustomers = await User.countDocuments();

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5);

        const formattedOrders = recentOrders.map(order => ({
            id: order._id,
            customer: order.customerName,
            items: order.items.length,
            amount: order.grandTotal || 0,
            status: order.status
        }));

        res.status(200).json({
            totalProducts,
            totalOrders,
            totalActiveOrders,
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
