-- Migration 065: Fix Supabase Advisor Security Warnings
--
-- Fixes two categories of warnings:
--   1. "Security Definer View" — views that bypass caller RLS
--   2. "Function Search Path Mutable" — functions without explicit search_path
--
-- Safety notes:
--   - ALTER FUNCTION SET search_path only pins schema resolution. Zero logic change.
--   - ALTER VIEW SET (security_invoker = true) makes views respect caller RLS.
--     Only applied to views whose underlying tables all have public SELECT policies.
--
-- Intentionally SKIPPED views:
--   - public.trust_badges: reads account_trust which restricts SELECT to own row.
--     Enabling security_invoker would hide other users' badges on profiles.
--   - public.active_challenges: participant_count subquery reads challenge_progress
--     which restricts non-completed rows to auth.uid(). Count would be inaccurate.
--
-- Uses exception handling to gracefully skip functions/views that were removed
-- by cleanup migrations (e.g. 044, 999).


-- ============================================================
-- PART 1: Views — enable security_invoker = true
-- ============================================================

DO $$
DECLARE
  v TEXT;
  views TEXT[] := ARRAY[
    'leaderboard_global',
    'leaderboard_regional',
    'friends_view',
    'following_only_view',
    'followers_only_view',
    'demo_profiles_complete',
    'demo_posts_complete'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      RAISE NOTICE 'Fixed view: %', v;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped missing view: %', v;
    END;
  END LOOP;
END $$;


-- ============================================================
-- PART 2: Functions — SET search_path = public
-- ============================================================

DO $$
DECLARE
  f TEXT;
  funcs TEXT[] := ARRAY[
    -- Trigger functions (no parameters)
    'handle_new_user()',
    'handle_clan_member_join()',
    'handle_clan_member_leave()',
    'handle_clan_member_role_change()',
    'handle_new_profile_gamification()',
    'handle_match_completion_xp()',
    'handle_challenge_completion_xp()',
    'advance_tournament_winner()',
    'log_tournament_activity()',
    'update_user_premium_status()',
    'create_badge_earned_activity()',
    'create_account_verification()',
    'update_party_member_count()',
    'create_accessibility_settings()',
    'create_default_notification_preferences()',
    'update_regional_community_member_count()',
    'update_dna_from_peer_ratings()',
    'log_mood_change()',
    'update_lfg_player_count()',
    'update_blog_likes_count()',
    'update_blog_comments_count()',
    'update_blog_author_count()',
    'update_comment_likes_count()',
    'update_reputation_score()',
    'notify_friend_request_events()',
    'update_news_article_likes_count()',
    'update_news_article_comments_count()',
    'update_news_comment_likes_count()',
    'update_listing_likes_count()',
    'update_listing_comments_count()',
    'update_listing_comment_likes_count()',
    'increment_profile_views()',
    'check_badge_eligibility()',
    'update_updated_at_column()',
    'update_calls_updated_at()',
    'update_game_connections_timestamp()',
    'generate_blog_slug()',

    -- Parameterized functions
    'is_conversation_member(UUID, UUID)',
    'create_direct_conversation(UUID)',
    'award_xp(UUID, INT, VARCHAR, UUID, TEXT, UUID)',
    'assign_quests(UUID, VARCHAR)',
    'update_quest_progress(UUID, VARCHAR, JSONB)',
    'calculate_xp_for_level(INT)',
    'initialize_season_points(UUID, UUID, UUID)',
    'award_points(UUID, UUID, UUID, INT, VARCHAR, VARCHAR, UUID, TEXT)',
    'update_challenge_progress(UUID, UUID, INT, INT)',
    'refresh_leaderboard_rankings(UUID)',
    'grant_season_rewards(UUID)',
    'are_friends(UUID, UUID)',
    'get_relationship_status(UUID, UUID)',
    'send_friend_request(UUID, UUID, TEXT)',
    'accept_friend_request(UUID, UUID)',
    'decline_friend_request(UUID, UUID)',
    'cancel_friend_request(UUID, UUID)',
    'remove_friend(UUID, UUID)',
    'get_friends(UUID)',
    'get_friend_count(UUID)',
    'get_followers_only_count(UUID)',
    'get_following_only_count(UUID)',
    'get_mutual_friends(UUID, INT)',
    'get_similar_rank_players(UUID, INT, INT)',
    'get_pro_players_by_games(UUID, INT)',
    'get_popular_pro_players(INT)',
    'get_user_friends_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_followers_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_following_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_social_counts(UUID)',
    'is_user_premium(UUID)',
    'get_active_battle_pass()',
    'award_battle_pass_xp(UUID, INT)',
    'claim_battle_pass_reward(UUID, UUID)',
    'get_or_create_wallet(UUID)',
    'add_currency(UUID, VARCHAR, INT, VARCHAR, UUID, TEXT)',
    'purchase_shop_item(UUID, UUID, VARCHAR)',
    'create_activity(UUID, VARCHAR, VARCHAR, UUID, JSONB, VARCHAR)',
    'toggle_activity_reaction(UUID, UUID, VARCHAR)',
    'get_user_game_connections(UUID)',
    'upsert_game_stats(UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB)',
    'start_game_sync(UUID, UUID, TEXT)',
    'generate_post_slug(TEXT, UUID)',
    'create_forum_post(UUID, UUID, TEXT, TEXT, forum_post_type, TEXT[])',
    'create_forum_reply(UUID, UUID, TEXT, UUID)',
    'toggle_forum_vote(UUID, SMALLINT, UUID, UUID)',
    'mark_reply_as_solution(UUID, UUID, UUID)',
    'increment_post_views(UUID)',
    'get_live_streamers(INTEGER)',
    'update_stream_status(TEXT, stream_status, TEXT, TEXT, INTEGER)',
    'toggle_streamer_follow(UUID, UUID)',
    'get_or_create_skill_profile(UUID, TEXT)',
    'update_skill_rating(UUID, TEXT, BOOLEAN, DECIMAL)',
    'find_similar_players(UUID, TEXT, INTEGER)',
    'respond_to_suggestion(UUID, UUID, TEXT, TEXT, TEXT)',
    'get_user_notifications(UUID, INTEGER, INTEGER, BOOLEAN)',
    'mark_notifications_read(UUID, UUID[])',
    'create_notification(UUID, notification_type, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)',
    'execute_automation_rule(UUID, JSONB)',
    'get_rules_for_trigger(UUID, automation_trigger)',
    'expire_lfg_posts()',
    'increment_blog_view(TEXT)',
    'calculate_trust_score(UUID)',
    'is_user_blocked(UUID, UUID)',
    'get_verification_level(UUID)',
    'check_endorsement_rate_limit(UUID)',
    'match_discord_friends(UUID)',
    'generate_party_invite_code()',
    'cleanup_expired_parties()',
    'generate_overlay_token()',
    'calculate_mood_compatibility(UUID, UUID)',
    'detect_tilt(UUID)',
    'increment_news_view(UUID)',
    'record_heartbeat_activity(UUID)'
  ];
BEGIN
  FOREACH f IN ARRAY funcs LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', f);
      RAISE NOTICE 'Fixed function: %', f;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped missing function: %', f;
    END;
  END LOOP;
END $$;
