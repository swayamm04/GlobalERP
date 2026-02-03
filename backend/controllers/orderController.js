const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('product', 'name')
            .sort({ createdAt: -1 });

        // Transform data to match frontend requirements if necessary, 
        // or just send as IS and handle on frontend. 
        // Let's format it slightly to include easy to read dates and product names.

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customer: order.customerName,
            date: order.createdAt,
            product: order.product ? order.product.name : 'Unknown Product',
            // items: 1, // Order model is simple for now, 1 item per order
            amount: order.amount,
            status: order.status
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getOrders
};
