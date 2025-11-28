import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './helpers';

test.describe('Room Lifecycle - Start, Join, End, Redirect', () => {
    test('Teacher starts quiz, student joins, teacher ends quiz, both redirected', async ({
        browser
    }) => {
        test.setTimeout(60000); 

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        // Create student browser context
        const studentContext = await browser.newContext();
        const studentPage = await studentContext.newPage();

        try {
            console.log('STEP 1: Teacher logging in...');
            await loginAsTeacher(teacherPage);

            // Navigate to dashboard
            await teacherPage.goto('/teacher/dashboard-v2');
            await teacherPage.waitForLoadState('networkidle');

            // Verify TESTQUIZ exists
            const hasTESTQUIZ = await teacherPage.locator('text=TESTQUIZ').first().isVisible({ timeout: 10000 });
            if (!hasTESTQUIZ) {
                throw new Error('TESTQUIZ NOT FOUND on dashboard');
            }

            console.log('STEP 2: Launching quiz...');
            // Find the quiz and click "Démarrer le quiz"
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            const launchButton = quizItem.locator('button[aria-label="Démarrer le quiz"]').first();
            
            // Ensure button is ready and click with force to avoid overlay issues
            await launchButton.waitFor({ state: 'visible', timeout: 10000 });
            await launchButton.click({ force: true });

            // Wait for ManageRoomV2 page
            await teacherPage.waitForURL(/\/teacher\/manage-room-v2/);
            await teacherPage.waitForLoadState('networkidle');

            // Select default room
            const roomSelect = teacherPage.locator('select').first();
            await roomSelect.selectOption({ index: 1 }); // Select first room

            // Get room name
            const selectedOption = teacherPage.locator('select option:checked');
            const roomName = (await selectedOption.textContent())?.toUpperCase();
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            // Click launch
            const launchQuizButton = teacherPage.locator('button:has-text("Lancer le quiz")').first();
            await launchQuizButton.click();

            // Wait for quiz to start (teacher view)
            // "Masquer les questions" is shown when showQuestions is true (default)
            await teacherPage.waitForSelector('text=Masquer les questions', { timeout: 30000 });
            console.log('Quiz started for teacher');

            console.log('STEP 3: Student joining...');
            await studentPage.goto(`/student/join-room-v2?roomName=${roomName}`);
            
            // Enter username
            const usernameInput = studentPage.locator('input[placeholder*="utilisateur"]').first();
            await usernameInput.fill('LifecycleStudent');

            // Click join
            const joinButton = studentPage.locator('button:has-text("Rejoindre")').first();
            await joinButton.click();

            // Verify student is in the room (waiting or seeing question)
            await Promise.race([
                studentPage.waitForSelector('text=En attente', { timeout: 30000 }),
                studentPage.waitForSelector('.question-display', { timeout: 30000 }),
                studentPage.waitForSelector('text=Vrai', { timeout: 30000 }),
                studentPage.waitForSelector('text=Faux', { timeout: 30000 })
            ]);
            console.log('Student joined successfully');

            console.log('STEP 4: Teacher ending quiz...');
            // Teacher clicks "Terminer le quiz"
            const finishButton = teacherPage.locator('button:has-text("Terminer le quiz")').first();
            await finishButton.click();

            // Confirm dialog
            const confirmButton = teacherPage.locator('button:has-text("Confirmer")').first();
            if (await confirmButton.isVisible()) {
                 await confirmButton.click();
            } else {
                await teacherPage.locator('text=Êtes-vous sûr de vouloir terminer le quiz').waitFor();
                await teacherPage.getByRole('button', { name: 'Confirmer' }).click();
            }

            console.log('STEP 5: Verifying redirections...');

            // Verify teacher redirection
            await teacherPage.waitForURL(/\/teacher\/dashboard-v2/, { timeout: 10000 });
            console.log('Teacher redirected to dashboard');

            // Verify student redirection
            // The student should be kicked to /student/join-room-v2
            await studentPage.waitForURL(/\/student\/join-room-v2/, { timeout: 10000 });
            
            // Verify student sees the join form again (e.g. "Rejoindre une salle")
            await expect(studentPage.locator('text=Rejoindre une salle').first()).toBeVisible();
            console.log('Student redirected to join page');

        } finally {
            await teacherContext.close();
            await studentContext.close();
        }
    });
});
