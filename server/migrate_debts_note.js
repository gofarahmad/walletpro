import db from './db.js';

async function migrate() {
    try {
        console.log('Migrating debts note...');

        await db.query(`
            ALTER TABLE debts
            ADD COLUMN note TEXT
        `);

        console.log('Debts table updated with note column.');
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
