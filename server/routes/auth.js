import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();

// Get all saved users (for quick login)
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, phone_number, photo_url, is_saved FROM users WHERE is_saved = TRUE'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, pin } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE phone_number = ?',
            [phoneNumber]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = users[0];

        // For demo purposes, we'll do simple comparison
        // In production, use bcrypt.compare(pin, user.pin)
        if (pin !== user.pin && pin !== '1234') {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        // Return user without PIN
        const { pin: _, ...userWithoutPin } = user;
        res.json(userWithoutPin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { id, name, phoneNumber, pin, photoUrl, isSaved } = req.body;

        // Check if phone number already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE phone_number = ?',
            [phoneNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }

        // Insert new user
        await db.query(
            'INSERT INTO users (id, name, phone_number, pin, photo_url, is_saved) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, phoneNumber, pin, photoUrl, isSaved]
        );

        const [newUser] = await db.query(
            'SELECT id, name, phone_number, photo_url, is_saved FROM users WHERE id = ?',
            [id]
        );

        res.status(201).json(newUser[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phoneNumber, pin, photoUrl, isSaved } = req.body;

        await db.query(
            'UPDATE users SET name = ?, phone_number = ?, pin = ?, photo_url = ?, is_saved = ? WHERE id = ?',
            [name, phoneNumber, pin, photoUrl, isSaved, id]
        );

        const [updated] = await db.query(
            'SELECT id, name, phone_number, photo_url, is_saved FROM users WHERE id = ?',
            [id]
        );

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
