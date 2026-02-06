const CompanySettings = require('../models/CompanySettings');

// @desc    Get company settings
// @route   GET /api/company-settings
// @access  Public (or Private if auth middleware is added later)
const getSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await CompanySettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update company settings
// @route   PUT /api/company-settings
// @access  Public
const updateSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne();

        if (settings) {
            settings = await CompanySettings.findByIdAndUpdate(
                settings._id,
                req.body,
                { new: true, runValidators: true }
            );
        } else {
            settings = await CompanySettings.create(req.body);
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
