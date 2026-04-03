#!/usr/bin/env node
/**
 * migrate-images-to-r2.mjs
 *
 * Re-fetches provider images from Google Places API and uploads to Cloudflare R2.
 * Replaces dead cdn-api.olera.care URLs with permanent R2 URLs.
 *
 * Usage:
 *   # Dry run — show what would happen, no writes
 *   node scripts/migrate-images-to-r2.mjs --dry-run
 *
 *   # Migrate all providers with dead CDN URLs
 *   node scripts/migrate-images-to-r2.mjs
 *
 *   # Migrate a specific batch (offset + limit)
 *   node scripts/migrate-images-to-r2.mjs --offset=0 --limit=500
 *
 *   # Resume from checkpoint
 *   node scripts/migrate-images-to-r2.mjs --resume
 *
 *   # Custom concurrency (default: 20)
 *   node scripts/migrate-images-to-r2.mjs --concurrency=30
 *
 * Environment variables (from .env.local + Image Fetcher .env):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME (default: provider-images)
 *   R2_PUBLIC_URL (default: https://pub-e9cff84835324ecca87386d81c641a56.r2.dev)
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";

// ---------------------------------------------------------------------------
// Load env files
// ---------------------------------------------------------------------------

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const HOME = process.env.HOME;
loadEnvFile(`${HOME}/Desktop/olera-web/.env.local`);
loadEnvFile(
  `${HOME}/Desktop/TJ-hq/Olera/Olera Data Analysis Scripts/Image Fetcher/.env`
);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || "provider-images";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  "https://pub-e9cff84835324ecca87386d81c641a56.r2.dev";

const MAX_PHOTOS_PER_PROVIDER = 2;
const CHECKPOINT_FILE = "scripts/.migrate-images-checkpoint.json";
const MAX_IMAGE_WIDTH = 800;
const JPEG_QUALITY = 85;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RESUME = args.includes("--resume");
const getArg = (prefix) => args.find((a) => a.startsWith(prefix));
const CLI_OFFSET = getArg("--offset=")
  ? parseInt(getArg("--offset=").split("=")[1], 10)
  : 0;
const CLI_LIMIT = getArg("--limit=")
  ? parseInt(getArg("--limit=").split("=")[1], 10)
  : Infinity;
const CONCURRENCY = getArg("--concurrency=")
  ? parseInt(getArg("--concurrency=").split("=")[1], 10)
  : 20;

// ---------------------------------------------------------------------------
// Validate env
// ---------------------------------------------------------------------------

const missing = [];
if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (!GOOGLE_API_KEY) missing.push("GOOGLE_PLACES_API_KEY");
if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---------------------------------------------------------------------------
// Stats (use atomic increments since workers run concurrently)
// ---------------------------------------------------------------------------

const stats = {
  totalProviders: 0,
  processed: 0,
  photosUploaded: 0,
  dbUpdated: 0,
  noPlaceId: 0,
  noPhotos: 0,
  downloadFailed: 0,
  uploadFailed: 0,
  errors: 0,
  googleApiCalls: 0,
  skippedAlreadyMigrated: 0,
};

const startTime = Date.now();

// ---------------------------------------------------------------------------
// Global rate limiter — shared across all concurrent workers
// Target: ~30 Google API requests/sec (well within 100 QPS quota)
// ---------------------------------------------------------------------------

const GOOGLE_MIN_INTERVAL_MS = 33; // ~30 QPS
let lastGoogleCallTime = 0;
let rateLimitQueue = Promise.resolve();

function googleRateLimit() {
  rateLimitQueue = rateLimitQueue.then(
    () =>
      new Promise((resolve) => {
        const now = Date.now();
        const wait = Math.max(0, GOOGLE_MIN_INTERVAL_MS - (now - lastGoogleCallTime));
        setTimeout(() => {
          lastGoogleCallTime = Date.now();
          resolve();
        }, wait);
      })
  );
  return rateLimitQueue;
}

// ---------------------------------------------------------------------------
// Google Places API
// ---------------------------------------------------------------------------

async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return resp;
      if (resp.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return resp;
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

async function getPhotoReferences(placeId) {
  await googleRateLimit();
  stats.googleApiCalls++;
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${GOOGLE_API_KEY}`;
  const resp = await fetchWithRetry(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.photos || [];
}

/**
 * Download photo directly by following the redirect (1 round trip instead of 2).
 * Without skipHttpRedirect, the Photo Media endpoint 302-redirects to the image.
 */
