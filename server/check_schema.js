import pool from './db.js';
import fs from 'fs';

async function run() {
    try {
        const [rows] = await pool.query("SHOW CREATE TABLE debts");
        const schema = rows[0]['Create Table'];
        fs.writeFileSync('schema_dump.txt', schema);
        console.log("Schema dumped to schema_dump.txt");
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
run();
