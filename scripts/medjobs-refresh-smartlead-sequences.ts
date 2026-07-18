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
 * This script covers BOTH campaign kinds a MedJobs row can carry:
 *   - COLD outreach campaigns       → `research_data.smartlead.campaign_id`
 *   - ACTIVATION (warm) campaigns   → `research_data.smartlead_activation.campaign_id`
 *
 * It:
 *   1. Queries Supabase for every outreach row carrying either linkage
 *   2. Expands each row into one entry per (campaign_id, kind) and
 *      deduplicates to one push per campaign_id (campaigns are shared
 *      across rows for the same campus + cadence)
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
 *   --kind=<cold|activation>  Only refresh one campaign kind
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
import type { StakeholderType } from "../lib/student-outreach/types";

const APPLY = process.argv.includes("--apply");
const CAMPAIGN_FILTER = process.argv
  .find((a) => a.startsWith("--campaign-id="))
  ?.split("=")[1];
const CAMPUS_FILTER = process.argv
  .find((a) => a.startsWith("--campus="))
  ?.split("=")[1];
const KIND_FILTER = process.argv
  .find((a) => a.startsWith("--kind="))
  ?.split("=")[1] as CampaignKind | undefined;

type CampaignKind = "cold" | "activation";

interface CampaignEntry {
  campaign_id: number;
  campaign_kind: CampaignKind;
  /** student_outreach.kind — "provider" or null (stakeholder rows). */
  outreach_kind: string | null;
  stakeholder_type: string | null;
  campus_slug: string | null;
  campus_name: string | null;
}

interface OutreachRow {
  id: string;
  kind: string | null;
  stakeholder_type: string | null;
  research_data: Record<string, unknown> | null;
  campuses: { slug: string | null; name: string | null } | null;
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
  const select =
    "id, kind, stakeholder_type, research_data, campuses:campus_id (slug, name)";

  // 1. Fetch rows carrying a cold and/or activation campaign linkage. Two
  //    server-side filters (one per linkage path) keep the scan tight; a row
  //    with both linkages shows up in both result sets and contributes two
  //    campaign entries.
  console.log(`Fetching outreach rows with Smartlead campaign linkage…`);
  const [coldRes, actRes] = await Promise.all([
    supabase.from("student_outreach").select(select).not("research_data->smartlead->>campaign_id", "is", null),
    supabase.from("student_outreach").select(select).not("research_data->smartlead_activation->>campaign_id", "is", null),
  ]);
  if (coldRes.error) {
    console.error("Supabase cold query failed:", coldRes.error.message);
    process.exit(1);
  }
  if (actRes.error) {
    console.error("Supabase activation query failed:", actRes.error.message);
    process.exit(1);
  }

  const entries: CampaignEntry[] = [
    ...expand((coldRes.data ?? []) as OutreachRow[], "cold"),
    ...expand((actRes.data ?? []) as OutreachRow[], "activation"),
  ];

  console.log(`Found ${entries.length} campaign linkages across rows.`);

  // 2. Deduplicate to one entry per campaign_id (campaigns are shared across
  //    rows of the same campus + cadence — push the refreshed sequence ONCE).
  const byCampaign = new Map<number, CampaignEntry>();
  for (const e of entries) {
    if (CAMPAIGN_FILTER && String(e.campaign_id) !== CAMPAIGN_FILTER) continue;
    if (CAMPUS_FILTER && e.campus_slug !== CAMPUS_FILTER) continue;
    if (KIND_FILTER && e.campaign_kind !== KIND_FILTER) continue;
    if (!byCampaign.has(e.campaign_id)) byCampaign.set(e.campaign_id, e);
  }

  console.log(`\nUnique campaigns to refresh: ${byCampaign.size}`);
  if (byCampaign.size === 0) {
    console.log("Nothing to do.");
    return;
  }

  // 3. For each campaign: rebuild sequence + push.
  let success = 0;
  let failures = 0;
  for (const [campaignId, entry] of byCampaign) {
    const resolved = resolveCadence(entry);
    if (!resolved) {
      console.log(
        `\n✗ Campaign ${campaignId} (${entry.campaign_kind}) — could not resolve cadence key (kind=${entry.outreach_kind}, stakeholder_type=${entry.stakeholder_type}). Skipping.`,
      );
      failures++;
      continue;
    }
    const adminFirstName = "Logan"; // matches the bridge's default
    const steps = buildEmailSequence(resolved.cadenceKey, {
      adminFirstName,
      campusSlug: entry.campus_slug,
      isPartner: resolved.isPartner,
      stakeholderType: resolved.stakeholderType,
    });
    console.log(
      `\n→ Campaign ${campaignId} (${entry.campus_slug ?? "no-slug"} · ${entry.campaign_kind} · ${resolved.cadenceKey}${resolved.isPartner ? " · partner" : ""})`,
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

/** Expand outreach rows into campaign entries for one linkage kind. */
function expand(rows: OutreachRow[], kind: CampaignKind): CampaignEntry[] {
  const out: CampaignEntry[] = [];
  for (const r of rows) {
    const rd = (r.research_data ?? {}) as Record<string, unknown>;
    const slot = (rd[kind === "cold" ? "smartlead" : "smartlead_activation"] ??
      {}) as Record<string, unknown>;
    const cid = slot.campaign_id;
    if (cid == null) continue;
    const campaignIdNum = Number(cid);
    if (!Number.isFinite(campaignIdNum)) continue;
    out.push({
      campaign_id: campaignIdNum,
      campaign_kind: kind,
      outreach_kind: r.kind,
      stakeholder_type: r.stakeholder_type,
      campus_slug: r.campuses?.slug ?? null,
      campus_name: r.campuses?.name ?? null,
    });
  }
  return out;
}

/** Map a campaign entry to the cadence + audience `buildEmailSequence` needs. */
function resolveCadence(
  e: CampaignEntry,
): { cadenceKey: CadenceKey; isPartner: boolean; stakeholderType: StakeholderType | null } | null {
  const isPartner = e.outreach_kind != null && e.outreach_kind !== "provider";
  if (e.campaign_kind === "activation") {
    // Activation copy branches on isPartner + stakeholder_type, not a
    // per-stakeholder cadence key — the cadence key is always "activation".
    return {
      cadenceKey: "activation",
      isPartner,
      stakeholderType: (e.stakeholder_type as StakeholderType | null) ?? null,
    };
  }
  // Cold cadence: one cadence key per audience.
  if (e.outreach_kind === "provider") return { cadenceKey: "provider", isPartner: false, stakeholderType: null };
  if (e.stakeholder_type === "advisor") return { cadenceKey: "advisor", isPartner: false, stakeholderType: null };
  if (e.stakeholder_type === "dept_head") return { cadenceKey: "dept_head", isPartner: false, stakeholderType: null };
  if (e.stakeholder_type === "professor") return { cadenceKey: "professor", isPartner: false, stakeholderType: null };
  if (e.stakeholder_type === "student_org") return { cadenceKey: "student_org", isPartner: false, stakeholderType: null };
  return null;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
