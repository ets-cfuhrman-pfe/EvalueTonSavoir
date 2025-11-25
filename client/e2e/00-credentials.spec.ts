import { test } from '@playwright/test';
import { getE2ECredentials, maskedEmail } from './helpers';

test('E2E credentials are available', async () => {
  // This test purposefully checks credentials early and fails fast with a clear message
  const { email } = getE2ECredentials();
  // Log masked email for visibility without leaking secrets
  console.log('E2E tests will run with user:', maskedEmail(email));
});
