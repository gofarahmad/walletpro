import pool from './db.js';

const migrate = async () => {
    try {
        console.log('Starting debts admin_fee migration...');
        const connection = await pool.getConnection();

        // Check if column exists first to avoid error if re-run blindly, though 'ADD COLUMN IF NOT EXISTS' is MariaDB specific sometimes.
        // simpler to just try/catch or use the loop pattern I used before.
        const queries = [
            "ALTER TABLE debts ADD COLUMN admin_fee DECIMAL(15, 2) DEFAULT 0.00;",
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
        console.log('Debts Admin Fee Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
