const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
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
            unit: String,
            category: String,

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
    paidAmount: {
        type: Number,
        required: true
    },
    balanceDue: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    customerType: {
        type: String,
        enum: ['Individual', 'Business'],
        default: 'Individual'
    },
    // Business specific fields
    companyName: String,
    gstin: String,
    stateName: String,
    stateCode: String,
    email: String,
    // Delivery credentials
    invoiceNo: String,
    invoiceDate: Date,
    deliveryNote: String,
    modeOfPayment: String,
    referenceNo: String,
    otherReferences: String,
    buyersOrderNo: String,
    buyersOrderDate: Date,
    dispatchDocNo: String,
    deliveryNoteDate: Date,
    dispatchedThrough: String,
    destination: String,
    billOfLading: String,
    motorVehicleNo: String,
    termsOfDelivery: String,
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Completed'],
        default: 'Pending'
    },
    paymentHistory: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            method: { type: String, required: true }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