async function downloadPhoto(photoName) {
  await googleRateLimit();
  stats.googleApiCalls++;
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${MAX_IMAGE_WIDTH}&key=${GOOGLE_API_KEY}`;
  const resp = await fetchWithRetry(url);
  if (!resp.ok) return null;
  const arrayBuf = await resp.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ---------------------------------------------------------------------------
// Image optimization
// ---------------------------------------------------------------------------

async function optimizeImage(buffer) {
  return sharp(buffer)
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// R2 upload
// ---------------------------------------------------------------------------

function generateR2Key(providerId, index) {
  const hash = createHash("md5")
    .update(`${providerId}_photo_${index}`)
    .digest("hex")
    .slice(0, 12);
  return `providers/${providerId}/${hash}.jpg`;
}

async function uploadToR2(buffer, key) {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000",
  });
  await s3.send(cmd);
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

// ---------------------------------------------------------------------------
// Checkpoint
// ---------------------------------------------------------------------------

function saveCheckpoint(processedIndex) {
  writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({
      processedIndex,
      timestamp: new Date().toISOString(),
      stats,
    })
  );
}

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf8"));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Process a single provider
// ---------------------------------------------------------------------------

async function migrateProvider(provider) {
  const { provider_id, place_id, provider_images, provider_logo } = provider;

  if (!place_id) {
    stats.noPlaceId++;
    return;
  }

  // Skip if already migrated to R2
  if (
    provider_images &&
    !provider_images.includes("cdn-api.olera.care") &&
    provider_images.includes("r2.dev")
  ) {
    stats.skippedAlreadyMigrated++;
    return;
  }

  try {
    // 1. Get photo references from Google Places
    const photos = await getPhotoReferences(place_id);
    if (!photos || photos.length === 0) {
      stats.noPhotos++;
      return;
    }

    // 2. Pick best candidates: prefer landscape photos (wider > taller)
    const ranked = photos
      .map((p) => ({
        ...p,
        score: (p.widthPx || 0) / Math.max(p.heightPx || 1, 1),
      }))
      .sort((a, b) => b.score - a.score);

    const photosToProcess = ranked.slice(0, MAX_PHOTOS_PER_PROVIDER);

    // 3. Download, optimize, upload — all photos for this provider in parallel
    const uploadResults = await Promise.all(
      photosToProcess.map(async (photo, i) => {
        try {
          const rawBuffer = await downloadPhoto(photo.name);
          if (!rawBuffer) {
            stats.downloadFailed++;
            return null;
          }

          const optimized = await optimizeImage(rawBuffer);
          const key = generateR2Key(provider_id, i);
          const publicUrl = await uploadToR2(optimized, key);
          stats.photosUploaded++;
          return publicUrl;
        } catch (e) {
          stats.uploadFailed++;
          return null;
        }
      })
    );

    const r2Urls = uploadResults.filter(Boolean);

    // 4. Update Supabase with new R2 URLs
    if (r2Urls.length > 0) {
      const updates = { provider_images: r2Urls.join(" | ") };

      if (provider_logo && provider_logo.includes("cdn-api.olera.care")) {
        updates.provider_logo = null;
      }

      await supabase
        .from("olera-providers")
        .update(updates)
        .eq("provider_id", provider_id);
      stats.dbUpdated++;
    }

    stats.processed++;
  } catch (e) {
    stats.errors++;
  }
}

// ---------------------------------------------------------------------------
// Concurrent worker pool
// ---------------------------------------------------------------------------

async function processWithWorkers(providers) {
  let cursor = 0;

  function printProgress() {
    const done = stats.processed + stats.noPhotos + stats.errors + stats.noPlaceId + stats.skippedAlreadyMigrated;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((done / providers.length) * 100).toFixed(1);
    const rate = (done / (elapsed || 1)).toFixed(1);
    const detailsCost = stats.googleApiCalls * 0.005; // blended avg
    const estimatedCost = detailsCost.toFixed(2);
    const eta = rate > 0 ? (((providers.length - done) / rate) / 60).toFixed(1) : "?";
    process.stdout.write(
      `\r  [${pct}%] ${done}/${providers.length} | ` +
        `photos: ${stats.photosUploaded} | ` +
        `DB: ${stats.dbUpdated} | ` +
        `API: ${stats.googleApiCalls} (~$${estimatedCost}) | ` +
        `${rate}/s | ETA ${eta}m | ${elapsed}s   `
    );
  }

  const progressInterval = setInterval(printProgress, 1000);

  async function worker() {
    while (cursor < providers.length) {
      const idx = cursor++;
      if (idx >= providers.length) break;
      await migrateProvider(providers[idx]);

      // Checkpoint every 500 providers (any worker can trigger it)
      if ((stats.processed + stats.noPhotos) % 500 === 0 && stats.processed > 0) {
        saveCheckpoint(idx);
      }
    }
  }

  // Launch worker pool
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  clearInterval(progressInterval);
  printProgress();
  console.log(); // newline after progress
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(70));
  console.log("  Provider Image Migration: cdn-api.olera.care → Cloudflare R2");
  console.log("=".repeat(70));
  console.log(`  Mode:        ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`  Concurrency: ${CONCURRENCY} workers`);
  console.log(`  Photos/prov: ${MAX_PHOTOS_PER_PROVIDER}`);
  console.log(`  R2 bucket:   ${R2_BUCKET}`);
  console.log(`  R2 URL:      ${R2_PUBLIC_URL}`);
  console.log();

  // Resume from checkpoint if requested
  let resumeFromIdx = 0;
  if (RESUME) {
    const checkpoint = loadCheckpoint();
    if (checkpoint) {
      resumeFromIdx = checkpoint.processedIndex + 1;
      Object.assign(stats, checkpoint.stats);
      console.log(
        `  Resuming from index ${resumeFromIdx} (${checkpoint.stats.processed} processed)`
      );
    } else {
      console.log("  No checkpoint found, starting from beginning");
    }
  }

  // Query providers with dead CDN URLs
  console.log("\n  Fetching providers with dead CDN URLs...");

  let allProviders = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("olera-providers")
      .select("provider_id, place_id, provider_images, provider_logo")
      .like("provider_images", "%cdn-api.olera.care%")
      .not("deleted", "is", true)
      .order("provider_id")
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error(`  Supabase query error: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    allProviders.push(...data);
    offset += PAGE;
    if (data.length < PAGE) break;
  }

  stats.totalProviders = allProviders.length;
  const withPlaceId = allProviders.filter((p) => p.place_id);
  console.log(
    `  Found ${allProviders.length} providers (${withPlaceId.length} with place_id)`
  );

  // Apply offset/limit
  let providers = withPlaceId;
  if (resumeFromIdx > 0) {
    providers = providers.slice(resumeFromIdx);
  } else if (CLI_OFFSET > 0) {
    providers = providers.slice(CLI_OFFSET);
  }
  if (CLI_LIMIT < Infinity) {
    providers = providers.slice(0, CLI_LIMIT);
  }

  console.log(`  Processing ${providers.length} providers this run\n`);

  if (DRY_RUN) {
    // Cost: 1 Place Details ($0.005) + 2 Photo Media ($0.007 each) = $0.019/provider
    const estimatedCost = (providers.length * 0.019).toFixed(2);
    const estimatedTime = ((providers.length * 3) / 30 / 60).toFixed(1); // 3 calls/prov, 30 QPS
    console.log(`  Estimated Google API calls: ~${providers.length * 3}`);
    console.log(`  Estimated cost:  ~$${estimatedCost}`);
    console.log(`  Estimated time:  ~${estimatedTime} min (at ${CONCURRENCY} workers)`);
    console.log("  (Dry run — no actual API calls or uploads made)");
    return;
  }

  // Process with concurrent workers
  await processWithWorkers(providers);

  // Final report
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n" + "=".repeat(70));
  console.log("  Migration Complete");
  console.log("=".repeat(70));
  console.log(`  Time:              ${elapsed} min`);
  console.log(`  Total providers:   ${stats.totalProviders}`);
  console.log(`  Processed:         ${stats.processed}`);
  console.log(`  Photos uploaded:   ${stats.photosUploaded}`);
  console.log(`  DB rows updated:   ${stats.dbUpdated}`);
  console.log(`  No place_id:       ${stats.noPlaceId}`);
  console.log(`  No photos found:   ${stats.noPhotos}`);
  console.log(`  Download failed:   ${stats.downloadFailed}`);
  console.log(`  Upload failed:     ${stats.uploadFailed}`);
  console.log(`  Errors:            ${stats.errors}`);
  console.log(`  Already migrated:  ${stats.skippedAlreadyMigrated}`);
  console.log(`  Google API calls:  ${stats.googleApiCalls}`);
  console.log();
  console.log(
    "  Next step: run classify-provider-images.mjs to pick hero images"
  );
  console.log("=".repeat(70));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
