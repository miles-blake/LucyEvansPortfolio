/**
 * Uploads all JPGs from "Lucy Film Photos/" to Cloudinary, uses Claude vision
 * to generate a title + tags for each, then creates Photo records in the DB.
 *
 * Usage: node scripts/upload-photos.mjs
 */

import { v2 as cloudinary } from "cloudinary";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PHOTOS_DIR = path.join(ROOT, "Lucy Film Photos");

// ── Credentials ─────────────────────────────────────────────────────────────
// Load from .env manually (no dotenv needed — we read the values directly)
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  const envLocal = path.join(ROOT, ".env.local");
  const env = {};
  for (const file of [envPath, envLocal]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = loadEnv();

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getWatermarkedUrl(publicId, opts = {}) {
  const { text = "© Lucy Evans", opacity = 60, gravity = "south_east", fontSize = 24 } = opts;
  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      {
        overlay: { font_family: "Arial", font_size: fontSize, text },
        color: "white",
        opacity,
        gravity,
        x: 20,
        y: 20,
      },
    ],
    secure: true,
  });
}

// Upload a file to Cloudinary; returns { publicId, secureUrl }
async function uploadToCloudinary(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "lucy-evans/photos",
    resource_type: "image",
    quality: "auto",
  });
  return { publicId: result.public_id, secureUrl: result.secure_url };
}

// Ask Claude Haiku to look at the image and return title + tags as JSON
async function analyzeImage(filePath) {
  const imageData = fs.readFileSync(filePath);
  const base64 = imageData.toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64 },
          },
          {
            type: "text",
            text: `You are tagging film photography prints for an online shop. Look at this photo and respond with ONLY valid JSON in this exact format:
{
  "title": "Short evocative title (3-6 words, no quotes in the title)",
  "tags": ["Tag1", "Tag2"]
}

Choose tags ONLY from this list (pick 1-3 that genuinely apply):
Landscape, Portrait, Street, Architecture, Nature, Travel, People, Wedding, Interior, Coastal, Urban, Countryside, Abstract, Still Life, Night, Forest, Water, Mountains, Flowers, Animals

Title should be poetic and descriptive, like a print title — e.g. "Evening Light on the Pier" or "Figures in the Fog". No quotation marks inside the title.

Respond with ONLY the JSON object, nothing else.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].text.trim();
  try {
    return JSON.parse(text);
  } catch {
    // Fallback if Claude returns something slightly off
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { title: "Untitled", tags: ["Landscape"] };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const files = fs.readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();

  console.log(`Found ${files.length} photos. Starting upload...\n`);

  // Fetch watermark settings from DB (use defaults if not set)
  let watermarkOpts = {};
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
    if (settings) {
      watermarkOpts = {
        text: settings.watermarkText,
        opacity: settings.watermarkOpacity,
        gravity: settings.watermarkPosition,
        fontSize: settings.watermarkFontSize,
      };
    }
  } catch {}

  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(PHOTOS_DIR, filename);
    const label = `[${String(i + 1).padStart(3, "0")}/${files.length}] ${filename}`;

    try {
      // 1. Analyze with Claude vision
      process.stdout.write(`${label} — analyzing...`);
      const { title, tags } = await analyzeImage(filePath);

      // 2. Upload to Cloudinary
      process.stdout.write(` uploading...`);
      const { publicId } = await uploadToCloudinary(filePath);

      // 3. Build URLs
      const previewImageUrl = getWatermarkedUrl(publicId, watermarkOpts);
      const fullResFileUrl = cloudinary.url(publicId, { secure: true });

      // 4. Save to DB
      const slug = `${slugify(title)}-${Date.now()}`;
      await prisma.photo.create({
        data: {
          title,
          slug,
          tags,
          collectionTag: tags[0] ?? null,
          previewImageUrl,
          fullResFileUrl,
          price: 0, // Lucy can set prices from the admin panel
        },
      });

      console.log(` ✓ "${title}" [${tags.join(", ")}]`);
      success++;

      // Small delay to avoid hammering the APIs
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(` ✗ ERROR: ${err.message}`);
      failed++;
    }
  }

  await prisma.$disconnect();
  console.log(`\nDone. ${success} uploaded, ${failed} failed.`);
  if (failed > 0) console.log("Re-run the script to retry failed photos — already-uploaded ones will just get duplicate DB entries, which you can clean up in admin.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
