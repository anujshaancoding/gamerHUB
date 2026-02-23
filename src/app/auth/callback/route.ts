import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, gaming_style, region, bio")
          .eq("id", user.id)
          .single();

        // If profile doesn't exist (signup trigger may have failed), create it now
        if (!profile) {
          const meta = user.user_metadata || {};
          const fallbackUsername = "user_" + user.id.substring(0, 8);
          const { data: created } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              username: fallbackUsername,
              display_name: meta.full_name || meta.name || null,
              avatar_url: meta.avatar_url || meta.picture || null,
            })
            .select("username, display_name, gaming_style, region, bio")
            .single();
          profile = created;
        }

        // If profile exists but display_name is missing, patch it from Google metadata
        if (profile && !profile.display_name) {
          const meta = user.user_metadata || {};
          const googleName = meta.full_name || meta.name;
          if (googleName) {
            await supabase
              .from("profiles")
              .update({ display_name: googleName })
              .eq("id", user.id);
            profile = { ...profile, display_name: googleName };
          }
        }

        // If profile exists, has a real username (not auto-generated), and has onboarding fields filled
        const profileData = profile as { username: string | null; display_name: string | null; gaming_style: string | null; region: string | null; bio: string | null } | null;
        const hasRealUsername = profileData?.username && !profileData.username.startsWith("user_");
        const hasCompletedOnboarding = profileData && hasRealUsername && (
          profileData.gaming_style ||
          profileData.display_name ||
          profileData.region ||
          profileData.bio
        );

        // Always respect explicit next param (e.g. /update-password for password reset)
        if (next !== "/onboarding") {
          return NextResponse.redirect(`${origin}${next}`);
        }

        if (hasCompletedOnboarding) {
          return NextResponse.redirect(`${origin}/community`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
