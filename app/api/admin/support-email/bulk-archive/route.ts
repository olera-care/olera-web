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
 * File already-decided conversations out of the Gmail inbox.
 *
 * `mark_handled` and the automatic noise classifier both deliberately leave the
 * INBOX label alone, so a decision made in Olera never shrinks the real inbox.
 * The result is ~1,400 threads Olera considers finished that still sit in Gmail,
 * several hundred of them unread.
 *
 * This makes NO classification decision. It only acts on threads whose state is
 * already `handled` or `noise` -- the decision was taken earlier, by a human
 * clicking through or by the rule-based classifier. Threads still awaiting a
 * decision (`needs_reply`, `escalated`, `snoozed`) are never touched.
 *
 * Dry run by default. Execution needs ?confirm=<exact thread count>.
 * Reversible: the thread keeps every other label and stays in All Mail, and
 * marking it unread in Gmail returns it to Needs attention via `gainedUnread`.
 */

const ARCHIVABLE_STATES = ["handled", "noise"];
const SUPABASE_IN_CHUNK = 200;
const MAX_THREADS_PER_RUN = 2_000;

async function chunked<T, R>(values: T[], size: number, fn: (chunk: T[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < values.length; i += size) out.push(...(await fn(values.slice(i, i + size))));
  return out;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const confirm = params.get("confirm");
  const limit = Math.min(Number(params.get("limit") ?? MAX_THREADS_PER_RUN), MAX_THREADS_PER_RUN);
  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }

  try {
    const db = getServiceClient();
    const { data: rows, count, error } = await db
      .from("support_email_threads")
      .select("id, subject, state, category, unread, agent_confidence, handled_by", { count: "exact" })
      .in("state", ARCHIVABLE_STATES)
      .contains("gmail_label_ids", ["INBOX"])
      .order("last_message_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const threads = (rows ?? []) as Array<{
      id: string;
      subject: string;
      state: string;
      category: string;
      unread: boolean;
      agent_confidence: number | null;
      handled_by: string | null;
    }>;
    const matchedBySql = count ?? 0;
    const total = threads.length;

    const byState = ARCHIVABLE_STATES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = threads.filter((t) => t.state === s).length;
      return acc;
    }, {});
    const breakdown = {
      byState,
      unread: threads.filter((t) => t.unread).length,
      handledByAHuman: threads.filter((t) => t.handled_by).length,
      // Noise is overwhelmingly the rule-based path (SPAM/TRASH, Auto-Submitted,
      // bulk precedence), which emits 0.99 -- not a model judgement call.
      classifiedAtOrAbove98: threads.filter((t) => Number(t.agent_confidence) >= 0.98).length,
    };

    if (!confirm) {
      return NextResponse.json({
        dryRun: true,
        action: "remove INBOX + UNREAD in Gmail; Olera state is left exactly as-is",
        filter: { state: ARCHIVABLE_STATES, mustCarryInboxLabel: true },
        matching: total,
        matchedBySql,
        breakdown,
        note: matchedBySql > total
          ? `Capped at ${MAX_THREADS_PER_RUN} threads per run. Re-run to continue.`
          : "One run covers everything already decided.",
        confirmUrl: `/api/admin/support-email/bulk-archive?confirm=${total}`,
        sample: threads.slice(0, 15).map((t) => ({
          subject: t.subject,
          state: t.state,
          category: t.category,
          unread: t.unread,
        })),
      });
    }

    if (Number(confirm) !== total) {
      return NextResponse.json({
        error: "Confirmation count does not match the current set. Re-run the dry run and use the fresh number.",
        expected: total,
        received: Number(confirm),
      }, { status: 409 });
    }
    if (!total) return NextResponse.json({ ok: true, processed: 0, note: "Inbox already clear of decided threads." });

    const threadIds = threads.map((t) => t.id);
    // Unlike the bulk-handle sweep these threads are not single-message, so
    // every message in each conversation has to be modified for Gmail to treat
    // the whole thread as archived.
    const gmailMessageIds = await chunked(threadIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { data, error: messageError } = await db
        .from("support_email_messages")
        .select("gmail_message_id")
        .in("thread_id", chunk);
      if (messageError) throw messageError;
      return (data ?? []).map((m) => String(m.gmail_message_id));
    });
    if (!gmailMessageIds.length) throw new Error("No Gmail messages found for the selected threads.");

    const { data: mailboxes, error: mailboxError } = await db
      .from("support_mailboxes")
      .select("*")
      .not("encrypted_refresh_token", "is", null)
      .limit(1);
    if (mailboxError) throw mailboxError;
    const mailbox = (mailboxes ?? [])[0] as SupportMailboxRow | undefined;
    if (!mailbox?.encrypted_refresh_token) throw new Error("No connected Gmail mailbox.");
    const accessToken = await gmailAccessToken(decryptGmailToken(mailbox.encrypted_refresh_token));

    // Gmail first: it is the source of truth. A failure after this point leaves
    // threads archived-but-stale locally, which the next sync reconciles.
    await chunked(gmailMessageIds, GMAIL_BATCH_MODIFY_LIMIT, async (chunk) => {
      await batchModifyGmailMessages(accessToken, chunk, { removeLabelIds: ["INBOX", "UNREAD"] });
      return [];
    });

    const now = new Date().toISOString();
    const actor = admin.email;
    await chunked(threadIds, SUPABASE_IN_CHUNK, async (chunk) => {
      // State is intentionally untouched: handled stays handled, noise stays
      // noise. Only the Gmail-derived flags change.
      const { error: updateError } = await db
        .from("support_email_threads")
        .update({ unread: false, updated_at: now })
        .in("id", chunk);
      if (updateError) throw updateError;
      return [];
    });

    await chunked(threadIds, 500, async (chunk) => {
      const { error: actionError } = await db.from("support_email_actions").insert(
        chunk.map((threadId) => ({
          thread_id: threadId,
          actor,
          action: "bulk_archive",
          details: { reason: "already decided; removed from Gmail inbox" },
        })),
      );
      if (actionError) console.error("[support-email] bulk archive audit insert failed:", actionError);
      return [];
    });
    await logAuditAction({
      adminUserId: admin.id,
      action: "support_email_bulk_archive",
      targetType: "support_email_thread",
      targetId: `archive:${threadIds.length}`,
      details: { breakdown, threads: threadIds.length, gmailMessages: gmailMessageIds.length },
    });

    const remaining = Math.max(0, matchedBySql - total);
    return NextResponse.json({
      ok: true,
      threadsArchived: threadIds.length,
      gmailMessagesModified: gmailMessageIds.length,
      remaining,
      note: remaining > 0
        ? `Re-run the dry run and confirm again for the remaining ${remaining}.`
        : "Inbox cleared of everything already decided. Nothing was deleted; all of it stays in All Mail.",
    });
  } catch (err) {
    console.error("[support-email] bulk archive failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk archive failed" },
      { status: 500 },
    );
  }
}
