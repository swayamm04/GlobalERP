const mongoose = require('mongoose');

const purchaseOrderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    poNumber: {
        type: String,
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'pieces' },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'In Transit', 'Delivered', 'Cancelled'],
        default: 'Delivered'
    },
    orderedDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
