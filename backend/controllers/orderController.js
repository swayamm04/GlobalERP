const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customer: order.customerName,
            date: order.createdAt,
            items: order.items.length,
            amount: order.grandTotal || 0,
            status: order.status,
            paymentMethod: order.paymentMethod
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const {
            customerName,
            contact,
            address,
            items,
            subtotal,
            discount,
            grandTotal,
            paidAmount,
            balanceDue,
            paymentMethod,
            customerType,
            companyName,
            gstin,
            stateName,
            stateCode,
            email,
            invoiceNo,
            invoiceDate,
            deliveryNote,
            modeOfPayment,
            referenceNo,
            otherReferences,
            buyersOrderNo,
            buyersOrderDate,
            dispatchDocNo,
            deliveryNoteDate,
            dispatchedThrough,
            destination,
            billOfLading,
            motorVehicleNo,
            termsOfDelivery
        } = req.body;

        const orderData = {
            customerName,
            contact,
            address,
            items,
            subtotal,
            discount,
            grandTotal,
            paidAmount,
            balanceDue,
            paymentMethod,
            customerType,
            companyName,
            gstin,
            stateName,
            stateCode,
            email,
            invoiceNo,
            invoiceDate,
            deliveryNote,
            modeOfPayment,
            referenceNo,
            otherReferences,
            buyersOrderNo,
            buyersOrderDate,
            dispatchDocNo,
            deliveryNoteDate,
            dispatchedThrough,
            destination,
            billOfLading,
            motorVehicleNo,
            termsOfDelivery
        };

        if (req.user) {
            orderData.user = req.user._id;
        }

        const order = new Order(orderData);

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            res.status(200).json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getOrders,
    createOrder,
    getOrderById
};
