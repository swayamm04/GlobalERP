const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    projectName: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    numLabours: {
        type: Number,
        required: true
    },
    grandAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balanceDue: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
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

module.exports = mongoose.model('Project', projectSchema);
