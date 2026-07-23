# Lucy Evans — Site Guide

This document explains everything your website can do and how to get to each feature. No technical knowledge needed — just plain English.

> **Living document:** Every time a new feature is added to the site, it will be updated here.

---

## Getting into the admin panel

Open your website and add **/admin/login** to the end of your address bar, then sign in with your email and password. Once you're in, you'll see a sidebar on the left with links to everything.

---

## Dashboard

**How to get there:** It's the first thing you see after logging in. Click "Dashboard" in the sidebar to come back to it anytime.

At a glance it shows:

- **Stats** — how many photos, bundles, bookings, paid orders, subscribers, and portfolio pieces you have
- **Revenue** — your all-time total, this month, and last month, plus a 6-month bar chart broken down by orders and invoices
- **Recent bookings and orders** — a quick snapshot of what's come in lately
- **Activity feed** — a running log of recent inquiries, sign-ups, bookings, and orders

---

## Inbox

**How to get there:** Click **Inbox** in the left sidebar. The number on the badge shows your total unread count.

Your unified message center — all unread client messages in one place, sorted by most recent.

**What it shows:**
- Unread messages from clients in existing booking threads (labelled "message")
- New contact form submissions from potential clients (labelled "inquiry")

Clicking any item takes you straight to that booking or inquiry. There's a **Mark all read** button to clear everything at once.

---

## Photos

**How to get there:** Click **Photos** in the left sidebar.

Everything related to your film photo shop.

**What you can do:**
- See all your photos in a table
- Click **+ New photo** to add a single photo — fill in the title, description, film stock, camera, location, price, and upload the image
- Click **Bulk upload** to upload many photos at once — drag and drop image files (JPG, PNG, NEF, CR2, and all common photo formats), set shared details like film stock and camera for the whole batch, then save them all at once. You can edit each photo individually afterwards to set unique prices or details.
- Click on any photo in the list to edit or delete it

**Where photos appear publicly:** Your photo gallery page and each individual photo's detail page — customers can browse and purchase prints there.

---

## Bundles

**How to get there:** Click **Bundles** in the left sidebar.

Curated sets of photos sold together at a single price.

**What you can do:**
- See all bundles
- Click **+ New bundle** to create one — give it a title, description, and price, then check the boxes next to whichever photos you want to include
- Edit or delete existing bundles

**Where bundles appear publicly:** Your bundles page, where customers can browse and purchase sets.

---

## Services

**How to get there:** Click **Services** in the left sidebar.

Your photography service packages — things like weddings, portraits, and events.

**What you can do:**
- See all service packages
- Add, edit, or delete packages — set the name, description, how many rolls and photos are included, base price, and which types of events it applies to

**Where services appear publicly:** Your services page, where clients can learn about your packages and start a booking request.

---

## Bookings

**How to get there:** Click **Bookings** in the left sidebar.

Booking requests that come in when someone fills out your booking form on the site.

### How the booking flow works

Clients **do not pay when they submit a request**. The new flow is:

1. A client fills out the booking form and submits their request — no payment collected yet
2. They get an auto-confirmation email saying you'll be in touch within 1–2 business days
3. You review the request in admin and, when ready, change the status to **Confirmed**
4. The client automatically receives a confirmation email with a link to their personal portal
5. From their portal, they pay the 50% deposit to lock in the date

This means you're always in control of which bookings get confirmed before any money changes hands.

### What clients fill out on the booking form

- Package and event type
- Their preferred date
- **Pre-shoot questionnaire** — questions tailored to the event type (weddings get 13 questions covering ceremony venue, reception venue, start time, guest count, coverage hours, first look, vibe, priority moments, family groupings, inspiration, etc.; all other shoots get 10 questions covering occasion, location, group size, vibe, must-have shots, inspiration, etc.). All questions are optional.
- Contact info (name, email, phone, communication preference, and how they heard about you)

### List view and calendar

- See all bookings in a table, or click **Calendar →** in the top right for a 3-month calendar view (color-coded by status — green for confirmed, blue for inquiry, grey for completed, red for cancelled)
- Or click **Kanban →** to see bookings as cards grouped by status — useful for getting a visual overview of your pipeline

### Inside a booking

- **Customer section** — name, email, phone, communication preference (email or text), and how they found you
- **Event section** — date, event type, and package details
- **Moodboard & inspiration** — any Pinterest boards or links the client has shared from their portal appear here for easy reference when planning their shoot
- **Shoot questionnaire** — all the answers from the pre-shoot form, formatted clearly with each question and their answer
- **Pricing section** — total price, deposit amount, and deposit status
- **Update status** — change between Inquiry, Confirmed, Completed, and Cancelled
  - **Confirmed** → client gets a confirmation email and (if a contract template is set) an auto-generated PDF contract is created and emailed to them
  - **Completed** → client gets an automated review request email
  - **Cancelled** → client gets a cancellation notice
