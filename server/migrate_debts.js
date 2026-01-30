import pool from './db.js';

const migrate = async () => {
    try {
        console.log('Starting debts migration...');
        const connection = await pool.getConnection();

        const queries = [
            "ALTER TABLE debts ADD COLUMN interest_rate DECIMAL(5, 2) DEFAULT 0;",
            "ALTER TABLE debts ADD COLUMN interest_type ENUM('Annual', 'Monthly') DEFAULT 'Annual';",
            "ALTER TABLE debts ADD COLUMN start_date DATE NULL;",
            "ALTER TABLE debts ADD COLUMN duration_months INT DEFAULT 1;",
            "ALTER TABLE debts ADD COLUMN hold_amount DECIMAL(15, 2) DEFAULT 0.00;",
            "ALTER TABLE debts ADD COLUMN last_payment_date DATETIME NULL;"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping: ${query}`);
                } else {
                    console.error(`Error executing ${query}:`, err.message);
                }
            }
        }

        connection.release();
        console.log('Debts Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
