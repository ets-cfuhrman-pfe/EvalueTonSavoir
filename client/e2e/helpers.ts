import type { Page } from '@playwright/test';

//Shared test data constants

export const STUDENT_COUNT = 3;
export const TEST_QUIZ_NAME = 'TESTQUIZ';
export const TEST_ROOM_NAME = 'TEST';
export const DEFAULT_FOLDER_NAME = 'Dossier par défaut';

/** Max chars to print when dumping raw HTML for debugging */
export const DEBUG_SNIPPET_CHARS = 1_500;

// Timeout constants (ms)

export const TIMEOUTS = {
    //  Full test budgets 
    SETUP_CHECK_WORKFLOW:         120_000,
    QUIZ_CREATE_WORKFLOW:         180_000,
    QUIZ_LAUNCH_WORKFLOW:         300_000,
    PERSISTENCE_WORKFLOW:         360_000,
    DELAYED_PERSISTENCE_WORKFLOW: 300_000,

    // Element visibility
    DASHBOARD_HEADER:  30_000,
    QUIZ_LIST:         15_000,
    ELEMENT_VISIBLE:   10_000,
    ELEMENT_OPTIONAL:   5_000,

    // Page stabilisation 
    PAGE_STABILIZE:    3_000,
    MANAGE_ROOM_LOAD:  5_000,
    ACTION_SETTLE:     2_000,   // wait after a create / delete / save to take effect

    // MUI dropdown interactions 
    DROPDOWN_ANIMATION: 1_500,
    LISTBOX_APPEAR:     5_000,
    SELECTION_REGISTER: 1_000,

    // Quiz flow timing 
    QUIZ_START:          3_000,
    QUESTION_TRANSITION: 2_000,
    QUESTION_ADVANCE:    1_500,
    FINISH_SETTLE:       1_000,

    // Student flow 
    STUDENT_JOIN_LOAD: 2_000,
    QUIZ_RESULTS:     30_000,
} as const;


// Stagger increments for simulating realistic multi-student behaviour.

export const STAGGER = {
    ANSWER_BASE:       1_000,
    ANSWER_STEP:         500,  // used in standard quiz flow
    ANSWER_STEP_SLOW:    800,  // used in persistence check flow
    JOIN_STEP:         2_000,  // delay between successive student joins
    SLOW_ANSWER_BASE:  3_000,  // base delay for the "slow student" scenario
    SLOW_ANSWER_STEP:  2_000,  // per-student increment in "slow student" scenario
} as const;

//Credential helpers 

export function getE2ECredentials(): { email: string; password: string } {
    const email = process.env.E2E_TEST_USER_EMAIL || process.env.TEST_USER_EMAIL || '';
    const password = process.env.E2E_TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || '';

    if (!email || !password) {
        throw new Error(
            'E2E credentials are not set. Provide either E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD or TEST_USER_EMAIL and TEST_USER_PASSWORD .',
        );
    }

    return { email, password };
}

export function maskedEmail(email: string) {
    // Mask the middle of the address for safer logging
    const atIndex = email.indexOf('@');

    // If the input is malformed (no '@'), avoid leaking it and return a fixed mask
    if (atIndex === -1) {
        return '***';
    }

    if (atIndex < 2) {
        return '***' + email.substring(atIndex);
    }

    return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
}

// Page action helpers

export async function loginAsTeacher(page: Page): Promise<void> {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const { email, password } = getE2ECredentials();

    const emailInput = page.getByLabel('Email').or(page.locator('input[type="email"]')).first();
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password);

    const loginButton = page
        .getByRole('button', { name: /login|se connecter/i })
        .first();
    await loginButton.click();

    await page.waitForURL(/\/dashboard|\/teacher/);
}


// Selects the first available room
 
export async function selectActiveRoom(page: Page): Promise<void> {
    // Try selectors from most to least specific
    let roomDropdown = page.locator('#room-select');
    let dropdownVisible = await roomDropdown.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!dropdownVisible) {
        roomDropdown = page.locator('[data-testid="room-select-display"]');
        dropdownVisible = await roomDropdown.isVisible({ timeout: 2_000 }).catch(() => false);
    }

    if (!dropdownVisible) {
        roomDropdown = page
            .locator('[data-testid="room-select-container"]')
            .locator('.MuiSelect-select');
        dropdownVisible = await roomDropdown.isVisible({ timeout: 2_000 }).catch(() => false);
    }

    if (!dropdownVisible) {
        roomDropdown = page.locator('.MuiSelect-select').first();
        dropdownVisible = await roomDropdown.isVisible({ timeout: 2_000 }).catch(() => false);
    }

    if (!dropdownVisible) {
        roomDropdown = page.locator('[role="combobox"]').first();
        dropdownVisible = await roomDropdown.isVisible({ timeout: 2_000 }).catch(() => false);
    }

    if (!dropdownVisible) {
        console.log('WARNING: Room dropdown not found on page!');
        return;
    }

    const dropdownText = await roomDropdown.textContent();
    console.log('Dropdown current text:', dropdownText);

    // If the dropdown already shows a real room, nothing to do
    const noRoomSelected =
        !dropdownText || /aucune/i.test(dropdownText) || dropdownText.trim() === '';
    if (!noRoomSelected) {
        console.log('Room already selected:', dropdownText);
        return;
    }

    // Open the dropdown menu
    await roomDropdown.click();
    await page.waitForTimeout(TIMEOUTS.DROPDOWN_ANIMATION);

    const listbox = page.locator('[role="listbox"]');
    const listboxVisible = await listbox
        .isVisible({ timeout: TIMEOUTS.LISTBOX_APPEAR })
        .catch(() => false);

    if (listboxVisible) {
        const options = listbox.locator('[role="option"]');
        const optionCount = await options.count();
        console.log('Number of room options:', optionCount);

        let roomFound = false;
        for (let i = 0; i < optionCount && !roomFound; i++) {
            const optionText = await options.nth(i).textContent();
            console.log(`Option ${i}: ${optionText}`);
            if (optionText && optionText.trim() === TEST_ROOM_NAME) {
                await options.nth(i).click();
                roomFound = true;
                console.log(`Selected "${TEST_ROOM_NAME}" room`);
            }
        }

        if (!roomFound && optionCount > 1) {
            // Pick the first real room
            await options.nth(1).click();
            console.log('Selected first available room');
        } else if (!roomFound) {
            console.log('WARNING: No rooms available to select!');
            await page.keyboard.press('Escape');
        }
    } else {
        console.log('Listbox did not appear – trying keyboard navigation...');
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(TIMEOUTS.SELECTION_REGISTER);
}
