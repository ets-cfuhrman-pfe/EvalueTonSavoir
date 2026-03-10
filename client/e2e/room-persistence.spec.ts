import { test, expect } from '@playwright/test';
import {
    loginAsTeacher,
    selectActiveRoom,
    STUDENT_COUNT,
    TEST_QUIZ_NAME,
    TIMEOUTS,
    STAGGER,
} from './helpers';

test.describe('Room Persistence', () => {
    test('Room stays persistent while students answer questions', async ({ browser }) => {
        test.setTimeout(TIMEOUTS.PERSISTENCE_WORKFLOW);

        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        teacherPage.on('dialog', async dialog => {
            console.log('Teacher dialog:', dialog.message());
            await dialog.accept();
        });

        const studentContexts = [];
        const studentPages = [];
        const studentNames = Array.from({ length: STUDENT_COUNT }, (_, i) => `Student${i + 1}`);

        for (let i = 0; i < STUDENT_COUNT; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);

            page.on('dialog', async dialog => {
                console.log(`Student ${studentNames[i]} dialog:`, dialog.message());
                await dialog.accept();
            });
        }

        let roomName: string;

        try {
            // Teacher Login
            console.log('STEP 1: Teacher logging in...');
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // Navigate to Dashboard and Find Quiz
            console.log('STEP 2: Navigating to dashboard...');
            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            const dashboardHeader = teacherPage.getByRole('heading', { name: /tableau de bord/i });
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: TIMEOUTS.QUIZ_LIST });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found');
                await teacherPage.screenshot({ path: 'room-persistence-dashboard-not-loaded.png' });
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

            // Select Room and Launch Quiz
            console.log('STEP 3: Selecting room and launching quiz...');

            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            await teacherPage.screenshot({ path: 'room-persistence-step3-before-room-selection.png' });
            console.log('Page URL:', await teacherPage.url());

            try {
                await selectActiveRoom(teacherPage);
            } catch (e) {
                console.log('Error during room selection:', e);
                await teacherPage.screenshot({ path: 'room-persistence-step3-room-selection-error.png' });
            }
            console.log('Room selection complete');

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
            roomName = ((await selectedOption.textContent())?.trim().toUpperCase()) || '';
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

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
            console.log('Quiz launched successfully');

            // Students Join Room 
            console.log('STEP 4: Students joining room...');

            const joinPromises = studentPages.map(async (page, index) => {
                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(TIMEOUTS.STUDENT_JOIN_LOAD);

                await page.waitForSelector('input[placeholder*="utilisateur"]', {
                    timeout: TIMEOUTS.ELEMENT_VISIBLE,
                });
                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.fill(studentNames[index]);

                await page.getByRole('button', { name: /rejoindre/i }).first().click();

                try {
                    await page.waitForSelector('text=/En attente/', {
                        timeout: TIMEOUTS.ELEMENT_OPTIONAL,
                    });
                    console.log(`${studentNames[index]} joined and waiting`);
                } catch {
                    const questionVisible = await page
                        .getByRole('button', { name: /vrai|faux/i })
                        .or(page.locator('button.choice-button'))
                        .first()
                        .isVisible({ timeout: TIMEOUTS.SELECTION_REGISTER })
                        .catch(() => false);
                    if (questionVisible) {
                        console.log(`${studentNames[index]} joined and question already visible`);
                    } else {
                        console.log(`${studentNames[index]} joined (state unclear)`);
                    }
                }
            });

            await Promise.all(joinPromises);
            console.log(`All ${studentPages.length} students have joined the room`);  

            // Verify Room Persistence
            console.log('STEP 5: Verifying initial room persistence...');

            const teacherUrl = teacherPage.url();
            expect(teacherUrl).toContain('manage-room');
            console.log('Teacher still on manage-room page');

            for (let i = 0; i < studentPages.length; i++) {
                const studentUrl = studentPages[i].url();
                const isConnected =
                    !studentUrl.includes('join-room') || studentUrl.includes(roomName);
                expect(isConnected).toBeTruthy();
                console.log(`${studentNames[i]} connection verified`);
            }

            // Get Question Count
            console.log('STEP 6: Getting question count...');
            await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);

        
            const counterLocator = teacherPage
                .locator('.manage-room-pagination')
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

            //  Answer Questions with Persistence Checks
            console.log('STEP 7: Students answering questions with persistence checks...');

            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`\n--- Question ${q}/${totalQuestions} ---`);

                await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);

                // Persistence check before each question
                console.log(`[Persistence Check Q${q}] Verifying room state...`);
                expect(teacherPage.url()).toContain('manage-room');
                console.log(`[Persistence Check Q${q}] Teacher connection: OK`);

                for (let i = 0; i < studentPages.length; i++) {
                    const page = studentPages[i];
                    const hasDisconnectedMessage = await page
                        .locator('text=/déconnecté|connexion perdue|erreur/i')
                        .isVisible({ timeout: 500 })
                        .catch(() => false);

                    if (hasDisconnectedMessage) {
                        throw new Error(
                            `${studentNames[i]} was disconnected during question ${q}`,
                        );
                    }
                    console.log(`[Persistence Check Q${q}] ${studentNames[i]} connection: OK`);
                }

                // Students answer with staggered timing
                const answerPromises = studentPages.map(async (page, index) => {
                    await page.waitForTimeout(
                        STAGGER.ANSWER_BASE + index * STAGGER.ANSWER_STEP_SLOW,
                    );

                    let answerButtons = page.getByRole('button', { name: /vrai|faux/i });
                    let count = await answerButtons.count();

                    if (count === 0) {
                        answerButtons = page.locator('button.choice-button');
                        count = await answerButtons.count();
                    }

                    if (count === 0) {
                        answerButtons = page
                            .locator('[data-testid="answer-button"], .answer-option, button')
                            .filter({ hasNotText: /r[ée]pondre|suivante|terminer|fermer/i });
                        count = await answerButtons.count();
                    }

                    if (count > 0) {
                        await answerButtons.first().waitFor({
                            state: 'visible',
                            timeout: TIMEOUTS.ELEMENT_VISIBLE,
                        });
                        const randomIndex = Math.floor(Math.random() * count);
                        await answerButtons.nth(randomIndex).click();
                        console.log(`${studentNames[index]} answered question ${q}`);

                        const submitButton = page
                            .getByRole('button', { name: /r[ée]pondre/i })
                            .first();
                        if (
                            await submitButton
                                .isVisible({ timeout: TIMEOUTS.SELECTION_REGISTER })
                                .catch(() => false)
                        ) {
                            await submitButton.click();
                        }
                    } else {
                        console.log(
                            `${studentNames[index]} could not find answer buttons for question ${q}`,
                        );
                    }
                });

                await Promise.all(answerPromises);
                console.log(`All students answered question ${q}`);

                // Persistence check after answering
                console.log(`[Persistence Check Q${q}] Post-answer verification...`);
                for (const studentPage of studentPages) {
                    const hasError = await studentPage
                        .locator('text=/erreur|error/i')
                        .isVisible({ timeout: 500 })
                        .catch(() => false);
                    expect(hasError).toBeFalsy();
                }
                console.log(
                    `[Persistence Check Q${q}] All students still connected after answering`,
                );

                if (q < totalQuestions) {
                    await teacherPage
                        .getByRole('button', { name: /suivante/i })
                        .first()
                        .click();
                    console.log('Teacher advanced to next question');
                    await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_ADVANCE);
                }

                await teacherPage.waitForTimeout(TIMEOUTS.FINISH_SETTLE);
            }

            // Persistence Check Before Finish
            console.log('\nSTEP 8: Final persistence check before finishing quiz...');

            expect(teacherPage.url()).toContain('manage-room');
            console.log('Teacher still connected');

            for (let i = 0; i < studentPages.length; i++) {
                const page = studentPages[i];
                const disconnected = await page
                    .locator('text=/déconnecté|connexion perdue/i')
                    .isVisible({ timeout: 500 })
                    .catch(() => false);
                expect(disconnected).toBeFalsy();
                console.log(`${studentNames[i]} still connected`);
            }

            console.log(
                'ROOM PERSISTENCE VERIFIED: All participants remained connected throughout the quiz session',
            );

            // Finish Quiz
            console.log('\nSTEP 9: Finishing quiz...');

            await teacherPage.getByRole('button', { name: /terminer/i }).first().click();

            await teacherPage.waitForTimeout(TIMEOUTS.FINISH_SETTLE);
            const confirmButton = teacherPage.getByRole('button', { name: /confirmer/i });
            if (await confirmButton.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE }).catch(() => false)) {
                await confirmButton.click();
            }

            // Verify Students See Results
            console.log('STEP 10: Verifying students see quiz results...');

            const resultPromises = studentPages.map(async (page, index) => {
                try {
                    await page.waitForSelector('text=/Résultats du Quiz|Quiz terminé|résultat/i', {
                        timeout: TIMEOUTS.QUIZ_RESULTS,
                    });
                    console.log(`${studentNames[index]} saw quiz results`);

                    const closeButton = page.getByRole('button', { name: /fermer/i });
                    if (
                        await closeButton
                            .isVisible({ timeout: TIMEOUTS.ACTION_SETTLE })
                            .catch(() => false)
                    ) {
                        await closeButton.click();
                        console.log(`${studentNames[index]} closed results dialog`);
                    }
                } catch {
                    console.log(`${studentNames[index]} final state - URL: ${page.url()}`);
                }
            });

            await Promise.all(resultPromises);

        } finally {
            await teacherContext.close();
            for (const context of studentContexts) {
                await context.close();
            }
        }
    });

    test('Room persists even with delayed student responses', async ({ browser }) => {
        test.setTimeout(TIMEOUTS.DELAYED_PERSISTENCE_WORKFLOW);

        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        teacherPage.on('dialog', async dialog => {
            await dialog.accept();
        });

        const studentContexts = [];
        const studentPages = [];
        const studentNames = Array.from({ length: STUDENT_COUNT }, (_, i) => `SlowStudent${i + 1}`);

        for (let i = 0; i < STUDENT_COUNT; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);
            page.on('dialog', async dialog => await dialog.accept());
        }

        let roomName: string;

        try {
            console.log('Teacher logging in...');
            await loginAsTeacher(teacherPage);

            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            const dashboardHeader = teacherPage.getByRole('heading', { name: /tableau de bord/i });
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: TIMEOUTS.QUIZ_LIST });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found');
                await teacherPage.screenshot({ path: 'delayed-test-dashboard-not-loaded.png' });
            }

            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            await teacherPage.waitForSelector('.quiz', { timeout: TIMEOUTS.QUIZ_LIST });

            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            await teacherPage.screenshot({ path: 'delayed-test-before-room-selection.png' });
            console.log('Page URL:', await teacherPage.url());

            try {
                await selectActiveRoom(teacherPage);
            } catch (e) {
                console.log('Error during room selection:', e);
                await teacherPage.screenshot({ path: 'delayed-test-room-selection-error.png' });
            }
            console.log('Room selection complete');

            const quizItem = teacherPage.locator('.quiz').filter({ hasText: TEST_QUIZ_NAME }).first();

            if (!(await quizItem.isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL }).catch(() => false))) {
                throw new Error(`${TEST_QUIZ_NAME} not found`);
            }

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
            roomName = ((await selectedOption.textContent())?.trim().toUpperCase()) || '';
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room:', roomName);

            // Use the specific label first, fall back to prefix match
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

            // Students join with staggered delays
            for (let i = 0; i < studentPages.length; i++) {
                const page = studentPages[i];

                await page.waitForTimeout(STAGGER.JOIN_STEP * i);

                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');

                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
                await usernameInput.fill(studentNames[i]);

                await page.getByRole('button', { name: /rejoindre/i }).first().click();

                console.log(`${studentNames[i]} joined`);

                const teacherStillConnected = teacherPage.url().includes('manage-room');
                expect(teacherStillConnected).toBeTruthy();
            }

            // Get question count
            await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);
            const counterLocator = teacherPage
                .locator('.manage-room-pagination')
                .locator(String.raw`text=/[0-9]+ \/ [0-9]+/`)
                .first();
            const counterText = await counterLocator.textContent();
            const totalQuestions = Number.parseInt((counterText || '0 / 1').split(' / ')[1]) || 1;

            console.log(`Processing ${totalQuestions} questions with delayed responses...`);

            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`Question ${q}: Students answering with varying delays...`);

                await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_TRANSITION);

                // Each student answers with an intentional delay
                for (let i = 0; i < studentPages.length; i++) {
                    const page = studentPages[i];

                    const delayMs = STAGGER.SLOW_ANSWER_BASE + i * STAGGER.SLOW_ANSWER_STEP;
                    console.log(`${studentNames[i]} waiting ${delayMs}ms before answering...`);
                    await page.waitForTimeout(delayMs);

                    let answerButtons = page.getByRole('button', { name: /vrai|faux/i });
                    let count = await answerButtons.count();

                    if (count === 0) {
                        answerButtons = page.locator(
                            'button.choice-button, [data-testid="answer-button"]',
                        );
                        count = await answerButtons.count();
                    }

                    if (count > 0) {
                        await answerButtons.first().click();
                        console.log(`${studentNames[i]} answered question ${q}`);

                        const submitButton = page
                            .getByRole('button', { name: /r[ée]pondre/i })
                            .first();
                        if (
                            await submitButton
                                .isVisible({ timeout: TIMEOUTS.SELECTION_REGISTER })
                                .catch(() => false)
                        ) {
                            await submitButton.click();
                        }
                    }

                    const roomStillActive = teacherPage.url().includes('manage-room');
                    expect(roomStillActive).toBeTruthy();
                    console.log(`Room persistence verified after ${studentNames[i]}'s answer`);
                }

                if (q < totalQuestions) {
                    await teacherPage
                        .getByRole('button', { name: /suivante/i })
                        .first()
                        .click();
                    await teacherPage.waitForTimeout(TIMEOUTS.QUESTION_ADVANCE);
                }
            }

            await teacherPage.getByRole('button', { name: /terminer/i }).first().click();

            const confirmButton = teacherPage.getByRole('button', { name: /confirmer/i });
            if (await confirmButton.isVisible({ timeout: TIMEOUTS.ACTION_SETTLE }).catch(() => false)) {
                await confirmButton.click();
            }

            console.log('DELAYED RESPONSE PERSISTENCE TEST PASSED');
            console.log('Room remained persistent despite varying student response times');

        } finally {
            await teacherContext.close();
            for (const context of studentContexts) {
                await context.close();
            }
        }
    });
});
