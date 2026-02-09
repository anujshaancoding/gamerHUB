// Untyped Supabase client helper for tables not yet in the generated types
// This is a temporary solution until types are regenerated from the database
import { createClient } from "./server";

/**
 * Creates a Supabase client with type checking disabled for new/untyped tables.
 * Use this for tables that haven't been added to the Database types yet.
 *
 * @example
 * const supabase = await createUntypedClient();
 * const { data } = await supabase.from("new_table").select("*");
 */
export async function createUntypedClient() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any;
}

/**
 * Tables that are not yet in the Database types:
 * - battle_passes
 * - battle_pass_rewards
 * - user_battle_passes
 * - automation_rules
 * - automation_logs
 * - discord_connections
 * - discord_guild_connections
 * - notifications
 * - notification_preferences
 * - scheduled_notifications
 * - discord_interactions
 * - game_connections
 * - game_oauth_tokens
 * - game_stats_sync
 * - streamer_profiles
 * - stream_schedules
 * - activity_feed
 * - news_posts
 * - forum_categories
 * - forum_posts
 * - forum_replies
 * - forum_votes
 * - player_skill_profiles
 * - match_suggestions
 * - match_outcomes
 * - shop_items
 * - user_wallets
 * - wallet_transactions
 * - currency_packs
 * - shop_purchases
 * - stripe_customers
 * - user_subscriptions
 * - subscription_plans
 */
