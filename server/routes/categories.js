import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all categories for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE user_id = ?',
            [userId]
        );
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { id, userId, name, icon, type, color } = req.body;

        await db.query(
            'INSERT INTO categories (id, user_id, name, icon, type, color, is_default) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
            [id, userId, name, icon, type, color]
        );

        const [newCategory] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        res.status(201).json(newCategory[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if it's a default category
        const [category] = await db.query(
            'SELECT is_default FROM categories WHERE id = ?',
            [id]
        );

        if (category.length > 0 && category[0].is_default) {
            return res.status(400).json({ error: 'Cannot delete default category' });
        }

        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
