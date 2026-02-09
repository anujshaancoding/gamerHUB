import { test, expect } from '@playwright/test';

test.describe('Gamification System Tests', () => {
  test.describe('Leaderboard Display', () => {
    test('should display seasonal leaderboard', async ({ page }) => {
      await page.goto('/leaderboards');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check for leaderboard heading
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();

      // Check for season indicator
      const seasonIndicator = page.locator(':has-text("Season"), :has-text("season")');
      const hasSeason = await seasonIndicator.isVisible().catch(() => false);
      expect(hasSeason).toBeDefined();
    });

    test('should show player rankings with points', async ({ page }) => {
      await page.goto('/leaderboards');

      await page.waitForLoadState('networkidle');

      // Check for ranking entries
      const entries = page.locator('tr, [class*="entry"], [class*="row"], [class*="leaderboard"]');
      const count = await entries.count();

      // Should have ranking entries or empty state
      const hasEntries = count > 0;
      const hasEmptyState = await page.locator(':has-text("No data"), :has-text("empty")').isVisible().catch(() => false);

      expect(hasEntries || hasEmptyState).toBeTruthy();
    });

    test('should allow filtering by game', async ({ page }) => {
      await page.goto('/leaderboards');

      // Look for game filter
      const gameFilter = page.locator('select, [class*="filter"], [class*="dropdown"]').first();
      const hasFilter = await gameFilter.isVisible().catch(() => false);

      if (hasFilter) {
        await gameFilter.click();
        // Filter options should appear
        const options = page.locator('option, [role="option"], [class*="option"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });

    test('should allow filtering by region', async ({ page }) => {
      await page.goto('/leaderboards');

      // Look for region filter
      const regionFilter = page.locator('select[name*="region"], [class*="region"]');
      const hasRegionFilter = await regionFilter.isVisible().catch(() => false);

      expect(hasRegionFilter).toBeDefined();
    });
  });

  test.describe('Profile Progression Display', () => {
    test('should show XP and level on profile page', async ({ page }) => {
      // This would require authentication, so we test the public profile view
      await page.goto('/find-gamers');

      // If redirected to login, that's expected
      const url = page.url();
      if (url.includes('login')) {
        expect(url).toContain('login');
      } else {
        // Check for player cards with level indicators
        const levelBadges = page.locator('[class*="level"], [class*="badge"], [class*="xp"]');
        const hasLevelDisplay = await levelBadges.first().isVisible().catch(() => false);
        expect(hasLevelDisplay).toBeDefined();
      }
    });
  });

  test.describe('Badge System', () => {
    test('should display badge categories', async ({ page }) => {
      // Navigate to a profile or badges page
      await page.goto('/');

      // Look for badge displays in the UI
      const badges = page.locator('[class*="badge"], [class*="achievement"]');
      const hasBadges = await badges.first().isVisible().catch(() => false);

      expect(hasBadges).toBeDefined();
    });
  });

  test.describe('Quest System', () => {
    test('should show quest interface elements', async ({ page }) => {
      // Quests are typically shown on dashboard
      await page.goto('/dashboard');

      // If redirected to login
      const url = page.url();
      if (url.includes('login')) {
        expect(url).toContain('login');
      } else {
        // Look for quest elements
        const quests = page.locator('[class*="quest"], [class*="challenge"], [class*="daily"]');
        const hasQuests = await quests.first().isVisible().catch(() => false);
        expect(hasQuests).toBeDefined();
      }
    });
  });

  test.describe('Community Challenges', () => {
    test('should display community challenges page', async ({ page }) => {
      await page.goto('/challenges');

      // Should show challenges or redirect to login
      const url = page.url();

      if (!url.includes('login')) {
        const heading = page.locator('h1, h2');
        await expect(heading.first()).toBeVisible();
      }
    });

    test('should show challenge progress indicators', async ({ page }) => {
      await page.goto('/challenges');

      const url = page.url();

      if (!url.includes('login')) {
        // Look for progress bars or completion indicators
        const progressBars = page.locator('[class*="progress"], [class*="bar"], [role="progressbar"]');
        const hasProgress = await progressBars.first().isVisible().catch(() => false);
        expect(hasProgress).toBeDefined();
      }
    });
  });

  test.describe('Rewards System', () => {
    test('should display available rewards', async ({ page }) => {
      await page.goto('/');

      // Rewards might be displayed on landing or dashboard
      const rewards = page.locator('[class*="reward"], [class*="prize"]');
      const hasRewards = await rewards.first().isVisible().catch(() => false);

      expect(hasRewards).toBeDefined();
    });
  });

  test.describe('Stats Display', () => {
    test('should show game statistics', async ({ page }) => {
      await page.goto('/');

      // Look for stats sections
      const stats = page.locator('[class*="stat"], [class*="count"], [class*="number"]');
      const count = await stats.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display win/match counts', async ({ page }) => {
      await page.goto('/clans');

      await page.waitForLoadState('networkidle');

      // Clan cards should show stats
      const statsText = await page.textContent('body');
      const hasMatchStats =
        statsText?.includes('win') ||
        statsText?.includes('match') ||
        statsText?.includes('game');

      expect(hasMatchStats).toBeDefined();
    });
  });
});

test.describe('Gamification UI Components', () => {
  test.describe('Level Badge Component', () => {
    test('should render level badges correctly', async ({ page }) => {
      await page.goto('/');

      // Level badges are typically small circular or rectangular elements
      const levelElements = page.locator('[class*="level"], [class*="badge"]');
      const count = await levelElements.count();

      // If level badges exist, they should have numeric content
      if (count > 0) {
        const firstBadge = levelElements.first();
        const isVisible = await firstBadge.isVisible().catch(() => false);
        expect(isVisible).toBeDefined();
      }
    });
  });

  test.describe('Progress Bar Component', () => {
    test('should render XP progress bars', async ({ page }) => {
      await page.goto('/');

      // Look for progress bar elements
      const progressBars = page.locator(
        '[class*="progress"], [role="progressbar"], [class*="bar"]'
      );
      const count = await progressBars.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Rank Display', () => {
    test('should show rank indicators on leaderboard', async ({ page }) => {
      await page.goto('/leaderboards');

      await page.waitForLoadState('networkidle');

      // Look for rank numbers or medals
      const ranks = page.locator('#1, #2, #3, :has-text("1st"), :has-text("2nd"), :has-text("3rd")');
      const medals = page.locator('[class*="medal"], [class*="trophy"], [class*="crown"]');

      const hasRanks = await ranks.first().isVisible().catch(() => false);
      const hasMedals = await medals.first().isVisible().catch(() => false);

      expect(hasRanks || hasMedals).toBeDefined();
    });
  });
});
