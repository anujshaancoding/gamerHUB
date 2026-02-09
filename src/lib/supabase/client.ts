import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

declare global {
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side: always create a new client
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Client-side: use singleton stored on globalThis to survive strict mode
  // Note: @supabase/ssr's createBrowserClient automatically handles cookie-based
  // session persistence. Don't add custom auth.storageKey as it can cause
  // conflicts between localStorage and cookie-based sessions.
  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            "x-client-info": "gamer-hub",
          },
        },
      }
    );
  }

  return globalThis.__supabase_client__;
}