- **Internal notes** — only you see these
- **Create invoice** — generates an invoice from this booking's details in one click
- **Email customer / Send text** — quick links to contact them
- **Send portal link** — emails the client a private link to their personal booking portal (see Client Portal section below); resend anytime to reset the 30-day expiry
- **Delivery gallery** — upload finished photos here; the client sees download links in their portal
- **Contract** — upload a contract PDF or auto-generate one from your template; the client signs digitally from their portal
- **Messages** — a message thread at the bottom; you write here and the client replies from their portal
- **Offline payments** — log cash, check, Zelle, or any payment that happened outside the site
- **Delete booking** — at the very bottom, behind a confirmation step. Permanently removes the booking, messages, photos, contract, and portal token.

**Communication preference:** When clients fill out the booking form, they choose whether they prefer **email** or **text message** (SMS). The site automatically uses their preferred channel for all booking confirmations and reminders.

---

## Automated Emails

The site sends emails automatically at key points in the booking lifecycle — you don't have to do anything. Here's the full sequence:

| When it fires | What it sends |
|---|---|
| Client submits booking request | Auto-responder telling them you'll be in touch within 1–2 days |
| You change status to **Confirmed** | Booking confirmation email with portal link |
| You change status to **Confirmed** (if contract template is set) | Second email with their contract ready to sign |
| 7 days before the shoot | Prep email with tips (what to wear, what to bring) + booking reminder |
| 7 days before the shoot (if deposit unpaid) | Balance due reminder with a link to pay |
| 7 days before the shoot | 7-day countdown reminder (includes overdue deposit warning if unpaid) |
| 2 days before the shoot | 2-day countdown reminder |
| 2 days after the shoot | Post-shoot follow-up thanking them and asking for a review |
| You change status to **Completed** | Review request email with a personal link |
| You change status to **Cancelled** | Cancellation notice |
| 6 months after the shoot | Re-engagement email inviting them to book again |

All reminders are sent once and never repeated — the system tracks which ones have been sent so you don't have to.

---

## Availability

**How to get there:** Click **Availability** in the left sidebar.

Block out dates when you're unavailable so clients can't request those days.

**What you can do:**
- Add a blackout date — pick a date and an optional reason (e.g. "Holiday", "Already booked privately")
- Delete any blackout date to make it available again

Blocked-out dates automatically appear as unavailable on the public booking form so clients can't select them.

---

## Mini Sessions

**How to get there:** Click **Mini Sessions** in the left sidebar.

Mini sessions are time-slot events — you set up a day with multiple short slots and clients each pick one independently, like a sign-up sheet.

**What you can do:**
- Click **+ New day** to create a mini session event — set the title, date, location, description, slot duration (in minutes), and price per slot
- Once created, add individual time slots to the day
- Toggle the day between **draft** (hidden from the public) and **published** (visible on your site)
- On the detail page, see which slots are available, held, or booked, and who has each slot

**Where mini sessions appear publicly:** A dedicated mini sessions booking page where clients can see available slots and pick their time.

---

## Inquiries

**How to get there:** Click **Inquiries** in the left sidebar.

General contact form submissions from people visiting your site.

**What you can do:**
- See all messages and their status (new, read, replied)
- Click on any message to read it, add internal notes, and reply by email

**What the contact form collects:**
- Name and email (required)
- Phone number and communication preference (email or text)
- Package they're interested in (pulled from your active service packages)
- Reason for getting in touch (General question, Booking inquiry, Pricing question, or Other)
- Their message

New, unread inquiries also appear in your **Inbox** so you never miss one.

---

## Clients

**How to get there:** Click **Clients** in the left sidebar.

A CRM view of everyone who has ever interacted with your business — clients with bookings, orders, inquiries, and newsletter sign-ups are all here.

**What the client list shows:**
- Every client grouped by email address
- How many bookings, orders, and inquiries each has
- Their total lifetime spend across bookings and orders
- Auto-generated tags based on their history

**Auto-tags (applied automatically, no setup needed):**
- **new** — first interaction within the last 90 days, only 1 engagement
- **returning** — 2 or more bookings/orders total
- **frequent** — 2+ completed bookings or 3+ total engagements
- **vip** — 4+ completed bookings, or $2,000+ lifetime spend
- **inactive** — had past activity but hasn't engaged in over a year
- **inquiry only** — submitted an inquiry but never booked or ordered

