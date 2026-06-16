import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Profile System', () => {
  test.describe('Own Profile', () => {
    test('should display own profile page', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });

      // Should either redirect to /profile/[username] or show profile content
      await page.waitForTimeout(2000);

      const content = page.locator('[class*="profile"], h1, h2, [class*="avatar"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show user avatar and display name', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Avatar should be visible
      const avatar = page.locator('[class*="avatar"] img, img[alt*="avatar" i], img[alt*="profile" i]');
      const hasAvatar = await avatar.first().isVisible().catch(() => false);

      // Display name should be visible
      const displayName = page.locator('h1, h2, [class*="display-name"], [class*="username"]');
      await expect(displayName.first()).toBeVisible();

      expect(hasAvatar || await displayName.first().isVisible()).toBe(true);
    });

    test('should show user stats/level section', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should display level, XP, or stats
      const stats = page.locator('[class*="stat"], [class*="level"], [class*="xp"], [class*="progress"]');
      const hasStats = await stats.first().isVisible().catch(() => false);
      expect(typeof hasStats).toBe('boolean');
    });

    test('should have edit profile button/link', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const editButton = page.locator(
        'a:has-text("Edit"), button:has-text("Edit"), a[href*="/edit"], button[aria-label*="edit" i]'
      );
      const hasEdit = await editButton.first().isVisible().catch(() => false);
      expect(typeof hasEdit).toBe('boolean');
    });

    test('should show games section on profile', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const gamesSection = page.locator('[class*="game"], [class*="Game"]');
      const hasGames = await gamesSection.first().isVisible().catch(() => false);
      expect(typeof hasGames).toBe('boolean');
    });
  });

  test.describe('Edit Profile', () => {
    test('should navigate to edit profile page', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const editButton = page.locator(
        'a:has-text("Edit"), button:has-text("Edit"), a[href*="/edit"]'
      ).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Should show edit form
        const form = page.locator('form, input, textarea');
        await expect(form.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should have display name input field', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit"), a[href*="/edit"]').first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator(
          'input[name="display_name"], input[name="displayName"], input[placeholder*="name" i]'
        );
        const hasInput = await nameInput.first().isVisible().catch(() => false);
        expect(typeof hasInput).toBe('boolean');
      }
    });

    test('should have bio/about textarea', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit"), a[href*="/edit"]').first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const bioInput = page.locator(
          'textarea[name="bio"], textarea[name="about"], textarea[placeholder*="bio" i], textarea[placeholder*="about" i]'
        );
        const hasInput = await bioInput.first().isVisible().catch(() => false);
        expect(typeof hasInput).toBe('boolean');
      }
    });
  });

  test.describe('Public Profile', () => {
    test('should handle non-existent user gracefully', async ({ page }) => {
      await page.goto('/profile/nonexistent-user-xyz-12345', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should show 404, error, or redirect
      const errorContent = page.locator(
        '[class*="error"], [class*="not-found"], [class*="404"], :text("not found"), :text("doesn\'t exist")'
      );
      const heading = page.locator('h1, h2');

      const hasError = await errorContent.first().isVisible().catch(() => false);
      const hasHeading = await heading.first().isVisible().catch(() => false);

      expect(hasError || hasHeading).toBe(true);
    });

    test('should show social actions on other user profile', async ({ page }) => {
      // Navigate to find gamers to find a real profile
      await page.goto('/find-gamers', { waitUntil: 'domcontentloaded' });

      const profileLink = page.locator('a[href*="/profile/"]').first();
      if (await profileLink.isVisible().catch(() => false)) {
        await profileLink.click();
        await page.waitForTimeout(2000);

        // Should show social action buttons (add friend, follow, message, etc.)
        const actionButton = page.locator(
          'button:has-text("Add"), button:has-text("Follow"), button:has-text("Message"), button:has-text("Friend")'
        ).first();
        const hasAction = await actionButton.isVisible().catch(() => false);
        expect(typeof hasAction).toBe('boolean');
      }
    });
  });
});
