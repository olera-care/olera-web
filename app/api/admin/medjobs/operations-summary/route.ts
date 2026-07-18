import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { countProspectGeneration } from "@/lib/medjobs/prospect-counts";
import type { StakeholderType } from "@/lib/student-outreach/types";

/**
 * GET /api/admin/medjobs/operations-summary
 *
 * Current-state counts + partner subtype breakdowns for the Operations
 * dashboard's pipeline/roster tiles. Time-series (sparklines + deltas) come
 * from /api/admin/student-outreach/stats; current roster totals for Clients
 * and Candidates come from their own endpoints (so the Operations numbers
 * match the pages they link to). This endpoint covers only what needs
 * server-side grouping:
 *   - provider_prospects: virtual catchment total (no history; count-only tile)
 *   - partner_prospects:  RESEARCH_STATUSES stakeholders (kind != provider)
 *   - partners:           active_partner stakeholders (kind != provider)
 */
const RESEARCH_STATUSES = ["prospect", "researched"];
const SUBTYPES: StakeholderType[] = ["student_org", "advisor", "professor", "dept_head"];

type Breakdown = { total: number; by_type: Record<StakeholderType, number> };

function emptyByType(): Record<StakeholderType, number> {
  return { student_org: 0, advisor: 0, professor: 0, dept_head: 0 };
}

function tally(rows: Array<{ stakeholder_type: string | null }>): Breakdown {
  const by_type = emptyByType();
  let total = 0;
  for (const r of rows) {
    total += 1;
    const t = r.stakeholder_type as StakeholderType | null;
    if (t && SUBTYPES.includes(t)) by_type[t] += 1;
  }
  return { total, by_type };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    const [prospectRowsRes, partnerRowsRes, prospectGen] = await Promise.all([
      db
        .from("student_outreach")
        .select("stakeholder_type")
        .in("status", RESEARCH_STATUSES)
        .neq("kind", "provider"),
      db
        .from("student_outreach")
        .select("stakeholder_type")
        .eq("status", "active_partner")
        .neq("kind", "provider"),
      countProspectGeneration(db),
    ]);

    const partner_prospects = tally(
      (prospectRowsRes.data ?? []) as Array<{ stakeholder_type: string | null }>,
    );
    const partners = tally(
      (partnerRowsRes.data ?? []) as Array<{ stakeholder_type: string | null }>,
    );

    return NextResponse.json({
      provider_prospects: prospectGen.providerProspects.total,
      partner_prospects,
      partners,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/operations-summary] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
