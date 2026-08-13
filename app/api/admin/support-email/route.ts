import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { syncSupportMailbox, type SupportMailboxRow } from "@/lib/support-email/sync.server";

export const maxDuration = 60;

const CATEGORIES = new Set([
  "care_seeker", "provider", "partner", "marketing", "automated",
  "legal", "security", "billing", "voicemail", "internal", "other",
]);
const DATE_WINDOWS: Record<string, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

async function adminOrResponse() {
  const user = await getAuthUser();
  if (!user) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const admin = await getAdminUser(user.id);
  if (!admin) return { response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { user, admin };
}
export async function GET(request: NextRequest) {
  const auth = await adminOrResponse();
  if ("response" in auth) return auth.response;
  try {
    const db = getServiceClient();
    const countOnly = request.nextUrl.searchParams.get("count_only") === "true";
    if (countOnly) {
      const { count, error } = await db
        .from("support_email_threads")
        .select("id", { count: "exact", head: true })
        .in("state", ["needs_reply", "escalated"]);
      if (error) throw error;
      return NextResponse.json({ unhandled: count ?? 0 });
    }
    const [{ data: mailboxes, error: mailboxError }] = await Promise.all([
      db.from("support_mailboxes").select("id, email, sync_status, gmail_history_id, watch_expiration, full_sync_complete, full_sync_messages_imported, last_sync_at, last_error, connected_by, created_at"),
    ]);
    if (mailboxError) throw mailboxError;

    const view = request.nextUrl.searchParams.get("view") ?? "needs_reply";
    const search = request.nextUrl.searchParams.get("q")?.trim();
    const category = request.nextUrl.searchParams.get("category") ?? "all";
    const dateWindow = request.nextUrl.searchParams.get("date") ?? "all";
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const priority = request.nextUrl.searchParams.get("priority") ?? "all";
    const oldestFirst = request.nextUrl.searchParams.get("sort") === "oldest";
    let query = db
      .from("support_email_threads")
      .select("id, gmail_thread_id, subject, snippet, participants, last_message_at, message_count, unread, state, category, priority, matched_profile_id, matched_profile_type, matched_profile_name, matched_provider_id, agent_summary, agent_reason, agent_confidence, suggested_action, suggested_owner, suggested_draft, agent_risk_flags, gmail_draft_id, draft_body, snoozed_until", { count: "exact" })
      .order("last_message_at", { ascending: oldestFirst })
      .limit(250);
    if (view === "needs_reply") query = query.in("state", ["needs_reply", "escalated"]);
    else if (["handled", "noise", "escalated", "snoozed"].includes(view)) query = query.eq("state", view);
    if (unreadOnly) query = query.eq("unread", true);
    if (priority === "urgent") {
      // War Room defines the urgent operating queue as explicitly urgent
      // threads plus anything already escalated. Keep this deep link aligned
      // with the count that produced the recommendation.
      query = query.or("priority.eq.urgent,state.eq.escalated");
    } else if (PRIORITIES.has(priority)) {
      query = query.eq("priority", priority);
    }
    if (CATEGORIES.has(category)) query = query.eq("category", category);
    if (DATE_WINDOWS[dateWindow]) {
      const since = new Date(Date.now() - DATE_WINDOWS[dateWindow] * 24 * 60 * 60 * 1_000);
      query = query.gte("last_message_at", since.toISOString());
    }
    if (search) {
      const safe = search.replace(/[%_,()]/g, " ");
      query = query.or(`subject.ilike.%${safe}%,snippet.ilike.%${safe}%,matched_profile_name.ilike.%${safe}%`);
    }
    const { data: threads, error, count } = await query;
    if (error) throw error;
    return NextResponse.json({ mailboxes: mailboxes ?? [], threads: threads ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[support-email] list failed:", err);
    const message = err instanceof Error ? err.message : "Could not load support email";
    const missing = /support_mailboxes|support_email_threads/.test(message);
    return NextResponse.json({ error: missing ? "Support email migration 171 has not been applied." : message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await adminOrResponse();
  if ("response" in auth) return auth.response;
  let requestedMailboxId: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; mailboxId?: string };
    requestedMailboxId = body.mailboxId;
    if (body.action !== "sync_now") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    const db = getServiceClient();
    let query = db.from("support_mailboxes").select("*");
    if (body.mailboxId) query = query.eq("id", body.mailboxId);
    const { data, error } = await query;
    if (error) throw error;
    const results = [];
    for (const mailbox of data ?? []) results.push(await syncSupportMailbox(db, mailbox as SupportMailboxRow));
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[support-email] manual sync failed:", err);
    if (requestedMailboxId) {
      const message = err instanceof Error ? err.message : "Sync failed";
      await getServiceClient().from("support_mailboxes").update({
        sync_status: "error",
        last_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", requestedMailboxId);
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }
}
