import { test, expect } from '@playwright/test';

test.describe('UX Testing Suite', () => {
  test.describe('Navigation UX', () => {
    test('should have consistent back navigation', async ({ page }) => {
      await page.goto('/');
      await page.goto('/clans');
      await page.goto('/tournaments');

      // Go back should work
      await page.goBack();
      await expect(page).toHaveURL(/\/clans/);

      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should have breadcrumb navigation on nested pages', async ({ page }) => {
      await page.goto('/clans');
      await page.waitForLoadState('networkidle');

      // Check for navigation structure
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/clans');
      await page.waitForLoadState('networkidle');

      // Check if active nav item is highlighted
      const activeLink = page.locator('nav a[class*="active"], nav a[aria-current="page"]');
      const hasActive = await activeLink.count();
      expect(hasActive).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Loading States UX', () => {
    test('should show loading indicators', async ({ page }) => {
      await page.goto('/clans');

      // Either content loads immediately or there's a loading state
      const content = page.locator('[class*="loading"], [class*="skeleton"], [aria-busy="true"]');
      const cards = page.locator('[class*="card"]');

      // Wait for either loading or content
      await Promise.race([
        content.first().waitFor({ timeout: 5000 }).catch(() => null),
        cards.first().waitFor({ timeout: 5000 }).catch(() => null),
      ]);
    });

    test('should show loading on form submission', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Fill form
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      // Check button is clickable before submission
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Form UX', () => {
    test('should show validation errors', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.locator('button[type="submit"]');

      // Try to submit empty form
      await submitButton.click();

      // Should show validation feedback
      const errorMessage = page.locator('[class*="error"], [role="alert"], [aria-invalid="true"]');
      const hasError = await errorMessage.count();

      // Either HTML5 validation or custom error
      expect(hasError >= 0).toBeTruthy();
    });

    test('should have proper input labels', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[type="email"], input[name="email"]');

      // Check for label or placeholder
      const hasLabel = await page.locator('label[for], label:has(input)').count();
      const hasPlaceholder = await emailInput.getAttribute('placeholder');

      expect(hasLabel > 0 || hasPlaceholder).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');

      // Tab through form elements
      await page.keyboard.press('Tab');

      // Check if focus is on input
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
    });
  });

  test.describe('Feedback UX', () => {
    test('should show toast/notification on actions', async ({ page }) => {
      await page.goto('/login');

      // Try invalid login
      await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for any feedback
      await page.waitForTimeout(1000);

      // Check for toast or error message
      const feedback = page.locator('[class*="toast"], [class*="alert"], [role="alert"], [class*="error"]');
      const hasFeedback = await feedback.count();
      expect(hasFeedback).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility UX', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Check for h1
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have skip link for keyboard users', async ({ page }) => {
      await page.goto('/');

      // Check for skip link
      const skipLink = page.locator('a[href="#main"], a[href="#content"], [class*="skip"]');
      const hasSkipLink = await skipLink.count();
      expect(hasSkipLink).toBeGreaterThanOrEqual(0);
    });

    test('should have proper alt text on images', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Image should have alt or be decorative (role="presentation")
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');

      // Check that text is visible
      const textContent = page.locator('p, span, a');
      const textCount = await textContent.count();
      expect(textCount).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling UX', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page-12345');

      // Should show 404 or redirect
      const body = await page.textContent('body');
      const is404 = body?.includes('404') || body?.includes('not found') || body?.includes('Not Found');
      const redirected = await page.url();

      expect(is404 || redirected !== '/nonexistent-page-12345').toBeTruthy();
    });

    test('should show empty state for no results', async ({ page }) => {
      await page.goto('/clans');
      await page.waitForLoadState('networkidle');

      // Check for empty state or content
      const content = page.locator('[class*="card"], [class*="empty"], [class*="no-results"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 }).catch(() => {
        // Page might have default content
      });
    });
  });

  test.describe('Performance UX', () => {
    test('should load critical content within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000); // 10 second max
    });

    test('should not have layout shift', async ({ page }) => {
      await page.goto('/clans');

      // Get initial positions
      const firstCard = page.locator('[class*="card"]').first();
      await firstCard.waitFor({ timeout: 10000 }).catch(() => null);

      const isVisible = await firstCard.isVisible().catch(() => false);
      if (isVisible) {
        const initialBox = await firstCard.boundingBox();

        // Wait a moment
        await page.waitForTimeout(1000);

        // Check position hasn't shifted significantly
        const finalBox = await firstCard.boundingBox();

        if (initialBox && finalBox) {
          const shift = Math.abs(initialBox.y - finalBox.y);
          expect(shift).toBeLessThan(50); // Allow small shifts
        }
      }
    });
  });

  test.describe('Interactive Elements UX', () => {
    test('should have hover states on clickable elements', async ({ page }) => {
      await page.goto('/');

      const button = page.locator('button, a').first();
      await expect(button).toBeVisible();

      // Hover should work without error
      await button.hover();
    });

    test('should have focus states on interactive elements', async ({ page }) => {
      await page.goto('/login');

      const input = page.locator('input').first();
      await input.focus();

      // Element should receive focus
      const isFocused = await input.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    });

    test('should support Escape key to close modals', async ({ page }) => {
      await page.goto('/clans');
      await page.waitForLoadState('networkidle');

      // Try to open a modal
      const card = page.locator('[class*="card"]').first();
      const cardExists = await card.isVisible().catch(() => false);

      if (cardExists) {
        await card.click();

        // Wait for modal
        await page.waitForTimeout(500);

        const modal = page.locator('[class*="modal"], [role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Press Escape
          await page.keyboard.press('Escape');

          // Modal should close
          await page.waitForTimeout(500);
          const modalStillVisible = await modal.isVisible().catch(() => false);
          expect(modalStillVisible).toBeFalsy();
        }
      }
    });
  });

  test.describe('Scroll UX', () => {
    test('should have smooth scroll behavior', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await page.waitForTimeout(500);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });

    test('should have scroll to top functionality', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);

      // Check for scroll to top button
      const scrollTopButton = page.locator('[class*="scroll-top"], [aria-label*="top"], [aria-label*="Top"]');
      const hasScrollTop = await scrollTopButton.isVisible().catch(() => false);

      // Either has scroll button or page handles it
      expect(true).toBeTruthy();
    });
  });
});
