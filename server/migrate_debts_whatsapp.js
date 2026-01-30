import db from './db.js';

const migrate = async () => {
    try {
        console.log('Migrating debts table...');

        // Add phone_number and type columns
        // type: 'Hutang' (Payable) or 'Piutang' (Receivable)
        await db.query(`
            ALTER TABLE debts
            ADD COLUMN phone_number VARCHAR(20),
            ADD COLUMN type ENUM('Hutang', 'Piutang') DEFAULT 'Hutang';
        `);

        console.log('Debts table updated successfully.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping...');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
