import { test } from '@playwright/test';
import { getE2ECredentials } from './helpers';

test.describe('E2E Setup Check', () => {
    test('Ensure test prerequisites exist: user, folder, room, quiz', async ({
        browser
    }) => {
        test.setTimeout(120000); // 2 minutes

        // Create browser context
        const context = await browser.newContext();
        const page = await context.newPage();

        // Handle dialogs
        page.on('dialog', async dialog => {
            console.log('Dialog:', dialog.message());
            await dialog.accept();
        });

        try {
            console.log('Checking test user...');

            // Try to login
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            const { email, password } = getE2ECredentials();

            const emailInput = page.getByLabel('Email').or(page.locator('input[type="email"]')).first();
            await emailInput.fill(email);

            const passwordInput = page.locator('input[type="password"]').first();
            await passwordInput.fill(password);

            const loginButton = page.locator('button:has-text("Login")').or(page.locator('button:has-text("Se connecter")')).first();
            await loginButton.click();

            // Check if login successful
            try {
                await page.waitForURL(/\/dashboard|\/teacher/, { timeout: 10000 });
                console.log('Test user exists and login successful');
            } catch {
                throw new Error('Test user does not exist. Please ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are set and user is created.');
            }

            // Now on dashboard, check folder
            await page.goto('/teacher/dashboard-v2');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);

            console.log('Checking default folder...');

            // Check if "Dossier par défaut" exists in folders
            const folderExists = await page.getByRole('button', { name: /Dossier par défaut/i }).isVisible({ timeout: 5000 });
            if (!folderExists) {
                console.log('Creating default folder...');

                // Click create folder button
                const createFolderBtn = page.locator('button').filter({ hasText: 'Nouveau dossier' }).first();
                await createFolderBtn.click();

                // Wait for dialog
                await page.waitForTimeout(1000);

                // Fill folder name
                const folderInput = page.getByLabel('Titre du dossier');
                await folderInput.fill('Dossier par défaut');

                // Click create
                const confirmBtn = page.locator('button').filter({ hasText: 'Créer' }).first();
                await confirmBtn.click();

                await page.waitForTimeout(2000);
                console.log('Default folder created');
            } else {
                console.log('Default folder exists');
            }

            console.log('Checking TEST room...');

            // Check rooms section
            const roomsExpandedAttr = await page.locator('button').filter({ hasText: 'Salles' }).first().getAttribute('aria-expanded');
            if (roomsExpandedAttr !== 'true') {
                const roomsBtn = page.locator('button').filter({ hasText: 'Salles' }).first();
                await roomsBtn.click();
                await page.waitForTimeout(1000);
            }

            // Check if TEST room exists
            const testRoomExists = await page.getByRole('list').getByText('TEST', { exact: true }).isVisible({ timeout: 5000 });
            if (!testRoomExists) {
                console.log('Creating TEST room...');

                // Click create room
                const createRoomBtn = page.locator('button').filter({ hasText: 'Nouvelle salle' }).first();
                await createRoomBtn.click();

                // Fill room name
                const roomInput = page.locator('input[placeholder="Nom de la salle"]').first();
                await roomInput.fill('TEST');

                // Click create
                const createBtn = page.locator('button').filter({ hasText: 'Créer' }).first();
                await createBtn.click();

                await page.waitForTimeout(2000);
                console.log('TEST room created');
            } else {
                console.log('TEST room exists');
            }

            console.log('Checking TESTQUIZ...');

            // Check if TESTQUIZ exists
            const testQuizExists = await page.locator('text=TESTQUIZ').isVisible({ timeout: 5000 });
            if (!testQuizExists) {
                console.log('Creating TESTQUIZ...');

                // Click "Nouveau quiz"
                const newQuizBtn = page.locator('button:has-text("Nouveau quiz")').first();
                await newQuizBtn.click();
                await page.waitForTimeout(2000);

                // Fill title
                const titleInput = page.getByLabel('Titre').or(page.locator('input[placeholder*="titre"]')).first();
                await titleInput.fill('TESTQUIZ');

                // Select folder
                const folderSelect = page.locator('[role="combobox"]').first();
                await folderSelect.click();
                await page.locator('li').filter({ hasText: 'Dossier par défaut' }).click();

                // Add GIFT
                const giftEditor = page.locator('textarea').or(page.locator('[contenteditable="true"]')).first();
                await giftEditor.fill('::Q1:: What is 1+1? {=2}');
                await page.keyboard.press('Tab');

                // Save
                const saveBtn = page.locator('button:has-text("Enregistrer")').first();
                await saveBtn.click();
                await page.waitForTimeout(3000);

                // Back to dashboard
                const backBtn = page.locator('button:has-text("retour")').first();
                await backBtn.click();
                await page.waitForURL(/\/dashboard/);
                await page.waitForTimeout(2000);

                console.log('TESTQUIZ created');
            } else {
                console.log('TESTQUIZ exists');
            }

            console.log('Setup check completed successfully');

        } finally {
            await context.close();
        }
    });
});