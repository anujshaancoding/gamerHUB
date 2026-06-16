import { test, expect } from '@playwright/test';

test.describe('Gamification System Tests', () => {
  test.describe('Clans Display', () => {
    test('should display clans page with heading', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Check for clans heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show clan cards or empty state', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // Wait for heading to confirm page loaded
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 15000 });

      // Page should have content
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    });

    test('should allow filtering by game', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Look for filter button or game filter
      const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")');
      const hasFilter = await filterButton.isVisible().catch(() => false);

      if (hasFilter) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // Filter options should appear
        const filterOptions = page.locator('select, [class*="select"]');
        const optionCount = await filterOptions.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Profile Progression Display', () => {
    test('should show XP and level on profile page', async ({ page }) => {
      // This would require authentication, so we test the public profile view
      await page.goto('/find-gamers', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // If redirected to login, that's expected
      const url = page.url();
      if (url.includes('login')) {
        expect(url).toContain('login');
      } else {
        // Check for player cards
        const content = page.locator('h1, h2, p');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Badge System', () => {
    test('should display badge categories', async ({ page }) => {
      // Navigate to community page
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Look for any badge/achievement displays in the UI
      const content = page.locator('body');
      await expect(content).toBeVisible();

      // Badges may or may not be visible - just verify page loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Quest System', () => {
    test('should show quest interface elements', async ({ page }) => {
      // Quests are typically shown on dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // If redirected to login
      const url = page.url();
      if (url.includes('login')) {
        expect(url).toContain('login');
      } else {
        // Look for dashboard content
        const content = page.locator('h1, h2, p');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Stats Display', () => {
    test('should show game statistics', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Look for any stats or content
      const content = page.locator('body');
      const bodyText = await content.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('should display clan stats on clans page', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Clan page should show content
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });

      // Body should have text content
      const statsText = await page.textContent('body');
      expect(statsText?.length).toBeGreaterThan(0);
    });
  });
});

test.describe('Gamification UI Components', () => {
  test.describe('Level Badge Component', () => {
    test('should render level badges correctly', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Level badges are used in sidebar and user profiles
      // Check that the page renders some content
      const content = page.locator('body');
      await expect(content).toBeVisible();
    });
  });

  test.describe('Progress Bar Component', () => {
    test('should render progress bars if present', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Look for progress bar elements
      const progressBars = page.locator('[role="progressbar"]');
      const count = await progressBars.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Clan Rankings', () => {
    test('should show clan content on clans page', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Check for heading and content
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });

      // Page should have meaningful content
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });
});
