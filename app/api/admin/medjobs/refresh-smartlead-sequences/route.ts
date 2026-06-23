/**
 * POST /api/admin/medjobs/refresh-smartlead-sequences
 *
 * Server-side mirror of `scripts/medjobs-refresh-smartlead-sequences.ts`.
 * Lets an admin re-push the current `lib/student-outreach/templates.ts`
 * copy to all existing Smartlead campaigns WITHOUT running a local
 * terminal command.
 *
 * Why this exists: Smartlead campaigns are stateful. When a campaign is
 * provisioned, `buildEmailSequence` renders the template text and POSTs
 * it to Smartlead's `/campaigns/{id}/sequences` endpoint. The text is
 * then SAVED into the campaign. Updating `templates.ts` only affects
 * NEW campaigns; existing ones retain their original sequence text
 * until we explicitly push an update.
 *
 * Auth: admin-only (uses the existing isAdmin pattern).
 *
 * Usage:
 *   - Dry-run: GET /api/admin/medjobs/refresh-smartlead-sequences
 *     Returns the list of campaigns that would be refreshed.
 *   - Push: POST /api/admin/medjobs/refresh-smartlead-sequences
 *     Pushes the new sequences. Idempotent — saveSequence REPLACES.
 *   - Filter to one campaign:
 *     POST /api/admin/medjobs/refresh-smartlead-sequences?campaign_id=123
 *   - Filter to one campus:
 *     POST /api/admin/medjobs/refresh-smartlead-sequences?campus=ut-austin
 *
 * Returns JSON: { dry_run, refreshed: [...], failed: [...] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { saveSequence } from "@/lib/smartlead";
import { buildEmailSequence } from "@/lib/medjobs/smartlead-bridge";
import type { CadenceKey } from "@/lib/student-outreach/cadence";
import type { StakeholderType } from "@/lib/student-outreach/types";

export const maxDuration = 120; // refreshing many campaigns may take time

interface RefreshLinkage {
  campaign_id: number;
  campus_slug: string | null;
  campus_name: string | null;
  cadence_key: CadenceKey;
  /** Activation only: partner (advisor/dept_head/student_org) vs provider copy. */
  is_partner?: boolean;
  /** Activation only: drives per-type partner activation copy. */
  stakeholder_type?: StakeholderType | null;
  sample_outreach_id: string;
}

interface RefreshResult {
  campaign_id: number;
  campus_slug: string | null;
  cadence_key: CadenceKey;
  status: "pushed" | "failed" | "skipped";
  error?: string;
  subjects?: string[];
}

