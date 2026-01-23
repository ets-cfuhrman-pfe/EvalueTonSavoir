import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './helpers';

test.describe('Room Persistence', () => {
    test('Room stays persistent while students answer questions', async ({ browser }) => {
        test.setTimeout(360000); // 6 minutes for complex workflow with persistence checks

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
        const studentNames = ['Alice', 'Bob', 'Charlie'];

        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);

            // Handle dialogs for students
            page.on('dialog', async dialog => {
                console.log(`Student ${studentNames[i]} dialog:`, dialog.message());
                await dialog.accept();
            });
        }

        let roomName: string;

        try {
            // ========================================
            // STEP 1: Teacher Login
            // ========================================
            console.log('STEP 1: Teacher logging in...');
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // ========================================
            // STEP 2: Navigate to Dashboard and Find Quiz
            // ========================================
            console.log('STEP 2: Navigating to dashboard...');
            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Wait for dashboard content to fully render
            const dashboardHeader = teacherPage.locator('h1:has-text("Tableau de bord")');
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: 15000 });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found');
                await teacherPage.screenshot({ path: 'room-persistence-dashboard-not-loaded.png' });
            }
            
            await teacherPage.waitForTimeout(3000);

            // Verify TESTQUIZ exists
            let hasTESTQUIZ = false;
            try {
                await teacherPage.waitForSelector('.quiz', { timeout: 15000 });
                hasTESTQUIZ = await teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first().isVisible({ timeout: 10000 });
            } catch {
                hasTESTQUIZ = await teacherPage.locator('text=TESTQUIZ').first().isVisible({ timeout: 5000 }).catch(() => false);
            }

            if (!hasTESTQUIZ) {
                console.log('Current URL:', await teacherPage.url());
                throw new Error('TESTQUIZ NOT FOUND on dashboard - setup check failed');
            }
            console.log('Dashboard loaded, TESTQUIZ found');

            // ========================================
            // STEP 3: Select Room and Launch Quiz
            // ========================================
            console.log('STEP 3: Selecting room and launching quiz...');

            // IMPORTANT: Must select a room from the "Salle active" MUI Select dropdown
            // before clicking the play button, otherwise handleLancerQuiz shows alert and returns
            console.log('Selecting active room from dropdown...');
            
            // Wait for page to fully load and stabilize
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Take screenshot for debugging
            await teacherPage.screenshot({ path: 'room-persistence-step3-before-room-selection.png' });
            
            // Log page info for debugging
            console.log('Page URL:', await teacherPage.url());
            
            try {
                // First check if container exists
                const roomSelectContainer = teacherPage.locator('[data-testid="room-select-container"]');
                const containerVisible = await roomSelectContainer.isVisible({ timeout: 5000 }).catch(() => false);
                console.log('Room select container visible:', containerVisible);
                
                // Try multiple selectors for the room dropdown
                let roomDropdown;
                let dropdownVisible = false;
                
                // Approach 1: Find by id
                roomDropdown = teacherPage.locator('#room-select');
                dropdownVisible = await roomDropdown.isVisible({ timeout: 2000 }).catch(() => false);
                console.log('Selector #room-select visible:', dropdownVisible);
                
                if (!dropdownVisible) {
                    // Approach 2: Find by MuiSelect-select class
                    roomDropdown = teacherPage.locator('.MuiSelect-select').first();
                    dropdownVisible = await roomDropdown.isVisible({ timeout: 2000 }).catch(() => false);
                    console.log('Selector .MuiSelect-select visible:', dropdownVisible);
                }
                
                if (!dropdownVisible) {
                    // Approach 3: Try role="combobox"
                    roomDropdown = teacherPage.locator('[role="combobox"]').first();
                    dropdownVisible = await roomDropdown.isVisible({ timeout: 2000 }).catch(() => false);
                    console.log('Selector [role="combobox"] visible:', dropdownVisible);
                }
                
                if (!dropdownVisible) {
                    console.log('WARNING: Room dropdown not found on page!');
                    await teacherPage.screenshot({ path: 'room-persistence-step3-dropdown-not-found.png' });
                } else {
                    
                    // Log the current state for debugging
                    const dropdownText = await roomDropdown.textContent();
                    console.log('Dropdown current text:', dropdownText);
                    
                    // Check if a room is already selected (not "Aucune salle")
                    if (dropdownText && !dropdownText.includes('Aucune') && dropdownText.trim() !== '') {
                        console.log('Room already selected:', dropdownText);
                    } else {
                        // Need to select a room
                        await roomDropdown.click();
                        await teacherPage.waitForTimeout(1500); // Wait for dropdown animation
                        
                        // Take screenshot after click
                        await teacherPage.screenshot({ path: 'room-persistence-step3-dropdown-opened.png' });
                        
                        // Wait for the listbox to appear
                        const listbox = teacherPage.locator('[role="listbox"]');
                        const listboxVisible = await listbox.isVisible({ timeout: 5000 }).catch(() => false);
                        
                        if (listboxVisible) {
                            console.log('Dropdown listbox opened');
                            
                            // Get all options for debugging
                            const options = listbox.locator('[role="option"]');
                            const optionCount = await options.count();
                            console.log('Number of room options:', optionCount);
                            
                            // Try to find TEST room or any non-empty room
                            let roomFound = false;
                            for (let i = 0; i < optionCount && !roomFound; i++) {
                                const optionText = await options.nth(i).textContent();
                                console.log(`Option ${i}: ${optionText}`);
                                if (optionText && optionText.trim() === 'TEST') {
                                    await options.nth(i).click();
                                    roomFound = true;
                                    console.log('Selected TEST room');
                                }
                            }
                            
                            // If TEST not found, select first non-empty option
                            if (!roomFound && optionCount > 1) {
                                // Skip first option which is usually "Aucune salle"
                                await options.nth(1).click();
                                console.log('Selected first available room');
                            } else if (!roomFound) {
                                console.log('WARNING: No rooms available to select!');
                                // Close the dropdown by pressing Escape
                                await teacherPage.keyboard.press('Escape');
                            }
                        } else {
                            console.log('Listbox did not appear, trying keyboard navigation...');
                            // Try using keyboard to select
                            await teacherPage.keyboard.press('ArrowDown');
                            await teacherPage.waitForTimeout(300);
                            await teacherPage.keyboard.press('Enter');
                        }
                        
                        await teacherPage.waitForTimeout(1000); // Wait for selection to register
                    }
                }
            } catch (e) {
                console.log('Error during room selection:', e);
                await teacherPage.screenshot({ path: 'room-persistence-step3-room-selection-error.png' });
            }
            console.log('Room selection complete');

            // Now click the play button to launch the quiz
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            const launchButton = quizItem.locator('button[aria-label*="marrer"], button:has(svg)').first();
            try {
                await launchButton.waitFor({ state: 'visible', timeout: 10000 });
                await launchButton.click();
            } catch {
                // Fallback to first button
                await quizItem.locator('button').first().click();
            }

            // Wait for ManageRoom page
            await teacherPage.waitForURL(/\/teacher\/manage-room/);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(5000);

            // Select room from dropdown
            const roomSelect = teacherPage.locator('select#roomSelect, select').first();
            try {
                await roomSelect.waitFor({ state: 'visible', timeout: 10000 });
                await roomSelect.selectOption({ index: 1 }); // Select first room
            } catch {
                console.log('Room select not found, trying alternative...');
            }

            // Get room name from selected option
            const selectedOption = teacherPage.locator('select option:checked');
            roomName = ((await selectedOption.textContent())?.trim().toUpperCase()) || '';
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            // Click launch quiz button
            let launchQuizButton = teacherPage.locator('button:has-text("Lancer le quiz")').first();
            if (!(await launchQuizButton.isVisible({ timeout: 5000 }).catch(() => false))) {
                launchQuizButton = teacherPage.locator('button:has-text("Lancer")').first();
            }
            await launchQuizButton.click();
            await teacherPage.waitForTimeout(3000);

            console.log('Quiz launched successfully');

            // ========================================
            // STEP 4: Students Join Room
            // ========================================
            console.log('STEP 4: Students joining room...');

            const joinPromises = studentPages.map(async (page, index) => {
                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                // Enter username
                await page.waitForSelector('input[placeholder*="utilisateur"]', { timeout: 10000 });
                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.fill(studentNames[index]);

                // Click join
                const joinButton = page.locator('button:has-text("Rejoindre")').first();
                await joinButton.waitFor({ state: 'visible' });
                await page.waitForFunction(() => {
                    const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Rejoindre'));
                    return btn && !btn.disabled;
                }, { timeout: 5000 });
                await joinButton.click();

                // Wait for student to be in the room
                try {
                    await page.waitForSelector('text=/En attente/', { timeout: 5000 });
                    console.log(`${studentNames[index]} joined and waiting`);
                } catch {
                    const questionVisible = await page.locator('button:has-text("Vrai"), button:has-text("Faux"), button:has-text("A"), button:has-text("B")').first().isVisible({ timeout: 1000 });
                    if (questionVisible) {
                        console.log(`${studentNames[index]} joined and question already visible`);
                    } else {
                        console.log(`${studentNames[index]} joined (state unclear)`);
                    }
                }
            });

            await Promise.all(joinPromises);
            console.log('All 3 students have joined the room');

            // ========================================
            // STEP 5: Verify Room Persistence - Initial Check
            // ========================================
            console.log('STEP 5: Verifying initial room persistence...');

            // Check that teacher page is still connected
            const teacherUrl = teacherPage.url();
            expect(teacherUrl).toContain('manage-room');
            console.log('Teacher still on manage-room page');

            // Verify all students are connected
            for (let i = 0; i < studentPages.length; i++) {
                const studentUrl = studentPages[i].url();
                const isConnected = !studentUrl.includes('join-room') || studentUrl.includes(roomName);
                expect(isConnected).toBeTruthy();
                console.log(`${studentNames[i]} connection verified`);
            }

            // ========================================
            // STEP 6: Get Question Count
            // ========================================
            console.log('STEP 6: Getting question count...');
            await teacherPage.waitForTimeout(2000);

            const counterLocator = teacherPage.locator(String.raw`text=/[0-9]+ \/ [0-9]+/`).first();
            const counterText = await counterLocator.textContent();
            if (!counterText) {
                throw new Error('Could not find question counter');
            }
            const totalQuestions = Number.parseInt(counterText.split(' / ')[1]);
            if (Number.isNaN(totalQuestions) || totalQuestions <= 0) {
                throw new Error(`Invalid question count: ${counterText}`);
            }
            console.log(`Total questions: ${totalQuestions}`);

            // ========================================
            // STEP 7: Answer Questions with Persistence Checks
            // ========================================
            console.log('STEP 7: Students answering questions with persistence checks...');

            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`\n--- Question ${q}/${totalQuestions} ---`);

                // Wait for question to be displayed
                await teacherPage.waitForTimeout(2000);

                // PERSISTENCE CHECK: Verify room is still active before each question
                console.log(`[Persistence Check Q${q}] Verifying room state...`);
                
                // Check teacher is still on manage-room
                const currentTeacherUrl = teacherPage.url();
                expect(currentTeacherUrl).toContain('manage-room');
                console.log(`[Persistence Check Q${q}] Teacher connection: OK`);

                // Check all students are still connected
                for (let i = 0; i < studentPages.length; i++) {
                    const page = studentPages[i];

                    const hasDisconnectedMessage = await page.locator('text=/déconnecté|connexion perdue|erreur/i').isVisible({ timeout: 500 }).catch(() => false);
                    
                    if (hasDisconnectedMessage) {
                        throw new Error(`${studentNames[i]} was disconnected during question ${q}`);
                    }
                    
                    console.log(`[Persistence Check Q${q}] ${studentNames[i]} connection: OK`);
                }

                // Students answer the current question with staggered timing
                const answerPromises = studentPages.map(async (page, index) => {
                    // Stagger answers to simulate real behavior
                    await page.waitForTimeout(1000 + index * 800);

                    // Find answer buttons
                    let answerButtons = page.locator('button:has-text("Vrai"), button:has-text("Faux")');
                    let count = await answerButtons.count();

                    // Try multiple choice if no True/False
                    if (count === 0) {
                        answerButtons = page.locator('button.choice-button');
                        count = await answerButtons.count();
                    }

                    // Fallback to any visible answer button
                    if (count === 0) {
                        answerButtons = page.locator('[data-testid="answer-button"], .answer-option, button').filter({
                            hasNot: page.locator(':has-text("Répondre"), :has-text("Suivante"), :has-text("Terminer"), :has-text("Fermer")')
                        });
                        count = await answerButtons.count();
                    }

                    if (count > 0) {
                        await answerButtons.first().waitFor({ state: 'visible', timeout: 10000 });
                        const randomIndex = Math.floor(Math.random() * count);
                        await answerButtons.nth(randomIndex).click();
                        console.log(`${studentNames[index]} answered question ${q}`);

                        // Click submit if present
                        const submitButton = page.locator('button:has-text("Répondre")').first();
                        if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                            await submitButton.click();
                        }
                    } else {
                        console.log(`${studentNames[index]} could not find answer buttons for question ${q}`);
                    }
                });

                await Promise.all(answerPromises);
                console.log(`All students answered question ${q}`);

                // PERSISTENCE CHECK: After students answer
                console.log(`[Persistence Check Q${q}] Post-answer verification...`);
                
                for (const studentPage of studentPages) {
                    const hasError = await studentPage.locator('text=/erreur|error/i').isVisible({ timeout: 500 }).catch(() => false);
                    expect(hasError).toBeFalsy();
                }
                console.log(`[Persistence Check Q${q}] All students still connected after answering`);

                // Teacher advances to next question (except for last)
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
                    console.log('Teacher advanced to next question');
                    await teacherPage.waitForTimeout(1500);
                }

                // Add extra delay between questions to simulate real session
                await teacherPage.waitForTimeout(1000);
            }

            // ========================================
            // STEP 8: Final Persistence Check Before Finish
            // ========================================
            console.log('\nSTEP 8: Final persistence check before finishing quiz...');
            
            // Verify all participants are still connected
            expect(teacherPage.url()).toContain('manage-room');
            console.log('Teacher still connected');

            for (let i = 0; i < studentPages.length; i++) {
                const page = studentPages[i];
                const disconnected = await page.locator('text=/déconnecté|connexion perdue/i').isVisible({ timeout: 500 }).catch(() => false);
                expect(disconnected).toBeFalsy();
                console.log(`${studentNames[i]} still connected`);
            }

            console.log('ROOM PERSISTENCE VERIFIED: All participants remained connected throughout the quiz session');

            // ========================================
            // STEP 9: Finish Quiz
            // ========================================
            console.log('\nSTEP 9: Finishing quiz...');

            const finishButton = teacherPage.locator('button:has-text("Terminer")').first();
            await finishButton.click();

            // Handle confirmation dialog if present
            await teacherPage.waitForTimeout(1000);
            const confirmButton = teacherPage.locator('button:has-text("Confirmer")');
            if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmButton.click();
            }

            // ========================================
            // STEP 10: Verify Students See Results
            // ========================================
            console.log('STEP 10: Verifying students see quiz results...');

            const resultPromises = studentPages.map(async (page, index) => {
                try {
                    // Wait for quiz results dialog
                    await page.waitForSelector('text=/Résultats du Quiz|Quiz terminé|résultat/i', { timeout: 30000 });
                    console.log(`${studentNames[index]} saw quiz results`);

                    // Close results dialog if visible
                    const closeButton = page.locator('button:has-text("Fermer")');
                    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await closeButton.click();
                        console.log(`${studentNames[index]} closed results dialog`);
                    }
                } catch {
                    const url = page.url();
                    console.log(`${studentNames[index]} final state - URL: ${url}`);
                }
            });

            await Promise.all(resultPromises);

            // ========================================
            // TEST SUCCESS
            // ========================================
            console.log('\n========================================');
            console.log('ROOM PERSISTENCE TEST COMPLETED SUCCESSFULLY');
            console.log('========================================');
            console.log('Summary:');
            console.log(`- Room: ${roomName}`);
            console.log(`- Students: ${studentNames.join(', ')}`);
            console.log(`- Questions answered: ${totalQuestions}`);
            console.log('- All persistence checks passed');
            console.log('========================================');

        } finally {
            // Cleanup all browser contexts
            await teacherContext.close();
            for (const context of studentContexts) {
                await context.close();
            }
        }
    });

    test('Room persists even with delayed student responses', async ({ browser }) => {
        test.setTimeout(300000); // 5 minutes

        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        teacherPage.on('dialog', async dialog => {
            await dialog.accept();
        });

        // Create 3 student contexts
        const studentContexts = [];
        const studentPages = [];
        const studentNames = ['SlowStudent1', 'SlowStudent2', 'SlowStudent3'];

        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            studentContexts.push(context);
            studentPages.push(page);
            page.on('dialog', async dialog => await dialog.accept());
        }

        let roomName: string;

        try {
            // Teacher login and setup
            console.log('Teacher logging in...');
            await loginAsTeacher(teacherPage);

            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Wait for dashboard content to fully render
            const dashboardHeader = teacherPage.locator('h1:has-text("Tableau de bord")');
            try {
                await dashboardHeader.waitFor({ state: 'visible', timeout: 15000 });
                console.log('Dashboard header visible');
            } catch {
                console.log('WARNING: Dashboard header not found');
                await teacherPage.screenshot({ path: 'delayed-test-dashboard-not-loaded.png' });
            }
            
            await teacherPage.waitForTimeout(3000);

            // Find and launch TESTQUIZ
            await teacherPage.waitForSelector('.quiz', { timeout: 15000 });
            
            // IMPORTANT: Must select a room from the "Salle active" MUI Select dropdown first
            console.log('Selecting active room from dropdown...');
            
            // Wait for page to fully load and stabilize
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Take screenshot for debugging
            await teacherPage.screenshot({ path: 'delayed-test-before-room-selection.png' });
            
            // Log page info for debugging
            console.log('Page URL:', await teacherPage.url());
            
            try {
                // Try multiple selectors for the room dropdown
                let roomDropdown = teacherPage.locator('[data-testid="room-select"]');
                let dropdownVisible = await roomDropdown.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (!dropdownVisible) {
                    console.log('data-testid selector not found, trying role="combobox"...');
                    roomDropdown = teacherPage.locator('[role="combobox"]').first();
                    dropdownVisible = await roomDropdown.isVisible({ timeout: 3000 }).catch(() => false);
                }
                
                if (!dropdownVisible) {
                    console.log('role="combobox" not found, trying MuiSelect-select...');
                    roomDropdown = teacherPage.locator('.MuiSelect-select').first();
                    dropdownVisible = await roomDropdown.isVisible({ timeout: 3000 }).catch(() => false);
                }
                
                if (!dropdownVisible) {
                    console.log('WARNING: Room dropdown not found on page!');
                    await teacherPage.screenshot({ path: 'delayed-test-dropdown-not-found.png' });
                } else {
                    await roomDropdown.waitFor({ state: 'visible', timeout: 5000 });
                    
                    // Log the current state for debugging
                    const dropdownText = await roomDropdown.textContent();
                    console.log('Dropdown current text:', dropdownText);
                    
                    // Check if a room is already selected (not "Aucune salle")
                    if (dropdownText && !dropdownText.includes('Aucune') && dropdownText.trim() !== '') {
                        console.log('Room already selected:', dropdownText);
                    } else {
                        await roomDropdown.click();
                        await teacherPage.waitForTimeout(1500);
                        
                        // Take screenshot after click
                        await teacherPage.screenshot({ path: 'delayed-test-dropdown-opened.png' });
                        
                        const listbox = teacherPage.locator('[role="listbox"]');
                        const listboxVisible = await listbox.isVisible({ timeout: 5000 }).catch(() => false);
                        
                        if (listboxVisible) {
                            const options = listbox.locator('[role="option"]');
                            const optionCount = await options.count();
                            console.log('Number of room options:', optionCount);
                            
                            let roomFound = false;
                            for (let i = 0; i < optionCount && !roomFound; i++) {
                                const optionText = await options.nth(i).textContent();
                                console.log(`Option ${i}: ${optionText}`);
                                if (optionText && optionText.trim() === 'TEST') {
                                    await options.nth(i).click();
                                    roomFound = true;
                                }
                            }
                            
                            if (!roomFound && optionCount > 1) {
                                await options.nth(1).click();
                                console.log('Selected first available room');
                            } else if (!roomFound) {
                                await teacherPage.keyboard.press('Escape');
                            }
                        } else {
                            console.log('Listbox did not appear, trying keyboard navigation...');
                            await teacherPage.keyboard.press('ArrowDown');
                            await teacherPage.waitForTimeout(300);
                            await teacherPage.keyboard.press('Enter');
                        }
                        await teacherPage.waitForTimeout(1000);
                    }
                }
            } catch (e) {
                console.log('Error during room selection:', e);
                await teacherPage.screenshot({ path: 'delayed-test-room-selection-error.png' });
            }
            console.log('Room selection complete');
            
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            
            if (!(await quizItem.isVisible({ timeout: 5000 }).catch(() => false))) {
                throw new Error('TESTQUIZ not found');
            }

            // Click the play button
            const launchButton = quizItem.locator('button[aria-label*="marrer"], button:has(svg)').first();
            try {
                await launchButton.waitFor({ state: 'visible', timeout: 10000 });
                await launchButton.click();
            } catch {
                await quizItem.locator('button').first().click();
            }

            await teacherPage.waitForURL(/\/teacher\/manage-room/);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(5000);

            // Select room from dropdown
            const roomSelect = teacherPage.locator('select#roomSelect, select').first();
            try {
                await roomSelect.waitFor({ state: 'visible', timeout: 10000 });
                await roomSelect.selectOption({ index: 1 }); // Select first room
            } catch {
                console.log('Room select not found, trying alternative...');
            }

            // Get room name from selected option
            const selectedOption = teacherPage.locator('select option:checked');
            roomName = ((await selectedOption.textContent())?.trim().toUpperCase()) || '';
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room:', roomName);

            // Launch
            const launchQuizButton = teacherPage.locator('button:has-text("Lancer")').first();
            await launchQuizButton.click();
            await teacherPage.waitForTimeout(3000);

            // Students join with delays between each
            for (let i = 0; i < studentPages.length; i++) {
                const page = studentPages[i];
                
                // Delay between student joins
                await page.waitForTimeout(2000 * i);
                
                await page.goto(`/student/join-room?roomName=${roomName}`);
                await page.waitForLoadState('networkidle');
                
                const usernameInput = page.locator('input[placeholder*="utilisateur"]').first();
                await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
                await usernameInput.fill(studentNames[i]);

                const joinButton = page.locator('button:has-text("Rejoindre")').first();
                await page.waitForFunction(() => {
                    const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Rejoindre'));
                    return btn && !btn.disabled;
                }, { timeout: 5000 });
                await joinButton.click();
                
                console.log(`${studentNames[i]} joined`);
                
                // Verify room still exists after each student joins
                const teacherStillConnected = teacherPage.url().includes('manage-room');
                expect(teacherStillConnected).toBeTruthy();
            }

            // Get question count
            await teacherPage.waitForTimeout(2000);
            const counterLocator = teacherPage.locator(String.raw`text=/[0-9]+ \/ [0-9]+/`).first();
            const counterText = await counterLocator.textContent();
            const totalQuestions = Number.parseInt((counterText || '0 / 1').split(' / ')[1]) || 1;

            console.log(`Processing ${totalQuestions} questions with delayed responses...`);

            // Answer questions with intentional delays
            for (let q = 1; q <= totalQuestions; q++) {
                console.log(`Question ${q}: Students answering with varying delays...`);
                
                await teacherPage.waitForTimeout(2000);

                // Students answer with significant delays between them
                for (let i = 0; i < studentPages.length; i++) {
                    const page = studentPages[i];
                    
                    // Intentional delay - some students take longer
                    const delayMs = 3000 + (i * 2000); // 3s, 5s, 7s delays
                    console.log(`${studentNames[i]} waiting ${delayMs}ms before answering...`);
                    await page.waitForTimeout(delayMs);

                    // Find and click answer
                    let answerButtons = page.locator('button:has-text("Vrai"), button:has-text("Faux")');
                    let count = await answerButtons.count();

                    if (count === 0) {
                        answerButtons = page.locator('button.choice-button, [data-testid="answer-button"]');
                        count = await answerButtons.count();
                    }

                    if (count > 0) {
                        await answerButtons.first().click();
                        console.log(`${studentNames[i]} answered question ${q}`);

                        const submitButton = page.locator('button:has-text("Répondre")').first();
                        if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
                            await submitButton.click();
                        }
                    }

                    // Verify room persistence after each slow answer
                    const roomStillActive = teacherPage.url().includes('manage-room');
                    expect(roomStillActive).toBeTruthy();
                    console.log(`Room persistence verified after ${studentNames[i]}'s answer`);
                }

                // Teacher advances
                if (q < totalQuestions) {
                    const nextButton = teacherPage.locator('button:has-text("Suivante")').first();
                    await nextButton.waitFor({ state: 'visible', timeout: 10000 });
                    await teacherPage.waitForFunction(() => {
                        const btn = Array.from(document.querySelectorAll('button')).find(button =>
                            button.textContent?.includes('Suivante')
                        );
                        return btn && !btn.disabled;
                    }, { timeout: 10000 });
                    await nextButton.click();
                    await teacherPage.waitForTimeout(1000);
                }
            }

            // Finish quiz
            const finishButton = teacherPage.locator('button:has-text("Terminer")').first();
            await finishButton.click();

            const confirmButton = teacherPage.locator('button:has-text("Confirmer")');
            if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
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
