import pool from './db.js';

const migrate = async () => {
    try {
        console.log('Starting migration...');
        const connection = await pool.getConnection();

        const queries = [
            "ALTER TABLE accounts ADD COLUMN account_number VARCHAR(50) NULL;",
            "ALTER TABLE accounts ADD COLUMN phone_number VARCHAR(20) NULL;",
            "ALTER TABLE accounts ADD COLUMN account_holder VARCHAR(255) NULL;",
            "ALTER TABLE accounts ADD COLUMN type ENUM('Bank', 'Wallet', 'Cash') DEFAULT 'Bank';"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    // Extract column name for cleaner log
                    console.log(`Column already exists, skipping: ${query}`);
                } else {
                    console.error(`Error executing ${query}:`, err.message);
                }
            }
        }

        connection.release();
        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
