import db from './db.js';

async function migrate() {
    try {
        console.log('Migrating budgets color...');

        await db.query(`
            ALTER TABLE budgets
            ADD COLUMN color VARCHAR(20) DEFAULT '#136dec';
        `);

        console.log('Budgets table updated with color column.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, skipping...');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
