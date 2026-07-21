import Stripe from "stripe";

// TODO: Add STRIPE_SECRET_KEY to .env once your Stripe account is created
// https://stripe.com → Developers → API Keys → Secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — checkout will fail until configured.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});
