import pool from './db.js';

async function run() {
    try {
        const [rows] = await pool.query("SELECT phone_number, pin FROM users WHERE id='user_alex'");
        console.log('CREDENTIALS:', rows);
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
run();
