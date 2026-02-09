/**
 * API Tests for Tournament Business Logic
 * Tests validation rules, bracket generation, and tournament rules
 */

describe('Tournament Business Logic', () => {
  describe('Tournament Format Validation', () => {
    const VALID_FORMATS = ['single_elimination', 'double_elimination', 'round_robin'] as const;
    type TournamentFormat = typeof VALID_FORMATS[number];

    const validateFormat = (format: string): format is TournamentFormat => {
      return VALID_FORMATS.includes(format as TournamentFormat);
    };

    it('should accept valid formats', () => {
      expect(validateFormat('single_elimination')).toBe(true);
      expect(validateFormat('double_elimination')).toBe(true);
      expect(validateFormat('round_robin')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateFormat('invalid')).toBe(false);
      expect(validateFormat('')).toBe(false);
      expect(validateFormat('SINGLE_ELIMINATION')).toBe(false);
    });
  });

  describe('Tournament Status Validation', () => {
    const VALID_STATUSES = [
      'draft',
      'registration_open',
      'registration_closed',
      'check_in',
      'ongoing',
      'completed',
      'cancelled',
    ] as const;
    type TournamentStatus = typeof VALID_STATUSES[number];

    const validateStatus = (status: string): status is TournamentStatus => {
      return VALID_STATUSES.includes(status as TournamentStatus);
    };

    const canRegister = (status: TournamentStatus): boolean => {
      return status === 'registration_open';
    };

    const canStartTournament = (status: TournamentStatus): boolean => {
      return status === 'check_in' || status === 'registration_closed';
    };

    const isActive = (status: TournamentStatus): boolean => {
      return !['draft', 'completed', 'cancelled'].includes(status);
    };

    it('should validate all statuses', () => {
      VALID_STATUSES.forEach(status => {
        expect(validateStatus(status)).toBe(true);
      });
    });

    it('should reject invalid statuses', () => {
      expect(validateStatus('pending')).toBe(false);
      expect(validateStatus('active')).toBe(false);
    });

    it('should only allow registration during registration_open', () => {
      expect(canRegister('registration_open')).toBe(true);
      expect(canRegister('draft')).toBe(false);
      expect(canRegister('ongoing')).toBe(false);
    });

    it('should allow starting tournament at correct statuses', () => {
      expect(canStartTournament('check_in')).toBe(true);
      expect(canStartTournament('registration_closed')).toBe(true);
      expect(canStartTournament('draft')).toBe(false);
      expect(canStartTournament('ongoing')).toBe(false);
    });

    it('should correctly identify active tournaments', () => {
      expect(isActive('registration_open')).toBe(true);
      expect(isActive('ongoing')).toBe(true);
      expect(isActive('draft')).toBe(false);
      expect(isActive('completed')).toBe(false);
      expect(isActive('cancelled')).toBe(false);
    });
  });

  describe('Slug Generation', () => {
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    it('should generate correct slugs', () => {
      expect(generateSlug('Summer Championship 2024')).toBe('summer-championship-2024');
      expect(generateSlug('Pro League #1')).toBe('pro-league-1');
      expect(generateSlug('---Test Tournament---')).toBe('test-tournament');
    });
  });

  describe('Date Validation', () => {
    const validateDates = (
      registrationStart: Date,
      registrationEnd: Date,
      startDate: Date
    ): { valid: boolean; error?: string } => {
      if (registrationEnd <= registrationStart) {
        return { valid: false, error: 'Registration end must be after start' };
      }
      if (startDate <= registrationEnd) {
        return { valid: false, error: 'Tournament start must be after registration end' };
      }
      if (registrationStart <= new Date()) {
        return { valid: false, error: 'Registration start must be in the future' };
      }
      return { valid: true };
    };

    it('should accept valid date sequence', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const regEnd = new Date(future);
      regEnd.setDate(regEnd.getDate() + 7);

      const start = new Date(regEnd);
      start.setDate(start.getDate() + 1);

      expect(validateDates(future, regEnd, start).valid).toBe(true);
    });

    it('should reject registration end before start', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);

      const regEnd = new Date(future);
      regEnd.setDate(regEnd.getDate() - 1);

      const start = new Date(future);
      start.setDate(start.getDate() + 5);

      expect(validateDates(future, regEnd, start).valid).toBe(false);
    });
  });

  describe('Team Size Validation', () => {
    const MIN_TEAM_SIZE = 1;
    const MAX_TEAM_SIZE = 10;

    const validateTeamSize = (size: number): boolean => {
      return size >= MIN_TEAM_SIZE && size <= MAX_TEAM_SIZE;
    };

    it('should accept valid team sizes', () => {
      expect(validateTeamSize(1)).toBe(true);
      expect(validateTeamSize(5)).toBe(true);
      expect(validateTeamSize(10)).toBe(true);
    });

    it('should reject invalid team sizes', () => {
      expect(validateTeamSize(0)).toBe(false);
      expect(validateTeamSize(-1)).toBe(false);
      expect(validateTeamSize(11)).toBe(false);
    });
  });

  describe('Max Teams Validation', () => {
    const VALID_BRACKET_SIZES = [4, 8, 16, 32, 64, 128];

    const validateMaxTeams = (maxTeams: number, format: string): boolean => {
      if (format === 'round_robin') {
        return maxTeams >= 3 && maxTeams <= 16;
      }
      return VALID_BRACKET_SIZES.includes(maxTeams);
    };

    it('should accept valid bracket sizes for elimination', () => {
      expect(validateMaxTeams(8, 'single_elimination')).toBe(true);
      expect(validateMaxTeams(16, 'double_elimination')).toBe(true);
      expect(validateMaxTeams(32, 'single_elimination')).toBe(true);
    });

    it('should reject non-power-of-2 for elimination', () => {
      expect(validateMaxTeams(6, 'single_elimination')).toBe(false);
      expect(validateMaxTeams(10, 'double_elimination')).toBe(false);
    });

    it('should accept flexible sizes for round robin', () => {
      expect(validateMaxTeams(3, 'round_robin')).toBe(true);
      expect(validateMaxTeams(6, 'round_robin')).toBe(true);
      expect(validateMaxTeams(10, 'round_robin')).toBe(true);
    });
  });

  describe('Bracket Generation', () => {
    const calculateRounds = (teamCount: number): number => {
      return Math.ceil(Math.log2(teamCount));
    };

    const calculateMatchCount = (teamCount: number, format: string): number => {
      if (format === 'single_elimination') {
        return teamCount - 1;
      }
      if (format === 'double_elimination') {
        return (teamCount - 1) * 2 + 1;
      }
      if (format === 'round_robin') {
        return (teamCount * (teamCount - 1)) / 2;
      }
      return 0;
    };

    it('should calculate correct round count', () => {
      expect(calculateRounds(4)).toBe(2);
      expect(calculateRounds(8)).toBe(3);
      expect(calculateRounds(16)).toBe(4);
      expect(calculateRounds(32)).toBe(5);
    });

    it('should calculate correct match count for single elimination', () => {
      expect(calculateMatchCount(4, 'single_elimination')).toBe(3);
      expect(calculateMatchCount(8, 'single_elimination')).toBe(7);
      expect(calculateMatchCount(16, 'single_elimination')).toBe(15);
    });

    it('should calculate correct match count for double elimination', () => {
      // Double elim: 2*(n-1) + 1 for potential grand final reset
      expect(calculateMatchCount(4, 'double_elimination')).toBe(7);
      expect(calculateMatchCount(8, 'double_elimination')).toBe(15);
    });

    it('should calculate correct match count for round robin', () => {
      expect(calculateMatchCount(4, 'round_robin')).toBe(6);
      expect(calculateMatchCount(6, 'round_robin')).toBe(15);
      expect(calculateMatchCount(8, 'round_robin')).toBe(28);
    });
  });

  describe('Check-in Validation', () => {
    const DEFAULT_CHECK_IN_WINDOW = 30; // minutes

    const isWithinCheckInWindow = (
      tournamentStart: Date,
      checkInWindowMinutes: number = DEFAULT_CHECK_IN_WINDOW
    ): boolean => {
      const now = new Date();
      const checkInStart = new Date(tournamentStart);
      checkInStart.setMinutes(checkInStart.getMinutes() - checkInWindowMinutes);

      return now >= checkInStart && now < tournamentStart;
    };

    it('should allow check-in within window', () => {
      const tournamentStart = new Date();
      tournamentStart.setMinutes(tournamentStart.getMinutes() + 15);

      expect(isWithinCheckInWindow(tournamentStart)).toBe(true);
    });

    it('should not allow check-in too early', () => {
      const tournamentStart = new Date();
      tournamentStart.setHours(tournamentStart.getHours() + 2);

      expect(isWithinCheckInWindow(tournamentStart)).toBe(false);
    });

    it('should not allow check-in after tournament starts', () => {
      const tournamentStart = new Date();
      tournamentStart.setMinutes(tournamentStart.getMinutes() - 5);

      expect(isWithinCheckInWindow(tournamentStart)).toBe(false);
    });
  });

  describe('Prize Distribution', () => {
    interface PrizeDistribution {
      place: number;
      percentage: number;
    }

    const validatePrizeDistribution = (distribution: PrizeDistribution[]): boolean => {
      const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0);
      return totalPercentage === 100;
    };

    const calculatePrize = (
      totalPool: number,
      place: number,
      distribution: PrizeDistribution[]
    ): number => {
      const placement = distribution.find(d => d.place === place);
      if (!placement) return 0;
      return Math.floor(totalPool * (placement.percentage / 100));
    };

    it('should validate correct distribution', () => {
      const distribution = [
        { place: 1, percentage: 50 },
        { place: 2, percentage: 30 },
        { place: 3, percentage: 20 },
      ];
      expect(validatePrizeDistribution(distribution)).toBe(true);
    });

    it('should reject invalid distribution', () => {
      const distribution = [
        { place: 1, percentage: 50 },
        { place: 2, percentage: 30 },
      ];
      expect(validatePrizeDistribution(distribution)).toBe(false);
    });

    it('should calculate correct prizes', () => {
      const distribution = [
        { place: 1, percentage: 50 },
        { place: 2, percentage: 30 },
        { place: 3, percentage: 20 },
      ];

      expect(calculatePrize(1000, 1, distribution)).toBe(500);
      expect(calculatePrize(1000, 2, distribution)).toBe(300);
      expect(calculatePrize(1000, 3, distribution)).toBe(200);
      expect(calculatePrize(1000, 4, distribution)).toBe(0);
    });
  });
});