**Inside a client profile:**
- Full history — all their bookings, orders, invoices, and inquiries with statuses and dates
- Revenue breakdown (how much from bookings vs. orders)
- **Manual tags** — add your own custom labels (e.g. "bride", "corporate") in addition to the auto-tags
- Notes — a freeform field for anything you want to remember about this client

---

## Orders

**How to get there:** Click **Orders** in the left sidebar.

Digital download orders — when someone buys a photo or bundle from your shop.

**What you can do:**
- See all paid orders in a list; click any row to open the full order details — each item shows a thumbnail of the photo purchased
- Edit the customer's email, order status, and the items in the order (add photos or bundles from your catalog, change prices, or remove items)
- Click **Email customer →** to open the email tool with that customer's address filled in

---

## Invoices

**How to get there:** Click **Invoices** in the left sidebar.

Invoices you create and send to clients — separate from automated shop receipts.

**What you can do:**
- See all invoices and their status (Draft, Sent, Paid, Cancelled)
- Click **New invoice →** to create a fully custom invoice:
  - Enter a client's name, email, and phone (or link it to an existing booking)
  - Add line items by choosing from your existing photos, bundles, and packages with **Add from catalog…**, or write a completely custom description with **+ Custom line item**
  - Set an optional due date and notes for the client
- From any invoice detail page:
  - **Download PDF** — opens a professionally designed PDF in a new tab
  - **Send invoice / Resend invoice** — emails the PDF directly to the client and marks it as Sent
  - **Email customer →** — opens the email tool for a custom message
  - **Mark as paid** — updates the invoice status when payment comes in outside the site
  - **Delete invoice** — removes it permanently

