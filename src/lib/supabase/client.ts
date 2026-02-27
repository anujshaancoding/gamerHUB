import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;


declare global {
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

/**
 * Simple in-memory lock to replace navigator.locks which can time out
 * on mobile browsers causing "LockManager lock timed out" errors.
 */
const lockMap = new Map<string, Promise<unknown>>();

function navigatorLockFallback<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  const prev = lockMap.get(name) ?? Promise.resolve();

  // Use .catch(() => {}) so a rejected previous operation doesn't
  // poison the chain and permanently prevent subsequent operations.
  let waitForPrev: Promise<void> = prev.catch(() => {}) as Promise<void>;

  // Respect acquireTimeout when positive — abort if we can't acquire in time.
  if (acquireTimeout > 0) {
    waitForPrev = Promise.race([
      waitForPrev,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Lock acquire timeout")), acquireTimeout)
      ),
    ]);
  }

  const next = waitForPrev.then(() => fn()).finally(() => {
    if (lockMap.get(name) === next) lockMap.delete(name);
  });
  lockMap.set(name, next);
  return next;
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
        auth: {
          // Use in-memory lock instead of navigator.locks to prevent
          // "Acquiring an exclusive Navigator LockManager lock timed out" errors
          // that occur on mobile browsers and under heavy concurrent access.
          lock: navigatorLockFallback,
        },
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
