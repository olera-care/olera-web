#!/usr/bin/env tsx
/**
 * Retroactive dedupe of the question backlog.
 *
 * PR #1614 made sendDeferredNotificationsForProvider dedupe by question text,
 * but only lazily — a repeat is stamped the first time a flush walks past it.
 * The standing backlog is 2,040 duplicate rows across the table, and any of
 * them can still be picked up by /api/admin/flush-deferred-backlog before a
 * flush ever reaches them. This sweeps them ahead of time.
 *
 * SUPPRESSES, DOES NOT DELETE. The duplicates are the demand tally: the public
 * provider page counts every row that shares a question text to render "N people
 * asked this" on answered threads and to prioritize the suggested-question chips
 * (app/provider/[slug]/page.tsx → components/providers/QASectionV2.tsx). Deleting
 * the rows would silently zero that out — "14 people asked this" becomes "1", on
 * exactly the questions families care most about. Stamping email_suppressed_at
 * stops the mail while leaving the tally intact, and it is reversible.
 *
 * Newest instance of each (provider, normalized question) survives — it carries
 * the family most likely still waiting.
 *
 * Never touches a duplicate that:
 *   - already had a question_received email sent (the live one-click link in
 *     that inbox points at this row's id)
 *   - carries an answer (that is provider work product)
 *   - has an asker_email (a family we CAN reach, so the repeat is not inert)
 *   - is not status='pending' (archived/rejected/approved are already out of
 *     the send path)
 *
 * Dry-run by DEFAULT. Pass --apply to write.
 *
 * Usage:
 *   npx tsx scripts/suppress-duplicate-questions.ts
 *   npx tsx scripts/suppress-duplicate-questions.ts --apply
 *   npx tsx scripts/suppress-duplicate-questions.ts --apply --provider willow-bend-villas
 *
 * Flags:
 *   --apply              write. Without it: report only.
 *   --provider <slug>    restrict to one provider (spot-check before the full run)
 *   --limit <n>          cap rows touched
 *
 * To reverse: the stamp is metadata.email_suppressed_reason='duplicate_question'
 * plus duplicate_of_question_id, so an unset is a targeted update on those keys.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const ONLY_PROVIDER = arg("--provider") || null;
const LIMIT = parseInt(arg("--limit") || "0", 10) || Infinity;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface QuestionRow {
  id: string;
  provider_id: string | null;
  question: string;
  asker_email: string | null;
  status: string | null;
  answer: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Same collapse rule as lib/admin/send-deferred-notifications.ts — casing and
 * punctuation only. Paraphrases are deliberately NOT matched: a near-miss here
 * would suppress a genuinely different question.
 */
function questionKey(text: string | null | undefined): string {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  // Pull everything — the survivor of a duplicate group may be in any status,
  // so filtering to pending here would mis-pick which row survives.
  const rows: QuestionRow[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    let q = db
      .from("provider_questions")
      .select("id, provider_id, question, asker_email, status, answer, created_at, metadata")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (ONLY_PROVIDER) q = q.eq("provider_id", ONLY_PROVIDER);
    const { data, error } = await q;
    if (error) throw new Error(`provider_questions fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as QuestionRow[]));
    if (data.length < PAGE) break;
    offset += data.length;
  }
  console.log(`\nScanned ${rows.length} questions${ONLY_PROVIDER ? ` for ${ONLY_PROVIDER}` : ""}.`);

  const byProvider = new Map<string, QuestionRow[]>();
  for (const r of rows) {
    const key = r.provider_id ?? "(none)";
    const list = byProvider.get(key) ?? [];
    list.push(r);
    byProvider.set(key, list);
  }

  const targets: Array<{ row: QuestionRow; survivorId: string }> = [];
  const skipped = { emailed: 0, answered: 0, askerEmail: 0, notPending: 0, alreadySuppressed: 0 };

  for (const list of Array.from(byProvider.values())) {
    // Newest first — the first row seen for a text is the survivor.
    const ordered = [...list].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const survivorByKey = new Map<string, string>();
    for (const row of ordered) {
      const key = questionKey(row.question);
      if (!key) continue;
      const survivorId = survivorByKey.get(key);
      if (!survivorId) {
        survivorByKey.set(key, row.id);
        continue;
      }
      const meta = row.metadata ?? {};
      if (meta.email_suppressed_at) { skipped.alreadySuppressed++; continue; }
      if (meta.email_sent_at) { skipped.emailed++; continue; }
      if (row.answer) { skipped.answered++; continue; }
      if (row.asker_email) { skipped.askerEmail++; continue; }
      if (row.status !== "pending") { skipped.notPending++; continue; }
      targets.push({ row, survivorId });
    }
  }

  const capped = Number.isFinite(LIMIT) ? targets.slice(0, LIMIT) : targets;
  const providers = new Set(capped.map((t) => t.row.provider_id));

  console.log(`\nDuplicates safe to suppress: ${targets.length}${
    capped.length !== targets.length ? ` → capped to ${capped.length} via --limit` : ""
  } across ${providers.size} providers`);
  console.log(`Left alone:`);
  console.log(`  already emailed (live one-click link):  ${skipped.emailed}`);
  console.log(`  carries an answer:                      ${skipped.answered}`);
  console.log(`  asker left an email:                    ${skipped.askerEmail}`);
  console.log(`  not pending (archived/rejected/etc):    ${skipped.notPending}`);
  console.log(`  already suppressed:                     ${skipped.alreadySuppressed}`);

  const worst = [...byProvider.entries()]
    .map(([slug, list]) => [slug, capped.filter((t) => t.row.provider_id === slug).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (worst.length) {
    console.log(`\nBiggest backlogs:`);
    for (const [slug, n] of worst) console.log(`  ${String(slug).padEnd(48)} ${n} repeats`);
  }

  if (!APPLY) {
    console.log(`\n[DRY RUN] Nothing written. Re-run with --apply to suppress.\n`);
    return;
  }

  const now = new Date().toISOString();
  let written = 0;
  let failed = 0;
  for (const { row, survivorId } of capped) {
    const meta = { ...(row.metadata ?? {}) };
    meta.email_suppressed_at = now;
    meta.email_suppressed_reason = "duplicate_question";
    meta.duplicate_of_question_id = survivorId;
    meta.suppressed_by = "scripts/suppress-duplicate-questions.ts";
    delete meta.needs_provider_email;
    const { error } = await db.from("provider_questions").update({ metadata: meta }).eq("id", row.id);
    if (error) {
      failed++;
      console.error(`  [error] ${row.id}: ${error.message}`);
    } else {
      written++;
    }
    if (written % 100 === 0 && written > 0) process.stdout.write(`  ${written}/${capped.length}\r`);
  }

  console.log(`\n\nDone. Suppressed ${written}, failed ${failed}.`);
  console.log(`The rows remain in place, so "N people asked this" is unchanged.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
