import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all transactions for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [transactions] = await db.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create transaction
router.post('/', async (req, res) => {
    try {
        const { id, userId, accountId, amount, type, category, note, date } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Insert transaction
            await connection.query(
                'INSERT INTO transactions (id, user_id, account_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id, userId, accountId, amount, type, category, note, date]
            );

            // Update account balance
            if (type === 'Income') {
                await connection.query(
                    'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                    [amount, accountId]
                );
            } else if (type === 'Expense') {
                await connection.query(
                    'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                    [amount, accountId]
                );
            }

            await connection.commit();

            const [newTransaction] = await db.query(
                'SELECT * FROM transactions WHERE id = ?',
                [id]
            );

            res.status(201).json(newTransaction[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update transaction
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, category, note, date } = req.body;

        await db.query(
            'UPDATE transactions SET amount = ?, type = ?, category = ?, note = ?, date = ? WHERE id = ?',
            [amount, type, category, note, date, id]
        );

        const [updated] = await db.query(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get transaction details before deleting
            const [transaction] = await connection.query(
                'SELECT account_id, amount, type FROM transactions WHERE id = ?',
                [id]
            );

            if (transaction.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Transaction not found' });
            }

            const { account_id, amount, type } = transaction[0];

            // Delete transaction
            await connection.query('DELETE FROM transactions WHERE id = ?', [id]);

            // Reverse account balance change
            if (type === 'Income') {
                await connection.query(
                    'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                    [amount, account_id]
                );
            } else if (type === 'Expense') {
                await connection.query(
                    'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                    [amount, account_id]
                );
            }

            await connection.commit();

            res.json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
