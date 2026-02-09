import OpenAI from "openai";
import { GAME_KEYWORDS, INDIA_ASIA_KEYWORDS } from "./constants";
import type { NewsCategory, NewsRegion } from "@/types/news";

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

interface RelevanceResult {
  isRelevant: boolean;
  relevanceScore: number;
  detectedGame: string | null;
  reasoning: string;
}

interface SummaryResult {
  title: string;
  summary: string;
  excerpt: string;
}

interface ClassificationResult {
  category: NewsCategory;
  region: NewsRegion;
  tags: string[];
}

export async function filterRelevance(
  title: string,
  content: string,
  sourceGameSlug: string
): Promise<RelevanceResult> {
  const gameKeywordsList = Object.entries(GAME_KEYWORDS)
    .map(([game, keywords]) => `${game}: ${keywords.join(", ")}`)
    .join("\n");

  const prompt = `Analyze this article and determine if it's relevant to any of these games:

${gameKeywordsList}

The article was found from a source tagged as "${sourceGameSlug}".

Article Title: ${title}
Article Content (first 1000 chars): ${(content || "").substring(0, 1000)}

Rules:
- Score 0.8-1.0 if it's directly about one of these games (patch notes, tournament results, roster changes, updates)
- Score 0.5-0.7 if it mentions these games but is primarily about general esports or gaming
- Score 0.2-0.4 if it's tangentially related (general gaming industry news)
- Score 0.0-0.1 if it's completely unrelated (other games, non-gaming content, ads)
- IMPORTANT: Focus on India/Asia region content when possible. News about Indian/Asian tournaments, players, or events should score higher.
- Ignore world championship or western-focused tournament news unless it involves Asian teams.

Respond in JSON format:
{"isRelevant": true/false, "relevanceScore": 0.0-1.0, "detectedGame": "game-slug or null", "reasoning": "brief explanation"}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a gaming news filter for an Indian gaming community platform. You determine if articles are relevant to the supported games. Be strict about relevance.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result || '{"isRelevant": false, "relevanceScore": 0, "detectedGame": null, "reasoning": "Failed to parse"}');
  } catch (error) {
    console.error("AI relevance filter error:", error);
    return {
      isRelevant: true,
      relevanceScore: 0.5,
      detectedGame: sourceGameSlug,
      reasoning: "AI processing failed, defaulting to source game",
    };
  }
}

export async function summarizeArticle(
  title: string,
  content: string,
  gameSlug: string
): Promise<SummaryResult> {
  const indiaKeywords = INDIA_ASIA_KEYWORDS.join(", ");

  const prompt = `Rewrite this gaming news article for an Indian gaming community audience.

Original Title: ${title}
Game: ${gameSlug}
Original Content (first 2000 chars): ${(content || title).substring(0, 2000)}

Instructions:
1. Write a concise, engaging headline (max 120 chars). Keep it informative, not clickbait.
2. Write a 2-3 paragraph summary focusing on what matters to Indian/Asian competitive gamers. Highlight any India/Asia relevance.
3. Write a one-sentence excerpt (max 200 chars) for card display.

India/Asia relevance keywords to check for: ${indiaKeywords}

Respond in JSON format:
{"title": "...", "summary": "...", "excerpt": "..."}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a gaming news editor for GamerHub, an Indian gaming community platform. Write concise, factual summaries. Avoid clickbait. Focus on what matters to competitive gamers in India and Asia.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result || `{"title": "${title}", "summary": "", "excerpt": ""}`);
  } catch (error) {
    console.error("AI summarization error:", error);
    return {
      title,
      summary: (content || "").substring(0, 500),
      excerpt: title.substring(0, 200),
    };
  }
}

export async function classifyArticle(
  title: string,
  summary: string,
  gameSlug: string
): Promise<ClassificationResult> {
  const prompt = `Classify this gaming news article.

Title: ${title}
Game: ${gameSlug}
Summary: ${summary}

Categories (pick exactly one):
- patch: Game patches, balance changes, bug fixes, new agent/character releases
- tournament: Tournament announcements, results, brackets, qualifiers
- event: In-game events, limited-time modes, seasonal events, collaborations
- update: Game updates, new features, new maps, new modes (not balance patches)
- roster: Team roster changes, player transfers, org announcements
- meta: Meta analysis, tier lists, strategy discussions
- general: Everything else

Regions (pick the most relevant):
- india: Specifically about Indian esports/gaming scene
- asia: About Asian esports (Japan, Korea, SEA, China, Pacific)
- sea: Southeast Asia specifically
- global: International or no specific region

Also generate 2-5 relevant tags (lowercase, hyphenated).

Respond in JSON format:
{"category": "...", "region": "...", "tags": ["tag-1", "tag-2"]}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a news classifier for a gaming platform. Be precise with categorization. Prioritize India/Asia region detection.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    const result = response.choices[0].message.content;
    const parsed = JSON.parse(result || '{"category": "general", "region": "global", "tags": []}');

    // Validate category
    const validCategories: NewsCategory[] = ['patch', 'tournament', 'event', 'update', 'roster', 'meta', 'general'];
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'general';
    }

    // Validate region
    const validRegions: NewsRegion[] = ['india', 'asia', 'sea', 'global'];
    if (!validRegions.includes(parsed.region)) {
      parsed.region = 'global';
    }

    return parsed;
  } catch (error) {
    console.error("AI classification error:", error);
    return {
      category: 'general',
      region: 'global',
      tags: [],
    };
  }
}
