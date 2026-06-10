/**
 * GET /api/admin/medjobs/partner-portal-link?outreach_id=...
 *
 * Mint a Recruitment Partner Portal link for a partner row (Chunk DF-3). Admin
 * generates it from the drawer and sends it to the partner (the portal token is
 * the access credential). The signing secret stays server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildPartnerPortalUrl } from "@/lib/medjobs/welcome-token";

const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Magic-link secret not configured" }, { status: 500 });
  }

  const outreachId = request.nextUrl.searchParams.get("outreach_id")?.trim();
  if (!outreachId) {
    return NextResponse.json({ error: "outreach_id is required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: row } = await db
    .from("student_outreach")
    .select("id, kind, research_data")
    .eq("id", outreachId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
  if (!STAKEHOLDER_KINDS.includes((row as { kind: string }).kind)) {
    return NextResponse.json({ error: "Not a partner row" }, { status: 400 });
  }

  const rd = ((row as { research_data?: Record<string, unknown> }).research_data ?? {}) as Record<string, unknown>;
  const gc = (rd.general_contact ?? {}) as Record<string, unknown>;
  const sl = (rd.smartlead ?? {}) as Record<string, unknown>;
  const email =
    [gc.email, rd.org_email, sl.lead_email].find(
      (e): e is string => typeof e === "string" && e.includes("@"),
    ) ?? "partner@example.com";

  const url = buildPartnerPortalUrl({ outreach_id: outreachId, email }, secret);
  return NextResponse.json({ url });
}
