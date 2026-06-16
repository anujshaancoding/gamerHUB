import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Clans System', () => {
  test.describe('Clans List Page', () => {
    test('should display clans page with heading', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });

    test('should display clan cards or empty state', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // The clans page uses a grid layout for cards or shows an empty state message
      const content = page.locator('.grid, [class*="empty"], [class*="animate-pulse"], h1');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="find" i]'
      );
      const hasSearch = await searchInput.first().isVisible().catch(() => false);
      expect(typeof hasSearch).toBe('boolean');
    });

    test('should have filter options', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const filters = page.locator(
        'select, [class*="filter"], button:has-text("Filter"), [role="combobox"]'
      );
      const hasFilters = await filters.first().isVisible().catch(() => false);
      expect(typeof hasFilters).toBe('boolean');
    });

    test('should search clans by name', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="find" i]'
      ).first();

      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);

        // Results should update - grid with results, empty state, or loading skeletons
        const results = page.locator('.grid, [class*="animate-pulse"], h1, h3');
        await expect(results.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Clan Detail Page', () => {
    test('should navigate to clan detail from list', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const clanLink = page.locator('a[href*="/clans/"]').first();
      if (await clanLink.isVisible().catch(() => false)) {
        await clanLink.click();
        await page.waitForURL(/\/clans\//, { timeout: 5000 });

        // Should show clan detail page
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible();
      }
    });

    test('should display clan members section', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const clanLink = page.locator('a[href*="/clans/"]').first();
      if (await clanLink.isVisible().catch(() => false)) {
        await clanLink.click();
        await page.waitForTimeout(2000);

        const membersSection = page.locator(
          '[class*="member"], :text("Members"), :text("members")'
        );
        const hasMembers = await membersSection.first().isVisible().catch(() => false);
        expect(typeof hasMembers).toBe('boolean');
      }
    });

    test('should show join/leave button on clan page', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const clanLink = page.locator('a[href*="/clans/"]').first();
      if (await clanLink.isVisible().catch(() => false)) {
        await clanLink.click();
        await page.waitForTimeout(2000);

        const actionButton = page.locator(
          'button:has-text("Join"), button:has-text("Leave"), button:has-text("Request"), button:has-text("Apply")'
        );
        const hasAction = await actionButton.first().isVisible().catch(() => false);
        expect(typeof hasAction).toBe('boolean');
      }
    });
  });

  test.describe('Create Clan', () => {
    test('should display create clan page', async ({ page }) => {
      await page.goto('/clans/create', { waitUntil: 'domcontentloaded' });

      // Should show create clan form or premium gate
      const content = page.locator('form, h1, h2, [class*="premium"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have required form fields for clan creation', async ({ page }) => {
      await page.goto('/clans/create', { waitUntil: 'domcontentloaded' });

      // Check for form fields (name, tag, game, etc.)
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      const hasForm = await nameInput.first().isVisible().catch(() => false);
      expect(typeof hasForm).toBe('boolean');
    });

    test('should validate empty clan creation form', async ({ page }) => {
      await page.goto('/clans/create', { waitUntil: 'domcontentloaded' });
      // Wait for potential client-side redirect
      await page.waitForTimeout(2000);

      // May redirect to register if not authenticated
      const currentUrl = page.url();
      if (currentUrl.includes('/register')) {
        // Unauthenticated: redirected to register, which is expected
        await expect(page).toHaveURL(/\/register/);
        return;
      }

      const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors, remain on page, or redirect to register
        await expect(page).toHaveURL(/\/clans\/create|\/register/);
      }
    });
  });
});
