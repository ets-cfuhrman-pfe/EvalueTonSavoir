import { test } from '@playwright/test';
import {
    loginAsTeacher,
    selectActiveRoom,
    STUDENT_COUNT,
    TEST_QUIZ_NAME,
    TIMEOUTS,
    STAGGER,
} from './helpers';

test.describe('Teacher Launch Quiz with Students in Teacher Mode', () => {
    test(`Complete workflow - Teacher launches existing quiz (${TEST_QUIZ_NAME}), ${STUDENT_COUNT} students join and answer in teacher mode`, async ({
        browser
    }) => {
        test.setTimeout(TIMEOUTS.QUIZ_LAUNCH_WORKFLOW);

        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        teacherPage.on('dialog', async dialog => {
            console.log('Teacher dialog:', dialog.message());
            await dialog.accept();
        });

        const studentContexts = [];
        const studentPages = [];
        for (let i = 0; i < STUDENT_COUNT; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);

            page.on('dialog', async dialog => {
                console.log(`Student ${i + 1} dialog:`, dialog.message());
                await dialog.accept();
            });
        }

        try {
            console.log('STEP 1: Teacher logging in...');

            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            const dashboardHeader = teacherPage.getByRole('heading', { name: /tableau de bord/i });
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: TIMEOUTS.QUIZ_LIST });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found, taking screenshot...');
                await teacherPage.screenshot({ path: 'step1-dashboard-not-loaded.png' });
            }

            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            let hasTESTQUIZ = false;
            try {
                await teacherPage.waitForSelector('.quiz', { timeout: TIMEOUTS.QUIZ_LIST });
                hasTESTQUIZ = await teacherPage
                    .locator('.quiz')
                    .filter({ hasText: TEST_QUIZ_NAME })
                    .first()
                    .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
            } catch {
                hasTESTQUIZ = await teacherPage
                    .locator(`text=${TEST_QUIZ_NAME}`)
                    .first()
                    .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL })
                    .catch(() => false);
            }

            if (!hasTESTQUIZ) {
                console.log('Current URL:', await teacherPage.url());
                throw new Error(`${TEST_QUIZ_NAME} NOT FOUND on dashboard - setup check failed`);
            }
            console.log(`Dashboard loaded, ${TEST_QUIZ_NAME} found`);

            console.log('STEP 2: Selecting room and launching quiz...');

            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            await teacherPage.screenshot({ path: 'step2-before-room-selection.png' });
            console.log('Page URL:', await teacherPage.url());

            try {
                await selectActiveRoom(teacherPage);
            } catch (e) {
                console.log('Error during room selection:', e);
                await teacherPage.screenshot({ path: 'step2-room-selection-error.png' });
            }
            console.log('Room selection complete');

            // Find the quiz and click the Démarrer button
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: TEST_QUIZ_NAME }).first();
            const launchButton = quizItem
                .getByRole('button', { name: /d[ée]marrer/i })
                .or(quizItem.locator('button:has(svg)'))
                .first();
            try {
                await launchButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await launchButton.click();
            } catch {
                await quizItem.locator('button').first().click();
            }

            await teacherPage.waitForURL(/\/teacher\/manage-room/);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.MANAGE_ROOM_LOAD);

            const roomSelect = teacherPage.locator('select#roomSelect, select').first();
            try {
                await roomSelect.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await roomSelect.selectOption({ index: 1 });
            } catch {
                console.log('Room select not found, trying alternative...');
            }

            const selectedOption = teacherPage.locator('select option:checked');
            const roomName = (await selectedOption.textContent())?.trim().toUpperCase();
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            // Launch the quiz
            let launchQuizButton = teacherPage
                .getByRole('button', { name: /lancer le quiz/i })
                .first();
            if (!(await launchQuizButton.isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL }).catch(() => false))) {
                launchQuizButton = teacherPage
                    .getByRole('button', { name: /^lancer/i })
                    .first();
            }
            await launchQuizButton.click();

            await teacherPage.waitForTimeout(TIMEOUTS.QUIZ_START);

            console.log('STEP 4: Students joining...');

            const joinPromises = studentPages.map(async (page, index) => {
                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(TIMEOUTS.STUDENT_JOIN_LOAD);

                await page.waitForSelector('input[placeholder*="utilisateur"]', { timeout: TIMEOUTS.ELEMENT_VISIBLE });
                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.fill(`Student ${index + 1}`);

                await page.getByRole('button', { name: /rejoindre/i }).first().click();

                try {
                    await page.waitForSelector('text=/En attente/', { timeout: TIMEOUTS.ELEMENT_OPTIONAL });
                    console.log(`Student ${index + 1} joined and waiting`);
                } catch {
                    // Check if a question is already showing (True/False or multiple-choice)
                    const questionVisible = await page
                        .getByRole('button', { name: /vrai|faux/i })
                        .or(page.locator('button.choice-button'))
                        .first()
                        .isVisible({ timeout: TIMEOUTS.SELECTION_REGISTER })
                        .catch(() => false);
                    if (questionVisible) {
                        console.log(`Student ${index + 1} joined and question already visible`);
                    } else {
                        console.log(`Student ${index + 1} joined (state unclear)`);
                    }
                }
            });

            await Promise.all(joinPromises);

            console.log('STEP 5: Teacher starts quiz in teacher mode...');
            await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);

            console.log('STEP 6: Quiz progression...');

            
            const counterLocator = teacherPage
                .locator(String.raw`text=/[0-9]+ \/ [0-9]+/`)
                .first();
            const counterText = await counterLocator.textContent();
            if (!counterText) {
                throw new Error('Could not find question counter');
            }
            const totalQuestions = Number.parseInt(counterText.split(' / ')[1]);
            if (Number.isNaN(totalQuestions) || totalQuestions <= 0) {
                throw new Error(`Invalid question count: ${counterText}`);
            }
            console.log(`Total questions: ${totalQuestions}`);

            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`Question ${q}`);

                await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);

                const answerPromises = studentPages.map(async (page, index) => {
                    await page.waitForTimeout(STAGGER.ANSWER_BASE + index * STAGGER.ANSWER_STEP);

                    // True/False questions
                    let answerButtons = page.getByRole('button', { name: /vrai|faux/i });
                    let count = await answerButtons.count();

                    // Multiple-choice questions 
                    if (count === 0) {
                        answerButtons = page.locator('button.choice-button');
                        count = await answerButtons.count();
                    }

                    // Generic fallback: any button that is not a navigation/submit button
                    if (count === 0) {
                        answerButtons = page
                            .locator('button')
                            .filter({ hasNotText: /r[ée]pondre|suivante|terminer/i });
                        count = await answerButtons.count();
                    }

                    await answerButtons.first().waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                    if (count > 0) {
                        const randomIndex = Math.floor(Math.random() * count);
                        await answerButtons.nth(randomIndex).click();
                        console.log(`Student ${index + 1} answered question ${q}`);

                        const submitButton = page
                            .getByRole('button', { name: /r[ée]pondre/i })
                            .first();
                        if (await submitButton.isVisible({ timeout: TIMEOUTS.SELECTION_REGISTER })) {
                            await submitButton.click();
                        }
                    }
                });

                await Promise.all(answerPromises);

                if (q < totalQuestions) {
                    await teacherPage
                        .getByRole('button', { name: /suivante/i })
                        .first()
                        .click();
                    await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_ADVANCE);
                }
            }

            console.log('STEP 7: Finishing quiz...');

            await teacherPage.getByRole('button', { name: /terminer/i }).first().click();

            await teacherPage.waitForTimeout(TIMEOUTS.FINISH_SETTLE);
            const confirmButton = teacherPage.getByRole('button', { name: /confirmer/i });
            if (await confirmButton.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE })) {
                await confirmButton.click();
            }

            const resultPromises = studentPages.map(async (page, index) => {
                try {
                    await page.waitForSelector('text=/Résultats du Quiz|Quiz terminé/i', {
                        timeout: TIMEOUTS.QUIZ_RESULTS,
                    });
                    console.log(`Student ${index + 1} saw quiz results dialog`);

                    const closeButton = page.getByRole('button', { name: /fermer/i });
                    if (await closeButton.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE })) {
                        await closeButton.click();
                        console.log(`Student ${index + 1} closed results dialog`);
                    }
                } catch {
                    console.log(`Student ${index + 1} final state - URL: ${page.url()}`);
                }
            });
            await Promise.all(resultPromises);

            console.log('Test completed successfully');

        } finally {
            await teacherContext.close();
            for (const context of studentContexts) {
                await context.close();
            }
        }
    });
});
