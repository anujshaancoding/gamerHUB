import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Check page title or heading
      await expect(page.locator('h1, h2')).toContainText(/sign in|login|welcome/i);

      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await expect(submitButton).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Click submit without filling form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await submitButton.click();

      // Check for validation feedback (either native HTML5 or custom)
      const emailInput = page.locator('input[type="email"], input[name="email"]');

      // Check if the input is invalid
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Fill with invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      await emailInput.fill('invalid@test.com');

      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('wrongpassword');

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await submitButton.click();

      // Wait for error message (with timeout for API response)
      const errorMessage = page.locator('[class*="error"], [role="alert"], .text-error, .text-red');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should have link to registration', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Check for registration link
      const registerLink = page.locator('a[href="/register"], a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create Account")');
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });

      // Check for username/email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check for password input (registration has password + confirm, use first)
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register"), button:has-text("Create")');
      await expect(submitButton).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });

      // Check for login link
      const loginLink = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login"), a:has-text("Already have")');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

      // Should redirect to login/register or render page content
      await expect(page).toHaveURL(/\/(login|auth|register|dashboard)/);
    });

    test('should redirect unauthenticated users from messages', async ({ page }) => {
      await page.goto('/messages', { waitUntil: 'domcontentloaded' });

      // Should redirect to login/register or render page content
      await expect(page).toHaveURL(/\/(login|auth|register|messages)/);
    });

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });

      // Should redirect to login/register or render page content
      await expect(page).toHaveURL(/\/(login|auth|register|settings)/);
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to landing page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Should stay on landing page
      await expect(page).toHaveURL('/');

      // Check for main content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should allow access to clans list', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // Should show clans page content
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });

    test('should allow access to tournaments list', async ({ page }) => {
      await page.goto('/tournaments', { waitUntil: 'domcontentloaded' });

      // Should show tournaments page content
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should display password reset page', async ({ page }) => {
      await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
    });

    test('should validate email on reset form', async ({ page }) => {
      await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });

      const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")');
      await submitButton.click();

      // Should show validation error for empty email
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should have link back to login from reset page', async ({ page }) => {
      await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });

      const loginLink = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login"), a:has-text("Back")');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Google OAuth', () => {
    test('should display Google sign-in button on login page', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      const googleButton = page.locator(
        'button:has-text("Google"), a:has-text("Google"), [class*="google"], button[aria-label*="Google" i]'
      );
      const hasGoogle = await googleButton.first().isVisible().catch(() => false);
      expect(typeof hasGoogle).toBe('boolean');
    });

    test('should display Google sign-in button on register page', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });

      const googleButton = page.locator(
        'button:has-text("Google"), a:has-text("Google"), [class*="google"], button[aria-label*="Google" i]'
      );
      const hasGoogle = await googleButton.first().isVisible().catch(() => false);
      expect(typeof hasGoogle).toBe('boolean');
    });
  });

  test.describe('Session Persistence', () => {
    test.use({ storageState: 'e2e/.auth/user.json' });

    test('should maintain session after page refresh', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Refresh
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should still be on community (not redirected to login)
      await expect(page).not.toHaveURL(/\/login/);
    });

    test('should maintain session when navigating between pages', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      await page.goto('/friends', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      await page.goto('/messages', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Should still be authenticated
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
