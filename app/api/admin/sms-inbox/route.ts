import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/sms-inbox
 *
 * Thread list for the SMS inbox. One entry per phone number that has texted us,
 * newest first, with the count still awaiting a human.
 *
 * Threads are keyed on phone_last10 rather than a profile id because most
 * senders map to no account at all — the phone IS the identity for SMS.
 *
 * Optional: ?unhandled=true to show only threads needing attention,
 *           ?count_only=true for the nav badge.
 */

const MAX_ROWS = 1000;

interface InboundRow {
  id: number;
  from_phone: string;
  phone_last10: string;
  body: string;
  keyword: string | null;
  profile_id: string | null;
  profile_type: string | null;
  display_name: string | null;
  handled_at: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const params = request.nextUrl.searchParams;
    const countOnly = params.get("count_only") === "true";
    const unhandledOnly = params.get("unhandled") === "true";

    const db = getServiceClient();

    // The nav badge only needs "how many need me", so skip the row fetch.
    if (countOnly) {
      const { count, error } = await db
        .from("sms_inbound")
        .select("id", { count: "exact", head: true })
        .is("handled_at", null);
      if (error) {
        console.error("[admin/sms-inbox] count failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ unhandled: count ?? 0 });
    }

    const { data, error } = await db
      .from("sms_inbound")
      .select(
        "id, from_phone, phone_last10, body, keyword, profile_id, profile_type, display_name, handled_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    if (error) {
      console.error("[admin/sms-inbox] list failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as InboundRow[];

    // Group into threads. Rows arrive newest-first, so the first row seen for a
    // number is that thread's latest message.
    const threads = new Map<
      string,
      {
        phone_last10: string;
        from_phone: string;
        display_name: string | null;
        profile_type: string | null;
        profile_id: string | null;
        last_body: string;
        last_keyword: string | null;
        last_at: string;
        unhandled: number;
        /** Oldest unanswered, non-control message from a matched family. */
        oldest_promised_reply_at: string | null;
        total: number;
      }
    >();
    for (const row of rows) {
      const existing = threads.get(row.phone_last10);
      if (!existing) {
        threads.set(row.phone_last10, {
          phone_last10: row.phone_last10,
          from_phone: row.from_phone,
          display_name: row.display_name,
          profile_type: row.profile_type,
          profile_id: row.profile_id,
          last_body: row.body,
          last_keyword: row.keyword,
          last_at: row.created_at,
          unhandled: row.handled_at ? 0 : 1,
          oldest_promised_reply_at:
            !row.handled_at && row.profile_type === "family" && !row.keyword
              ? row.created_at
              : null,
          total: 1,
        });
        continue;
      }
      existing.total += 1;
      if (!row.handled_at) {
        existing.unhandled += 1;
        // Control keywords (STOP/START/HELP) are handled by the carrier or
        // webhook and do not start the care-team response promise. Rows arrive
        // newest-first, so every later qualifying row is older.
        if (row.profile_type === "family" && !row.keyword) {
          existing.oldest_promised_reply_at = row.created_at;
        }
      }
      // An older row may carry identity a newer one lacks (resolution improves
      // as accounts are created), so keep the first non-null we find.
      existing.display_name ||= row.display_name;
      existing.profile_type ||= row.profile_type;
      existing.profile_id ||= row.profile_id;
    }

    let list = [...threads.values()];
    if (unhandledOnly) list = list.filter((t) => t.unhandled > 0);

    // Which of these numbers are suppressed? The reply box must refuse to text
    // someone who opted out, so the UI needs this up front.
    // And which have an unsent draft parked against them? A draft you forgot
    // about is the same failure as an unanswered text, so the list has to show
    // it — otherwise the only way to find one is to open every thread.
    const suppressed = new Set<string>();
    const drafted = new Set<string>();
    if (list.length > 0) {
      const keys = list.map((t) => t.phone_last10);
      const [dncRes, draftRes] = await Promise.all([
        db.from("do_not_contact").select("phone").in("phone", keys),
        db.from("sms_drafts").select("phone_last10").in("phone_last10", keys),
      ]);
      for (const row of dncRes.data ?? []) if (row.phone) suppressed.add(String(row.phone));
      for (const row of draftRes.data ?? []) if (row.phone_last10) drafted.add(String(row.phone_last10));
    }

    return NextResponse.json({
      threads: list.map((t) => ({
        ...t,
        suppressed: suppressed.has(t.phone_last10),
        has_draft: drafted.has(t.phone_last10),
      })),
      unhandled: list.reduce((sum, t) => sum + t.unhandled, 0),
      truncated: rows.length >= MAX_ROWS,
    });
  } catch (err) {
    console.error("[admin/sms-inbox] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}
