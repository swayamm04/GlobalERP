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
        type: String,
        required: [true, 'Please add a category']
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        default: 0
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
        required: [true, 'Please add a color']
    },
    length: {
        type: String,
        required: [true, 'Please add a length']
    },
    thickness: {
        type: String,
        required: false
    },
    hsnCode: {
        type: String,
        required: [true, 'Please add an HSN code']
    },
    customFields: [
        {
            label: String,
            value: String
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
