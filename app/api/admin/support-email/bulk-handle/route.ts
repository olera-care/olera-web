import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { decryptGmailToken } from "@/lib/support-email/crypto.server";
import {
  GMAIL_BATCH_MODIFY_LIMIT,
  batchModifyGmailMessages,
  gmailAccessToken,
} from "@/lib/support-email/gmail.server";
import type { SupportMailboxRow } from "@/lib/support-email/sync.server";

export const maxDuration = 300;

/**
 * Bulk-clear obvious cold solicitation from the support queue.
 *
 * GET without ?confirm= is a DRY RUN: it reports the cohort and a sample and
 * writes nothing. Execution requires ?confirm=<exact cohort size>, so a stale
 * link or a stray click cannot fire it.
 *
 * The filter is deliberately hardcoded rather than caller-supplied. It is
 * narrow on purpose: the "marketing" label also collects replies to Olera's own
 * outbound campaigns, follow-ups to real care-seeker inquiries, and the odd
 * genuinely human note. Those all sit below 0.95 agent confidence; the cold
 * roofing/lending/SEO/newsletter mail sits at 0.95. See the voicemail exclusion
 * below for the one failure mode worth paying a filter for.
 */

// Only categories that are noise by definition. Never care_seeker/provider/etc.
const ALLOWED_CATEGORIES = new Set(["marketing", "automated"]);
const MIN_CONFIDENCE = 0.95;
// Mirrors isVoicemail() in classify.server.ts. A misfiled voicemail is the one
// case where bulk-handling would bury a real inbound phone call.
const VOICEMAIL_PATTERNS = ["%voicemail%", "%voice message%", "%missed call%"];
const SUPABASE_IN_CHUNK = 200;

function cohortQuery(db: ReturnType<typeof getServiceClient>, category: string, select: string, count?: "exact") {
  let query = db
    .from("support_email_threads")
    .select(select, count ? { count } : undefined)
    .in("state", ["needs_reply", "escalated"])
    .eq("category", category)
    // Never touch a thread tied to a known Olera family or provider.
    .is("matched_profile_id", null)
    .is("matched_provider_id", null)
    // If we ever replied, it is a conversation, not a cold pitch.
    .eq("message_count", 1)
    .gte("agent_confidence", MIN_CONFIDENCE);
  for (const pattern of VOICEMAIL_PATTERNS) query = query.not("subject", "ilike", pattern);
  return query;
}

