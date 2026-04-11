const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const isSecret = req.query.secret === 'true';
        const filter = isSecret
            ? { includeGST: false }
            : { includeGST: { $ne: false } };

        const totalOrders = await Order.countDocuments(filter);
        const totalActiveOrders = await Order.countDocuments({
            ...filter,
            status: { $ne: 'Completed' }
        });

        // Calculate total revenue (only delivered/completed orders with specific filter)
        const orders = await Order.find({
            ...filter,
            status: 'Completed'
        });
        const totalRevenue = orders.reduce((acc, order) => acc + (order.grandTotal || 0), 0);

        // Products and Customers remain global for now, but we could filter if needed
        const totalProducts = await Product.countDocuments();
        const activeCustomers = await Customer.countDocuments();

        const recentOrders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(5);

        const formattedOrders = recentOrders.map(order => ({
            id: order._id,
            invoiceNo: order.invoiceNo,
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
