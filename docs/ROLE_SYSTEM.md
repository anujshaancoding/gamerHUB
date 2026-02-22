# GamerHub Role System

## Overview

GamerHub uses a 4-tier role hierarchy. Roles are determined from existing database fields — no separate "role" column is needed.

## Role Hierarchy

| Tier | DB Fields | Description |
|------|-----------|-------------|
| **Free** | Default (no flags set) | Basic social features |
| **Premium** | `profiles.is_premium = true` (or `premium_until > now()`) | Paid tier with extra capabilities |
| **Editor** | `profiles.is_admin = true` AND `admin_role = 'editor'` | Content moderator / editorial team |
| **Admin** | `profiles.is_admin = true` AND `admin_role = 'super_admin'` | Full platform control |

> **Note:** There is also a `moderator` admin_role, but it currently shares the same permission set as Editor in the permission utility.

---

## Permission Matrix

| Permission | Free | Premium | Editor | Admin |
|------------|:----:|:-------:|:------:|:-----:|
| Create friend posts | Yes | Yes | Yes | Yes |
| Like / comment on posts | Yes | Yes | Yes | Yes |
| Positive endorsements | Yes | Yes | Yes | Yes |
| Delete own comments | Yes | Yes | Yes | Yes |
| Delete comments on own blog posts | Yes | Yes | Yes | Yes |
| Create blog posts | No | Yes | Yes | Yes |
| Report users | No | Yes | Yes | Yes |
| Negative endorsements (predefined traits) | No | Yes | Yes | Yes |
| Use "News" blog category | No | No | Yes | Yes |
| Delete free users' friend posts | No | No | Yes | Yes |
| Hold blog posts (set to pending_review) | No | No | Yes | Yes |
| Add editor suggestions on blog posts | No | No | Yes | Yes |
| Approve / reject blog posts | No | No | Yes | Yes |
| Delete any comment | No | No | Yes | Yes |
| Full CRUD on all content | No | No | No | Yes |
| Manage users (flag, restrict, promote) | No | No | No | Yes |

---

## Negative Endorsement Traits

Premium+ users can give negative endorsements with predefined traits:

- **Toxic** — Verbal abuse or negative attitude
- **Quitter** — Frequently abandons games/matches
- **Uncooperative** — Refuses to work with the team
- **Uncommunicative** — Won't communicate during team play
- **Unreliable** — Doesn't show up or follow through

These are stored in the `trait_endorsements` table with `endorsement_type = 'negative'`.

---

## How to Promote a User

### Make someone an Editor
1. Go to **Admin Panel > Users**
2. Search for the user
3. Click the three-dot menu (⋯) on their row
4. Select **"Make Editor"**

This sets `is_admin = true` and `admin_role = 'editor'` on their profile.

### Remove admin/editor role
1. Same steps as above
2. Select **"Remove Admin"** — this sets `is_admin = false` and clears `admin_role`

### Make someone a Moderator
Same flow — select **"Make Moderator"** instead. Sets `admin_role = 'moderator'`.

> Only super_admin users can see these promotion/demotion options.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/permissions.ts` | Central permission logic — `getUserTier()`, `can.*` checks |
| `src/lib/hooks/usePermissions.ts` | Client-side React hook — combines admin + subscription state |
| `src/lib/api/check-permission.ts` | Server-side helper — `getUserPermissionContext(supabase)` |
| `src/lib/hooks/useAdmin.ts` | Fetches admin status from `/api/admin/check` |
| `src/app/api/admin/users/route.ts` | Admin user actions API (flag, restrict, make_admin, etc.) |

### How the permission system works

**Client-side:**
```tsx
import { usePermissions } from "@/lib/hooks/usePermissions";

function MyComponent() {
  const { tier, can: permissions } = usePermissions();

  if (permissions.useNewsCategory) {
    // Show news category option
  }
}
```

**Server-side (API routes):**
```ts
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";

const permCtx = await getUserPermissionContext(supabase);
const tier = permCtx ? getUserTier(permCtx) : "free";

if (!can.useNewsCategory(tier)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## Blog Workflow

1. **Free users** cannot create blog posts
2. **Premium users** can create blog posts (submitted for review by default unless `can_publish_directly` is set on their blog_authors entry)
3. **Editors** can:
   - Review submitted posts
   - Add editor suggestions (`editor_notes` field) — shown as a banner when the author edits their post
   - Hold posts (set status to `pending_review`)
   - Approve posts (set status to `published`)
   - Use the "News" category (restricted from other tiers)
4. **Admins** have full control over all blog content

---

## Database Tables Involved

- `profiles` — `is_admin`, `admin_role`, `is_premium`, `premium_until`
- `blog_posts` — `editor_notes` (TEXT), `status`, `category`
- `blog_authors` — `role` (author/editor/admin), `can_publish_directly`
- `trait_endorsements` — `endorsement_type` (positive/negative), negative trait booleans
- `blog_comments` — `status` (visible/hidden/deleted) for soft-delete
- `friend_posts` — community posts, deletable by editors+
- `user_reports` — only submittable by premium+