**Automatic payment reminders:** If an invoice is in Sent status and has a due date, the site automatically sends the client a payment reminder when their due date is within 7 days — and again if it goes overdue. Each invoice only gets one reminder (it won't keep re-sending).

**Clients can pay invoices online:** If a client has a portal link or a client account, they see a **Pay now** button directly on the invoice. Clicking it takes them to a secure Stripe checkout — no extra setup needed on your end.

---

## Reviews

**How to get there:** Click **Reviews** in the left sidebar.

Client reviews collected through the site.

**How reviews are collected:**
- Automatically when you mark a booking as **Completed** — the client gets an email with a personal review link
- Automatically 2 days after the shoot date (even if the booking isn't yet marked Completed)
- The client rates from 1–5 stars and writes a short review on a clean, branded page

**What you can do in the admin:**
- **Pending approval** — reviews that clients have submitted but you haven't published yet
- Click **Approve & publish** to make a review visible on the public reviews page
- Click **Unpublish** to take a review down without deleting it
- Click **Delete** to remove a review permanently

**Public reviews page:** Approved reviews appear at **/reviews** on your site — star rating, client name, and their words, sorted by most recent. Share this page with prospective clients.

---

## Payments (Stripe)

Stripe handles all card payments on the site. Clients can pay in these places:

- **Deposit** — shown on the client portal. A "Pay deposit with card" button appears until the deposit is paid. Once paid, their booking is automatically updated.
- **Invoice** — shown on the portal and account pages. A "Pay now" button appears if there's a balance due. Once paid, the invoice is automatically marked as paid.

Stripe payments go directly to your connected Stripe account. No manual steps needed on your end — everything updates automatically when payment clears.

---

## Venmo Payments

Clients can choose to pay with Venmo instead of a card — available in two places:

- **Photo shop cart** — a "Pay with Venmo" button sits alongside the "Pay with card" button at checkout
- **Client portal** — a collapsible Venmo option appears next to the "Pay deposit" and "Pay invoice" Stripe buttons

**How it works for the client:**
1. They click "Pay with Venmo" and follow the link straight to your Venmo (@Lucy-Evans99) with the correct amount and payment note pre-filled
2. They complete the payment in Venmo, then return to the site
3. They upload a screenshot of their Venmo confirmation as proof
4. Their order or booking shows as pending until you verify it

**How you verify it (Venmo Payments page):**
1. You'll get an email notification whenever a client submits a Venmo payment with a direct link to review it
2. Click **Venmo payments** in the left sidebar
3. Pending payments appear at the top — you can see the client's screenshot
4. Upload your own confirmation screenshot (your side of the transaction) and click **Confirm payment**
5. The client gets an email — their booking is marked as deposit paid, or their photo download links are sent automatically
6. If there's a problem, enter a reason in the rejection field and click **Reject payment** — the client gets a note explaining it

Resolved payments (confirmed or rejected) move to the bottom of the page for your records.

**Sidebar badge:** The Venmo payments link in your sidebar shows a red badge with the number of pending payments so you always know when something needs attention.

---

## Offline Payment Tracking

For payments that happen outside the site (cash, check, Zelle, or direct Venmo you've already verified), you can record them directly on any booking.

**How to log an offline payment:**
1. Open the booking in question (**Bookings** → click the booking)
2. Scroll to the **Offline payments** section
3. Enter the amount, choose the payment method (Venmo, Cash, Check, Zelle, or Other), add an optional note, and upload a photo of the proof (receipt, screenshot, etc.)
4. Click **Record payment**

The payment appears on the booking detail page with a link to the proof image. If the payments you've recorded add up to the deposit amount or more, the deposit is automatically marked as paid.

---

## Portfolio

**How to get there:** Click **Portfolio** in the left sidebar.

Your marketing work case studies — the section of the site that showcases brand collaborations and content campaigns.

**What you can do:**
- Add, edit, and delete case study pieces — brand name, your role, deliverables, results/metrics, video links, a cover image, and a testimonial quote

**Where portfolio pieces appear publicly:** Your work page and each individual campaign's detail page.

---

## Subscribers

**How to get there:** Click **Subscribers** in the left sidebar.

Everyone who's signed up for your newsletter through the site.

**What you can do:**
- See all subscribers with their sign-up date and where they signed up from
- Export to a spreadsheet (CSV) to use in other tools

---

## Newsletter

**How to get there:** Click **Newsletter** in the left sidebar.

Write and send newsletters to your subscriber list.

**What you can do:**
- Click **New newsletter** to open the composer
- Hit **Draft with AI** and Claude will write a draft based on your subject and any notes you give it — you can edit it freely before sending
- Set the subject line and send to all confirmed subscribers in one click

---

## Email

**How to get there:** Click **Email** in the left sidebar.

Send a one-off email to anyone directly from the site — useful for following up with a client, sending a quick note, or anything that isn't a newsletter.

**What you can do:**
- Type in any email address, a subject, and your message, then hit **Send email**
- The **Email customer →** buttons on booking, order, and invoice pages all take you here with the address and subject already filled in

---

## Photo Gallery & Shop

**How customers browse:** They go to your Gallery page and see all of your film photos in a contact-sheet style grid. They can filter by tag (Landscape, Portrait, Wedding, Coastal, etc.) using the filter bar at the top.

**Pricing:** Set per-photo on each photo's edit page.

**Bundle discounts:** Customers who buy multiple photos in one order automatically get a discount — no code needed. The discount scales based on how many individual photos are in their cart:
- 3–5 photos: 5% off
- 6–9 photos: 10% off
- 10–14 photos: 15% off
- 15+ photos: 20% off

The discount is shown clearly in the cart before checkout and applied automatically. Discount codes (if you create them) stack on top of the bundle discount.

**Saved photos (wishlist):** Customers can bookmark photos by clicking the bookmark icon on any photo. Their saved photos appear on the Wishlist page. Prices always reflect the current price in your shop, even if the price changed after they saved it.

**Checkout:** Before paying, customers fill in their name (required), email address (required), and phone number (optional) on the cart page. They can then choose to **Pay with card** (Stripe, instant) or **Pay with Venmo** (manually verified by you within 24 hours).

**After purchase:** Customers land on a confirmation page with download buttons and receive the same links by email. The links never expire — they can re-download anytime if they lose the file. On iPhone, tapping Download opens the native share sheet with a "Save to Photos" option.

---

## Discount Codes

**How to get there:** Click **Discounts** in the left sidebar.

Create promo codes that customers can enter at checkout in the photo shop.

**What you can do:**
- Create a code — give it a name (e.g. SUMMER20), choose whether it's a flat dollar discount or a percentage off, set the amount, and optionally cap how many times it can be used or set an expiry date
- Enable or disable any code without deleting it
- Delete codes you no longer need

**How customers use them:** On the cart page, there's a "Discount code" field. They type in the code, click Apply, and the discount is shown immediately before they proceed to checkout.

---

## Analytics

**How to get there:** Click **Analytics** in the left sidebar.

A bird's-eye view of how the site is performing.

**What's shown:**
- **Summary cards** — total revenue and number of orders in the last 30 days, plus your overall inquiry-to-booking conversion rate
- **Booking funnel** — a bar chart showing how many bookings are at each stage (Inquiry, Confirmed, Completed, Cancelled) and what percentage each represents
- **Revenue by event type** — which kinds of shoots (weddings, portraits, events, etc.) are bringing in the most revenue
- **Top-selling photos** — your 10 best-selling individual photos by number of sales and total revenue earned
- **Discount code usage** — which promo codes have been used and how many times

---

## Settings

**How to get there:** Click **Settings** in the left sidebar.

**Watermark customization:** You can change how the watermark appears on your shop preview images — all from here, without touching any code:
- **Watermark text** — what the watermark says (e.g. "© Lucy Evans")
- **Opacity** — how transparent or solid the watermark appears (0 = invisible, 100 = fully solid)
- **Font size** — how large the text appears
- **Position** — where on the photo it sits (bottom right, bottom left, top right, top left, or center)

Changes take effect on all watermarked images immediately after saving.

**Contract template:** Under Settings → Contract template, you can write (or paste) the body of your standard client contract. Whenever you confirm a booking, the site automatically generates a PDF contract from this template and emails it to the client, with their booking details filled in. They sign it from their portal.

**Activity log:** Also under Settings, click **View activity log →** to see a running record of every admin action — booking status changes, deleted bookings, invoices marked paid, order edits. Timestamped and labelled with who did it.

---

## Client Portal

A private page you send to booking clients so they can see their booking details, invoice, messages, contract, delivered photos, and inspiration links — all in one place, without needing an account.

**How to send it:**
1. Go to any booking (click **Bookings** in the sidebar, then click the booking you want)
2. Scroll to the **Client portal** section
3. Click **Send portal link** — the client gets an email with their personal link, which stays active for 30 days
4. Click **Preview portal** to see exactly what they'll see
5. Click **Resend portal link** at any time to refresh the link and reset the 30-day clock

**What the client sees on their portal page:**
- Their booking details (package, event type, date, and current status)
- A **Pay deposit with card** button (and a Venmo option) if their deposit hasn't been paid yet
- Their invoice with line items and a **Pay now** button if there's a balance due
- Their contract — with a "View contract PDF" link and a digital signature box if it hasn't been signed yet
- **Moodboard & inspiration** — a place where clients can paste Pinterest boards, Instagram posts, or any link that captures the vibe they're going for. They can add up to 20 links and remove them at any time. The links appear in the admin on the booking detail page under "Moodboard & inspiration" so you can reference them when planning their shoot.
- Their delivered photos as download links, once you've uploaded them
- A **Leave a review** section that appears after the shoot is complete
- The message thread where they can write to you and see your replies

---

## Client Accounts

Clients can create their own accounts on the site and log in to see everything in one place — no magic link required.

**How clients sign up:**
1. They click **Sign in** in the top right corner of any page
2. They click **Create one** to make a new account with their name, email, and a password
3. They'll receive a **verification email** — they need to click the link in it before their bookings and invoices appear
4. Once verified, they land on their **My Account** page and can see everything

**Password requirements:** 8 or more characters, at least one uppercase letter, and at least one number. The signup form shows a live checklist as they type so they know exactly what's missing.

**What clients see after logging in (My Account page):**
- All their bookings on file, with the status of each
- A **View portal →** button on any booking where you've sent them a portal link
- Their invoices and the amount due on each, with a **Pay now** button for any outstanding balance
- A prompt to browse services if they don't have any bookings yet

**How bookings get linked:** The email they use to register must match the email you entered when their booking was created. If it matches, their bookings appear automatically.

> **Note:** The admin panel is completely separate and only accessible to you. Clients cannot see anything in the admin area.

---

## Preview as Visitor

A way to see and use your site exactly as a customer would — useful for testing the shop, cart, booking flow, and client portal.

**How to use it:**
1. Look in the bottom of the left sidebar for **Preview as visitor** and click it
2. You'll land on the homepage with a dark bar across the top that says *"Admin preview mode — you're seeing the site as a visitor would"*
3. Browse the shop, add photos to your cart, go through checkout, fill out the booking form — everything works exactly as it would for a real customer
4. When you're done, click **Return to admin →** in that bar to go straight back to your admin panel

Real visitors will never see the preview bar — it only appears for you during a preview session.

> **Also in the sidebar:** "View site" opens the public homepage without starting a preview session — handy for a quick look.

---

## Go-Live Status

Everything is connected and ready:

- **Stripe** — taking payments for photo shop orders, booking deposits, and invoices
- **Cloudinary** — photo uploads, storage, and watermarked previews
- **Resend** — sending emails (booking confirmations, reminders, portal links, newsletters, invoice PDFs, review requests)
- **Twilio** — sending SMS notifications to clients who prefer text messages

The site is live and fully operational.
