// OpenAI Integration for AI-Powered Matchmaking
import OpenAI from "openai";

// Lazily initialize OpenAI client to avoid build errors when API key is not set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

interface PlayerProfile {
  userId: string;
  username: string;
  gameId: string;
  skillRating: number;
  aggressionScore: number;
  teamworkScore: number;
  communicationScore: number;
  consistencyScore: number;
  preferredRoles: string[];
  preferredAgents: string[];
  avgKda: number;
  winRate: number;
  recentForm: number;
  languagePreferences: string[];
}

interface MatchSuggestion {
  suggestedUserIds: string[];
  compatibilityScore: number;
  reasoning: string;
  matchFactors: {
    skillBalance: number;
    playstyleCompatibility: number;
    roleComplementarity: number;
    communicationMatch: number;
    scheduleOverlap: number;
  };
}

interface TeamBalanceResult {
  teamA: string[];
  teamB: string[];
  balanceScore: number;
  reasoning: string;
  alternatives: Array<{
    teamA: string[];
    teamB: string[];
    score: number;
    reasoning: string;
  }>;
}

// Generate player embedding for similarity search
export async function generatePlayerEmbedding(
  profile: PlayerProfile
): Promise<number[]> {
  const profileText = `
    Game: ${profile.gameId}
    Skill Rating: ${profile.skillRating}
    Play Style: Aggression ${profile.aggressionScore}/100, Teamwork ${profile.teamworkScore}/100, Communication ${profile.communicationScore}/100
    Consistency: ${profile.consistencyScore}/100
    Preferred Roles: ${profile.preferredRoles.join(", ") || "Flexible"}
    Preferred Characters: ${profile.preferredAgents.join(", ") || "Various"}
    Performance: KDA ${profile.avgKda}, Win Rate ${profile.winRate}%
    Recent Form: ${profile.recentForm}/100
    Languages: ${profile.languagePreferences.join(", ")}
  `.trim();

  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: profileText,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

// Generate playstyle summary using GPT
export async function generatePlaystyleSummary(
  profile: PlayerProfile
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
}> {
  const prompt = `Analyze this ${profile.gameId} player's profile and provide a brief playstyle summary.

Player Stats:
- Skill Rating: ${profile.skillRating}
- Aggression: ${profile.aggressionScore}/100
- Teamwork: ${profile.teamworkScore}/100
- Communication: ${profile.communicationScore}/100
- Consistency: ${profile.consistencyScore}/100
- KDA: ${profile.avgKda}
- Win Rate: ${profile.winRate}%
- Recent Form: ${profile.recentForm}/100
- Preferred Roles: ${profile.preferredRoles.join(", ") || "Flexible"}
- Preferred Characters: ${profile.preferredAgents.join(", ") || "Various"}

Provide:
1. A 1-2 sentence playstyle summary
2. 2-3 key strengths
3. 1-2 areas for improvement

Respond in JSON format:
{"summary": "...", "strengths": ["...", "..."], "weaknesses": ["..."]}`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a gaming analyst that provides concise, insightful player assessments. Be encouraging but honest.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || '{"summary": "", "strengths": [], "weaknesses": []}');
}

