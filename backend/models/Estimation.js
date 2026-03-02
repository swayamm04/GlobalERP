const mongoose = require('mongoose');

const estimationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    items: [
        {
            productName: String,
            quantity: Number,
            price: Number,
            category: String,
            hsnCode: String,
            customFields: [
                {
                    label: String,
                    value: String,
                    unit: String
                }
            ]
        }
    ],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    customerType: {
        type: String,
        enum: ['Individual', 'Business'],
        default: 'Individual'
    },
    companyName: String,
    gstin: String,
    stateName: String,
    stateCode: String,
    email: String,
    estimationNo: String,
    date: {
        type: Date,
        default: Date.now
    },
    includeGST: {
        type: Boolean,
        default: true
    },
    cgst: {
        type: Number,
        default: 0
    },
    sgst: {
        type: Number,
        default: 0
    },
    roundOff: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Estimation', estimationSchema);
