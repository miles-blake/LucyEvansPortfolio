# Build Prompt for Claude Code

Copy everything below the line into Claude Code (in an empty project folder) to kick off the build.

---

## Role & Objective

Act as a senior full-stack web developer and designer. Build a professional, distinctive two-sided portfolio and e-commerce website for a film photographer and content marketer. This is a real production site, not a class project — build it to a standard you'd ship for a paying client.

**The two sides:**
1. **Photography shop & services** — sells individual landscape film photos and curated bundles as digital downloads, and lists bookable photography services (weddings, events, portraits) priced by number of film rolls / photos included.
2. **Marketing portfolio** — a case-study showcase of short-form brand content (TikToks, Reels) used as a professional reference in job applications, with a downloadable media kit/résumé.

Both sides share one design system but each has its own accent identity (see Design Direction below).

## Design Direction

Do NOT default to generic AI-site aesthetics (cream + terracotta, near-black + neon accent, broadsheet hairline-rule layouts). Follow this specific direction instead:

**Palette**
- Cream base: `#FAF6EF`
- Warm ink (text, not pure black): `#2E2A24`
- Sky blue (photography accent): `#A9C6D8`
- Sage green (photography accent): `#B7CDB0`
- Blush pink (marketing accent): `#F0C9CE`
- Deeper rose (marketing CTA/emphasis): `#D98A98`

**Typography**
- Display face: **Fraunces** (Google Fonts) — warm, characterful serif, used with restraint for headlines
- Body face: **Inter** or **General Sans** — clean, high-legibility sans
- Utility/caption face: **JetBrains Mono** or **IBM Plex Mono** — for photo metadata (film stock, camera, location, date) styled like contact-sheet/EXIF annotations. This is a signature detail — lean into it.

**Signature element**
Lean into the *film* half of "film photography" as the visual throughline: a contact-sheet style grid for the gallery, sprocket-hole or filmstrip motifs used sparingly (not gimmicky), and a "frame counter" style pagination (e.g. `12A / 36A`) instead of generic page numbers. A subtle film-grain texture overlay on hero imagery is welcome; don't overdo it elsewhere.

**Layout concept for the homepage**
A split hero: two panels, one washed in sky blue/sage tones over a landscape photo leading to the shop, one washed in blush/rose tones over a short-form content preview leading to the marketing portfolio. Use a soft diagonal or curved divider between them, not a hard vertical line. Keep everything else on the site quiet and disciplined — spend the boldness on this one moment.

Build responsive down to mobile-first (most portfolio traffic and photo browsing will be on phones), with visible keyboard focus states and reduced-motion support. Use tasteful, deliberate motion (Framer Motion) — a page-load reveal and scroll-triggered galleries are enough; avoid scattered micro-animations everywhere.

## Version Control

The repo already exists at `https://github.com/miles-blake/LucyEvansPortfolio.git`. Clone it and work inside it from the start — don't scaffold the project in a fresh untracked folder.

