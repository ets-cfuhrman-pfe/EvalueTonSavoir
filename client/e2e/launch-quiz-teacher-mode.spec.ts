import { test } from '@playwright/test';

test.describe('Teacher Launch Quiz with Students in Teacher Mode', () => {
    test('Complete workflow - Teacher launches existing quiz (TESTQUIZ), 3 students join and answer in teacher mode', async ({
        browser
    }) => {
        test.setTimeout(300000); // 5 minutes for the complex workflow

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        // Handle all confirmation dialogs
        teacherPage.on('dialog', async dialog => {
            console.log('Teacher dialog:', dialog.message());
            await dialog.accept();
        });

        // Create student contexts
        const studentContexts = [];
        const studentPages = [];
        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);

            // Handle dialogs for students
            page.on('dialog', async dialog => {
                console.log(`Student ${i + 1} dialog:`, dialog.message());
                await dialog.accept();
            });
        }

        try {
            console.log('STEP 1: Teacher logging in...');

            // Teacher logs in
            await teacherPage.goto('/login');
            await teacherPage.waitForLoadState('networkidle');
            
            const emailInput = teacherPage.getByLabel('Email').or(teacherPage.locator('input[type="email"]')).first();
            await emailInput.fill(process.env.TEST_USER_EMAIL || '');
            
            const passwordInput = teacherPage.locator('input[type="password"]').first();
            await passwordInput.fill(process.env.TEST_USER_PASSWORD || '');
            
            const loginButton = teacherPage.locator('button:has-text("Login")').or(teacherPage.locator('button:has-text("Se connecter")')).first();
            await loginButton.click();
            
            await teacherPage.waitForURL(/\/dashboard|\/teacher/);
            console.log('Teacher login successful');

            // Navigate to dashboard
            await teacherPage.goto('/teacher/dashboard-v2');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);

            // Verify TESTQUIZ exists (created by setup check)
            const hasTESTQUIZ = await teacherPage.locator('text=TESTQUIZ').first().isVisible({ timeout: 10000 });
            if (!hasTESTQUIZ) {
                throw new Error('TESTQUIZ NOT FOUND on dashboard - setup check failed');
            }
            console.log('Dashboard loaded, TESTQUIZ found');

            console.log('STEP 2: Launching quiz...');

            // Find the quiz and click "Démarrer le quiz"
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            const launchButton = quizItem.locator('button[aria-label="Démarrer le quiz"]').first();
            await launchButton.click();

            // Wait for ManageRoomV2 page
            await teacherPage.waitForURL(/\/teacher\/manage-room-v2/);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(2000);

            // Select default room (assuming it exists)
            const roomSelect = teacherPage.locator('select').first();
            await roomSelect.selectOption({ index: 1 }); // Select first room

            // Click launch
            const launchQuizButton = teacherPage.locator('button:has-text("Lancer le quiz")').first();
            await launchQuizButton.click();

            // Wait for quiz to start
            await teacherPage.waitForTimeout(3000);

            // Get room name from the page
            const roomNameElement = teacherPage.locator('text=/Salle:/').first();
            const roomNameText = await roomNameElement.textContent();
            const roomName = roomNameText?.split(':')[1]?.trim();
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            console.log('STEP 4: Students joining...');

            // Students join the room
            const joinPromises = studentPages.map(async (page, index) => {
                await page.goto(`/student/join-room-v2?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');

                // Enter username
                const usernameInput = page.locator('input[placeholder*="nom"]').first();
                await usernameInput.fill(`Student ${index + 1}`);

                // Click join
                const joinButton = page.locator('button:has-text("Rejoindre")').first();
                await joinButton.click();

                // Wait for waiting screen
                await page.waitForSelector('text=/En attente/');
                console.log(`Student ${index + 1} joined`);
            });

            await Promise.all(joinPromises);

            console.log('STEP 5: Teacher starts quiz in teacher mode...');

            // Teacher selects teacher mode and starts
            const teacherModeButton = teacherPage.locator('button:has-text("Mode enseignant")').first();
            await teacherModeButton.click();

            // Wait for quiz to start
            await teacherPage.waitForTimeout(2000);

            console.log('STEP 6: Quiz progression...');

            // Teacher advances through questions
            for (let q = 1; q <= 1; q++) {
                console.log(`Question ${q}`);

                // Wait for students to see the question
                await teacherPage.waitForTimeout(2000);

                // Students answer randomly
                const answerPromises = studentPages.map(async (page, index) => {
                    // Wait a bit before answering
                    await page.waitForTimeout(1000 + index * 500);

                    // Find answer options and click one randomly
                    const answerButtons = page.locator('button').filter({ hasText: /^[A-D]$/ });
                    const count = await answerButtons.count();
                    if (count > 0) {
                        const randomIndex = Math.floor(Math.random() * count);
                        await answerButtons.nth(randomIndex).click();
                        console.log(`Student ${index + 1} answered question ${q}`);
                    }
                });

                await Promise.all(answerPromises);

                // Teacher clicks next (except for last question)
                if (q < 5) {
                    const nextButton = teacherPage.locator('button:has-text("Suivant")').first();
                    await nextButton.click();
                    await teacherPage.waitForTimeout(1000);
                }
            }

            console.log('STEP 7: Finishing quiz...');

            // Teacher finishes quiz
            const finishButton = teacherPage.locator('button:has-text("Terminer")').first();
            await finishButton.click();

            // Confirm finish
            await teacherPage.waitForTimeout(1000);

            console.log('Test completed successfully');

        } finally {
            // Cleanup
            await teacherContext.close();
            for (const context of studentContexts) {
                await context.close();
            }
        }
    });
});