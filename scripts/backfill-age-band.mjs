#!/usr/bin/env node
/**
 * Backfill: move one-tap age CHIP answers out of metadata.age into
 * metadata.age_band.
 *
 * The age chips ("Under 65", "65 to 74", "75 to 84", "85 or older") used to
 * store fake exact ages (60 / 70 / 80 / 87) in business_profiles.metadata.age,
 * so every reader treated "Under 65" as a literal 60 and passed "Age 60+"
 * rules for people who could be 40. The code now writes metadata.age_band and
 * reads legacy rows correctly (lib/benefits/age.ts), so this backfill is
 * cleanup, not a hotfix: it makes the stored data say what it means.
 *
 * A row is migrated only when it is provably a chip answer:
 *   metadata.age in {60, 70, 80, 87}
 *   AND metadata.quiz_answers.age.via is set
 *   AND String(metadata.quiz_answers.age.answer) === String(metadata.age)
 * Rows with 60/70/80/87 and no chip stamp are left alone (typed ages).
 *
 * For each migrated row:
 *   metadata.age_band = band
 *   metadata.age      = removed
 *   metadata.quiz_answers.age.answer = band (legacy value kept in
 *     quiz_answers.age.legacy_answer)
 *   metadata.age_band_backfilled_at = now
 *
 * Dry run is the default. Nothing is written without --write.
 *
 *   node --env-file=.env.local scripts/backfill-age-band.mjs          # dry run
 *   node --env-file=.env.local scripts/backfill-age-band.mjs --write  # apply
 *
 * Idempotent: a migrated row no longer has metadata.age, so a re-run skips it.
 * Each write re-reads the row first so it can't clobber a concurrent update.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const WRITE = process.argv.includes("--write");
const db = createClient(url, key, { auth: { persistSession: false } });

const LEGACY = { 60: "under_65", 70: "65_74", 80: "75_84", 87: "85_plus" };

function chipBand(meta) {
  if (!meta || typeof meta !== "object") return null;
  const age = typeof meta.age === "number" ? meta.age : typeof meta.age === "string" && /^\d+$/.test(meta.age) ? Number(meta.age) : null;
  if (age == null || !(age in LEGACY)) return null;
  const qa = meta.quiz_answers && meta.quiz_answers.age;
  if (!qa || typeof qa.via !== "string" || !qa.via) return null;
  if (String(qa.answer) !== String(age)) return null;
  return LEGACY[age];
}

// Page every family profile whose metadata.age is one of the chip numbers.
const rows = [];
const pageSize = 1000;
for (let from = 0; ; from += pageSize) {
  const { data, error } = await db
    .from("business_profiles")
    .select("id, type, metadata")
    .in("metadata->>age", ["60", "70", "80", "87"])
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1);
  if (error) {
    console.error("business_profiles fetch failed:", error);
    process.exit(1);
  }
  rows.push(...(data || []));
  if (!data || data.length < pageSize) break;
}

const byBand = { under_65: 0, "65_74": 0, "75_84": 0, "85_plus": 0 };
const byVia = {};
const toMigrate = [];
let untouchedTyped = 0;
const typedByAge = {};
for (const r of rows) {
  const band = chipBand(r.metadata);
  if (!band) {
    untouchedTyped++;
    const a = String(r.metadata?.age);
    typedByAge[a] = (typedByAge[a] || 0) + 1;
    continue;
  }
  byBand[band]++;
  const via = r.metadata.quiz_answers.age.via;
  byVia[via] = (byVia[via] || 0) + 1;
  toMigrate.push({ id: r.id, band });
}

console.log(`Profiles with metadata.age in {60,70,80,87}: ${rows.length}`);
console.log(`  Chip answers to migrate:                  ${toMigrate.length}`);
console.log(`    by band: ${JSON.stringify(byBand)}`);
console.log(`    by source (quiz_answers.age.via): ${JSON.stringify(byVia)}`);
console.log(`  Left alone (no chip stamp, treated as typed): ${untouchedTyped} ${JSON.stringify(typedByAge)}`);

if (!WRITE) {
  console.log("\nDry run. Nothing written. Re-run with --write to apply.");
  process.exit(0);
}

let ok = 0;
let skipped = 0;
let failed = 0;
const now = new Date().toISOString();
for (const { id } of toMigrate) {
  const { data: fresh, error: readErr } = await db.from("business_profiles").select("metadata").eq("id", id).single();
  if (readErr || !fresh) {
    failed++;
    console.error(`read failed ${id}:`, readErr?.message);
    continue;
  }
  const meta = { ...(fresh.metadata || {}) };
  const band = chipBand(meta);
  if (!band) {
    skipped++; // changed since the scan
    continue;
  }
  const quiz = { ...(meta.quiz_answers || {}) };
  quiz.age = { ...quiz.age, answer: band, legacy_answer: String(meta.age) };
  meta.quiz_answers = quiz;
  meta.age_band = band;
  delete meta.age;
  meta.age_band_backfilled_at = now;
  const { error: updErr } = await db.from("business_profiles").update({ metadata: meta }).eq("id", id);
  if (updErr) {
    failed++;
    console.error(`write failed ${id}:`, updErr.message);
  } else {
    ok++;
  }
}
console.log(`\nWrote ${ok}. Skipped (changed since scan) ${skipped}. Failed ${failed}.`);
