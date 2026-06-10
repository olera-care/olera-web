/**
 * POST /api/medjobs/partner/message — "Need help?" message from the portal
 * (Chunk 3.5, S26/R14). Token-gated. Logs a note_added touchpoint on the
 * partner's row and resurfaces it so the admin (Graize / Dr. DuBose's team)
 * sees and replies within a few business days.
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

  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: null,
    touchpoint_type: "note_added",
    channel: null,
    notes: `Partner message: ${message.slice(0, 280)}`,
    payload: { reason: "partner_message", message, source: "partner_portal" },
    created_by: null,
  });
  await db.from("student_outreach").update({ viewed_at: null }).eq("id", outreachId);

  return NextResponse.json({ ok: true });
}
