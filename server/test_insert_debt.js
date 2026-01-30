import pool from './db.js';

async function run() {
    try {
        const id = 'test_debt_' + Math.floor(Math.random() * 1000);
        const userId = 'user_alex'; // Valid user
        const name = 'Test Debt';
        const amount = 50000;
        const paid = 0;
        const dueDate = '2026-02-01';
        const interestRate = 0;
        const interestType = 'Annual';
        const startDate = null;
        const durationMonths = 1;
        const holdAmount = 0;
        const adminFee = 0;
        const phoneNumber = '08123456789';
        const type = 'Hutang';

        console.log('Attempting INSERT...');

        await pool.query(
            'INSERT INTO debts (id, user_id, name, amount, paid, due_date, interest_rate, interest_type, start_date, duration_months, hold_amount, admin_fee, phone_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, name, amount, paid, dueDate, interestRate, interestType, startDate, durationMonths, holdAmount, adminFee, phoneNumber, type]
        );

        console.log('INSERT successful!');
        process.exit(0);
    } catch (e) {
        console.error('INSERT failed:', e);
        process.exit(1);
    }
}
run();
