const db = require('../config/db');

// Get completion statistics (daily/weekly/monthly)
exports.getCompletionStats = async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;

        // Default to last 30 days if no dates provided
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        // Determine grouping format
        let dateFormat;
        switch (period) {
            case 'weekly':
                dateFormat = '%Y-W%u'; // Year-Week
                break;
            case 'monthly':
                dateFormat = '%Y-%m'; // Year-Month
                break;
            default:
                dateFormat = '%Y-%m-%d'; // Year-Month-Day
        }

        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(COALESCE(finished_at, time_of_entry), ?) as period,
                COUNT(*) as total_trucks,
                AVG(TIMESTAMPDIFF(MINUTE, time_of_entry, COALESCE(finished_at, time_of_entry))) as avg_total_time,
                AVG(CASE 
                    WHEN time_loading_started IS NOT NULL AND finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, time_loading_started, finished_at) 
                    ELSE NULL 
                END) as avg_loading_time
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
            GROUP BY period
            ORDER BY period ASC
        `, [dateFormat, start, end]);

        // Get overall stats
        const [overall] = await db.query(`
            SELECT 
                COUNT(*) as total_trucks,
                AVG(TIMESTAMPDIFF(MINUTE, time_of_entry, COALESCE(finished_at, time_of_entry))) as avg_total_time,
                AVG(CASE 
                    WHEN time_loading_started IS NOT NULL AND finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, time_loading_started, finished_at) 
                    ELSE NULL 
                END) as avg_loading_time
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
        `, [start, end]);

        res.json({
            success: true,
            period,
            startDate: start,
            endDate: end,
            overall: overall[0],
            data: rows
        });
    } catch (error) {
        console.error('Get completion stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch completion statistics' });
    }
};

// Get average loading time by warehouse
exports.getLoadingTimeByWarehouse = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        const [rows] = await db.query(`
            SELECT 
                w.id as warehouse_id,
                w.name as warehouse_name,
                COUNT(h.id) as total_trucks,
                AVG(CASE 
                    WHEN h.time_loading_started IS NOT NULL AND h.finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, h.time_loading_started, h.finished_at) 
                    ELSE NULL 
                END) as avg_loading_time,
                MIN(CASE 
                    WHEN h.time_loading_started IS NOT NULL AND h.finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, h.time_loading_started, h.finished_at) 
                    ELSE NULL 
                END) as min_loading_time,
                MAX(CASE 
                    WHEN h.time_loading_started IS NOT NULL AND h.finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, h.time_loading_started, h.finished_at) 
                    ELSE NULL 
                END) as max_loading_time
            FROM warehouses w
            LEFT JOIN trucks_history h ON w.id = h.warehouse_id 
                AND COALESCE(h.finished_at, h.time_of_entry) BETWEEN ? AND ?
            GROUP BY w.id, w.name
            ORDER BY avg_loading_time DESC
        `, [start, end]);

        res.json({
            success: true,
            startDate: start,
            endDate: end,
            data: rows
        });
    } catch (error) {
        console.error('Get loading time by warehouse error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch loading time statistics' });
    }
};

// Get peak hours analysis
exports.getPeakHours = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        const [rows] = await db.query(`
            SELECT 
                HOUR(time_of_entry) as hour,
                COUNT(*) as truck_count
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
            GROUP BY hour
            ORDER BY hour ASC
        `, [start, end]);

        // Fill in missing hours with 0
        const hourlyData = Array(24).fill(0).map((_, i) => ({
            hour: i,
            truck_count: 0
        }));

        rows.forEach(row => {
            hourlyData[row.hour] = {
                hour: row.hour,
                truck_count: parseInt(row.truck_count)
            };
        });

        res.json({
            success: true,
            startDate: start,
            endDate: end,
            data: hourlyData
        });
    } catch (error) {
        console.error('Get peak hours error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch peak hours data' });
    }
};

// Get sales manager performance
exports.getSalesManagerPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        const [rows] = await db.query(`
            SELECT 
                COALESCE(sales_manager, 'Not Assigned') as sales_manager,
                COUNT(*) as total_trucks,
                AVG(TIMESTAMPDIFF(MINUTE, time_of_entry, COALESCE(finished_at, time_of_entry))) as avg_total_time,
                AVG(CASE 
                    WHEN time_loading_started IS NOT NULL AND finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, time_loading_started, finished_at) 
                    ELSE NULL 
                END) as avg_loading_time,
                MIN(TIMESTAMPDIFF(MINUTE, time_of_entry, COALESCE(finished_at, time_of_entry))) as min_total_time,
                MAX(TIMESTAMPDIFF(MINUTE, time_of_entry, COALESCE(finished_at, time_of_entry))) as max_total_time
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
            GROUP BY sales_manager
            ORDER BY total_trucks DESC
        `, [start, end]);

        res.json({
            success: true,
            startDate: start,
            endDate: end,
            data: rows
        });
    } catch (error) {
        console.error('Get sales manager performance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sales manager performance' });
    }
};

// Get summary dashboard stats
exports.getDashboardSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        // Total trucks completed
        const [totalTrucks] = await db.query(`
            SELECT COUNT(*) as count FROM trucks_history 
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
        `, [start, end]);

        // Average loading time
        const [avgTime] = await db.query(`
            SELECT 
                AVG(CASE 
                    WHEN time_loading_started IS NOT NULL AND finished_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, time_loading_started, finished_at) 
                    ELSE NULL 
                END) as avg_loading_time
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
        `, [start, end]);

        // Busiest hour
        const [busiestHour] = await db.query(`
            SELECT 
                HOUR(time_of_entry) as hour,
                COUNT(*) as count
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ?
            GROUP BY hour
            ORDER BY count DESC
            LIMIT 1
        `, [start, end]);

        // Top performing sales manager
        const [topManager] = await db.query(`
            SELECT 
                sales_manager,
                COUNT(*) as count
            FROM trucks_history
            WHERE COALESCE(finished_at, time_of_entry) BETWEEN ? AND ? AND sales_manager IS NOT NULL
            GROUP BY sales_manager
            ORDER BY count DESC
            LIMIT 1
        `, [start, end]);

        res.json({
            success: true,
            startDate: start,
            endDate: end,
            summary: {
                totalTrucks: totalTrucks[0]?.count || 0,
                avgLoadingTime: avgTime[0]?.avg_loading_time || 0,
                busiestHour: busiestHour[0]?.hour || null,
                busiestHourCount: busiestHour[0]?.count || 0,
                topSalesManager: topManager[0]?.sales_manager || 'N/A',
                topSalesManagerCount: topManager[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
};
