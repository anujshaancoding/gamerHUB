# Game Profile Evolution — Phases 2, 3 & 4

Phase 1 (Self-Reported Profiles) is implemented. This document covers the remaining phases that build on top of it.

---

## Phase 2: Social Verification Layer

**Goal:** Let the community validate self-reported ranks and stats, increasing trust without needing game APIs.

### Features

#### Vouch System
- Users can "vouch" for another player's claimed rank (e.g., "I've played with them — they're legit Diamond")
- Each vouch is tied to a specific game on the user's profile
- Show vouch count on the game card: "5 players vouched"
- Users can only vouch once per player per game
- Vouching requires having the same game linked on your own profile

#### Verified vs Unverified Indicator
- Games with 0 vouches: "Self-Reported" badge (already implemented)
- Games with 3+ vouches: "Community Verified" badge (new tier)
- Games with API verification (Phase 4): "Verified" badge (existing)
- Badge hierarchy: Verified > Community Verified > Self-Reported

#### Screenshot Proof
- Users can upload a screenshot of their in-game rank screen
- Uses existing `media-uploader.tsx` and `optimizedUpload` system
- Screenshots shown in a "Proof" tab on the game profile
- Other users can report fake screenshots (feeds into moderation)

#### Trust Score Integration
- Vouch count feeds into the existing standing/trust system (`account_trust_scores`)
- Factor: `verification_depth` — how many of your games are community-verified
- Higher trust = higher power level score (adjust `calculatePowerLevel` formula)

### Database Changes
```sql
-- New table
CREATE TABLE game_vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_game_id UUID REFERENCES user_games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(voucher_id, user_game_id)  -- one vouch per person per game
);

-- Add screenshot field to user_games
ALTER TABLE user_games ADD COLUMN rank_proof_url TEXT;
```

### API Endpoints
- `POST /api/user-games/[id]/vouch` — vouch for a game profile
- `DELETE /api/user-games/[id]/vouch` — remove vouch
- `GET /api/user-games/[id]/vouches` — list vouchers

### Dependencies
- Phase 1 (complete)
- Existing media upload system
- Existing trust/standing system

---

## Phase 3: Platform-Earned Game Achievements

**Goal:** Create achievements and badges users earn through platform activity, not game API data. Keeps profiles rich and engagement high.

### Achievement Categories

#### Game Linking Achievements
| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| First Blood | Link your first game | Common |
| Arsenal | Link 3 games | Uncommon |
| Collection Complete | Link all supported games | Rare |

#### Community Engagement
| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| Trusted Player | Receive 10 vouches across all games | Uncommon |
| Community Verified | Get 3+ vouches on all linked games | Rare |
| Endorsement Machine | Endorse 50 players | Uncommon |
| Five-Star Teammate | Max out all 5 trait endorsement categories | Epic |

#### LFG & Social
| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| Squad Up | Complete 10 LFG matches | Uncommon |
| Team Captain | Create 25 LFG posts | Rare |
| Social Butterfly | Have 50+ followers | Uncommon |
| Clan Leader | Lead a clan with 10+ members | Rare |

#### Content Creation
| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| First Post | Publish your first blog post | Common |
| Viral Hit | Get 100+ views on a single post | Rare |
| Community Voice | 25 published blog posts | Epic |

#### Progression
| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| Level 10 | Reach level 10 | Common |
| Level 50 | Reach level 50 | Rare |
| Quest Master | Complete 100 quests | Epic |
| Prestige | Reach prestige level 1 | Legendary |

### Implementation Notes
- Use existing `achievements` table — it already supports game association, rarity, points, and public/private visibility
- Use existing `user_badges` system for display
- Achievement checks can be triggered by:
  - Database triggers (on insert to user_games, game_vouches, etc.)
  - Cron/background job checking conditions periodically
  - Inline checks after relevant mutations (e.g., after vouch, check vouch count)

### Dependencies
- Phase 1 (complete)
- Phase 2 (for vouch-based achievements)
- Existing badge/medal display system
- Existing progression system

---

## Phase 4: Game API Integration

**Goal:** When game APIs become available, connect them to automatically verify and sync real game data, replacing/enhancing self-reported data.

### Supported Providers (Planned)

| Provider | Games | Auth Method | Data Available |
|----------|-------|-------------|----------------|
| Riot Games | Valorant | OAuth 2.0 (RSO) | Rank, match history, agents, win rate, K/D |
| Krafton | BGMI | API Key + Player ID | Rank, stats, match history |
| Garena | Free Fire | API Key + Player ID | Rank, stats, characters |

### Data Flow

```
User connects provider → OAuth/API key stored in game_connections
  → Sync triggered → Fetch from external API
  → Upsert into game_stats + game_match_history
  → Update user_games: is_verified = true, rank = API rank, stats = API stats
  → Profile displays "Verified" badge
```

### Migration Strategy (Self-Reported → API-Verified)

1. When a user connects an API provider:
   - Match their `user_games` record for that game
   - Overwrite `rank` and `stats` with API data
   - Set `is_verified = true`
   - Preserve `game_username` and `role` if user set them (API may not have this)

2. If self-reported rank was **accurate** (within 1 tier of API rank):
   - Award "Honest Player" achievement badge
   - Boost trust score

3. If self-reported rank was **significantly inflated** (3+ tiers off):
   - Reduce trust score for that factor
   - No penalty beyond that — people might have deranked

### Auto-Sync Schedule
- On connect: immediate first sync
- Periodic: every 6 hours via background job
- Manual: user clicks "Sync" button (existing UI in connections page)
- Rate limiting: respect each API's rate limits

### Existing Infrastructure
The codebase already has most of this built:
- `game_connections` table with OAuth tokens
- `game_stats` and `game_match_history` tables
- `GameStatsCard` and `MatchHistoryCard` components
- Sync API route at `/api/integrations/sync/[gameId]`
- Connection management at `/settings/connections`

The main work is:
1. Obtaining API keys/OAuth credentials from game providers
2. Implementing the actual API client for each provider
3. Building the sync-to-user_games bridge (updating is_verified)
4. Background job system for periodic syncs

### Dependencies
- Phase 1 (complete)
- API credentials from game providers
- Background job infrastructure (e.g., node-cron, BullMQ on VPS)

---

## Timeline Suggestion

| Phase | Priority | Estimated Effort | When |
|-------|----------|-----------------|------|
| Phase 1 | Done | — | Implemented |
| Phase 2 | High | 1-2 weeks | Pre-launch or shortly after |
| Phase 3 | Medium | 1-2 weeks | Post-launch (drives engagement) |
| Phase 4 | Low (blocked) | 2-4 weeks | When API access is obtained |

Phase 2 should come first as it directly addresses the trust gap of self-reported data. Phase 3 keeps users engaged with progression goals. Phase 4 is the ultimate solution but depends on external factors.
