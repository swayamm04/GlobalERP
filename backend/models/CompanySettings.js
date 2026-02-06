const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
    companyName: { type: String, default: 'Metal Industry' },
    gstin: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: '' },
    gstCode: { type: String, default: '' },
    invoicePrefix: { type: String, default: 'INV-' },
    financialYear: { type: String, default: '2025-26' },
    isGstEnabled: { type: Boolean, default: true },
    bankDetails: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        branch: { type: String, default: '' }
    },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
