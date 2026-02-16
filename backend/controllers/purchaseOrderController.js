const PurchaseOrder = require('../models/PurchaseOrder');
const RawMaterial = require('../models/RawMaterial');
const logActivity = require('../utils/activityLogger');

const updateInventoryStock = async (items) => {
    for (const item of items) {
        const material = await RawMaterial.findOne({ name: item.name });
        if (material) {
            material.stockQuantity += item.quantity;
            await material.save();
        } else {
            // Create material if it doesn't exist
            await RawMaterial.create({
                name: item.name,
                category: 'Others',
                stockQuantity: item.quantity
            });
        }
    }
};

// @desc    Get all POs
// @route   GET /api/purchase-orders
const getPurchaseOrders = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find()
            .populate('supplier', 'companyName')
            .sort({ createdAt: -1 });
        res.status(200).json(pos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a PO
// @route   POST /api/purchase-orders
const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalAmount, deliveryDate, notes } = req.body;

        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        const po = await PurchaseOrder.create({
            poNumber,
            supplier,
            items,
            totalAmount,
            deliveryDate,
            notes,
            status: 'Delivered'
        });

        // Automatically update stock as it's created after delivery
        await updateInventoryStock(items);

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CREATED_PURCHASE_ORDER',
                `Created purchase order: ${po.poNumber} for supplier ID: ${supplier}`,
                req
            );
        }

        res.status(201).json(po);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update PO status (and stock if delivered)
// @route   PUT /api/purchase-orders/:id/status
const updatePOStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);

        if (!po) {
            return res.status(404).json({ message: 'PO not found' });
        }

        const oldStatus = po.status;
        po.status = status;
        await po.save();

        // If status changed to Delivered, update RawMaterial stock
        if (status === 'Delivered' && oldStatus !== 'Delivered') {
            await updateInventoryStock(po.items);
        }

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_PO_STATUS',
                `Updated PO: ${po.poNumber} status to ${status}`,
                req
            );
        }

        res.status(200).json(po);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPurchaseOrders,
    createPurchaseOrder,
    updatePOStatus
};
