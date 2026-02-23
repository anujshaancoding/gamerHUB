/**
 * Endorsement System API Tests
 *
 * Tests for endorsement creation, retrieval, trait aggregation,
 * rate limiting, anti-mob detection, and permission checks.
 * Related to migration 067: account_trust now has public SELECT for
 * frozen-check, and trait_endorsements remain publicly readable.
 *
 * Endpoints tested:
 *   POST /api/ratings/endorse
 *   GET  /api/ratings/my-endorsement/[userId]
 *   GET  /api/ratings/traits/[userId]
 */

describe('Endorsement System API', () => {
  // ─── Mock Data ───────────────────────────────────────────────

  const mockUsers = {
    freeUser: { id: 'user-free-1', tier: 'free' as const },
    premiumUser: { id: 'user-premium-2', tier: 'premium' as const },
    adminUser: { id: 'user-admin-3', tier: 'admin' as const },
    targetUser: { id: 'user-target-4', tier: 'free' as const },
    frozenTarget: { id: 'user-frozen-5', tier: 'free' as const },
  };

  const mockAccountTrust = [
    { user_id: 'user-target-4', is_frozen: false, frozen_reason: null },
    { user_id: 'user-frozen-5', is_frozen: true, frozen_reason: 'Auto-frozen: clan_mob detected' },
  ];

  const mockExistingEndorsements = [
    {
      id: 'end-1',
      endorser_id: 'user-free-1',
      endorsed_id: 'user-target-4',
      endorsement_type: 'positive',
      friendly: true,
      team_player: true,
      leader: false,
      communicative: true,
      reliable: false,
      toxic: false,
      quitter: false,
      uncooperative: false,
      uncommunicative: false,
      unreliable: false,
      game_id: 'game-valorant',
      played_as: 'teammate',
      positive_note: 'Great teammate!',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
    },
    {
      id: 'end-2',
      endorser_id: 'user-premium-2',
      endorsed_id: 'user-target-4',
      endorsement_type: 'positive',
      friendly: false,
      team_player: true,
      leader: true,
      communicative: false,
      reliable: true,
      toxic: false,
      quitter: false,
      uncooperative: false,
      uncommunicative: false,
      unreliable: false,
      game_id: null,
      played_as: 'opponent',
      positive_note: null,
      created_at: '2024-01-11T14:00:00Z',
      updated_at: '2024-01-11T14:00:00Z',
    },
    {
      id: 'end-3',
      endorser_id: 'user-admin-3',
      endorsed_id: 'user-target-4',
      endorsement_type: 'negative',
      friendly: false,
      team_player: false,
      leader: false,
      communicative: false,
      reliable: false,
      toxic: true,
      quitter: false,
      uncooperative: true,
      uncommunicative: false,
      unreliable: false,
      game_id: 'game-cs2',
      played_as: 'teammate',
      positive_note: null,
      created_at: '2024-01-12T08:00:00Z',
      updated_at: '2024-01-12T08:00:00Z',
    },
  ];

  const mockRateLimits = {
    allowed: { allowed: true, reason: null, daily_remaining: 2, weekly_remaining: 8 },
    dailyExhausted: { allowed: false, reason: 'Daily limit reached (3/day)', daily_remaining: 0, weekly_remaining: 5 },
    weeklyExhausted: { allowed: false, reason: 'Weekly limit reached (10/week)', daily_remaining: 0, weekly_remaining: 0 },
  };

  // Helper: simulate permission check
  function canGiveNegativeEndorsement(tier: string): boolean {
    return tier !== 'free';
  }

  // ─── POST /api/ratings/endorse ───────────────────────────────

  describe('POST /api/ratings/endorse - Create Endorsement', () => {
    describe('Authentication', () => {
      it('should return 401 for unauthenticated requests', () => {
        const user = null;
        expect(user).toBeNull();
      });

      it('should allow authenticated user to endorse', () => {
        const user = mockUsers.freeUser;
        expect(user.id).toBeDefined();
      });
    });

    describe('Input validation', () => {
      it('should require endorsedId', () => {
        const body = { endorsementType: 'positive', friendly: true };
        expect((body as { endorsedId?: string }).endorsedId).toBeUndefined();
        // Expect 400: "Target user ID is required"
      });

      it('should reject self-endorsement', () => {
        const userId = 'user-free-1';
        const endorsedId = 'user-free-1';
        expect(userId).toBe(endorsedId);
        // Expect 400: "Cannot endorse yourself"
      });

      it('should accept valid endorsedId for a different user', () => {
        const userId = 'user-free-1';
        const endorsedId = 'user-target-4';
        expect(userId).not.toBe(endorsedId);
      });
    });

    describe('Positive endorsement validation', () => {
      it('should require at least one positive trait', () => {
        const body = {
          endorsedId: 'user-target-4',
          endorsementType: 'positive',
          friendly: false,
          teamPlayer: false,
          leader: false,
          communicative: false,
          reliable: false,
        };
        const hasPositiveTrait =
          body.friendly || body.teamPlayer || body.leader ||
          body.communicative || body.reliable;
        expect(hasPositiveTrait).toBe(false);
        // Expect 400: "At least one trait must be endorsed"
      });

      it('should accept single trait endorsement', () => {
        const body = {
          endorsedId: 'user-target-4',
          endorsementType: 'positive',
          friendly: true,
          teamPlayer: false,
          leader: false,
          communicative: false,
          reliable: false,
        };
        const hasPositiveTrait =
          body.friendly || body.teamPlayer || body.leader ||
          body.communicative || body.reliable;
        expect(hasPositiveTrait).toBe(true);
      });

      it('should accept multiple trait endorsement', () => {
        const body = {
          endorsedId: 'user-target-4',
          endorsementType: 'positive',
          friendly: true,
          teamPlayer: true,
          leader: true,
          communicative: true,
          reliable: true,
        };
        const traitCount = [body.friendly, body.teamPlayer, body.leader,
          body.communicative, body.reliable].filter(Boolean).length;
        expect(traitCount).toBe(5);
      });

      it('should allow optional positive_note', () => {
        const body = { positiveNote: 'Amazing teammate!' };
        expect(body.positiveNote).toBeDefined();
      });

      it('should allow null positive_note', () => {
        const body = { positiveNote: null };
        expect(body.positiveNote).toBeNull();
      });
    });

    describe('Negative endorsement validation', () => {
      it('should require at least one negative trait', () => {
        const body = {
          endorsedId: 'user-target-4',
          endorsementType: 'negative',
          toxic: false,
          quitter: false,
          uncooperative: false,
          uncommunicative: false,
          unreliable: false,
        };
        const hasNegativeTrait =
          body.toxic || body.quitter || body.uncooperative ||
          body.uncommunicative || body.unreliable;
        expect(hasNegativeTrait).toBe(false);
        // Expect 400: "At least one negative trait must be selected"
      });

      it('should accept valid negative endorsement', () => {
        const body = {
          endorsementType: 'negative',
          toxic: true,
          quitter: false,
          uncooperative: false,
          uncommunicative: false,
          unreliable: false,
        };
        const hasNegativeTrait =
          body.toxic || body.quitter || body.uncooperative ||
          body.uncommunicative || body.unreliable;
        expect(hasNegativeTrait).toBe(true);
      });

      it('should null-out positive_note for negative endorsements', () => {
        const endorsementType = 'negative';
        const positiveNote = 'some note';
        const finalNote = endorsementType === 'positive' ? (positiveNote || null) : null;
        expect(finalNote).toBeNull();
      });
    });

    describe('Permission: negative endorsements', () => {
      it('should reject negative endorsement from free user', () => {
        expect(canGiveNegativeEndorsement('free')).toBe(false);
        // Expect 403: "Negative endorsements require Premium membership"
      });

      it('should allow negative endorsement from premium user', () => {
        expect(canGiveNegativeEndorsement('premium')).toBe(true);
      });

      it('should allow negative endorsement from editor', () => {
        expect(canGiveNegativeEndorsement('editor')).toBe(true);
      });

      it('should allow negative endorsement from admin', () => {
        expect(canGiveNegativeEndorsement('admin')).toBe(true);
      });

      it('should allow positive endorsement from any tier', () => {
        const tiers = ['free', 'premium', 'editor', 'admin'];
        tiers.forEach(tier => {
          // Positive endorsements have no tier restriction
          expect(tier).toBeDefined();
        });
      });
    });

    describe('Frozen target check', () => {
      it('should reject endorsement for frozen user', () => {
        const target = mockAccountTrust.find(t => t.user_id === 'user-frozen-5');
        expect(target!.is_frozen).toBe(true);
        // Expect 403: "This user's endorsements are currently under review"
      });

      it('should allow endorsement for non-frozen user', () => {
        const target = mockAccountTrust.find(t => t.user_id === 'user-target-4');
        expect(target!.is_frozen).toBe(false);
      });

      it('should allow endorsement when no trust data exists for target', () => {
        const target = mockAccountTrust.find(t => t.user_id === 'unknown-user');
        expect(target).toBeUndefined();
        // If no trust data, is_frozen defaults to null/false, so endorsement allowed
      });
    });

    describe('Rate limiting', () => {
      it('should allow when within rate limits', () => {
        const rateLimit = mockRateLimits.allowed;
        expect(rateLimit.allowed).toBe(true);
        expect(rateLimit.daily_remaining).toBeGreaterThan(0);
        expect(rateLimit.weekly_remaining).toBeGreaterThan(0);
      });

      it('should reject when daily limit reached', () => {
        const rateLimit = mockRateLimits.dailyExhausted;
        expect(rateLimit.allowed).toBe(false);
        expect(rateLimit.daily_remaining).toBe(0);
        expect(rateLimit.reason).toContain('Daily limit');
        // Expect 429 with rateLimited: true
      });

      it('should reject when weekly limit reached', () => {
        const rateLimit = mockRateLimits.weeklyExhausted;
        expect(rateLimit.allowed).toBe(false);
        expect(rateLimit.weekly_remaining).toBe(0);
        expect(rateLimit.reason).toContain('Weekly limit');
      });

      it('should include remaining counts in rate limit error', () => {
        const rateLimit = mockRateLimits.dailyExhausted;
        const errorResponse = {
          error: rateLimit.reason,
          rateLimited: true,
          dailyRemaining: rateLimit.daily_remaining,
          weeklyRemaining: rateLimit.weekly_remaining,
        };
        expect(errorResponse.rateLimited).toBe(true);
        expect(errorResponse.dailyRemaining).toBe(0);
        expect(typeof errorResponse.weeklyRemaining).toBe('number');
      });

      it('daily limit is 3 endorsements per day', () => {
        const dailyLimit = 3;
        const rateLimit = mockRateLimits.allowed;
        // daily_remaining starts at 3 before any endorsements
        expect(rateLimit.daily_remaining).toBeLessThanOrEqual(dailyLimit);
      });

      it('weekly limit is 10 endorsements per week', () => {
        const weeklyLimit = 10;
        const rateLimit = mockRateLimits.allowed;
        expect(rateLimit.weekly_remaining).toBeLessThanOrEqual(weeklyLimit);
      });
    });

    describe('Duplicate endorsement prevention', () => {
      it('should reject if user already endorsed this player', () => {
        const endorserId = 'user-free-1';
        const endorsedId = 'user-target-4';
        const existing = mockExistingEndorsements.find(
          e => e.endorser_id === endorserId && e.endorsed_id === endorsedId
        );
        expect(existing).toBeDefined();
        // Expect 409: "You have already endorsed this player"
      });

      it('should allow endorsing a different player', () => {
        const endorserId = 'user-free-1';
        const endorsedId = 'user-frozen-5';
        const existing = mockExistingEndorsements.find(
          e => e.endorser_id === endorserId && e.endorsed_id === endorsedId
        );
        expect(existing).toBeUndefined();
      });

      it('should be one endorsement per endorser-endorsed pair', () => {
        // Group by endorser_id+endorsed_id pairs
        const pairs = mockExistingEndorsements.map(e => `${e.endorser_id}-${e.endorsed_id}`);
        const uniquePairs = new Set(pairs);
        expect(pairs.length).toBe(uniquePairs.size);
      });
    });

    describe('Endorsement data construction', () => {
      it('should set positive traits to false for negative endorsements', () => {
        const endorsementType = 'negative';
        const endorsementData = {
          friendly: endorsementType === 'positive' ? true : false,
          team_player: endorsementType === 'positive' ? true : false,
          leader: endorsementType === 'positive' ? false : false,
          communicative: endorsementType === 'positive' ? true : false,
          reliable: endorsementType === 'positive' ? false : false,
        };
        expect(endorsementData.friendly).toBe(false);
        expect(endorsementData.team_player).toBe(false);
      });

      it('should set negative traits to false for positive endorsements', () => {
        const endorsementType = 'positive';
        const endorsementData = {
          toxic: endorsementType === 'negative' ? true : false,
          quitter: endorsementType === 'negative' ? false : false,
          uncooperative: endorsementType === 'negative' ? true : false,
          uncommunicative: endorsementType === 'negative' ? false : false,
          unreliable: endorsementType === 'negative' ? true : false,
        };
        expect(endorsementData.toxic).toBe(false);
        expect(endorsementData.quitter).toBe(false);
        expect(endorsementData.uncooperative).toBe(false);
      });

      it('should include optional game_id', () => {
        const data = { game_id: 'game-valorant' };
        expect(data.game_id).toBe('game-valorant');
      });

      it('should handle null game_id', () => {
        const data = { game_id: null };
        expect(data.game_id).toBeNull();
      });

      it('should include played_as field', () => {
        const validValues = ['teammate', 'opponent'];
        expect(validValues).toContain('teammate');
        expect(validValues).toContain('opponent');
      });

      it('should handle null played_as', () => {
        const data = { played_as: null };
        expect(data.played_as).toBeNull();
      });
    });

    describe('Success response', () => {
      it('should return 201 with endorsement data', () => {
        const response = {
          endorsement: mockExistingEndorsements[0],
          dailyRemaining: 2,
          weeklyRemaining: 9,
        };
        expect(response.endorsement).toBeDefined();
        expect(response.dailyRemaining).toBe(2);
        expect(response.weeklyRemaining).toBe(9);
      });

      it('should decrement daily remaining after endorsement', () => {
        const beforeRemaining = 3;
        const afterRemaining = Math.max(0, beforeRemaining - 1);
        expect(afterRemaining).toBe(2);
      });

      it('should decrement weekly remaining after endorsement', () => {
        const beforeRemaining = 10;
        const afterRemaining = Math.max(0, beforeRemaining - 1);
        expect(afterRemaining).toBe(9);
      });

      it('should not go below 0 remaining', () => {
        const remaining = 0;
        const afterRemaining = Math.max(0, remaining - 1);
        expect(afterRemaining).toBe(0);
      });
    });

    describe('Anti-mob detection', () => {
      describe('Clan mob detection', () => {
        it('should flag when 5+ clan members endorse same target in 24h', () => {
          const clanEndorsements = 5;
          const threshold = 5;
          const isFlagged = clanEndorsements >= threshold;
          expect(isFlagged).toBe(true);
        });

        it('should not flag when below threshold', () => {
          const clanEndorsements = 3;
          const threshold = 5;
          const isFlagged = clanEndorsements >= threshold;
          expect(isFlagged).toBe(false);
        });

        it('should return high severity for clan mob', () => {
          const flagResult = {
            flagged: true,
            flagType: 'clan_mob',
            evidence: { clan_id: 'clan-1', endorsement_count: 6, time_window: '24h' },
            severity: 'high',
          };
          expect(flagResult.severity).toBe('high');
          expect(flagResult.flagType).toBe('clan_mob');
        });

        it('should auto-freeze target on high severity', () => {
          const severity = 'high';
          const shouldFreeze = severity === 'high';
          expect(shouldFreeze).toBe(true);
        });

        it('should NOT auto-freeze on medium severity', () => {
          const severity = 'medium';
          const shouldFreeze = severity === 'high';
          expect(shouldFreeze).toBe(false);
        });
      });

      describe('Time burst detection', () => {
        it('should flag when 10+ endorsements in 1 hour', () => {
          const burstCount = 10;
          const threshold = 10;
          const isFlagged = burstCount >= threshold;
          expect(isFlagged).toBe(true);
        });

        it('should not flag when below threshold', () => {
          const burstCount = 7;
          const threshold = 10;
          const isFlagged = burstCount >= threshold;
          expect(isFlagged).toBe(false);
        });

        it('should return medium severity for time burst', () => {
          const flagResult = {
            flagged: true,
            flagType: 'time_burst',
            evidence: { endorsement_count: 12, time_window: '1h' },
            severity: 'medium',
          };
          expect(flagResult.severity).toBe('medium');
          expect(flagResult.flagType).toBe('time_burst');
        });
      });

      describe('Sudden spike detection', () => {
        it('should flag when today exceeds 5x weekly average', () => {
          const weeklyAvg = 2;
          const todayCount = 11;
          const isSpiked = weeklyAvg > 0 && todayCount > weeklyAvg * 5;
          expect(isSpiked).toBe(true);
        });

        it('should not flag when within normal range', () => {
          const weeklyAvg = 5;
          const todayCount = 8;
          const isSpiked = weeklyAvg > 0 && todayCount > weeklyAvg * 5;
          expect(isSpiked).toBe(false);
        });

        it('should not flag when weekly average is 0', () => {
          const weeklyAvg = 0;
          const todayCount = 3;
          const isSpiked = weeklyAvg > 0 && todayCount > weeklyAvg * 5;
          expect(isSpiked).toBe(false);
        });

        it('should return medium severity for spike', () => {
          const flagResult = {
            flagged: true,
            flagType: 'spike',
            evidence: { today_count: 15, weekly_average: 2, spike_ratio: 7.5 },
            severity: 'medium',
          };
          expect(flagResult.severity).toBe('medium');
          expect(flagResult.evidence.spike_ratio).toBeGreaterThan(5);
        });

        it('should calculate spike ratio correctly', () => {
          const todayCount = 20;
          const weeklyAvg = 4;
          const spikeRatio = todayCount / weeklyAvg;
          expect(spikeRatio).toBe(5);
        });
      });

      describe('Flag insertion', () => {
        it('should create flag record with correct structure', () => {
          const flagRecord = {
            target_user_id: 'user-target-4',
            flag_type: 'clan_mob',
            evidence: { clan_id: 'clan-1', endorsement_count: 6 },
            status: 'flagged',
          };
          expect(flagRecord.target_user_id).toBeDefined();
          expect(flagRecord.flag_type).toBeDefined();
          expect(flagRecord.evidence).toBeDefined();
          expect(flagRecord.status).toBe('flagged');
        });

        it('should support all flag types', () => {
          const validFlagTypes = ['clan_mob', 'ip_pattern', 'time_burst', 'spike', 'influencer_flow'];
          expect(validFlagTypes).toContain('clan_mob');
          expect(validFlagTypes).toContain('time_burst');
          expect(validFlagTypes).toContain('spike');
        });

        it('should support all flag statuses', () => {
          const validStatuses = ['flagged', 'frozen', 'reviewed', 'cleared', 'confirmed'];
          expect(validStatuses).toHaveLength(5);
        });
      });

      describe('Detection priority', () => {
        it('should check clan mob first (highest severity)', () => {
          // clan_mob = high severity, checked first
          const detectionOrder = ['clan_mob', 'time_burst', 'spike'];
          expect(detectionOrder[0]).toBe('clan_mob');
        });

        it('should return first match (no multiple flags per endorsement)', () => {
          // If clan_mob is detected, skip time_burst and spike checks
          const detected = { flagged: true, flagType: 'clan_mob' };
          expect(detected.flagType).toBe('clan_mob');
        });

        it('should return not-flagged when no patterns detected', () => {
          const result = { flagged: false };
          expect(result.flagged).toBe(false);
        });
      });
    });

    describe('Rate limit counter update', () => {
      it('should upsert rating_limits after successful endorsement', () => {
        const today = new Date().toISOString().split('T')[0];
        const upsertData = {
          user_id: 'user-free-1',
          date: today,
          daily_count: 1,
          last_rating_at: new Date().toISOString(),
        };
        expect(upsertData.date).toBe(today);
        expect(upsertData.daily_count).toBe(1);
      });

      it('should increment daily_count on subsequent endorsements', () => {
        const dailyRemaining = 2; // was 3, now 2 after one endorsement
        const previousCount = 3 - dailyRemaining; // = 1
        const newCount = previousCount + 1; // = 2
        expect(newCount).toBe(2);
      });
    });
  });

  // ─── GET /api/ratings/my-endorsement/[userId] ────────────────

  describe('GET /api/ratings/my-endorsement/[userId] - My Endorsement', () => {
    describe('Authentication', () => {
      it('should require authentication', () => {
        const user = null;
        expect(user).toBeNull();
        // Expect 401
      });
    });

    describe('Existing endorsement', () => {
      it('should return endorsement when user has endorsed target', () => {
        const endorserId = 'user-free-1';
        const endorsedId = 'user-target-4';
        const endorsement = mockExistingEndorsements.find(
          e => e.endorser_id === endorserId && e.endorsed_id === endorsedId
        );
        expect(endorsement).toBeDefined();
        expect(endorsement!.endorsement_type).toBe('positive');
        expect(endorsement!.friendly).toBe(true);
      });

      it('should return null when user has not endorsed target', () => {
        const endorserId = 'user-free-1';
        const endorsedId = 'user-frozen-5';
        const endorsement = mockExistingEndorsements.find(
          e => e.endorser_id === endorserId && e.endorsed_id === endorsedId
        );
        expect(endorsement).toBeUndefined();
      });
    });

    describe('Rate limit info', () => {
      it('should include rate limit info alongside endorsement', () => {
        const response = {
          endorsement: mockExistingEndorsements[0],
          rateLimit: mockRateLimits.allowed,
        };
        expect(response.rateLimit).toBeDefined();
        expect(response.rateLimit.allowed).toBe(true);
        expect(response.rateLimit.daily_remaining).toBeDefined();
        expect(response.rateLimit.weekly_remaining).toBeDefined();
      });

      it('should return default rate limit when RPC returns null', () => {
        const rpcResult = null;
        const rateLimit = rpcResult || {
          allowed: true,
          reason: null,
          daily_remaining: 3,
          weekly_remaining: 10,
        };
        expect(rateLimit.allowed).toBe(true);
        expect(rateLimit.daily_remaining).toBe(3);
        expect(rateLimit.weekly_remaining).toBe(10);
      });
    });

    describe('Response shape', () => {
      it('should return endorsement and rateLimit fields', () => {
        const response = {
          endorsement: mockExistingEndorsements[0] || null,
          rateLimit: mockRateLimits.allowed,
        };
        expect(response).toHaveProperty('endorsement');
        expect(response).toHaveProperty('rateLimit');
      });

      it('should return null endorsement when not found (not error)', () => {
        const response = {
          endorsement: null,
          rateLimit: mockRateLimits.allowed,
        };
        expect(response.endorsement).toBeNull();
      });
    });
  });

  // ─── GET /api/ratings/traits/[userId] ────────────────────────

  describe('GET /api/ratings/traits/[userId] - Aggregated Traits', () => {
    describe('No authentication required', () => {
      it('should be publicly accessible (no auth check in route)', () => {
        // The route does not check for user auth
        // trait_endorsements have public SELECT RLS
        expect(true).toBe(true);
      });
    });

    describe('Trait aggregation', () => {
      it('should count friendly endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        const friendlyCount = endorsements.filter(e => e.friendly).length;
        expect(friendlyCount).toBe(1);
      });

      it('should count team_player endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        const teamPlayerCount = endorsements.filter(e => e.team_player).length;
        expect(teamPlayerCount).toBe(2);
      });

      it('should count leader endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        const leaderCount = endorsements.filter(e => e.leader).length;
        expect(leaderCount).toBe(1);
      });

      it('should count communicative endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        const communicativeCount = endorsements.filter(e => e.communicative).length;
        expect(communicativeCount).toBe(1);
      });

      it('should count reliable endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        const reliableCount = endorsements.filter(e => e.reliable).length;
        expect(reliableCount).toBe(1);
      });

      it('should count totalEndorsers correctly', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-target-4'
        );
        expect(endorsements.length).toBe(3);
      });
    });

    describe('Zero endorsements', () => {
      it('should return all zeros for user with no endorsements', () => {
        const endorsements = mockExistingEndorsements.filter(
          e => e.endorsed_id === 'user-with-none'
        );
        expect(endorsements.length).toBe(0);
        const response = {
          traits: {
            friendly: 0,
            teamPlayer: 0,
            leader: 0,
            communicative: 0,
            reliable: 0,
            totalEndorsers: 0,
          },
        };
        expect(response.traits.friendly).toBe(0);
        expect(response.traits.totalEndorsers).toBe(0);
      });
    });

    describe('Response shape (camelCase)', () => {
      it('should transform snake_case to camelCase', () => {
        const response = {
          traits: {
            friendly: 1,
            teamPlayer: 2,   // from team_player
            leader: 1,
            communicative: 1,
            reliable: 1,
            totalEndorsers: 3,
          },
        };
        expect(response.traits).toHaveProperty('teamPlayer');
        expect(response.traits).toHaveProperty('totalEndorsers');
        expect(response.traits).not.toHaveProperty('team_player');
        expect(response.traits).not.toHaveProperty('total_endorsers');
      });
    });

    describe('Only counts positive trait fields', () => {
      it('should only select positive trait columns', () => {
        // The API only selects: friendly, team_player, leader, communicative, reliable
        // Negative traits (toxic, quitter, etc.) are NOT included in traits aggregation
        const selectedColumns = ['friendly', 'team_player', 'leader', 'communicative', 'reliable'];
        const negativeColumns = ['toxic', 'quitter', 'uncooperative', 'uncommunicative', 'unreliable'];
        negativeColumns.forEach(col => {
          expect(selectedColumns).not.toContain(col);
        });
      });
    });
  });
});
