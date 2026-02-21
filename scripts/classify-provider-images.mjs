/**
 * Classify provider images and select hero images.
 *
 * Processes all providers in olera-providers, probes each image URL for
 * metadata (dimensions, content type, accessibility), classifies images
 * as logo vs photo using heuristics, scores quality, and selects the
 * best hero image per provider.
 *
 * With --vision flag, uses Claude vision API to classify ambiguous images
 * (confidence < 0.7) that haven't been admin-overridden.
 *
 * Results are written to provider_image_metadata and hero_image_url is
 * denormalized back to olera-providers for fast reads.
 *
 * Usage:
 *   SUPABASE_KEY=... node scripts/classify-provider-images.mjs --dry-run
 *   SUPABASE_KEY=... node scripts/classify-provider-images.mjs
 *   SUPABASE_KEY=... node scripts/classify-provider-images.mjs --resume
 *   SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/classify-provider-images.mjs --vision
 *   SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/classify-provider-images.mjs --vision-only
 *   SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/classify-provider-images.mjs --vision --vision-batch-size=4
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

// --- Config ---
const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error(
    "Error: Set SUPABASE_KEY env var.\n" +
      "Usage: SUPABASE_KEY=... node scripts/classify-provider-images.mjs --dry-run"
  );
  process.exit(1);
}

const BATCH_SIZE = 500;
const PROBE_CONCURRENCY = 20;
const PROBE_TIMEOUT_MS = 8000;
const DRY_RUN = process.argv.includes("--dry-run");
const RESUME = process.argv.includes("--resume");
const VISION = process.argv.includes("--vision");
const VISION_ONLY = process.argv.includes("--vision-only");
const CHECKPOINT_FILE = "scripts/.classify-checkpoint.json";

// Parse --vision-batch-size=N flag
const VISION_BATCH_SIZE = (() => {
  const arg = process.argv.find((a) => a.startsWith("--vision-batch-size="));
  if (arg) return parseInt(arg.split("=")[1], 10) || 5;
  return 5;
})();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if ((VISION || VISION_ONLY) && !ANTHROPIC_API_KEY) {
  console.error(
    "Error: Set ANTHROPIC_API_KEY env var for vision classification.\n" +
      "Usage: SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/classify-provider-images.mjs --vision"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// --- Stats ---
const stats = {
  providersProcessed: 0,
  imagesProbed: 0,
  imagesClassified: 0,
  heroesSelected: 0,
  inaccessible: 0,
  logos: 0,
  photos: 0,
  unknown: 0,
  errors: 0,
  visionClassified: 0,
  visionBatches: 0,
  visionSkippedOverridden: 0,
};

// --- Checkpoint ---
function loadCheckpoint() {
  if (!RESUME || !existsSync(CHECKPOINT_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8"));
    console.log(`  Resuming from checkpoint: ${data.lastProviderId} (${data.providersProcessed} providers done)`);
    return data;
  } catch {
    return null;
  }
}

function saveCheckpoint(lastProviderId) {
  const data = { lastProviderId, providersProcessed: stats.providersProcessed, timestamp: new Date().toISOString() };
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
}

// --- Image Probing ---

/**
 * Probe an image URL to get dimensions, content type, and accessibility.
 * Uses HEAD request first, falls back to partial GET for dimension detection.
 */
async function probeImage(url) {
  const result = {
    url,
    is_accessible: false,
    width: null,
    height: null,
    file_size_bytes: null,
    content_type: null,
  };

  try {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;

    // HEAD request for content-type and size
    const headResponse = await new Promise((resolve, reject) => {
      const req = client.request(
        parsed,
        { method: "HEAD", timeout: PROBE_TIMEOUT_MS },
        (res) => {
          resolve(res);
          res.resume(); // drain
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("timeout"));
      });
      req.end();
    });

    const status = headResponse.statusCode;
    if (status >= 200 && status < 400) {
      result.is_accessible = true;
      result.content_type = headResponse.headers["content-type"]?.split(";")[0]?.trim() || null;
      const contentLength = headResponse.headers["content-length"];
      if (contentLength) result.file_size_bytes = parseInt(contentLength, 10);
    }

    // For accessible images, try to get dimensions from partial download
    if (result.is_accessible && result.content_type?.startsWith("image/")) {
      const dims = await probeImageDimensions(url, client, parsed);
      if (dims) {
        result.width = dims.width;
        result.height = dims.height;
      }
    }
  } catch {
    result.is_accessible = false;
  }

  return result;
}

