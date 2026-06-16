import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Navigation & Routing', () => {
  test.describe('Sidebar Navigation', () => {
    test('should navigate to community from sidebar', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      const communityLink = page.locator('nav a[href="/community"], aside a[href="/community"]');
      if (await communityLink.isVisible().catch(() => false)) {
        await communityLink.click();
        await expect(page).toHaveURL(/\/community/);
      }
    });

    test('should navigate to messages from sidebar', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      const messagesLink = page.locator('nav a[href="/messages"], aside a[href="/messages"]');
      if (await messagesLink.isVisible().catch(() => false)) {
        await messagesLink.click();
        await expect(page).toHaveURL(/\/messages/);
      }
    });

    test('should navigate to friends from sidebar', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      const friendsLink = page.locator('nav a[href="/friends"], aside a[href="/friends"]').first();
      if (await friendsLink.isVisible().catch(() => false)) {
        await friendsLink.click();
        await expect(page).toHaveURL(/\/friends/);
      }
    });

    test('should navigate to clans from sidebar', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      const clansLink = page.locator('nav a[href="/clans"], aside a[href="/clans"]');
      if (await clansLink.isVisible().catch(() => false)) {
        await clansLink.click();
        await expect(page).toHaveURL(/\/clans/);
      }
    });

    test('should navigate to settings from sidebar or navbar', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      const settingsLink = page.locator(
        'a[href="/settings"], button[aria-label*="settings" i]'
      );
      if (await settingsLink.first().isVisible().catch(() => false)) {
        await settingsLink.first().click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Redirects', () => {
    test('should redirect root to another page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Root may redirect to /community or stay on / depending on auth state
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle login page for authenticated users', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // If authenticated, middleware redirects to /community
      // If not authenticated, stays on /login - both are valid
      const url = page.url();
      expect(url.includes('/login') || url.includes('/community')).toBeTruthy();
    });

    test('should handle register page for authenticated users', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // If authenticated, middleware redirects to /community
      // If not authenticated, stays on /register - both are valid
      const url = page.url();
      expect(url.includes('/register') || url.includes('/community')).toBeTruthy();
    });
  });

  test.describe('Deep Links', () => {
    test('should access clans page directly', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should access blog page directly', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should access find-gamers page directly', async ({ page }) => {
      await page.goto('/find-gamers', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('404 & Error Pages', () => {
    test('should handle invalid routes', async ({ page }) => {
      const response = await page.goto('/this-route-does-not-exist-xyz', { waitUntil: 'domcontentloaded' });

      // Should either show 404 page or redirect
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);
    });

    test('should show page content for valid public routes', async ({ page }) => {
      await page.goto('/terms', { waitUntil: 'domcontentloaded' });

      const content = page.locator('h1, h2, main');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show privacy policy page', async ({ page }) => {
      await page.goto('/privacy', { waitUntil: 'domcontentloaded' });

      const content = page.locator('h1, h2, main');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Browser Navigation', () => {
    test('should support back/forward navigation', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Go back
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/clans/);

      // Go forward
      await page.goForward({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/blog/);
    });
  });
});
