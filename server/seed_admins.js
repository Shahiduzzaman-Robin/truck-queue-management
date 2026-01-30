const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'truck_queue_db',
    port: process.env.DB_PORT || 3306,
    timezone: '+06:00'
};

const adminsToCreate = [
    { username: 'KAFI-1', pass: 'KAFI-1123', warehouse_id: 1 },
    { username: 'KAFI-2', pass: 'KAFI-2123', warehouse_id: 2 },
    { username: 'AAFI', pass: 'AAFI123', warehouse_id: 3 },
    { username: 'MBAF', pass: 'MBAF123', warehouse_id: 4 }
];

async function seedAdmins() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        for (const admin of adminsToCreate) {
            console.log(`Processing admin for Warehouse ${admin.warehouse_id} (${admin.username})...`);

            // Hash password
            const hashedPassword = await bcrypt.hash(admin.pass, 10);

            // Check if exists
            const [rows] = await connection.execute('SELECT id FROM admin_users WHERE username = ?', [admin.username]);

            if (rows.length > 0) {
                // Update
                console.log(`Updating existing user: ${admin.username}`);
                await connection.execute(
                    'UPDATE admin_users SET password_hash = ?, role = "admin", warehouse_id = ? WHERE username = ?',
                    [hashedPassword, admin.warehouse_id, admin.username]
                );
            } else {
                // Insert
                console.log(`Creating new user: ${admin.username}`);
                await connection.execute(
                    'INSERT INTO admin_users (username, password_hash, role, warehouse_id) VALUES (?, ?, "admin", ?)',
                    [admin.username, hashedPassword, admin.warehouse_id]
                );
            }
        }

        console.log('All admins processed successfully.');

    } catch (error) {
        console.error('Error seeding admins:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seedAdmins();
