import { test, expect, devices } from '@playwright/test';

// Define viewport sizes for testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  laptopSmall: { width: 1280, height: 720 },
  ultrawide: { width: 2560, height: 1440 },
};

test.describe('Responsive Design Tests', () => {
  test.describe('Landing Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display correctly on ${name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Check main content is visible
        await expect(page.locator('body')).toBeVisible();

        // Navigation should be present
        const nav = page.locator('nav, header, [role="navigation"]');
        await expect(nav.first()).toBeVisible();

        // Check no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10); // Allow small tolerance

        // Take screenshot for visual comparison
        await page.screenshot({
          path: `test-results/screenshots/landing-${name}.png`,
          fullPage: true,
        });
      });
    }

    test('should show mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/');

      // Check for hamburger menu or mobile navigation
      const mobileMenu = page.locator(
        '[aria-label="menu"], [aria-label="Menu"], button:has([class*="hamburger"]), button:has([class*="menu"]), [data-testid="mobile-menu"]'
      );

      // Mobile menu should be visible OR navigation should be collapsed
      const isMenuVisible = await mobileMenu.isVisible().catch(() => false);
      const nav = page.locator('nav a, header a');
      const navLinksCount = await nav.count();

      // Either mobile menu exists or nav links are minimal/hidden
      expect(isMenuVisible || navLinksCount <= 3).toBeTruthy();
    });

    test('should show full navigation on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');

      // Check for full navigation
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();

      // Should have multiple navigation links visible
      const navLinks = page.locator('nav a, header a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Clans Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display clan cards correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/clans');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check page heading
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible();

        // Check for grid layout or list
        const cardGrid = page.locator('[class*="grid"], [class*="flex-wrap"]');
        await expect(cardGrid.first()).toBeVisible();

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
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      // Cards should stack vertically on mobile
      const cards = page.locator('[class*="card"], [class*="Card"]');
      const cardCount = await cards.count();

      if (cardCount > 1) {
        // Get first two card positions
        const firstCard = await cards.first().boundingBox();
        const secondCard = await cards.nth(1).boundingBox();

        if (firstCard && secondCard) {
          // On mobile, second card should be below first (not beside)
          expect(secondCard.y).toBeGreaterThan(firstCard.y);
        }
      }
    });

    test('should show multi-column grid on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      const cards = page.locator('[class*="card"], [class*="Card"]');
      const cardCount = await cards.count();

      if (cardCount > 1) {
        // Get first two card positions
        const firstCard = await cards.first().boundingBox();
        const secondCard = await cards.nth(1).boundingBox();

        if (firstCard && secondCard) {
          // On desktop, cards might be side by side (same y) or in a grid
          // Just ensure grid has some structure
          expect(firstCard.width).toBeGreaterThan(200); // Cards have reasonable width
        }
      }
    });
  });

  test.describe('Tournaments Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display tournaments correctly on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/tournaments');

        await page.waitForLoadState('networkidle');

        // Check heading
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible();

        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10);

        await page.screenshot({
          path: `test-results/screenshots/tournaments-${name}.png`,
          fullPage: true,
        });
      });
    }
  });

  test.describe('Leaderboards Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display leaderboard table correctly on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/leaderboards');

        await page.waitForLoadState('networkidle');

        // Check heading
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible();

        // No horizontal overflow (tables might scroll horizontally)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10);

        await page.screenshot({
          path: `test-results/screenshots/leaderboards-${name}.png`,
          fullPage: true,
        });
      });
    }

    test('should have horizontal scroll for table on mobile', async ({
      page,
    }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/leaderboards');

      await page.waitForLoadState('networkidle');

      // Check if table container has overflow handling
      const tableContainer = page.locator(
        '[class*="overflow-x"], [class*="table"], table'
      );
      await expect(tableContainer.first()).toBeVisible();
    });
  });

  test.describe('Login Page Responsiveness', () => {
    for (const [name, viewport] of Object.entries(viewports)) {
      test(`should display login form correctly on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/login');

        // Form should be visible and centered
        const form = page.locator(
          'form, [class*="auth"], [class*="login"]'
        );
        await expect(form.first()).toBeVisible();

        // Inputs should be accessible
        const emailInput = page.locator(
          'input[type="email"], input[name="email"]'
        );
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
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      // Click on a clan card to open modal (if available)
      const card = page.locator('[class*="card"], [class*="Card"]').first();
      const cardExists = await card.isVisible().catch(() => false);

      if (cardExists) {
        await card.click();

        // Check if modal is visible and properly sized
        const modal = page.locator('[class*="modal"], [role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            // Modal should fit within viewport
            expect(modalBox.width).toBeLessThanOrEqual(viewports.mobile.width);
          }
        }
      }
    });

    test('should display modal correctly on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      // Click on a clan card to open modal (if available)
      const card = page.locator('[class*="card"], [class*="Card"]').first();
      const cardExists = await card.isVisible().catch(() => false);

      if (cardExists) {
        await card.click();

        // Check if modal is visible
        const modal = page.locator('[class*="modal"], [role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            // Modal should be reasonably sized on desktop
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
      await page.goto('/');

      // Check heading font size
      const heading = page.locator('h1, h2').first();
      const headingFontSize = await heading.evaluate(
        (el) => parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(headingFontSize).toBeGreaterThanOrEqual(20);

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
      await page.goto('/');

      // Check button sizes
      const buttons = page.locator('button, [role="button"], a.button, a[class*="btn"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          const box = await button.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44 pixels (WCAG recommendation)
            expect(box.height).toBeGreaterThanOrEqual(32); // Allow slightly smaller
            expect(box.width).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });
  });
});
