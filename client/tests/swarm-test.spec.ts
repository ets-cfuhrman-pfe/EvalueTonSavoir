import { test, expect } from '@playwright/test';

test.describe('Swarm Test - 30 Fake Students', () => {
  test('Join room with 30 students', async ({ browser }) => {
    test.setTimeout(10 * 60 * 1000); // 10 minutes timeout for long-running test

    const numStudents = 30; 
    const roomName = 'TEST2';

    // Array to track disconnects
    const disconnects: string[] = [];

    // Create contexts and pages
    const contexts = [];
    const pages = [];

    for (let i = 1; i <= numStudents; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);

      // Listen to console logs for disconnects
      page.on('console', msg => {
        if (msg.text().startsWith('WS disconnect')) {
          disconnects.push(msg.text());
        }
      });
    }

    // Navigate and join for each student (in parallel for speed)
    const joinPromises = pages.map(async (page, index) => {
      const studentName = `Student${String(index + 1).padStart(2, '0')}`;

      await page.goto(`/student/join-room-v2?roomName=${roomName}`);

      // Wait for username input to be visible
      await page.waitForSelector('[data-testid="username-input"] input');

      // Fill username (use type to trigger validation)
      await page.type('[data-testid="username-input"] input', studentName);

      // Wait for join button to be enabled (room validation)
      await page.waitForSelector('[data-testid="join-button"]:not([disabled])');

      // Click join button
      await page.click('[data-testid="join-button"]');

      // Wait for connection (reduced for speed)
      await page.waitForTimeout(500);

      return page; // Return page for answering setup
    });

    await Promise.all(joinPromises);

    // Now all students have joined, start answering for all
    pages.forEach(page => {
      (async () => {
        while (true) {
          try {
            await page.waitForSelector('button:has-text("Répondre")', { timeout: 10000 });
            const choiceButtons = await page.locator('.choice-button').all();
            if (choiceButtons.length > 0) {
              const randomIndex = Math.floor(Math.random() * choiceButtons.length);
              await choiceButtons[randomIndex].click();
              await page.click('button:has-text("Répondre")');
            }
            // Wait a bit before next
            await page.waitForTimeout(1000);
          } catch {
            // No more questions or timeout, stop
            break;
          }
        }
      })();
    });

    // Wait for 1 minute to observe (reduced for testing)
    console.log('All students joined. Waiting 1 minute...');
    await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000)); // 1 minute

    // Check for disconnects
    if (disconnects.length > 0) {
      console.log('Disconnects detected:');
      disconnects.forEach(disconnect => console.log(disconnect));
    } else {
      console.log('No disconnects detected during the test period.');
    }

    // Cleanup
    await Promise.all(contexts.map(context => context.close()));

    // Assert no disconnects (or adjust based on expectations)
    expect(disconnects.length).toBe(0);
  });
});