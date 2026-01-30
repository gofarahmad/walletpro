import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all accounts for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [accounts] = await db.query(
            'SELECT * FROM accounts WHERE user_id = ?',
            [userId]
        );
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create account
router.post('/', async (req, res) => {
    try {
        const { id, userId, name, balance, icon, accountNumber, phoneNumber, accountHolder, type } = req.body;

        await db.query(
            'INSERT INTO accounts (id, user_id, name, balance, icon, account_number, phone_number, account_holder, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, name, balance || 0, icon, accountNumber || null, phoneNumber || null, accountHolder || null, type || 'Bank']
        );

        const [newAccount] = await db.query(
            'SELECT * FROM accounts WHERE id = ?',
            [id]
        );

        res.status(201).json(newAccount[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update account
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, balance, icon, accountNumber, phoneNumber, accountHolder, type } = req.body;

        await db.query(
            'UPDATE accounts SET name = ?, balance = ?, icon = ?, account_number = ?, phone_number = ?, account_holder = ?, type = ? WHERE id = ?',
            [name, balance, icon, accountNumber || null, phoneNumber || null, accountHolder || null, type || 'Bank', id]
        );

        const [updated] = await db.query(
            'SELECT * FROM accounts WHERE id = ?',
            [id]
        );

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transfer between accounts
router.post('/transfer', async (req, res) => {
    try {
        const { fromId, toId, amount, userId, transactionId } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Deduct from source account
            await connection.query(
                'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                [amount, fromId]
            );

            // Add to destination account
            await connection.query(
                'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                [amount, toId]
            );

            // Create transfer transaction
            await connection.query(
                'INSERT INTO transactions (id, user_id, account_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [transactionId, userId, fromId, amount, 'Transfer', 'Transfer', `Transfer to account ${toId}`, new Date()]
            );

            await connection.commit();

            res.json({ message: 'Transfer successful' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
