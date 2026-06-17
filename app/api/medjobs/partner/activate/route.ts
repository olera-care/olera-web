/**
 * POST /api/medjobs/partner/activate  — Recruitment Partner self-activation
 * (Chunk 3.1, R7). The partner clicks "Agree & continue" in the portal; this
 * flips their stakeholder row to active_partner and records the agreement.
 *
 * Auth: the signed welcome token IS the credential (partners have no admin
 * session). We verify it server-side. Like the Smartlead/Calendly webhooks,
 * this writes via the service role — a narrow, documented exception to the
 * route.ts single-writer rule (G4): an external, un-authed actor can't dispatch
 * an admin action, so it replicates mark_partner's core effect inline (status →
 * active_partner + distribution_confirmed touchpoint). Idempotent.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWelcomeToken } from "@/lib/medjobs/welcome-token";

const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

export async function POST(request: Request) {
  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let token = "";
  try {
    token = String(((await request.json()) as { token?: string }).token ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const verified = verifyWelcomeToken(token, secret);
  if (!verified.ok) {
    return NextResponse.json({ error: `Link ${verified.reason}` }, { status: 401 });
  }
  const { outreach_id } = verified.payload;

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: row } = await db
    .from("student_outreach")
    .select("id, status, kind")
    .eq("id", outreach_id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!STAKEHOLDER_KINDS.includes((row as { kind: string }).kind)) {
    return NextResponse.json({ error: "Not a partner row" }, { status: 400 });
  }

  // Idempotent — already active.
  if ((row as { status: string }).status === "active_partner") {
    return NextResponse.json({ ok: true, already_active: true });
  }

  // Replicate mark_partner's core effect (status + evidence + touchpoint).
  await db
    .from("student_outreach")
    .update({
      status: "active_partner",
      distribution_evidence: "self_reported",
      distribution_evidence_notes: "Self-activated via the partner portal",
      viewed_at: null,
    })
    .eq("id", outreach_id);

  await db.from("student_outreach_touchpoints").insert({
    outreach_id,
    contact_id: null,
    touchpoint_type: "distribution_confirmed",
    channel: null,
    outcome: null,
    notes: "Agreed to be a Recruitment Partner (portal self-activation).",
    payload: { evidence: "self_reported", source: "partner_portal" },
    created_by: null,
  });

  return NextResponse.json({ ok: true });
}
