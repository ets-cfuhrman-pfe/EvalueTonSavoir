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
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
}
