import db from './db.js';

async function migrate() {
    try {
        console.log('Migrating Debt History...');

        // Create debt_history table without strict foreign key to avoid collation/type mismatch issues
        // We will manage integrity in the application logic
        await db.query(`
            CREATE TABLE IF NOT EXISTS debt_history (
                id VARCHAR(255) PRIMARY KEY,
                debt_id VARCHAR(255) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                date DATETIME NOT NULL,
                note TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Debt History table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
