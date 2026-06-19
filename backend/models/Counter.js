const mongoose = require('mongoose');

const counterSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

counterSchema.index({ id: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
