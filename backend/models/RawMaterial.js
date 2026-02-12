const mongoose = require('mongoose');

const rawMaterialSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['pieces', 'kg', 'quintal', 'ton'],
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
