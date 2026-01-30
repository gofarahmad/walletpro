import db from './db.js';

const migrate = async () => {
    try {
        console.log('Migrating credits table...');

        // Add columns for Detailed Banking/Loan Logic
        // type: to distinguish Bank/KPR/Paylater/Subscription
        // total_loan_amount: Plafond (Principal)
        // interest_rate: %
        // interest_type: Annual/Monthly
        // duration_months: Tenor
        // start_date: Tanggal Pencairan
        // hold_amount: Dana Ditahan
        // admin_fee: Biaya Admin
        // last_payment_date: To track monthly payments accurately (optional, but good for "is_paid_this_month" logic reset)

        await db.query(`
      ALTER TABLE credits
      ADD COLUMN type VARCHAR(50) DEFAULT 'Bills',
      ADD COLUMN total_loan_amount DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN interest_rate DECIMAL(5, 2) DEFAULT 0.00,
      ADD COLUMN interest_type ENUM('Annual', 'Monthly') DEFAULT 'Annual',
      ADD COLUMN duration_months INT DEFAULT 1,
      ADD COLUMN start_date DATE,
      ADD COLUMN hold_amount DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN admin_fee DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN remaining_tenor INT DEFAULT 0;
    `);

        console.log('Credits table updated successfully.');
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
