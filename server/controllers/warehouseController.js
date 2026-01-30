const db = require('../config/db');

// Get all active warehouses (public access)
const getAllWarehouses = async (req, res) => {
    try {
        const [warehouses] = await db.query(
            'SELECT id, name, short_name, status FROM warehouses WHERE status = ?',
            ['active']
        );

        res.json({
            success: true,
            warehouses
        });
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch warehouses',
            error: error.message
        });
    }
};

// Get specific warehouse details
const getWarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        const [warehouses] = await db.query(
            'SELECT id, name, short_name, status FROM warehouses WHERE id = ?',
            [id]
        );

        if (warehouses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        res.json({
            success: true,
            warehouse: warehouses[0]
        });
    } catch (error) {
        console.error('Error fetching warehouse:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch warehouse',
            error: error.message
        });
    }
};

// Update warehouse (super admin only)
const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, short_name, status } = req.body;

        // Check if user is super admin
        if (req.session.admin.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can update warehouses'
            });
        }

        await db.query(
            'UPDATE warehouses SET name = ?, short_name = ?, status = ? WHERE id = ?',
            [name, short_name, status, id]
        );

        res.json({
            success: true,
            message: 'Warehouse updated successfully'
        });
    } catch (error) {
        console.error('Error updating warehouse:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update warehouse',
            error: error.message
        });
    }
};

module.exports = {
    getAllWarehouses,
    getWarehouse,
    updateWarehouse
};
