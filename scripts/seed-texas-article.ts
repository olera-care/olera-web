/**
 * Seed a draft Texas article into content_articles.
 *
 * Usage:
 *   npx tsx scripts/seed-texas-article.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually (no dotenv dependency)
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const slug = "how-to-get-paid-as-a-caregiver-in-texas";

  // Check if article already exists
  const { data: existing } = await db
    .from("content_articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    console.log(`Article with slug "${slug}" already exists (id: ${existing.id}). Skipping.`);
    return;
  }

  const { data, error } = await db
    .from("content_articles")
    .insert({
      slug,
      title: "How to Get Paid as a Caregiver in Texas in 2026",
      status: "draft",
      section: "caregiver-support",
      category: "guide",
      meta_title: "How to Get Paid as a Caregiver in Texas 2026 — STAR+PLUS Guide",
      meta_description:
        "Yes, family members can get paid to care for a loved one in Texas through Medicaid. Learn how much you can earn, who qualifies, and how to apply in 2026.",
      canonical_url: "https://olera.care/texas/how-to-get-paid-as-a-caregiver-in-texas",
      care_types: ["home-health"],
      tags: ["texas", "medicaid", "paid-caregiving", "star-plus"],
      author_name: "Olera Team",
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Failed to insert article:", error.message);
    process.exit(1);
  }

  console.log(`Created draft article:`);
  console.log(`  ID:   ${data.id}`);
  console.log(`  Slug: ${data.slug}`);
  console.log(`  URL:  /texas/${data.slug}`);
}

main();
