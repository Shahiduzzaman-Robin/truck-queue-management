const db = require('../config/db');

// Add new truck to queue
const addTruck = async (req, res) => {
    try {
        const { licence_number, driver_name, driver_phone, buyer_name, destination, warehouse_id } = req.body;

        // Validate input
        if (!licence_number || !driver_name || !driver_phone || !buyer_name || !destination || !warehouse_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Get the next serial number for THIS warehouse
        const [rows] = await db.query(
            'SELECT MAX(serial_number) as maxSerial FROM trucks WHERE warehouse_id = ?',
            [warehouse_id]
        );
        const nextSerial = (rows[0].maxSerial || 0) + 1;

        // Insert new truck (time_of_entry is automatically set by CURRENT_TIMESTAMP)
        const [result] = await db.query(
            `INSERT INTO trucks (serial_number, licence_number, driver_name, driver_phone, sales_manager, buyer_name, destination, warehouse_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting')`,
            [nextSerial, licence_number, driver_name, driver_phone, req.body.sales_manager || null, buyer_name, destination, warehouse_id]
        );

        // If this is Serial #1 for this warehouse, set it to 'loading' status and set time_loading_started
        if (nextSerial === 1) {
            await db.query(
                'UPDATE trucks SET status = ?, time_loading_started = NOW() WHERE serial_number = 1 AND warehouse_id = ?',
                ['loading', warehouse_id]
            );
        }

        res.json({
            success: true,
            message: 'Truck added successfully',
            serial_number: nextSerial,
            truck_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding truck:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add truck',
            error: error.message
        });
    }
};

// Mark truck as finished and reorder queue
const finishTruck = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const truckId = req.params.id;

        // Get the truck details
        const [trucks] = await connection.query('SELECT * FROM trucks WHERE id = ?', [truckId]);

        if (trucks.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Truck not found'
            });
        }

        const truck = trucks[0];
        const warehouseId = truck.warehouse_id;

        // Move to history
        await connection.query(
            `INSERT INTO trucks_history (original_serial, licence_number, driver_name, driver_phone, sales_manager, buyer_name, destination, time_of_entry, time_loading_started, finished_at, warehouse_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [truck.serial_number, truck.licence_number, truck.driver_name, truck.driver_phone, truck.sales_manager, truck.buyer_name, truck.destination, truck.time_of_entry, truck.time_loading_started, warehouseId]
        );

        // Delete from active queue
        await connection.query('DELETE FROM trucks WHERE id = ?', [truckId]);

        // Reorder remaining trucks in THIS warehouse (decrement all serial numbers)
        await connection.query(
            'UPDATE trucks SET serial_number = serial_number - 1 WHERE serial_number > ? AND warehouse_id = ?',
            [truck.serial_number, warehouseId]
        );

        // Set new Serial #1 for THIS warehouse to 'loading' status and set time_loading_started
        await connection.query(
            'UPDATE trucks SET status = ?, time_loading_started = NOW() WHERE serial_number = 1 AND warehouse_id = ?',
            ['loading', warehouseId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Truck marked as finished and queue updated'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error finishing truck:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to finish truck',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Get active queue (warehouse-specific)
const getActiveQueue = async (req, res) => {
    try {
        const { warehouseId } = req.params;

        if (!warehouseId) {
            return res.status(400).json({
                success: false,
                message: 'Warehouse ID is required'
            });
        }

        const [trucks] = await db.query(
            `SELECT id, serial_number, licence_number, driver_name, driver_phone, sales_manager, buyer_name, destination, time_of_entry, time_loading_started, status, warehouse_id 
             FROM trucks 
             WHERE warehouse_id = ?
             ORDER BY serial_number ASC`,
            [warehouseId]
        );

        res.json({
            success: true,
            queue: trucks,
            server_time: new Date() // BDT time for timer synchronization
        });
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queue',
            error: error.message
        });
    }
};

// Get history of completed trucks
const getHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const [history] = await db.query(
            'SELECT * FROM trucks_history ORDER BY completion_time DESC LIMIT ?',
            [limit]
        );

        res.json({
            success: true,
            history: history
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch history',
            error: error.message
        });
    }
};

// Get current BDT server time
const getCurrentTime = async (req, res) => {
    try {
        res.json({
            success: true,
            server_time: new Date() // BDT time
        });
    } catch (error) {
        console.error('Error getting server time:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get server time',
            error: error.message
        });
    }
};

// Update truck details
const updateTruck = async (req, res) => {
    try {
        const truckId = req.params.id;
        const { licence_number, driver_name, driver_phone, sales_manager, buyer_name, destination } = req.body;

        // Perform update
        const [result] = await db.query(
            'UPDATE trucks SET licence_number = ?, driver_name = ?, driver_phone = ?, sales_manager = ?, buyer_name = ?, destination = ? WHERE id = ?',
            [licence_number, driver_name, driver_phone, sales_manager, buyer_name, destination, truckId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Truck not found'
            });
        }

        res.json({
            success: true,
            message: 'Truck info updated successfully'
        });

    } catch (error) {
        console.error('Error updating truck:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update truck',
            error: error.message
        });
    }
};

// Delete truck and reorder serials
const deleteTruck = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const truckId = req.params.id;

        // Get truck details before deleting
        const [trucks] = await connection.query('SELECT * FROM trucks WHERE id = ?', [truckId]);

        if (trucks.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Truck not found'
            });
        }

        const truck = trucks[0];
        const warehouseId = truck.warehouse_id;

        // Delete truck
        await connection.query('DELETE FROM trucks WHERE id = ?', [truckId]);

        // Reorder remaining trucks in THIS warehouse (decrement all serial numbers > deleted serial)
        await connection.query(
            'UPDATE trucks SET serial_number = serial_number - 1 WHERE serial_number > ? AND warehouse_id = ?',
            [truck.serial_number, warehouseId]
        );

        // If we deleted Serial #1, the new Serial #1 (was #2) needs to start "loading"
        if (truck.serial_number === 1) {
            // Check if there is a new #1
            const [newFirstTruck] = await connection.query(
                'SELECT id FROM trucks WHERE serial_number = 1 AND warehouse_id = ?',
                [warehouseId]
            );

            if (newFirstTruck.length > 0) {
                await connection.query(
                    'UPDATE trucks SET status = ?, time_loading_started = NOW() WHERE serial_number = 1 AND warehouse_id = ?',
                    ['loading', warehouseId]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Truck deleted and serials reordered'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting truck:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete truck',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    addTruck,
    finishTruck,
    getActiveQueue,
    getHistory,
    getCurrentTime,
    updateTruck,
    deleteTruck
};
