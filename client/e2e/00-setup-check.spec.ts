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
            await page.goto('/teacher/dashboard');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000); // Increased wait time for dashboard to fully load

            console.log('Checking default folder...');

            // Check if "Dossier par défaut" exists in folders - try multiple selectors
            let folderExists = false;
            try {
                // Wait for folders section to load
                await page.waitForTimeout(2000);
                folderExists = await page.locator('text=Dossier par défaut').first().isVisible({ timeout: 5000 });
            } catch {
                folderExists = false;
            }
            
            if (!folderExists) {
                console.log('Creating default folder...');

                // Click create folder button - try data-testid first, then fallback
                let createFolderBtn = page.locator('[data-testid="create-folder-btn"]');
                if (!(await createFolderBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
                    console.log('data-testid not found, trying text selector...');
                    createFolderBtn = page.locator('button').filter({ hasText: 'Nouveau dossier' }).first();
                }
                
                // If still not visible, might need to expand folder section first
                if (!(await createFolderBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
                    console.log('Button not visible, trying to expand folders section...');
                    const expandBtn = page.locator('button').filter({ hasText: 'Dossiers' }).first();
                    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await expandBtn.click();
                        await page.waitForTimeout(1000);
                    }
                }
                
                await createFolderBtn.waitFor({ state: 'visible', timeout: 10000 });
                await createFolderBtn.click();

                // Wait for dialog to open
                await page.waitForTimeout(1500);
                
                // The dialog uses ValidatedTextField with label="Titre du dossier"
                const folderDialog = page.locator('[role="dialog"]');
                await folderDialog.waitFor({ state: 'visible', timeout: 5000 });
                
                // Take screenshot for debugging
                await page.screenshot({ path: 'setup-check-folder-dialog.png' });
                
                // Find input inside the dialog - try multiple selectors
                let folderInput = folderDialog.locator('input').first();
                if (!(await folderInput.isVisible({ timeout: 2000 }).catch(() => false))) {
                    // Try finding by label
                    folderInput = page.getByLabel('Titre du dossier');
                }
                await folderInput.waitFor({ state: 'visible', timeout: 5000 });
                await folderInput.fill('Dossier par défaut');

                // Click create button inside dialog
                const confirmBtn = folderDialog.locator('button').filter({ hasText: 'Créer' }).first();
                await confirmBtn.click();

                await page.waitForTimeout(2000);
                console.log('Default folder created');
            } else {
                console.log('Default folder exists');
            }

            console.log('Checking TEST room...');

            // Take screenshot for debugging
            await page.screenshot({ path: 'setup-check-before-room.png' });

            // Check rooms section - expand if collapsed
            const roomsSectionBtn = page.locator('button').filter({ hasText: 'Salles' }).first();
            try {
                const roomsExpandedAttr = await roomsSectionBtn.getAttribute('aria-expanded');
                console.log('Rooms section expanded:', roomsExpandedAttr);
                if (roomsExpandedAttr !== 'true') {
                    await roomsSectionBtn.click();
                    await page.waitForTimeout(1500);
                    console.log('Expanded rooms section');
                }
            } catch (e) {
                // Rooms section might be in a different state, continue anyway
                console.log('Could not check rooms section state:', e);
            }

            // Check if TEST room exists in the rooms list
            let testRoomExists = false;
            try {
                testRoomExists = await page.locator('li').filter({ hasText: /^TEST$/ }).first().isVisible({ timeout: 5000 });
            } catch {
                testRoomExists = false;
            }
            console.log('TEST room exists:', testRoomExists);
            
            if (!testRoomExists) {
                console.log('Creating TEST room...');

                // Click create room button - try data-testid first
                let createRoomBtn = page.locator('[data-testid="create-room-btn"]');
                if (!(await createRoomBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
                    console.log('data-testid not found, trying text selector...');
                    createRoomBtn = page.locator('button').filter({ hasText: 'Nouvelle salle' }).first();
                }
                await createRoomBtn.waitFor({ state: 'visible', timeout: 10000 });
                await createRoomBtn.click();
                await page.waitForTimeout(1500);
                
                // Take screenshot after clicking create room
                await page.screenshot({ path: 'setup-check-room-create-clicked.png' });

                // Fill room name - try data-testid first, then placeholder
                let roomInput = page.locator('[data-testid="room-name-input"]');
                if (!(await roomInput.isVisible({ timeout: 2000 }).catch(() => false))) {
                    roomInput = page.locator('input[placeholder="Nom de la salle"]').first();
                }
                await roomInput.waitFor({ state: 'visible', timeout: 5000 });
                await roomInput.fill('TEST');

                // Click create button
                const createBtn = page.locator('button').filter({ hasText: 'Créer' }).first();
                await createBtn.click();

                await page.waitForTimeout(2000);
                console.log('TEST room created');
            } else {
                console.log('TEST room exists');
            }

            console.log('Checking TESTQUIZ...');

            // Check if TESTQUIZ exists - wait for quiz list to load first
            let testQuizExists = false;
            try {
                await page.waitForSelector('.quiz', { timeout: 10000 });
                testQuizExists = await page.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).isVisible({ timeout: 5000 });
            } catch {
                testQuizExists = await page.locator('text=TESTQUIZ').first().isVisible({ timeout: 3000 }).catch(() => false);
            }
            
            if (!testQuizExists) {
                console.log('Creating TESTQUIZ...');

                // Click "Nouveau quiz"
                const newQuizBtn = page.locator('button').filter({ hasText: 'Nouveau quiz' }).first();
                await newQuizBtn.waitFor({ state: 'visible', timeout: 10000 });
                await newQuizBtn.click();
                await page.waitForTimeout(3000);
                await page.waitForLoadState('networkidle');

                // Fill title - uses ValidatedTextField, find the input
                const titleInput = page.locator('input[placeholder*="Titre"]').first();
                await titleInput.waitFor({ state: 'visible', timeout: 5000 });
                await titleInput.fill('TESTQUIZ');

                // Select folder using MUI Select
                const folderSelect = page.locator('[role="combobox"]').first();
                await folderSelect.click();
                await page.waitForTimeout(1000);
                
                // Click on "Dossier par défaut" option
                const folderOption = page.locator('[role="option"]').filter({ hasText: 'Dossier par défaut' }).first();
                if (await folderOption.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await folderOption.click();
                } else {
                    // Select first non-empty option
                    const anyOption = page.locator('[role="option"]:not(:has-text("Choisir"))').first();
                    await anyOption.click();
                }
                await page.waitForTimeout(1000);

                // Add GIFT content
                const giftEditor = page.locator('textarea').first();
                await giftEditor.waitFor({ state: 'visible', timeout: 5000 });
                await giftEditor.fill('::Q1:: What is 1+1? {=2}');
                await page.keyboard.press('Tab');
                await page.waitForTimeout(1000);

                // Save
                const saveBtn = page.locator('button').filter({ hasText: 'Enregistrer' }).first();
                await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
                await saveBtn.click();
                await page.waitForTimeout(3000);

                // Back to dashboard
                const backBtn = page.locator('button').filter({ hasText: /retour/i }).first();
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