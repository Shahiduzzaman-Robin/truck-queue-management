const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireSuperAdmin } = require('../middleware/auth');

// Protect all routes with super admin middleware
router.use(requireSuperAdmin);

// Routes
router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
