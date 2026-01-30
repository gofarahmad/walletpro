import express from 'express';
import db from '../db.js';
import crypto from 'crypto';

const router = express.Router();

// Get all budgets for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [budgets] = await db.query(
            'SELECT * FROM budgets WHERE user_id = ?',
            [userId]
        );
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create budget
router.post('/', async (req, res) => {
    try {
        const { id, userId, category, limitAmount, spent, icon, color } = req.body;

        await db.query(
            'INSERT INTO budgets (id, user_id, category, limit_amount, spent, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, category, limitAmount, spent || 0, icon, color || '#136dec']
        );

        // Sync with Categories: Check if category exists
        const [existingCategory] = await db.query(
            'SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = "Expense"',
            [userId, category]
        );

        if (existingCategory.length === 0) {
            // Create new category if it doesn't exist
            const newCategoryId = crypto.randomUUID();
            await db.query(
                'INSERT INTO categories (id, user_id, name, icon, type, color, is_default) VALUES (?, ?, ?, ?, "Expense", ?, FALSE)',
                [newCategoryId, userId, category, icon, color || '#136dec']
            );
        } else {
            // Update existing category color/icon if it matches
            await db.query(
                'UPDATE categories SET icon = ?, color = ? WHERE id = ?',
                [icon, color || '#136dec', existingCategory[0].id]
            );
        }

        const [newBudget] = await db.query(
            'SELECT * FROM budgets WHERE id = ?',
            [id]
        );

        res.status(201).json(newBudget[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update budget
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, limitAmount, spent, icon, color } = req.body;

        await db.query(
            'UPDATE budgets SET category = ?, limit_amount = ?, spent = ?, icon = ?, color = ? WHERE id = ?',
            [category, limitAmount, spent, icon, color, id]
        );

        // Get userId for this budget
        const [budgetProd] = await db.query('SELECT user_id FROM budgets WHERE id = ?', [id]);
        if (budgetProd.length > 0) {
            const userId = budgetProd[0].user_id;
            // Sync with Categories
            const [existingCategory] = await db.query(
                'SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = "Expense"',
                [userId, category]
            );

            if (existingCategory.length > 0) {
                await db.query(
                    'UPDATE categories SET icon = ?, color = ? WHERE id = ?',
                    [icon, color, existingCategory[0].id]
                );
            } else {
                // Try to find if there was a category with the OLD name (we'd need old name, but for now let's just create if not exists or ignore)
                // Better approach: just create if not exists
                const newCategoryId = crypto.randomUUID();
                await db.query(
                    'INSERT INTO categories (id, user_id, name, icon, type, color, is_default) VALUES (?, ?, ?, ?, "Expense", ?, FALSE)',
                    [newCategoryId, userId, category, icon, color]
                );
            }
        }

        const [updated] = await db.query(
            'SELECT * FROM budgets WHERE id = ?',
            [id]
        );

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get budget details before deletion to find corresponding category
        const [budget] = await db.query('SELECT * FROM budgets WHERE id = ?', [id]);

        if (budget.length > 0) {
            const { user_id, category } = budget[0];

            // Delete the budget
            await db.query('DELETE FROM budgets WHERE id = ?', [id]);

            // Sync with Categories: Delete the corresponding expense category
            // Look for a category with the same name, type 'Expense', and user_id
            await db.query(
                'DELETE FROM categories WHERE user_id = ? AND name = ? AND type = "Expense" AND is_default = FALSE',
                [user_id, category]
            );
        } else {
            // Just specific deletion if budget somehow not found but ID passed? Usually won't happen if array check fails.
            // But good to be safe.
            await db.query('DELETE FROM budgets WHERE id = ?', [id]);
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
