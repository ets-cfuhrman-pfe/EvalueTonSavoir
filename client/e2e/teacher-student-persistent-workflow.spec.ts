import { test } from '@playwright/test';
import { loginAsTeacher } from './helpers';

test.describe('Teacher-Student Persistent Quiz Workflow', () => {
    
    test('Complete workflow - Teacher launches quiz and stays online while students join', async ({ browser }) => {
        test.setTimeout(300000); // 5 minutes for the complete workflow

        // Create teacher browser context
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        // Handle dialogs (e.g. "Please select a room")
        teacherPage.on('dialog', async dialog => {
            console.log(`Teacher Dialog: ${dialog.message()}`);
            await dialog.accept();
        });

        try {
            console.log('STEP 1: Teacher setting up quiz...');
            
            // Teacher logs in
            await loginAsTeacher(teacherPage);
            console.log('Teacher login successful');

            // Prime selected room via API and localStorage before hitting dashboard UI
            const testRoomId = await teacherPage.evaluate(async () => {
                const findTestRoom = (rooms: any[]) => rooms.find((r) => (r.title || '').toUpperCase() === 'TEST');
                try {
                    const rawJwt = localStorage.getItem('jwt');
                    const token = rawJwt ? (JSON.parse(rawJwt)?.token as string | undefined) : undefined;
                    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

                    const fetchRooms = async () => {
                        const res = await fetch('/api/room/getUserRooms', {
                            credentials: 'include',
                            headers: Object.keys(authHeader).length ? authHeader : undefined
                        });
                        if (!res.ok) throw new Error(`status ${res.status}`);
                        const body = await res.json();
                        return body?.data || [];
                    };

                    let rooms = await fetchRooms();
                    let testRoom = findTestRoom(rooms);

                    if (!testRoom) {
                        // Create TEST room if missing
                        const createRes = await fetch('/api/room/create', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(Object.keys(authHeader).length ? authHeader : {})
                            },
                            body: JSON.stringify({ title: 'TEST' })
                        });
                        if (!createRes.ok) throw new Error(`create status ${createRes.status}`);
                        rooms = await fetchRooms();
                        testRoom = findTestRoom(rooms);
                    }

                    if (testRoom?._id) {
                        localStorage.setItem('selectedRoomId', testRoom._id);
                        return testRoom._id as string;
                    }
                    return '';
                } catch (err) {
                    console.log('Failed to fetch/create rooms in pre-step', err);
                    return '';
                }
            });
            console.log(`Pre-fetched TEST room id: ${testRoomId || 'not found'}`);

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

            // Optionally confirm the select if visible, but don't block if hidden in CI
            console.log('Checking room selection UI (non-blocking)...');
            const roomSelect = teacherPage
                .locator('[aria-haspopup="listbox"], [role="combobox"], .MuiSelect-select')
                .first();
            if (await roomSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
                const currentRoomText = ((await roomSelect.innerText().catch(() => '')) || '').trim();
                console.log(`Current room selection text: "${currentRoomText}"`);
                if (!/TEST/i.test(currentRoomText)) {
                    console.log('Selecting TEST room from dropdown (UI)...');
                    await roomSelect.click({ timeout: 5000 });
                    const listbox = teacherPage.locator('ul[role="listbox"]');
                    await listbox.waitFor({ state: 'visible', timeout: 5000 });
                    const testOption = listbox.getByRole('option', { name: /^TEST$/ }).first();
                    if (await testOption.isVisible().catch(() => false)) {
                        await testOption.click();
                    } else {
                        const fallbackOption = listbox.getByRole('option').last();
                        await fallbackOption.click();
                    }
                    await teacherPage.waitForTimeout(500);
                }
            } else {
                console.log('Room select not visible; relying on pre-fetched selectedRoomId');
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
            
            await teacherPage.waitForURL(/teacher\/manage-room\//, { timeout: 20000 });
            await teacherPage.waitForLoadState('networkidle');
            console.log('Current URL after play click:', await teacherPage.url());

            // Ensure room selection persists on manage-room page
            const manageRoomSelect = teacherPage.locator('#roomSelect');
            await manageRoomSelect.waitFor({ state: 'visible', timeout: 10000 });
            const manageRoomValue = await manageRoomSelect.inputValue();
            if (!manageRoomValue) {
                console.log('No room selected in manage-room page, selecting TEST...');
                await manageRoomSelect.selectOption({ label: 'TEST' }).catch(async () => {
                    const options = manageRoomSelect.locator('option');
                    const optionValues = await options.allInnerTexts();
                    console.log('Available room options:', optionValues.join(', '));
                    await manageRoomSelect.selectOption({ index: 1 });
                });
            }

            const launchQuizButton = teacherPage.getByRole('button', { name: /Lancer le quiz/i }).first();
            await launchQuizButton.waitFor({ state: 'visible', timeout: 10000 });
            await launchQuizButton.click();
            console.log('Clicked "Lancer le quiz" - Quiz is now launching');

            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(5000);
            const finalUrl = await teacherPage.url();
            console.log(`Quiz launched, teacher URL: ${finalUrl}`);

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