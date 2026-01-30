const db = require('../config/db');

async function migrate() {
    try {
        // Add time_loading_started column to trucks_history
        try {
            await db.query(`
                ALTER TABLE trucks_history 
                ADD COLUMN time_loading_started TIMESTAMP NULL AFTER time_of_entry
            `);
            console.log('✅ Added time_loading_started column to trucks_history table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ time_loading_started column already exists in trucks_history table');
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
