const db = require('./config/db');

const demoData = [
    { driver: 'Rahim Uddin', phone: '01711223344', buyer: 'Mayer Doa Enterprise', dest: 'Chittagong Port', license: 'DHAKA-METRO-TA-11-2233' },
    { driver: 'Karim Sheikh', phone: '01812345678', buyer: 'Bismillah Traders', dest: 'Sylhet Sadar', license: 'DHAKA-METRO-TA-13-4567' },
    { driver: 'Abdul Jabbar', phone: '01998765432', buyer: 'Khan Brothers', dest: 'Jessore Benapole', license: 'DHAKA-METRO-TA-15-7890' },
    { driver: 'Moklesur Rahman', phone: '01611223344', buyer: 'Sikder & Sons', dest: 'Rajshahi City', license: 'CHATTA-METRO-TA-11-0012' },
    { driver: 'Salim Khan', phone: '01555667788', buyer: 'New Madina Store', dest: 'Barisal Launch Ghat', license: 'KHULNA-METRO-TA-09-3344' }
];

async function seedTrucks() {
    try {
        console.log('🌱 Starting seed...');

        // Get all warehouses
        const [warehouses] = await db.query('SELECT id, name FROM warehouses');
        console.log(`Found ${warehouses.length} warehouses.`);

        for (const warehouse of warehouses) {
            console.log(`Processing Warehouse: ${warehouse.name} (ID: ${warehouse.id})`);

            for (let i = 0; i < demoData.length; i++) {
                const data = demoData[i];

                // Calculate next serial
                const [rows] = await db.query(
                    'SELECT MAX(serial_number) as maxSerial FROM trucks WHERE warehouse_id = ?',
                    [warehouse.id]
                );
                const nextSerial = (rows[0].maxSerial || 0) + 1;

                // Adjust status and timing
                const status = (nextSerial === 1) ? 'loading' : 'waiting';
                const loadTime = (nextSerial === 1) ? 'NOW()' : 'NULL';

                await db.query(
                    `INSERT INTO trucks (serial_number, licence_number, driver_name, driver_phone, buyer_name, destination, warehouse_id, status, time_loading_started) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${loadTime})`,
                    [nextSerial, data.license, data.driver, data.driver, data.buyer, data.dest, warehouse.id, status]
                );

                console.log(`   - Added Truck #${nextSerial}: ${data.driver}`);
            }
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedTrucks();
