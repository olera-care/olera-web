/**
 * POST /api/medjobs/partner/event — a partner tells us about a campus event
 * (Chunk 3.4, S19/R13). Token-gated. It's a SIGNAL, not a booking: we log a
 * note_added touchpoint on the partner's row (no events table — P-D5) and
 * resurface the row so the admin follows up (ideally 1+ month ahead).
 */

import { NextResponse } from "next/server";
import { authPartnerToken } from "@/lib/medjobs/partner-portal-auth";

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

  const str = (v: unknown) => String(v ?? "").trim() || null;
  const name = str(body.name);
  if (!name) return NextResponse.json({ error: "Event name required" }, { status: 400 });
  const bucket = body.bucket === "new" ? "new" : "existing";

  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: null,
    touchpoint_type: "note_added",
    channel: null,
    notes: `Partner flagged an event: ${name}`,
    payload: {
      reason: "partner_event",
      bucket, // existing event vs one we could help create
      event_name: name,
      date: str(body.date),
      timing: str(body.timing),
      mode: body.mode === "virtual" ? "virtual" : "in_person",
      location: str(body.location),
      contact: str(body.contact),
      notes: str(body.notes),
      source: "partner_portal",
    },
    created_by: null,
  });
  await db.from("student_outreach").update({ viewed_at: null }).eq("id", outreachId);

  return NextResponse.json({ ok: true });
}
