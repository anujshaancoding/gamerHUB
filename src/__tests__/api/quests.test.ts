/**
 * API Tests for Quests Business Logic
 * Tests quest status, claiming, progress tracking, and expiration
 */

describe('Quests Business Logic', () => {
  describe('Quest Status Management', () => {
    type QuestStatus = 'active' | 'completed' | 'expired' | 'claimed';

    const VALID_STATUSES: QuestStatus[] = ['active', 'completed', 'expired', 'claimed'];

    const isValidStatus = (status: string): status is QuestStatus => {
      return VALID_STATUSES.includes(status as QuestStatus);
    };

    const canClaim = (status: QuestStatus): boolean => {
      return status === 'completed';
    };

    const isActive = (status: QuestStatus): boolean => {
      return status === 'active';
    };

    it('should validate quest statuses', () => {
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('expired')).toBe(true);
      expect(isValidStatus('claimed')).toBe(true);
      expect(isValidStatus('pending')).toBe(false);
    });

    it('should only allow claiming completed quests', () => {
      expect(canClaim('completed')).toBe(true);
      expect(canClaim('active')).toBe(false);
      expect(canClaim('expired')).toBe(false);
      expect(canClaim('claimed')).toBe(false);
    });

    it('should identify active quests', () => {
      expect(isActive('active')).toBe(true);
      expect(isActive('completed')).toBe(false);
    });
  });

  describe('Quest Progress Tracking', () => {
    interface QuestProgress {
      current: number;
      target: number;
    }

    const calculateProgressPercentage = (progress: QuestProgress): number => {
      if (progress.target <= 0) return 100;
      return Math.min(100, Math.round((progress.current / progress.target) * 100));
    };

    const isCompleted = (progress: QuestProgress): boolean => {
      return progress.current >= progress.target;
    };

    const incrementProgress = (
      progress: QuestProgress,
      amount: number = 1
    ): QuestProgress => {
      return {
        current: Math.min(progress.current + amount, progress.target),
        target: progress.target,
      };
    };

    it('should calculate progress percentage', () => {
      expect(calculateProgressPercentage({ current: 5, target: 10 })).toBe(50);
      expect(calculateProgressPercentage({ current: 3, target: 4 })).toBe(75);
      expect(calculateProgressPercentage({ current: 10, target: 10 })).toBe(100);
    });

    it('should cap progress at 100%', () => {
      expect(calculateProgressPercentage({ current: 15, target: 10 })).toBe(100);
    });

    it('should handle zero target', () => {
      expect(calculateProgressPercentage({ current: 0, target: 0 })).toBe(100);
    });

    it('should check completion correctly', () => {
      expect(isCompleted({ current: 10, target: 10 })).toBe(true);
      expect(isCompleted({ current: 11, target: 10 })).toBe(true);
      expect(isCompleted({ current: 9, target: 10 })).toBe(false);
    });

    it('should increment progress without exceeding target', () => {
      const result = incrementProgress({ current: 9, target: 10 }, 5);
      expect(result.current).toBe(10);
      expect(result.target).toBe(10);
    });
  });

  describe('Quest Type Validation', () => {
    type QuestType = 'daily' | 'weekly' | 'special';

    const VALID_TYPES: QuestType[] = ['daily', 'weekly', 'special'];

    const isValidQuestType = (type: string): type is QuestType => {
      return VALID_TYPES.includes(type as QuestType);
    };

    const getQuestDuration = (type: QuestType): number => {
      const durations: Record<QuestType, number> = {
        daily: 24 * 60 * 60 * 1000, // 24 hours in ms
        weekly: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        special: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
      };
      return durations[type];
    };

    it('should validate quest types', () => {
      expect(isValidQuestType('daily')).toBe(true);
      expect(isValidQuestType('weekly')).toBe(true);
      expect(isValidQuestType('special')).toBe(true);
      expect(isValidQuestType('monthly')).toBe(false);
    });

    it('should return correct duration for quest types', () => {
      expect(getQuestDuration('daily')).toBe(24 * 60 * 60 * 1000);
      expect(getQuestDuration('weekly')).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Quest Expiration', () => {
    const isExpired = (expiresAt: string): boolean => {
      return new Date(expiresAt) < new Date();
    };

    const getTimeRemaining = (expiresAt: string): number => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, remaining);
    };

    const formatTimeRemaining = (ms: number): string => {
      if (ms <= 0) return 'Expired';

      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }
      return `${hours}h ${minutes}m`;
    };

    it('should check if quest is expired', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const futureDate = new Date(Date.now() + 1000000).toISOString();

      expect(isExpired(pastDate)).toBe(true);
      expect(isExpired(futureDate)).toBe(false);
    });

    it('should calculate time remaining', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const remaining = getTimeRemaining(futureDate);

      expect(remaining).toBeGreaterThan(3500000);
      expect(remaining).toBeLessThanOrEqual(3600000);
    });

    it('should return 0 for expired quests', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(getTimeRemaining(pastDate)).toBe(0);
    });

    it('should format time remaining correctly', () => {
      expect(formatTimeRemaining(0)).toBe('Expired');
      expect(formatTimeRemaining(3600000)).toBe('1h 0m'); // 1 hour
      expect(formatTimeRemaining(90 * 60 * 1000)).toBe('1h 30m'); // 90 minutes
      expect(formatTimeRemaining(48 * 60 * 60 * 1000)).toBe('2d 0h'); // 48 hours
    });
  });

  describe('Quest Reset Calculations', () => {
    const calculateDailyReset = (now: Date): Date => {
      const reset = new Date(now);
      reset.setUTCDate(reset.getUTCDate() + 1);
      reset.setUTCHours(0, 0, 0, 0);
      return reset;
    };

    const calculateWeeklyReset = (now: Date): Date => {
      const reset = new Date(now);
      const daysUntilMonday = ((8 - reset.getUTCDay()) % 7) || 7;
      reset.setUTCDate(reset.getUTCDate() + daysUntilMonday);
      reset.setUTCHours(0, 0, 0, 0);
      return reset;
    };

    it('should calculate next daily reset', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const reset = calculateDailyReset(now);

      expect(reset.getUTCDate()).toBe(16);
      expect(reset.getUTCHours()).toBe(0);
      expect(reset.getUTCMinutes()).toBe(0);
    });

    it('should calculate next weekly reset (Monday)', () => {
      const wednesday = new Date('2024-01-17T12:00:00Z'); // Wednesday
      const reset = calculateWeeklyReset(wednesday);

      expect(reset.getUTCDay()).toBe(1); // Monday
      expect(reset.getUTCHours()).toBe(0);
    });

    it('should handle weekly reset when already Monday', () => {
      const monday = new Date('2024-01-15T12:00:00Z'); // Monday
      const reset = calculateWeeklyReset(monday);

      expect(reset.getUTCDay()).toBe(1); // Should be next Monday
      expect(reset.getUTCDate()).toBe(22); // 7 days later
    });
  });

  describe('Quest Rewards', () => {
    interface QuestReward {
      xp_reward: number;
      bonus_rewards: {
        coins?: number;
        items?: string[];
        badges?: string[];
      };
    }

    const calculateTotalXP = (baseXP: number, bonusMultiplier: number = 1): number => {
      return Math.floor(baseXP * bonusMultiplier);
    };

    const validateRewards = (rewards: QuestReward): boolean => {
      if (rewards.xp_reward < 0) return false;
      if (rewards.bonus_rewards.coins !== undefined && rewards.bonus_rewards.coins < 0) return false;
      return true;
    };

    const mergeRewards = (rewards: QuestReward[]): QuestReward => {
      return rewards.reduce(
        (acc, reward) => ({
          xp_reward: acc.xp_reward + reward.xp_reward,
          bonus_rewards: {
            coins: (acc.bonus_rewards.coins || 0) + (reward.bonus_rewards.coins || 0),
            items: [...(acc.bonus_rewards.items || []), ...(reward.bonus_rewards.items || [])],
            badges: [...(acc.bonus_rewards.badges || []), ...(reward.bonus_rewards.badges || [])],
          },
        }),
        { xp_reward: 0, bonus_rewards: {} } as QuestReward
      );
    };

    it('should calculate total XP with multiplier', () => {
      expect(calculateTotalXP(100, 1)).toBe(100);
      expect(calculateTotalXP(100, 1.5)).toBe(150);
      expect(calculateTotalXP(100, 2)).toBe(200);
    });

    it('should validate rewards', () => {
      expect(validateRewards({ xp_reward: 100, bonus_rewards: {} })).toBe(true);
      expect(validateRewards({ xp_reward: -1, bonus_rewards: {} })).toBe(false);
      expect(validateRewards({ xp_reward: 100, bonus_rewards: { coins: -1 } })).toBe(false);
    });

    it('should merge multiple rewards', () => {
      const rewards: QuestReward[] = [
        { xp_reward: 100, bonus_rewards: { coins: 50, items: ['item1'] } },
        { xp_reward: 150, bonus_rewards: { coins: 25, badges: ['badge1'] } },
      ];

      const merged = mergeRewards(rewards);
      expect(merged.xp_reward).toBe(250);
      expect(merged.bonus_rewards.coins).toBe(75);
      expect(merged.bonus_rewards.items).toEqual(['item1']);
      expect(merged.bonus_rewards.badges).toEqual(['badge1']);
    });
  });

  describe('Quest Assignment Limits', () => {
    const MAX_DAILY_QUESTS = 3;
    const MAX_WEEKLY_QUESTS = 5;

    const canAssignQuest = (
      currentCount: number,
      questType: 'daily' | 'weekly'
    ): boolean => {
      const max = questType === 'daily' ? MAX_DAILY_QUESTS : MAX_WEEKLY_QUESTS;
      return currentCount < max;
    };

    const getRemainingSlots = (
      currentCount: number,
      questType: 'daily' | 'weekly'
    ): number => {
      const max = questType === 'daily' ? MAX_DAILY_QUESTS : MAX_WEEKLY_QUESTS;
      return Math.max(0, max - currentCount);
    };

    it('should check if can assign quest', () => {
      expect(canAssignQuest(0, 'daily')).toBe(true);
      expect(canAssignQuest(2, 'daily')).toBe(true);
      expect(canAssignQuest(3, 'daily')).toBe(false);

      expect(canAssignQuest(4, 'weekly')).toBe(true);
      expect(canAssignQuest(5, 'weekly')).toBe(false);
    });

    it('should calculate remaining slots', () => {
      expect(getRemainingSlots(0, 'daily')).toBe(3);
      expect(getRemainingSlots(1, 'daily')).toBe(2);
      expect(getRemainingSlots(3, 'daily')).toBe(0);
      expect(getRemainingSlots(10, 'daily')).toBe(0); // Can't go negative
    });
  });

  describe('Quest Completion Validation', () => {
    interface UserQuest {
      id: string;
      user_id: string;
      status: 'active' | 'completed' | 'expired' | 'claimed';
      claimed_at: string | null;
      expires_at: string;
    }

    const canClaimQuest = (quest: UserQuest): { canClaim: boolean; reason?: string } => {
      if (quest.status !== 'completed') {
        return { canClaim: false, reason: 'Quest is not completed' };
      }

      if (quest.claimed_at !== null) {
        return { canClaim: false, reason: 'Quest already claimed' };
      }

      if (new Date(quest.expires_at) < new Date()) {
        return { canClaim: false, reason: 'Quest has expired' };
      }

      return { canClaim: true };
    };

    it('should allow claiming completed quests', () => {
      const quest: UserQuest = {
        id: '1',
        user_id: 'user1',
        status: 'completed',
        claimed_at: null,
        expires_at: new Date(Date.now() + 100000).toISOString(),
      };

      const result = canClaimQuest(quest);
      expect(result.canClaim).toBe(true);
    });

    it('should reject claiming active quests', () => {
      const quest: UserQuest = {
        id: '1',
        user_id: 'user1',
        status: 'active',
        claimed_at: null,
        expires_at: new Date(Date.now() + 100000).toISOString(),
      };

      const result = canClaimQuest(quest);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Quest is not completed');
    });

    it('should reject claiming already claimed quests', () => {
      const quest: UserQuest = {
        id: '1',
        user_id: 'user1',
        status: 'completed',
        claimed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 100000).toISOString(),
      };

      const result = canClaimQuest(quest);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Quest already claimed');
    });
  });
});
