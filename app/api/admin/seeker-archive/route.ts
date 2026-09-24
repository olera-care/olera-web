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
const REASONS = new Set(["test_record", "not_a_care_seeker", "duplicate", "resolved_elsewhere", "no_answer", "opted_out", "other"]);

/**
 * "Asked us to stop" is a request, not a filing decision, so it goes on
 * do_not_contact: the cross-channel list sendEmail and sendSMS both check. An
 * archive alone takes a family off this board and leaves every automated email
 * running. Written BEFORE the city lead sync, so the city_lead_apply_optout
 * trigger files their city lead as an opt-out (archived_by do_not_contact),
 * which "Put back" never reopens.
 *
 * do_not_contact.reason is CHECK-constrained and has no care-seeker value, so
 * this uses "other" with a note saying where it came from.
 */
async function recordOptOut(db: ReturnType<typeof getServiceClient>, seekerId: string, who: string): Promise<void> {
  const { data: p } = await db.from("business_profiles").select("email, phone").eq("id", seekerId).maybeSingle();
  const email = (p?.email as string | null)?.trim().toLowerCase() || null;
  const digits = ((p?.phone as string | null) ?? "").replace(/\D/g, "").slice(-10);
  const phone = digits.length === 10 ? digits : null;
  if (!email && !phone) return;
  const already = await db
    .from("do_not_contact")
    .select("id")
    .or([email ? `email.eq.${email}` : null, phone ? `phone.eq.${phone}` : null].filter(Boolean).join(","))
    .limit(1);
  if (already.data?.length) return;
  const { error } = await db.from("do_not_contact").insert({
    email,
    phone,
    reason: "other",
    note: "Care seeker asked us to stop. Recorded on Care Seeker Relationships.",
    created_by: who,
  });
  if (error) throw error;
}

/**
 * Who a city lead was archived by when the archive came from this board.
 * Putting a family back only reopens leads carrying this mark, so it never
 * undoes an archive made on City campaigns, by the classifier, or by an
 * opt-out.
 */
const FROM_BOARD = "relationships:";

/** The one reason whose meaning has a different name in the city vocabulary. */
const CITY_REASON: Record<string, string> = { resolved_elsewhere: "no_longer_needed" };

/**
 * ONE ARCHIVE, BOTH PAGES.
 *
 * A family archived here stayed live on /admin/city-ads, because that page
 * reads city_leads.archived_at and this route only wrote seeker_archives. Karl
 * Taht and Ann McDade were filed on this board and still sat in City
 * campaigns' queue. Archiving the family now archives their open city leads
 * too, and the city_lead_archive_cleanup trigger cancels the lead's pending
 * texts and open offers.
 *
 * This became safe with migration 255. Before it, a city archive could never
 * be reopened, so syncing would have made this board's "Put back" a lie.
 *
 * Best effort by design: the family's own archive is already written, and a
 * failure here is logged rather than turned into an error on a row that did
 * leave the board.
 */
async function syncCityLeads(
  db: ReturnType<typeof getServiceClient>,
  seekerId: string,
  archive: { reason: string; who: string } | null,
): Promise<number> {
  const now = new Date().toISOString();
  const q = archive
    ? db
        .from("city_leads")
        .update({
          archived_at: now,
          archive_reason: CITY_REASON[archive.reason] ?? archive.reason,
          archived_by: `${FROM_BOARD}${archive.who}`,
          updated_at: now,
        })
        .eq("care_seeker_id", seekerId)
        .is("archived_at", null)
        // Open leads only. A reopen always returns a lead to "new", because
        // the status it had before archiving is not kept anywhere, so
        // archiving a finished lead (not a fit, client) and putting it back
        // would revive it into the relay. Finished leads are already out of
        // every queue and need no archive.
        .in("status", ["new", "offered", "unfilled"])
    : db
        .from("city_leads")
        .update({ archived_at: null, archive_reason: null, archived_by: null, updated_at: now })
        .eq("care_seeker_id", seekerId)
        .like("archived_by", `${FROM_BOARD}%`);
  const { data, error } = await q.select("id");
  if (error) {
    console.error("[seeker-archive] city lead sync failed", error);
    return 0;
  }
  return data?.length ?? 0;
}

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
  if (reason === "opted_out") {
    try {
      await recordOptOut(db, seekerId, gate.who);
    } catch (err) {
      // Archived, but not suppressed. Say so rather than let the row imply
      // messages have stopped.
      console.error("[seeker-archive] do_not_contact write failed", err);
      return NextResponse.json(
        { error: "Archived, but could not add them to Do Not Contact. Add them at /admin/do-not-contact." },
        { status: 500 },
      );
    }
  }
  const leads = await syncCityLeads(db, seekerId, { reason, who: gate.who });
  return NextResponse.json({
    ok: true,
    seekerId: data.seeker_id,
    message:
      reason === "opted_out"
        ? "Archived and added to Do Not Contact. No email or text will reach them."
        : leads
          ? "Archived here and on City campaigns. Their pending texts and open offers are canceled."
          : "Archived. They have left every queue.",
  });
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
  const { data: was } = await db.from("seeker_archives").select("reason").eq("seeker_id", seekerId).maybeSingle();
  const { error } = await db.from("seeker_archives").delete().eq("seeker_id", seekerId);
  if (error) {
    console.error("[seeker-archive] delete failed", error);
    return NextResponse.json({ error: "Could not put them back. Try again." }, { status: 500 });
  }
  const leads = await syncCityLeads(db, seekerId, null);
  // An opt-out is the person's request, not ours to undo from here: putting
  // the row back leaves do_not_contact alone.
  if (was?.reason === "opted_out") {
    return NextResponse.json({ ok: true, message: "Back on the board. They stay on Do Not Contact; remove them there only if they ask." });
  }
  return NextResponse.json({ ok: true, message: leads ? "Back on the board and on City campaigns." : "Back on the board." });
}
