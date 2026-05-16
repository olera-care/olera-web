#!/usr/bin/env node

/**
 * Backfill email_log.provider_id for weekly_analytics_digest sends.
 *
 * The weekly digest never passed `providerId` to sendEmail, so every
 * weekly_analytics_digest email_log row has provider_id = NULL. The admin
 * Provider Comms Funnel joins email_log <-> provider_activity on provider_id,
 * so the entire weekly_digest column (answered / edited / signed-in) reads
 * zero even though providers are answering. The forward fix stamps the
 * digest loop's `providerId`, which for the question cohort is the provider
 * slug -- the same value the answer endpoint writes to
 * provider_activity.provider_id (verified: 44/44 recent answerers resolve by
 * slug, 42 via olera-providers.slug + 2 via business_profiles.slug).
 *
 * Resolution is email-driven and table-direct (NOT reconstructed from the
 * open-questions audience -- that filter excludes providers who already
 * answered, i.e. exactly the converters we most need to attribute):
 *   1. Distinct recipients of NULL-provider_id weekly_analytics_digest rows.
 *   2. lower(email) -> slug via olera-providers.email (primary; matches
 *      provider_activity.provider_id), then business_profiles.email (claimed).
 *   3. Stamp provider_id = resolved slug on each row.
 *
 * Usage:
 *   node scripts/backfill-digest-email-log-provider-id.js          # dry run
 *   node scripts/backfill-digest-email-log-provider-id.js --apply  # write
 *   node scripts/backfill-digest-email-log-provider-id.js --days 30  # email_log lookback (default 14)
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);
const dryRun = !process.argv.includes("--apply");
const daysArgIdx = process.argv.indexOf("--days");
const lookbackDays = daysArgIdx !== -1 ? parseInt(process.argv[daysArgIdx + 1], 10) || 14 : 14;
const CHUNK = 200;

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

async function pageAll(buildQuery) {
  const rows = [];
  let fromRow = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await buildQuery().range(fromRow, fromRow + PAGE - 1);
    if (error) {
      console.error("query failed:", error);
      process.exit(1);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
    fromRow += PAGE;
  }
  return rows;
}

async function main() {
  console.log(`\n=== Backfill weekly_analytics_digest email_log.provider_id ${dryRun ? "(DRY RUN)" : "(APPLYING)"} ===`);
  console.log(`email_log lookback: last ${lookbackDays} days\n`);

  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. NULL-provider_id weekly_analytics_digest email_log rows ──
  const rows = await pageAll(() =>
    db
      .from("email_log")
      .select("id, recipient, first_clicked_at")
      .eq("email_type", "weekly_analytics_digest")
      .is("provider_id", null)
      .gte("created_at", sinceIso),
  );
  console.log(`NULL-provider_id weekly_analytics_digest rows (last ${lookbackDays}d): ${rows.length}`);

  const distinctRecipients = [
    ...new Set(rows.map((r) => r.recipient).filter((e) => typeof e === "string" && e.length > 0)),
  ];
  console.log(`Distinct recipient emails: ${distinctRecipients.length}`);

  // ── 2. Resolve lower(email) -> slug, table-direct ──
  // olera-providers first: its slug == provider_activity.provider_id for the
  // unclaimed bulk. business_profiles fills in claimed providers. First
  // writer wins; a shared inbox across providers (rare) keeps the first.
  const emailToSlug = new Map();
  const collidingEmails = new Set(); // distinct shared-inbox recipients
  const addMapping = (email, slug) => {
    if (!email || !slug) return;
    const k = String(email).toLowerCase();
    if (emailToSlug.has(k)) {
      if (emailToSlug.get(k) !== slug) collidingEmails.add(k);
      return;
    }
    emailToSlug.set(k, slug);
  };

  for (const c of chunk(distinctRecipients, CHUNK)) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, slug, email")
      .in("email", c)
      .not("deleted", "is", true);
    if (error) {
      console.error("olera-providers query failed:", error);
      process.exit(1);
    }
    for (const ip of data ?? []) {
      if (ip.email) addMapping(ip.email, ip.slug ?? ip.provider_id);
    }
  }
  const unresolvedAfterIos = distinctRecipients.filter(
    (e) => !emailToSlug.has(e.toLowerCase()),
  );
  for (const c of chunk(unresolvedAfterIos, CHUNK)) {
    const { data, error } = await db
      .from("business_profiles")
      .select("slug, source_provider_id, email")
      .in("email", c)
      .in("type", ["organization", "caregiver"]);
    if (error) {
      console.error("business_profiles query failed:", error);
      process.exit(1);
    }
    for (const b of data ?? []) {
      if (b.email) addMapping(b.email, b.slug ?? b.source_provider_id);
    }
  }
  console.log(
    `Resolved email -> slug: ${emailToSlug.size} ` +
      `(${collidingEmails.size} are shared chain inboxes -> arbitrary-but-stable sibling slug; ` +
      `conservative undercount within those chains, never misattribution)`,
  );

  // ── 3. Match + project funnel impact ──
  const updates = [];
  let unmatched = 0;
  let clickedTotal = 0;
  let clickedMatched = 0;
  for (const r of rows) {
    const key = (r.recipient || "").toLowerCase();
    const slug = emailToSlug.get(key);
    if (r.first_clicked_at) clickedTotal += 1;
    if (slug) {
      updates.push({ id: r.id, provider_id: slug });
      if (r.first_clicked_at) clickedMatched += 1;
    } else {
      unmatched += 1;
    }
  }

  // Cross-check: of the distinct matched provider_ids, how many actually
  // answered in the window (provider_activity.question_responded) -- the
  // clicked∩answered the comms funnel can now attribute to the digest.
  const matchedPids = new Set(updates.map((u) => u.provider_id));
  const answerers = new Set();
  const ansRows = await pageAll(() =>
    db
      .from("provider_activity")
      .select("provider_id")
      .eq("event_type", "question_responded")
      .gte("created_at", sinceIso),
  );
  for (const a of ansRows) if (a.provider_id) answerers.add(String(a.provider_id));
  let projectedAnsweredAttributable = 0;
  for (const pid of matchedPids) if (answerers.has(pid)) projectedAnsweredAttributable += 1;

  console.log("\n── Result ──");
  console.log(`  Rows to update:        ${updates.length} / ${rows.length}`);
  console.log(`  Unmatched (no email->provider): ${unmatched}`);
  console.log(`  Clicked rows:          ${clickedTotal} (matched & attributable: ${clickedMatched})`);
  console.log(`  Distinct matched provider_ids: ${matchedPids.size}`);
  console.log(`  Distinct answerers in window:  ${answerers.size}`);
  console.log(`  ...attributable after backfill: ${projectedAnsweredAttributable}  <- weekly_digest "Answered"`);
  console.log("\n  Sample (first 5):");
  for (const u of updates.slice(0, 5)) {
    const rec = rows.find((x) => x.id === u.id)?.recipient;
    console.log(`    ${rec}  ->  ${u.provider_id}`);
  }

  if (dryRun) {
    console.log(`\nDRY RUN — no writes. Re-run with --apply to update ${updates.length} rows.\n`);
    return;
  }

  console.log(`\nApplying ${updates.length} updates...`);
  let done = 0;
  for (const c of chunk(updates, 100)) {
    await Promise.all(
      c.map((u) => db.from("email_log").update({ provider_id: u.provider_id }).eq("id", u.id)),
    );
    done += c.length;
    process.stdout.write(`\r  ${done}/${updates.length}`);
  }
  console.log(`\nDone. Updated ${done} email_log rows.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
