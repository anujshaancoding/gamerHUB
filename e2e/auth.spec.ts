import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

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
      await page.goto('/login');

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
      await page.goto('/login');

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
      await page.goto('/login');

      // Check for registration link
      const registerLink = page.locator('a[href="/register"], a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create Account")');
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      // Check for username/email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register"), button:has-text("Create")');
      await expect(submitButton).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/register');

      // Check for login link
      const loginLink = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login"), a:has-text("Already have")');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|auth)/);
    });

    test('should redirect unauthenticated users from messages', async ({ page }) => {
      await page.goto('/messages');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|auth)/);
    });

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/settings');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|auth)/);
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to landing page', async ({ page }) => {
      await page.goto('/');

      // Should stay on landing page
      await expect(page).toHaveURL('/');

      // Check for main content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should allow access to clans list', async ({ page }) => {
      await page.goto('/clans');

      // Should show clans page content
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });

    test('should allow access to tournaments list', async ({ page }) => {
      await page.goto('/tournaments');

      // Should show tournaments page content
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });
  });
});
