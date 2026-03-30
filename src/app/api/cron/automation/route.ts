import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getSiteSettings } from "@/lib/db/site-settings";

// ── Auth: verify cron secret ──────────────────────────────────────────────────
function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Only accept Authorization header (query params leak into server logs)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${secret}`) return true;

  return false;
}

// ── Human-like timing engine ──────────────────────────────────────────────────

/** Get current IST hour (0-23) */
function getISTHour(): number {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  return Math.floor((istMinutes % 1440) / 60);
}

/** Is today a weekend? */
function isWeekend(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const day = istDate.getUTCDay();
  return day === 0 || day === 6;
}

/** Get today's date string in IST (YYYY-MM-DD) */
function getISTDateString(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
}

/**
 * Decide whether to act NOW based on human-like probability.
 * Instead of fixed intervals, we calculate the probability that a
 * human would post at this moment given the remaining daily budget.
 */
function shouldActNow(
  actionsToday: number,
  targetPerDay: number,
  activeStart: number,
  activeEnd: number,
  minGapMinutes: number,
  lastActionAt: Date | null,
  weekendBoost: boolean,
): boolean {
  const istHour = getISTHour();

  // Outside active hours? Never post
  if (activeEnd > activeStart) {
    if (istHour < activeStart || istHour >= activeEnd) return false;
  } else {
    // Wraps midnight (e.g., 22 to 6)
    if (istHour < activeStart && istHour >= activeEnd) return false;
  }

  // Already hit daily target?
  let adjustedTarget = targetPerDay;
  if (weekendBoost && isWeekend()) {
    adjustedTarget = Math.ceil(targetPerDay * 1.4);
  }
  if (actionsToday >= adjustedTarget) return false;

  // Minimum gap between actions
  if (lastActionAt) {
    const minutesSinceLast = (Date.now() - lastActionAt.getTime()) / 60000;
    if (minutesSinceLast < minGapMinutes) return false;
  }

  // Calculate probability: spread remaining actions over remaining active hours
  const hoursTotal = activeEnd > activeStart
    ? activeEnd - activeStart
    : (24 - activeStart) + activeEnd;
  const hoursElapsed = activeEnd > activeStart
    ? Math.max(0, istHour - activeStart)
    : istHour >= activeStart
      ? istHour - activeStart
      : (24 - activeStart) + istHour;
  const hoursRemaining = Math.max(1, hoursTotal - hoursElapsed);

  const remaining = adjustedTarget - actionsToday;
  // Base probability per 5-minute check: remaining / (hoursRemaining * 12 checks/hour)
  const checksRemaining = hoursRemaining * 12;
  let probability = remaining / checksRemaining;

  // Evening boost: 7 PM - 11 PM IST gets 1.5x probability (peak gaming hours)
  if (istHour >= 19 && istHour < 23) {
    probability *= 1.5;
  }

  // Add randomness: jitter so it doesn't feel mechanical
  probability *= 0.7 + Math.random() * 0.6; // 0.7x to 1.3x

  return Math.random() < probability;
}

// ── Content generation helpers ────────────────────────────────────────────────

const GAME_DATA: Record<string, { agents: string[]; ranks: string[]; maps: string[] }> = {
  valorant: {
    agents: ["Jett", "Reyna", "Omen", "Sage", "Sova", "Raze", "Phoenix", "Cypher", "Killjoy", "Viper", "Brimstone", "Breach", "Skye", "Yoru", "Astra", "KAY/O", "Chamber", "Neon", "Fade", "Harbor", "Gekko", "Deadlock", "Iso", "Clove", "Vyse", "Tejo", "Waylay"],
    ranks: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
    maps: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset", "Abyss"],
  },
  bgmi: {
    agents: [],
    ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Master", "Ace Dominator", "Conqueror"],
    maps: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa"],
  },
  freefire: {
    agents: [],
    ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grandmaster"],
    maps: ["Bermuda", "Kalahari", "Purgatory", "Alpine"],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillPlaceholders(template: string, gameSlug: string): string {
  const game = GAME_DATA[gameSlug] || GAME_DATA.valorant;
  return template
    .replace(/\{game\}/gi, gameSlug === "bgmi" ? "BGMI" : gameSlug === "freefire" ? "Free Fire" : "Valorant")
    .replace(/\{agent\}/gi, game.agents.length > 0 ? pick(game.agents) : "")
    .replace(/\{rank\}/gi, pick(game.ranks))
    .replace(/\{map\}/gi, game.maps.length > 0 ? pick(game.maps) : "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Main execution ────────────────────────────────────────────────────────────

async function executeAutomation(isManualTrigger = false): Promise<{
  action: string;
  details: string;
}> {
  const sql = getPool();
  const settings = await getSiteSettings();

  if (!settings.automation_enabled && !isManualTrigger) {
    return { action: "skip", details: "Automation is disabled" };
  }

  // Auto-cleanup: delete logs older than 90 days (runs on every check, lightweight)
  await sql`DELETE FROM auto_logs WHERE created_at < now() - interval '90 days'`.catch(() => {});

  // Single query: get today's counts + last action time + last persona used
  const todayStr = getISTDateString();
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE action_type IN ('post', 'comment'))::int AS total,
      COUNT(*) FILTER (WHERE action_type = 'post')::int AS posts,
      COUNT(*) FILTER (WHERE action_type = 'comment')::int AS comments,
      MAX(created_at) AS last_action_at,
      (SELECT persona_id FROM auto_logs ORDER BY created_at DESC LIMIT 1) AS last_persona_id
    FROM auto_logs
    WHERE created_at >= ${todayStr}::date
      AND created_at < (${todayStr}::date + interval '1 day')
  `;
  const todayPostCount = stats?.total || 0;
  const todayPosts = stats?.posts || 0;
  const todayComments = stats?.comments || 0;
  const lastActionAt = stats?.last_action_at ? new Date(stats.last_action_at as string) : null;
  const lastPersonaId = stats?.last_persona_id as string | null;

  // Decide: post or comment?
  const postBudgetLeft = Math.max(0, settings.automation_posts_per_day - todayPosts);
  const commentBudgetLeft = Math.max(0, settings.automation_comments_per_day - todayComments);
  const totalTarget = settings.automation_posts_per_day + settings.automation_comments_per_day;

  // Should we act now?
  if (!isManualTrigger) {
    const should = shouldActNow(
      todayPostCount,
      totalTarget,
      settings.automation_active_hours_start,
      settings.automation_active_hours_end,
      settings.automation_min_gap_minutes,
      lastActionAt,
      settings.automation_weekend_boost,
    );

    if (!should) {
      return {
        action: "skip",
        details: `Not acting now. Today: ${todayPosts} posts, ${todayComments} comments. Target: ${totalTarget}`,
      };
    }
  }

  // Pick action type based on remaining budget
  let actionType: "post" | "comment";
  if (postBudgetLeft > 0 && commentBudgetLeft > 0) {
    // Weight toward posts slightly
    actionType = Math.random() < 0.6 ? "post" : "comment";
  } else if (postBudgetLeft > 0) {
    actionType = "post";
  } else if (commentBudgetLeft > 0) {
    actionType = "comment";
  } else {
    return { action: "skip", details: "Daily budget exhausted" };
  }

  // Pick a random active persona (avoid the one that acted last for natural rotation)
  const personas = await sql`
    SELECT ap.*, p.username, p.display_name
    FROM auto_personas ap
    JOIN profiles p ON p.id = ap.profile_id
    WHERE ap.is_active = true
  `;

  if (personas.length === 0) {
    return { action: "skip", details: "No active personas configured" };
  }

  let persona;
  if (personas.length > 1 && lastPersonaId) {
    const others = personas.filter((p) => String(p.id) !== lastPersonaId);
    persona = others.length > 0 ? pick(others) : pick(personas);
  } else {
    persona = pick(personas);
  }

  if (actionType === "post") {
    return await createAutoPost(sql, persona, settings);
  } else {
    return await createAutoComment(sql, persona);
  }
}

