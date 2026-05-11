/**
 * GET /api/admin/medjobs/catchment-audit
 *
 * Per-university provider-density report. Surfaces:
 *   - providers_in_catchment   (will become Provider Prospects on activation)
 *   - providers_already_clients
 *   - providers_already_materialized
 *   - providers_in_states     (denominator for the gap analysis)
 *   - empty_cities            (catchment cities with zero matching providers)
 *   - is_active_site          (already activated as a campus row)
 *
 * Used by the catchment-audit admin page and the AddSiteModal preview.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { auditCatchments } from "@/lib/medjobs/catchment-audit";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const db = getServiceClient();
    const rows = await auditCatchments(db);
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[medjobs/catchment-audit]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
