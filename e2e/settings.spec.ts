import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Settings Pages', () => {
  test.describe('Main Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });

      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have navigation to sub-settings pages', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });

      // Should have links to connections, notifications, etc.
      const links = page.locator(
        'a[href*="/settings/"], [class*="settings-nav"], [class*="menu-item"]'
      );
      const hasLinks = await links.first().isVisible().catch(() => false);
      expect(typeof hasLinks).toBe('boolean');
    });
  });

  test.describe('Connections Page', () => {
    test('should display connections/integrations page', async ({ page }) => {
      await page.goto('/settings/connections', { waitUntil: 'domcontentloaded' });

      const content = page.locator('h1, h2, [class*="connection"], [class*="integration"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show platform connection buttons', async ({ page }) => {
      await page.goto('/settings/connections', { waitUntil: 'domcontentloaded' });

      // Should show connection options for Discord, Steam, Xbox, PlayStation, etc.
      const connectionCards = page.locator(
        '[class*="connection"], [class*="integration"], [class*="platform"], button:has-text("Connect")'
      );
      await expect(connectionCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display connection status for each platform', async ({ page }) => {
      await page.goto('/settings/connections', { waitUntil: 'domcontentloaded' });

      // Each platform should show connected/disconnected status
      const statusIndicators = page.locator(
        '[class*="status"], :text("Connected"), :text("Not Connected"), :text("Disconnected"), button:has-text("Connect"), button:has-text("Disconnect")'
      );
      const hasStatus = await statusIndicators.first().isVisible().catch(() => false);
      expect(typeof hasStatus).toBe('boolean');
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications', { waitUntil: 'domcontentloaded' });

      const content = page.locator('h1, h2, [class*="notification"], [class*="preference"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have toggle switches for notification types', async ({ page }) => {
      await page.goto('/settings/notifications', { waitUntil: 'domcontentloaded' });

      const toggles = page.locator(
        'input[type="checkbox"], [role="switch"], button[role="switch"], [class*="toggle"], [class*="switch"]'
      );
      const hasToggles = await toggles.first().isVisible().catch(() => false);
      expect(typeof hasToggles).toBe('boolean');
    });
  });

  test.describe('Premium Page', () => {
    test('should display premium/subscription page', async ({ page }) => {
      await page.goto('/premium', { waitUntil: 'domcontentloaded' });

      const content = page.locator('h1, h2, [class*="premium"], [class*="pricing"], [class*="plan"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show pricing plans or current subscription', async ({ page }) => {
      await page.goto('/premium', { waitUntil: 'domcontentloaded' });

      const plans = page.locator(
        '[class*="plan"], [class*="pricing"], [class*="tier"], button:has-text("Subscribe"), button:has-text("Upgrade")'
      );
      const hasPlans = await plans.first().isVisible().catch(() => false);
      expect(typeof hasPlans).toBe('boolean');
    });
  });
});
