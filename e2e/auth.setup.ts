import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '.auth', 'user.json');

function writeEmptyAuthState() {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
}

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log(
      '\n⚠️  TEST_USER_EMAIL and TEST_USER_PASSWORD env vars not set.\n' +
        '   Skipping auth setup. Authenticated tests will run without session.\n' +
        '   Usage: TEST_USER_EMAIL=you@example.com TEST_USER_PASSWORD=pass npx playwright test\n'
    );
    writeEmptyAuthState();
    return;
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Submit
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  await submitButton.click();

  // Wait for redirect (success) or timeout (failure)
  const loggedIn = await page
    .waitForURL(/\/(community|dashboard|friends|messages)/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!loggedIn) {
    console.log(
      '\n⚠️  Login failed. Check TEST_USER_EMAIL / TEST_USER_PASSWORD.\n' +
        '   Make sure the test user exists in your database.\n'
    );
    writeEmptyAuthState();
    return;
  }

  // Save authenticated session
  await page.context().storageState({ path: authFile });
  console.log('✅ Auth setup complete — session saved.');
});
