/**
 * Backfill navigator first-step drafts for benefits families the cascade never reached.
 *
 * WHY THIS EXISTS: the navigator draft queue shipped 2026-07-29 and only composes
 * inside a 2-10 day band after intake. Every family who completed the benefits
 * finder before that (and a small tail who aged out of the band) got their results
 * email and then nothing — no first step, ever. As of 2026-08-22 that is 244
 * families, median intake age 50 days. They are not a bug in the live path; the
 * live path now drafts at ~93%. They are a one-time backlog of real people.
 *
 * WHAT IT DOES NOT DO: send. Drafts land in /admin/benefits as `pending`, exactly
 * like the coordinator's, and reach a family only when the care team presses send.
 * That gate is deliberate and this script does not touch it.
 *
 * TWO REPAIRS IT MAKES ALONG THE WAY:
 *   1. The letter's timing language. composeNavigatorDraft used to hardcode the
 *      intake weekday ("you used the finder on Tuesday"), which is true inside the
 *      live band and absurd for a 3-month-old intake. intakeReference() now names
 *      the month past two weeks and tells the model to own the delay.
 *   2. Missing queue rows. The admin queue is assembled from seeker_activity
 *      `benefits_completed` events, and 38 of these families have no such row (the
 *      dropped-insert failure noted in save-results). A draft for them would be
 *      invisible. We insert the missing event from the stored intake timestamp
 *      before composing, so the draft is reviewable.
 *
 * USAGE (dry run first, always):
 *   npx tsx scripts/backfill-benefits-navigator-drafts.ts --limit 3 --show
 *   npx tsx scripts/backfill-benefits-navigator-drafts.ts --limit 10 --apply
 *   npx tsx scripts/backfill-benefits-navigator-drafts.ts --limit 25 --apply --concurrency 3
 *
 * Stage it. The review queue is the bottleneck this backlog feeds into, so adding
 * 244 drafts at once buries the ones already waiting. Batches of 10-25 keep the
 * queue reviewable.
 */

import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

import {
  composeNavigatorDraft,
  pickSnapshot,
  readBenefitsNavigator,
} from "@/lib/family-comms/benefits-navigator.server";
import {
  benefitsCompletedAt,
  readBenefitsCascade,
} from "@/lib/family-comms/benefits-cascade.server";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
// Print full letter bodies in a dry run so the copy can actually be reviewed.
const SHOW = args.includes("--show");
const flag = (name: string, dflt: number): number => {
  const i = args.indexOf(name);
  if (i === -1) return dflt;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) && v > 0 ? v : dflt;
};
const LIMIT = flag("--limit", APPLY ? 10 : 1000);
// LLM calls, one per family. Kept low on purpose: this is a backlog drain with
// no deadline, and a 429 storm costs more time than it saves.
const CONCURRENCY = Math.min(flag("--concurrency", 2), 5);

interface Row {
  id: string;
  account_id: string | null;
  display_name: string | null;
  email: string | null;
  state: string | null;
  city: string | null;
  care_types: string[] | null;
  metadata: Record<string, unknown> | null;
}

