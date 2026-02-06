const db = require('../config/db');
const webSocketService = require('../services/websocketService');

// Get all other admins for chat list
exports.getUsers = async (req, res) => {
    try {
        const currentUserId = req.session.userId;

        // Fetch all admins except current user
        const [users] = await db.query(
            'SELECT id, username, role, warehouse_id FROM admin_users WHERE id != ? ORDER BY username ASC',
            [currentUserId]
        );

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// Get chat history with a specific user
exports.getMessages = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const otherUserId = req.params.userId;

        const [messages] = await db.query(
            `SELECT * FROM messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?) 
             ORDER BY created_at ASC`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.session.userId;
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({ success: false, message: 'Receiver and message required' });
        }

        // 1. Save to database
        const [result] = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [senderId, receiverId, message]
        );

        const newMessage = {
            id: result.insertId,
            sender_id: senderId,
            receiver_id: receiverId,
            message,
            created_at: new Date(),
            is_read: false
        };

        // 2. Send via WebSocket if user is online
        webSocketService.sendToUser(receiverId, {
            type: 'message:received',
            data: newMessage
        });

        res.json({
            success: true,
            message: newMessage
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Get unread message counts
exports.getUnreadCounts = async (req, res) => {
    try {
        const currentUserId = req.session.userId;

        const [rows] = await db.query(
            `SELECT sender_id, COUNT(*) as count 
             FROM messages 
             WHERE receiver_id = ? AND is_read = FALSE 
             GROUP BY sender_id`,
            [currentUserId]
        );

        res.json({
            success: true,
            counts: rows
        });
    } catch (error) {
        console.error('Error fetching unread counts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unread counts' });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const senderId = req.params.senderId;

        await db.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
            [senderId, currentUserId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
    }
};
