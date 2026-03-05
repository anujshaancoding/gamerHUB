# ggLobby - Project Instructions

## Infrastructure

**IMPORTANT:** The project has migrated from Supabase to a self-hosted VPS. Do NOT reference or suggest Supabase-specific features (Supabase Dashboard, Supabase Edge Functions, Supabase Auth UI, etc.). All backend and database changes should target the VPS deployment. The codebase still uses the Supabase JS client library to connect to a self-hosted PostgreSQL/PostgREST instance on the VPS — this is expected.

## Updates Page Maintenance

**IMPORTANT:** Whenever pushing code to GitHub, update the Updates page at `src/components/updates/updates-page-client.tsx` with the changes made.

### Rules:
1. **Only log significant changes** — major feature additions, notable UI overhauls, new pages/sections, API changes, important bug fixes, security patches, and performance improvements. Skip trivial changes like minor CSS tweaks, typo fixes, or small UI adjustments.
2. **Group updates by day** — all changes pushed on the same day should be combined into a single entry for that date. If an entry already exists for today, add new highlights to it rather than creating a duplicate entry.
3. **Maintain reverse chronological order** — newest entries go at the top of the `updates` array.
4. **Use the correct `type`** — `"feature"` for new functionality, `"improvement"` for enhancements to existing features, `"fix"` for bug fixes, `"security"` for security patches, `"performance"` for perf improvements, `"launch"` for major releases.
5. **Bump the version** — increment patch for fixes (1.8.1), minor for features/improvements (1.9.0), major for breaking/landmark releases (2.0.0). If adding to an existing day's entry, keep the same version unless the scope changed significantly.
6. **Use today's date and current time** in ISO format for the `date` field (e.g., `"2026-03-04T18:00:00"`).
7. **Entry format:**
   ```ts
   {
     date: "YYYY-MM-DDTHH:mm:ss",
     version: "x.y.z",
     type: "feature" | "improvement" | "fix" | "security" | "performance" | "launch",
     title: "Short descriptive title",
     description: "1-2 sentence summary of the changes.",
     highlights: [  // optional, for multi-point updates
       "Highlight 1",
       "Highlight 2",
     ],
   }
   ```
