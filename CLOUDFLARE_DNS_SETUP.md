# Cloudflare DNS Setup for gglobby.in

## Why We Did This

On Feb 26, 2026, Supabase reported a DNS issue affecting customers using Custom Domains.
Although our Supabase project uses the default `*.supabase.co` domain (not affected),
we moved DNS to Cloudflare for better protection, performance, and resilience.

---

## What We Had Before

- **Domain Registrar:** Hostinger (gglobby.in + gglobby.com)
- **DNS Provider:** Hostinger (default nameservers)
- **Hosting:** Vercel (Next.js app)
- **A Record:** gglobby.in → 216.198.79.1 (Hostinger IP - wrong, should point to Vercel)
- **Email:** Hostinger email (MX records)

---

## What We Changed

### Step 1 - Created Cloudflare Account & Added Site

1. Created a free Cloudflare account at https://cloudflare.com
2. Added `gglobby.in` as a new site
3. Selected the Free plan
4. Cloudflare scanned and imported existing DNS records automatically

### Step 2 - Changed Nameservers at Hostinger

1. Logged in to Hostinger → Domains → gglobby.in
2. Changed nameservers from Hostinger's defaults to Cloudflare's nameservers
3. Waited for DNS propagation

### Step 3 - Fixed DNS Records in Cloudflare

**Deleted:**
- A record: `gglobby.in` → `216.198.79.1` (old Hostinger IP)

**Added:**
- CNAME: `@` → `cname.vercel-dns.com` (Proxied - orange cloud ON)

**Kept as-is (imported automatically):**
- CNAME: `www` → `gglobby.in` (Proxied)
- CNAME: `autoconfig` → `autoconfig.mail....` (Proxied)
- CNAME: `autodiscover` → `autodiscover.ma...` (Proxied)
- CNAME: `hostingermail-a` → `hostingermail-a....` (Proxied)
- CNAME: `hostingermail-b` → `hostingermail-b....` (Proxied)
- CNAME: `hostingermail-c` → `hostingermail-c....` (Proxied)
- MX: `gglobby.in` → `mx1.hostinge...` priority 5 (DNS only)
- MX: `gglobby.in` → `mx2.hostinge...` priority 10 (DNS only)
- TXT: `_dmarc` → `"v=DMARC1; p=..."` (DNS only)
- TXT: `gglobby.in` → `"v=spf1 include:..."` (DNS only)

### Step 4 - Set SSL/TLS to Full (Strict)

1. Cloudflare Dashboard → SSL/TLS → Overview
2. Set encryption mode to **Full (Strict)**
3. This ensures encrypted connection on both sides:
   - Browser ↔ Cloudflare (HTTPS)
   - Cloudflare ↔ Vercel origin server (HTTPS)

### Step 5 - Verified Vercel Domain Configuration

Checked Vercel Dashboard → Project Settings → Domains:
- `gglobby.com` → 307 redirect to `www.gglobby.in` ✅
- `gglobby.in` → 307 redirect to `www.gglobby.in` ✅
- `www.gglobby.in` → Production ✅
- `gamer-hub-one.vercel.app` → Production ✅

All showing "Valid Configuration".

---

## Final Architecture

```
User visits gglobby.in or www.gglobby.in
        │
        ▼
   ┌──────────┐
   │ Cloudflare│  ← DNS + CDN + DDoS Protection + SSL
   │  (Proxy)  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Vercel   │  ← Hosts the Next.js app
   │ (Origin)  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Supabase  │  ← Backend (trbmdbvnydxdmvnddort.supabase.co)
   │ (Default) │
   └──────────┘

Email: Still handled by Hostinger (MX records untouched)
Domain Registration: Still on Hostinger
```

---

## What Each Service Does Now

| Service    | Role                                      |
|------------|-------------------------------------------|
| Hostinger  | Domain registrar + Email (MX records)     |
| Cloudflare | DNS management + CDN + Proxy + SSL + DDoS |
| Vercel     | App hosting (Next.js)                     |
| Supabase   | Database + Auth + Storage (default domain)|

---

## Benefits of This Setup

1. **Cloudflare Proxy** - Hides your origin server IP, protects against DDoS
2. **CDN Caching** - Static assets served from Cloudflare edge (faster globally)
3. **SSL/TLS Full Strict** - End-to-end encryption
4. **DNS Resilience** - Cloudflare's DNS is more reliable than Hostinger's
5. **Bot Protection** - Cloudflare's bot fight mode
6. **Future-proof** - If Supabase DNS issues happen again, Cloudflare can help route around them

---

## Date: February 27, 2026
