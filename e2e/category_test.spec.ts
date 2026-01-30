
import { test, expect } from '@playwright/test';

test('Verify Custom Category Addition', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to app
    await page.goto('http://localhost:3000');

    // 2. Clear and Seed Dexie (Minimal)
    // 2. Clear and Seed Dexie (Minimal)
    try {
        await page.waitForFunction(() => (window as any).Dexie !== undefined, null, { timeout: 5000 });
    } catch (e) {
        console.log('Dexie not found on window object within 5s');
        throw e;
    }

    await page.evaluate(async () => {
        // @ts-ignore
        const db = window.db;
        if (!db) throw new Error('DB not found on window');
        await db.open();
        // Clear pertinent tables
        await db.table('users').clear();
        await db.table('categories').clear();
        await db.table('accounts').clear();

        // Seed User
        await db.table('users').add({
            id: 'user_cat_test',
            name: 'Cat Tester',
            pin: '1234',
            photoUrl: 'https://via.placeholder.com/100',
            isSaved: true,
            phoneNumber: '08111111111'
        });

        // Seed Account (needed for Add Transaction view)
        await db.table('accounts').add({
            id: 'acc_cat_test',
            userId: 'user_cat_test',
            name: 'Cash',
            balance: 1000000,
            type: 'Cash',
            icon: 'wallet'
        });
    });

    await page.reload();

    // 3. Login
    const userButton = page.locator('button', { hasText: 'Cat Tester' });
    await expect(userButton).toBeVisible();
    await userButton.click();

    // Enter PIN 1234
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '4', exact: true }).click();

    // 4. Open Add Transaction
    await expect(page.getByText('Cat Tester')).toBeVisible();
    // Use robust selector for FAB with material icon ligature 'add'
    await page.locator('button').filter({ hasText: 'add' }).last().click();

    // 5. Select Income
    await page.getByRole('button', { name: 'Pemasukan' }).click();

    // 6. Open Add Custom Category
    // Scroll if needed? Add button is usually at bottom of grid.
    const addCatBtn = page.getByText('Kustom Income');
    await addCatBtn.click();

    // 7. Fill Category Details
    await page.getByPlaceholder('Misal: Langganan').fill('Side Hustle');
    // Select first icon
    await page.locator('.material-symbols-outlined').filter({ hasText: 'restaurant' }).first().click();

    // 8. Create
    await page.getByRole('button', { name: 'Buat Kategori' }).click();

    // 9. Verify it appears and is selected
    // The previous screen should now show 'Side Hustle' as selected category or in the list.
    // 9. Verify it appears and is selected
    // Wait for the modal to close and main view to update
    await expect(page.getByText('Ubah Transaksi')).not.toBeVisible(); // Or 'Tambah Transaksi', modal closes?
    // Wait, AddTransaction IS the screen. 'isCreatingCategory' takes over the view.
    // When creation finishes, it sets isCreatingCategory(false), returning to AddTransaction view.

    // Verify 'Side Hustle' button is visible
    const newCatBtn = page.getByRole('button').filter({ hasText: 'Side Hustle' });
    await expect(newCatBtn).toBeVisible({ timeout: 10000 });

    // Verify it is selected
    await expect(newCatBtn).toHaveClass(/bg-primary/);

    // Verify it is selected (bg-primary)
    // Check class or computed style if possible, or just visibility is enough for now.

    console.log('Category created and visible!');
});
