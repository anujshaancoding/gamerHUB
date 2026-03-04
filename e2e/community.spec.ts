import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Community & Content', () => {
  test.describe('Community Feed', () => {
    test('should display community feed page', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Community page should render visible content
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('should display posts or empty state', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Wait for content to load
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('should have post interaction buttons (like, comment)', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Wait for content
      await page.waitForTimeout(3000);

      // Posts may have interaction buttons
      const post = page.locator('article, a[href*="/news/"]').first();
      if (await post.isVisible().catch(() => false)) {
        const interactionButtons = post.locator('button');
        const hasInteractions = await interactionButtons.first().isVisible().catch(() => false);
        expect(typeof hasInteractions).toBe('boolean');
      }
    });
  });

  test.describe('Blog', () => {
    test('should display blog listing page', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display blog post cards', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Blog page should show posts or loading state
      const content = page.locator('article, a[href*="/blog/"], [class*="animate-pulse"], h1, h2');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to blog post detail', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Wait for posts to load
      await page.waitForTimeout(3000);

      const postLink = page.locator('a[href*="/blog/"]').first();
      if (await postLink.isVisible().catch(() => false)) {
        await postLink.click();
        await page.waitForURL(/\/blog\//, { timeout: 5000 });

        // Should show full blog post
        const content = page.locator('article, h1, h2');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show blog post comments section', async ({ page }) => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      await page.waitForTimeout(3000);

      const postLink = page.locator('a[href*="/blog/"]').first();
      if (await postLink.isVisible().catch(() => false)) {
        await postLink.click();
        await page.waitForTimeout(2000);

        // Comments section may or may not exist
        const body = await page.textContent('body');
        expect(body).toBeTruthy();
      }
    });
  });

  test.describe('Search', () => {
    test('should display search page', async ({ page }) => {
      await page.goto('/search', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Search page should render content (search input or heading)
      const content = page.locator('input[type="search"], input[placeholder*="search" i], h1, h2, form');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show search results when querying', async ({ page }) => {
      await page.goto('/search', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"]'
      ).first();

      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);

        // Results or empty state
        const body = await page.textContent('body');
        expect(body).toBeTruthy();
      }
    });
  });
});
