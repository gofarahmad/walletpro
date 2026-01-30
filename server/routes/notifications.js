import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create notification
router.post('/', async (req, res) => {
    try {
        const { id, userId, title, message, type, date } = req.body;

        await db.query(
            'INSERT INTO notifications (id, user_id, title, message, type, is_read, date) VALUES (?, ?, ?, ?, ?, FALSE, ?)',
            [id, userId, title, message, type || 'Info', date]
        );

        const [newNotification] = await db.query(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );

        res.status(201).json(newNotification[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
router.put('/read-all/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear all read notifications
router.delete('/clear-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        await db.query(
            'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
            [userId]
        );

        res.json({ message: 'Read notifications cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