/**
 * Download first few KB of an image to extract dimensions from headers.
 * Supports JPEG (SOF markers), PNG (IHDR), and GIF (LSD).
 */
async function probeImageDimensions(url, client, parsed) {
  return new Promise((resolve) => {
    const req = client.request(
      parsed,
      {
        method: "GET",
        timeout: PROBE_TIMEOUT_MS,
        headers: { Range: "bytes=0-16383" }, // First 16KB
      },
      (res) => {
        const chunks = [];
        let totalBytes = 0;

        res.on("data", (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes >= 16384) res.destroy();
        });

        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve(parseDimensions(buf));
        });

        res.on("error", () => resolve(null));
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

function parseDimensions(buf) {
  if (buf.length < 8) return null;

  // PNG: 8-byte signature, then IHDR chunk with width/height at offset 16-23
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length >= 24) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
  }

  // GIF: "GIF87a" or "GIF89a", width at 6-7, height at 8-9 (little-endian)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    if (buf.length >= 10) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
  }

  // JPEG: scan for SOF0/SOF2 markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      // SOF0 (0xC0) or SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      // Skip marker segment
      if (marker === 0xd9) break; // EOI
      if (marker >= 0xd0 && marker <= 0xd7) {
        offset += 2;
        continue;
      }
      const segLen = buf.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  }

  // WebP: "RIFF....WEBP" — VP8 or VP8L headers
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunkType = buf.toString("ascii", 12, 16);
    if (chunkType === "VP8 " && buf.length >= 30) {
      // Lossy VP8: dimensions at 26-29
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
    if (chunkType === "VP8L" && buf.length >= 25) {
      // Lossless VP8L: packed in 4 bytes at offset 21
      const bits = buf.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height };
    }
  }

  return null;
}

// --- Classification ---

/** URL patterns that indicate a logo */
const LOGO_URL_PATTERNS = [
  /\/logo/i,
  /\/brand/i,
  /\/icon/i,
  /logo\./i,
  /favicon/i,
  /_logo/i,
  /-logo/i,
];

/**
 * Classify a single image as logo, photo, or unknown.
 * Returns { image_type, classification_method, classification_confidence }
 */
function classifyImage(imageUrl, sourceField, probeResult) {
  // Rule 1: Source field is provider_logo → it's a logo
  if (sourceField === "provider_logo") {
    return {
      image_type: "logo",
      classification_method: "source_field",
      classification_confidence: 0.9,
    };
  }

  // Rule 2: URL pattern matching
  if (LOGO_URL_PATTERNS.some((pat) => pat.test(imageUrl))) {
    return {
      image_type: "logo",
      classification_method: "url_pattern",
      classification_confidence: 0.8,
    };
  }

  // Rule 3: Dimension-based classification
  if (probeResult.width && probeResult.height) {
    const w = probeResult.width;
    const h = probeResult.height;
    const aspectRatio = w / h;

    // Small + roughly square → likely a logo
    if (w < 300 && h < 300 && aspectRatio > 0.7 && aspectRatio < 1.4) {
      return {
        image_type: "logo",
        classification_method: "dimensions_small_square",
        classification_confidence: 0.7,
      };
    }

    // Large + landscape → likely a photo
    if (w > 600 && aspectRatio > 1.2) {
      return {
        image_type: "photo",
        classification_method: "dimensions_large_landscape",
        classification_confidence: 0.8,
      };
    }

    // Large + any orientation → probably a photo
    if (w > 600 || h > 600) {
      return {
        image_type: "photo",
        classification_method: "dimensions_large",
        classification_confidence: 0.65,
      };
    }
  }

  // Rule 4: If we have no dimensions but it's accessible, guess photo from provider_images
  if (probeResult.is_accessible && sourceField === "provider_images") {
    return {
      image_type: "photo",
      classification_method: "source_field_default",
      classification_confidence: 0.5,
    };
  }

  return {
    image_type: "unknown",
    classification_method: "no_signal",
    classification_confidence: 0.3,
  };
}

/**
 * Score image quality (0.0 - 1.0).
 *
 * Components:
 *   - Resolution (30%): larger is better, capped at 1920px
 *   - Aspect ratio fit for cards (20%): 16:10 is ideal
 *   - Type penalty (40%): photos get full score, logos get 0.1
 *   - Accessibility (10%): accessible gets full score
 */
