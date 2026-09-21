import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Archive a care seeker off the board, or put them back.
 *
 * POST   { seekerId, reason, note? }  — archive
 * DELETE { seekerId }                 — un-archive
 *
 * The board is a view over events and stores nothing, which is what keeps it
 * honest. This is the one exception, and deliberately the smallest one: some
 * rows are not cases and no event will ever say so. A record called
 * "Test McTest" held the top of "Reply to them" for 1,098 days, above real
 * families, because a test message genuinely has no reply. The events were
 * right. The row was not a case.
 *
 * Archiving empties the row's work flags, so it leaves every queue at once and
 * nothing downstream needs to know this exists. It says nothing about whether
 * we may contact them — that is do_not_contact — and nothing about erasing
 * their data, which is the GDPR flow on business_profiles.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Why a row is not a case. Plain strings rather than a CHECK constraint,
 * matching city_leads.archive_reason, so adding one is a code change.
 * `not_a_care_seeker` is separate from `test_record` on purpose: one says an ad
 * reached the wrong audience and belongs in that count, the other says we made
 * the row ourselves and it should never have counted at all.
 */
const REASONS = new Set(["test_record", "not_a_care_seeker", "duplicate", "resolved_elsewhere", "other"]);

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const admin = await getAdminUser(user.id);
  if (!admin) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { who: user.email ?? user.id };
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: { seekerId?: string; reason?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const seekerId = String(body.seekerId ?? "").trim();
  const reason = String(body.reason ?? "").trim();
  const note = String(body.note ?? "").trim().slice(0, 500) || null;
  if (!UUID_RE.test(seekerId)) return NextResponse.json({ error: "Which family?" }, { status: 400 });
  if (!REASONS.has(reason)) return NextResponse.json({ error: "Pick a reason" }, { status: 400 });

  const db = getServiceClient();
  // Upsert rather than insert: archiving something already archived is a
  // double-click, not an error, and it should end in the state the person asked
  // for rather than a red toast.
  const { data, error } = await db
    .from("seeker_archives")
    .upsert({ seeker_id: seekerId, reason, note, archived_by: gate.who, archived_at: new Date().toISOString() })
    .select("seeker_id")
    .single();
  if (error) {
    console.error("[seeker-archive] write failed", error);
    return NextResponse.json({ error: "Could not archive. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, seekerId: data.seeker_id, message: "Archived. They have left every queue." });
}

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: { seekerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const seekerId = String(body.seekerId ?? "").trim();
  if (!UUID_RE.test(seekerId)) return NextResponse.json({ error: "Which family?" }, { status: 400 });

  const db = getServiceClient();
  // Deleting the row, not stamping it. A reversed archive should leave no
  // residue, and the flags recompute from events the moment it goes.
  const { error } = await db.from("seeker_archives").delete().eq("seeker_id", seekerId);
  if (error) {
    console.error("[seeker-archive] delete failed", error);
    return NextResponse.json({ error: "Could not put them back. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "Back on the board." });
}
