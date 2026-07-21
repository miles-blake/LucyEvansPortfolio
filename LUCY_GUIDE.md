# Lucy Evans — Site Guide

This document explains everything your website can do and how to get to each feature. It's written for everyday use — no technical knowledge needed.

> **Living document:** Every time a new feature is added to the site, it should be added here.

---

## Getting into the admin panel

Go to **`/admin/login`** and sign in with your email and password. Once you're in, you'll see the sidebar on the left with links to everything.

---

## Dashboard (`/admin`)

The first thing you see after logging in. At a glance it shows:

- **Stats** — how many photos, bundles, bookings, paid orders, subscribers, and portfolio pieces you have
- **Revenue** — your all-time total, this month, and last month, plus a 6-month bar chart broken down by orders (blue) and invoices (green)
- **Recent bookings and orders** — a quick snapshot of what's come in lately
- **Activity feed** — a running log of recent inquiries, sign-ups, bookings, and orders

---

## Photos (`/admin/photos`)

Everything related to your film photo shop.

**What you can do:**
- See all your photos in a table
- Click **+ New photo** to add a single photo (title, description, film stock, camera, location, price, etc.)
- Click **Bulk upload** to upload many photos at once — drag and drop image files, set shared metadata (film stock, camera, collection, location) for the whole batch, then save them all to your library in one click. After uploading, you can edit each photo individually to set the price and any unique details.
- Click on any photo to edit or delete it

**Where it shows up publicly:** `/gallery` and `/gallery/[photo-slug]`

---

## Bundles (`/admin/bundles`)

Curated sets of photos sold together at a single price.

**What you can do:**
- See all bundles
- Click **+ New bundle** to create one — give it a title, slug, description, price, and check the boxes next to whichever photos you want to include
- Edit or delete existing bundles

**Where it shows up publicly:** `/bundles` and `/bundles/[bundle-slug]`

---

## Services (`/admin/services`)

Your photography service packages (weddings, portraits, events, etc.).

**What you can do:**
- See all service packages
- Add, edit, or delete packages — set the name, description, how many rolls/photos are included, base price, and which event types it applies to

**Where it shows up publicly:** `/services`

---

## Bookings (`/admin/bookings`)

Booking requests that come in when someone fills out your booking form.

**What you can do:**
- See all bookings in a table view, or switch to **Calendar →** in the top right for a 3-month calendar view (color-coded by status)
- Click on any booking to see full details:
  - Customer name, email, phone
  - Event date, type, and package
  - Pricing and deposit status
  - Internal notes (only you see these)
  - Update the booking status (Inquiry → Confirmed → Completed / Cancelled)
  - **Create invoice** — one click to generate an invoice from this booking's details; once created, shows a "View invoice" link instead
  - **Email customer** — opens the email composer pre-filled with the customer's address
  - **Send portal link** — emails the client a private link to their personal booking portal (see Client Portal below); once sent, you can resend or preview it

---

## Inquiries (`/admin/inquiries`)

General contact form submissions from your `/contact` page.

**What you can do:**
- See all inquiries and their status (new, read, replied)
- Click on one to read it, add internal notes, and reply directly by email

---

## Orders (`/admin/orders`)

Digital download orders (photo and bundle purchases).

**What you can do:**
- See all paid orders in a table; click any row to open the full order
- On the order detail page, edit the customer's email, order status, and the items in the order (add photos/bundles from your catalog, change prices, edit download limits, remove items)
- **Email customer →** link at the bottom opens the email composer pre-filled for that customer

---

## Invoices (`/admin/invoices`)

Invoices you create and send to clients.

**What you can do:**
- See all invoices and their status (Draft, Sent, Paid, Cancelled)
- Click **New invoice →** to create a fully custom invoice:
  - Search for an existing customer (auto-fills their name, email, phone) or enter a new one manually
  - Add line items from your photo/bundle/package catalog with **Add from catalog…**, or write a custom description with **+ Custom line item**
  - Set an optional due date and notes
- From any invoice detail page:
  - **Download PDF** — opens a professionally designed PDF in a new tab
  - **Send invoice / Resend invoice** — emails the PDF directly to the client and marks the invoice as Sent
  - **Email customer →** — opens the email composer for a custom message
  - **Mark as paid** — updates the invoice status
  - **Delete invoice** — removes it

---

## Portfolio (`/admin/portfolio`)

Your marketing case studies (the `/work` section of the site).

**What you can do:**
- Add, edit, and delete case study pieces — brand name, your role, deliverables, metrics, video URLs, cover image, testimonial quote

**Where it shows up publicly:** `/work` and `/work/[slug]`

---

## Subscribers (`/admin/subscribers`)

People who've signed up for your newsletter.

**What you can do:**
- See all subscribers with their sign-up date and source
- Export to CSV for use in other tools

---

## Newsletter (`/admin/newsletter`)

Write and send newsletters to your subscriber list.

**What you can do:**
- Click **New newsletter** to open the composer
- Hit **Draft with AI** and Claude will write a draft based on your subject and prompt — you can edit it freely before sending
- Set the subject line and send to all confirmed subscribers

---

## Email (`/admin/email`)

Send a one-off email to anyone, directly from the site.

**What you can do:**
- Type in any email address, subject, and message body and hit **Send email**
- The "Email customer →" buttons on booking, order, and invoice pages all link here with the address and subject pre-filled — so you can jump straight to writing the message

---

## Client Portal

A private, magic-link page you can send to booking clients so they can check their own booking status, invoice, and balance — without needing to log in.

**How to use it:**
1. Go to a booking detail page (`/admin/bookings/[id]`)
2. Scroll to the **Client portal** section at the bottom
3. Click **Send portal link** — the client gets an email with their personal link, valid for 30 days
4. You can click **Preview portal** to see exactly what they'll see
5. Click **Resend portal link** at any time to refresh the link's expiry

**What the client sees at their portal (`/portal/[token]`):**
- Their booking details (package, event type, date, status)
- Their invoice with line items and amount due (if you've created one)
- A contact prompt to reach you by email

---

## Booking Calendar (`/admin/bookings/calendar`)

A 3-month calendar view of all bookings, color-coded by status.

- **Green** = Confirmed
- **Blue** = Inquiry
- **Grey** = Completed
- **Red** = Cancelled

Click any booking chip to go straight to that booking's detail page. Get here via the **Calendar →** link on the Bookings list page.

---

## Public-facing pages

These are the pages your visitors and customers see:

| Page | URL |
|------|-----|
| Homepage | `/` |
| Photo gallery | `/gallery` |
| Photo detail | `/gallery/[slug]` |
| Bundles | `/bundles` |
| Services | `/services` |
| Book a session | `/services/book` |
| Marketing portfolio | `/work` |
| Case study detail | `/work/[slug]` |
| About | `/about` |
| Contact | `/contact` |
| Media kit | `/media-kit` |
| Cart | `/cart` |

---

## Things that still need to be set up before going live

These features are built but require accounts and API keys to work fully:

- **Stripe** (taking payments online) — add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` to your environment
- **Cloudinary** (photo storage and watermarking) — add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Resend** (sending emails — newsletters, invoices, portal links, confirmations) — add `RESEND_API_KEY` and set `RESEND_FROM_EMAIL` to your address

Ask your developer to help with these — they each take about 10 minutes to set up once you have the accounts.
