const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    address: {
        type: String
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

    // Stats
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
