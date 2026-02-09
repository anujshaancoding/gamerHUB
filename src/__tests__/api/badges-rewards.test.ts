/**
 * API Tests for Badges and Rewards Business Logic
 * Tests badge unlocking, rarity systems, and reward claiming
 */

describe('Badges Business Logic', () => {
  describe('Badge Rarity System', () => {
    type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

    const RARITY_ORDER: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    const isValidRarity = (rarity: string): rarity is BadgeRarity => {
      return RARITY_ORDER.includes(rarity as BadgeRarity);
    };

    const compareRarity = (a: BadgeRarity, b: BadgeRarity): number => {
      return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b);
    };

    const getRarityWeight = (rarity: BadgeRarity): number => {
      const weights: Record<BadgeRarity, number> = {
        common: 1,
        uncommon: 2,
        rare: 5,
        epic: 10,
        legendary: 25,
      };
      return weights[rarity];
    };

    it('should validate rarity values', () => {
      expect(isValidRarity('common')).toBe(true);
      expect(isValidRarity('legendary')).toBe(true);
      expect(isValidRarity('mythic')).toBe(false);
    });

    it('should compare rarities correctly', () => {
      expect(compareRarity('common', 'legendary')).toBeLessThan(0);
      expect(compareRarity('legendary', 'common')).toBeGreaterThan(0);
      expect(compareRarity('rare', 'rare')).toBe(0);
    });

    it('should return correct weights', () => {
      expect(getRarityWeight('common')).toBe(1);
      expect(getRarityWeight('rare')).toBe(5);
      expect(getRarityWeight('legendary')).toBe(25);
    });
  });

  describe('Badge Categories', () => {
    type BadgeCategory =
      | 'achievement'
      | 'milestone'
      | 'tournament'
      | 'social'
      | 'seasonal'
      | 'special';

    const VALID_CATEGORIES: BadgeCategory[] = [
      'achievement',
      'milestone',
      'tournament',
      'social',
      'seasonal',
      'special',
    ];

    const isValidCategory = (category: string): category is BadgeCategory => {
      return VALID_CATEGORIES.includes(category as BadgeCategory);
    };

    const getCategoryIcon = (category: BadgeCategory): string => {
      const icons: Record<BadgeCategory, string> = {
        achievement: 'trophy',
        milestone: 'flag',
        tournament: 'crown',
        social: 'users',
        seasonal: 'calendar',
        special: 'star',
      };
      return icons[category];
    };

    it('should validate categories', () => {
      expect(isValidCategory('achievement')).toBe(true);
      expect(isValidCategory('tournament')).toBe(true);
      expect(isValidCategory('invalid')).toBe(false);
    });

    it('should return correct icons', () => {
      expect(getCategoryIcon('achievement')).toBe('trophy');
      expect(getCategoryIcon('tournament')).toBe('crown');
    });
  });

  describe('Badge Unlock Requirements', () => {
    interface BadgeRequirement {
      type: 'stat' | 'achievement' | 'level' | 'date' | 'event';
      key: string;
      value: number | string;
      comparison?: 'eq' | 'gte' | 'lte';
    }

    interface UserStats {
      matches_played: number;
      matches_won: number;
      level: number;
      [key: string]: number | string;
    }

    const checkRequirement = (
      requirement: BadgeRequirement,
      userStats: UserStats
    ): boolean => {
      const { type, key, value, comparison = 'gte' } = requirement;

      if (type === 'stat' || type === 'level') {
        const userValue = type === 'level' ? userStats.level : userStats[key];
        if (typeof userValue !== 'number' || typeof value !== 'number') {
          return false;
        }

        switch (comparison) {
          case 'eq':
            return userValue === value;
          case 'gte':
            return userValue >= value;
          case 'lte':
            return userValue <= value;
          default:
            return false;
        }
      }

      if (type === 'date') {
        // For date requirements, value would be a date string
        return true; // Simplified - would need actual date comparison
      }

      return false;
    };

    const checkAllRequirements = (
      requirements: BadgeRequirement[],
      userStats: UserStats
    ): boolean => {
      return requirements.every(req => checkRequirement(req, userStats));
    };

    it('should check stat requirement with gte', () => {
      const req: BadgeRequirement = { type: 'stat', key: 'matches_won', value: 10, comparison: 'gte' };
      expect(checkRequirement(req, { matches_played: 15, matches_won: 12, level: 5 })).toBe(true);
      expect(checkRequirement(req, { matches_played: 15, matches_won: 8, level: 5 })).toBe(false);
    });

    it('should check level requirement', () => {
      const req: BadgeRequirement = { type: 'level', key: '', value: 10 };
      expect(checkRequirement(req, { matches_played: 0, matches_won: 0, level: 15 })).toBe(true);
      expect(checkRequirement(req, { matches_played: 0, matches_won: 0, level: 5 })).toBe(false);
    });

    it('should check equality comparison', () => {
      const req: BadgeRequirement = { type: 'stat', key: 'matches_won', value: 100, comparison: 'eq' };
      expect(checkRequirement(req, { matches_played: 100, matches_won: 100, level: 5 })).toBe(true);
      expect(checkRequirement(req, { matches_played: 100, matches_won: 99, level: 5 })).toBe(false);
    });

    it('should check all requirements', () => {
      const requirements: BadgeRequirement[] = [
        { type: 'stat', key: 'matches_won', value: 10 },
        { type: 'level', key: '', value: 5 },
      ];
      expect(checkAllRequirements(requirements, { matches_played: 20, matches_won: 15, level: 10 })).toBe(true);
      expect(checkAllRequirements(requirements, { matches_played: 20, matches_won: 5, level: 10 })).toBe(false);
    });
  });

  describe('Secret Badge Visibility', () => {
    interface Badge {
      id: string;
      name: string;
      is_secret: boolean;
    }

    const filterVisibleBadges = (
      badges: Badge[],
      earnedBadgeIds: Set<string>
    ): Badge[] => {
      return badges.filter(
        badge => !badge.is_secret || earnedBadgeIds.has(badge.id)
      );
    };

    it('should show non-secret badges', () => {
      const badges: Badge[] = [
        { id: '1', name: 'Badge 1', is_secret: false },
        { id: '2', name: 'Secret Badge', is_secret: true },
      ];
      const earned = new Set<string>([]);
      const visible = filterVisibleBadges(badges, earned);
      expect(visible.length).toBe(1);
      expect(visible[0].id).toBe('1');
    });

    it('should show earned secret badges', () => {
      const badges: Badge[] = [
        { id: '1', name: 'Badge 1', is_secret: false },
        { id: '2', name: 'Secret Badge', is_secret: true },
      ];
      const earned = new Set<string>(['2']);
      const visible = filterVisibleBadges(badges, earned);
      expect(visible.length).toBe(2);
    });
  });
});

