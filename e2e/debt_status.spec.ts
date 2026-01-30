import { test, expect } from '@playwright/test';

test('Verify Debt Status Updates to LUNAS', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate
    await page.goto('http://localhost:3000');

    // 2. Seed Data
    await page.evaluate(async () => {
        // @ts-ignore
        const db = window.db;
        if (!db) return; // Should be there

        await db.debts.clear();
        await db.accounts.clear();

        // Add Account
        await db.accounts.add({
            id: 'acc_status_test',
            name: 'Cash',
            balance: 500000,
            type: 'Cash',
            icon: 'wallet'
        });

        // Add Debt
        await db.debts.add({
            id: 'debt_status_test',
            contactName: 'Status Test Debt',
            amount: 100000,
            paid: 0,
            remainingAmount: 100000,
            type: 'Hutang',
            dueDate: '2026-02-01'
        });
    });

    await page.reload();

    // 3. Login (Assuming auto-login or quick user select if exists, else seed user? 
    // The previous tests seed user. Assuming one exists or we just see the screen if auth is bypassed?
    // Wait, auth is required. We need to seed a user too or reuse logic.
    // Let's seed a user to be safe.
    await page.evaluate(async () => {
        // @ts-ignore
        const db = window.db;
        await db.users.put({
            id: 'user_status_test',
            name: 'Status Tester',
            pin: '1234',
            photoUrl: 'https://via.placeholder.com/100',
            isSaved: true
        });
    });
    await page.reload();

    // Login
    await page.locator('button', { hasText: 'Status Tester' }).click();
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '4', exact: true }).click();

    // 4. Go to Debts
    await page.getByText('Debts').click();

    // 5. Verify Initial State
    const debtName = page.getByText('Status Test Debt');
    await expect(debtName).toBeVisible();

    // Check amount loosely
    const debtItem = page.locator('div', { hasText: 'Status Test Debt' }).filter({ hasText: /100[.,]000/ });
    await expect(debtItem).toBeVisible();
    await expect(page.getByText('Bayar Hutang')).toBeVisible();

    // 6. Pay Full Amount
    await page.getByRole('button', { name: 'Bayar Hutang' }).click();

    // In Modal
    await expect(page.getByText('Bayar Hutang')).toBeVisible();
    // Amount should be prefilled or we fill it. code says: setPayAmount(debt.remainingAmount.toString())
    // So it should be 100000.
    // Click 'Bayar'
    await page.getByRole('button', { name: 'Bayar', exact: true }).click();

    // 7. Verify Success Modal and Close
    await expect(page.getByText('Hutang Terupdate')).toBeVisible();
    // Wait for modal to dissipate or click close if there is one. 
    // Usually notification auto-hides? Or Success Modal?
    // Debts.tsx line 152: setIsPaymentSuccessOpen(true);
    // There is a success modal!
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
