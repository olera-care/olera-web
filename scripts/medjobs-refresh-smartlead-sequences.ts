/**
 * scripts/medjobs-refresh-smartlead-sequences.ts
 *
 * Push the current `lib/student-outreach/templates.ts` copy to all existing
 * Smartlead campaigns, replacing whatever was baked in when each campaign
 * was first provisioned.
 *
 * Why this exists: Smartlead campaigns are STATEFUL. When a campaign is
 * provisioned, `buildEmailSequence` renders the template text and pushes
 * it to Smartlead's `/campaigns/{id}/sequences` endpoint. The text is then
 * SAVED into the campaign. Updating `templates.ts` in code only affects
 * NEW campaigns created after the update — existing campaigns retain their
 * original sequence text and continue sending the old copy.
 *
 * This script:
 *   1. Queries Supabase for every (campus_id, kind/stakeholder_type, smartlead_campaign_id)
 *      tuple from outreach rows where the campaign linkage is set
 *   2. Deduplicates to one entry per campaign_id (campaigns are shared
 *      across rows for the same campus + kind)
 *   3. For each campaign: rebuilds the sequence using current templates +
 *      pushes via `saveSequence(campaignId, steps)`
 *
 * Run with:
 *   npx tsx scripts/medjobs-refresh-smartlead-sequences.ts            # dry-run (default)
 *   npx tsx scripts/medjobs-refresh-smartlead-sequences.ts --apply    # actually pushes
 *
 * Required env (loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SMARTLEAD_API_KEY
 *
 * Optional flags:
 *   --campaign-id=<n>   Only refresh a specific campaign id
 *   --campus=<slug>     Only refresh campaigns for one campus
 *
 * The script is idempotent — re-running it pushes the same sequence
 * again. Smartlead's saveSequence REPLACES the sequence, so this
 * doesn't append.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { saveSequence } from "../lib/smartlead";
import { buildEmailSequence } from "../lib/medjobs/smartlead-bridge";
import type { CadenceKey } from "../lib/student-outreach/cadence";

const APPLY = process.argv.includes("--apply");
const CAMPAIGN_FILTER = process.argv
  .find((a) => a.startsWith("--campaign-id="))
  ?.split("=")[1];
const CAMPUS_FILTER = process.argv
  .find((a) => a.startsWith("--campus="))
  ?.split("=")[1];

interface OutreachLinkage {
  outreach_id: string;
  campus_id: string | null;
  campus_slug: string | null;
  campus_name: string | null;
  kind: string | null;
  stakeholder_type: string | null;
  smartlead_campaign_id: number;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const smartleadKey = process.env.SMARTLEAD_API_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!smartleadKey && APPLY) {
    console.error("SMARTLEAD_API_KEY required when --apply is set");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // 1. Fetch all outreach rows with a smartlead campaign linkage.
  console.log(`Fetching outreach rows with Smartlead campaign linkage…`);
  const { data: rows, error } = await supabase
    .from("student_outreach")
    .select(
      "id, campus_id, kind, stakeholder_type, research_data, campuses:campus_id (slug, name)",
    )
    .not("research_data->smartlead->>campaign_id", "is", null);

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exit(1);
  }

  const linkages: OutreachLinkage[] = [];
  for (const r of (rows ?? []) as Array<{
    id: string;
    campus_id: string | null;
    kind: string | null;
    stakeholder_type: string | null;
    research_data: Record<string, unknown> | null;
    campuses: { slug: string | null; name: string | null } | null;
  }>) {
    const smartlead = (r.research_data?.smartlead ?? {}) as Record<string, unknown>;
    const cid = smartlead.campaign_id;
    if (cid == null) continue;
    const campaignIdNum = Number(cid);
    if (!Number.isFinite(campaignIdNum)) continue;
    linkages.push({
      outreach_id: r.id,
      campus_id: r.campus_id,
      campus_slug: r.campuses?.slug ?? null,
      campus_name: r.campuses?.name ?? null,
      kind: r.kind,
      stakeholder_type: r.stakeholder_type,
      smartlead_campaign_id: campaignIdNum,
    });
  }

  console.log(`Found ${linkages.length} outreach rows with linkage.`);

  // 2. Deduplicate to one entry per campaign_id. Campaigns are shared
  // across rows of the same (campus, kind) — we only need to push the
  // refreshed sequence ONCE per campaign.
  const byCampaign = new Map<number, OutreachLinkage>();
  for (const l of linkages) {
    if (CAMPAIGN_FILTER && String(l.smartlead_campaign_id) !== CAMPAIGN_FILTER) {
      continue;
    }
    if (CAMPUS_FILTER && l.campus_slug !== CAMPUS_FILTER) {
      continue;
    }
    if (!byCampaign.has(l.smartlead_campaign_id)) {
      byCampaign.set(l.smartlead_campaign_id, l);
    }
  }

  console.log(`\nUnique campaigns to refresh: ${byCampaign.size}`);
  if (byCampaign.size === 0) {
    console.log("Nothing to do.");
    return;
  }

  // 3. For each campaign: rebuild sequence + push.
  let success = 0;
  let failures = 0;
  for (const [campaignId, linkage] of byCampaign) {
    const cadenceKey = resolveCadenceKey(linkage);
    if (!cadenceKey) {
      console.log(
        `\n✗ Campaign ${campaignId} — could not resolve cadence key (kind=${linkage.kind}, stakeholder_type=${linkage.stakeholder_type}). Skipping.`,
      );
      failures++;
      continue;
    }
    const adminFirstName = "Logan"; // matches the bridge's default
    const steps = buildEmailSequence(cadenceKey, {
      adminFirstName,
      campusSlug: linkage.campus_slug,
    });
    console.log(
      `\n→ Campaign ${campaignId} (${linkage.campus_slug ?? "no-slug"} · ${cadenceKey})`,
    );
    console.log(`  Steps to push: ${steps.length}`);
    console.log(`  Subjects:`);
    for (const s of steps) console.log(`    - "${s.subject}"`);

    if (!APPLY) continue;

    const result = await saveSequence(campaignId, steps);
    if (result.ok) {
      console.log(`  ✓ Sequence pushed`);
      success++;
    } else {
      console.log(`  ✗ Push failed: ${result.error}`);
      failures++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  if (APPLY) {
    console.log(`Refresh complete. ✓ ${success} pushed, ✗ ${failures} failed.`);
  } else {
    console.log(
      `DRY RUN — re-run with --apply to actually push the new sequences.`,
    );
    console.log(`Would push ${byCampaign.size} campaigns.`);
  }
}

function resolveCadenceKey(l: OutreachLinkage): CadenceKey | null {
  if (l.kind === "provider") return "provider";
  if (l.stakeholder_type === "advisor") return "advisor";
  if (l.stakeholder_type === "dept_head") return "dept_head";
  if (l.stakeholder_type === "professor") return "professor";
  if (l.stakeholder_type === "student_org") return "student_org";
  return null;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