describe('Rewards Business Logic', () => {
  describe('Reward Status', () => {
    type RewardStatus = 'available' | 'claimed' | 'expired' | 'locked';

    const VALID_STATUSES: RewardStatus[] = ['available', 'claimed', 'expired', 'locked'];

    const isValidStatus = (status: string): status is RewardStatus => {
      return VALID_STATUSES.includes(status as RewardStatus);
    };

    const canClaim = (status: RewardStatus): boolean => {
      return status === 'available';
    };

    const canEquip = (status: RewardStatus): boolean => {
      return status === 'claimed';
    };

    it('should validate reward statuses', () => {
      expect(isValidStatus('available')).toBe(true);
      expect(isValidStatus('claimed')).toBe(true);
      expect(isValidStatus('pending')).toBe(false);
    });

    it('should only allow claiming available rewards', () => {
      expect(canClaim('available')).toBe(true);
      expect(canClaim('claimed')).toBe(false);
      expect(canClaim('locked')).toBe(false);
    });

    it('should only allow equipping claimed rewards', () => {
      expect(canEquip('claimed')).toBe(true);
      expect(canEquip('available')).toBe(false);
    });
  });

  describe('Season Pass Rewards', () => {
    interface SeasonReward {
      level_required: number;
      is_premium: boolean;
      reward_type: 'title' | 'frame' | 'theme' | 'badge' | 'xp_boost';
    }

    const canUnlockReward = (
      reward: SeasonReward,
      userLevel: number,
      hasPremiumPass: boolean
    ): boolean => {
      if (userLevel < reward.level_required) {
        return false;
      }
      if (reward.is_premium && !hasPremiumPass) {
        return false;
      }
      return true;
    };

    const getUnlockableRewards = (
      rewards: SeasonReward[],
      userLevel: number,
      hasPremiumPass: boolean
    ): SeasonReward[] => {
      return rewards.filter(r => canUnlockReward(r, userLevel, hasPremiumPass));
    };

    it('should check basic level requirement', () => {
      const reward: SeasonReward = { level_required: 10, is_premium: false, reward_type: 'title' };
      expect(canUnlockReward(reward, 15, false)).toBe(true);
      expect(canUnlockReward(reward, 5, false)).toBe(false);
    });

    it('should check premium requirement', () => {
      const reward: SeasonReward = { level_required: 10, is_premium: true, reward_type: 'frame' };
      expect(canUnlockReward(reward, 15, true)).toBe(true);
      expect(canUnlockReward(reward, 15, false)).toBe(false);
    });

    it('should filter unlockable rewards', () => {
      const rewards: SeasonReward[] = [
        { level_required: 5, is_premium: false, reward_type: 'badge' },
        { level_required: 10, is_premium: false, reward_type: 'title' },
        { level_required: 5, is_premium: true, reward_type: 'frame' },
      ];

      const freeUnlockable = getUnlockableRewards(rewards, 10, false);
      expect(freeUnlockable.length).toBe(2);

      const premiumUnlockable = getUnlockableRewards(rewards, 10, true);
      expect(premiumUnlockable.length).toBe(3);
    });
  });

  describe('Reward Types', () => {
    type RewardType = 'title' | 'frame' | 'theme' | 'badge' | 'xp_boost' | 'coins';

    const getRewardTypeIcon = (type: RewardType): string => {
      const icons: Record<RewardType, string> = {
        title: 'tag',
        frame: 'square',
        theme: 'palette',
        badge: 'award',
        xp_boost: 'zap',
        coins: 'coins',
      };
      return icons[type];
    };

    const isEquippable = (type: RewardType): boolean => {
      return ['title', 'frame', 'theme'].includes(type);
    };

    const isConsumable = (type: RewardType): boolean => {
      return ['xp_boost', 'coins'].includes(type);
    };

    it('should return correct icons', () => {
      expect(getRewardTypeIcon('title')).toBe('tag');
      expect(getRewardTypeIcon('badge')).toBe('award');
    });

    it('should identify equippable rewards', () => {
      expect(isEquippable('title')).toBe(true);
      expect(isEquippable('frame')).toBe(true);
      expect(isEquippable('badge')).toBe(false);
      expect(isEquippable('coins')).toBe(false);
    });

    it('should identify consumable rewards', () => {
      expect(isConsumable('xp_boost')).toBe(true);
      expect(isConsumable('coins')).toBe(true);
      expect(isConsumable('title')).toBe(false);
    });
  });

  describe('Reward Claiming', () => {
    interface UserReward {
      id: string;
      status: 'available' | 'claimed' | 'expired' | 'locked';
      claimed_at: string | null;
      expires_at: string | null;
    }

    const canClaimReward = (reward: UserReward): { canClaim: boolean; reason?: string } => {
      if (reward.status === 'claimed') {
        return { canClaim: false, reason: 'Reward already claimed' };
      }
      if (reward.status === 'expired') {
        return { canClaim: false, reason: 'Reward has expired' };
      }
      if (reward.status === 'locked') {
        return { canClaim: false, reason: 'Reward is locked' };
      }
      if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
        return { canClaim: false, reason: 'Reward has expired' };
      }
      return { canClaim: true };
    };

    it('should allow claiming available rewards', () => {
      const reward: UserReward = {
        id: '1',
        status: 'available',
        claimed_at: null,
        expires_at: new Date(Date.now() + 100000).toISOString(),
      };
      expect(canClaimReward(reward).canClaim).toBe(true);
    });

    it('should reject already claimed rewards', () => {
      const reward: UserReward = {
        id: '1',
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        expires_at: null,
      };
      const result = canClaimReward(reward);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Reward already claimed');
    });

    it('should reject expired rewards', () => {
      const reward: UserReward = {
        id: '1',
        status: 'available',
        claimed_at: null,
        expires_at: new Date(Date.now() - 100000).toISOString(),
      };
      const result = canClaimReward(reward);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Reward has expired');
    });
  });

  describe('Showcase Badges', () => {
    const MAX_SHOWCASE_BADGES = 5;

    const validateShowcaseBadges = (
      selectedBadges: string[],
      ownedBadges: string[]
    ): { valid: boolean; filtered: string[]; error?: string } => {
      if (selectedBadges.length > MAX_SHOWCASE_BADGES) {
        return {
          valid: false,
          filtered: selectedBadges.slice(0, MAX_SHOWCASE_BADGES).filter(id => ownedBadges.includes(id)),
          error: `Maximum ${MAX_SHOWCASE_BADGES} badges allowed`,
        };
      }

      const validBadges = selectedBadges.filter(id => ownedBadges.includes(id));
      if (validBadges.length !== selectedBadges.length) {
        return {
          valid: false,
          filtered: validBadges,
          error: 'Some badges are not owned',
        };
      }

      return { valid: true, filtered: validBadges };
    };

    it('should validate owned badges', () => {
      const result = validateShowcaseBadges(['1', '2', '3'], ['1', '2', '3', '4', '5']);
      expect(result.valid).toBe(true);
      expect(result.filtered).toEqual(['1', '2', '3']);
    });

    it('should filter unowned badges', () => {
      const result = validateShowcaseBadges(['1', '2', '99'], ['1', '2', '3']);
      expect(result.valid).toBe(false);
      expect(result.filtered).toEqual(['1', '2']);
    });

    it('should limit to max badges', () => {
      const result = validateShowcaseBadges(['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4', '5', '6']);
      expect(result.valid).toBe(false);
      expect(result.filtered.length).toBeLessThanOrEqual(MAX_SHOWCASE_BADGES);
    });
  });
});
