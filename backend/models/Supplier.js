const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    supplierId: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    contactPerson: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    products: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
