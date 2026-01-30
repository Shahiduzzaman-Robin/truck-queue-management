const db = require('../config/db');

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add sales_manager column...');

        // Add to trucks table
        try {
            await db.query(`ALTER TABLE trucks ADD COLUMN sales_manager VARCHAR(255) DEFAULT NULL AFTER driver_phone`);
            console.log('✅ Added sales_manager to trucks table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ sales_manager column already exists in trucks table');
            } else {
                throw err;
            }
        }

        // Add to trucks_history table
        try {
            await db.query(`ALTER TABLE trucks_history ADD COLUMN sales_manager VARCHAR(255) DEFAULT NULL AFTER driver_phone`);
            console.log('✅ Added sales_manager to trucks_history table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ sales_manager column already exists in trucks_history table');
            } else {
                throw err;
            }
        }

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
