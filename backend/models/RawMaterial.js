const mongoose = require('mongoose');

const rawMaterialSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['pieces', 'kg', 'quintal', 'ton', 'feet'],
        default: 'pieces'
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0
    },
    minStockLevel: {
        type: Number,
        default: 10
    },
    specifications: [{
        label: String,
        value: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
