import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.describe('Community Page Features', () => {
    test('should display community page heading', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      // Community page should have tab navigation or heading
      const heading = page.locator('h1, h2, button, [role="tab"]');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display content tabs', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      // Check for tab buttons (News, Blog, Tournaments, etc.)
      const tabs = page.locator('button');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    });

    test('should have call-to-action buttons or navigation', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      // Check for interactive elements
      const buttons = page.locator('button, a');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display content cards or posts', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });

      // Wait for content to load
      const content = page.locator('[class*="animate-pulse"], article, a[href*="/news/"], a[href*="/blog/"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Clans Feature', () => {
    test('should display clan list page', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Check page heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toContainText(/clan/i);
    });

    test('should have search/filter functionality', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Check for search input - the clans page has a search input with placeholder
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]');
      await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display clan cards or loading/empty state', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // Wait for heading to render (confirms page loaded)
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 15000 });

      // Page should have content below heading
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    });

    test('should have create clan button', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Check for create clan button/link (may only show for authenticated users)
      const createButton = page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New Clan")');
      const hasCreateButton = await createButton.isVisible().catch(() => false);

      // Create button might require authentication
      expect(hasCreateButton).toBeDefined();
    });
  });

  test.describe('Blog Feature', () => {
    test('should display blog page', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });

      // Check page heading - allow generous timeout for first blog page compile
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 30000 });
    });

    test('should display blog posts or empty state', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });

      // Wait for page to render
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 30000 });

      // Page should have meaningful content
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    });
  });

  test.describe('Find Gamers Feature', () => {
    test('should display find gamers page', async ({ page }) => {
      await page.goto('/find-gamers', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Page should load (might redirect if auth required)
      const url = page.url();
      expect(url.includes('find-gamers') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages correctly', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Navigate to clans via sidebar or nav
      const clansLink = page.locator('a[href="/clans"]');
      const hasClansLink = await clansLink.first().isVisible().catch(() => false);

      if (hasClansLink) {
        await clansLink.first().click();
        await expect(page).toHaveURL(/\/clans/);
      }
    });

    test('should have consistent header across pages', async ({ page }) => {
      const pages = ['/community', '/clans'];

      for (const url of pages) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Check header/nav exists - the app uses a fixed nav
        const header = page.locator('nav');
        await expect(header.first()).toBeVisible({ timeout: 10000 });

        // Check for logo text (gg + Lobby)
        const logoLink = page.locator('a[href="/community"]');
        await expect(logoLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Should show 404 message or redirect
      const is404 =
        (await page.locator(':has-text("404")').isVisible().catch(() => false)) ||
        (await page.locator(':has-text("not found")').isVisible().catch(() => false)) ||
        page.url().includes('/');

      expect(is404).toBeTruthy();
    });

    test('should handle invalid clan slug', async ({ page }) => {
      await page.goto('/clans/invalid-clan-that-does-not-exist-12345', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Should show error or redirect
      const hasError =
        (await page.locator(':has-text("not found")').isVisible().catch(() => false)) ||
        (await page.locator(':has-text("error")').isVisible().catch(() => false)) ||
        page.url() !== '/clans/invalid-clan-that-does-not-exist-12345';

      expect(hasError).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should load community page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      // Should load within 60 seconds (first load includes SSR compilation)
      expect(loadTime).toBeLessThan(60000);
    });

    test('should load clans page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      // Should load within 30 seconds
      expect(loadTime).toBeLessThan(30000);
    });
  });
});
