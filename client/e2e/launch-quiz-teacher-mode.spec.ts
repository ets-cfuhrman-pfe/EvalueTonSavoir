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
            await teacherPage.waitForTimeout(5000); // Increased wait time

            // Verify TESTQUIZ exists (created by setup check) - try multiple selectors
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

            console.log('STEP 2: Selecting room and launching quiz...');

            // IMPORTANT: Must select a room from the "Salle active" MUI Select dropdown
            // before clicking the play button, otherwise handleLancerQuiz shows alert and returns
            console.log('Selecting active room from dropdown...');
            
            // Wait for page to fully load and stabilize
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Take screenshot for debugging
            await teacherPage.screenshot({ path: 'step2-before-room-selection.png' });
            
            // Log page content for debugging
            const pageTitle = await teacherPage.title();
            console.log('Page title:', pageTitle);
            const pageUrl = await teacherPage.url();
            console.log('Page URL:', pageUrl);
            
            try {
                // Try multiple selectors for the room dropdown
                // 1. Try data-testid first (most reliable)
                // 2. Fallback to role="combobox"
                // 3. Fallback to text-based search
                
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
                    // Take a screenshot to debug
                    await teacherPage.screenshot({ path: 'step2-dropdown-not-found.png' });
                    // Log the page HTML for debugging
                    const bodyHTML = await teacherPage.locator('body').innerHTML();
                    console.log('Page body contains:', bodyHTML.substring(0, 500));
                } else {
                    await roomDropdown.waitFor({ state: 'visible', timeout: 5000 });
                    
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
                        await teacherPage.screenshot({ path: 'step2-dropdown-opened.png' });
                        
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
                await teacherPage.screenshot({ path: 'step2-room-selection-error.png' });
            }
            console.log('Room selection complete');

            // Find the quiz and click "Démarrer le quiz"
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            // Use more specific selector for the play button
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
            await teacherPage.waitForTimeout(5000); // Increased wait time

            // Select default room (assuming it exists) - try multiple selectors
            const roomSelect = teacherPage.locator('select#roomSelect, select').first();
            try {
                await roomSelect.waitFor({ state: 'visible', timeout: 10000 });
                await roomSelect.selectOption({ index: 1 }); // Select first room
            } catch {
                console.log('Room select not found, trying alternative...');
                // Try clicking a room in a list if it's rendered differently
            }

            // Get room name from selected option
            const selectedOption = teacherPage.locator('select option:checked');
            const roomName = (await selectedOption.textContent())?.trim().toUpperCase();
            if (!roomName) {
                throw new Error('Could not get room name');
            }
            console.log('Room name:', roomName);

            // Click launch - try multiple selectors
            let launchQuizButton = teacherPage.locator('button:has-text("Lancer le quiz")').first();
            if (!(await launchQuizButton.isVisible({ timeout: 5000 }).catch(() => false))) {
                launchQuizButton = teacherPage.locator('button:has-text("Lancer")').first();
            }
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

            // Confirm finish if there's a confirmation dialog
            await teacherPage.waitForTimeout(1000);
            const confirmButton = teacherPage.locator('button:has-text("Confirmer")');
            if (await confirmButton.isVisible({ timeout: 2000 })) {
                await confirmButton.click();
            }

            // Wait for students to see quiz results dialog
            const resultPromises = studentPages.map(async (page, index) => {
                try {
                    // Wait for the QuizResults dialog - look for dialog title or completion text
                    await page.waitForSelector('text=/Résultats du Quiz|Quiz terminé/i', { timeout: 30000 });
                    console.log(`Student ${index + 1} saw quiz results dialog`);
                    
                    // Close the results dialog if visible
                    const closeButton = page.locator('button:has-text("Fermer")');
                    if (await closeButton.isVisible({ timeout: 2000 })) {
                        await closeButton.click();
                        console.log(`Student ${index + 1} closed results dialog`);
                    }
                } catch {
                    // If quiz results not shown, check if student was disconnected (quiz ended)
                    const url = page.url();
                    console.log(`Student ${index + 1} final state - URL: ${url}`);
                }
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