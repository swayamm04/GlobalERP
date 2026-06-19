const CompanySettings = require('../models/CompanySettings');
const logActivity = require('../utils/activityLogger');

// @desc    Get company settings
// @route   GET /api/company-settings
// @access  Public (or Private if auth middleware is added later)
const getSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne({ user: req.user.id });
        if (!settings) {
            // Create default settings if none exist
            settings = await CompanySettings.create({ user: req.user.id });
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
        let settings = await CompanySettings.findOne({ user: req.user.id });

        if (settings) {
            settings = await CompanySettings.findOneAndUpdate(
                { user: req.user.id },
                req.body,
                { new: true, runValidators: true }
            );
        } else {
            settings = await CompanySettings.create({ ...req.body, user: req.user.id });
        }

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_SETTINGS',
                `Updated company settings`,
                req
            );
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