function scoreQuality(probeResult, classification) {
  let score = 0;

  // Resolution component (30%)
  if (probeResult.width && probeResult.height) {
    const maxDim = Math.max(probeResult.width, probeResult.height);
    const resScore = Math.min(maxDim / 1920, 1.0);
    score += resScore * 0.3;
  }

  // Aspect ratio fit component (20%) — ideal is 16:10 = 1.6
  if (probeResult.width && probeResult.height) {
    const aspect = probeResult.width / probeResult.height;
    const idealAspect = 1.6; // 16:10
    const aspectDiff = Math.abs(aspect - idealAspect);
    const aspectScore = Math.max(0, 1 - aspectDiff / 2);
    score += aspectScore * 0.2;
  }

  // Type penalty component (40%)
  if (classification.image_type === "photo") {
    score += 0.4;
  } else if (classification.image_type === "unknown") {
    score += 0.15;
  } else {
    // logo
    score += 0.04;
  }

  // Accessibility component (10%)
  if (probeResult.is_accessible) {
    score += 0.1;
  }

  return Math.round(score * 1000) / 1000; // 3 decimal places
}

// --- Vision AI Classification ---

/**
 * Download an image and return it as a base64 data URL.
 * Resizes conceptually by only downloading up to ~512KB.
 */
async function fetchImageAsBase64(imageUrl) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(imageUrl);
      const client = parsed.protocol === "https:" ? https : http;

      const req = client.get(parsed, { timeout: 15000 }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 400) {
          resolve(null);
          res.resume();
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        const MAX_BYTES = 512 * 1024; // 512KB max

        res.on("data", (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes >= MAX_BYTES) res.destroy();
        });

        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const contentType = res.headers["content-type"]?.split(";")[0]?.trim() || "image/jpeg";
          const mediaType = contentType.startsWith("image/") ? contentType : "image/jpeg";
          resolve({ base64: buf.toString("base64"), mediaType });
        });

        res.on("error", () => resolve(null));
      });

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Classify a batch of images using Claude vision API.
 * Returns array of { url, type, confidence, description }.
 */
async function classifyWithVision(images) {
  if (!anthropic || images.length === 0) return [];

  // Download images
  const imageData = await Promise.all(
    images.map(async (img) => {
      const data = await fetchImageAsBase64(img.image_url);
      return { ...img, imageData: data };
    })
  );

  // Filter out images that couldn't be downloaded
  const validImages = imageData.filter((img) => img.imageData !== null);
  if (validImages.length === 0) return [];

  // Build message content with images
  const content = [];
  for (let i = 0; i < validImages.length; i++) {
    content.push({
      type: "text",
      text: `Image ${i + 1} (URL: ${validImages[i].image_url}):`,
    });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: validImages[i].imageData.mediaType,
        data: validImages[i].imageData.base64,
      },
    });
  }

  content.push({
    type: "text",
    text: `Classify each of the ${validImages.length} images above for a senior care provider directory.

For each image, respond with a JSON object:
{ "type": "logo" | "photo_good" | "photo_bad", "confidence": 0.0-1.0, "description": "brief description" }

- "logo" = company logo, icon, brand mark, or text-only branding image
- "photo_good" = real photograph of a facility, room, staff, residents, or exterior — clear and good quality
- "photo_bad" = real photograph but blurry, watermarked, very small, low quality, or mostly text overlay

Respond with a JSON array of ${validImages.length} objects, one per image, in the same order. Only output the JSON array, no other text.`,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0]?.text || "[]";
    // Extract JSON array from response (handles markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const results = JSON.parse(jsonMatch[0]);
    stats.visionBatches++;

    return validImages.map((img, i) => {
      const result = results[i];
      if (!result) return null;

      stats.visionClassified++;

      // Map vision types to our schema
      let imageType = "unknown";
      let confidence = result.confidence || 0.5;

      if (result.type === "logo") {
        imageType = "logo";
      } else if (result.type === "photo_good") {
        imageType = "photo";
      } else if (result.type === "photo_bad") {
        imageType = "photo";
        confidence = confidence * 0.3; // Quality penalty for bad photos
      }

      return {
        image_url: img.image_url,
        provider_id: img.provider_id,
        image_type: imageType,
        classification_method: "vision_ai",
        classification_confidence: Math.round(confidence * 1000) / 1000,
        description: result.description || null,
      };
    }).filter(Boolean);
  } catch (err) {
    console.error(`  Vision API error: ${err.message}`);
    stats.errors++;
    return [];
  }
}

