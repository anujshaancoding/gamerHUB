/**
 * API Tests for Progression Business Logic
 * Tests XP calculations, level progression, and customization rules
 */

describe('Progression Business Logic', () => {
  describe('XP Calculations', () => {
    // XP required per level follows a scaling formula
    const calculateXPForLevel = (level: number): number => {
      // Base XP of 100, scaling by 1.5x each level
      return Math.floor(100 * Math.pow(1.5, level - 1));
    };

    const calculateTotalXPForLevel = (level: number): number => {
      let total = 0;
      for (let i = 1; i < level; i++) {
        total += calculateXPForLevel(i);
      }
      return total;
    };

    it('should calculate XP required for each level', () => {
      expect(calculateXPForLevel(1)).toBe(100);
      expect(calculateXPForLevel(2)).toBe(150);
      expect(calculateXPForLevel(3)).toBe(225);
      expect(calculateXPForLevel(5)).toBe(506);
    });

    it('should calculate total XP needed to reach a level', () => {
      expect(calculateTotalXPForLevel(1)).toBe(0);
      expect(calculateTotalXPForLevel(2)).toBe(100);
      expect(calculateTotalXPForLevel(3)).toBe(250); // 100 + 150
    });
  });

  describe('Level Progression', () => {
    interface ProgressionData {
      total_xp: number;
      level: number;
      current_level_xp: number;
      xp_to_next_level: number;
    }

    const calculateProgression = (totalXP: number): ProgressionData => {
      let level = 1;
      let xpRemaining = totalXP;
      let xpForCurrentLevel = 100;

      while (xpRemaining >= xpForCurrentLevel) {
        xpRemaining -= xpForCurrentLevel;
        level++;
        xpForCurrentLevel = Math.floor(100 * Math.pow(1.5, level - 1));
      }

      return {
        total_xp: totalXP,
        level,
        current_level_xp: xpRemaining,
        xp_to_next_level: xpForCurrentLevel,
      };
    };

    it('should start at level 1 with 0 XP', () => {
      const prog = calculateProgression(0);
      expect(prog.level).toBe(1);
      expect(prog.current_level_xp).toBe(0);
      expect(prog.xp_to_next_level).toBe(100);
    });

    it('should level up at 100 XP', () => {
      const prog = calculateProgression(100);
      expect(prog.level).toBe(2);
      expect(prog.current_level_xp).toBe(0);
    });

    it('should handle partial progress', () => {
      const prog = calculateProgression(50);
      expect(prog.level).toBe(1);
      expect(prog.current_level_xp).toBe(50);
      expect(prog.xp_to_next_level).toBe(100);
    });

    it('should calculate multiple level ups', () => {
      const prog = calculateProgression(300);
      expect(prog.level).toBe(3);
      expect(prog.current_level_xp).toBe(50); // 300 - 100 - 150 = 50
    });
  });

  describe('Prestige System', () => {
    const MAX_LEVEL = 100;
    const PRESTIGE_XP_BONUS = 0.1; // 10% bonus per prestige

    const canPrestige = (level: number): boolean => {
      return level >= MAX_LEVEL;
    };

    const calculateXPMultiplier = (prestigeLevel: number): number => {
      return 1 + prestigeLevel * PRESTIGE_XP_BONUS;
    };

    const applyPrestigeBonus = (baseXP: number, prestigeLevel: number): number => {
      return Math.floor(baseXP * calculateXPMultiplier(prestigeLevel));
    };

    it('should only allow prestige at max level', () => {
      expect(canPrestige(99)).toBe(false);
      expect(canPrestige(100)).toBe(true);
      expect(canPrestige(101)).toBe(true);
    });

    it('should calculate XP multiplier correctly', () => {
      expect(calculateXPMultiplier(0)).toBe(1);
      expect(calculateXPMultiplier(1)).toBe(1.1);
      expect(calculateXPMultiplier(5)).toBe(1.5);
    });

    it('should apply prestige bonus to XP gains', () => {
      expect(applyPrestigeBonus(100, 0)).toBe(100);
      expect(applyPrestigeBonus(100, 1)).toBe(110);
      expect(applyPrestigeBonus(100, 5)).toBe(150);
    });
  });

  describe('Stats Tracking', () => {
    interface UserStats {
      matches_played: number;
      matches_won: number;
      challenges_completed: number;
      quests_completed: number;
      current_win_streak: number;
      best_win_streak: number;
    }

    const calculateWinRate = (stats: UserStats): number => {
      if (stats.matches_played === 0) return 0;
      return Math.round((stats.matches_won / stats.matches_played) * 100);
    };

    const updateWinStreak = (
      stats: UserStats,
      won: boolean
    ): UserStats => {
      const newStreak = won ? stats.current_win_streak + 1 : 0;
      return {
        ...stats,
        matches_played: stats.matches_played + 1,
        matches_won: won ? stats.matches_won + 1 : stats.matches_won,
        current_win_streak: newStreak,
        best_win_streak: Math.max(stats.best_win_streak, newStreak),
      };
    };

    it('should calculate win rate correctly', () => {
      expect(calculateWinRate({ matches_played: 10, matches_won: 5, challenges_completed: 0, quests_completed: 0, current_win_streak: 0, best_win_streak: 0 })).toBe(50);
      expect(calculateWinRate({ matches_played: 100, matches_won: 75, challenges_completed: 0, quests_completed: 0, current_win_streak: 0, best_win_streak: 0 })).toBe(75);
      expect(calculateWinRate({ matches_played: 0, matches_won: 0, challenges_completed: 0, quests_completed: 0, current_win_streak: 0, best_win_streak: 0 })).toBe(0);
    });

    it('should update win streak on win', () => {
      const stats: UserStats = {
        matches_played: 5,
        matches_won: 3,
        challenges_completed: 0,
        quests_completed: 0,
        current_win_streak: 2,
        best_win_streak: 3,
      };
      const updated = updateWinStreak(stats, true);
      expect(updated.current_win_streak).toBe(3);
      expect(updated.best_win_streak).toBe(3);
    });

    it('should reset win streak on loss', () => {
      const stats: UserStats = {
        matches_played: 5,
        matches_won: 3,
        challenges_completed: 0,
        quests_completed: 0,
        current_win_streak: 2,
        best_win_streak: 3,
      };
      const updated = updateWinStreak(stats, false);
      expect(updated.current_win_streak).toBe(0);
      expect(updated.best_win_streak).toBe(3); // Best streak preserved
    });

    it('should update best streak when current exceeds', () => {
      const stats: UserStats = {
        matches_played: 5,
        matches_won: 4,
        challenges_completed: 0,
        quests_completed: 0,
        current_win_streak: 3,
        best_win_streak: 3,
      };
      const updated = updateWinStreak(stats, true);
      expect(updated.current_win_streak).toBe(4);
      expect(updated.best_win_streak).toBe(4);
    });
  });

  describe('Customization Validation', () => {
    interface UnlockedItems {
      titles: string[];
      frames: string[];
      themes: string[];
      badges: string[];
    }

    const validateTitleEquip = (titleId: string | null, unlocked: UnlockedItems): boolean => {
      if (titleId === null) return true; // Can unequip
      return unlocked.titles.includes(titleId);
    };

    const validateFrameEquip = (frameId: string | null, unlocked: UnlockedItems): boolean => {
      if (frameId === null) return true;
      return unlocked.frames.includes(frameId);
    };

    const validateShowcaseBadges = (
      badgeIds: string[],
      unlocked: UnlockedItems,
      maxBadges: number = 5
    ): { valid: boolean; filteredBadges: string[] } => {
      if (badgeIds.length > maxBadges) {
        return { valid: false, filteredBadges: badgeIds.slice(0, maxBadges).filter(id => unlocked.badges.includes(id)) };
      }
      const validBadges = badgeIds.filter(id => unlocked.badges.includes(id));
      return { valid: validBadges.length === badgeIds.length, filteredBadges: validBadges };
    };

    const mockUnlocked: UnlockedItems = {
      titles: ['title-1', 'title-2'],
      frames: ['frame-1'],
      themes: ['theme-1', 'theme-2'],
      badges: ['badge-1', 'badge-2', 'badge-3'],
    };

    it('should validate title equip', () => {
      expect(validateTitleEquip('title-1', mockUnlocked)).toBe(true);
      expect(validateTitleEquip('title-3', mockUnlocked)).toBe(false);
      expect(validateTitleEquip(null, mockUnlocked)).toBe(true);
    });

    it('should validate frame equip', () => {
      expect(validateFrameEquip('frame-1', mockUnlocked)).toBe(true);
      expect(validateFrameEquip('frame-2', mockUnlocked)).toBe(false);
      expect(validateFrameEquip(null, mockUnlocked)).toBe(true);
    });

    it('should validate showcase badges', () => {
      const result1 = validateShowcaseBadges(['badge-1', 'badge-2'], mockUnlocked);
      expect(result1.valid).toBe(true);
      expect(result1.filteredBadges).toEqual(['badge-1', 'badge-2']);

      const result2 = validateShowcaseBadges(['badge-1', 'badge-99'], mockUnlocked);
      expect(result2.valid).toBe(false);
      expect(result2.filteredBadges).toEqual(['badge-1']);
    });

    it('should limit showcase badges to max count', () => {
      const result = validateShowcaseBadges(
        ['badge-1', 'badge-2', 'badge-3', 'badge-4', 'badge-5', 'badge-6'],
        { ...mockUnlocked, badges: ['badge-1', 'badge-2', 'badge-3', 'badge-4', 'badge-5', 'badge-6'] },
        5
      );
      expect(result.filteredBadges.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Progress Percentage Calculation', () => {
    const calculateProgressPercentage = (currentXP: number, xpToNext: number): number => {
      if (xpToNext <= 0) return 100;
      return Math.min(100, Math.round((currentXP / xpToNext) * 100));
    };

    it('should calculate progress percentage', () => {
      expect(calculateProgressPercentage(50, 100)).toBe(50);
      expect(calculateProgressPercentage(75, 100)).toBe(75);
      expect(calculateProgressPercentage(0, 100)).toBe(0);
    });

    it('should cap at 100%', () => {
      expect(calculateProgressPercentage(150, 100)).toBe(100);
    });

    it('should handle edge case of 0 xp required', () => {
      expect(calculateProgressPercentage(50, 0)).toBe(100);
    });
  });
});

describe('XP Source Validation', () => {
  const VALID_XP_SOURCES = ['match', 'challenge', 'quest', 'achievement', 'bonus', 'seasonal'] as const;
  type XPSource = typeof VALID_XP_SOURCES[number];

  const validateXPSource = (source: string): source is XPSource => {
    return VALID_XP_SOURCES.includes(source as XPSource);
  };

  const getXPMultiplierForSource = (source: XPSource): number => {
    const multipliers: Record<XPSource, number> = {
      match: 1,
      challenge: 1.5,
      quest: 1,
      achievement: 2,
      bonus: 1,
      seasonal: 1.25,
    };
    return multipliers[source];
  };

  it('should validate XP sources', () => {
    expect(validateXPSource('match')).toBe(true);
    expect(validateXPSource('quest')).toBe(true);
    expect(validateXPSource('invalid')).toBe(false);
  });

  it('should return correct multipliers for sources', () => {
    expect(getXPMultiplierForSource('match')).toBe(1);
    expect(getXPMultiplierForSource('challenge')).toBe(1.5);
    expect(getXPMultiplierForSource('achievement')).toBe(2);
  });
});
