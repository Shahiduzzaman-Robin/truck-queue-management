const db = require('../config/db');
const bcrypt = require('bcrypt');

// Get all admin users
exports.getAllAdmins = async (req, res) => {
    try {
        // Fetch admins with warehouse info (if needed, or just IDs)
        // Join with warehouses table to get warehouse names
        const query = `
            SELECT a.id, a.username, a.role, a.warehouse_id, w.name as warehouse_name 
            FROM admin_users a 
            LEFT JOIN warehouses w ON a.warehouse_id = w.id
            ORDER BY a.username ASC
        `;
        const [admins] = await db.query(query);

        res.json({
            success: true,
            admins
        });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve admins'
        });
    }
};

// Create new admin
exports.createAdmin = async (req, res) => {
    try {
        const { username, password, role, warehouse_id } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check if username exists
        const [existing] = await db.query('SELECT id FROM admin_users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle null warehouse_id for super_admin if needed, but usually super_admin has NULL warehouse_id
        // Ensure warehouse_id is NULL if role is super_admin? Or allow it? 
        // User request says "add new admins to any warehouses".

        const finalWarehouseId = (role === 'super_admin') ? null : warehouse_id;
        const finalRole = role || 'admin';

        await db.query(
            'INSERT INTO admin_users (username, password_hash, role, warehouse_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, finalRole, finalWarehouseId]
        );

        res.status(201).json({
            success: true,
            message: 'Admin created successfully'
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin'
        });
    }
};

// Update admin (password, username, etc.)
exports.updateAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;
        const { username, password, warehouse_id } = req.body;

        // Verify admin exists
        const [existing] = await db.query('SELECT * FROM admin_users WHERE id = ?', [adminId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Build update query dynamically
        let updates = [];
        let params = [];

        if (username) {
            // Check uniqueness if changing username
            if (username !== existing[0].username) {
                const [check] = await db.query('SELECT id FROM admin_users WHERE username = ? AND id != ?', [username, adminId]);
                if (check.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
            }
            updates.push('username = ?');
            params.push(username);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            params.push(hashedPassword);
        }

        if (warehouse_id !== undefined) {
            // Allow setting to null explicitly if passed
            updates.push('warehouse_id = ?');
            params.push(warehouse_id);
        }

        // Don't update role for now unless requested? User said "add new admins... change password and username".
        // Implicitly allows changing warehouse too as per "add new admins to any warehouses" context implying assignment management.

        if (updates.length > 0) {
            const query = `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`;
            params.push(adminId);
            await db.query(query, params);
        }

        res.json({
            success: true,
            message: 'Admin updated successfully'
        });

    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update admin'
        });
    }
};

// Delete admin (optional, but good to have)
exports.deleteAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;

        // prevent deleting oneself?
        if (parseInt(adminId) === req.session.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await db.query('DELETE FROM admin_users WHERE id = ?', [adminId]);

        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete admin'
        });
    }
};
