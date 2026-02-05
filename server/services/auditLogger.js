const db = require('../config/db');

/**
 * Log a user action to the audit_logs table
 * @param {Object} req - Express request object (to extract user/IP)
 * @param {string} action - Action name (e.g., 'TRUCK_DELETE')
 * @param {string|number} targetId - ID of the affected object
 * @param {Object} details - Additional details/metadata
 */
const logAction = async (req, action, targetId, details = {}) => {
    try {
        const userId = req.session?.userId || null;
        const username = req.session?.username || 'system/guest';

        // simple IP extraction
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Ensure details is a valid JSON object/string
        // MySQL JSON column handles objects automatically if using prepared statements correctly, 
        // but explicit JSON.stringify is safer for basic inserts if not using specific JSON type binders depending on library version.
        // mysql2 usually handles objects for JSON columns fine, but let's be safe.

        await db.query(
            `INSERT INTO audit_logs (user_id, username, action, target_id, details, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, username, action, String(targetId), JSON.stringify(details), ipAddress]
        );

    } catch (error) {
        // Silent fail to not disrupt main flow, but log error
        console.error('Audit Log Error:', error);
    }
};

module.exports = { logAction };
