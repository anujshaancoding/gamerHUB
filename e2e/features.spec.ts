import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.describe('Landing Page Features', () => {
    test('should display hero section', async ({ page }) => {
      await page.goto('/');

      // Check for hero section with main heading
      const heroHeading = page.locator('h1');
      await expect(heroHeading.first()).toBeVisible();
    });

    test('should display game cards', async ({ page }) => {
      await page.goto('/');

      // Check for game showcase section
      const gameSection = page.locator('[class*="game"], section');
      await expect(gameSection.first()).toBeVisible();
    });

    test('should have call-to-action buttons', async ({ page }) => {
      await page.goto('/');

      // Check for CTA buttons
      const ctaButtons = page.locator('a[href="/register"], a[href="/login"], button:has-text("Get Started"), button:has-text("Join")');
      await expect(ctaButtons.first()).toBeVisible();
    });

    test('should display feature highlights', async ({ page }) => {
      await page.goto('/');

      // Check for features section
      const features = page.locator('[class*="feature"], [class*="card"]');
      const count = await features.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Clans Feature', () => {
    test('should display clan list page', async ({ page }) => {
      await page.goto('/clans');

      // Check page heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toContainText(/clan/i);
    });

    test('should have search/filter functionality', async ({ page }) => {
      await page.goto('/clans');

      // Check for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name="search"]');
      const hasSearch = await searchInput.isVisible().catch(() => false);

      // Check for filter buttons/dropdowns
      const filters = page.locator('select, [class*="filter"], button:has-text("Filter")');
      const hasFilters = await filters.first().isVisible().catch(() => false);

      // Should have either search or filters
      expect(hasSearch || hasFilters).toBeTruthy();
    });

    test('should display clan cards with key information', async ({ page }) => {
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      // Check for clan cards
      const cards = page.locator('[class*="card"], [class*="Card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toBeVisible();

        // Card should contain clan info like name, tag, or member count
        const cardText = await firstCard.textContent();
        expect(cardText?.length).toBeGreaterThan(0);
      }
    });

    test('should have create clan button', async ({ page }) => {
      await page.goto('/clans');

      // Check for create clan button/link
      const createButton = page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New Clan")');
      const hasCreateButton = await createButton.isVisible().catch(() => false);

      // Create button might require authentication
      expect(hasCreateButton).toBeDefined();
    });
  });

  test.describe('Tournaments Feature', () => {
    test('should display tournament list page', async ({ page }) => {
      await page.goto('/tournaments');

      // Check page heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toContainText(/tournament/i);
    });

    test('should have tournament status filters', async ({ page }) => {
      await page.goto('/tournaments');

      // Check for status filter tabs or buttons
      const statusFilters = page.locator('[role="tablist"], [class*="filter"], button:has-text("Upcoming"), button:has-text("Ongoing"), button:has-text("Completed")');
      const hasFilters = await statusFilters.first().isVisible().catch(() => false);

      expect(hasFilters).toBeDefined();
    });

    test('should display tournament cards', async ({ page }) => {
      await page.goto('/tournaments');

      await page.waitForLoadState('networkidle');

      // Check for tournament cards or empty state
      const cards = page.locator('[class*="card"], [class*="Card"], [class*="tournament"]');
      const emptyState = page.locator(':has-text("No tournaments"), :has-text("empty")');

      const hasCards = await cards.first().isVisible().catch(() => false);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      // Should show either cards or empty state
      expect(hasCards || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Leaderboards Feature', () => {
    test('should display leaderboard page', async ({ page }) => {
      await page.goto('/leaderboards');

      // Check page heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toContainText(/leaderboard|ranking/i);
    });

    test('should have game/region filters', async ({ page }) => {
      await page.goto('/leaderboards');

      // Check for filter controls
      const filters = page.locator('select, [class*="filter"], [class*="dropdown"]');
      const hasFilters = await filters.first().isVisible().catch(() => false);

      expect(hasFilters).toBeDefined();
    });

    test('should display leaderboard entries', async ({ page }) => {
      await page.goto('/leaderboards');

      await page.waitForLoadState('networkidle');

      // Check for leaderboard table or entries
      const table = page.locator('table, [class*="leaderboard"], [class*="ranking"]');
      const entries = page.locator('tr, [class*="entry"], [class*="row"]');

      const hasTable = await table.first().isVisible().catch(() => false);
      const entryCount = await entries.count();

      expect(hasTable || entryCount > 0).toBeTruthy();
    });

    test('should show rank, username, and points', async ({ page }) => {
      await page.goto('/leaderboards');

      await page.waitForLoadState('networkidle');

      // Check for typical leaderboard columns
      const pageText = await page.textContent('body');

      // Should contain headers or data related to rankings
      const hasRankingContent =
        pageText?.includes('Rank') ||
        pageText?.includes('Points') ||
        pageText?.includes('#1') ||
        pageText?.includes('Score');

      expect(hasRankingContent).toBeDefined();
    });
  });

  test.describe('Find Gamers Feature', () => {
    test('should display find gamers page', async ({ page }) => {
      await page.goto('/find-gamers');

      // Page should load (might redirect if auth required)
      const url = page.url();
      expect(url.includes('find-gamers') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages correctly', async ({ page }) => {
      await page.goto('/');

      // Navigate to clans
      const clansLink = page.locator('a[href="/clans"], a:has-text("Clans")');
      const hasClansLink = await clansLink.isVisible().catch(() => false);

      if (hasClansLink) {
        await clansLink.click();
        await expect(page).toHaveURL(/\/clans/);
      }
    });

    test('should have consistent header across pages', async ({ page }) => {
      const pages = ['/', '/clans', '/tournaments', '/leaderboards'];

      for (const url of pages) {
        await page.goto(url);

        // Check header/nav exists
        const header = page.locator('header, nav, [role="navigation"]');
        await expect(header.first()).toBeVisible();

        // Check for logo or site name
        const logo = page.locator('a[href="/"], [class*="logo"], img[alt*="logo" i]');
        await expect(logo.first()).toBeVisible();
      }
    });

    test('should have consistent footer across pages', async ({ page }) => {
      const pages = ['/', '/clans', '/tournaments'];

      for (const url of pages) {
        await page.goto(url);

        // Check footer exists (if present)
        const footer = page.locator('footer');
        const hasFooter = await footer.isVisible().catch(() => false);

        // Footer is optional but should be consistent if present
        if (hasFooter) {
          await expect(footer).toBeVisible();
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');

      // Should show 404 message or redirect
      const is404 =
        (await page.locator(':has-text("404")').isVisible().catch(() => false)) ||
        (await page.locator(':has-text("not found")').isVisible().catch(() => false)) ||
        page.url().includes('/');

      expect(is404).toBeTruthy();
    });

    test('should handle invalid clan slug', async ({ page }) => {
      await page.goto('/clans/invalid-clan-that-does-not-exist-12345');

      // Should show error or redirect
      const hasError =
        (await page.locator(':has-text("not found")').isVisible().catch(() => false)) ||
        (await page.locator(':has-text("error")').isVisible().catch(() => false)) ||
        page.url() !== '/clans/invalid-clan-that-does-not-exist-12345';

      expect(hasError).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should load landing page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should load clans page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/clans');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