Follow standard GitHub best practices throughout the build:
- `main` is the protected, always-deployable branch. Never commit directly to `main`.
- Create a feature branch per phase/unit of work (e.g. `setup/design-tokens`, `feat/gallery`, `feat/stripe-checkout`, `feat/booking-flow`, `feat/admin-panel`), branching off an up-to-date `main`.
- Commit early and often within a branch with clear, conventional messages (e.g. `feat: add photo detail page`, `fix: correct Stripe webhook signature check`, `chore: seed script for portfolio pieces`) rather than one giant commit per phase.
- Open a PR from each feature branch back into `main` when that phase is complete, with a short description of what changed and how you tested it. Merge (or tell me it's ready for me to review and merge) before starting the next phase, so `main` always reflects a working state I can roll back to.
- Add a proper `.gitignore` from the start (`node_modules`, `.env*`, `.next`, build artifacts) — never commit secrets or API keys. Use a `.env.example` file listing the required environment variable names (Stripe, Cloudinary, Resend, database URL, NextAuth secret) without real values.
- Tag or note a commit as a rollback point after each major phase is merged and verified working, so we can always revert to the last good state if a later phase breaks something.

## Tech Stack

- **Next.js 14+ (App Router, TypeScript)**
- **Tailwind CSS + shadcn/ui** for component primitives
- **Prisma ORM + PostgreSQL** (use Neon or Supabase for a free hosted Postgres instance; SQLite is fine for local dev only)
- **Stripe Checkout** for one-time payments — digital photo/bundle purchases AND service booking deposits/payments
- **Resend** for transactional email (order confirmation + download link, booking confirmation, newsletter welcome email)
- **Cloudinary** for image and video storage/hosting — use its transformation API to auto-generate watermarked, web-sized preview images from full-resolution originals, and to host the marketing video clips natively (do not rely on raw TikTok/Instagram embeds — they're slow, ad-heavy, and can vanish if a post is deleted; self-host the clips and link back to the original post as a secondary reference)
- **NextAuth** (credentials provider, single admin account) for the admin panel
- **React Hook Form + Zod** for form handling and validation
- **Vercel** for deployment

Everything is **digital-only** — there is no physical print fulfillment, shipping, or inventory to manage. Purchases deliver a secure, time-expiring signed download link (via Cloudinary or S3 signed URLs), shown on the order confirmation page and emailed via Resend. Full-resolution files are never publicly accessible; only watermarked previews are public.

## Data Model (Prisma schema)

Build these models (adjust field types/relations as needed, but cover this scope):

- **Photo** — title, slug, description/story, location, captureDate, filmStock, camera, collectionTag, previewImageUrl (watermarked), fullResFileUrl (private), price, isLimitedEdition, editionSize, editionSold, featured
- **Bundle** — title, slug, description, price, related Photos (many-to-many)
- **ServicePackage** — name, description, rollsIncluded, photosIncluded, basePrice, eventTypes (wedding/portrait/event/elopement), addOns (extra roll price, rush delivery, second shooter)
- **Booking** — customer name/email/phone, eventDate, eventType, selected package, addOns, message, status (inquiry / confirmed / completed / cancelled), depositAmount, depositPaid, totalPrice
- **Order** — customer email, items, totalAmount, Stripe payment intent ID, status, createdAt
- **OrderItem** — belongs to Order, references Photo or Bundle, price, signed downloadUrl, download count/limit, expiry
- **PortfolioPiece** — title, slug, brandName, role, description, deliverables, metrics (free text — views/engagement/reach), self-hosted videoUrl(s), coverImageUrl, tags, dateCompleted, testimonialQuote, testimonialAuthor, featured
- **Subscriber** — email, subscribedAt, source, confirmed
- **AdminUser** — for the built-in admin panel login (email + hashed password)

## Site Map

**Home (`/`)** — split hero as described above; below the fold, a featured photo, a featured case study, and a newsletter signup. Newsletter signup also lives in the global footer on every page.

**Photography side**
- `/gallery` — all photos, filterable by collection/location/tag, contact-sheet grid layout
- `/gallery/[slug]` — photo detail: large image, story/metadata panel (styled like film contact-sheet annotations: film stock, camera, location, date), price, "Add to cart," limited-edition indicator if applicable
- `/bundles` and `/bundles/[slug]` — curated bundle listings and detail pages
- `/services` — service packages (rolls → photo count → price), event types, add-ons
- `/services/book` — booking form: event date picker (blocks out already-booked dates), package selection, add-ons, contact info → creates a Booking (status: inquiry) and a Stripe Checkout session for the deposit
- `/cart` → `/checkout` (Stripe Checkout) → `/order/[id]/confirmation` (download links)

**Marketing side**
- `/work` — grid of case studies, filterable by brand/content type/tag
- `/work/[slug]` — case study detail: embedded self-hosted video reel(s), brand, role, deliverables, metrics, testimonial
- `/media-kit` — downloadable PDF résumé/media kit generated from the same content, plus a skills summary and contact CTA

**Shared**
- `/about` — bio tying both sides together
- `/contact` — general contact form
- `/privacy`, `/terms`, `/license` (photo usage rights for digital downloads — personal use only, no resale/commercial use without a separate license)
- `/admin/*` — protected admin panel: CRUD for Photos, Bundles, ServicePackages, Bookings (view/update status, mark deposit paid), PortfolioPieces, Subscribers (with CSV export), and Orders (view only)

## Build Order

1. Project scaffold, Tailwind + shadcn/ui setup, design tokens (fonts, colors, spacing) as a theme config
2. Prisma schema + migrations + seed script with realistic placeholder data (use picsum.photos or similar for placeholder images until real photos are swapped in)
3. Homepage + shared layout/nav/footer + newsletter signup component
4. Marketing portfolio pages (`/work`, `/work/[slug]`, `/media-kit`) — build this side first since it's needed soonest for job applications
5. Photography gallery + photo detail pages
6. Cart, Stripe Checkout integration, digital delivery flow (signed URLs + Resend emails)
7. Services listing + booking flow + deposit payment
8. Admin panel with NextAuth-protected routes and full CRUD
9. Legal pages, SEO/Open Graph metadata, sitemap, accessibility pass (alt text fields, focus states, reduced motion)
10. Final review: test full purchase flow in Stripe test mode, test booking flow, test admin CRUD, responsive check on mobile

## Instructions for You (Claude Code)

1. First, ask me any clarifying questions you need: business/site name, domain, whether I have real photos/videos ready or want placeholders, Stripe/Cloudinary/Resend account status (or whether to stub these with clear TODOs), and admin login credentials to seed.
2. Clone the existing repo (`https://github.com/miles-blake/LucyEvansPortfolio.git`) and confirm the branch/PR workflow above before writing code.
3. Build in the order above, one feature branch per phase, checking in after each phase (and after each PR is ready) rather than building the entire app silently on one branch.
4. After the build, give me: (a) a checklist of what I need to manually swap in (real photos, real case studies, real service pricing, admin password), (b) exact setup steps for Postgres/Stripe/Cloudinary/Resend environment variables, (c) how to run it locally and deploy to Vercel, (d) how to test the full purchase and booking flows end to end before going live.
5. Use TypeScript strictly, keep components small and reusable, and comment non-obvious logic (Stripe webhook handling, signed URL generation).
