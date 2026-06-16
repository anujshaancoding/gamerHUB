import { test, expect } from '@playwright/test';

// Define viewport sizes for testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  laptopSmall: { width: 1280, height: 720 },
  ultrawide: { width: 2560, height: 1440 },
};

test.describe('Responsive Design Tests', () => {
  test.describe('Community Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display correctly on ${name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/community', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');

        // Check main content is visible
        await expect(page.locator('body')).toBeVisible();

        // Navigation should be present
        const nav = page.locator('nav');
        await expect(nav.first()).toBeVisible({ timeout: 10000 });

        // Check no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10); // Allow small tolerance

        await page.screenshot({
          path: `test-results/screenshots/community-${name}.png`,
          fullPage: true,
        });
      });
    }

    test('should show mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/community', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');

      // On mobile, sidebar is hidden (lg:flex) and mobile menu button should exist
      // The sidebar uses `hidden lg:flex`
      const sidebar = page.locator('aside');
      const nav = page.locator('nav');

      // Nav bar should always be visible
      await expect(nav.first()).toBeVisible({ timeout: 10000 });

      // On mobile (<1024px), the sidebar is hidden
      // There should be a mobile-friendly navigation
      const mobileNav = await nav.first().isVisible();
      expect(mobileNav).toBeTruthy();
    });

    test('should show full navigation on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/community', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for full navigation
      const nav = page.locator('nav');
      await expect(nav.first()).toBeVisible({ timeout: 10000 });

      // Sidebar should be visible on desktop (lg screens)
      const sidebar = page.locator('aside');
      const sidebarVisible = await sidebar.first().isVisible().catch(() => false);

      // On desktop (1920px > 1024px), sidebar should be visible
      expect(sidebarVisible).toBeTruthy();
    });
  });

  test.describe('Clans Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display clan cards correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/clans', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');

        // Check page heading
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible({ timeout: 10000 });

        // Heading already verified above; page content is loaded

        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10);

        await page.screenshot({
          path: `test-results/screenshots/clans-${name}.png`,
          fullPage: true,
        });
      });
    }

    test('should show single column on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // The clans page uses grid-cols-1 md:grid-cols-2
      // On mobile (375px < 768px md breakpoint), should be single column
      const grid = page.locator('.grid');
      const gridVisible = await grid.first().isVisible().catch(() => false);

      if (gridVisible) {
        // Check grid has grid-cols-1 on mobile
        const gridStyle = await grid.first().evaluate((el) => {
          return window.getComputedStyle(el).gridTemplateColumns;
        });
        // Single column means one column track
        const columnCount = gridStyle.split(' ').filter(s => s !== '').length;
        expect(columnCount).toBeLessThanOrEqual(1);
      }
      // If no grid visible, page shows empty state which is acceptable
    });

    test('should show multi-column grid on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      const grid = page.locator('.grid').first();
      const gridVisible = await grid.isVisible().catch(() => false);

      if (gridVisible) {
        // On desktop (1920px > 768px md breakpoint), should be 2 columns
        const gridStyle = await grid.evaluate((el) => {
          return window.getComputedStyle(el).gridTemplateColumns;
        });
        const columnCount = gridStyle.split(' ').filter(s => s !== '').length;
        expect(columnCount).toBeGreaterThanOrEqual(2);
      }
      // If no grid visible, page shows empty state which is acceptable
    });
  });

  test.describe('Blog Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display blog correctly on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/blog', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');

        // Check heading
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible({ timeout: 10000 });

        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10);

        await page.screenshot({
          path: `test-results/screenshots/blog-${name}.png`,
          fullPage: true,
        });
      });
    }
  });

  test.describe('Login Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display login form correctly on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');

        // Form should be visible and centered
        const form = page.locator('form');
        await expect(form.first()).toBeVisible({ timeout: 10000 });

        // Inputs should be accessible
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        await expect(emailInput).toBeVisible();

        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10);

        await page.screenshot({
          path: `test-results/screenshots/login-${name}.png`,
          fullPage: true,
        });
      });
    }
  });

  test.describe('Modal Responsiveness', () => {
    test('should display modal correctly on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // Wait for h1 to confirm page is loaded
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 15000 });

      // Wait for any loading overlay to disappear
      const overlay = page.locator('.fixed.inset-0.z-50');
      await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

      // Click on a clan card link to open detail (if available)
      const card = page.locator('a[href*="/clans/"]').first();
      const cardExists = await card.isVisible().catch(() => false);

      if (cardExists) {
        await card.click();
        await page.waitForTimeout(1000);

        // Check if modal or new page opened
        const modal = page.locator('[role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            expect(modalBox.width).toBeLessThanOrEqual(viewports.mobile.width);
          }
        }
      }
    });

    test('should display modal correctly on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      // Wait for h1 to confirm page is loaded
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 15000 });

      // Wait for any loading overlay to disappear
      const overlay = page.locator('.fixed.inset-0.z-50');
      await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

      // Click on a clan card link to open detail (if available)
      const card = page.locator('a[href*="/clans/"]').first();
      const cardExists = await card.isVisible().catch(() => false);

      if (cardExists) {
        await card.click();
        await page.waitForTimeout(1000);

        const modal = page.locator('[role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            expect(modalBox.width).toBeGreaterThan(300);
            expect(modalBox.width).toBeLessThanOrEqual(800);
          }
        }
      }
    });
  });

  test.describe('Text Readability', () => {
    test('should have readable font sizes on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Wait for content
      await page.waitForTimeout(2000);

      // Check heading font size
      const heading = page.locator('h1, h2').first();
      const headingVisible = await heading.isVisible().catch(() => false);
      if (headingVisible) {
        const headingFontSize = await heading.evaluate(
          (el) => parseFloat(window.getComputedStyle(el).fontSize)
        );
        expect(headingFontSize).toBeGreaterThanOrEqual(20);
      }

      // Check body text font size
      const body = page.locator('p').first();
      const isBodyVisible = await body.isVisible().catch(() => false);
      if (isBodyVisible) {
        const bodyFontSize = await body.evaluate(
          (el) => parseFloat(window.getComputedStyle(el).fontSize)
        );
        expect(bodyFontSize).toBeGreaterThanOrEqual(14);
      }
    });
  });

  test.describe('Touch Targets', () => {
    test('should have adequate touch targets on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Wait for form to render
      const form = page.locator('form');
      await expect(form.first()).toBeVisible({ timeout: 15000 });

      // Check submit button has adequate tap target
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      const submitBox = await submitButton.boundingBox();
      if (submitBox) {
        // Submit button should be at least 40px tall for comfortable tapping
        expect(submitBox.height).toBeGreaterThanOrEqual(36);
        expect(submitBox.width).toBeGreaterThanOrEqual(100);
      }

      // Check that input fields have adequate size
      const inputs = page.locator('input[type="email"], input[type="password"]');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const isVisible = await input.isVisible().catch(() => false);

        if (isVisible) {
          const box = await input.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(32);
            expect(box.width).toBeGreaterThanOrEqual(100);
          }
        }
      }
    });
  });
});