async function chunked<T, R>(values: T[], size: number, fn: (chunk: T[]) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < values.length; i += size) results.push(await fn(values.slice(i, i + size)));
  return results;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const category = params.get("category") ?? "marketing";
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${[...ALLOWED_CATEGORIES].join(", ")}` },
      { status: 400 },
    );
  }
  const confirm = params.get("confirm");
  const limit = Math.min(Number(params.get("limit") ?? GMAIL_BATCH_MODIFY_LIMIT), GMAIL_BATCH_MODIFY_LIMIT);
  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }

  try {
    const db = getServiceClient();
    const { data: rows, count, error } = await cohortQuery(
      db,
      category,
      "id, subject, agent_summary, agent_confidence, last_message_at",
      "exact",
    )
      .order("last_message_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const threads = (rows ?? []) as unknown as Array<{
      id: string;
      subject: string;
      agent_summary: string | null;
      agent_confidence: number | null;
      last_message_at: string;
    }>;
    const total = count ?? 0;
    const filter = {
      category,
      state: ["needs_reply", "escalated"],
      minConfidence: MIN_CONFIDENCE,
      noOleraIdentityMatch: true,
      singleMessageThreadsOnly: true,
      voicemailExcluded: true,
    };

    if (!confirm) {
      return NextResponse.json({
        dryRun: true,
        filter,
        matching: total,
        wouldProcessNow: threads.length,
        note: total > threads.length
          ? `Gmail batchModify caps at ${GMAIL_BATCH_MODIFY_LIMIT} per run. Re-run to continue.`
          : "One run covers the whole cohort.",
        confirmUrl: `/api/admin/support-email/bulk-handle?category=${category}&confirm=${total}`,
        sample: threads.slice(0, 15).map((t) => ({
          subject: t.subject,
          summary: t.agent_summary,
          confidence: t.agent_confidence,
        })),
      });
    }

    if (Number(confirm) !== total) {
      return NextResponse.json({
        error: "Confirmation count does not match the current cohort. Re-run the dry run and use the fresh number.",
        expected: total,
        received: Number(confirm),
      }, { status: 409 });
    }
    if (!threads.length) return NextResponse.json({ ok: true, processed: 0, note: "Nothing to do." });

    const threadIds = threads.map((t) => t.id);
    // message_count = 1 guarantees one inbound message per thread, which is
    // exactly what batchModify wants.
    const messageChunks = await chunked(threadIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { data, error: messageError } = await db
        .from("support_email_messages")
        .select("gmail_message_id")
        .in("thread_id", chunk)
        .eq("direction", "in");
      if (messageError) throw messageError;
      return (data ?? []).map((m) => String(m.gmail_message_id));
    });
    const gmailMessageIds = messageChunks.flat();
    if (!gmailMessageIds.length) throw new Error("No inbound Gmail messages found for the cohort.");

    const { data: mailboxes, error: mailboxError } = await db
      .from("support_mailboxes")
      .select("*")
      .not("encrypted_refresh_token", "is", null)
      .limit(1);
    if (mailboxError) throw mailboxError;
    const mailbox = (mailboxes ?? [])[0] as SupportMailboxRow | undefined;
    if (!mailbox?.encrypted_refresh_token) throw new Error("No connected Gmail mailbox.");
    const accessToken = await gmailAccessToken(decryptGmailToken(mailbox.encrypted_refresh_token));

    // Gmail is the source of truth, so it moves first. If the Supabase write
    // below fails, the threads are merely read-but-still-queued and re-running
    // is safe.
    await chunked(gmailMessageIds, GMAIL_BATCH_MODIFY_LIMIT, (chunk) =>
      batchModifyGmailMessages(accessToken, chunk, { removeLabelIds: ["UNREAD"] }));

    const now = new Date().toISOString();
    const actor = admin.email;
    await chunked(threadIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { error: updateError } = await db
        .from("support_email_threads")
        .update({
          state: "handled",
          unread: false,
          handled_at: now,
          handled_by: actor,
          snoozed_until: null,
          updated_at: now,
        })
        .in("id", chunk);
      if (updateError) throw updateError;
    });

    // Per-thread provenance, so an unwanted sweep can be traced and undone.
    await chunked(threadIds, 500, async (chunk) => {
      const { error: actionError } = await db.from("support_email_actions").insert(
        chunk.map((threadId) => ({
          thread_id: threadId,
          actor,
          action: "bulk_mark_handled",
          details: { category, minConfidence: MIN_CONFIDENCE },
        })),
      );
      if (actionError) console.error("[support-email] bulk audit insert failed:", actionError);
    });
    await logAuditAction({
      adminUserId: admin.id,
      action: "support_email_bulk_mark_handled",
      targetType: "support_email_thread",
      targetId: `${category}:${threadIds.length}`,
      details: { filter, processed: threadIds.length, gmailMessages: gmailMessageIds.length },
    });

    const remaining = total - threadIds.length;
    return NextResponse.json({
      ok: true,
      processed: threadIds.length,
      gmailMessagesMarkedRead: gmailMessageIds.length,
      remaining,
      note: remaining > 0
        ? `Re-run the dry run and confirm again to process the remaining ${remaining}.`
        : "Cohort cleared. Marking any thread unread in Gmail brings it straight back to Needs attention.",
    });
  } catch (err) {
    console.error("[support-email] bulk handle failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk handle failed" },
      { status: 500 },
    );
  }
}
