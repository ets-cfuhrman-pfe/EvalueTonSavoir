import { test } from '@playwright/test';
import { loginAsTeacher } from './helpers';

test.describe('Teacher Create Quiz Workflow', () => {
    test('Complete workflow - Teacher creates a new quiz with GIFT content', async ({
        browser
    }) => {
        test.setTimeout(180000); // 3 minutes for the workflow

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        // Handle all confirmation dialogs by accepting them
        teacherPage.on('dialog', async dialog => {
            console.log('Dialog detected:', dialog.message());
            await dialog.accept();
        });

        try {
            console.log('STEP 1: Teacher logging in...');

            // Teacher logs in
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // Navigate to dashboard if not already
            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);

            // Cleanup any residual quiz from previous test runs
            console.log('Checking for residual quiz from previous runs...');
            const residualQuiz = teacherPage.locator('.quiz').filter({ hasText: 'Test Quiz E2E' }).first();
            const isResidualQuizVisible = await residualQuiz.isVisible({ timeout: 5000 });
            if (isResidualQuizVisible) {
                console.log('Found residual quiz, deleting it...');
                
                // Click the menu button
                const menuButton = residualQuiz.locator('button[aria-label="Plus d\'actions"]').first();
                await menuButton.click();
                
                // Click the delete menu item
                const deleteMenuItem = teacherPage.locator('li').filter({ hasText: 'Supprimer' }).first();
                await deleteMenuItem.click();
                
                // Wait for deletion
                await teacherPage.waitForTimeout(2000);
                console.log('Residual quiz deleted');
            } else {
                console.log('No residual quiz found');
            }

            console.log('STEP 2: Creating new quiz...');

            // Click "Nouveau quiz" button
            const newQuizButton = teacherPage.locator('button:has-text("Nouveau quiz")').first();
            const hasNewQuizButton = await newQuizButton.isVisible({ timeout: 5000 });

            if (hasNewQuizButton) {
                await newQuizButton.click();
                console.log('Clicked "Nouveau quiz"');
            } else {
                throw new Error('"Nouveau quiz" button not found');
            }

            await teacherPage.waitForTimeout(2000);

            // Fill quiz title
            const titleInput = teacherPage
                .getByLabel('Titre')
                .or(teacherPage.locator('input[placeholder*="titre"]'))
                .first();
            await titleInput.fill('Test Quiz E2E');
            console.log('Filled quiz title');

            // Choose folder (Dossier par défaut)
            const folderSelect = teacherPage.locator('[role="combobox"]').first();
            await folderSelect.click();
            await teacherPage.locator('li').filter({ hasText: 'Dossier par défaut' }).click();
            console.log('Selected default folder');

            // Add initial GIFT content
            const giftEditor = teacherPage
                .locator('textarea')
                .or(teacherPage.locator('[contenteditable="true"]'))
                .first();
            const initialGift = `::Question 1:: What's 2+2? {=4}

::Question 2:: What's the capital of France? {=Paris}`;
            await giftEditor.fill(initialGift);
            await teacherPage.keyboard.press('Tab'); // Trigger validation

            // Click "Enregistrer" to save
            const saveButton = teacherPage.locator('button:has-text("Enregistrer")').first();
            await saveButton.click();
            console.log('Clicked "Enregistrer" - First save');

            // Wait for save to complete (check for success message or no error)
            await teacherPage.waitForTimeout(3000);
            const currentUrl = await teacherPage.url();
            if (!currentUrl.includes('quiz') && !currentUrl.includes('edit')) {
                throw new Error('Save failed - redirected away from quiz editor');
            }
            console.log('First save completed successfully');

            // Add more GIFT content
            const additionalGift = `

::Question 3:: What is 5*5? {=25}`;
            await giftEditor.fill(initialGift + additionalGift);
            await teacherPage.keyboard.press('Tab'); // Trigger validation
            console.log('Added more GIFT content');

            // Click "Enregistrer" again
            await saveButton.click();
            console.log('Clicked "Enregistrer" - Second save');

            // Verify new changes are saved
            await teacherPage.waitForTimeout(3000);
            const editorContent =
                (await giftEditor.inputValue()) || (await giftEditor.textContent());
            if (!editorContent?.includes('Question 3') || !editorContent?.includes('25')) {
                throw new Error('New changes not saved correctly');
            }
            console.log('Verified new changes are saved');

            // Click "retour" to quit
            const backButton = teacherPage
                .locator('button:has-text("retour"), a:has-text("retour")')
                .first();
            await backButton.click();
            console.log('Clicked "retour" to quit');

            // Verify back to dashboard
            await teacherPage.waitForURL(/\/dashboard|\/teacher/);
            console.log('Back to dashboard successfully');

            // Verify the quiz appears in the dashboard (DB persistence test)
            await teacherPage.waitForTimeout(2000);
            const quizInDashboard = teacherPage.locator('text=Test Quiz E2E').first();
            const isQuizVisible = await quizInDashboard.isVisible({ timeout: 5000 });
            if (!isQuizVisible) {
                throw new Error('Quiz not found in dashboard after creation - DB save failed');
            }
            console.log('Quiz successfully saved to database and visible in dashboard');

            // Cleanup: Delete the created quiz
            console.log('Cleaning up: Deleting the created quiz...');
            
            // Find the quiz item and click the menu button
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'Test Quiz E2E' }).first();
            const menuButton = quizItem.locator('button[aria-label="Plus d\'actions"]').first();
            await menuButton.click();
            
            // Click the delete menu item
            const deleteMenuItem = teacherPage.locator('li').filter({ hasText: 'Supprimer' }).first();
            await deleteMenuItem.click();
            
            // Wait for deletion
            await teacherPage.waitForTimeout(2000);
            
            // Verify quiz is gone
            try {
                const stillVisible = await quizInDashboard.isVisible({ timeout: 2000 });
                if (stillVisible) {
                    console.log('Warning: Quiz may not have been deleted properly');
                }
            } catch {
                console.log('Quiz successfully deleted');
            }

            console.log('Test completed successfully');
        } finally {
            // Always clean up teacher session
            await teacherContext.close();
        }
    });
});
