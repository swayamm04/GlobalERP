const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please add a category'],
        ref: 'Category'
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        default: 0
    },
    unit: {
        type: String,
        enum: ['pcs', 'kg'],
        default: 'pcs'
    },
    price: {

        type: Number,
        required: [true, 'Please add a price'],
        default: 0
    },
    status: {
        type: String,
        enum: ['In Stock', 'Low Stock', 'Out of Stock'],
        default: 'In Stock'
    },
    color: {
        type: String,
        required: false
    },
    length: {
        type: String,
        required: false
    },
    thickness: {
        type: String,
        required: false
    },
    cgst: {
        type: Number,
        default: 9
    },
    sgst: {
        type: Number,
        default: 9
    },
    customFields: [
        {
            label: String,
            value: String,
            unit: String
        }
    ],
    calculationField: {
        label: { type: String, default: "" },
        value: { type: String, default: "" },
        unit: { type: String, default: "" }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
