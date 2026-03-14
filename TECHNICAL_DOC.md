# SteelX Stack — Technical Documentation

A comprehensive technical breakdown of the SteelX fitness creator storefront application — architecture, services, data flow, security, and deployment.

---

## Table of Contents

1. [What Is This App?](#1-what-is-this-app)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Authentication & Security](#4-authentication--security)
5. [Data Storage — Why Upstash Redis?](#5-data-storage--why-upstash-redis)
6. [Image Storage — Vercel Blob](#6-image-storage--vercel-blob)
7. [How Admin Changes Reflect on the Public Page](#7-how-admin-changes-reflect-on-the-public-page)
8. [URL Metadata Scraping](#8-url-metadata-scraping)
9. [Deployment — Why Vercel?](#9-deployment--why-vercel)
10. [Data Migration Strategy](#10-data-migration-strategy)
11. [Environment Variables](#11-environment-variables)
12. [Complete Request Lifecycle](#12-complete-request-lifecycle)
13. [Project File Structure](#13-project-file-structure)
14. [Third-Party Services Summary](#14-third-party-services-summary)
15. [Libraries & Why Each Was Chosen](#15-libraries--why-each-was-chosen)
16. [Theme System (Dark/Light)](#16-theme-system-darklight)
17. [Drag & Drop Reordering](#17-drag--drop-reordering)
18. [Price Auto-Fetch from URL](#18-price-auto-fetch-from-url)
19. [Affiliate Disclosure Footer](#19-affiliate-disclosure-footer)
20. [Admin Panel Branding](#20-admin-panel-branding)
21. [Contact Form & Messages](#21-contact-form--messages)

---

## 1. What Is This App?

**SteelX Stack** is a personal storefront / link-in-bio page designed for fitness creators. It solves the "one link in Instagram bio" problem by providing a single URL that contains:

- **Training Apps** — Apps the creator uses (Lyfta, Runna, Strava) with affiliate links and promo codes
- **Shop My Gear** — Products the creator recommends with buy links to Amazon, Flipkart, Myntra, etc.
- **Workout Plans** — Gym and running plans from apps like Lyfta and Runna
- **Connect With Me** — Phone, email, and social media links

There's also a **password-protected Admin Panel** at `/admin` where the creator can manage all content without touching any code.

**In short:** Think of it as a custom-built Linktree, but specifically designed for fitness creators — with product recommendations, affiliate links, workout plans, and a dark gym-aesthetic design.

---

## 2. Frontend Architecture

### Framework: Next.js 15 (App Router)

**What is Next.js?**
Next.js is a React framework built by Vercel. It adds server-side rendering (SSR), static generation, API routes, file-based routing, and performance optimizations on top of React. We use the **App Router** (introduced in Next.js 13), which uses React Server Components by default.

**Why Next.js over plain React?**
- **Server-Side Rendering (SSR):** The public page is rendered on the server, meaning search engines and social media crawlers see the full HTML immediately. A plain React SPA would show a blank page until JavaScript loads.
- **API Routes:** We write backend API endpoints (`/api/auth/login`, `/api/data`, etc.) in the same codebase — no separate backend server needed.
- **File-Based Routing:** `app/page.tsx` → `/`, `app/admin/page.tsx` → `/admin`. No router configuration needed.
- **Incremental Static Regeneration (ISR):** The public page is statically generated but refreshes every 60 seconds — combining the speed of static pages with the freshness of dynamic content.

### Styling: Tailwind CSS v4

**What is Tailwind?**
A utility-first CSS framework. Instead of writing CSS classes like `.card { padding: 16px; border-radius: 8px; }`, you write utility classes directly in HTML: `className="p-4 rounded-lg"`.

**Why Tailwind v4 specifically?**
- v4 uses a new CSS-native approach with the `@theme` directive (defined in `globals.css`) instead of a `tailwind.config.js` file
- Faster build times, smaller CSS output
- We define our custom theme colors (neon green, dark backgrounds, glass effects) directly in CSS:

```css
@theme {
  --color-neon: #a3e635;
  --color-dark-900: #0a0a0f;
  --color-glass: rgba(255, 255, 255, 0.05);
}
```

### Animations: Framer Motion

Used for page transitions, card hover effects, modal animations, and staggered list reveals. It's the most popular React animation library — declarative, GPU-accelerated, and handles layout animations cleanly.

### Rendering Strategy

| Page | Type | How It Works |
|------|------|-------------|
| `/` (Public) | Server Component + ISR | Rendered on the server at build time. Revalidated (re-fetched) every 60 seconds. Users always see a fast static page, but content updates within a minute of admin changes. |
| `/admin` | Client Component (`"use client"`) | Runs entirely in the browser. Fetches data on mount via API calls. No SSR — the admin panel is a single-page app (SPA). |

---

## 3. Backend Architecture

There is **no separate backend server**. All backend logic runs as **Next.js API Route Handlers** — serverless functions that execute on demand.

### API Endpoints

| Endpoint | Method | Purpose | Auth Required? |
|----------|--------|---------|----------------|
| `/api/auth/login` | POST | Verify password (+ optional TOTP code), issue JWT cookie | No |
| `/api/auth/check` | GET | Check if current session is valid | No (returns true/false) |
| `/api/auth/logout` | POST | Clear session cookie (or rotate session version for "logout everywhere") | Yes |
| `/api/auth/totp` | GET/POST/DELETE | Setup, verify, or disable TOTP 2FA | Yes |
| `/api/data` | GET | Fetch all storefront data | Yes |
| `/api/data` | PUT | Save updated storefront data | Yes |
| `/api/upload` | POST | Upload an image file | Yes |
| `/api/scrape` | POST | Extract metadata (title, image, price) from a URL | Yes |

### How Serverless Functions Work

When a request hits `/api/data`, Vercel spins up a small isolated function (like a micro-container), runs the code, returns the response, and shuts down. There's no always-running server. This means:

- **No server maintenance** — no need to manage a VPS, configure nginx, or handle process crashes
- **Auto-scaling** — if 1000 people visit at once, Vercel runs 1000 parallel functions
- **Pay per use** — functions only run when called (Vercel's free tier is generous)
- **Cold starts** — the first request after inactivity may take ~200ms extra to "warm up" the function

---

## 4. Authentication & Security

### Password Authentication

**Where is the password stored?**
The admin password is stored as an **environment variable** (`ADMIN_PASSWORD`) on the server. It is:
- **Never** in the codebase or git history
- **Never** sent to the browser
- Set in the Vercel dashboard (Production → Settings → Environment Variables)
- Only compared server-side in `/api/auth/login`

**Login flow:**
```
1. User enters password on /admin login form
2. Browser sends POST /api/auth/login { password: "..." }
3. Server compares against ADMIN_PASSWORD env var
4. If correct → generate JWT token → set as httpOnly cookie
5. If TOTP is enabled → also verify 6-digit code before issuing token
```

### JWT (JSON Web Tokens)

**What is JWT?**
A JWT is a digitally signed token that proves identity. It contains a payload (like `{ role: "admin", sv: 3 }`) signed with a secret key. The server can verify any token without a database lookup.

**Library:** `jose` (the most standards-compliant JWT library for JavaScript/Edge runtimes)

**Token details:**
- Algorithm: `HS256` (HMAC-SHA256)
- Expiry: 7 days
- Stored in: `httpOnly` cookie named `sx-admin-token`
- Contains: `{ role: "admin", sv: <session_version> }`
- Signed with: `ADMIN_SECRET` environment variable

**Why httpOnly cookie (not localStorage)?**
- `httpOnly` cookies **cannot be read by JavaScript** in the browser — immune to XSS attacks
- Automatically sent with every request — no manual "Authorization: Bearer ..." header needed
- Cleared on logout by setting `maxAge: 0`

### Session Version (Logout Everywhere)

Each JWT contains a `sv` (session version) number. When "Logout Everywhere" is clicked:

```
1. Server increments the session version counter in Redis (e.g., 3 → 4)
2. All existing tokens have sv: 3 — they no longer match
3. On next request, verifyToken() reads fresh version from Redis, sees mismatch, rejects token
4. All sessions everywhere are invalidated instantly
```

**Why always read from Redis (no cache)?**
Serverless functions are ephemeral — each runs in its own isolated instance. If we cached the session version in memory, other function instances would still have the old value. By always reading from Redis, every function instance gets the latest version.

### Two-Factor Authentication (TOTP)

**What is TOTP?**
Time-based One-Time Password — the 6-digit code that changes every 30 seconds in apps like Google Authenticator or Authy. Both your phone and the server know the same secret key and use it + current time to generate matching codes.

**Library:** `otpauth` — lightweight, standards-compliant TOTP implementation

**Setup flow:**
```
1. Admin clicks "Set Up Authenticator" in Security tab
2. Server generates a random secret (20 bytes, base32 encoded)
3. Server creates an otpauth:// URI and renders it as a QR code
4. User scans QR code with authenticator app
5. User enters the 6-digit code to verify
6. If correct → secret is saved in Redis (key: "admin-totp-secret")
7. Future logins require password + 6-digit TOTP code
```

---

## 5. Data Storage — Why Upstash Redis?

### What is Redis?

Redis is an in-memory key-value database — extremely fast (microsecond reads) because data lives in RAM. Traditional Redis requires running a server process. **Upstash** provides Redis-as-a-service with a REST API, making it compatible with serverless environments.

### Why Upstash Redis (instead of PostgreSQL, MongoDB, etc.)?

| Factor | Upstash Redis | Traditional Database |
|--------|--------------|---------------------|
| **Serverless compatible** | Yes (REST API, no persistent connections) | Most need connection pooling (e.g., PgBouncer) |
| **Setup time** | 30 seconds | Minutes to hours |
| **Free tier** | 10,000 requests/day | Varies, often limited |
| **Data model fit** | Perfect — our entire storefront is one JSON document | Overkill for a single-document data model |
| **Latency** | ~1-5ms (global edge) | ~20-50ms |
| **Cold start friendly** | REST API = no connection overhead | TCP connections add cold start latency |

### How Data is Stored

All storefront data is stored as a **single JSON document** under the Redis key `"storefront-data"`:

```json
{
  "creator": { "name": "SteelX", "tagline": "...", "bio": "...", ... },
  "apps": [ { "id": "lyfta", "name": "Lyfta", ... }, ... ],
  "products": [ { "id": "nike-metcon-9", "name": "Nike Metcon 9", "price": 12995, ... }, ... ],
  "categories": ["Shoes", "Gym Wear", "Accessories", ...],
  "currency": "₹",
  "contacts": { "phone": "...", "email": "...", "socials": [...] },
  "workoutPlans": [ { "id": "ppl-split", "title": "Push Pull Legs Split", ... }, ... ]
}
```

Separate Redis keys:
- `"admin-session-version"` — integer for logout-everywhere
- `"admin-totp-secret"` — base32 TOTP secret (if 2FA enabled)

### Local Development Fallback

Without Upstash credentials, the app automatically falls back to a **local JSON file** (`data/local-data.json`). This means you can develop without any external services — the storage layer abstracts this away:

```typescript
// lib/storage.ts — simplified logic
export async function getData() {
  const redis = getRedis(); // returns null if no env vars
  if (redis) {
    return migrateData(await redis.get("storefront-data"));
  }
  // Fallback: read from local file
  return migrateData(JSON.parse(fs.readFileSync("data/local-data.json")));
}
```

---

## 6. Image Storage — Vercel Blob

### What is Vercel Blob?

Vercel Blob is a file storage service (like AWS S3 but simpler). You upload a file, get back a permanent public URL. It's integrated into Vercel's platform — no AWS account or S3 configuration needed.

### How Images Are Stored

**Production (Vercel Blob):**
```
1. Admin uploads image via ImageUpload component
2. Browser sends FormData to POST /api/upload
3. Server validates: type (JPEG/PNG/WebP/SVG/GIF), size (≤5MB)
4. Server calls @vercel/blob put("steelx/filename.webp", file, { access: "public" })
5. Vercel Blob returns a permanent CDN URL: https://abc123.public.blob.vercel-storage.com/steelx/image.webp
6. URL is saved in the product/app/social data
```

**Development (Local):**
```
1. Same upload flow, but server writes to public/uploads/ directory
2. Returns URL like /uploads/1710000000-image.webp
3. Next.js serves it statically from the public/ folder
```

### Image Pipeline

Before upload, images go through client-side processing:
1. **Crop** — using `react-easy-crop` (aspect ratio presets: 1:1, 4:5, 16:9, free)
2. **Rotate/Zoom** — adjustable in the editor modal
3. **Resize** — max width 1200px (maintains aspect ratio)
4. **Convert** — output as WebP format at 80% quality
5. **Upload** — final processed image sent to server

---

## 7. How Admin Changes Reflect on the Public Page

This is the key question: **when you change something in admin, how does the user-facing page update?**

### The Mechanism: Incremental Static Regeneration (ISR)

```
Admin saves data
    ↓
PUT /api/data → saves to Redis
    ↓
(up to 60 seconds wait)
    ↓
Next.js ISR timer expires → re-renders public page (/) with fresh data from Redis
    ↓
Next visitor sees updated content
```

**Detailed flow:**

1. **Admin saves:** The admin panel sends `PUT /api/data` with the complete updated JSON. The API handler writes it to Redis.

2. **Public page has ISR configured:**
   ```typescript
   // app/page.tsx
   export const revalidate = 60; // Revalidate every 60 seconds
   ```
   This tells Next.js: "Cache this page, but regenerate it after 60 seconds if someone visits."

3. **Revalidation happens lazily:**
   - At t=0: Page is generated and cached
   - At t=30s: Admin makes a change
   - At t=45s: User visits → sees the OLD cached page (still within 60s window)
   - At t=61s: User visits → Next.js serves the old page BUT triggers a background regeneration
   - At t=62s: Next user visits → sees the NEW page

4. **Why not instant updates?**
   - ISR is a tradeoff: **fast page loads** (served from cache/CDN) vs **slight delay** on updates
   - For a link-in-bio page, 60 seconds of staleness is perfectly acceptable
   - If instant updates were needed, we'd use `revalidatePath("/")` on save (Next.js on-demand revalidation)

### Visual Diagram

```
┌─────────┐     PUT /api/data     ┌──────────────┐
│  Admin   │ ──────────────────→  │ Upstash Redis │
│  Panel   │                      │ (storefront-  │
└─────────┘                      │  data key)    │
                                  └──────┬───────┘
                                         │
                                         │ getData()
                                         ↓
┌─────────┐    GET / (cached)     ┌──────────────┐
│  Public  │ ←────────────────── │  Next.js ISR  │
│  Visitor │                      │  (revalidate  │
└─────────┘                      │   = 60s)      │
                                  └──────────────┘
```

---

## 8. URL Metadata Scraping

When adding a product or app, you can paste a URL and the system auto-fills details.

### How It Works (`lib/scraper.ts`)

```
1. Admin pastes URL (e.g., https://amazon.in/dp/B0C1234)
2. Browser sends POST /api/scrape { url: "..." }
3. Server fetches the HTML of that URL (with a browser-like User-Agent header)
4. Server extracts metadata using regex patterns:
   - <meta property="og:title" content="...">     → Product name
   - <meta property="og:description" content="..."> → Description
   - <meta property="og:image" content="...">     → Product image URL
   - <title>...</title>                            → Fallback title
   - <link rel="icon" href="...">                 → Favicon
   - og:price:amount or ₹/$/Rs patterns           → Price
5. Returns extracted data to the admin form
```

**Why server-side (not in browser)?**
Browsers block cross-origin fetches (CORS). Amazon.in won't let `https://steelx.vercel.app` fetch its HTML. But server-side fetch has no CORS restrictions.

**Timeout:** 8 seconds. If the site is slow or blocks scrapers, the request aborts gracefully.

---

## 9. Deployment — Why Vercel?

### What is Vercel?

Vercel is a cloud platform optimized for frontend frameworks (especially Next.js — they created it). It provides:
- **Automatic deployments** — push to GitHub → Vercel builds and deploys automatically
- **Global CDN** — static assets served from edge locations worldwide
- **Serverless functions** — API routes run as on-demand functions
- **Preview deployments** — every pull request gets its own URL
- **SSL certificates** — automatic HTTPS
- **Custom domains** — connect your own domain with one click

### Why Vercel (instead of AWS, DigitalOcean, Railway, etc.)?

| Factor | Vercel | AWS / DigitalOcean |
|--------|--------|-------------------|
| **Next.js support** | First-class (they built it) | Manual configuration |
| **Deploy from GitHub** | Automatic on push | CI/CD pipeline setup needed |
| **Serverless functions** | Zero config (just create files in `app/api/`) | Lambda/Cloud Functions setup |
| **SSL/HTTPS** | Automatic | Manual (Let's Encrypt / ACM) |
| **CDN** | Built-in globally | CloudFront/CloudFlare setup |
| **Free tier** | Generous (100GB bandwidth, serverless included) | Limited / pay-as-you-go |
| **Blob storage** | Native integration | S3 setup + IAM policies |
| **Cost** | Free for this scale | Usually free too, but more config |

### Deployment Flow

```
1. Developer pushes code to GitHub (main branch)
2. GitHub webhook notifies Vercel
3. Vercel pulls the code
4. Vercel runs: npm install → npm run build (next build)
5. Build output:
   - Static pages (HTML) → deployed to CDN edge nodes globally
   - API routes → packaged as serverless functions
   - ISR pages → pre-rendered + background revalidation configured
6. Vercel assigns URL: https://steelxstack.vercel.app
7. DNS propagation → site is live globally in ~30 seconds
```

**Total time from `git push` to live:** ~45-90 seconds.

---

## 10. Data Migration Strategy

As the app evolves, the data schema changes (e.g., adding `wornImage` to products, adding `workoutPlans`). Old data in Redis doesn't have these new fields. The migration system handles this automatically.

### How It Works (`lib/storage.ts` → `migrateData()`)

```typescript
function migrateData(raw: any): StorefrontData {
  // Start with defaults, overlay with stored data
  const data = { ...DEFAULT_DATA, ...raw };

  // Specific field migrations:
  // 1. Old affiliateUrl+platform → new buyLinks[] array
  // 2. Old string price "₹1,299" → number 1299
  // 3. Missing contacts/currency/workoutPlans → backfill from defaults

  return data;
}
```

**Key principle:** `{ ...DEFAULT_DATA, ...raw }` — spread the defaults first, then overlay stored data. Any new fields automatically get default values. Any existing fields keep their stored values.

**Why not database migrations (like Rails or Django)?**
- We have a single JSON document, not SQL tables
- Running `ALTER TABLE` equivalent on Redis is unnecessary
- Read-time migration is simpler: old data is transformed into the new format when read
- No migration scripts to run manually during deployment

---

## 11. Environment Variables

Environment variables store secrets and configuration outside the code. They're set in the Vercel dashboard and injected at runtime.

| Variable | What It Is | Where It's Used |
|----------|-----------|----------------|
| `ADMIN_PASSWORD` | The password to log into `/admin` | `lib/auth.ts` — compared during login |
| `ADMIN_SECRET` | Random string used to sign/verify JWT tokens | `lib/auth.ts` — HMAC-SHA256 signing key |
| `UPSTASH_REDIS_REST_URL` | URL of the Upstash Redis instance (e.g., `https://xxx.upstash.io`) | `lib/storage.ts`, `lib/auth.ts` — connecting to Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Auth token for the Upstash Redis REST API | Same as above |
| `BLOB_READ_WRITE_TOKEN` | Auth token for Vercel Blob storage | `app/api/upload/route.ts` — uploading images |

**Security:** These are NEVER committed to git. They're set in Vercel's dashboard (Settings → Environment Variables) and are only accessible on the server side. The browser/client can never see them.

---

## 12. Complete Request Lifecycle

### Scenario: User visits the public page

```
1. Browser requests GET https://steelxstack.vercel.app/
2. Vercel CDN checks: is there a cached version? And is it < 60 seconds old?
   - YES → serve from cache (fast, ~20ms)
   - NO → trigger server-side rendering:
     a. Next.js runs app/page.tsx (server component)
     b. page.tsx calls getData() from lib/storage.ts
     c. getData() calls Redis GET "storefront-data"
     d. Redis returns JSON → migrateData() transforms it
     e. Data is passed to <StorefrontPage /> client component
     f. React renders HTML on server → sent to browser
     g. Browser hydrates (attaches event listeners)
     h. Framer Motion animations play
3. Page is cached for next 60 seconds
```

### Scenario: Admin saves a product

```
1. Admin edits product in Gear tab, clicks Save
2. Browser sends PUT /api/data with full JSON body + sx-admin-token cookie
3. Vercel spins up serverless function for /api/data route
4. Function reads cookie → verifies JWT (checks signature + session version via Redis)
5. If valid → calls saveData(data) → Redis SET "storefront-data" (the entire JSON)
6. Returns { success: true }
7. Admin sees "Saved!" toast
8. Within 60 seconds, ISR revalidates the public page with the new data
```

### Scenario: Admin uploads an image

```
1. Admin selects image in ImageUpload component
2. Client-side: image opens in editor modal (crop, rotate, zoom)
3. Client-side: after "Apply", image is resized (≤1200px), converted to WebP (80% quality)
4. Browser sends POST /api/upload with FormData (processed image file)
5. Server validates file type and size (≤5MB)
6. Server uploads to Vercel Blob → gets permanent CDN URL
7. URL is returned to the browser
8. Admin panel stores the URL in the product/app data
9. On next Save, the URL is persisted in Redis with the rest of the data
```

---

## 13. Project File Structure

```
steelxstack/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — font, metadata, favicon
│   ├── page.tsx                  # Public storefront (server component, ISR 60s)
│   ├── globals.css               # Tailwind v4 theme, glassmorphism, dark mode
│   ├── admin/
│   │   └── page.tsx              # Admin panel (client SPA — profile, apps, gear, contact, security tabs)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts    # POST — password + optional TOTP verification → JWT cookie
│       │   ├── check/route.ts    # GET — validate current session
│       │   ├── logout/route.ts   # POST — clear cookie or rotate session version
│       │   └── totp/route.ts     # GET/POST/DELETE — TOTP 2FA setup, verify, disable
│       ├── data/route.ts         # GET/PUT — read and write storefront data (Redis/local)
│       ├── scrape/route.ts       # POST — extract metadata from a URL
│       └── upload/route.ts       # POST — upload image to Vercel Blob or local
│
├── components/
│   ├── StorefrontPage.tsx        # Main public UI (hero, apps scroll, gear grid, contacts)
│   ├── ProductCard.tsx           # Product card — image toggle, buy links, formatted price
│   ├── AppCard.tsx               # Training app card — logo, description, affiliate link
│   ├── ImageUpload.tsx           # Reusable image upload — file, URL paste, camera capture
│   ├── SectionWrapper.tsx        # Section layout wrapper with animation
│   └── admin/
│       ├── ImageEditorModal.tsx   # Crop/rotate/zoom editor (react-easy-crop)
│       ├── CameraCapture.tsx      # Camera capture via getUserMedia
│       └── PriceInput.tsx         # Currency-prefixed price input
│
├── data/
│   └── storefrontData.ts         # TypeScript interfaces + default/sample data
│
├── lib/
│   ├── storage.ts                # Storage abstraction (Redis ↔ local JSON) + data migration
│   ├── auth.ts                   # JWT authentication (jose) + session version management
│   ├── totp.ts                   # TOTP 2FA utilities (otpauth)
│   └── scraper.ts                # URL metadata extraction (regex-based)
│
├── public/                       # Static assets
│   └── uploads/                  # Local image uploads (dev only, gitignored)
│
├── .env.example                  # Environment variable template
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

---

## 14. Third-Party Services Summary

| Service | What It Does | Why We Use It | Cost |
|---------|-------------|--------------|------|
| **Vercel** | Hosting, CDN, serverless functions, preview deploys | Zero-config Next.js deployment, auto-scaling, global CDN | Free tier (hobby) |
| **Upstash Redis** | Key-value database (REST API) | Serverless-compatible, sub-5ms reads, no connection pooling needed | Free tier (10K req/day) |
| **Vercel Blob** | File/image storage with CDN URLs | Native Vercel integration, public CDN URLs, no S3 config | Free tier (limited storage) |
| **GitHub** | Source code hosting, CI/CD trigger | Vercel auto-deploys on push, version control | Free |

**No other services required.** No AWS account, no MongoDB, no Cloudflare, no third-party auth providers.

---

## 15. Libraries & Why Each Was Chosen

### Production Dependencies

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|--------------|
| `next` | 15.x | React framework | SSR, ISR, API routes, file-based routing — the foundation |
| `react` / `react-dom` | 19.x | UI library | Required by Next.js. v19 adds server components, improved hydration |
| `@upstash/redis` | 1.36.x | Redis client | REST-based (no TCP needed), works in serverless/edge runtimes |
| `@vercel/blob` | 2.3.x | File storage | First-party Vercel integration, simple API, CDN-backed |
| `jose` | 6.x | JWT signing/verification | Edge-runtime compatible (works in Vercel serverless). No Node.js-only crypto dependencies |
| `otpauth` | 9.x | TOTP 2FA | Lightweight (<5KB), standards-compliant (RFC 6238), generates otpauth:// URIs |
| `qrcode` | 1.5.x | QR code generation | Generates QR as data URL for TOTP setup — user scans with authenticator app |
| `framer-motion` | 12.x | Animations | Declarative, performant, handles layout animations and gestures |
| `react-easy-crop` | 5.x | Image cropping | Lightweight crop/zoom/rotate UI, touch-friendly, returns crop area coordinates |
| `@dnd-kit/core` | latest | Drag & drop framework | Accessible, touch-friendly, works with React state; no DOM mutations |
| `@dnd-kit/sortable` | latest | Sortable lists | Built on @dnd-kit/core, handles vertical list reordering with `arrayMove` |

### Dev Dependencies

| Library | Purpose |
|---------|---------|
| `tailwindcss` 4.x | Utility-first CSS framework |
| `@tailwindcss/postcss` | PostCSS plugin for Tailwind v4 |
| `typescript` 5.x | Type safety across the entire codebase |
| `@types/*` | TypeScript type definitions for React, Node, QRCode |

---

## Quick Reference: Common Questions

**Q: Is there a separate backend server?**
A: No. Backend logic runs as serverless functions inside Next.js API routes. No Express, no Flask, no separate deployment.

**Q: What database is used?**
A: Upstash Redis (key-value store, REST API). All data is one JSON document. No SQL, no ORM, no schemas.

**Q: Where are passwords stored?**
A: As environment variables on the server (`ADMIN_PASSWORD`). Never in code, never in the database, never visible to the browser.

**Q: How are sessions managed?**
A: JWT tokens stored in httpOnly cookies (7-day expiry). Signed with `ADMIN_SECRET`. Verified on every authenticated API call.

**Q: What happens if Redis goes down?**
A: The app falls back to default sample data. In development, it uses a local JSON file instead.

**Q: How do images work?**
A: Uploaded to Vercel Blob (production) or saved locally (dev). URLs are stored in the data JSON. Images are served from Vercel's CDN.

**Q: Why not use a traditional database like PostgreSQL?**
A: The entire data model is a single document. A relational database with tables, migrations, and connection pooling would be over-engineering for this use case.

**Q: Why not use NextAuth.js for authentication?**
A: NextAuth is designed for multi-user, multi-provider auth (Google, GitHub, etc.). We have a single admin user with a password. A simple JWT is more appropriate and has zero dependencies.

**Q: Can multiple people manage the admin?**
A: Currently, no — it's designed for a single creator. The password is shared. Adding multi-user auth would require a user table and role system.

---

## 16. Theme System (Dark/Light)

The public page has a **theme toggle button** (sun/moon icon) fixed in the top-right corner.

### How It Works

- Default is **dark theme** (the gym aesthetic)
- Clicking the toggle adds/removes the CSS class `light` on `<body>`
- `body.light` in `globals.css` overrides background colors, text colors, glass effect, gradients, etc.
- Theme preference is saved in `localStorage` under key `sx-theme`
- On page load, the saved preference is read and applied before first paint

### Why CSS Class Toggle (not CSS Custom Properties)?

We already have a fully built dark theme with Tailwind utility classes (`bg-dark-900`, `text-white`, `glass`, etc.). Switching everything to CSS variables would require rewriting most of the UI. A class toggle approach overrides just the specific colors that need to change — minimal effort, maximum result.

### Technical Detail

```css
/* globals.css */
body.light .glass {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.08);
}
body.light .text-white { color: #1a1a2e; }
body.light .bg-dark-900 { background-color: #f8f9fa; }
/* ... etc */
```

---

## 17. Drag & Drop Reordering

Products in the Gear tab can be **drag-reordered** by grabbing the grip handle (6-dot icon) on each row.

### Library: @dnd-kit

**Why @dnd-kit (not react-beautiful-dnd)?**
- `react-beautiful-dnd` is deprecated and incompatible with React 19
- `@dnd-kit` is the modern standard: accessible, lightweight, touch-friendly
- Works with React state directly — no DOM mutations

### How It Works

```
1. Each product row is wrapped in <SortableProductItem> using useSortable() hook
2. The grip handle gets {...listeners, ...attributes} for drag activation
3. PointerSensor (mouse) and TouchSensor (mobile) are configured with activation constraints
4. On drag end: arrayMove(products, oldIndex, newIndex) → update React state
5. State is saved to Redis when admin clicks "Save All Changes"
```

### Activation Constraints

- **Pointer**: `distance: 8` — prevents accidental drags on click
- **Touch**: `delay: 200, tolerance: 5` — long-press to start drag on mobile

---

## 18. Price Auto-Fetch from URL

When adding a product with a buy link URL, clicking "Auto-Fill" extracts price from the page.

### Logic

```
1. Admin pastes URL in buy link field, clicks "Auto-Fill"
2. Server scrapes the URL, tries multiple extraction methods in order:
   a. og:price:amount / product:price:amount meta tags
   b. JSON-LD structured data (schema.org Product/Offer)
   c. itemprop="price" HTML attributes
   d. Regex patterns for ₹, $, Rs., MRP in page text
3. If price found AND product has no manually-set price → auto-fill price field
4. If admin has already entered a price → keep the manual price (override takes priority)
```

### Why Manual Override?

Scraped prices can be wrong (dynamic pricing, out-of-stock, regional differences). The admin's explicit input is always more trustworthy. The scraper provides a convenient starting point, not the final word.

---

## 19. Affiliate Disclosure Footer

The footer can display an affiliate disclosure text (important for Amazon/Myntra affiliate program approval).

### Admin Flow

```
1. Go to Profile tab → "Footer Text" section
2. Enter disclosure text, e.g.:
   "Some of the links on this page are affiliate links. I may earn a small commission
    at no extra cost to you if you make a purchase through these links."
3. Save → text appears at bottom of public page above copyright
4. Leave empty → footer text is hidden completely
```

### Why Is This Important?

Amazon, Myntra, Flipkart, and other affiliate programs **require** a visible disclosure on any page containing affiliate links. Having this in the footer significantly increases approval chances.

---

## 20. Admin Panel Branding

The admin panel header (which shows "SX Admin Panel" by default) is customizable.

### How It Works

- **Profile tab → "Admin Panel Branding" section**
- Set a custom title text (e.g., "STEELX" or your name)
- Upload a logo image to replace the text badge entirely
- If logo is set → shows image; otherwise → shows title text in green badge
- Stored in `creator.adminTitle` and `creator.adminLogo` fields

---

## 21. Contact Form & Messages

Visitors can send messages directly from the public page. Messages are stored in Redis and optionally trigger email notifications.

### Public Page

The "Connect With Me" section now has a contact form alongside the existing phone/email/social links:
- Fields: Name, Email, Inquiry Type (dropdown), Message
- Inquiry types: General, Collaboration/Sponsorship, Business, Feedback
- On submit → POST `/api/contact` → saved to Redis under `contact-messages` key
- Shows success confirmation with option to send another message

### Email Notifications (Optional)

If `RESEND_API_KEY` and `NOTIFICATION_EMAIL` env vars are set:
- Every form submission sends a formatted HTML email to the notification address
- Email includes: name, email (clickable), inquiry type, full message
- Uses Resend API (free tier: 100 emails/day)
- If email fails, the message is still saved in Redis — no data loss

### Admin Panel — Messages Tab

New "Messages" tab between Contact and Security:
- Shows inbox with unread count badge
- Each message shows: sender avatar (first letter), name, type badge, preview
- Click to expand: full message, email link, date, "Reply via email" button
- Mark as read on open (left green border = unread)
- Delete individual messages
- All operations are auth-gated (JWT session required)

### Storage

Messages are stored in a separate Redis key (`contact-messages`) — independent from `storefront-data`. This means:
- Messages don't bloat the main storefront data
- Deleting messages doesn't require saving all storefront data
- Each message has: id, name, email, type, message, createdAt, read flag
