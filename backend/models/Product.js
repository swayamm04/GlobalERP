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
        required: [true, 'Please add a category'],
        enum: ['Sheet', 'Ridge', 'Gutter', 'Flashing']
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
        required: [true, 'Please add a color'],
        enum: ['Red', 'Blue', 'Green']
    },
    length: {
        type: String,
        required: [true, 'Please add a length'],
        enum: ['10ft', '12ft', '20ft']
    },
    thickness: {
        type: String,
        required: false
    },
    hsnCode: {
        type: String,
        required: [true, 'Please add an HSN code']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