// --- Provider Processing ---

/**
 * Parse a provider's images and produce classification records.
 */
function getProviderImageUrls(provider) {
  const urls = [];

  // provider_logo
  if (provider.provider_logo) {
    urls.push({ url: provider.provider_logo.trim(), source_field: "provider_logo" });
  }

  // provider_images (pipe-separated)
  if (provider.provider_images) {
    const images = provider.provider_images
      .split(" | ")
      .map((u) => u.trim())
      .filter(Boolean);
    for (const url of images) {
      // Avoid duplicating the logo
      if (url === provider.provider_logo?.trim()) continue;
      urls.push({ url, source_field: "provider_images" });
    }
  }

  return urls;
}

/**
 * Process a batch of providers: probe, classify, score, select hero.
 * Returns { metadata: [], heroUpdates: [] }
 */
async function processBatch(providers) {
  const metadata = [];
  const heroUpdates = [];

  for (const provider of providers) {
    const imageUrls = getProviderImageUrls(provider);
    if (imageUrls.length === 0) {
      stats.providersProcessed++;
      continue;
    }

    // Probe all images for this provider (limited concurrency)
    const probeResults = await promisePool(
      imageUrls.map(({ url }) => () => probeImage(url)),
      PROBE_CONCURRENCY
    );

    // Classify and score each image
    const records = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const { url, source_field } = imageUrls[i];
      const probe = probeResults[i];
      const classification = classifyImage(url, source_field, probe);
      const quality = scoreQuality(probe, classification);

      stats.imagesProbed++;
      stats.imagesClassified++;
      if (!probe.is_accessible) stats.inaccessible++;
      if (classification.image_type === "logo") stats.logos++;
      else if (classification.image_type === "photo") stats.photos++;
      else stats.unknown++;

      records.push({
        provider_id: provider.provider_id,
        image_url: url,
        source_field,
        image_type: classification.image_type,
        classification_method: classification.classification_method,
        classification_confidence: classification.classification_confidence,
        quality_score: quality,
        width: probe.width,
        height: probe.height,
        file_size_bytes: probe.file_size_bytes,
        content_type: probe.content_type,
        is_accessible: probe.is_accessible,
        is_hero: false,
      });
    }

    // Select hero: highest quality photo, or best available
    const accessible = records.filter((r) => r.is_accessible);
    const photos = accessible.filter((r) => r.image_type === "photo");
    const candidates = photos.length > 0 ? photos : accessible;

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.quality_score - a.quality_score);
      candidates[0].is_hero = true;
      heroUpdates.push({
        provider_id: provider.provider_id,
        hero_image_url: candidates[0].image_url,
      });
      stats.heroesSelected++;
    }

    metadata.push(...records);
    stats.providersProcessed++;
  }

  return { metadata, heroUpdates };
}

// --- Concurrency Helper ---