function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const sb = db();

  // ── 1. Every family who finished the benefits finder ──
  const fams: Row[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await sb
      .from("business_profiles")
      .select("id, account_id, display_name, email, state, city, care_types, metadata")
      .eq("type", "family")
      .not("metadata->benefits_results", "is", null)
      .range(from, from + 499);
    if (error) throw new Error(`profile fetch: ${error.message}`);
    const rows = (data as Row[]) || [];
    fams.push(...rows);
    if (rows.length < 500) break;
  }

  // ── 2. Narrow to families the cascade never drafted for ──
  const candidates = fams.filter((f) => {
    const meta = (f.metadata || {}) as Record<string, unknown>;
    if (!benefitsCompletedAt(meta)) return false;
    if (readBenefitsNavigator(meta).composed_at) return false;
    if (readBenefitsCascade(meta).first_step_sent_at) return false;
    return !!f.account_id;
  });

  // ── 3. Drop anyone who asked us to stop ──
  const emails = candidates.map((c) => c.email).filter(Boolean) as string[];
  const blocked = new Set<string>();
  for (let i = 0; i < emails.length; i += 200) {
    const { data } = await sb
      .from("do_not_contact")
      .select("email")
      .in("email", emails.slice(i, i + 200));
    (data || []).forEach((r: { email: string | null }) => r.email && blocked.add(r.email.toLowerCase()));
  }
  const reachable = candidates.filter((c) => !(c.email && blocked.has(c.email.toLowerCase())));

  // ── 4. Who is missing the seeker_activity row the admin queue reads? ──
  const ids = reachable.map((c) => c.id);
  const hasActivity = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb
      .from("seeker_activity")
      .select("profile_id")
      .eq("event_type", "benefits_completed")
      .in("profile_id", ids.slice(i, i + 200));
    (data || []).forEach((r: { profile_id: string }) => hasActivity.add(r.profile_id));
  }

  // Oldest first: they have waited longest.
  const queue = reachable
    .sort((a, b) => {
      const at = benefitsCompletedAt(a.metadata as Record<string, unknown>) || "";
      const bt = benefitsCompletedAt(b.metadata as Record<string, unknown>) || "";
      return at.localeCompare(bt);
    })
    .slice(0, LIMIT);

  const missingActivity = reachable.filter((c) => !hasActivity.has(c.id)).length;
  console.log(`${APPLY ? "APPLY" : "DRY RUN"}  concurrency=${CONCURRENCY}`);
  console.log(`  families who completed the finder: ${fams.length}`);
  console.log(`  never drafted for:                 ${candidates.length}`);
  console.log(`  reachable (not do_not_contact):    ${reachable.length}`);
  console.log(`  missing the queue activity row:    ${missingActivity} (repaired as we go)`);
  console.log(`  processing this run:               ${queue.length}\n`);

  const stats = { composed: 0, noPick: 0, failed: 0, activityAdded: 0 };
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const fam = queue[cursor++];
      if (!fam) return;
      const meta = (fam.metadata || {}) as Record<string, unknown>;
      const intakeAt = benefitsCompletedAt(meta)!;
      const ageDays = Math.round((Date.now() - new Date(intakeAt).getTime()) / 86_400_000);
      const label = `${fam.state || "??"} ${fam.id.slice(0, 8)} (${ageDays}d)`;

      try {
        const draft = await composeNavigatorDraft(sb, {
          profileId: fam.id,
          accountId: fam.account_id!,
          displayName: fam.display_name,
          state: fam.state,
          city: fam.city,
          careTypes: fam.care_types || [],
          intakeAt,
          profileMeta: meta,
          factsRow: fam,
        });

        if (!draft) {
          stats.noPick++;
          console.log(`  --  ${label}  no usable first step, skipped`);
          continue;
        }

        if (!APPLY) {
          stats.composed++;
          console.log(`  ok  ${label}  ${draft.pick.shortName}  "${draft.subject}"`);
          if (SHOW) {
            console.log(`\n${draft.body}\n`);
            if (draft.sms) console.log(`      TEXT: ${draft.sms}\n`);
          }
          continue;
        }

        // Make the family visible in /admin/benefits if their completion event
        // was lost. Backdated to the real intake so the queue orders correctly.
        if (!hasActivity.has(fam.id)) {
          const { error: actErr } = await sb.from("seeker_activity").insert({
            profile_id: fam.id,
            event_type: "benefits_completed",
            created_at: intakeAt,
            metadata: {
              state: fam.state,
              match_count:
                (meta.benefits_results as { matchCount?: number } | undefined)?.matchCount ?? null,
              backfilled_at: new Date().toISOString(),
              backfill_reason: "missing completion event (drafts were invisible in the queue)",
            },
          });
          if (actErr) console.log(`  !!  ${label}  activity insert failed: ${actErr.message}`);
          else stats.activityAdded++;
        }

        // Re-read metadata immediately before writing: composition takes seconds
        // and the family may have tapped their plan page mid-compose.
        const { data: fresh } = await sb
          .from("business_profiles")
          .select("metadata")
          .eq("id", fam.id)
          .maybeSingle();
        const freshMeta = ((fresh?.metadata as Record<string, unknown> | null) || meta) as Record<
          string,
          unknown
        >;

        // Someone else drafted while we were composing. Theirs wins; drop ours.
        if (readBenefitsNavigator(freshMeta).composed_at) {
          console.log(`  --  ${label}  drafted concurrently, dropped ours`);
          continue;
        }

        freshMeta.benefits_navigator = {
          status: "pending",
          composed_at: new Date().toISOString(),
          subject: draft.subject,
          body: draft.body,
          sms: draft.sms,
          model: "claude-opus-5",
          pick: pickSnapshot(draft.pick),
          provider_count: draft.providerCount,
          // Distinguishes a backlog drain from a live-band compose, so the queue
          // and any later analysis can tell them apart.
          backfill: true,
          backfill_intake_age_days: ageDays,
        };

        const { error: upErr } = await sb
          .from("business_profiles")
          .update({ metadata: freshMeta })
          .eq("id", fam.id);
        if (upErr) throw new Error(upErr.message);

        stats.composed++;
        console.log(`  ok  ${label}  ${draft.pick.shortName}  "${draft.subject}"`);
      } catch (err) {
        stats.failed++;
        console.log(`  !!  ${label}  ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n${APPLY ? "APPLIED" : "DRY RUN COMPLETE"}`);
  console.log(`  drafts composed:        ${stats.composed}`);
  console.log(`  no usable first step:   ${stats.noPick}`);
  console.log(`  failed:                 ${stats.failed}`);
  if (APPLY) console.log(`  queue rows repaired:    ${stats.activityAdded}`);
  const left = reachable.length - queue.length;
  if (left > 0) console.log(`\n  ${left} still waiting. Re-run with --limit to take the next batch.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
