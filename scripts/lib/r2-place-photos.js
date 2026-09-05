/**
 * r2-place-photos.js
 *
 * One implementation of "get a provider's photos from Google Places and host
 * them on Cloudflare R2", shared by the city pipeline (enrich-city.js,
 * pipeline-batch.js) and the one-off migration (migrate-images-to-r2.mjs).
 *
 * Why this exists: the Places API (New) Photo Media endpoint returns a
 * `photoUri` that is short-lived by design. Storing it in `provider_images`
 * produced 5,889 providers whose photos 403 a few weeks later, which the
 * image optimizer then answered with 502 on every Googlebot fetch. The rule
 * is: never persist a Google photo URL. Download the bytes, optimize, upload
 * to R2, persist the R2 URL. If R2 is not configured, persist nothing.
 *
 * Decision of record (TJ, 2026-09-05): keep auto-sourced Google photos and keep
 * re-hosting them on R2; the licensing question is deferred.
 *
 * Env (from .env.local and the Image Fetcher .env):
 *   GOOGLE_PLACES_API_KEY (or GOOGLE_API_KEY)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME (default provider-images)
 *   R2_PUBLIC_URL  (default https://pub-e9cff84835324ecca87386d81c641a56.r2.dev)
 */

const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const MAX_IMAGE_WIDTH = 800;
const JPEG_QUALITY = 85;
const DEFAULT_MAX_PHOTOS = 2;
const DEFAULT_BUCKET = "provider-images";
const DEFAULT_PUBLIC_URL = "https://pub-e9cff84835324ecca87386d81c641a56.r2.dev";

/** Read KEY=VALUE lines into process.env without overriding what is already set. */
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

/** Load the R2 credentials the migration script has always used. */
function loadR2Env() {
  const home = process.env.HOME || "";
  loadEnvFile(path.join(home, "Desktop/olera-web/.env.local"));
  loadEnvFile(path.join(home, "Desktop/TJ-hq/Olera/Olera Data Analysis Scripts/Image Fetcher/.env"));
}

function r2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME || DEFAULT_BUCKET,
    publicUrl: (process.env.R2_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/$/, ""),
  };
}

function r2Configured() {
  const c = r2Config();
  return Boolean(c.accountId && c.accessKeyId && c.secretAccessKey);
}

let _client = null;
function r2Client() {
  if (_client) return _client;
  const { S3Client } = require("@aws-sdk/client-s3");
  const c = r2Config();
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return _client;
}

async function fetchWithRetry(url, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url);
      if (resp.status === 429 || resp.status >= 500) {
        lastErr = new Error(`HTTP ${resp.status}`);
      } else {
        return resp;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastErr || new Error("fetch failed");
}

/** Place Details (New), photos field only. Returns [] when none. */
async function fetchPlacePhotos(placeId, apiKey) {
  const resp = await fetchWithRetry(
    `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${apiKey}`,
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data.photos) ? data.photos : [];
}

/** Photo Media, following the redirect so we get bytes, never a photoUri. */
async function downloadPhoto(photoName, apiKey) {
  const resp = await fetchWithRetry(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${MAX_IMAGE_WIDTH}&key=${apiKey}`,
  );
  if (!resp.ok) return null;
  return Buffer.from(await resp.arrayBuffer());
}

async function optimizeImage(buffer) {
  const sharp = require("sharp");
  return sharp(buffer)
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

/** Same key scheme the 2026-04 migration used, so re-runs overwrite in place. */
function r2KeyFor(providerId, index) {
  const hash = createHash("md5").update(`${providerId}_photo_${index}`).digest("hex").slice(0, 12);
  return `providers/${providerId}/${hash}.jpg`;
}

async function uploadToR2(buffer, key) {
  const { PutObjectCommand } = require("@aws-sdk/client-s3");
  const c = r2Config();
  await r2Client().send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000",
    }),
  );
  return `${c.publicUrl}/${key}`;
}

/** Prefer landscape photos; the hero slot is wide. */
function rankPhotos(photos) {
  return photos
    .map((p) => ({ ...p, score: (p.widthPx || 0) / Math.max(p.heightPx || 1, 1) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Fetch up to `maxPhotos` Places photos for a provider, host them on R2, and
 * return the public R2 URLs (possibly empty). Never returns a Google URL.
 *
 * Throws only for programmer errors (missing args). Network and upload
 * failures are counted in `stats` when provided and otherwise swallowed, so a
 * pipeline run keeps going.
 */
async function hostPlacePhotosOnR2({ providerId, placeId, apiKey, photos = null, maxPhotos = DEFAULT_MAX_PHOTOS, stats = null }) {
  if (!providerId || !placeId || !apiKey) throw new Error("hostPlacePhotosOnR2: providerId, placeId and apiKey are required");
  if (!r2Configured()) {
    if (stats) stats.r2NotConfigured = (stats.r2NotConfigured || 0) + 1;
    return [];
  }
  const bump = (k) => { if (stats) stats[k] = (stats[k] || 0) + 1; };

  // Callers that already hold a Place Details response can pass its `photos`
  // array and skip the extra Place Details call.
  if (!Array.isArray(photos)) {
    photos = await fetchPlacePhotos(placeId, apiKey);
    bump("googleApiCalls");
  }
  if (photos.length === 0) { bump("noPhotos"); return []; }

  const chosen = rankPhotos(photos).slice(0, maxPhotos);
  const results = await Promise.all(
    chosen.map(async (photo, i) => {
      try {
        const raw = await downloadPhoto(photo.name, apiKey);
        bump("googleApiCalls");
        if (!raw) { bump("downloadFailed"); return null; }
        const optimized = await optimizeImage(raw);
        const url = await uploadToR2(optimized, r2KeyFor(providerId, i));
        bump("photosUploaded");
        return url;
      } catch (e) {
        bump("uploadFailed");
        return null;
      }
    }),
  );
  return results.filter(Boolean);
}

/** Pipe-join for the `provider_images` column. */
function joinProviderImages(urls) {
  return urls.length > 0 ? urls.join(" | ") : null;
}

module.exports = {
  loadR2Env,
  r2Configured,
  hostPlacePhotosOnR2,
  joinProviderImages,
  // exported for the migration script and tests
  fetchPlacePhotos,
  downloadPhoto,
  optimizeImage,
  uploadToR2,
  r2KeyFor,
  rankPhotos,
  MAX_IMAGE_WIDTH,
  DEFAULT_MAX_PHOTOS,
};
