import { test } from '@playwright/test';
import { loginAsTeacher } from './helpers';

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
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // Navigate to dashboard
            await teacherPage.goto('/teacher/dashboard');
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

            // Wait for ManageRoom page
            await teacherPage.waitForURL(/\/teacher\/manage-room/);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(2000);

            // Select default room (assuming it exists)
            const roomSelect = teacherPage.locator('select').first();
            await roomSelect.selectOption({ index: 1 }); // Select first room

            // Get room name from selected option
            const selectedOption = teacherPage.locator('select option:checked');
            const roomName = (await selectedOption.textContent())?.toUpperCase();
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            // Click launch
            const launchQuizButton = teacherPage.locator('button:has-text("Lancer le quiz")').first();
            await launchQuizButton.click();

            // Wait for quiz to start
            await teacherPage.waitForTimeout(3000);

            console.log('STEP 4: Students joining...');

            // Students join the room
            const joinPromises = studentPages.map(async (page, index) => {
                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                // Enter username
                await page.waitForSelector('input[placeholder*="utilisateur"]', { timeout: 10000 });
                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.fill(`Student ${index + 1}`);

                // Click join
                const joinButton = page.locator('button:has-text("Rejoindre")').first();
                await joinButton.waitFor({ state: 'visible' });
                await page.waitForFunction(() => {
                    const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Rejoindre'));
                    return btn && !btn.disabled;
                }, { timeout: 5000 });
                await joinButton.click();

                // Wait for either waiting screen or question to appear
                try {
                    await page.waitForSelector('text=/En attente/', { timeout: 5000 });
                    console.log(`Student ${index + 1} joined and waiting`);
                } catch {
                    // If not waiting, check if question appeared
                    const questionVisible = await page.locator('button:has-text("Vrai"), button:has-text("Faux"), button:has-text("A"), button:has-text("B")').first().isVisible({ timeout: 1000 });
                    if (questionVisible) {
                        console.log(`Student ${index + 1} joined and question already visible`);
                    } else {
                        console.log(`Student ${index + 1} joined (state unclear)`);
                    }
                }
            });

            await Promise.all(joinPromises);

            console.log('STEP 5: Teacher starts quiz in teacher mode...');

            // Wait for quiz to start
            await teacherPage.waitForTimeout(2000);

            console.log('STEP 6: Quiz progression...');

            // Get total number of questions from the counter
            const counterLocator = teacherPage.locator('text=/[0-9]+ / [0-9]+/').first();
            const counterText = await counterLocator.textContent();
            if (!counterText) {
                throw new Error('Could not find question counter');
            }
            const totalQuestions = Number.parseInt(counterText.split(' / ')[1]);
            if (Number.isNaN(totalQuestions) || totalQuestions <= 0) {
                throw new Error(`Invalid question count: ${counterText}`);
            }
            console.log(`Total questions: ${totalQuestions}`);

            // Teacher advances through questions
            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`Question ${q}`);

                // Wait for students to see the question
                await teacherPage.waitForTimeout(2000);

                // Students answer randomly
                const answerPromises = studentPages.map(async (page, index) => {
                    // Wait a bit before answering
                    await page.waitForTimeout(1000 + index * 500);

                    // Find answer options and click one randomly
                    // First try True/False buttons (exact text match)
                    let answerButtons = page.locator('button:has-text("Vrai"), button:has-text("Faux")');
                    let count = await answerButtons.count();
                    
                    // If no True/False, look for multiple choice buttons with MUI classes
                    if (count === 0) {
                        answerButtons = page.locator('button.choice-button');
                        count = await answerButtons.count();
                    }
                    
                    // Fallback: any button that's not submit/navigation
                    if (count === 0) {
                        answerButtons = page.locator('button').filter({ hasNot: page.locator(':has-text("Répondre"), :has-text("Suivante"), :has-text("Terminer")') });
                        count = await answerButtons.count();
                    }
                    
                    await answerButtons.first().waitFor({ state: 'visible', timeout: 10000 });
                    if (count > 0) {
                        const randomIndex = Math.floor(Math.random() * count);
                        await answerButtons.nth(randomIndex).click();
                        console.log(`Student ${index + 1} answered question ${q}`);

                        // If there's a submit button, click it
                        const submitButton = page.locator('button:has-text("Répondre")').first();
                        if (await submitButton.isVisible({ timeout: 1000 })) {
                            await submitButton.click();
                        }
                    }
                });

                await Promise.all(answerPromises);

                // Teacher clicks next (except for last question)
                if (q < totalQuestions) {
                    const nextButton = teacherPage.locator('button:has-text("Suivante")').first();
                    await nextButton.waitFor({ state: 'visible' });
                    await teacherPage.waitForFunction(() => {
                        const btn = Array.from(document.querySelectorAll('button')).find(button => 
                            button.textContent?.includes('Suivante')
                        );
                        return btn && !btn.disabled;
                    }, { timeout: 5000 });
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

            // Wait for students to see quiz results
            const resultPromises = studentPages.map(async (page, index) => {
                await page.waitForSelector('text=Quiz terminé!', { timeout: 20000 });
                console.log(`Student ${index + 1} saw quiz results`);
            });
            await Promise.all(resultPromises);

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