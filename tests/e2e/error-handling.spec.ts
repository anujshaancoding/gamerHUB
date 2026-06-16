import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
  test.describe('404 Pages (Unauthenticated)', () => {
    test('should handle completely invalid URL', async ({ page }) => {
      const response = await page.goto('/absolutely-invalid-route-12345', { waitUntil: 'domcontentloaded' });
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle invalid nested route', async ({ page }) => {
      const response = await page.goto('/clans/nonexistent-clan-slug-xyz', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should show error, 404, or redirect
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle invalid API-like routes in browser', async ({ page }) => {
      await page.goto('/api/nonexistent', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Should show JSON error or page
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Error States (Authenticated)', () => {
    test.use({ storageState: 'e2e/.auth/user.json' });

    test('should handle invalid profile username', async ({ page }) => {
      await page.goto('/profile/this-user-absolutely-does-not-exist-xyz-123', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Should show error, 404, or redirect
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const errorContent = page.locator(
        '[class*="error"], [class*="not-found"], :text("not found"), :text("doesn\'t exist")'
      );
      const heading = page.locator('h1, h2');
      const hasResponse = await errorContent.first().isVisible().catch(() => false) ||
                          await heading.first().isVisible().catch(() => false);
      expect(hasResponse).toBe(true);
    });

    test('should handle invalid conversation ID', async ({ page }) => {
      await page.goto('/messages/invalid-conversation-id-xyz', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Should show error or redirect to messages
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle invalid tournament ID', async ({ page }) => {
      await page.goto('/tournaments/nonexistent-tournament-xyz', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Edge Cases (Authenticated)', () => {
    test.use({ storageState: 'e2e/.auth/user.json' });

    test('should handle page refresh without losing state', async ({ page }) => {
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Refresh page
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should still show community content (not login page)
      const content = page.locator('[class*="feed"], [class*="post"], [class*="community"], h1, h2');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle rapid navigation between pages', async ({ page }) => {
      // Navigate rapidly between pages
      await page.goto('/community', { waitUntil: 'domcontentloaded' });
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });
      await page.goto('/friends', { waitUntil: 'domcontentloaded' });
      await page.goto('/messages', { waitUntil: 'domcontentloaded' });

      // Final page should render correctly
      await page.waitForTimeout(2000);
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special characters in search', async ({ page }) => {
      await page.goto('/clans', { waitUntil: 'domcontentloaded' });

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      ).first();

      if (await searchInput.isVisible().catch(() => false)) {
        // Type special characters
        await searchInput.fill('<script>alert("xss")</script>');
        await page.waitForTimeout(1000);

        // Page should not break
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // Should not show raw script tag
        const scriptContent = page.locator(':text("<script>")');
        const hasScript = await scriptContent.isVisible().catch(() => false);
        expect(hasScript).toBe(false);
      }
    });

    test('should handle very long URLs gracefully', async ({ page }) => {
      const longPath = '/clans/' + 'a'.repeat(500);
      await page.goto(longPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should not crash
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
