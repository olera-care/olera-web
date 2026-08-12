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

// A person telling Olera to stop must never be silently buried: the reply is
// both the opt-out record and the trigger for a do_not_contact write. The
// classifier does not model this, so it is enforced on the message body here.
//
// Deliberately NOT matching bare "unsubscribe" or "opt out" -- that boilerplate
// appears in nearly every legitimate marketing footer and would exclude the
// whole cohort. These are first-person requests only. "done" is anchored to the
// start of the reply because it is the literal instruction in Olera's outreach.
const OPT_OUT_PATTERNS: RegExp[] = [
  /^\s*(?:>+\s*)?done\b/i,
  /\bremove me\b/i,
  /\btake me off\b/i,
  /\bstop emailing\b/i,
  /\bstop contacting\b/i,
  /\bunsubscribe me\b/i,
  /\bleave me alone\b/i,
  /\bdo ?n[o']?t (?:contact|email|call) me\b/i,
  /\bi (?:did ?n[o']?t|never) (?:sign ?up|signed ?up)\b/i,
  /\bdid ?n[o']?t authorize\b/i,
  /\b(?:i am|we are|this is) not a (?:group home|nursing home|care home|facility|provider)\b/i,
  /\btake (?:my|our|this) (?:listing|page|profile) down\b/i,
];

function looksLikeOptOut(bodyText: string): boolean {
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(bodyText));
}

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
    const matchedBySql = count ?? 0;
    const filter = {
      category,
      state: ["needs_reply", "escalated"],
      minConfidence: MIN_CONFIDENCE,
      noOleraIdentityMatch: true,
      singleMessageThreadsOnly: true,
      voicemailExcluded: true,
      optOutLanguageExcluded: true,
    };

    // The opt-out check reads message bodies, so it has to run before the dry
    // run reports a count -- otherwise the confirm token would not match what
    // execution actually processes.
    // message_count = 1 guarantees one inbound message per thread, which is
    // also exactly what batchModify wants.
    const pageIds = threads.map((t) => t.id);
    const messageRows = (await chunked(pageIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { data, error: messageError } = await db
        .from("support_email_messages")
        .select("thread_id, gmail_message_id, body_text")
        .in("thread_id", chunk)
        .eq("direction", "in");
      if (messageError) throw messageError;
      return data ?? [];
    })).flat();

    const messageByThread = new Map<string, { gmailMessageId: string; optOut: boolean }>();
    for (const m of messageRows) {
      messageByThread.set(String(m.thread_id), {
        gmailMessageId: String(m.gmail_message_id),
        // Replies land at the top; 4k is plenty and keeps the scan cheap.
        optOut: looksLikeOptOut(String(m.body_text ?? "").slice(0, 4_000)),
      });
    }

    const eligible = threads.filter((t) => messageByThread.get(t.id) && !messageByThread.get(t.id)!.optOut);
    const optedOut = threads.filter((t) => messageByThread.get(t.id)?.optOut);
    const total = eligible.length;

    if (!confirm) {
      return NextResponse.json({
        dryRun: true,
        filter,
        matching: total,
        matchedBeforeOptOutExclusion: threads.length,
        excludedForOptOutLanguage: optedOut.length,
        note: matchedBySql > threads.length
          ? `Gmail batchModify caps at ${GMAIL_BATCH_MODIFY_LIMIT} per run. Re-run to continue.`
          : "One run covers the whole cohort.",
        confirmUrl: `/api/admin/support-email/bulk-handle?category=${category}&confirm=${total}`,
        sample: eligible.slice(0, 15).map((t) => ({
          subject: t.subject,
          summary: t.agent_summary,
          confidence: t.agent_confidence,
        })),
        // Surfaced, not hidden: these need a do_not_contact decision, which is
        // exactly why they must not be swept.
        heldForOptOutReview: optedOut.slice(0, 25).map((t) => ({
          subject: t.subject,
          summary: t.agent_summary,
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
    if (!eligible.length) return NextResponse.json({ ok: true, processed: 0, note: "Nothing to do." });

    const threadIds = eligible.map((t) => t.id);
    const gmailMessageIds = threadIds.map((id) => messageByThread.get(id)!.gmailMessageId);
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

    // Anything beyond the per-run page cap is still queued. Threads held back
    // for opt-out language are NOT remaining work for this endpoint -- they are
    // deliberately excluded and need a human do_not_contact decision.
    const remaining = Math.max(0, matchedBySql - threads.length);
    return NextResponse.json({
      ok: true,
      processed: threadIds.length,
      gmailMessagesMarkedRead: gmailMessageIds.length,
      heldForOptOutReview: optedOut.length,
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
