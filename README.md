# SteelX Stack

A fitness creator storefront — your one-link landing page for Instagram bio. Showcase your training apps, gear recommendations, and social links with a sleek dark-themed UI.

## Features

### Public Storefront
- **Hero Section** — Profile image, tagline, bio, and 3 CTA buttons (Train With Me, Shop My Gear, Connect With Me) with smooth scroll navigation
- **Training Apps** — Showcase the apps you use daily with affiliate links and promo codes
- **Shop My Gear** — Product grid with category filters, pagination, multi-platform buy links (Amazon, Flipkart, Myntra, etc.), and "Product vs On Me" image toggle
- **Connect With Me** — Phone, email, and social media links with auto-detected favicons

### Admin Panel (`/admin`)
- **Profile Tab** — Edit name, tagline, bio, profile image, and all CTA buttons
- **Apps Tab** — Add/edit/delete training apps with auto-fill from URL, image upload, promo codes, and highlight toggle
- **Gear Tab** — Manage products with currency selection (INR/USD/EUR/GBP), category manager, multi-buy-link editor, product image + "worn by me" image, drag-to-reorder, featured toggle
- **Contact Tab** — Phone, email, and social links with custom icon upload per platform
- **Security Tab** — Two-factor authentication (TOTP) with authenticator app support (Google Authenticator, Authy, 1Password)
- **Auth** — Password-based login with optional TOTP MFA, JWT session tokens (7-day expiry)

### Technical
- **Image Upload** — Upload files or paste URLs everywhere images are needed. Uses Vercel Blob in production, local `public/uploads/` in dev
- **URL Auto-Fill** — Paste a product/app URL and auto-extract title, description, image, price, and platform name
- **Data Migration** — Automatically handles schema changes when reading from storage
- **ISR** — Public page revalidates every 60 seconds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Auth | jose (JWT) + otpauth (TOTP) |
| Storage | Upstash Redis (prod) / local JSON (dev) |
| Images | Vercel Blob (prod) / local files (dev) |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Local Development

```bash
# Clone the repo
git clone https://github.com/manojanasuri16/steelxstack.git
cd steelxstack

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

Default admin password: `admin123` (change via `ADMIN_PASSWORD` env var)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | Yes | Admin panel login password |
| `ADMIN_SECRET` | Yes | Secret key for signing JWT tokens |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL ([upstash.com](https://upstash.com)) |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob storage token (auto-added via Vercel dashboard) |

Without Redis configured, data is stored in `data/local-data.json` (gitignored). Without Blob configured, uploads go to `public/uploads/` (also gitignored).

## Deploy to Vercel

1. Push code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `ADMIN_PASSWORD` and `ADMIN_SECRET`
   - Add **Upstash Redis** integration (Storage → Create → Redis)
   - Add **Vercel Blob** store (Storage → Create → Blob)
4. Deploy

## Project Structure

```
├── app/
│   ├── page.tsx              # Public storefront (server component, ISR)
│   ├── admin/page.tsx        # Admin panel (client component)
│   ├── globals.css           # Dark theme, glassmorphism, Tailwind v4
│   └── api/
│       ├── auth/             # login, check, logout, totp
│       ├── data/             # GET/PUT storefront data
│       ├── scrape/           # URL metadata extraction
│       └── upload/           # Image upload
├── components/
│   ├── StorefrontPage.tsx    # Main storefront UI
│   ├── ProductCard.tsx       # Product card with image toggle
│   ├── AppCard.tsx           # Training app card
│   ├── ImageUpload.tsx       # Reusable upload/paste component
│   └── SectionWrapper.tsx    # Section layout wrapper
├── data/
│   └── storefrontData.ts     # TypeScript interfaces + default data
├── lib/
│   ├── storage.ts            # Redis/local storage + data migration
│   ├── auth.ts               # JWT auth
│   ├── totp.ts               # TOTP (2FA) utilities
│   └── scraper.ts            # URL metadata scraper
└── .env.example              # Environment variable template
```

## Setting Up 2FA

1. Log into the admin panel
2. Go to the **Security** tab
3. Click **Set Up Authenticator**
4. Scan the QR code with your authenticator app
5. Enter the 6-digit code to verify and enable

Once enabled, login will require both your password and a 6-digit code from your authenticator app.
