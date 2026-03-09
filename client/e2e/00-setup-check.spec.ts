import { test } from '@playwright/test';
import {
    loginAsTeacher,
    TIMEOUTS,
    TEST_QUIZ_NAME,
    TEST_ROOM_NAME,
    DEFAULT_FOLDER_NAME,
    DEBUG_SNIPPET_CHARS,
} from './helpers';

test.describe('E2E Setup Check', () => {
    test('Ensure test prerequisites exist: user, folder, room, quiz', async ({
        browser
    }) => {
        test.setTimeout(TIMEOUTS.SETUP_CHECK_WORKFLOW);

        const context = await browser.newContext();
        const page = await context.newPage();

        page.on('dialog', async dialog => {
            console.log('Dialog:', dialog.message());
            await dialog.accept();
        });

        try {
            console.log('Checking test user...');

            await loginAsTeacher(page);
            console.log('Test user exists and login successful');

            await page.goto('/teacher/dashboard');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            // If auth expired mid-session, the goto above may redirect to /login
            const currentUrl = await page.url();
            console.log('Current URL after dashboard navigation:', currentUrl);
            if (currentUrl.includes('login')) {
                console.log('ERROR: Got redirected to login - auth may have failed, retrying...');
                await loginAsTeacher(page);
                await page.goto('/teacher/dashboard');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            // Verify the dashboard is fully rendered
            const dashboardHeader = page.getByRole('heading', { name: /tableau de bord/i });
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: TIMEOUTS.DASHBOARD_HEADER });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found, taking screenshot...');
                await page.screenshot({ path: 'setup-check-dashboard-not-loaded.png' });
                console.log('Current URL:', await page.url());
                const bodyHTML = await page.locator('body').innerHTML();
                console.log(`Page body (first ${DEBUG_SNIPPET_CHARS} chars):`, bodyHTML.substring(0, DEBUG_SNIPPET_CHARS));
            }

            // Extra wait for heavy React component renders
            await page.waitForTimeout(TIMEOUTS.MANAGE_ROOM_LOAD);

            await page.screenshot({ path: 'setup-check-dashboard-loaded.png' });

            const roomSelectContainer = page.locator('[data-testid="room-select-container"]');
            const roomSelectVisible = await roomSelectContainer
                .isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE })
                .catch(() => false);
            console.log('Room select container visible:', roomSelectVisible);

            // Check default folder

            console.log('Checking default folder...');

            let folderExists = false;
            try {
                await page.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
                folderExists = await page
                    .locator(`text=${DEFAULT_FOLDER_NAME}`)
                    .first()
                    .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL });
            } catch {
                folderExists = false;
            }

            if (!folderExists) {
                console.log('Creating default folder');

                let createFolderBtn = page.locator('[data-testid="create-folder-btn"]');
                if (!(await createFolderBtn.isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE }).catch(() => false))) {
                    console.log('data-testid not found, trying text selector...');
                    createFolderBtn = page.getByRole('button', { name: /nouveau dossier/i }).first();
                }

                if (!(await createFolderBtn.isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE }).catch(() => false))) {
                    console.log('Button not visible, trying to expand folders section...');
                    const expandBtn = page.getByRole('button', { name: /dossiers/i }).first();
                    if (await expandBtn.isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE }).catch(() => false)) {
                        await expandBtn.click();
                        await page.waitForTimeout(TIMEOUTS.SELECTION_REGISTER);
                    }
                }

                await createFolderBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await createFolderBtn.click();

                await page.waitForTimeout(TIMEOUTS.DROPDOWN_ANIMATION);

                const folderDialog = page.locator('[role="dialog"]');
                await folderDialog.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_OPTIONAL });

                await page.screenshot({ path: 'setup-check-folder-dialog.png' });

                let folderInput = folderDialog.locator('input').first();
                if (!(await folderInput.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE }).catch(() => false))) {
                    folderInput = page.getByLabel(/titre du dossier/i);
                }
                await folderInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_OPTIONAL });
                await folderInput.fill(DEFAULT_FOLDER_NAME);

                await folderDialog.getByRole('button', { name: /cr[eé]er/i }).first().click();

                await page.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
                console.log('Default folder created');
            } else {
                console.log('Default folder exists');
            }

            //Check TEST room
            console.log(`Checking ${TEST_ROOM_NAME} room`);

            await page.screenshot({ path: 'setup-check-before-room.png' });

            const roomsSectionBtn = page.getByRole('button', { name: /salles/i }).first();
            try {
                const roomsExpandedAttr = await roomsSectionBtn.getAttribute('aria-expanded');
                console.log('Rooms section expanded:', roomsExpandedAttr);
                if (roomsExpandedAttr !== 'true') {
                    await roomsSectionBtn.click();
                    await page.waitForTimeout(TIMEOUTS.DROPDOWN_ANIMATION);
                    console.log('Expanded rooms section');
                }
            } catch (e) {
                console.log('Could not check rooms section state:', e);
            }

            let testRoomExists = false;
            try {
                testRoomExists = await page
                    .locator('li')
                    .filter({ hasText: new RegExp(`^${TEST_ROOM_NAME}$`) })
                    .first()
                    .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL });
            } catch {
                testRoomExists = false;
            }
            console.log(`${TEST_ROOM_NAME} room exists:`, testRoomExists);

            if (!testRoomExists) {
                console.log(`Creating ${TEST_ROOM_NAME} room...`);

                let createRoomBtn = page.locator('[data-testid="create-room-btn"]');
                if (!(await createRoomBtn.isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE }).catch(() => false))) {
                    console.log('data-testid not found, trying text selector');
                    createRoomBtn = page.getByRole('button', { name: /nouvelle salle/i }).first();
                }
                await createRoomBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await createRoomBtn.click();
                await page.waitForTimeout(TIMEOUTS.DROPDOWN_ANIMATION);

                await page.screenshot({ path: 'setup-check-room-create-clicked.png' });

                let roomInput = page.locator('[data-testid="room-name-input"]');
                if (!(await roomInput.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE }).catch(() => false))) {
                    roomInput = page.getByPlaceholder(/nom de la salle/i).first();
                }
                await roomInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_OPTIONAL });
                await roomInput.fill(TEST_ROOM_NAME);

                await page.getByRole('button', { name: /cr[eé]er/i }).first().click();

                await page.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
                console.log(`${TEST_ROOM_NAME} room created`);
            } else {
                console.log(`${TEST_ROOM_NAME} room exists`);
            }

            // Check TESTQUIZ

            console.log(`Checking ${TEST_QUIZ_NAME}`);

            let testQuizExists = false;
            try {
                await page.waitForSelector('.quiz', { timeout: TIMEOUTS.ELEMENT_VISIBLE });
                testQuizExists = await page
                    .locator('.quiz')
                    .filter({ hasText: TEST_QUIZ_NAME })
                    .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL });
            } catch {
                testQuizExists = await page
                    .locator(`text=${TEST_QUIZ_NAME}`)
                    .first()
                    .isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE })
                    .catch(() => false);
            }

            if (!testQuizExists) {
                console.log(`Creating ${TEST_QUIZ_NAME}`);

                const newQuizBtn = page.getByRole('button', { name: /nouveau quiz/i }).first();
                await newQuizBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await newQuizBtn.click();
                await page.waitForTimeout(TIMEOUTS.QUIZ_START);
                await page.waitForLoadState('networkidle');

                const titleInput = page.getByPlaceholder(/titre/i).first();
                await titleInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_OPTIONAL });
                await titleInput.fill(TEST_QUIZ_NAME);

                // Select folder from MUI combobox
                const folderSelect = page.locator('[role="combobox"]').first();
                await folderSelect.click();
                await page.waitForTimeout(TIMEOUTS.SELECTION_REGISTER);

                const folderOption = page
                    .locator('[role="option"]')
                    .filter({ hasText: new RegExp(DEFAULT_FOLDER_NAME, 'i') })
                    .first();
                if (await folderOption.isVisible({ timeout: TIMEOUTS.PAGE_STABILIZE }).catch(() => false)) {
                    await folderOption.click();
                } else {
                    // Skip the placeholder option and pick the firstfolder
                    await page.locator('[role="option"]').nth(1).click();
                }
                await page.waitForTimeout(TIMEOUTS.SELECTION_REGISTER);

                const giftEditor = page.locator('textarea').first();
                await giftEditor.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_OPTIONAL });
                await giftEditor.fill('::Q1:: What is 1+1? {=2}');
                await page.keyboard.press('Tab');
                await page.waitForTimeout(TIMEOUTS.SELECTION_REGISTER);

                await page.getByRole('button', { name: /enregistrer/i }).first().click();
                await page.waitForTimeout(TIMEOUTS.QUIZ_START);

                await page.locator('button, a').filter({ hasText: /retour/i }).first().click();
                await page.waitForURL(/\/dashboard/);
                await page.waitForTimeout(TIMEOUTS.ACTION_SETTLE);

                console.log(`${TEST_QUIZ_NAME} created`);
            } else {
                console.log(`${TEST_QUIZ_NAME} exists`);
            }

            console.log('Setup check completed successfully');

        } finally {
            await context.close();
        }
    });
});
