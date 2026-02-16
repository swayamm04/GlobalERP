const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');

// Helper to update product stock
const updateProductStock = async (items, type = 'deduct') => {
    for (const item of items) {
        if (!item.productId) continue;
        const product = await Product.findById(item.productId);
        if (product) {
            if (type === 'deduct') {
                product.stock -= item.quantity;
            } else {
                product.stock += item.quantity;
            }
            // Update status based on new stock level
            if (product.stock <= 0) {
                product.status = 'Out of Stock';
            } else if (product.stock <= 5) { // Assuming 5 as low stock threshold
                product.status = 'Low Stock';
            } else {
                product.status = 'In Stock';
            }
            await product.save();
        }
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const isSecret = req.query.secret === 'true';
        const filter = isSecret
            ? { includeGST: false }
            : { includeGST: { $ne: false } };

        const orders = await Order.find(filter).sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customer: order.customerName,
            date: order.createdAt,
            items: order.items.length,
            amount: order.grandTotal || 0,
            status: order.status,
            paymentMethod: order.paymentMethod,
            customerType: order.customerType,
            balanceDue: order.balanceDue || 0,
            paidAmount: order.paidAmount || 0,
            paymentHistory: order.paymentHistory || [],
            includeGST: order.includeGST
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
            termsOfDelivery,
            status,
            includeGST
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
            termsOfDelivery,
            includeGST: includeGST === false ? false : true,
            status: status || 'Pending',
            paymentHistory: [{
                amount: paidAmount || 0,
                method: paymentMethod || modeOfPayment || 'Cash',
                date: new Date()
            }]
        };

        if (req.user) {
            orderData.user = req.user._id;
        }

        const order = new Order(orderData);
        const createdOrder = await order.save();

        // Log Activity
        if (req.user && req.body.includeGST !== false) {
            await logActivity(
                req.user._id,
                'CREATED_ORDER',
                `Created order with Invoice #${invoiceNo || 'N/A'} for ${customerName}`,
                req
            );
        }

        // Deduct stock
        try {
            await updateProductStock(orderData.items, 'deduct');
        } catch (stockError) {
            console.error('Error updating stock on order creation:', stockError);
        }

        // Update/Create Customer record
        try {
            const customerType = orderData.customerType || 'Individual';
            let customer = await Customer.findOne({ contact: orderData.contact });

            if (!customer) {
                customer = new Customer({
                    name: orderData.customerName,
                    contact: orderData.contact,
                    email: orderData.email,
                    address: orderData.address,
                    customerType: customerType,
                    companyName: orderData.companyName,
                    gstin: orderData.gstin,
                    stateName: orderData.stateName,
                    stateCode: orderData.stateCode
                });
            }

            customer.totalOrders += 1;
            customer.totalSpent += (orderData.grandTotal || 0);
            customer.lastOrderDate = new Date();
            customer.name = orderData.customerName;
            customer.address = orderData.address;
            customer.email = orderData.email || customer.email;
            if (customerType === 'Business') {
                customer.companyName = orderData.companyName || customer.companyName;
                customer.gstin = orderData.gstin || customer.gstin;
                customer.stateName = orderData.stateName || customer.stateName;
                customer.stateCode = orderData.stateCode || customer.stateCode;
            }

            await customer.save();
        } catch (custError) {
            console.error('Error updating customer record:', custError);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            const oldStatus = order.status;
            order.status = status;
            const updatedOrder = await order.save();

            // Log Activity
            if (req.user && order.includeGST !== false) {
                await logActivity(
                    req.user._id,
                    'UPDATED_ORDER_STATUS',
                    `Updated order #${order.invoiceNo || order._id} status from ${oldStatus} to ${status}`,
                    req
                );
            }

            // Handle stock refill/deduction on status change
            if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
                await updateProductStock(order.items, 'refill');
            } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
                await updateProductStock(order.items, 'deduct');
            }

            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
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

// @desc    Add payment to order
// @route   PATCH /api/orders/:id/payment
// @access  Private
const addPayment = async (req, res) => {
    try {
        const { amount, method } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            const paymentAmount = Number(amount);
            order.paidAmount = (order.paidAmount || 0) + paymentAmount;
            order.balanceDue = Math.max(0, (order.balanceDue || 0) - paymentAmount);

            order.paymentHistory.push({
                amount: paymentAmount,
                method: method || order.paymentMethod || 'Cash',
                date: new Date()
            });

            const updatedOrder = await order.save();

            // Log Activity
            if (req.user && order.includeGST !== false) {
                await logActivity(
                    req.user._id,
                    'ADDED_PAYMENT',
                    `Added payment of ${paymentAmount} to order #${order.invoiceNo || order._id}`,
                    req
                );
            }

            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark order as fully paid (legacy support)
// @route   PATCH /api/orders/:id/pay
// @access  Private
const markOrderAsPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            const remainingDue = order.balanceDue || 0;
            if (remainingDue > 0) {
                order.paymentHistory.push({
                    amount: remainingDue,
                    method: order.paymentMethod || 'Cash',
                    date: new Date()
                });
            }
            order.paidAmount = (order.paidAmount || 0) + remainingDue;
            order.balanceDue = 0;
            const updatedOrder = await order.save();

            // Log Activity
            if (req.user && order.includeGST !== false) {
                await logActivity(
                    req.user._id,
                    'MARKED_ORDER_PAID',
                    `Marked order #${order.invoiceNo || order._id} as fully paid`,
                    req
                );
            }

            res.status(200).json(updatedOrder);
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
    getOrderById,
    updateOrderStatus,
    markOrderAsPaid,
    addPayment
};
