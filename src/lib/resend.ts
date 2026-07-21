import { Resend } from "resend";

// TODO: Add RESEND_API_KEY to .env once your Resend account is created
// https://resend.com → API Keys
if (!process.env.RESEND_API_KEY) {
  console.warn("[resend] RESEND_API_KEY is not set — transactional emails will not send.");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