// Suggest compatible teammates
export async function suggestTeammates(
  player: PlayerProfile,
  candidates: PlayerProfile[],
  numSuggestions: number = 5
): Promise<MatchSuggestion[]> {
  if (candidates.length === 0) {
    return [];
  }

  const candidatesText = candidates
    .map(
      (c, i) => `
Player ${i + 1} (${c.username}):
- Skill: ${c.skillRating}
- Style: Aggression ${c.aggressionScore}, Teamwork ${c.teamworkScore}, Communication ${c.communicationScore}
- Roles: ${c.preferredRoles.join(", ") || "Flexible"}
- KDA: ${c.avgKda}, Win Rate: ${c.winRate}%
- Languages: ${c.languagePreferences.join(", ")}`
    )
    .join("\n");

  const prompt = `You're helping find compatible teammates for a ${player.gameId} player.

Target Player (${player.username}):
- Skill: ${player.skillRating}
- Style: Aggression ${player.aggressionScore}, Teamwork ${player.teamworkScore}, Communication ${player.communicationScore}
- Roles: ${player.preferredRoles.join(", ") || "Flexible"}
- KDA: ${player.avgKda}, Win Rate: ${player.winRate}%
- Languages: ${player.languagePreferences.join(", ")}

Candidate Teammates:
${candidatesText}

Suggest the top ${numSuggestions} most compatible teammates. Consider:
1. Complementary roles (not overlapping mains)
2. Similar skill level (±200 rating)
3. Matching communication and teamwork scores
4. Language compatibility
5. Playstyle synergy (aggressive players can pair with support-oriented players)

Respond in JSON format:
{
  "suggestions": [
    {
      "playerIndex": 0,
      "compatibilityScore": 85,
      "reasoning": "Brief explanation",
      "factors": {
        "skillBalance": 90,
        "playstyleCompatibility": 80,
        "roleComplementarity": 85,
        "communicationMatch": 90,
        "scheduleOverlap": 75
      }
    }
  ]
}`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert gaming matchmaker. Provide accurate, helpful teammate suggestions based on player compatibility.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(content || '{"suggestions": []}');

  return result.suggestions.map(
    (s: {
      playerIndex: number;
      compatibilityScore: number;
      reasoning: string;
      factors: {
        skillBalance: number;
        playstyleCompatibility: number;
        roleComplementarity: number;
        communicationMatch: number;
        scheduleOverlap: number;
      };
    }) => ({
      suggestedUserIds: [candidates[s.playerIndex].userId],
      compatibilityScore: s.compatibilityScore,
      reasoning: s.reasoning,
      matchFactors: s.factors,
    })
  );
}

// Suggest balanced opponents
export async function suggestOpponents(
  player: PlayerProfile,
  candidates: PlayerProfile[],
  numSuggestions: number = 5
): Promise<MatchSuggestion[]> {
  if (candidates.length === 0) {
    return [];
  }

  const candidatesText = candidates
    .map(
      (c, i) => `
Player ${i + 1} (${c.username}):
- Skill: ${c.skillRating}
- Style: Aggression ${c.aggressionScore}
- KDA: ${c.avgKda}, Win Rate: ${c.winRate}%
- Recent Form: ${c.recentForm}`
    )
    .join("\n");

  const prompt = `You're finding fair opponents for a ${player.gameId} match.

Target Player (${player.username}):
- Skill: ${player.skillRating}
- Style: Aggression ${player.aggressionScore}
- KDA: ${player.avgKda}, Win Rate: ${player.winRate}%
- Recent Form: ${player.recentForm}

Potential Opponents:
${candidatesText}

Suggest ${numSuggestions} opponents that would create balanced, exciting matches. Consider:
1. Similar skill rating (±150 for fair matches, ±300 for challenging)
2. Complementary aggression (aggressive vs defensive can be exciting)
3. Similar recent form

Respond in JSON format:
{
  "suggestions": [
    {
      "playerIndex": 0,
      "compatibilityScore": 85,
      "reasoning": "Brief explanation of why this would be a good match",
      "factors": {
        "skillBalance": 90,
        "playstyleCompatibility": 80,
        "roleComplementarity": 0,
        "communicationMatch": 0,
        "scheduleOverlap": 0
      }
    }
  ]
}`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert gaming matchmaker. Focus on creating balanced, enjoyable competitive matches.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(content || '{"suggestions": []}');

  return result.suggestions.map(
    (s: {
      playerIndex: number;
      compatibilityScore: number;
      reasoning: string;
      factors: {
        skillBalance: number;
        playstyleCompatibility: number;
        roleComplementarity: number;
        communicationMatch: number;
        scheduleOverlap: number;
      };
    }) => ({
      suggestedUserIds: [candidates[s.playerIndex].userId],
      compatibilityScore: s.compatibilityScore,
      reasoning: s.reasoning,
      matchFactors: s.factors,
    })
  );
}

