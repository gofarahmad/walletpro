import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all bills for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [bills] = await db.query(
            'SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC',
            [userId]
        );
        res.json(bills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create bill
router.post('/', async (req, res) => {
    try {
        const { id, userId, name, amount, dueDate, isPaidThisMonth, category } = req.body;

        await db.query(
            'INSERT INTO bills (id, user_id, name, amount, due_date, is_paid_this_month, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, name, amount, dueDate, isPaidThisMonth || false, category || 'Tagihan']
        );

        const [newBill] = await db.query(
            'SELECT * FROM bills WHERE id = ?',
            [id]
        );

        res.status(201).json(newBill[0]);
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update bill
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, dueDate, category } = req.body;

        await db.query(
            'UPDATE bills SET name = ?, amount = ?, due_date = ?, category = ? WHERE id = ?',
            [name, amount, dueDate, category, id]
        );

        const [updated] = await db.query(
            'SELECT * FROM bills WHERE id = ?',
            [id]
        );

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// Pay bill
router.post('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get bill amount
            const [bill] = await connection.query(
                'SELECT amount FROM bills WHERE id = ?',
                [id]
            );

            if (bill.length === 0) {
                throw new Error('Bill not found');
            }

            const amount = bill[0].amount;

            // Check account balance
            const [account] = await connection.query(
                'SELECT balance FROM accounts WHERE id = ?',
                [accountId]
            );

            if (account.length === 0) {
                throw new Error('Account not found');
            }

            if (account[0].balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Mark bill as paid
            await connection.query(
                'UPDATE bills SET is_paid_this_month = TRUE WHERE id = ?',
                [id]
            );

            // Update account balance
            await connection.query(
                'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                [amount, accountId]
            );

            await connection.commit();

            const [updated] = await db.query(
                'SELECT * FROM bills WHERE id = ?',
                [id]
            );

            res.json(updated[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error paying bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete bill
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM bills WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
