/**
 * POST /api/medjobs/partner/colleague — a partner suggests a colleague we
 * should contact (Chunk 3.4, S18/R12). Token-gated. Creates a new Partner
 * Prospect on the same Site (referred by this partner) and logs a referral
 * touchpoint on the partner's row so it surfaces to the admin (S22/S23).
 */

import { NextResponse } from "next/server";
import { authPartnerToken } from "@/lib/medjobs/partner-portal-auth";

const ROLES = ["advisor", "student_org", "dept_head", "professor"];

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const auth = await authPartnerToken(body.token);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { db, outreachId } = auth;

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const roleRaw = String(body.role ?? "advisor");
  const role = ROLES.includes(roleRaw) ? roleRaw : "advisor";
  const email = String(body.email ?? "").trim() || null;
  const context = String(body.context ?? "").trim() || null;
  const allowMention = body.allow_mention === true;

  const { data: partner } = await db
    .from("student_outreach")
    .select("campus_id, organization_name")
    .eq("id", outreachId)
    .maybeSingle();
  const campusId = (partner as { campus_id?: string } | null)?.campus_id;
  if (!campusId) return NextResponse.json({ error: "Site missing" }, { status: 400 });

  await db.from("student_outreach").insert({
    campus_id: campusId,
    kind: role,
    stakeholder_type: role,
    organization_name: name,
    status: "prospect",
    research_data: {
      general_contact: email ? { email } : {},
      source: "partner_referral",
      referred_by_outreach_id: outreachId,
      referred_by_org: (partner as { organization_name?: string } | null)?.organization_name ?? null,
      allow_mention_referrer: allowMention,
      referral_context: context,
    },
    created_by: null,
  });

  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: null,
    touchpoint_type: "note_added",
    channel: null,
    notes: `Partner referred a colleague: ${name}${email ? ` (${email})` : ""}`,
    payload: {
      reason: "partner_referral",
      referred_name: name,
      referred_role: role,
      referred_email: email,
      allow_mention: allowMention,
      context,
      source: "partner_portal",
    },
    created_by: null,
  });
  // Resurface the partner row in the admin In-Basket.
  await db.from("student_outreach").update({ viewed_at: null }).eq("id", outreachId);

  return NextResponse.json({ ok: true });
}