async function run(request: Request, apply: boolean): Promise<Response> {
  // ── Admin auth ───────────────────────────────────────────────────────
  const supaUser = await createClient();
  const {
    data: { user },
  } = await supaUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const admin = await isAdmin(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // ── Service-role client for cross-table queries ─────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const smartleadKey = process.env.SMARTLEAD_API_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration error (Supabase env)" },
      { status: 500 },
    );
  }
  if (apply && !smartleadKey) {
    return NextResponse.json(
      { error: "SMARTLEAD_API_KEY required when pushing" },
      { status: 500 },
    );
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Optional filters ─────────────────────────────────────────────────
  const url = new URL(request.url);
  const campaignFilter = url.searchParams.get("campaign_id");
  const campusFilter = url.searchParams.get("campus");

  // ── 1. Collect outreach rows with Smartlead linkage (cold + activation) ─
  type OutreachRow = {
    id: string;
    campus_id: string | null;
    kind: string | null;
    stakeholder_type: string | null;
    research_data: Record<string, unknown> | null;
    campuses: { slug: string | null; name: string | null } | null;
  };
  const SELECT =
    "id, campus_id, kind, stakeholder_type, research_data, campuses:campus_id (slug, name)";

  // Cold campaigns live at research_data.smartlead.campaign_id; activation
  // campaigns at research_data.smartlead_activation.campaign_id. Two queries so
  // BOTH cold and activation campaigns get the refreshed copy/links/signatures.
  const { data: coldRows, error: coldErr } = await supabase
    .from("student_outreach")
    .select(SELECT)
    .not("research_data->smartlead->>campaign_id", "is", null);
  if (coldErr) {
    return NextResponse.json(
      { error: `Supabase query failed (cold): ${coldErr.message}` },
      { status: 500 },
    );
  }
  const { data: actRows, error: actErr } = await supabase
    .from("student_outreach")
    .select(SELECT)
    .not("research_data->smartlead_activation->>campaign_id", "is", null);
  if (actErr) {
    return NextResponse.json(
      { error: `Supabase query failed (activation): ${actErr.message}` },
      { status: 500 },
    );
  }

  // ── 2. Deduplicate to one entry per Smartlead campaign_id ───────────
  const byCampaign = new Map<number, RefreshLinkage>();
  const matchesFilters = (cid: number, slug: string | null) =>
    (!campaignFilter || String(cid) === campaignFilter) &&
    (!campusFilter || slug === campusFilter);

  // Cold campaigns — one cadence per kind/stakeholder_type.
  for (const r of (((coldRows ?? []) as unknown) as OutreachRow[])) {
    const smartlead = (r.research_data?.smartlead ?? {}) as Record<string, unknown>;
    const cid = Number(smartlead.campaign_id);
    if (!Number.isFinite(cid)) continue;
    if (!matchesFilters(cid, r.campuses?.slug ?? null)) continue;
    if (byCampaign.has(cid)) continue;

    const cadenceKey = resolveCadenceKey(r.kind, r.stakeholder_type);
    if (!cadenceKey) continue;

    byCampaign.set(cid, {
      campaign_id: cid,
      campus_slug: r.campuses?.slug ?? null,
      campus_name: r.campuses?.name ?? null,
      cadence_key: cadenceKey,
      sample_outreach_id: r.id,
    });
  }

  // Activation campaigns — always the "activation" cadence; partner vs provider
  // copy is driven by is_partner + stakeholder_type.
  for (const r of (((actRows ?? []) as unknown) as OutreachRow[])) {
    const act = (r.research_data?.smartlead_activation ?? {}) as Record<string, unknown>;
    const cid = Number(act.campaign_id);
    if (!Number.isFinite(cid)) continue;
    if (!matchesFilters(cid, r.campuses?.slug ?? null)) continue;
    if (byCampaign.has(cid)) continue;

    byCampaign.set(cid, {
      campaign_id: cid,
      campus_slug: r.campuses?.slug ?? null,
      campus_name: r.campuses?.name ?? null,
      cadence_key: "activation",
      is_partner: r.kind !== "provider",
      stakeholder_type: (r.stakeholder_type as StakeholderType | null) ?? null,
      sample_outreach_id: r.id,
    });
  }

  // ── 3. For each campaign: render sequence + (optionally) push ───────
  const refreshed: RefreshResult[] = [];
  const failed: RefreshResult[] = [];

  for (const linkage of byCampaign.values()) {
    const steps = buildEmailSequence(linkage.cadence_key, {
      adminFirstName: "Logan",
      campusSlug: linkage.campus_slug,
      isPartner: linkage.is_partner,
      stakeholderType: linkage.stakeholder_type,
    });
    const subjects = steps.map((s) => s.subject);

    if (!apply) {
      refreshed.push({
        campaign_id: linkage.campaign_id,
        campus_slug: linkage.campus_slug,
        cadence_key: linkage.cadence_key,
        status: "skipped",
        subjects,
      });
      continue;
    }

    const result = await saveSequence(linkage.campaign_id, steps);
    if (result.ok) {
      refreshed.push({
        campaign_id: linkage.campaign_id,
        campus_slug: linkage.campus_slug,
        cadence_key: linkage.cadence_key,
        status: "pushed",
        subjects,
      });
    } else {
      failed.push({
        campaign_id: linkage.campaign_id,
        campus_slug: linkage.campus_slug,
        cadence_key: linkage.cadence_key,
        status: "failed",
        error: result.error,
      });
    }
  }

  return NextResponse.json({
    dry_run: !apply,
    total_campaigns: byCampaign.size,
    refreshed,
    failed,
  });
}

export async function GET(request: Request) {
  return run(request, false);
}

export async function POST(request: Request) {
  return run(request, true);
}

function resolveCadenceKey(
  kind: string | null,
  stakeholderType: string | null,
): CadenceKey | null {
  if (kind === "provider") return "provider";
  if (stakeholderType === "advisor") return "advisor";
  if (stakeholderType === "dept_head") return "dept_head";
  if (stakeholderType === "professor") return "professor";
  if (stakeholderType === "student_org") return "student_org";
  return null;
}
