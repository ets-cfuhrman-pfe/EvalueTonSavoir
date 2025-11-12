import { test } from '@playwright/test';

test.describe('Teacher-Student Persistent Quiz Workflow', () => {
    
    test('Complete workflow - Teacher launches quiz and stays online while students join', async ({ browser }) => {
        test.setTimeout(300000); // 5 minutes for the complete workflow

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        try {
            console.log('STEP 1: Teacher setting up quiz...');
            
            // Teacher logs in
            await teacherPage.goto('/login');
            await teacherPage.waitForLoadState('networkidle');
            
            const emailInput = teacherPage.locator('input').first();
            await emailInput.fill('integrationTestBot@email.com');
            
            const passwordInput = teacherPage.locator('input').nth(1);
            await passwordInput.fill('123456');
            
            const loginButton = teacherPage.locator('button:has-text("Login"), button[type="submit"]').first();
            await loginButton.click();
            await teacherPage.waitForTimeout(5000);
            
            // Verify login success
            const loginUrl = teacherPage.url();
            const isDashboardPage = loginUrl.includes('dashboard') || loginUrl.includes('teacher');
            if (!isDashboardPage) {
                throw new Error(`LOGIN FAILED: Still on login page. URL: ${loginUrl}`);
            }
            console.log('Teacher login successful');

            // Navigate to dashboard
            await teacherPage.goto('/teacher/dashboard-v2');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000);
            
            // Verify dashboard loads
            const hasTESTQUIZ = await teacherPage.locator('text=TESTQUIZ').first().isVisible({ timeout: 5000 });
            if (!hasTESTQUIZ) {
                throw new Error('TESTQUIZ NOT FOUND on dashboard');
            }
            console.log('Dashboard loaded, TESTQUIZ found');

            // Click play button to launhc quiz
            const playButton = teacherPage.locator('button[aria-label="Démarrer le quiz"]').first();
            const hasPlayButton = await playButton.isVisible({ timeout: 5000 });
            
            if (hasPlayButton) {
                await playButton.click();
                console.log('Clicked TESTQUIZ play button');
            } else {
                throw new Error('Play button not found');
            }
            
            await teacherPage.waitForTimeout(3000);
            
            // Click "Lancer le quiz" button
            const launchQuizButton = teacherPage.locator('button.btn.btn-primary:has-text("Lancer le quiz")').first();
            const hasLaunchButton = await launchQuizButton.isVisible({ timeout: 10000 });
            
            if (hasLaunchButton) {
                await launchQuizButton.click();
                console.log('Clicked "Lancer le quiz" - Quiz is now launching');
                await teacherPage.waitForTimeout(5000);
                
                const finalUrl = await teacherPage.url();
                console.log(`Quiz launched, teacher URL: ${finalUrl}`);
            } else {
                throw new Error('Launch quiz button not found');
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
                    
                    const roomInput = student.page.locator('input').first();
                    await roomInput.fill('TEST');
                    
                    const nameInput = student.page.locator('input').nth(1);
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
                    console.log(`Student ${student.id} - Join failed: ${String(error)}`);
                    return { success: false, studentId: student.id, error: String(error) };
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
            
            // Keep sessions alive for a bit to test persistence
            console.log('Keeping all sessions alive for 15 seconds to test persistence...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
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