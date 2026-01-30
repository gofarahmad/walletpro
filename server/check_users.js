import pool from './db.js';

async function run() {
    try {
        const [rows] = await pool.query("SELECT id, name FROM users LIMIT 5");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
run();