async function promisePool(taskFns, concurrency) {
  const results = new Array(taskFns.length);
  let index = 0;

  async function worker() {
    while (index < taskFns.length) {
      const i = index++;
      try {
        results[i] = await taskFns[i]();
      } catch (err) {
        results[i] = {
          url: "",
          is_accessible: false,
          width: null,
          height: null,
          file_size_bytes: null,
          content_type: null,
        };
        stats.errors++;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, taskFns.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// --- Database Writes ---

/**
 * Fetch admin-overridden image URLs to protect from script overwrites.
 */
async function getOverriddenImageUrls(providerIds) {
  const overridden = new Set();
  // Batch in groups of 100 provider IDs
  for (let i = 0; i < providerIds.length; i += 100) {
    const batch = providerIds.slice(i, i + 100);
    const { data } = await supabase
      .from("provider_image_metadata")
      .select("provider_id, image_url")
      .in("provider_id", batch)
      .eq("review_status", "admin_overridden");

    if (data) {
      for (const row of data) {
        overridden.add(`${row.provider_id}::${row.image_url}`);
      }
    }
  }
  return overridden;
}

async function writeMetadata(records) {
  if (records.length === 0) return;

  // Get overridden records to protect them
  const providerIds = [...new Set(records.map((r) => r.provider_id))];
  const overridden = await getOverriddenImageUrls(providerIds);

  // Filter out admin-overridden records
  const filteredRecords = records.filter((r) => {
    const key = `${r.provider_id}::${r.image_url}`;
    if (overridden.has(key)) {
      stats.visionSkippedOverridden++;
      return false;
    }
    return true;
  });

  // Upsert in batches
  for (let i = 0; i < filteredRecords.length; i += BATCH_SIZE) {
    const batch = filteredRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("provider_image_metadata")
      .upsert(batch, { onConflict: "provider_id,image_url" });

    if (error) {
      console.error(`  Metadata upsert error (batch ${i}):`, error.message);
      stats.errors++;
    }
  }
}

async function writeHeroUrls(updates) {
  if (updates.length === 0) return;

  const results = await Promise.allSettled(
    updates.map(({ provider_id, hero_image_url }) =>
      supabase
        .from("olera-providers")
        .update({ hero_image_url })
        .eq("provider_id", provider_id)
    )
  );

  let failed = 0;
  for (const r of results) {
    if (r.status === "rejected" || r.value?.error) failed++;
  }
  if (failed > 0) {
    console.error(`  ${failed} hero_image_url updates failed`);
    stats.errors += failed;
  }
}

// --- Vision Pass ---

/**
 * Run vision classification on low-confidence images.
 * Fetches images from provider_image_metadata where confidence < 0.7
 * and review_status != 'admin_overridden'.
 */
async function runVisionPass() {
  console.log("\n=== VISION AI PASS ===");
  console.log(`  Batch size: ${VISION_BATCH_SIZE} images per API call`);
  console.log(`  Model: claude-haiku-4-5-20251001`);
  console.log();

  let offset = 0;
  const PAGE_SIZE = 100;
  let totalProcessed = 0;

  while (true) {
    // Fetch low-confidence, non-overridden, accessible images
    const { data: images, error } = await supabase
      .from("provider_image_metadata")
      .select("id, provider_id, image_url, image_type, classification_confidence")
      .lt("classification_confidence", 0.7)
      .neq("review_status", "admin_overridden")
      .eq("is_accessible", true)
      .order("classification_confidence", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("  Vision query error:", error.message);
      stats.errors++;
      break;
    }

    if (!images || images.length === 0) break;

    // Process in vision batches
    for (let i = 0; i < images.length; i += VISION_BATCH_SIZE) {
      const batch = images.slice(i, i + VISION_BATCH_SIZE);
      const visionResults = await classifyWithVision(batch);

      if (visionResults.length > 0 && !DRY_RUN) {
        // Update metadata with vision results
        for (const result of visionResults) {
          const quality = result.image_type === "photo" ? 0.6 + result.classification_confidence * 0.3 : 0.1;

          const { error: updateError } = await supabase
            .from("provider_image_metadata")
            .update({
              image_type: result.image_type,
              classification_method: "vision_ai",
              classification_confidence: result.classification_confidence,
              quality_score: Math.round(quality * 1000) / 1000,
            })
            .eq("provider_id", result.provider_id)
            .eq("image_url", result.image_url)
            .neq("review_status", "admin_overridden"); // Double-check protection

          if (updateError) {
            console.error(`  Vision update error: ${updateError.message}`);
            stats.errors++;
          }
        }

        // Recalculate heroes for affected providers
        const affectedProviderIds = [...new Set(visionResults.map((r) => r.provider_id))];
        for (const providerId of affectedProviderIds) {
          await recalculateHero(providerId);
        }
      }

      totalProcessed += batch.length;
      process.stdout.write(
        `\r  Processed ${totalProcessed} images | ${stats.visionBatches} API calls | ${stats.visionClassified} classified`
      );
    }

    // If we got fewer than PAGE_SIZE, we're done
    if (images.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log();
  console.log(`  Vision pass complete: ${stats.visionClassified} images reclassified`);
}

/**
 * Recalculate hero image for a provider after vision reclassification.
 */
async function recalculateHero(providerId) {
  const { data: images } = await supabase
    .from("provider_image_metadata")
    .select("image_url, image_type, quality_score, is_accessible")
    .eq("provider_id", providerId)
    .eq("is_accessible", true)
    .order("quality_score", { ascending: false });

  if (!images || images.length === 0) return;

  // Pick best photo, or best overall
  const photos = images.filter((i) => i.image_type === "photo");
  const hero = photos.length > 0 ? photos[0] : images[0];

  // Clear old hero, set new hero
  await supabase
    .from("provider_image_metadata")
    .update({ is_hero: false })
    .eq("provider_id", providerId);

  await supabase
    .from("provider_image_metadata")
    .update({ is_hero: true })
    .eq("provider_id", providerId)
    .eq("image_url", hero.image_url);

  // Update denormalized hero_image_url only if hero is a photo
  if (hero.image_type === "photo") {
    await supabase
      .from("olera-providers")
      .update({ hero_image_url: hero.image_url })
      .eq("provider_id", providerId);
  } else {
    // No good photo — clear hero so frontend falls back to stock
    await supabase
      .from("olera-providers")
      .update({ hero_image_url: null })
      .eq("provider_id", providerId);
  }
}

// --- Main ---

async function main() {
  if (VISION_ONLY) {
    console.log(DRY_RUN ? "=== DRY RUN (vision only) ===" : "=== VISION-ONLY CLASSIFICATION ===");
    console.log();
    await runVisionPass();
    printStats();
    return;
  }

  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE CLASSIFICATION ===");
  console.log();

  const checkpoint = loadCheckpoint();
  let from = 0;
  let lastId = checkpoint?.lastProviderId || null;
  if (checkpoint) {
    stats.providersProcessed = checkpoint.providersProcessed;
  }

  const startTime = Date.now();
  let totalProviders = 0;

  // Count total providers
  {
    const { count, error } = await supabase
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .or("deleted.is.null,deleted.eq.false");

    if (error) {
      console.error("Count query failed:", error.message);
      process.exit(1);
    }
    totalProviders = count || 0;
  }

  console.log(`Total providers: ${totalProviders}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Probe concurrency: ${PROBE_CONCURRENCY}`);
  if (VISION) console.log(`Vision AI: enabled (batch size ${VISION_BATCH_SIZE})`);
  console.log();

  // Process in pages
  let page = 0;
  while (true) {
    let query = supabase
      .from("olera-providers")
      .select("provider_id, provider_logo, provider_images")
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_id", { ascending: true })
      .limit(BATCH_SIZE);

    // Resume from checkpoint
    if (lastId) {
      query = query.gt("provider_id", lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Query error:", error.message);
      stats.errors++;
      break;
    }

    if (!data || data.length === 0) break;

    page++;
    const pageStart = Date.now();

    // Process batch
    const { metadata, heroUpdates } = await processBatch(data);

    // Write results
    if (!DRY_RUN) {
      await writeMetadata(metadata);
      await writeHeroUrls(heroUpdates);
    }

    // Update checkpoint
    lastId = data[data.length - 1].provider_id;
    if (!DRY_RUN) {
      saveCheckpoint(lastId);
    }

    const elapsed = ((Date.now() - pageStart) / 1000).toFixed(1);
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(
      `\r  Page ${page}: ${data.length} providers, ${metadata.length} images | ` +
        `Total: ${stats.providersProcessed}/${totalProviders} providers | ` +
        `${elapsed}s/page, ${totalElapsed}s elapsed`
    );
    console.log();
  }

  // Run vision pass if --vision flag is set
  if (VISION) {
    await runVisionPass();
  }

  printStats();

  if (DRY_RUN) {
    console.log();
    console.log("Dry run complete. Run without --dry-run to execute.");
  }
}

function printStats() {
  const startTime = Date.now();
  console.log();
  console.log("=== Results ===");
  console.log(`  Providers processed: ${stats.providersProcessed}`);
  console.log(`  Images probed:       ${stats.imagesProbed}`);
  console.log(`  Images classified:   ${stats.imagesClassified}`);
  console.log(`    Logos:             ${stats.logos}`);
  console.log(`    Photos:            ${stats.photos}`);
  console.log(`    Unknown:           ${stats.unknown}`);
  console.log(`    Inaccessible:      ${stats.inaccessible}`);
  console.log(`  Heroes selected:     ${stats.heroesSelected}`);
  if (VISION || VISION_ONLY) {
    console.log(`  Vision AI:`);
    console.log(`    Batches sent:      ${stats.visionBatches}`);
    console.log(`    Images classified: ${stats.visionClassified}`);
    console.log(`    Skipped (overridden): ${stats.visionSkippedOverridden}`);
  }
  console.log(`  Errors:              ${stats.errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
