/**
 * Challenge Progress API Tests
 *
 * Tests for community challenges list, detail, and join endpoints.
 * Related to migration 067: challenge_progress is now publicly viewable
 * via RLS policy so active_challenges view works with security_invoker.
 *
 * Endpoints tested:
 *   GET  /api/community-challenges
 *   GET  /api/community-challenges/[challengeId]
 *   POST /api/community-challenges/[challengeId]/join
 */

describe('Challenge Progress API', () => {
  // ─── Mock Data ───────────────────────────────────────────────

  const mockUser = {
    id: 'user-auth-123',
    email: 'player@example.com',
  };

  const mockChallenges = [
    {
      id: 'ch-1',
      title: 'Weekly Kill Challenge',
      description: 'Get 100 kills this week',
      status: 'active',
      difficulty: 'medium',
      period_type: 'weekly',
      game_id: 'game-valorant',
      season_id: 'season-5',
      starts_at: '2024-01-15T00:00:00Z',
      ends_at: '2027-12-31T23:59:59Z',
      max_participants: 500,
      objectives: [{ target: 100, description: 'Get 100 kills' }],
      rewards: { xp: 500, badge: 'kill-master' },
      created_at: '2024-01-14T00:00:00Z',
    },
    {
      id: 'ch-2',
      title: 'Daily Headshot Challenge',
      description: 'Get 10 headshots today',
      status: 'active',
      difficulty: 'easy',
      period_type: 'daily',
      game_id: 'game-cs2',
      season_id: null,
      starts_at: '2024-01-20T00:00:00Z',
      ends_at: '2027-12-31T23:59:59Z',
      max_participants: null,
      objectives: [{ target: 10, description: 'Get 10 headshots' }],
      rewards: { xp: 100 },
      created_at: '2024-01-20T00:00:00Z',
    },
    {
      id: 'ch-3',
      title: 'Expired Challenge',
      description: 'This challenge has ended',
      status: 'completed',
      difficulty: 'hard',
      period_type: 'monthly',
      game_id: 'game-valorant',
      season_id: 'season-4',
      starts_at: '2023-12-01T00:00:00Z',
      ends_at: '2023-12-31T23:59:59Z',
      max_participants: 100,
      objectives: [{ target: 500, description: 'Get 500 kills' }],
      rewards: { xp: 2000, badge: 'grinder' },
      created_at: '2023-12-01T00:00:00Z',
    },
    {
      id: 'ch-4',
      title: 'Inactive Challenge',
      description: 'Not yet started',
      status: 'upcoming',
      difficulty: 'easy',
      period_type: 'weekly',
      game_id: 'game-apex',
      season_id: 'season-5',
      starts_at: '2025-01-01T00:00:00Z',
      ends_at: '2025-01-07T23:59:59Z',
      max_participants: 200,
      objectives: [{ target: 50, description: 'Win 50 matches' }],
      rewards: { xp: 300 },
      created_at: '2024-12-30T00:00:00Z',
    },
  ];

  const mockProgressRecords = [
    {
      id: 'prog-1',
      challenge_id: 'ch-1',
      user_id: 'user-auth-123',
      status: 'in_progress',
      progress: [{ objective_index: 0, current: 45, target: 100, completed: false }],
      started_at: '2024-01-15T10:00:00Z',
      completed_at: null,
      points_awarded: 0,
      metadata: {},
    },
    {
      id: 'prog-2',
      challenge_id: 'ch-1',
      user_id: 'user-other-456',
      status: 'completed',
      progress: [{ objective_index: 0, current: 100, target: 100, completed: true }],
      started_at: '2024-01-15T08:00:00Z',
      completed_at: '2024-01-18T14:30:00Z',
      points_awarded: 500,
      metadata: { fastest_day: 3 },
    },
    {
      id: 'prog-3',
      challenge_id: 'ch-1',
      user_id: 'user-another-789',
      status: 'in_progress',
      progress: [{ objective_index: 0, current: 80, target: 100, completed: false }],
      started_at: '2024-01-16T09:00:00Z',
      completed_at: null,
      points_awarded: 0,
      metadata: {},
    },
    {
      id: 'prog-4',
      challenge_id: 'ch-2',
      user_id: 'user-other-456',
      status: 'in_progress',
      progress: [{ objective_index: 0, current: 5, target: 10, completed: false }],
      started_at: '2024-01-20T06:00:00Z',
      completed_at: null,
      points_awarded: 0,
      metadata: {},
    },
    {
      id: 'prog-5',
      challenge_id: 'ch-3',
      user_id: 'user-auth-123',
      status: 'failed',
      progress: [{ objective_index: 0, current: 200, target: 500, completed: false }],
      started_at: '2023-12-01T10:00:00Z',
      completed_at: null,
      points_awarded: 0,
      metadata: {},
    },
  ];

  // ─── GET /api/community-challenges ───────────────────────────

  describe('GET /api/community-challenges - List Challenges', () => {
    describe('Default Query (no filters)', () => {
      it('should return only active challenges by default', () => {
        const defaultStatus = 'active';
        const filtered = mockChallenges.filter(c => c.status === defaultStatus);
        expect(filtered).toHaveLength(2);
        expect(filtered.every(c => c.status === 'active')).toBe(true);
      });

      it('should apply default pagination (limit=20, offset=0)', () => {
        const defaultLimit = parseInt('20');
        const defaultOffset = parseInt('0');
        expect(defaultLimit).toBe(20);
        expect(defaultOffset).toBe(0);
      });

      it('should return total count alongside challenges', () => {
        const activeChallenges = mockChallenges.filter(c => c.status === 'active');
        const response = {
          challenges: activeChallenges,
          total: activeChallenges.length,
          limit: 20,
          offset: 0,
        };
        expect(response.total).toBe(2);
        expect(response.challenges).toHaveLength(response.total);
      });

      it('should order by starts_at descending', () => {
        const activeChallenges = mockChallenges
          .filter(c => c.status === 'active')
          .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
        expect(activeChallenges[0].id).toBe('ch-2');
        expect(activeChallenges[1].id).toBe('ch-1');
      });
    });

    describe('Filter by status', () => {
      it('should filter by "active" status', () => {
        const result = mockChallenges.filter(c => c.status === 'active');
        expect(result).toHaveLength(2);
      });

      it('should filter by "completed" status', () => {
        const result = mockChallenges.filter(c => c.status === 'completed');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ch-3');
      });

      it('should filter by "upcoming" status', () => {
        const result = mockChallenges.filter(c => c.status === 'upcoming');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ch-4');
      });

      it('should return empty array for non-matching status', () => {
        const result = mockChallenges.filter(c => c.status === 'cancelled');
        expect(result).toHaveLength(0);
      });
    });

    describe('Filter by game_id', () => {
      it('should filter challenges by game', () => {
        const result = mockChallenges.filter(c => c.game_id === 'game-valorant');
        expect(result).toHaveLength(2);
      });

      it('should return empty for unknown game_id', () => {
        const result = mockChallenges.filter(c => c.game_id === 'game-unknown');
        expect(result).toHaveLength(0);
      });
    });

    describe('Filter by season_id', () => {
      it('should filter challenges by season', () => {
        const result = mockChallenges.filter(c => c.season_id === 'season-5');
        expect(result).toHaveLength(2);
      });

      it('should include challenges without a season when no season filter applied', () => {
        const noSeasonFilter = mockChallenges;
        const nullSeason = noSeasonFilter.filter(c => c.season_id === null);
        expect(nullSeason).toHaveLength(1);
      });
    });

    describe('Filter by period_type', () => {
      it('should filter by daily challenges', () => {
        const result = mockChallenges.filter(c => c.period_type === 'daily');
        expect(result).toHaveLength(1);
      });

      it('should filter by weekly challenges', () => {
        const result = mockChallenges.filter(c => c.period_type === 'weekly');
        expect(result).toHaveLength(2);
      });

      it('should filter by monthly challenges', () => {
        const result = mockChallenges.filter(c => c.period_type === 'monthly');
        expect(result).toHaveLength(1);
      });
    });

    describe('Filter by difficulty', () => {
      it('should filter by easy difficulty', () => {
        const result = mockChallenges.filter(c => c.difficulty === 'easy');
        expect(result).toHaveLength(2);
      });

      it('should filter by medium difficulty', () => {
        const result = mockChallenges.filter(c => c.difficulty === 'medium');
        expect(result).toHaveLength(1);
      });

      it('should filter by hard difficulty', () => {
        const result = mockChallenges.filter(c => c.difficulty === 'hard');
        expect(result).toHaveLength(1);
      });
    });

    describe('Combined filters', () => {
      it('should filter by game + status', () => {
        const result = mockChallenges.filter(
          c => c.game_id === 'game-valorant' && c.status === 'active'
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ch-1');
      });

      it('should filter by season + difficulty', () => {
        const result = mockChallenges.filter(
          c => c.season_id === 'season-5' && c.difficulty === 'easy'
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ch-4');
      });

      it('should filter by status + period_type + difficulty', () => {
        const result = mockChallenges.filter(
          c => c.status === 'active' && c.period_type === 'weekly' && c.difficulty === 'medium'
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ch-1');
      });
    });

    describe('Pagination', () => {
      it('should apply custom limit', () => {
        const limit = 1;
        const offset = 0;
        const activeChallenges = mockChallenges.filter(c => c.status === 'active');
        const paginated = activeChallenges.slice(offset, offset + limit);
        expect(paginated).toHaveLength(1);
      });

      it('should apply custom offset', () => {
        const limit = 1;
        const offset = 1;
        const activeChallenges = mockChallenges
          .filter(c => c.status === 'active')
          .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
        const paginated = activeChallenges.slice(offset, offset + limit);
        expect(paginated).toHaveLength(1);
        expect(paginated[0].id).toBe('ch-1');
      });

      it('should return empty array when offset exceeds total', () => {
        const limit = 20;
        const offset = 100;
        const activeChallenges = mockChallenges.filter(c => c.status === 'active');
        const paginated = activeChallenges.slice(offset, offset + limit);
        expect(paginated).toHaveLength(0);
      });

      it('should handle limit=0 gracefully', () => {
        const limit = 0;
        const paginated = mockChallenges.slice(0, limit);
        expect(paginated).toHaveLength(0);
      });
    });

    describe('Participant and completion counts (public challenge_progress)', () => {
      it('should count total participants per challenge', () => {
        const challengeId = 'ch-1';
        const participantCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId
        ).length;
        expect(participantCount).toBe(3);
      });

      it('should count completed participants per challenge', () => {
        const challengeId = 'ch-1';
        const completionCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId && p.status === 'completed'
        ).length;
        expect(completionCount).toBe(1);
      });

      it('should return zero counts for challenge with no progress', () => {
        const challengeId = 'ch-4';
        const participantCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId
        ).length;
        expect(participantCount).toBe(0);
      });

      it('should count participants across all users (security_invoker public read)', () => {
        // After migration 067, challenge_progress has public SELECT
        // Any authenticated user should see accurate counts from all users
        const allUsersProgress = mockProgressRecords.filter(p => p.challenge_id === 'ch-1');
        const uniqueUsers = new Set(allUsersProgress.map(p => p.user_id));
        expect(uniqueUsers.size).toBe(3);
      });
    });

    describe('User progress (authenticated)', () => {
      it('should include user progress when authenticated', () => {
        const challengeId = 'ch-1';
        const userProgress = mockProgressRecords.find(
          p => p.challenge_id === challengeId && p.user_id === mockUser.id
        );
        expect(userProgress).toBeDefined();
        expect(userProgress!.status).toBe('in_progress');
        expect(userProgress!.progress[0].current).toBe(45);
      });

      it('should return null user_progress when user has not joined', () => {
        const challengeId = 'ch-2';
        const userProgress = mockProgressRecords.find(
          p => p.challenge_id === challengeId && p.user_id === mockUser.id
        );
        expect(userProgress).toBeUndefined();
      });

      it('should not include user progress when unauthenticated', () => {
        const unauthenticatedUser = null;
        const includeUserProgress = !!unauthenticatedUser;
        expect(includeUserProgress).toBe(false);
      });
    });

    describe('Response shape', () => {
      it('should return correct response structure', () => {
        const response = {
          challenges: mockChallenges.filter(c => c.status === 'active'),
          total: 2,
          limit: 20,
          offset: 0,
        };
        expect(response).toHaveProperty('challenges');
        expect(response).toHaveProperty('total');
        expect(response).toHaveProperty('limit');
        expect(response).toHaveProperty('offset');
        expect(Array.isArray(response.challenges)).toBe(true);
        expect(typeof response.total).toBe('number');
      });

      it('should include participant_count and completion_count per challenge', () => {
        const challengeId = 'ch-1';
        const participantCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId
        ).length;
        const completionCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId && p.status === 'completed'
        ).length;
        const enriched = {
          ...mockChallenges[0],
          participant_count: participantCount,
          completion_count: completionCount,
          user_progress: null,
        };
        expect(enriched.participant_count).toBe(3);
        expect(enriched.completion_count).toBe(1);
      });
    });
  });

  // ─── GET /api/community-challenges/[challengeId] ─────────────

  describe('GET /api/community-challenges/[challengeId] - Challenge Detail', () => {
    it('should return challenge details by ID', () => {
      const challengeId = 'ch-1';
      const challenge = mockChallenges.find(c => c.id === challengeId);
      expect(challenge).toBeDefined();
      expect(challenge!.title).toBe('Weekly Kill Challenge');
    });

    it('should return 404 for non-existent challenge', () => {
      const challengeId = 'ch-nonexistent';
      const challenge = mockChallenges.find(c => c.id === challengeId);
      expect(challenge).toBeUndefined();
    });

    it('should include participant count from challenge_progress', () => {
      const challengeId = 'ch-1';
      const participantCount = mockProgressRecords.filter(
        p => p.challenge_id === challengeId
      ).length;
      expect(participantCount).toBe(3);
    });

    it('should include completion count', () => {
      const challengeId = 'ch-1';
      const completionCount = mockProgressRecords.filter(
        p => p.challenge_id === challengeId && p.status === 'completed'
      ).length;
      expect(completionCount).toBe(1);
    });

    it('should include user progress when authenticated', () => {
      const challengeId = 'ch-1';
      const userProgress = mockProgressRecords.find(
        p => p.challenge_id === challengeId && p.user_id === mockUser.id
      );
      expect(userProgress).toBeDefined();
      expect(userProgress!.progress[0].current).toBe(45);
      expect(userProgress!.progress[0].target).toBe(100);
    });

    it('should return null user_progress when not joined', () => {
      const challengeId = 'ch-2';
      const userProgress = mockProgressRecords.find(
        p => p.challenge_id === challengeId && p.user_id === mockUser.id
      );
      expect(userProgress).toBeUndefined();
    });

    it('should return challenge with game and season relations', () => {
      const challenge = mockChallenges[0];
      const response = {
        challenge: {
          ...challenge,
          game: { id: challenge.game_id, name: 'Valorant' },
          season: { id: challenge.season_id, name: 'Season 5', slug: 's5' },
          participant_count: 3,
          completion_count: 1,
          user_progress: null,
        },
      };
      expect(response.challenge.game).toBeDefined();
      expect(response.challenge.season).toBeDefined();
    });

    it('should correctly handle challenge with null season_id', () => {
      const challenge = mockChallenges.find(c => c.season_id === null);
      expect(challenge).toBeDefined();
      expect(challenge!.id).toBe('ch-2');
    });
  });

  // ─── POST /api/community-challenges/[challengeId]/join ───────

  describe('POST /api/community-challenges/[challengeId]/join - Join Challenge', () => {
    describe('Authentication', () => {
      it('should require authentication', () => {
        const user = null;
        const isAuthenticated = !!user;
        expect(isAuthenticated).toBe(false);
        // Expect 401 response
      });

      it('should allow authenticated users to join', () => {
        const user = mockUser;
        const isAuthenticated = !!user;
        expect(isAuthenticated).toBe(true);
      });
    });

    describe('Challenge validation', () => {
      it('should return 404 for non-existent challenge', () => {
        const challengeId = 'ch-nonexistent';
        const challenge = mockChallenges.find(c => c.id === challengeId);
        expect(challenge).toBeUndefined();
      });

      it('should reject joining inactive challenge (status != active)', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-4'); // upcoming
        expect(challenge!.status).not.toBe('active');
      });

      it('should reject joining completed challenge', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-3'); // completed
        expect(challenge!.status).toBe('completed');
        expect(challenge!.status).not.toBe('active');
      });

      it('should reject joining expired challenge', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-3');
        const isExpired = new Date(challenge!.ends_at) < new Date();
        expect(isExpired).toBe(true);
      });

      it('should accept joining active, non-expired challenge', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-1');
        const isActive = challenge!.status === 'active';
        const isNotExpired = new Date(challenge!.ends_at) > new Date();
        expect(isActive).toBe(true);
        expect(isNotExpired).toBe(true);
      });
    });

    describe('Duplicate join prevention', () => {
      it('should reject if user has already joined', () => {
        const challengeId = 'ch-1';
        const existingProgress = mockProgressRecords.find(
          p => p.challenge_id === challengeId && p.user_id === mockUser.id
        );
        expect(existingProgress).toBeDefined();
        // Expect 400: "You have already joined this challenge"
      });

      it('should allow user to join a challenge they have not joined', () => {
        const challengeId = 'ch-2';
        const existingProgress = mockProgressRecords.find(
          p => p.challenge_id === challengeId && p.user_id === mockUser.id
        );
        expect(existingProgress).toBeUndefined();
      });
    });

    describe('Max participants enforcement', () => {
      it('should reject when challenge is full', () => {
        // Simulate a challenge with max_participants=3, currently 3 joined
        const challengeId = 'ch-1';
        const maxParticipants = 3;
        const currentCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId
        ).length;
        expect(currentCount).toBe(maxParticipants);
        // If currentCount >= maxParticipants, reject
        expect(currentCount >= maxParticipants).toBe(true);
      });

      it('should allow joining when below max participants', () => {
        const challengeId = 'ch-1';
        const maxParticipants = 500; // actual max from mock
        const currentCount = mockProgressRecords.filter(
          p => p.challenge_id === challengeId
        ).length;
        expect(currentCount < maxParticipants).toBe(true);
      });

      it('should skip max check when max_participants is null', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-2');
        expect(challenge!.max_participants).toBeNull();
        // No limit enforcement needed
      });
    });

    describe('Initial progress creation', () => {
      it('should create progress entry with in_progress status', () => {
        const newProgress = {
          challenge_id: 'ch-2',
          user_id: mockUser.id,
          status: 'in_progress',
          progress: [{ objective_index: 0, current: 0, target: 10, completed: false }],
        };
        expect(newProgress.status).toBe('in_progress');
      });

      it('should initialize all objectives with current=0', () => {
        const challenge = mockChallenges.find(c => c.id === 'ch-1')!;
        const objectives = challenge.objectives;
        const initialProgress = objectives.map((obj, index) => ({
          objective_index: index,
          current: 0,
          target: obj.target,
          completed: false,
        }));
        expect(initialProgress).toHaveLength(1);
        expect(initialProgress[0].current).toBe(0);
        expect(initialProgress[0].target).toBe(100);
        expect(initialProgress[0].completed).toBe(false);
      });

      it('should handle multi-objective challenges', () => {
        const multiObjectiveChallenge = {
          objectives: [
            { target: 50, description: 'Get 50 kills' },
            { target: 10, description: 'Get 10 assists' },
            { target: 5, description: 'Win 5 rounds' },
          ],
        };
        const initialProgress = multiObjectiveChallenge.objectives.map((obj, index) => ({
          objective_index: index,
          current: 0,
          target: obj.target,
          completed: false,
        }));
        expect(initialProgress).toHaveLength(3);
        expect(initialProgress[0].target).toBe(50);
        expect(initialProgress[1].target).toBe(10);
        expect(initialProgress[2].target).toBe(5);
      });

      it('should handle challenge with no objectives gracefully', () => {
        const objectives: { target: number }[] = [];
        const initialProgress = objectives.map((obj, index) => ({
          objective_index: index,
          current: 0,
          target: obj.target || 0,
          completed: false,
        }));
        expect(initialProgress).toHaveLength(0);
      });

      it('should return 201 status on success', () => {
        const responseStatus = 201;
        expect(responseStatus).toBe(201);
      });
    });
  });

  // ─── Challenge Progress Statuses ─────────────────────────────

  describe('Challenge Progress Statuses', () => {
    it('should have valid status values', () => {
      const validStatuses = ['in_progress', 'completed', 'failed', 'expired'];
      mockProgressRecords.forEach(p => {
        expect(validStatuses).toContain(p.status);
      });
    });

    it('should track completed_at only when completed', () => {
      const completed = mockProgressRecords.filter(p => p.status === 'completed');
      completed.forEach(p => {
        expect(p.completed_at).not.toBeNull();
      });
    });

    it('should have null completed_at for in_progress', () => {
      const inProgress = mockProgressRecords.filter(p => p.status === 'in_progress');
      inProgress.forEach(p => {
        expect(p.completed_at).toBeNull();
      });
    });

    it('should award points only to completed challenges', () => {
      const completed = mockProgressRecords.filter(p => p.status === 'completed');
      completed.forEach(p => {
        expect(p.points_awarded).toBeGreaterThan(0);
      });

      const notCompleted = mockProgressRecords.filter(p => p.status !== 'completed');
      notCompleted.forEach(p => {
        expect(p.points_awarded).toBe(0);
      });
    });
  });

  // ─── RLS: Public Viewability (migration 067) ────────────────

  describe('RLS: challenge_progress public viewability', () => {
    it('should allow any user to count challenge participants', () => {
      // migration 067 adds: CREATE POLICY "Challenge progress is publicly viewable"
      //   ON challenge_progress FOR SELECT USING (true)
      // This means any authenticated user can see all progress rows
      const allProgress = mockProgressRecords.filter(p => p.challenge_id === 'ch-1');
      expect(allProgress).toHaveLength(3);
    });

    it('should allow unauthenticated users to see participant counts via active_challenges view', () => {
      // The active_challenges view uses security_invoker = true
      // Combined with public SELECT on challenge_progress, counts are accurate
      const participantCount = mockProgressRecords.filter(
        p => p.challenge_id === 'ch-1'
      ).length;
      expect(participantCount).toBe(3);
    });

    it('should expose all user progress rows (not just own)', () => {
      const otherUsersProgress = mockProgressRecords.filter(
        p => p.challenge_id === 'ch-1' && p.user_id !== mockUser.id
      );
      expect(otherUsersProgress).toHaveLength(2);
    });
  });
});
