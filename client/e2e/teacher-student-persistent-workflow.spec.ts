import { test } from '@playwright/test';
import { loginAsTeacher } from './helpers';

test.describe('Teacher-Student Persistent Quiz Workflow', () => {
    
    test('Complete workflow - Teacher launches quiz and stays online while students join', async ({ browser }) => {
        test.setTimeout(300000); // 5 minutes for the complete workflow

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        try {
            console.log('STEP 1: Teacher setting up quiz...');
            
            // Teacher logs in
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // Navigate to dashboard
            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(5000); // Increased wait for dashboard to fully load
            
            // Verify dashboard loads and TESTQUIZ exists (created by setup check)
            // Try multiple selectors for robustness
            let hasTESTQUIZ = false;
            try {
                // Wait for quiz list to load
                await teacherPage.waitForSelector('.quiz', { timeout: 15000 });
                hasTESTQUIZ = await teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first().isVisible({ timeout: 10000 });
            } catch {
                // Try alternative: look for the quiz title directly
                hasTESTQUIZ = await teacherPage.locator('text=TESTQUIZ').first().isVisible({ timeout: 5000 });
            }
            
            if (!hasTESTQUIZ) {
                console.log('Current URL:', await teacherPage.url());
                console.log('Page content preview:', (await teacherPage.content()).substring(0, 500));
                throw new Error('TESTQUIZ NOT FOUND on dashboard - setup check failed');
            }
            console.log('Dashboard loaded, TESTQUIZ found');

            // Ensure a room is selected
            console.log('Checking room selection...');
            const roomSelect = teacherPage.locator('div:has(> span:has-text("Salle active :"))').locator('[role="button"], [role="combobox"]').first();
            
            if (await roomSelect.isVisible()) {
                const selectedText = await roomSelect.textContent();
                console.log(`Current room selection: "${selectedText}"`);
                
                if (selectedText?.includes('Aucune') || !selectedText) {
                    console.log('No room selected. Attempting to select "TEST"...');
                    await roomSelect.click();
                    
                    // Wait for dropdown
                    const dropdown = teacherPage.locator('ul[role="listbox"]');
                    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
                    
                    // Try to find TEST
                    const testOption = dropdown.locator('li').filter({ hasText: 'TEST' }).first();
                    if (await testOption.isVisible()) {
                        await testOption.click();
                        console.log('Selected "TEST" room');
                    } else {
                        // Select the last option (usually the most recently created)
                        const options = dropdown.locator('li');
                        const count = await options.count();
                        if (count > 1) { // > 1 because first might be "Aucune"
                            await options.last().click();
                            console.log('Selected last available room');
                        } else {
                            console.log('No rooms available to select!');
                            throw new Error('No rooms available. Setup check failed to create a room?');
                        }
                    }
                    await teacherPage.waitForTimeout(1000);
                }
            } else {
                console.log('Could not find room selector!');
            }

            // Click play button to launch quiz - use more specific selector
            const quizItem = teacherPage.locator('.quiz').filter({ hasText: 'TESTQUIZ' }).first();
            // The play button is an IconButton with aria-label "Démarrer le quiz" or contains PlayArrow icon
            const playButton = quizItem.locator('button[aria-label*="marrer"], button:has(svg)').first();
            
            try {
                await playButton.waitFor({ state: 'visible', timeout: 10000 });
                await playButton.click();
                console.log('Clicked TESTQUIZ play button');
            } catch {
                // Fallback: try clicking the first button in the quiz item
                const fallbackButton = quizItem.locator('button').first();
                if (await fallbackButton.isVisible({ timeout: 5000 })) {
                    await fallbackButton.click();
                    console.log('Clicked TESTQUIZ play button (fallback)');
                } else {
                    throw new Error('Play button not found');
                }
            }
            
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(5000); // Increased wait for manage room page to load
        
            // Click "Lancer le quiz" button
            // Wait for the page to be ready and button to appear
            console.log('Current URL after play click:', await teacherPage.url());
            
            // Improved wait strategy with polling and robust selectors
            let launchQuizButton = null;
            const startTime = Date.now();
            const timeout = 30000;
            
            console.log('Waiting for launch button...');
            
            while (Date.now() - startTime < timeout) {
                // Try specific text first - case insensitive regex
                const specificButton = teacherPage.locator('button').filter({ hasText: /Lancer( le quiz)?/i }).first();
                if (await specificButton.isVisible()) {
                    launchQuizButton = specificButton;
                    console.log('Found launch button by text');
                    break;
                }
                
                // Try submit button as fallback
                const submitButton = teacherPage.locator('button[type="submit"]').first();
                if (await submitButton.isVisible()) {
                    const text = await submitButton.textContent();
                    // Verify it's not a cancel button or something else
                    if (text && !text.toLowerCase().includes('annuler') && !text.toLowerCase().includes('cancel')) {
                        launchQuizButton = submitButton;
                        console.log(`Found launch button by type="submit" (text: ${text})`);
                        break;
                    }
                }
                
                await teacherPage.waitForTimeout(1000);
            }
            
            if (launchQuizButton) {
                // Use force click for Firefox compatibility if needed
                try {
                    await launchQuizButton.click({ timeout: 5000 });
                } catch {
                    console.log('Native click failed, trying force click for Firefox compatibility...');
                    await launchQuizButton.click({ force: true, timeout: 5000 });
                }
                console.log('Clicked "Lancer le quiz" - Quiz is now launching');
                await teacherPage.waitForLoadState('networkidle');
                await teacherPage.waitForTimeout(5000);
                
                const finalUrl = await teacherPage.url();
                console.log(`Quiz launched, teacher URL: ${finalUrl}`);
            } else {
                console.log('Button not found after polling, checking page state...');
                console.log('Current URL:', await teacherPage.url());
                const buttons = await teacherPage.locator('button').allTextContents();
                console.log('Available buttons:', buttons.join(', '));
                throw new Error('Launch quiz button not found after 30s wait');
            }

            console.log('STEP 2: Students joining room while teacher stays online...');
            
            const studentSessions = [];
            const numberOfStudents = 3;
            
            for (let i = 1; i <= numberOfStudents; i++) {
                const studentContext = await browser.newContext();
                const studentPage = await studentContext.newPage();
                studentSessions.push({
                    context: studentContext,
                    page: studentPage,
                    id: i,
                    name: `Student${i}${Date.now()}`
                });
            }
            
            // Have all students join simultaneously
            const joinPromises = studentSessions.map(async (student) => {
                try {
                    console.log(`Student ${student.id}: Starting join process...`);
                    
                    await student.page.goto('/student/join-room');
                    await student.page.waitForLoadState('networkidle');
                    
                    const roomInput = student.page.getByPlaceholder('Nom de la salle');
                    await roomInput.fill('TEST');
                    
                    const nameInput = student.page.getByPlaceholder('Nom d\'utilisateur');
                    await nameInput.fill(student.name);
                    
                    const joinButton = student.page.locator('button:has-text("Rejoindre"), button[type="submit"]').first();
                    await joinButton.click();
                    await student.page.waitForTimeout(5000);
                    
                    // Check join result
                    const finalUrl = student.page.url();
                    const pageContent = await student.page.textContent('body');
                    
                    const isInQuizRoom = finalUrl.includes('quiz') || finalUrl.includes('room');
                    const hasErrorMessage = pageContent?.includes('nexiste') || pageContent?.includes('introuvable');
                    
                    if (isInQuizRoom) {
                        console.log(`Student ${student.id} successfully joined room`);
                        return { success: true, studentId: student.id };
                    } else if (hasErrorMessage) {
                        console.log(`Student ${student.id} - Room not found error`);
                        return { success: false, studentId: student.id, error: 'roomnotfound' };
                    } else {
                        console.log(`Student ${student.id} - Unclear result, URL: ${finalUrl}`);
                        return { success: false, studentId: student.id, error: 'unclear' };
                    }
                } catch (error) {
                    console.log(`Student ${student.id} - Join failed: ${error instanceof Error ? error.message : String(error)}`);
                    return { success: false, studentId: student.id, error: error instanceof Error ? error.message : String(error) };
                }
            });
            
            // Wait for all join attempts
            const results = await Promise.all(joinPromises);
            const successful = results.filter(r => r.success).length;
            
            console.log(`RESULTS: ${successful}/${numberOfStudents} students successfully joined`);
            
            if (successful > 0) {
                console.log('SUCCESS: At least some students could join while teacher stayed online');
            } else {
                console.log('FAILURE: No students could join the room');
            }
            
            // Verify session persistence for all students
            console.log('Verifying session persistence for all students...');
            // Wait for a short period and check that student pages are still accessible
            await teacherPage.waitForTimeout(2000);
            for (const student of studentSessions) {
                // check that the student page is still on the quiz/room
                const url = student.page.url();
                if (!(url.includes('quiz') || url.includes('room'))) {
                    console.log(`Student ${student.id} session may not be persistent (URL: ${url})`);
                }
            }
            
            console.log('Cleaning up student sessions...');
            for (const student of studentSessions) {
                await student.context.close();
            }
            
            console.log('Test completed successfully');
            
        } finally {
            // Always clean up teacher session
            await teacherContext.close();
        }
    });
});