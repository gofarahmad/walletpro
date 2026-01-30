import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all credits for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [credits] = await db.query(
            'SELECT * FROM credits WHERE user_id = ?',
            [userId]
        );
        res.json(credits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create credit
router.post('/', async (req, res) => {
    try {
        const {
            id, userId, name, amount, dueDate, isPaidThisMonth,
            type, totalLoanAmount, interestRate, interestType,
            durationMonths, startDate, holdAmount, adminFee, remainingTenor
        } = req.body;

        await db.query(
            `INSERT INTO credits (
                id, user_id, name, amount, due_date, is_paid_this_month,
                type, total_loan_amount, interest_rate, interest_type,
                duration_months, start_date, hold_amount, admin_fee, remaining_tenor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, userId, name, amount, dueDate, isPaidThisMonth || false,
                type || 'Bills', totalLoanAmount || 0, interestRate || 0, interestType || 'Annual',
                durationMonths || 1, startDate || null, holdAmount || 0, adminFee || 0, remainingTenor || 0
            ]
        );

        const [newCredit] = await db.query('SELECT * FROM credits WHERE id = ?', [id]);
        res.status(201).json(newCredit[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pay credit
router.post('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [credit] = await connection.query('SELECT amount, remaining_tenor, type FROM credits WHERE id = ?', [id]);
            if (credit.length === 0) throw new Error('Credit not found');

            const amount = credit[0].amount;

            // Mark paid for this month
            await connection.query('UPDATE credits SET is_paid_this_month = TRUE WHERE id = ?', [id]);

            // If it's a loan with tenor, reduce remaining tenor?
            // User requested progress based on Time, but tracking payments is also good.
            // Let's decrement remaining_tenor if it's > 0
            if (credit[0].remaining_tenor > 0) {
                await connection.query('UPDATE credits SET remaining_tenor = remaining_tenor - 1 WHERE id = ?', [id]);
            }

            // Deduct balance
            await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);

            await connection.commit();

            const [updated] = await db.query('SELECT * FROM credits WHERE id = ?', [id]);
            res.json(updated[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error paying credit:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update credit
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, amount, dueDate, type, totalLoanAmount, interestRate,
            interestType, durationMonths, startDate, holdAmount, adminFee
        } = req.body;

        await db.query(
            `UPDATE credits SET 
                name = ?, amount = ?, due_date = ?, type = ?, 
                total_loan_amount = ?, interest_rate = ?, interest_type = ?,
                duration_months = ?, start_date = ?, hold_amount = ?, admin_fee = ?
            WHERE id = ?`,
            [
                name, amount, dueDate, type, totalLoanAmount, interestRate,
                interestType, durationMonths, startDate, holdAmount, adminFee, id
            ]
        );

        const [updated] = await db.query('SELECT * FROM credits WHERE id = ?', [id]);
        if (updated.length === 0) return res.status(404).json({ error: 'Credit not found' });

        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating credit:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete credit
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM credits WHERE id = ?', [id]);
        res.json({ message: 'Credit deleted successfully' });
    } catch (error) {
        console.error('Error deleting credit:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
