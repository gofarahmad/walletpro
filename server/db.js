import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Client } from 'ssh2';
import path from 'path';
import net from 'net';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initializePool() {
    if (pool) return pool;

    if (process.env.SSH_HOST) {
        console.log('🔌 Establishing SSH Tunnel to', process.env.SSH_HOST);

        return new Promise((resolve, reject) => {
            const sshClient = new Client();
            const sshConfig = {
                host: process.env.SSH_HOST,
                port: parseInt(process.env.SSH_PORT || '22'),
                username: process.env.SSH_USER,
                password: process.env.SSH_PASSWORD,
                readyTimeout: 20000
            };

            sshClient.on('ready', () => {
                console.log('✅ SSH Client Ready');
                sshClient.forwardOut(
                    '127.0.0.1',
                    12345,
                    dbConfig.host,
                    dbConfig.port,
                    (err, stream) => {
                        if (err) {
                            console.error('❌ SSH ForwardOut Error:', err);
                            sshClient.end();
                            return reject(err);
                        }
                        console.log('✅ SSH ForwardOut Verified');

                        // Local Forwarder
                        const server = net.createServer((socket) => {
                            sshClient.forwardOut('127.0.0.1', 12345, dbConfig.host, dbConfig.port, (err, sshStream) => {
                                if (err) {
                                    console.error('❌ Forwarding Error:', err);
                                    socket.end();
                                    return;
                                }
                                socket.pipe(sshStream).pipe(socket);
                            });
                        });

                        server.listen(0, '127.0.0.1', () => {
                            const address = server.address();
                            if (!address || typeof address === 'string') {
                                const err = new Error('Failed to create local forwarder');
                                console.error('❌ Local Server Error:', err);
                                return reject(err);
                            }

                            console.log(`✅ SSH Tunnel Forwarding via 127.0.0.1:${address.port}`);

                            pool = mysql.createPool({
                                ...dbConfig,
                                host: '127.0.0.1',
                                port: address.port
                            });

                            resolve(pool);
                        });
                    }
                );
            }).on('error', (err) => {
                console.error('❌ SSH Connection Error:', err);
                reject(err);
            }).connect(sshConfig);
        });
    } else {
        pool = mysql.createPool(dbConfig);
        return pool;
    }
}

const db = {
    query: async (sql, params) => {
        if (!pool) await initializePool();
        return pool.query(sql, params);
    },
    getConnection: async () => {
        if (!pool) await initializePool();
        return pool.getConnection();
    }
};

initializePool().catch(err => {
    console.error('Failed to init DB:', err.message);
});

export default db;
