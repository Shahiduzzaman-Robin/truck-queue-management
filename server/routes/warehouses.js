const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getAllWarehouses, getWarehouse, updateWarehouse } = require('../controllers/warehouseController');

// Public routes
router.get('/', getAllWarehouses);

// Admin routes - Super admin only for updates
// We'll enforce super_admin check inside the controller for updateWarehouse
router.get('/:id', getWarehouse);
router.put('/:id', requireAuth, updateWarehouse);

module.exports = router;