// Balance teams from a pool of players
export async function balanceTeams(
  players: PlayerProfile[],
  gameId: string
): Promise<TeamBalanceResult> {
  if (players.length < 2) {
    throw new Error("Need at least 2 players to balance teams");
  }

  const playersText = players
    .map(
      (p, i) => `
Player ${i + 1} (${p.username}):
- Skill: ${p.skillRating}
- Roles: ${p.preferredRoles.join(", ") || "Flexible"}
- Style: Aggression ${p.aggressionScore}, Teamwork ${p.teamworkScore}
- KDA: ${p.avgKda}`
    )
    .join("\n");

  const teamSize = Math.floor(players.length / 2);

  const prompt = `Balance these ${players.length} ${gameId} players into two fair teams of ${teamSize} players each.

Players:
${playersText}

Create balanced teams considering:
1. Similar total skill rating per team
2. Role distribution (each team should have variety)
3. Communication/teamwork balance
4. Mix of aggressive and supportive players

Provide the main suggestion and 2 alternatives.

Respond in JSON format:
{
  "primary": {
    "teamA": [0, 2, 4],
    "teamB": [1, 3, 5],
    "balanceScore": 92,
    "reasoning": "Why these teams are balanced"
  },
  "alternatives": [
    {
      "teamA": [0, 3, 5],
      "teamB": [1, 2, 4],
      "score": 88,
      "reasoning": "Alternative reasoning"
    }
  ]
}

Use player indices (0-based) in the arrays.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at creating balanced gaming teams. Focus on fairness and player enjoyment.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 800,
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(
    content ||
      '{"primary": {"teamA": [], "teamB": [], "balanceScore": 0, "reasoning": ""}, "alternatives": []}'
  );

  return {
    teamA: result.primary.teamA.map((i: number) => players[i].userId),
    teamB: result.primary.teamB.map((i: number) => players[i].userId),
    balanceScore: result.primary.balanceScore,
    reasoning: result.primary.reasoning,
    alternatives: result.alternatives.map(
      (alt: { teamA: number[]; teamB: number[]; score: number; reasoning: string }) => ({
        teamA: alt.teamA.map((i) => players[i].userId),
        teamB: alt.teamB.map((i) => players[i].userId),
        score: alt.score,
        reasoning: alt.reasoning,
      })
    ),
  };
}

// Predict match outcome
export async function predictMatchOutcome(
  teamA: PlayerProfile[],
  teamB: PlayerProfile[],
  gameId: string
): Promise<{
  predictedWinner: "team_a" | "team_b" | "even";
  teamAWinProbability: number;
  reasoning: string;
  keyFactors: string[];
}> {
  const teamAText = teamA
    .map((p) => `${p.username}: Skill ${p.skillRating}, KDA ${p.avgKda}, WR ${p.winRate}%`)
    .join(", ");

  const teamBText = teamB
    .map((p) => `${p.username}: Skill ${p.skillRating}, KDA ${p.avgKda}, WR ${p.winRate}%`)
    .join(", ");

  const prompt = `Predict the outcome of this ${gameId} match.

Team A: ${teamAText}
Team B: ${teamBText}

Analyze team compositions and predict the winner. Consider skill ratings, recent performance, and team synergy.

Respond in JSON format:
{
  "predictedWinner": "team_a" or "team_b" or "even",
  "teamAWinProbability": 55,
  "reasoning": "Brief explanation",
  "keyFactors": ["Factor 1", "Factor 2"]
}`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a gaming analyst. Provide fair, data-driven match predictions.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(
    content ||
      '{"predictedWinner": "even", "teamAWinProbability": 50, "reasoning": "", "keyFactors": []}'
  );
}
