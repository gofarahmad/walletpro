import { test, expect } from '@playwright/test';

test('Verify Debt Status Updates to LUNAS', async ({ page, request }) => {
    test.setTimeout(60000);

    const API_URL = 'http://localhost:3001/api';
    const USER_ID = 'user_status_test';
    const ACCOUNT_ID = 'acc_status_test';
    const DEBT_ID = 'debt_status_test';

    // 1. Cleanup & Seed Data via API
    await test.step('Seed Data', async () => {
        // Delete potentially existing data to ensure clean state
        // We ignore errors if they don't exist
        await request.delete(`${API_URL}/debts/${DEBT_ID}`).catch(() => { });
        await request.delete(`${API_URL}/accounts/${ACCOUNT_ID}`).catch(() => { });
        await request.delete(`${API_URL}/auth/users/${USER_ID}`).catch(() => { });

        // Register User
        const userRes = await request.post(`${API_URL}/auth/register`, {
            data: {
                id: USER_ID,
                name: 'Status Tester',
                phoneNumber: '081234567890',
                pin: '1234',
                photoUrl: 'https://via.placeholder.com/100',
                isSaved: true
            }
        });
        expect(userRes.ok()).toBeTruthy();

        // Create Account
        const accRes = await request.post(`${API_URL}/accounts`, {
            data: {
                id: ACCOUNT_ID,
                userId: USER_ID,
                name: 'Cash',
                balance: 500000,
                type: 'Cash',
                icon: 'wallet',
                accountNumber: '123456',
                phoneNumber: '081234567890',
                accountHolder: 'Status Tester'
            }
        });
        expect(accRes.ok()).toBeTruthy();

        // Create Debt
        const debtRes = await request.post(`${API_URL}/debts`, {
            data: {
                id: DEBT_ID,
                userId: USER_ID,
                name: 'Status Test Debt',
                amount: 100000,
                paid: 0,
                dueDate: '2026-02-01',
                type: 'Hutang',
                phoneNumber: '08999999999',
                // Optional fields
                interestRate: 0,
                interestType: 'Annual'
            }
        });
        expect(debtRes.ok()).toBeTruthy();
    });

    // 2. Navigate
    await page.goto('http://localhost:3000');

    // 3. Login
    // Select the user we just created (Status Tester)
    // Assuming the 'Login' screen lists saved users.
    // If getting list relies on initial fetch, it should be there.

    // Wait for user list to populate
    await expect(page.locator('text=Status Tester')).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: 'Status Tester' }).click();
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '4', exact: true }).click();

    // 4. Go to Debts
    await page.getByText('Debts').click();

    // 5. Verify Initial State
    // Wait for sync to pull data
    const debtName = page.getByText('Status Test Debt');
    await expect(debtName).toBeVisible({ timeout: 10000 });

    // Check amount
    const debtItem = page.locator('div', { hasText: 'Status Test Debt' }).filter({ hasText: /100[.,]000/ });
    await expect(debtItem).toBeVisible();
    await expect(page.getByText('Bayar Hutang')).toBeVisible();

    // 6. Pay Full Amount
    await page.getByRole('button', { name: 'Bayar Hutang' }).click();

    // In Modal
    await expect(page.getByText('Bayar Hutang')).toBeVisible();

    // Click 'Bayar'
    await page.getByRole('button', { name: 'Bayar', exact: true }).click();

    // 7. Verify Success Modal and Close
    await expect(page.getByText('Hutang Terupdate')).toBeVisible();
    await expect(page.getByText('Pembayaran Berhasil')).toBeVisible();

    // Close success modal
    await page.getByRole('button', { name: 'Tutup' }).click();

    // 8. Verify LUNAS Status
    // Should now say LUNAS
    await expect(page.getByText('LUNAS')).toBeVisible();

    // Button should be disabled and say 'Lunas'
    const lunasBtn = page.getByRole('button', { name: 'Lunas' });
    await expect(lunasBtn).toBeVisible();
    await expect(lunasBtn).toBeDisabled();

    console.log('Debt status verification passed!');
});
