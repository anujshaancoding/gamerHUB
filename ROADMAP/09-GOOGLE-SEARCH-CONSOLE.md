# Google Search Console Setup Guide for ggLobby

## Overview

Google Search Console (GSC) is a free tool that helps you monitor your site's presence in Google Search results. It shows how Google crawls and indexes your site, which queries bring users to your site, and alerts you to issues.

---

## Step 1: Create a Google Search Console Account

1. Go to **https://search.google.com/search-console**
2. Sign in with the Google account you want to manage ggLobby with
3. Click **"Add property"**

## Step 2: Choose Property Type

You'll see two options:

| Type | Scope | Verification |
|------|-------|-------------|
| **Domain** (`gglobby.com`) | Covers ALL subdomains, protocols (http/https), and paths | DNS only |
| **URL Prefix** (`https://gglobby.com`) | Covers only that exact URL prefix | Multiple options |

### Recommended: Domain Property

Choose **Domain** → type `gglobby.com` to cover everything (www, non-www, subdomains, etc.).

---

## Step 3: Verify Ownership

### Option A: DNS Verification (Best for Domain property)

1. Google will give you a TXT record like:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
2. Go to your domain registrar (Namecheap, Cloudflare, GoDaddy, etc.)
3. Navigate to **DNS Settings** for `gglobby.com`
4. Add a new **TXT record**:
   - **Host/Name:** `@` (or leave blank)
   - **Type:** `TXT`
   - **Value:** paste the full `google-site-verification=...` string
   - **TTL:** Auto or 3600
5. Click Save
6. Go back to Google Search Console and click **Verify**
7. DNS can take up to 48 hours to propagate, but usually works within minutes

### Option B: HTML Meta Tag (If using URL Prefix)

1. Google will give you a meta tag like:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXX" />
   ```
2. Add it to your Next.js root layout metadata in `src/app/layout.tsx`:
   ```typescript
   export const metadata: Metadata = {
     title: "ggLobby - Where Gamers Unite",
     // ... existing metadata ...
     verification: {
       google: "XXXXXXXXXXXXXXXX", // paste just the content value here
     },
   };
   ```
3. Deploy the change to production
4. Go back to Google Search Console and click **Verify**

### Option C: HTML File Upload

1. Google will give you a file like `googleXXXXXXXXXXXXXXXX.html`
2. Place it in the `public/` directory of your project:
   ```
   public/googleXXXXXXXXXXXXXXXX.html
   ```
3. Deploy to production
4. Verify the file is accessible at `https://gglobby.com/googleXXXXXXXXXXXXXXXX.html`
5. Go back to Google Search Console and click **Verify**

---

## Step 4: Submit Your Sitemap

Your sitemap is already configured at `src/app/sitemap.ts` and serves at:
```
https://gglobby.com/sitemap.xml
```

1. In Search Console, go to **Sitemaps** (left sidebar)
2. Enter `sitemap.xml` in the "Add a new sitemap" field
3. Click **Submit**
4. Status should change to **"Success"** after Google processes it

### What your sitemap currently includes:
- Homepage, blog, community, clans, find-gamers (static pages)
- Privacy, terms, guidelines, login, register
- All blog category filter pages
- All published blog post pages (dynamically fetched)

---

## Step 5: Initial Configuration

### 5a. Set Preferred Domain (if URL Prefix)
- If you have both `www` and non-www, set your preferred version in **Settings → Property settings**

### 5b. Associate Google Analytics
- Go to **Settings → Associations**
- Link your Google Analytics property if you have one

### 5c. Add Team Members
- Go to **Settings → Users and permissions**
- Add any team members with appropriate roles:
  - **Owner** — full access
  - **Full** — can view all data and take most actions
  - **Restricted** — view only

---

## Step 6: Monitor Key Reports

Once verified and data starts flowing (1-3 days), check these:

### Performance Report
- **What:** Shows clicks, impressions, CTR, and average position
- **Where:** Performance → Search results
- **Action:** Identify top queries and pages; optimize titles/descriptions for low-CTR pages

### Coverage / Indexing Report
- **What:** Shows which pages are indexed, excluded, or have errors
- **Where:** Pages (left sidebar)
- **Action:** Fix any errors (404s, server errors, redirect issues)

### Core Web Vitals
- **What:** Page speed and UX metrics (LCP, FID, CLS)
- **Where:** Experience → Core Web Vitals
- **Action:** Fix any "Poor" or "Needs improvement" URLs

### Mobile Usability
- **What:** Mobile-specific issues
- **Where:** Experience → Mobile Usability
- **Action:** Fix any flagged issues (ggLobby is already mobile-first as a PWA)

---

## Step 7: Request Indexing (for new/updated pages)

1. Go to the **URL Inspection** tool (top search bar)
2. Paste the full URL of the page you want indexed
3. Click **"Request Indexing"**
4. Google will crawl the page within hours to days

Use this when you:
- Launch a new major page
- Significantly update an existing page
- Fix an issue that was preventing indexing

---

## Current SEO Setup (Already Done)

Your project already has these SEO foundations in place:

| Feature | File | Status |
|---------|------|--------|
| Dynamic Sitemap | `src/app/sitemap.ts` | Includes static + blog pages |
| Robots.txt | `src/app/robots.ts` | Allows public pages, blocks private routes |
| OpenGraph Metadata | `src/app/layout.tsx` | Title, description, type, siteName |
| Twitter Card | `src/app/layout.tsx` | summary_large_image |
| PWA Manifest | `public/manifest.json` | Full PWA support |
| Semantic Keywords | `src/app/layout.tsx` | Gaming-related keywords |

---

## Checklist

- [ ] Create Google Search Console account
- [ ] Add `gglobby.com` as a Domain property
- [ ] Add DNS TXT record for verification
- [ ] Wait for verification to succeed
- [ ] Submit `sitemap.xml`
- [ ] Check indexing report after 3-5 days
- [ ] Monitor Core Web Vitals
- [ ] Set up email alerts for critical issues
- [ ] (Optional) Add `verification.google` to layout.tsx metadata
- [ ] (Optional) Link Google Analytics

---

## Useful Links

- Google Search Console: https://search.google.com/search-console
- Search Console Help: https://support.google.com/webmasters
- Sitemap Guide: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Core Web Vitals: https://web.dev/vitals/
