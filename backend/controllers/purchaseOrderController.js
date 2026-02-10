const PurchaseOrder = require('../models/PurchaseOrder');
const RawMaterial = require('../models/RawMaterial');

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
            notes
        });
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
            for (const item of po.items) {
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
