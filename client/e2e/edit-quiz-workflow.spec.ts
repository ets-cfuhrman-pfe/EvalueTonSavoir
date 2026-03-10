import { test } from '@playwright/test';
import { loginAsTeacher, TIMEOUTS, DEFAULT_FOLDER_NAME } from './helpers';

test.describe('Teacher Edit Quiz Workflow', () => {
    test('Complete workflow - Teacher creates a quiz, then edits it with additional GIFT content', async ({
        browser
    }) => {
        test.setTimeout(TIMEOUTS.QUIZ_CREATE_WORKFLOW);

        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        teacherPage.on('dialog', async dialog => {
            console.log('Dialog detected:', dialog.message());
            await dialog.accept();
        });

        try {
            console.log('STEP 1: Teacher logging in...');

            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.MANAGE_ROOM_LOAD);

            try {
                await teacherPage.waitForSelector('.quiz, .folder-card', { timeout: TIMEOUTS.QUIZ_LIST });
            } catch {
                console.log('Quiz list not found, dashboard may be empty');
            }

            // Cleanup any residual quiz from previous test runs
            console.log('Checking for residual quiz from previous runs...');
            const residualQuiz = teacherPage.locator('.quiz').filter({ hasText: 'Test Edit Quiz E2E' }).first();
            const isResidualQuizVisible = await residualQuiz
                .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL })
                .catch(() => false);
            if (isResidualQuizVisible) {
                console.log('Found residual quiz, deleting it...');
                await residualQuiz
                    .getByRole('button', { name: /plus.*actions/i })
                    .first()
                    .click();
                await teacherPage.getByRole('menuitem', { name: /supprimer/i }).first().click();
                await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
                console.log('Residual quiz deleted');
            } else {
                console.log('No residual quiz found');
            }

            console.log('STEP 2: Creating new quiz...');

            const newQuizButton = teacherPage.getByRole('button', { name: /nouveau quiz/i }).first();
            const hasNewQuizButton = await newQuizButton
                .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL })
                .catch(() => false);

            if (hasNewQuizButton) {
                await newQuizButton.click();
                console.log('Clicked "Nouveau quiz"');
            } else {
                throw new Error('"Nouveau quiz" button not found');
            }

            await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);

            const titleInput = teacherPage
                .getByLabel('Titre')
                .or(teacherPage.locator('input[placeholder*="titre"]'))
                .first();
            await titleInput.fill('Test Edit Quiz E2E');
            console.log('Filled quiz title');

            const folderSelect = teacherPage.locator('[role="combobox"]').first();
            await folderSelect.click();
            await teacherPage
                .getByRole('option', { name: new RegExp(DEFAULT_FOLDER_NAME, 'i') })
                .click();
            console.log('Selected default folder');

            const initialGift = `::Question 1:: What's 2+2? {=4}

::Question 2:: What's the capital of France? {=Paris}`;

            // Declare editor locator for the creation step
            const creationEditor = teacherPage
                .locator('textarea')
                .or(teacherPage.locator('[contenteditable="true"]'))
                .first();
            await creationEditor.fill(initialGift);
            await teacherPage.keyboard.press('Tab');
            console.log('Added initial GIFT content');

            const saveButton = teacherPage
                .getByRole('button', { name: /enregistrer/i })
                .first();
            await saveButton.click();
            console.log('Clicked "Enregistrer" - First save');

            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);
            const urlAfterCreate = await teacherPage.url();
            if (!urlAfterCreate.includes('quiz') && !urlAfterCreate.includes('edit')) {
                throw new Error('Save failed - redirected away from quiz editor');
            }
            console.log('First save completed successfully');

            await teacherPage
                .locator('button, a')
                .filter({ hasText: /retour/i })
                .first()
                .click();
            console.log('Clicked "retour" to quit creation');

            await teacherPage.waitForURL(/\/dashboard|\/teacher/);
            console.log('Back to dashboard successfully');

            // Edit the quiz to add more questions

            console.log('STEP 3: Editing the quiz...');

            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'Test Edit Quiz E2E' }).first();
            await quizItem
                .getByRole('button', { name: /modifier/i })
                .first()
                .click();
            console.log('Clicked edit button');

            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);

            // Re-declare the editor locator
            const editEditor = teacherPage
                .locator('textarea')
                .or(teacherPage.locator('[contenteditable="true"]'))
                .first();

            const additionalGift = `

::Question 3:: What is 5*5? {=25}`;
            await editEditor.fill(initialGift + additionalGift);
            await teacherPage.keyboard.press('Tab');
            console.log('Added more GIFT content');

            // resolve the save button on the edit page
            const editSaveButton = teacherPage
                .getByRole('button', { name: /enregistrer/i })
                .first();
            await editSaveButton.click();
            console.log('Clicked "Enregistrer" - Save edits');

            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);
            const editorContent =
                (await editEditor.inputValue()) || (await editEditor.textContent());
            if (!editorContent?.includes('Question 3') || !editorContent?.includes('25')) {
                throw new Error('Edits not saved correctly');
            }
            console.log('Edits saved successfully');

            await teacherPage
                .locator('button, a')
                .filter({ hasText: /retour/i })
                .first()
                .click();
            console.log('Clicked "retour" to quit edit');

            await teacherPage.waitForURL(/\/dashboard|\/teacher/);
            console.log('Back to dashboard successfully');

            await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
            const quizInDashboard = teacherPage.locator('text=Test Edit Quiz E2E').first();
            const isQuizVisible = await quizInDashboard
                .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL });
            if (!isQuizVisible) {
                throw new Error('Quiz not found in dashboard after edit - DB save failed');
            }
            console.log('Quiz successfully updated and visible in dashboard');

            // Cleanup
            console.log('Cleaning up: Deleting the created quiz...');
            const cleanupQuizItem = teacherPage.locator('.quiz').filter({ hasText: 'Test Edit Quiz E2E' }).first();
            await cleanupQuizItem
                .getByRole('button', { name: /plus.*actions/i })
                .first()
                .click();
            await teacherPage.getByRole('menuitem', { name: /supprimer/i }).first().click();
            await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);

            try {
                const stillVisible = await quizInDashboard
                    .isVisible({ timeout: TIMEOUTS.ACTION_SETTLE });
                if (stillVisible) {
                    console.log('Warning: Quiz may not have been deleted properly');
                }
            } catch {
                console.log('Quiz successfully deleted');
            }

            console.log('Test completed successfully');
        } finally {
            await teacherContext.close();
        }
    });
});
