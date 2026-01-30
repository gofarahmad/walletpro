
import { test, expect } from '@playwright/test';

test('Verify User Login', async ({ page }) => {
    test.setTimeout(30000);

    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3000');

    // Seed User if not exists (using evaluate to ensure clean state)
    // Seed User if not exists (using evaluate to ensure clean state)
    await page.waitForFunction(() => (window as any).Dexie !== undefined);

    await page.evaluate(async () => {
        // @ts-ignore
        const db = window.db; // Use exposed instance with schema
        if (!db) throw new Error('DB not found on window');
        await db.open();
        // Ensure user exists
        const userCount = await db.table('users').count();
        if (userCount === 0) {
            await db.table('users').add({
                id: 'user_login_test',
                name: 'Login Tester',
                pin: '1234',
                photoUrl: 'https://via.placeholder.com/100',
                isSaved: true,
                phoneNumber: '08123456789'
            });
        }
    });

    await page.reload();

    console.log('2. Checking for User Button...');
    // Look for ANY user button, or specifically ours if we seeded it
    const userButton = page.locator('button', { hasText: 'Login Tester' }).or(page.locator('button', { hasText: 'E2E User' })).first();
    await expect(userButton).toBeVisible();

    const userName = await userButton.innerText();
    console.log(`Found user: ${userName}`);
    await userButton.click();

    console.log('3. Entering PIN...');
    // Enter PIN 1234
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '4', exact: true }).click();

    console.log('4. Verifying Dashboard...');
    // dashboard should show user name
    await expect(page.getByText(userName)).toBeVisible();
    await expect(page.getByText('Total Saldo Tersedia')).toBeVisible();

    console.log('Login Successful!');
});
