const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

router.get('/users', messageController.getUsers);
router.get('/history/:userId', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.get('/unread', messageController.getUnreadCounts);
router.post('/read/:senderId', messageController.markAsRead);

module.exports = router;
