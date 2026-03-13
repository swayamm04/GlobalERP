const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');

// Helper to update product stock
const updateProductStock = async (items, type = 'deduct') => {
    if (!items || !Array.isArray(items)) return;
    for (const item of items) {
        try {
            if (!item.productId) continue;
            const product = await Product.findById(item.productId);
            if (product) {
                if (type === 'deduct') {
                    product.stock -= (item.quantity || 0);
                } else {
                    product.stock += (item.quantity || 0);
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
        } catch (error) {
            console.error(`Error updating stock for product ${item.productId}:`, error);
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
            itemsCount: order.items.length,
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                unit: item.unit
            })),
            amount: order.grandTotal || 0,
            status: order.status,
            paymentMethod: order.paymentMethod,
            customerType: order.customerType,
            balanceDue: order.balanceDue || 0,
            paidAmount: order.paidAmount || 0,
            paymentHistory: order.paymentHistory || [],
            invoiceNo: order.invoiceNo,
            includeGST: order.includeGST,
            isDummy: order.isDummy || false,
            isPastOrder: order.isPastOrder || false
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
            includeGST,
            createdAt, // Add createdAt
            isPastOrder,
            isDummy
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
            isDummy: isDummy === true,
            isPastOrder: isPastOrder === true,
            status: status || 'Pending',
            paymentHistory: [{
                amount: paidAmount || 0,
                method: paymentMethod || modeOfPayment || 'Cash',
                date: createdAt ? new Date(createdAt) : new Date() // Use createdAt for initial payment if provided
            }]
        };

        if (createdAt) {
            orderData.createdAt = new Date(createdAt);
        }

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
        if (!isPastOrder && !isDummy) {
            try {
                await updateProductStock(orderData.items, 'deduct');
            } catch (stockError) {
                console.error('Error updating stock on order creation:', stockError);
            }
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
            try {
                if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
                    await updateProductStock(order.items, 'refill');
                } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
                    await updateProductStock(order.items, 'deduct');
                }
            } catch (stockError) {
                console.error('Stock update failed during status change:', stockError);
            }

            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
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

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            await Order.deleteOne({ _id: order._id });

            // Log Activity
            if (req.user && order.includeGST !== false) {
                await logActivity(
                    req.user._id,
                    'DELETED_ORDER',
                    `Deleted order #${order.invoiceNo || order._id}`,
                    req
                );
            }

            res.status(200).json({ message: 'Order removed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error in deleteOrder:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Check if stock needs to be adjusted back before applying new items
            // But for Dummy and Past orders, we skip stock deduction/addition as per user request
            
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
                includeGST,
                createdAt,
                isPastOrder,
                isDummy
            } = req.body;

            order.customerName = customerName || order.customerName;
            order.contact = contact || order.contact;
            order.address = address || order.address;
            order.items = items || order.items;
            order.subtotal = subtotal !== undefined ? subtotal : order.subtotal;
            order.discount = discount !== undefined ? discount : order.discount;
            order.grandTotal = grandTotal !== undefined ? grandTotal : order.grandTotal;
            order.paidAmount = paidAmount !== undefined ? paidAmount : order.paidAmount;
            order.balanceDue = balanceDue !== undefined ? balanceDue : order.balanceDue;
            order.paymentMethod = paymentMethod || order.paymentMethod;
            order.customerType = customerType || order.customerType;
            order.companyName = companyName || order.companyName;
            order.gstin = gstin || order.gstin;
            order.stateName = stateName || order.stateName;
            order.stateCode = stateCode || order.stateCode;
            order.email = email || order.email;
            order.invoiceNo = invoiceNo || order.invoiceNo;
            order.invoiceDate = invoiceDate || order.invoiceDate;
            order.deliveryNote = deliveryNote || order.deliveryNote;
            order.modeOfPayment = modeOfPayment || order.modeOfPayment;
            order.referenceNo = referenceNo || order.referenceNo;
            order.otherReferences = otherReferences || order.otherReferences;
            order.buyersOrderNo = buyersOrderNo || order.buyersOrderNo;
            order.buyersOrderDate = buyersOrderDate || order.buyersOrderDate;
            order.dispatchDocNo = dispatchDocNo || order.dispatchDocNo;
            order.deliveryNoteDate = deliveryNoteDate || order.deliveryNoteDate;
            order.dispatchedThrough = dispatchedThrough || order.dispatchedThrough;
            order.destination = destination || order.destination;
            order.billOfLading = billOfLading || order.billOfLading;
            order.motorVehicleNo = motorVehicleNo || order.motorVehicleNo;
            order.termsOfDelivery = termsOfDelivery || order.termsOfDelivery;
            order.status = status || order.status;
            order.includeGST = includeGST !== undefined ? includeGST : order.includeGST;
            
            if (createdAt) {
                order.createdAt = new Date(createdAt);
            }
            
            if (isPastOrder !== undefined) order.isPastOrder = isPastOrder;
            if (isDummy !== undefined) order.isDummy = isDummy;

            const updatedOrder = await order.save();

            // Log Activity
            if (req.user && order.includeGST !== false) {
                await logActivity(
                    req.user._id,
                    'UPDATED_ORDER',
                    `Updated order #${order.invoiceNo || order._id}`,
                    req
                );
            }

            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error in updateOrder:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get next sequential invoice number for a given date
// @route   GET /api/orders/next-invoice-number
// @access  Private
const getNextInvoiceNumber = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        // Format date part: YYMMDD
        const year = startOfDay.getFullYear().toString().slice(-2);
        const month = (startOfDay.getMonth() + 1).toString().padStart(2, '0');
        const day = startOfDay.getDate().toString().padStart(2, '0');
        const datePrefix = `INV/${year}${month}${day}/`;

        // Find the latest invoice number with this prefix
        const lastOrder = await Order.findOne({
            invoiceNo: { $regex: `^${datePrefix}` }
        }).sort({ invoiceNo: -1 });

        let nextNumber = 1;
        if (lastOrder && lastOrder.invoiceNo) {
            const parts = lastOrder.invoiceNo.split('/');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) {
                nextNumber = lastSeq + 1;
            }
        }

        const nextInvoiceNo = `${datePrefix}${nextNumber.toString().padStart(3, '0')}`;
        res.status(200).json({ nextInvoiceNo });
    } catch (error) {
        console.error('Error in getNextInvoiceNumber:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Clear all dummy orders history
// @route   DELETE /api/orders/dummy
// @access  Private
const clearDummyOrders = async (req, res) => {
    try {
        const result = await Order.deleteMany({ isDummy: true, isPastOrder: { $ne: true } });
        
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CLEARED_DUMMY_HISTORY',
                `Cleared dummy orders history (${result.deletedCount} orders)`,
                req
            );
        }

        res.status(200).json({ message: 'Dummy history cleared', deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Error in clearDummyOrders:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Clear all past orders history
// @route   DELETE /api/orders/past
// @access  Private
const clearPastOrders = async (req, res) => {
    try {
        const result = await Order.deleteMany({ isPastOrder: true });
        
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CLEARED_PAST_HISTORY',
                `Cleared past orders history (${result.deletedCount} orders)`,
                req
            );
        }

        res.status(200).json({ message: 'Past history cleared', deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Error in clearPastOrders:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    getOrderById,
    updateOrderStatus,
    markOrderAsPaid,
    addPayment,
    deleteOrder,
    updateOrder,
    getNextInvoiceNumber,
    clearDummyOrders,
    clearPastOrders
};
