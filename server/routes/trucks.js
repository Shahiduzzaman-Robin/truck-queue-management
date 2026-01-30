const express = require('express');
const router = express.Router();
const { requireAuth, requireWarehouseAccess } = require('../middleware/auth');
const { addTruck, finishTruck, getActiveQueue, getHistory, getCurrentTime, updateTruck, deleteTruck } = require('../controllers/queueController');

// Public routes
router.get('/queue/:warehouseId', getActiveQueue); // Get queue for specific warehouse
router.get('/time', getCurrentTime);

// Admin routes - Require authentication and warehouse access
router.post('/add', requireAuth, requireWarehouseAccess, addTruck);
router.post('/finish/:id', requireAuth, requireWarehouseAccess, finishTruck);
router.put('/:id', requireAuth, requireWarehouseAccess, updateTruck);
router.delete('/:id', requireAuth, requireWarehouseAccess, deleteTruck);
router.get('/history', requireAuth, getHistory);

module.exports = router;
