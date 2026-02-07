const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true
    },
    fields: [
        {
            label: {
                type: String,
                required: true
            },
            unit: {
                type: String,
                default: ''
            }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