async function createAutoPost(
  sql: ReturnType<typeof getPool>,
  persona: Record<string, unknown>,
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
): Promise<{ action: string; details: string }> {
  // Pick a template for community posts
  const preferredGames = (persona.preferred_games as string[]) || [];
  let templates;

  if (preferredGames.length > 0) {
    // Prefer game-specific templates, fall back to general
    templates = await sql`
      SELECT * FROM auto_templates
      WHERE type = 'community_post' AND is_active = true
        AND (game_slug = ANY(${preferredGames}) OR game_slug IS NULL)
      ORDER BY use_count ASC, RANDOM()
      LIMIT 5
    `;
  } else {
    templates = await sql`
      SELECT * FROM auto_templates
      WHERE type = 'community_post' AND is_active = true
      ORDER BY use_count ASC, RANDOM()
      LIMIT 5
    `;
  }

  if (templates.length === 0) {
    return { action: "skip", details: "No active post templates" };
  }

  // Pick least-used template with some randomness
  const template = pick(templates);
  const gameSlug = template.game_slug || (preferredGames.length > 0 ? pick(preferredGames) : "valorant");
  const content = fillPlaceholders(template.content as string, gameSlug);

  // Create the friend post
  const profileId = String(persona.profile_id);
  const [post] = await sql`
    INSERT INTO friend_posts (user_id, content, image_url, likes_count, comments_count)
    VALUES (${profileId}, ${content}, NULL, 0, 0)
    RETURNING id
  `;

  // Update template usage
  const tplId = String(template.id);
  await sql`
    UPDATE auto_templates
    SET use_count = use_count + 1, last_used_at = now()
    WHERE id = ${tplId}
  `;

  // Log it
  const pId = String(persona.id);
  const tId = String(template.id);
  const postId = String(post.id);
  const pUsername = String(persona.username);
  await sql`
    INSERT INTO auto_logs (persona_id, template_id, action_type, target_id, target_table, content_used, persona_username)
    VALUES (${pId}, ${tId}, 'post', ${postId}, 'friend_posts', ${content}, ${pUsername})
  `;

  return {
    action: "post",
    details: `Posted as @${pUsername}: "${content.slice(0, 80)}..."`,
  };
}

