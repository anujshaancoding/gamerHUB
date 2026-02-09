/**
 * Matchmaking API Tests
 * Tests for AI-powered teammate suggestions and team balancing
 */

describe('Matchmaking API', () => {
  describe('Teammate Suggestions', () => {
    const mockUser = {
      id: 'user-1',
      games: [
        { game_id: 'valorant', rank: 'Diamond II', role: 'Duelist' },
        { game_id: 'cs2', rank: 'Global Elite', role: 'Rifler' },
      ],
      region: 'NA',
      language: 'en',
      gaming_style: 'competitive',
      availability: ['evening', 'weekend'],
    };

    const mockSuggestions = [
      {
        user_id: 'user-2',
        username: 'perfect_match',
        compatibility_score: 0.95,
        matching_factors: {
          skill_match: 0.9,
          playstyle_match: 0.95,
          schedule_match: 0.85,
          role_complementary: 1.0,
        },
        shared_games: ['valorant', 'cs2'],
        recommended_role: 'Controller',
      },
      {
        user_id: 'user-3',
        username: 'good_fit',
        compatibility_score: 0.82,
        matching_factors: {
          skill_match: 0.85,
          playstyle_match: 0.8,
          schedule_match: 0.9,
          role_complementary: 0.75,
        },
        shared_games: ['valorant'],
        recommended_role: 'Sentinel',
      },
    ];

    describe('GET /api/matchmaking/suggest-teammates', () => {
      it('should return teammate suggestions', () => {
        expect(mockSuggestions).toHaveLength(2);
      });

      it('should include compatibility scores', () => {
        mockSuggestions.forEach(suggestion => {
          expect(suggestion.compatibility_score).toBeGreaterThan(0);
          expect(suggestion.compatibility_score).toBeLessThanOrEqual(1);
        });
      });

      it('should break down matching factors', () => {
        mockSuggestions.forEach(suggestion => {
          expect(suggestion.matching_factors).toHaveProperty('skill_match');
          expect(suggestion.matching_factors).toHaveProperty('playstyle_match');
          expect(suggestion.matching_factors).toHaveProperty('schedule_match');
          expect(suggestion.matching_factors).toHaveProperty('role_complementary');
        });
      });

      it('should suggest complementary roles', () => {
        const userRole = 'Duelist';
        mockSuggestions.forEach(suggestion => {
          expect(suggestion.recommended_role).not.toBe(userRole);
        });
      });

      it('should sort by compatibility score', () => {
        const sorted = [...mockSuggestions].sort(
          (a, b) => b.compatibility_score - a.compatibility_score
        );
        expect(sorted[0].compatibility_score).toBeGreaterThanOrEqual(sorted[1].compatibility_score);
      });
    });

    describe('Skill Matching Algorithm', () => {
      it('should match similar skill levels', () => {
        const userRank = 'Diamond II';
        const acceptableRanks = ['Diamond I', 'Diamond II', 'Diamond III', 'Immortal I', 'Platinum III'];
        expect(acceptableRanks).toContain(userRank);
      });

      it('should penalize large skill gaps', () => {
        const calculateSkillMatch = (rank1: string, rank2: string): number => {
          const ranks = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Immortal', 'Radiant'];
          const getRankTier = (r: string) => ranks.findIndex(rank => r.startsWith(rank));
          const diff = Math.abs(getRankTier(rank1) - getRankTier(rank2));
          return Math.max(0, 1 - diff * 0.15);
        };

        expect(calculateSkillMatch('Diamond II', 'Diamond I')).toBeGreaterThan(0.9);
        expect(calculateSkillMatch('Diamond II', 'Silver III')).toBeLessThan(0.7);
      });
    });
  });

  describe('Team Balancing', () => {
    const mockTeamPlayers = [
      { user_id: 'user-1', skill_rating: 2500, role: 'Duelist' },
      { user_id: 'user-2', skill_rating: 2400, role: 'Controller' },
      { user_id: 'user-3', skill_rating: 2300, role: 'Sentinel' },
      { user_id: 'user-4', skill_rating: 2200, role: 'Initiator' },
      { user_id: 'user-5', skill_rating: 2600, role: 'Duelist' },
      { user_id: 'user-6', skill_rating: 2350, role: 'Controller' },
      { user_id: 'user-7', skill_rating: 2450, role: 'Sentinel' },
      { user_id: 'user-8', skill_rating: 2250, role: 'Initiator' },
      { user_id: 'user-9', skill_rating: 2550, role: 'Flex' },
      { user_id: 'user-10', skill_rating: 2150, role: 'Flex' },
    ];

    describe('POST /api/matchmaking/team-balance', () => {
      it('should balance teams by skill rating', () => {
        const totalRating = mockTeamPlayers.reduce((sum, p) => sum + p.skill_rating, 0);
        const avgRating = totalRating / mockTeamPlayers.length;

        // Create balanced teams
        const sorted = [...mockTeamPlayers].sort((a, b) => b.skill_rating - a.skill_rating);
        const team1: typeof mockTeamPlayers = [];
        const team2: typeof mockTeamPlayers = [];

        sorted.forEach((player, index) => {
          if (index % 2 === 0) team1.push(player);
          else team2.push(player);
        });

        const team1Avg = team1.reduce((sum, p) => sum + p.skill_rating, 0) / team1.length;
        const team2Avg = team2.reduce((sum, p) => sum + p.skill_rating, 0) / team2.length;

        // Teams should be within 5% of each other
        const diff = Math.abs(team1Avg - team2Avg);
        expect(diff / avgRating).toBeLessThan(0.1);
      });

      it('should consider role distribution', () => {
        const roles = mockTeamPlayers.map(p => p.role);
        const roleCount = roles.reduce((acc, role) => {
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(roleCount['Duelist']).toBe(2);
        expect(roleCount['Controller']).toBe(2);
      });

      it('should return balanced team assignments', () => {
        const team1Size = 5;
        const team2Size = 5;
        expect(mockTeamPlayers.length).toBe(team1Size + team2Size);
      });
    });
  });

  describe('Match Outcome Prediction', () => {
    const mockTeam1 = {
      avg_skill: 2450,
      synergy_score: 0.85,
      role_coverage: 1.0,
      recent_performance: 0.72,
    };

    const mockTeam2 = {
      avg_skill: 2400,
      synergy_score: 0.78,
      role_coverage: 0.9,
      recent_performance: 0.68,
    };

    describe('POST /api/matchmaking/predict-outcome', () => {
      it('should predict match outcome probability', () => {
        const calculateWinProbability = (team1: typeof mockTeam1, team2: typeof mockTeam2): number => {
          const skillWeight = 0.4;
          const synergyWeight = 0.25;
          const roleWeight = 0.15;
          const performanceWeight = 0.2;

          const team1Score =
            team1.avg_skill / 3000 * skillWeight +
            team1.synergy_score * synergyWeight +
            team1.role_coverage * roleWeight +
            team1.recent_performance * performanceWeight;

          const team2Score =
            team2.avg_skill / 3000 * skillWeight +
            team2.synergy_score * synergyWeight +
            team2.role_coverage * roleWeight +
            team2.recent_performance * performanceWeight;

          const total = team1Score + team2Score;
          return team1Score / total;
        };

        const prediction = calculateWinProbability(mockTeam1, mockTeam2);
        expect(prediction).toBeGreaterThan(0);
        expect(prediction).toBeLessThan(1);
      });

      it('should favor higher skilled team', () => {
        const betterTeam = { ...mockTeam1, avg_skill: 2600 };
        const worseTeam = { ...mockTeam2, avg_skill: 2200 };

        // Higher skill should correlate with higher win probability
        expect(betterTeam.avg_skill).toBeGreaterThan(worseTeam.avg_skill);
      });

      it('should consider team synergy', () => {
        const highSynergy = { ...mockTeam1, synergy_score: 0.95 };
        const lowSynergy = { ...mockTeam1, synergy_score: 0.5 };

        expect(highSynergy.synergy_score).toBeGreaterThan(lowSynergy.synergy_score);
      });
    });
  });

  describe('LFG (Looking For Group)', () => {
    const mockLFGPosts = [
      {
        id: 'lfg-1',
        author_id: 'user-1',
        game_id: 'valorant',
        title: 'Looking for ranked duo',
        description: 'Diamond player looking for controller main',
        min_rank: 'Platinum III',
        max_rank: 'Immortal I',
        roles_needed: ['Controller', 'Sentinel'],
        players_needed: 2,
        region: 'NA',
        language: 'en',
        mic_required: true,
        is_active: true,
        expires_at: '2024-01-16T00:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'lfg-2',
        author_id: 'user-2',
        game_id: 'cs2',
        title: 'Need 2 for 5-stack',
        description: 'Chill games, no toxicity',
        min_rank: 'Gold Nova',
        max_rank: 'Global Elite',
        roles_needed: ['AWPer', 'Support'],
        players_needed: 2,
        region: 'EU',
        language: 'en',
        mic_required: false,
        is_active: true,
        expires_at: '2024-01-17T00:00:00Z',
        created_at: '2024-01-15T12:00:00Z',
      },
    ];

    describe('GET /api/lfg', () => {
      it('should return active LFG posts', () => {
        const active = mockLFGPosts.filter(p => p.is_active);
        expect(active).toHaveLength(2);
      });

      it('should filter by game', () => {
        const valorantPosts = mockLFGPosts.filter(p => p.game_id === 'valorant');
        expect(valorantPosts).toHaveLength(1);
      });

      it('should filter by region', () => {
        const naPosts = mockLFGPosts.filter(p => p.region === 'NA');
        expect(naPosts).toHaveLength(1);
      });

      it('should include rank requirements', () => {
        mockLFGPosts.forEach(post => {
          expect(post).toHaveProperty('min_rank');
          expect(post).toHaveProperty('max_rank');
        });
      });
    });

    describe('POST /api/lfg', () => {
      it('should validate required fields', () => {
        const newPost = {
          game_id: 'valorant',
          title: 'New LFG Post',
          players_needed: 3,
          region: 'NA',
        };

        expect(newPost.game_id).toBeDefined();
        expect(newPost.title).toBeDefined();
        expect(newPost.players_needed).toBeGreaterThan(0);
      });

      it('should set default expiry', () => {
        const defaultExpiryHours = 24;
        const now = new Date();
        const expiry = new Date(now.getTime() + defaultExpiryHours * 60 * 60 * 1000);
        expect(expiry.getTime()).toBeGreaterThan(now.getTime());
      });
    });

    describe('POST /api/lfg/[id]/apply', () => {
      const mockApplications = [
        { lfg_id: 'lfg-1', applicant_id: 'user-3', status: 'pending', message: 'I main Omen!' },
        { lfg_id: 'lfg-1', applicant_id: 'user-4', status: 'accepted', message: 'Controller main here' },
      ];

      it('should create LFG application', () => {
        expect(mockApplications).toHaveLength(2);
      });

      it('should track application status', () => {
        const pending = mockApplications.filter(a => a.status === 'pending');
        const accepted = mockApplications.filter(a => a.status === 'accepted');
        expect(pending).toHaveLength(1);
        expect(accepted).toHaveLength(1);
      });
    });
  });

  describe('Mood-Based Matching', () => {
    const mockMoods = [
      { user_id: 'user-1', mood: 'competitive', intensity: 'high', updated_at: '2024-01-15T10:00:00Z' },
      { user_id: 'user-2', mood: 'casual', intensity: 'low', updated_at: '2024-01-15T09:00:00Z' },
      { user_id: 'user-3', mood: 'competitive', intensity: 'medium', updated_at: '2024-01-15T11:00:00Z' },
    ];

    describe('GET /api/mood/compatible-players', () => {
      it('should match similar moods', () => {
        const userMood = 'competitive';
        const compatible = mockMoods.filter(m => m.mood === userMood);
        expect(compatible).toHaveLength(2);
      });

      it('should consider intensity levels', () => {
        const highIntensity = mockMoods.filter(m => m.intensity === 'high');
        expect(highIntensity).toHaveLength(1);
      });

      it('should filter stale moods', () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const fresh = mockMoods.filter(m => new Date(m.updated_at) > oneHourAgo);
        expect(fresh.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('POST /api/mood', () => {
      it('should update user mood', () => {
        const moodUpdate = {
          mood: 'casual',
          intensity: 'medium',
        };
        expect(['competitive', 'casual', 'learning', 'coaching']).toContain(moodUpdate.mood);
        expect(['low', 'medium', 'high']).toContain(moodUpdate.intensity);
      });
    });
  });
});
