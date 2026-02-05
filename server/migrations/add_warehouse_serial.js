const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../config.env' });

async function addWarehouseSerial() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'truck_queue_db'
    });

    try {
        console.log('Starting migration: Add warehouse_serial to trucks_history...');

        // Step 1: Add warehouse_serial column (nullable initially)
        console.log('Step 1: Adding warehouse_serial column...');
        await connection.query(`
            ALTER TABLE trucks_history 
            ADD COLUMN warehouse_serial INT NULL AFTER display_serial
        `);

        // Step 2: Backfill existing records with warehouse-specific sequential numbers
        console.log('Step 2: Backfilling warehouse serials...');

        // Get all warehouses
        const [warehouses] = await connection.query('SELECT id FROM warehouses ORDER BY id');

        let totalBackfilled = 0;
        for (const warehouse of warehouses) {
            const warehouseId = warehouse.id;

            // Get all records for this warehouse, ordered by finished_at
            const [records] = await connection.query(`
                SELECT id FROM trucks_history 
                WHERE warehouse_id = ?
                ORDER BY finished_at ASC, id ASC
            `, [warehouseId]);

            // Assign sequential numbers per warehouse
            let warehouseCounter = 1;
            for (const record of records) {
                await connection.query(
                    'UPDATE trucks_history SET warehouse_serial = ? WHERE id = ?',
                    [warehouseCounter, record.id]
                );
                warehouseCounter++;
            }

            console.log(`  Warehouse ${warehouseId}: Backfilled ${records.length} records`);
            totalBackfilled += records.length;
        }

        console.log(`Total backfilled: ${totalBackfilled} records across ${warehouses.length} warehouses`);

        // Step 3: Make warehouse_serial NOT NULL
        console.log('Step 3: Setting warehouse_serial to NOT NULL...');
        await connection.query(`
            ALTER TABLE trucks_history 
            MODIFY COLUMN warehouse_serial INT NOT NULL
        `);

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run migration
addWarehouseSerial()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
