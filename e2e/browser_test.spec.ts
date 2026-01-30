import { test, expect } from '@playwright/test';

test('Finance App Verification', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout

    // 1. Navigate to the app to initialize DB
    console.log('Navigating to app...');
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    await page.goto('http://localhost:3000');

    // 2. Seed Dexie
    console.log('Seeding Dexie...');
    // Wait for Dexie to be exposed
    await page.waitForFunction(() => (window as any).Dexie !== undefined);

    await page.evaluate(async () => {
        // @ts-ignore
        const db = new window.Dexie('FinanceDB');
        db.version(1).stores({
            transactions: 'id, userId, date, type, category',
            budgets: 'id, userId',
            accounts: 'id, userId',
            categories: 'id, userId, type',
            debts: 'id, userId, type, dueDate',
            credits: 'id, userId, type, dueDate',
            notifications: 'id, userId, isRead',
            users: 'id, isSaved',
            contacts: 'id, userId, isFavorite',
            syncQueue: '++id, timestamp'
        });

        // Clear and add test user
        await db.users.clear();
        await db.debts.clear();
        await db.accounts.clear();

        await db.users.add({
            id: 'user_e2e',
            name: 'E2E User',
            pin: '1234',
            photoUrl: 'https://via.placeholder.com/100',
            isSaved: true,
            phoneNumber: '08999999999'
        });

        // Add test debt
        await db.debts.add({
            id: 'debt_e2e_1',
            userId: 'user_e2e',
            contactName: 'Test Debt',
            name: 'Test Debt', // Backend field
            amount: 50000,
            paid: 0,
            type: 'Hutang',
            dueDate: '2026-02-01',
            remainingAmount: 50000
        });

        // Add test account
        await db.accounts.add({
            id: 'acc_e2e',
            userId: 'user_e2e',
            name: 'Cash',
            balance: 1000000,
            type: 'Cash',
            icon: 'wallet'
        });
    });

    // Reload to pick up changes
    console.log('Reloading...');
    await page.reload();

    // 3. Login Flow
    console.log('Checking for Quick Login...');
    const userButton = page.locator('button', { hasText: 'E2E User' });
    await expect(userButton).toBeVisible({ timeout: 10000 });
    await userButton.click();

    console.log('Entering PIN...');
    const pinButtons = page.locator('button', { hasText: /^[0-9]$/ });
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '4', exact: true }).click();

    // 4. Verify Dashboard
    console.log('Verifying Dashboard...');
    // We expect "Total Kekayaan" or similar sum, but specifically "Total Saldo Tersedia" from Dashboard.tsx
    await expect(page.getByText('Total Saldo Tersedia')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('E2E User')).toBeVisible();

    // 5. Navigate to Debts
    console.log('Navigating to Debts...');
    await page.getByText('Debts').click(); // BottomNav label

    // 6. Verify Test Debt
    console.log('Verifying Test Debt...');
    await expect(page.getByText('Test Debt')).toBeVisible({ timeout: 10000 });
    // Verify amount exists (formatted)
    const amountPattern = /50[.,]000/;
    await expect(page.getByText(amountPattern).first()).toBeVisible();

    // ... earlier steps ...

    // 7. Verify Budget Deletion
    console.log('Navigating to Budget (Pagu)...');
    await page.getByText('Pagu').click();

    // Seed a budget specifically for deletion if not already present
    await page.evaluate(async () => {
        // @ts-ignore
        const db = new window.Dexie('FinanceDB');
        await db.open();
        await db.table('budgets').put({
            id: 'budget_to_delete',
            userId: 'user_e2e',
            category: 'Delete Me',
            name: 'Delete Me',
            limit: 1000000,
            spent: 0,
            icon: 'delete',
            color: '#ef4444'
        });
    });

    console.log('Verifying budget exists...');
    const budgetItem = page.getByRole('button').filter({ hasText: 'Delete Me' });
    await expect(budgetItem).toBeVisible({ timeout: 10000 });

    console.log('Opening edit modal...');
    await budgetItem.click();

    console.log('Waiting for delete button...');
    const deleteBtn = page.getByRole('button', { name: 'Hapus Pagu' });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    console.log('Deleting budget...');

    // Click delete button
    await deleteBtn.click();

    console.log('Verifying deletion...');
    // Wait for item to disappear
    try {
        await expect(budgetItem).not.toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log('Verification failed, taking screenshot...');
        await page.screenshot({ path: 'failure.png', fullPage: true });
        throw e;
    }

    console.log('E2E Test completed successfully');
});
