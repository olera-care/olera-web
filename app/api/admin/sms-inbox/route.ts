import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  buildSmsThreadSummaries,
  classifySmsThread,
  type SmsInboxInboundRow,
  type SmsInboxOutboundRow,
} from "@/lib/sms/inbox-threads";

/**
 * GET /api/admin/sms-inbox
 *
 * Thread list for the SMS inbox. One entry per phone number with either an
 * inbound text OR a logged outbound family SMS, newest first. That second
 * source is what makes silent recipients visible before they ever text back.
 *
 * Threads are keyed on phone_last10 rather than a profile id because most
 * senders map to no account at all — the phone IS the identity for SMS.
 *
 * Optional: ?unhandled=true to show only threads needing attention,
 *           ?count_only=true for the nav badge.
 */

const MAX_INBOUND_ROWS = 1000;
const MAX_OUTBOUND_ROWS = 1000;
const MAX_THREADS = 1000;
const PROFILE_BATCH_SIZE = 200;

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

    const [inboundRes, outboundRes] = await Promise.all([
      db
        .from("sms_inbound")
        .select(
          "id, from_phone, phone_last10, body, keyword, profile_id, profile_type, display_name, handled_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(MAX_INBOUND_ROWS),
      // Keep proactive sends family-scoped. Provider alerts and internal
      // self-checks also use the SMS ledger, but adding them here would turn
      // the family inbox into an outbound-operations firehose. Historical
      // admin_reply rows predate recipient_type logging, so include that one
      // type explicitly to preserve the real latest direction of known threads.
      db
        .from("email_log")
        .select(
          "id, recipient, html_body, email_type, provider_id, recipient_type, status, delivered_at, first_clicked_at, bounced_at, created_at",
        )
        .eq("channel", "sms")
        .or("recipient_type.eq.family,email_type.eq.admin_reply")
        .order("created_at", { ascending: false })
        .limit(MAX_OUTBOUND_ROWS),
    ]);
    if (inboundRes.error || outboundRes.error) {
      const error = inboundRes.error ?? outboundRes.error;
      console.error("[admin/sms-inbox] list failed:", error);
      return NextResponse.json({ error: error?.message || "Failed to load SMS history" }, { status: 500 });
    }

    const inboundRows = (inboundRes.data ?? []) as SmsInboxInboundRow[];
    const outboundRows = (outboundRes.data ?? []) as SmsInboxOutboundRow[];
    const allThreads = buildSmsThreadSummaries(inboundRows, outboundRows);
    let list = allThreads.slice(0, MAX_THREADS);

    // Outbound-only rows know the profile id through email_log.provider_id but
    // do not have the denormalized display name stored by the inbound webhook.
    // Fill those identities in bounded batches so a large cohort does not
    // create an oversized PostgREST URL.
    const missingIdentityIds = [
      ...new Set(
        list
          .filter((thread) => !thread.display_name && thread.profile_id)
          .map((thread) => thread.profile_id as string),
      ),
    ];
    const profileById = new Map<string, { display_name: string | null; type: string | null }>();
    const profileQueries = [];
    for (let i = 0; i < missingIdentityIds.length; i += PROFILE_BATCH_SIZE) {
      profileQueries.push(
        db
          .from("business_profiles")
          .select("id, display_name, type")
          .in("id", missingIdentityIds.slice(i, i + PROFILE_BATCH_SIZE)),
      );
    }
    for (const result of await Promise.all(profileQueries)) {
      if (result.error) {
        console.error("[admin/sms-inbox] profile identity load failed:", result.error);
        continue;
      }
      for (const profile of result.data ?? []) {
        profileById.set(String(profile.id), {
          display_name: profile.display_name ? String(profile.display_name) : null,
          type: profile.type ? String(profile.type) : null,
        });
      }
    }
    list = list.map((thread) => {
      const profile = thread.profile_id ? profileById.get(thread.profile_id) : null;
      return profile
        ? {
            ...thread,
            display_name: thread.display_name || profile.display_name,
            profile_type: thread.profile_type || profile.type,
          }
        : thread;
    });

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

    const enriched = list.map((thread) => {
      const isSuppressed = suppressed.has(thread.phone_last10);
      const hasDraft = drafted.has(thread.phone_last10);
      return {
        ...thread,
        suppressed: isSuppressed,
        has_draft: hasDraft,
        state: classifySmsThread({
          suppressed: isSuppressed,
          unhandled: thread.unhandled,
          hasDraft,
          lastDirection: thread.last_direction,
          lastOutboundStatus: thread.last_outbound_status,
          lastOutboundClickedAt: thread.last_outbound_clicked_at,
        }),
      };
    });
    if (unhandledOnly) list = enriched.filter((thread) => thread.state === "needs_reply");

    return NextResponse.json({
      threads: unhandledOnly ? list : enriched,
      unhandled: enriched.reduce((sum, thread) => sum + thread.unhandled, 0),
      truncated:
        inboundRows.length >= MAX_INBOUND_ROWS ||
        outboundRows.length >= MAX_OUTBOUND_ROWS ||
        allThreads.length > MAX_THREADS,
    });
  } catch (err) {
    console.error("[admin/sms-inbox] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}
