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

**Where services appear publicly:** Your services page, where clients can learn about your packages and start a booking.

---

## Bookings

**How to get there:** Click **Bookings** in the left sidebar.

Booking requests that come in when someone fills out your booking form on the site.

**What you can do from the list view:**
- See all bookings in a table, or click **Calendar →** in the top right to see a 3-month calendar view (color-coded by status — green for confirmed, blue for inquiry, grey for completed, red for cancelled)

**What you can do inside a booking:**
- See the client's name, email, phone, event date, event type, and package
- See pricing, deposit status, and any add-ons they selected
- Update the booking status: Inquiry → Confirmed → Completed (or Cancelled)
  - When you change a status to **Confirmed**, the client automatically gets a confirmation email with their booking details and a link to their portal
- Add internal notes — only you see these
- **Create invoice** — generates an invoice from this booking's details in one click
- **Email customer** — opens the email tool with the customer's address already filled in
- **Send portal link** — emails the client a private link to their personal booking page; you can resend it anytime to reset the 30-day clock
- **Delete booking** — at the bottom of any booking detail page there's a delete button. It asks you to confirm before deleting. This permanently removes the booking, all its messages, delivered photos, contract, and portal token.

**Communication preference:** When clients fill out the booking form, they can choose whether they prefer to be contacted by **email** or **text message** (SMS). Their preference is shown in the Customer section of their booking detail page. The site automatically uses their preferred channel when sending booking confirmations and reminders. If they prefer text, you'll also see a **Send text →** button on their booking page. (Requires Twilio setup — see setup notes.)

**Messaging:** Every booking has a message thread at the bottom. You can send messages directly from the booking detail page and the client can reply from their portal — all messages appear in the same thread.

**Delivery gallery:** Once you've finished a shoot, you can upload the final photos directly on the booking detail page. The client will then see a download section in their portal where they can download each photo. You can upload as many files as you like — they go straight to Cloudinary.

**Contracts:** You can upload a contract PDF to any booking. Once uploaded, the client sees a "View contract" link and a signature box in their portal. They type their full name to sign — the signature and timestamp are saved automatically.

---

## Availability

**How to get there:** Click **Availability** in the left sidebar.

Block out dates when you're unavailable so clients can't book those days.

**What you can do:**
- Add a blackout date — pick a date and an optional reason (e.g. "Holiday", "Already booked privately")
- Delete any blackout date to make it available again

Blocked-out dates automatically appear as unavailable on the public booking form so clients can't select them.

---

## Inquiries

**How to get there:** Click **Inquiries** in the left sidebar.

General contact form submissions from people visiting your site.

**What you can do:**
- See all messages and their status (new, read, replied)
- Click on any message to read it, add internal notes, and reply by email

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

**Clients can pay invoices online:** If a client has a portal link or a client account, they see a **Pay now** button directly on the invoice. Clicking it takes them to a secure Stripe checkout — no extra setup needed on your end.

---

## Payments (Stripe)

Stripe handles all online payments on the site. Clients can pay in two places:

- **Deposit** — shown on the client portal and in their account. A "Pay deposit" button appears until the deposit is paid. Once paid, their booking is automatically updated.
- **Invoice** — shown on the portal and account pages. A "Pay now" button appears if there's a balance due. Once paid, the invoice is automatically marked as paid.

Stripe payments go directly to your connected Stripe account. No manual steps needed on your end — everything updates automatically when payment clears.

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

**How customers browse:** They go to your Gallery page and see all 282 of your film photos in a contact-sheet style grid. They can filter by tag (Landscape, Portrait, Wedding, Coastal, etc.) using the filter bar at the top. Each photo has 3–4 tags assigned automatically based on what's in the image.

**Pricing:** All photos are currently set at $3 each.

**Bundle discounts:** Customers who buy multiple photos in one order automatically get a discount — no code needed. The discount scales based on how many individual photos are in their cart:
- 3–5 photos: 5% off
- 6–9 photos: 10% off
- 10–14 photos: 15% off
- 15+ photos: 20% off

The discount is shown clearly in the cart before checkout and applied automatically. Discount codes (if you create them) stack on top of the bundle discount.

**Saved photos (wishlist):** Customers can bookmark photos by clicking the bookmark icon on any photo. Their saved photos appear on the Wishlist page. Prices always reflect the current price in your shop, even if the price changed after they saved it.

**Checkout:** Before being sent to Stripe to pay, customers fill in their name (required), email address (required), and phone number (optional) on the cart page. This means the Orders tab in your admin shows who bought immediately after payment — you don't have to wait for anything.

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

**Activity log:** Also under Settings, click **View activity log →** to see a running record of every admin action — booking status changes, deleted bookings, invoices marked paid, order edits. Timestamped and labelled with who did it.

---

## Client Portal

A private page you send to booking clients so they can see their booking details, invoice, messages, contract, and final photos — all in one place, without needing an account.

**How to send it:**
1. Go to any booking (click **Bookings** in the sidebar, then click the booking you want)
2. Scroll to the **Client portal** section
3. Click **Send portal link** — the client gets an email with their personal link, which stays active for 30 days
4. Click **Preview portal** to see exactly what they'll see
5. Click **Resend portal link** at any time to refresh the link and reset the 30-day clock

**What the client sees on their portal page:**
- Their booking details (package, event type, date, and current status)
- A **Pay deposit** button if their deposit hasn't been paid yet
- Their invoice with line items and a **Pay now** button if there's a balance due
- Their contract — with a "View contract PDF" link and a digital signature box if it hasn't been signed yet
- Their delivered photos as download links, once you've uploaded them
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
- **Resend** — sending emails (booking confirmations, portal links, newsletters, invoice PDFs)

The site is live and fully operational.
