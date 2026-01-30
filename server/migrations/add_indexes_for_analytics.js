const mysql = require('mysql2/promise');
require('dotenv').config();

async function addIndexes() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'truck_queue_db'
    });

    try {
        console.log('Adding indexes for analytics performance...');

        // Add indexes on trucks_history for faster analytics queries
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_finished_at ON trucks_history(finished_at)
        `);
        console.log('✓ Added index on finished_at');

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_time_of_entry ON trucks_history(time_of_entry)
        `);
        console.log('✓ Added index on time_of_entry');

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_warehouse_id ON trucks_history(warehouse_id)
        `);
        console.log('✓ Added index on warehouse_id');

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_sales_manager ON trucks_history(sales_manager)
        `);
        console.log('✓ Added index on sales_manager');

        // Composite index for the most common query pattern
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_finished_warehouse ON trucks_history(finished_at, warehouse_id)
        `);
        console.log('✓ Added composite index on finished_at + warehouse_id');

        console.log('\n✅ All indexes added successfully!');
        console.log('Analytics queries should now be much faster.');

    } catch (error) {
        console.error('Error adding indexes:', error);
    } finally {
        await connection.end();
    }
}

addIndexes();
