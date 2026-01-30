import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scripts = [
    'migrate_notifications.js',
    'migrate_debts.js',
    'migrate_credits_banking.js',
    'migrate_debts_admin.js',
    'migrate_accounts.js'
];

const runScript = (scriptName) => {
    return new Promise((resolve, reject) => {
        console.log(`\n--- Running ${scriptName} ---`);
        const scriptPath = path.join(__dirname, scriptName);
        const child = spawn('node', [scriptPath], { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`Successfully completed ${scriptName}`);
                resolve();
            } else {
                console.error(`Script ${scriptName} failed with code ${code}`);
                reject(new Error(`Script ${scriptName} failed`));
            }
        });

        child.on('error', (err) => {
            console.error(`Failed to start ${scriptName}:`, err);
            reject(err);
        });
    });
};

const runAll = async () => {
    try {
        for (const script of scripts) {
            await runScript(script);
        }
        console.log('\nAll migrations completed successfully.');
    } catch (error) {
        console.error('\nStopping migrations due to error.');
        process.exit(1);
    }
};

runAll();
