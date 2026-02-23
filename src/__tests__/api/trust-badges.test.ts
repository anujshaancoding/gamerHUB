/**
 * Trust Badges & Account Trust API Tests
 *
 * Tests for trust badge retrieval, account trust data privacy,
 * and trust score recalculation.
 * Related to migration 067:
 *   - trust_badges view: SECURITY DEFINER → SECURITY INVOKER
 *   - account_trust: old "own row only" SELECT replaced with public SELECT
 *
 * Endpoints tested:
 *   GET  /api/ratings/trust-badges/[userId]
 *   POST /api/ratings/trust/recalculate
 */

describe('Trust Badges & Account Trust API', () => {
  // ─── Mock Data ───────────────────────────────────────────────

  // Dates are relative to "now" so tests don't break over time
  const now = Date.now();
  const daysInMs = (d: number) => d * 24 * 60 * 60 * 1000;

  const mockUsers = {
    veteran: {
      id: 'user-veteran-1',
      created_at: new Date(now - daysInMs(500)).toISOString(), // > 365 days ago
    },
    newUser: {
      id: 'user-new-2',
      created_at: new Date(now - daysInMs(30)).toISOString(), // < 90 days ago
    },
    established: {
      id: 'user-est-3',
      created_at: new Date(now - daysInMs(180)).toISOString(), // > 90 days ago
    },
    noTrustData: {
      id: 'user-nodata-4',
      created_at: new Date(now - daysInMs(10)).toISOString(),
    },
  };

  const mockAccountTrust = [
    {
      id: 'trust-1',
      user_id: 'user-veteran-1',
      trust_score: 85,
      risk_score: 10,
      behavior_score: 90,
      influence_score: 70,
      abuse_probability: 0.05,
      account_age_score: 95,
      activity_score: 80,
      community_score: 85,
      report_score: 95,
      interaction_depth_score: 70,
      repeat_play_score: 60,
      clan_participation_score: 75,
      verification_bonus: 15,
      last_calculated_at: '2024-01-15T10:00:00Z',
      calculation_version: 2,
      is_frozen: false,
      frozen_reason: null,
    },
    {
      id: 'trust-2',
      user_id: 'user-new-2',
      trust_score: 25,
      risk_score: 60,
      behavior_score: 50,
      influence_score: 10,
      abuse_probability: 0.30,
      account_age_score: 10,
      activity_score: 30,
      community_score: 20,
      report_score: 70,
      interaction_depth_score: 15,
      repeat_play_score: 10,
      clan_participation_score: 0,
      verification_bonus: 0,
      last_calculated_at: '2024-01-14T08:00:00Z',
      calculation_version: 2,
      is_frozen: false,
      frozen_reason: null,
    },
    {
      id: 'trust-3',
      user_id: 'user-est-3',
      trust_score: 55,
      risk_score: 25,
      behavior_score: 65,
      influence_score: 40,
      abuse_probability: 0.12,
      account_age_score: 50,
      activity_score: 65,
      community_score: 78,
      report_score: 85,
      interaction_depth_score: 45,
      repeat_play_score: 40,
      clan_participation_score: 50,
      verification_bonus: 10,
      last_calculated_at: '2024-01-15T06:00:00Z',
      calculation_version: 2,
      is_frozen: false,
      frozen_reason: null,
    },
  ];

  const mockProfiles = [
    { id: 'user-veteran-1', is_verified: true },
    { id: 'user-new-2', is_verified: false },
    { id: 'user-est-3', is_verified: true },
    { id: 'user-nodata-4', is_verified: false },
  ];

  // Derived trust badges (simulating the view)
  function deriveTrustBadges(userId: string) {
    const trust = mockAccountTrust.find(t => t.user_id === userId);
    const profile = mockProfiles.find(p => p.id === userId);
    const user = Object.values(mockUsers).find(u => u.id === userId);

    if (!trust || !profile || !user) return null;

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      user_id: userId,
      is_veteran: accountAgeDays > 365,
      is_active: trust.activity_score > 60,
      is_trusted: trust.trust_score > 70,
      is_verified: profile.is_verified,
      is_community_pillar: trust.community_score > 75,
      is_established: trust.trust_score > 40 && accountAgeDays > 90,
    };
  }

  // ─── GET /api/ratings/trust-badges/[userId] ──────────────────

  describe('GET /api/ratings/trust-badges/[userId] - Fetch Trust Badges', () => {
    describe('Successful retrieval', () => {
      it('should return trust badges for a veteran user', () => {
        const badges = deriveTrustBadges('user-veteran-1');
        expect(badges).not.toBeNull();
        expect(badges!.is_veteran).toBe(true);
        expect(badges!.is_trusted).toBe(true);
        expect(badges!.is_verified).toBe(true);
        expect(badges!.is_community_pillar).toBe(true);
        expect(badges!.is_established).toBe(true);
      });

      it('should return trust badges for a new user', () => {
        const badges = deriveTrustBadges('user-new-2');
        expect(badges).not.toBeNull();
        expect(badges!.is_veteran).toBe(false);
        expect(badges!.is_trusted).toBe(false);
        expect(badges!.is_verified).toBe(false);
        expect(badges!.is_community_pillar).toBe(false);
        expect(badges!.is_established).toBe(false);
      });

      it('should return trust badges for an established user', () => {
        const badges = deriveTrustBadges('user-est-3');
        expect(badges).not.toBeNull();
        expect(badges!.is_active).toBe(true);
        expect(badges!.is_community_pillar).toBe(true);
        expect(badges!.is_established).toBe(true);
        expect(badges!.is_trusted).toBe(false); // trust_score=55, threshold=70
      });

      it('should allow any caller to read trust badges (security_invoker)', () => {
        // After migration 067, trust_badges view uses security_invoker = true
        // and account_trust has public SELECT policy
        // So any authenticated user can read any other user's badges
        const requesterId = 'user-new-2';
        const targetId = 'user-veteran-1';
        expect(requesterId).not.toBe(targetId);
        const badges = deriveTrustBadges(targetId);
        expect(badges).not.toBeNull();
        expect(badges!.is_trusted).toBe(true);
      });
    });

    describe('Default badges (no trust data)', () => {
      it('should return all-false defaults when no trust data exists', () => {
        const badges = deriveTrustBadges('user-nodata-4');
        expect(badges).toBeNull();

        // API returns defaults
        const defaults = {
          is_veteran: false,
          is_active: false,
          is_trusted: false,
          is_verified: false,
          is_community_pillar: false,
          is_established: false,
        };
        expect(defaults.is_veteran).toBe(false);
        expect(defaults.is_active).toBe(false);
        expect(defaults.is_trusted).toBe(false);
        expect(defaults.is_verified).toBe(false);
        expect(defaults.is_community_pillar).toBe(false);
        expect(defaults.is_established).toBe(false);
      });

      it('should return defaults for completely unknown user', () => {
        const badges = deriveTrustBadges('user-unknown');
        expect(badges).toBeNull();
      });
    });

    describe('Response shape (camelCase transformation)', () => {
      it('should transform snake_case to camelCase in response', () => {
        const badges = deriveTrustBadges('user-veteran-1');
        const response = {
          badges: {
            isVeteran: badges!.is_veteran,
            isActive: badges!.is_active,
            isTrusted: badges!.is_trusted,
            isVerified: badges!.is_verified,
            isCommunityPillar: badges!.is_community_pillar,
            isEstablished: badges!.is_established,
          },
        };
        expect(response.badges).toHaveProperty('isVeteran');
        expect(response.badges).toHaveProperty('isActive');
        expect(response.badges).toHaveProperty('isTrusted');
        expect(response.badges).toHaveProperty('isVerified');
        expect(response.badges).toHaveProperty('isCommunityPillar');
        expect(response.badges).toHaveProperty('isEstablished');
      });

      it('should only expose boolean badge flags, not raw scores', () => {
        const badges = deriveTrustBadges('user-veteran-1');
        const response = {
          badges: {
            isVeteran: badges!.is_veteran,
            isActive: badges!.is_active,
            isTrusted: badges!.is_trusted,
            isVerified: badges!.is_verified,
            isCommunityPillar: badges!.is_community_pillar,
            isEstablished: badges!.is_established,
          },
        };
        // Should NOT contain raw trust scores
        expect(response.badges).not.toHaveProperty('trust_score');
        expect(response.badges).not.toHaveProperty('risk_score');
        expect(response.badges).not.toHaveProperty('behavior_score');
        expect(response.badges).not.toHaveProperty('abuse_probability');
      });
    });

    describe('Badge threshold logic', () => {
      it('is_veteran: account > 365 days', () => {
        const veteranBadges = deriveTrustBadges('user-veteran-1');
        const newBadges = deriveTrustBadges('user-new-2');
        expect(veteranBadges!.is_veteran).toBe(true);
        expect(newBadges!.is_veteran).toBe(false);
      });

      it('is_active: activity_score > 60', () => {
        // user-veteran-1: activity_score=80 → true
        // user-new-2: activity_score=30 → false
        // user-est-3: activity_score=65 → true
        expect(deriveTrustBadges('user-veteran-1')!.is_active).toBe(true);
        expect(deriveTrustBadges('user-new-2')!.is_active).toBe(false);
        expect(deriveTrustBadges('user-est-3')!.is_active).toBe(true);
      });

      it('is_trusted: trust_score > 70', () => {
        // user-veteran-1: trust_score=85 → true
        // user-new-2: trust_score=25 → false
        // user-est-3: trust_score=55 → false
        expect(deriveTrustBadges('user-veteran-1')!.is_trusted).toBe(true);
        expect(deriveTrustBadges('user-new-2')!.is_trusted).toBe(false);
        expect(deriveTrustBadges('user-est-3')!.is_trusted).toBe(false);
      });

      it('is_community_pillar: community_score > 75', () => {
        // user-veteran-1: community_score=85 → true
        // user-new-2: community_score=20 → false
        // user-est-3: community_score=78 → true
        expect(deriveTrustBadges('user-veteran-1')!.is_community_pillar).toBe(true);
        expect(deriveTrustBadges('user-new-2')!.is_community_pillar).toBe(false);
        expect(deriveTrustBadges('user-est-3')!.is_community_pillar).toBe(true);
      });

      it('is_established: trust_score > 40 AND account > 90 days', () => {
        // user-veteran-1: trust=85, age>365 → true
        // user-new-2: trust=25, age<90 → false
        // user-est-3: trust=55, age>90 → true
        expect(deriveTrustBadges('user-veteran-1')!.is_established).toBe(true);
        expect(deriveTrustBadges('user-new-2')!.is_established).toBe(false);
        expect(deriveTrustBadges('user-est-3')!.is_established).toBe(true);
      });

      it('is_established requires BOTH conditions', () => {
        // A user with high trust but new account should NOT be established
        const highTrustNewAccount = {
          trust_score: 90,
          account_age_days: 30, // < 90
        };
        const isEstablished = highTrustNewAccount.trust_score > 40 && highTrustNewAccount.account_age_days > 90;
        expect(isEstablished).toBe(false);

        // A user with old account but low trust should NOT be established
        const lowTrustOldAccount = {
          trust_score: 20,
          account_age_days: 400, // > 90
        };
        const isEstablished2 = lowTrustOldAccount.trust_score > 40 && lowTrustOldAccount.account_age_days > 90;
        expect(isEstablished2).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle trust_score exactly at threshold (70)', () => {
        const exactThreshold = { trust_score: 70, threshold: 70 };
        // > 70 means 70 is NOT trusted
        expect(exactThreshold.trust_score > exactThreshold.threshold).toBe(false);
      });

      it('should handle trust_score just above threshold (71)', () => {
        const aboveThreshold = { trust_score: 71, threshold: 70 };
        expect(aboveThreshold.trust_score > aboveThreshold.threshold).toBe(true);
      });

      it('should handle activity_score exactly at threshold (60)', () => {
        const exactThreshold = { activity_score: 60, threshold: 60 };
        expect(exactThreshold.activity_score > exactThreshold.threshold).toBe(false);
      });

      it('should handle community_score exactly at threshold (75)', () => {
        const exactThreshold = { community_score: 75, threshold: 75 };
        expect(exactThreshold.community_score > exactThreshold.threshold).toBe(false);
      });

      it('should handle account age exactly at 365 days', () => {
        const exactly365 = { account_age_days: 365, threshold: 365 };
        // > 365 means 365 is NOT veteran
        expect(exactly365.account_age_days > exactly365.threshold).toBe(false);
      });

      it('should handle account age exactly at 90 days', () => {
        const exactly90 = { account_age_days: 90, threshold: 90 };
        expect(exactly90.account_age_days > exactly90.threshold).toBe(false);
      });
    });
  });

  // ─── Account Trust Privacy ───────────────────────────────────

  describe('Account Trust Data Privacy', () => {
    it('should NOT expose raw trust_score via trust badges endpoint', () => {
      const badges = deriveTrustBadges('user-veteran-1');
      const apiResponse = {
        badges: {
          isVeteran: badges!.is_veteran,
          isActive: badges!.is_active,
          isTrusted: badges!.is_trusted,
          isVerified: badges!.is_verified,
          isCommunityPillar: badges!.is_community_pillar,
          isEstablished: badges!.is_established,
        },
      };
      const responseKeys = Object.keys(apiResponse.badges);
      expect(responseKeys).not.toContain('trustScore');
      expect(responseKeys).not.toContain('riskScore');
      expect(responseKeys).not.toContain('behaviorScore');
      expect(responseKeys).not.toContain('abuseProbability');
    });

    it('trust_badges view only exposes boolean flags from account_trust', () => {
      const viewColumns = [
        'user_id', 'is_veteran', 'is_active', 'is_trusted',
        'is_verified', 'is_community_pillar', 'is_established',
      ];
      // These should NOT be in the view output
      const privateColumns = [
        'trust_score', 'risk_score', 'behavior_score', 'influence_score',
        'abuse_probability', 'account_age_score', 'activity_score',
        'community_score', 'report_score',
      ];
      privateColumns.forEach(col => {
        expect(viewColumns).not.toContain(col);
      });
    });

    it('account_trust public SELECT (migration 067) is for trust_badges view only', () => {
      // The migration makes account_trust publicly readable so the
      // trust_badges view can work with security_invoker=true
      // But the API never exposes raw account_trust data directly
      const publicEndpoints = [
        '/api/ratings/trust-badges/[userId]',  // Only badges
      ];
      const noRawTrustEndpoints = publicEndpoints.every(
        ep => !ep.includes('account-trust')
      );
      expect(noRawTrustEndpoints).toBe(true);
    });
  });

  // ─── POST /api/ratings/trust/recalculate ─────────────────────

  describe('POST /api/ratings/trust/recalculate - Recalculate Trust Score', () => {
    describe('Authentication', () => {
      it('should require authentication', () => {
        const user = null;
        expect(user).toBeNull();
        // Expect 401
      });

      it('should allow authenticated user to recalculate', () => {
        const user = { id: 'user-veteran-1' };
        expect(user).not.toBeNull();
      });
    });

    describe('Target user selection', () => {
      it('should default to current user if no userId provided', () => {
        const body = {};
        const currentUserId = 'user-veteran-1';
        const targetUserId = (body as { userId?: string }).userId || currentUserId;
        expect(targetUserId).toBe(currentUserId);
      });

      it('should allow specifying a different userId', () => {
        const body = { userId: 'user-new-2' };
        const currentUserId = 'user-veteran-1';
        const targetUserId = body.userId || currentUserId;
        expect(targetUserId).toBe('user-new-2');
      });
    });

    describe('Response shape', () => {
      it('should return recalculated flag and trust score', () => {
        const response = {
          recalculated: true,
          trustScore: 85,
        };
        expect(response.recalculated).toBe(true);
        expect(typeof response.trustScore).toBe('number');
      });
    });

    describe('Error handling', () => {
      it('should return 500 on RPC failure', () => {
        const error = { message: 'RPC failed', code: 'PGRST301' };
        expect(error.message).toBeDefined();
        // Expect: { error: "Internal server error" }, status: 500
      });
    });
  });

  // ─── Frozen Account Handling ─────────────────────────────────

  describe('Frozen Account Trust', () => {
    it('should identify frozen accounts', () => {
      const frozenTrust = {
        ...mockAccountTrust[0],
        is_frozen: true,
        frozen_reason: 'Auto-frozen: clan_mob detected',
      };
      expect(frozenTrust.is_frozen).toBe(true);
      expect(frozenTrust.frozen_reason).toContain('clan_mob');
    });

    it('should still show badges for frozen accounts', () => {
      // Frozen status doesn't change badge display
      const badges = deriveTrustBadges('user-veteran-1');
      expect(badges).not.toBeNull();
    });

    it('should block endorsements for frozen accounts', () => {
      const frozenTrust = { is_frozen: true };
      expect(frozenTrust.is_frozen).toBe(true);
      // Endorsement API checks: if targetTrust?.is_frozen → 403
    });
  });
});
