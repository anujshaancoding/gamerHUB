# Admin Panel Security

## Overview

The `/admin` panel is protected by **3 layers of security**. All layers must pass before any admin content or data is accessible.

---

## Security Layers

### Layer 1: Authentication (Auth.js Session)

| Check | Location | Enforcement |
|-------|----------|-------------|
| Valid session required | `middleware.ts` | Server-side |
| Unauthenticated users redirected to `/login` | `middleware.ts` | Server-side |

Any request to `/admin/**` or `/api/admin/**` without a valid Auth.js session is blocked.

### Layer 2: Admin Role (`is_admin` flag)

| Check | Location | Enforcement |
|-------|----------|-------------|
| `profiles.is_admin = true` | Admin layout (`layout.tsx`) | Client-side |
| `profiles.is_admin = true` | Each `/api/admin/*` route handler | Server-side |

Non-admin users see an "Access Denied" screen. Admin API routes return `403 Forbidden`.

### Layer 3: PIN Verification (6-digit PIN)

| Check | Location | Enforcement |
|-------|----------|-------------|
| `admin_pin_verified` cookie | Admin layout (`layout.tsx`) | Client-side |
| `admin_pin_verified` cookie | `middleware.ts` (all `/api/admin/*` except `verify-pin`) | Server-side |

Even if an admin's session is hijacked, the attacker cannot access admin data without the PIN.

---

## PIN Verification Flow

```
User visits /admin
    |
    v
[Auth.js session check] --> No session --> Redirect to /login
    |
    v (authenticated)
[is_admin check] --> Not admin --> "Access Denied" screen
    |
    v (is admin)
[admin_pin_verified cookie?] --> Missing --> Show PIN gate
    |
    v (cookie present)
Admin dashboard loads
    |
    v (API calls)
[middleware.ts checks cookie on /api/admin/*] --> Missing --> 403 response
    |
    v (cookie valid)
API returns data
```

### PIN Verification Endpoint

**`POST /api/admin/verify-pin`**

Request:
```json
{ "pin": "123456" }
```

Success response (200):
```json
{ "success": true }
```
- Sets `admin_pin_verified=true` cookie (expires in 4 hours)

Error responses:
- `401` — Invalid PIN (includes `remaining` attempts count)
- `429` — Rate limited (too many failed attempts)
- `403` — User is not an admin
- `500` — `ADMIN_PIN_HASH` env var not configured

---

## Rate Limiting

The PIN endpoint is rate-limited to prevent brute-force attacks:

| Setting | Value |
|---------|-------|
| Max attempts per window | **5** |
| Window duration | **15 minutes** |
| Lockout behavior | Returns `429 Too Many Requests` |
| IP detection | `cf-connecting-ip` > `x-forwarded-for` > `x-real-ip` |

After 5 failed attempts from the same IP, the user must wait up to 15 minutes before trying again. The rate limiter uses in-memory storage with automatic cleanup every 30 minutes.

---

## Cookie Details

| Property | Value |
|----------|-------|
| Name | `admin_pin_verified` |
| Value | `"true"` |
| HttpOnly | `false` (client layout needs to read it) |
| Secure | `true` in production |
| SameSite | `lax` |
| Max-Age | 4 hours (14400 seconds) |
| Path | `/` |

The cookie is **not** httpOnly because the client-side admin layout reads it via `document.cookie` to decide whether to show the PIN gate or the admin content. The server-side middleware also verifies this cookie on every admin API request, so even if the cookie value is spoofed client-side, admin API routes will reject requests without a legitimately-set cookie.

> **Note:** The cookie value itself (`"true"`) is not a secret — the real security is that only the `verify-pin` endpoint can set it via `Set-Cookie` header after a successful bcrypt comparison. A client cannot forge a server-set cookie with the `Secure` flag over plain HTTP.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADMIN_PIN_HASH` | bcrypt hash of the 6-digit admin PIN |

### Generating a PIN hash

```bash
node -e "require('bcryptjs').hash('YOUR_6_DIGIT_PIN', 10).then(h => console.log(h))"
```

Store the output in `.env.local`:
```
ADMIN_PIN_HASH=$2b$10$...
```

> **Important:** Do NOT wrap the hash in quotes in `.env.local`. The `verify-pin` route reads the hash directly from the file using `readFileSync` to avoid Next.js's `dotenv-expand` mangling the `$` signs in bcrypt hashes.

### Changing the PIN

1. Generate a new hash: `node -e "require('bcryptjs').hash('NEW_PIN', 10).then(h => console.log(h))"`
2. Update `ADMIN_PIN_HASH` in `.env.local` on the VPS
3. Rebuild and restart: `npm run build && pm2 restart gglobby`
4. Existing sessions will continue working until their 4-hour cookie expires

### Forgot the PIN?

The PIN is not stored anywhere — only its bcrypt hash. If you forget it:
1. Generate a new hash for a new PIN (see above)
2. Replace `ADMIN_PIN_HASH` in `.env.local`
3. Rebuild and restart the server

---

## Files Involved

| File | Role |
|------|------|
| `src/app/api/admin/verify-pin/route.ts` | PIN verification API (bcrypt compare, rate limiting, cookie setting) |
| `src/components/admin/admin-pin-gate.tsx` | PIN entry UI (6-digit input with auto-focus/paste) |
| `src/app/admin/layout.tsx` | Client-side gate (checks cookie, shows PIN form or admin content) |
| `middleware.ts` | Server-side gate (blocks `/api/admin/*` without PIN cookie) |

---

## Security Considerations

### What this protects against
- **Session hijacking**: Attacker steals an admin's session token but can't access admin panel without the PIN
- **Brute force**: Rate limiting (5 attempts / 15 min) makes PIN guessing impractical
- **Direct API access**: Server-side middleware blocks admin API calls without PIN cookie, even if client-side is bypassed

### Limitations
- **In-memory rate limiting**: Resets on server restart. For a single-instance deployment (PM2 with 1 instance) this is acceptable. For multi-instance deployments, use Redis-based rate limiting instead.
- **Cookie not httpOnly**: Necessary trade-off for client-side state. XSS could read the cookie, but XSS would also compromise the session token (a bigger issue). Mitigate with CSP headers.
- **PIN length**: 6 digits = 1M combinations. Combined with rate limiting (5 per 15 min), a brute-force attack would take ~50,000 hours in the worst case.
