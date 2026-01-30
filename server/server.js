const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Set timezone to Bangladesh Time (BDT / Asia/Dhaka / GMT+6)
process.env.TZ = 'Asia/Dhaka';

const path = require('path');
const sessionConfig = require('./config/session');
const authRoutes = require('./routes/auth');
const truckRoutes = require('./routes/trucks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost', 'http://localhost:80', 'http://127.0.0.1'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Truck Queue Management Server');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Server restart trigger for new routes
