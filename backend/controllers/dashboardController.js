const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        if (req.user && req.user.role === 'super_admin') {
            const totalCompanies = await User.countDocuments({ role: 'admin' });
            
            const revenueResult = await User.aggregate([
                { $match: { role: 'admin' } },
                { $group: { _id: null, total: { $sum: '$amountPaid' } } }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            const recentlyJoined = await User.find({ role: 'admin' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('-password');

            // Find companies expiring in the next 30 days, or already expired
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            const warnings = await User.find({
                role: 'admin',
                subscriptionEndDate: { $lte: thirtyDaysFromNow }
            })
            .sort({ subscriptionEndDate: 1 })
            .select('-password');

            return res.status(200).json({
                totalCompanies,
                totalRevenue,
                recentlyJoined,
                warnings
            });
        }

        const isSecret = req.query.secret === 'true';
        const filter = isSecret
            ? { includeGST: false, user: req.user._id }
            : { includeGST: { $ne: false }, user: req.user._id };

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

        // Products and Customers isolated per tenant
        const totalProducts = await Product.countDocuments({ user: req.user.id });
        const activeCustomers = await Customer.countDocuments({ user: req.user.id });

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
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getDashboardStats
};
