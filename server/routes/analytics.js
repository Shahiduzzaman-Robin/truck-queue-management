const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

// All analytics routes require authentication
router.use(requireAuth);

// Dashboard summary
router.get('/summary', analyticsController.getDashboardSummary);

// Completion statistics
router.get('/stats', analyticsController.getCompletionStats);

// Loading time by warehouse
router.get('/loading-time', analyticsController.getLoadingTimeByWarehouse);

// Peak hours analysis
router.get('/peak-hours', analyticsController.getPeakHours);

// Sales manager performance
router.get('/sales-managers', analyticsController.getSalesManagerPerformance);

module.exports = router;