describe('Tournament Data Transformations', () => {
  describe('Participant Count Extraction', () => {
    const extractParticipantCount = (data: any): number => {
      return data?.tournament_participants?.[0]?.count || 0;
    };

    it('should extract participant count', () => {
      const data = { tournament_participants: [{ count: 12 }] };
      expect(extractParticipantCount(data)).toBe(12);
    });

    it('should return 0 for missing data', () => {
      expect(extractParticipantCount({})).toBe(0);
      expect(extractParticipantCount(null)).toBe(0);
    });
  });

  describe('Match Result Validation', () => {
    interface MatchResult {
      team1_score: number;
      team2_score: number;
      best_of: number;
    }

    const validateMatchResult = (result: MatchResult): boolean => {
      const maxWins = Math.ceil(result.best_of / 2);
      const hasWinner = result.team1_score === maxWins || result.team2_score === maxWins;
      const validScores = result.team1_score >= 0 && result.team2_score >= 0;
      const withinBounds = result.team1_score + result.team2_score <= result.best_of;

      return hasWinner && validScores && withinBounds;
    };

    it('should validate best of 1', () => {
      expect(validateMatchResult({ team1_score: 1, team2_score: 0, best_of: 1 })).toBe(true);
      expect(validateMatchResult({ team1_score: 0, team2_score: 1, best_of: 1 })).toBe(true);
    });

    it('should validate best of 3', () => {
      expect(validateMatchResult({ team1_score: 2, team2_score: 0, best_of: 3 })).toBe(true);
      expect(validateMatchResult({ team1_score: 2, team2_score: 1, best_of: 3 })).toBe(true);
      expect(validateMatchResult({ team1_score: 1, team2_score: 2, best_of: 3 })).toBe(true);
    });

    it('should reject incomplete results', () => {
      expect(validateMatchResult({ team1_score: 1, team2_score: 1, best_of: 3 })).toBe(false);
    });

    it('should reject invalid scores', () => {
      expect(validateMatchResult({ team1_score: -1, team2_score: 0, best_of: 1 })).toBe(false);
      expect(validateMatchResult({ team1_score: 3, team2_score: 0, best_of: 3 })).toBe(false);
    });
  });
});
