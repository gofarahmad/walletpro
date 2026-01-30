import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all debts for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [debts] = await db.query(
            'SELECT * FROM debts WHERE user_id = ?',
            [userId]
        );

        if (debts.length > 0) {
            const debtIds = debts.map(d => d.id);
            const placeholders = debtIds.map(() => '?').join(',');
            const [history] = await db.query(
                `SELECT * FROM debt_history WHERE debt_id IN (${placeholders}) ORDER BY date DESC`,
                debtIds
            );

            // Attach history to each debt
            debts.forEach(debt => {
                debt.history = history.filter(h => h.debt_id === debt.id);
            });
        }

        res.json(debts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ... (Create debt remains same) ...

// Pay debt
router.post('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, accountId } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get debt type to determine balance direction
            const [debtInfo] = await connection.query('SELECT type FROM debts WHERE id = ?', [id]);
            const debtType = debtInfo.length > 0 ? debtInfo[0].type : 'Hutang';

            // Update debt paid amount and last payment date
            await connection.query(
                'UPDATE debts SET paid = paid + ?, last_payment_date = NOW() WHERE id = ?',
                [amount, id]
            );

            // Record History
            const historyId = Math.random().toString(36).substr(2, 9);
            await connection.query(
                'INSERT INTO debt_history (id, debt_id, amount, date, note) VALUES (?, ?, ?, NOW(), ?)',
                [historyId, id, amount, 'Payment']
            );

            // Update account balance
            // If Hutang: I pay -> Deduct Balance
            // If Piutang: Friend pays me -> Add Balance
            if (debtType === 'Piutang') {
                await connection.query(
                    'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                    [amount, accountId]
                );
            } else {
                await connection.query(
                    'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                    [amount, accountId]
                );
            }

            await connection.commit();

            // Fetch updated debt
            const [updated] = await db.query(
                'SELECT * FROM debts WHERE id = ?',
                [id]
            );

            // Fetch history for this debt
            const [history] = await db.query(
                'SELECT * FROM debt_history WHERE debt_id = ? ORDER BY date DESC',
                [id]
            );

            if (updated.length > 0) {
                updated[0].history = history;
            }

            res.json(updated[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error paying debt:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update debt
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, paid, dueDate, interestRate, interestType, startDate, durationMonths, holdAmount, adminFee, phoneNumber, type } = req.body;

        await db.query(
            'UPDATE debts SET name = ?, amount = ?, paid = ?, due_date = ?, interest_rate = ?, interest_type = ?, start_date = ?, duration_months = ?, hold_amount = ?, admin_fee = ?, phone_number = ?, type = ?, note = ? WHERE id = ?',
            [name, amount, paid, dueDate, interestRate || 0, interestType || 'Annual', startDate || null, durationMonths || 1, holdAmount || 0, adminFee || 0, phoneNumber || null, type || 'Hutang', note || null, id]
        );

        const [updated] = await db.query(
            'SELECT * FROM debts WHERE id = ?',
            [id]
        );

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating debt:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete debt
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM debts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        res.json({ message: 'Debt deleted successfully' });
    } catch (error) {
        console.error('Error deleting debt:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

