const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, req = null) => {
    try {
        const logData = {
            user: userId,
            action,
            details
        };

        if (req) {
            // Bypass logging if in secret context
            if (req.headers['x-secret-context'] === 'true') {
                return;
            }
            logData.ipAddress = req.ip || req.connection.remoteAddress;
        }

        await ActivityLog.create(logData);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = logActivity;