async function createAutoComment(
  sql: ReturnType<typeof getPool>,
  persona: Record<string, unknown>,
): Promise<{ action: string; details: string }> {
  // Find a recent post to comment on (not by this persona, not already commented by this persona)
  const cProfileId = String(persona.profile_id);
  const recentPosts = await sql`
    SELECT fp.id, fp.content, fp.user_id
    FROM friend_posts fp
    WHERE fp.created_at > now() - interval '3 days'
      AND fp.user_id != ${cProfileId}
      AND NOT EXISTS (
        SELECT 1 FROM friend_post_comments fpc
        WHERE fpc.post_id = fp.id AND fpc.user_id = ${cProfileId}
      )
    ORDER BY fp.created_at DESC
    LIMIT 10
  `;

  if (recentPosts.length === 0) {
    return { action: "skip", details: "No recent posts to comment on" };
  }

  const targetPost = pick(recentPosts);

  // Pick a comment template
  const templates = await sql`
    SELECT * FROM auto_templates
    WHERE type = 'comment' AND is_active = true
    ORDER BY use_count ASC, RANDOM()
    LIMIT 5
  `;

  if (templates.length === 0) {
    return { action: "skip", details: "No active comment templates" };
  }

  const template = pick(templates);
  const content = fillPlaceholders(template.content as string, "valorant");

  // Use RPC if available, otherwise direct insert
  const tPostId = String(targetPost.id);
  try {
    await sql`
      SELECT add_friend_post_comment(
        ${tPostId}::uuid,
        ${cProfileId}::uuid,
        ${content}
      )
    `;
  } catch {
    // Fallback: direct insert + update count
    await sql`
      INSERT INTO friend_post_comments (post_id, user_id, content)
      VALUES (${tPostId}, ${cProfileId}, ${content})
    `;
    await sql`
      UPDATE friend_posts
      SET comments_count = comments_count + 1
      WHERE id = ${tPostId}
    `;
  }

  // Update template usage
  const cTplId = String(template.id);
  await sql`
    UPDATE auto_templates
    SET use_count = use_count + 1, last_used_at = now()
    WHERE id = ${cTplId}
  `;

  // Log it
  const cPId = String(persona.id);
  const cTargetId = String(targetPost.id);
  const cUsername = String(persona.username);
  await sql`
    INSERT INTO auto_logs (persona_id, template_id, action_type, target_id, target_table, content_used, persona_username)
    VALUES (${cPId}, ${cTplId}, 'comment', ${cTargetId}, 'friend_post_comments', ${content}, ${cUsername})
  `;

  return {
    action: "comment",
    details: `Commented as @${cUsername}: "${content.slice(0, 60)}..."`,
  };
}

// ── Route handlers ────────────────────────────────────────────────────────────

// GET or POST - Trigger automation check
// Called by external cron service every 5 minutes
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeAutomation(false);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Automation cron error:", error);
    return NextResponse.json(
      { action: "error", details: String(error) },
      { status: 500 },
    );
  }
}

// POST - Manual trigger (cron service or internal call from admin trigger route)
export async function POST(request: NextRequest) {
  // Only accept Bearer token auth — admin panel triggers go through
  // /api/admin/automation/trigger which adds the Bearer header
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeAutomation(true);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Automation manual trigger error:", error);
    return NextResponse.json(
      { action: "error", details: String(error) },
      { status: 500 },
    );
  }
}
