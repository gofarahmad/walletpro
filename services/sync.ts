import { db } from '../db';
import { GoogleDriveService } from './google';

export const SyncService = {

    async sync(userId: string) {
        if (!navigator.onLine) return;

        // Process REST Queue first to ensure backend is up to date
        await this.processRestQueue();

        try {
            // 1. Check Auth
            if (!GoogleDriveService.isSignedIn()) {
                console.log('Sync: Not signed in to Google Drive');
                return;
            }

            console.log('Sync: Starting...'); // Notify User via UI?

            // 2. Fetch Remote Data (Pull)
            const remoteData: any = await GoogleDriveService.downloadData();

            // 3. Merge Strategy
            if (remoteData) {
                await db.transaction('rw', db.tables, async () => {
                    // Helper to merge tables
                    const mergeTable = async (tableName: string, remoteItems: any[]) => {
                        if (!remoteItems || !Array.isArray(remoteItems)) return;
                        const table = db.table(tableName);
                        // Simple Merge: Overwrite local with remote if ID exists, Add if new.
                        // This favors Server state, which is safer for multi-device consistency.
                        // Ideally we'd use lastModified, but we don't have it on all records.
                        await table.bulkPut(remoteItems);
                    };

                    await mergeTable('transactions', remoteData.transactions);
                    await mergeTable('budgets', remoteData.budgets);
                    await mergeTable('accounts', remoteData.accounts);
                    await mergeTable('categories', remoteData.categories);
                    await mergeTable('debts', remoteData.debts);
                    await mergeTable('credits', remoteData.credits);
                    await mergeTable('notifications', remoteData.notifications);
                    await mergeTable('users', remoteData.users);
                });
                console.log('Sync: Pull complete.');
            }

            // 4. Upload Merged State (Push)
            const mergedData = {
                transactions: await db.transactions.toArray(),
                budgets: await db.budgets.toArray(),
                accounts: await db.accounts.toArray(),
                categories: await db.categories.toArray(),
                debts: await db.debts.toArray(),
                credits: await db.credits.toArray(),
                notifications: await db.notifications.toArray(),
                users: await db.users.toArray(),
            };

            await GoogleDriveService.uploadData(mergedData);

            // 5. Clear Queue
            await db.syncQueue.clear();

            console.log('Sync: Push complete.');

        } catch (error) {
            console.error('Sync Error:', error);
        }
    },

    // Alias for compatibility
    async pushChanges() {
        await this.processRestQueue();
        await this.sync('google-user');
    },

    async processRestQueue() {
        if (!navigator.onLine) return;

        const queue = await db.syncQueue.orderBy('timestamp').toArray();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        for (const item of queue) {
            try {
                const response = await fetch(`${API_URL}${item.endpoint}`, {
                    method: item.type,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.body)
                });

                if (response.ok) {
                    if (item.id) await db.syncQueue.delete(item.id);
                } else {
                    console.error('Sync failed for item', item.id, response.statusText);
                    break; // Stop on error to preserve order
                }
            } catch (error) {
                console.error('Network error processing sync queue', error);
                break;
            }
        }
    },

    async pullData(userId: string) {
        await this.sync(userId);
    }
};
