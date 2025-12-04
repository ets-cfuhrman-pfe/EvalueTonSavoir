export function getE2ECredentials(): { email: string; password: string } {
  // Prefer CI-specific E2E vars but fall back to the old TEST_USER_* names
  const email = process.env.E2E_TEST_USER_EMAIL || process.env.TEST_USER_EMAIL || '';
  const password = process.env.E2E_TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || '';

  if (!email || !password) {
    throw new Error('E2E credentials are not set. Provide E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD environment variables.');
  }

  return { email, password };
}

export function maskedEmail(email: string) {
  // Mask the middle of the address for safer logging (keeps first 2 chars and domain)
  if (email.indexOf('@') < 2) {
    return '***' + email.substring(email.indexOf('@'));
  }
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
}

export async function loginAsTeacher(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const { email, password } = getE2ECredentials();
  
  const emailInput = page.getByLabel('Email').or(page.locator('input[type="email"]')).first();
  await emailInput.fill(email);
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);
  
  const loginButton = page.locator('button:has-text("Login")').or(page.locator('button:has-text("Se connecter")')).first();
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Login') || btn.textContent?.includes('Se connecter')
    );
    return buttons.length > 0 && !buttons[0].disabled;
  }, { timeout: 5000 });
  await loginButton.click();
  
  await page.waitForURL(/\/dashboard|\/teacher/);
}
