import db from './db.js';

async function migrateCategoriesColor() {
    try {
        console.log('Starting migration: Adding color column to categories...');

        // Check if column exists
        const [columns] = await db.query('SHOW COLUMNS FROM categories LIKE "color"');

        if (columns.length === 0) {
            await db.query('ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT NULL');
            console.log('Added color column to categories table.');
        } else {
            console.log('Color column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateCategoriesColor();
