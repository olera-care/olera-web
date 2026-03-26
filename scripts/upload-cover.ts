/**
 * Upload a local image to Supabase storage and set it as an article's cover_image_url.
 *
 * Usage:
 *   npx tsx scripts/upload-cover.ts <image-path> <article-slug>
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, extname } from "path";

// Parse .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKET = "content-images";

async function main() {
  const imagePath = process.argv[2];
  const slug = process.argv[3];

  if (!imagePath || !slug) {
    console.error("Usage: npx tsx scripts/upload-cover.ts <image-path> <article-slug>");
    process.exit(1);
  }

  // Read image
  const buffer = readFileSync(resolve(imagePath));
  const ext = extname(imagePath).slice(1) || "jpg";
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const contentType = mimeMap[ext.toLowerCase()] || "image/jpeg";

  // Ensure bucket exists
  const { data: buckets } = await db.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    await db.storage.createBucket(BUCKET, { public: true });
  }

  // Upload
  const fileName = `covers/${slug}-${Date.now()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(fileName, buffer, { cacheControl: "3600", upsert: false, contentType });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;
  console.log("Uploaded:", imageUrl);

  // Update article
  const { error: updateError } = await db
    .from("content_articles")
    .update({ cover_image_url: imageUrl })
    .eq("slug", slug);

  if (updateError) {
    console.error("Failed to update article:", updateError.message);
    process.exit(1);
  }

  console.log(`Set cover_image_url for "${slug}"`);
}

main();
