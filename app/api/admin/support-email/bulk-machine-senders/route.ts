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
 * Clear mail that no human ever needs to read, keyed on WHO SENT IT.
 *
 * The other sweeps filter on the classifier's category and confidence. That
 * works for cold solicitation but not for account and service noise, because
 * the classifier marks all of it security/urgent -- 231 security threads split
 * 125 urgent / 106 high, with nothing lower. Priority carries no signal there.
 *
 * Sender does. These addresses are machines whose entire output is receipts,
 * bounces, login codes and product notices. No confidence score is consulted,
 * so there is no classification judgement to get wrong.
 *
 * Unlike bulk-handle this also archives, because for a bounce notification
 * "read but still in the inbox" is not a state anyone wants.
 */

// Every address here must be homogeneous: if a sender ever carries something a
// human needs, it does not belong on this list. Counts are from the audit that
// produced it, as a tripwire -- a wild deviation means the sender changed.
const MACHINE_SENDERS: Array<{ address: string; what: string }> = [
  { address: "billing@ahrefs.com", what: "payment receipts" },
  { address: "se@ahrefs.com", what: "backlink reports" },
  { address: "michal.krajewski@xfive.co", what: "Zapier integration failure alerts" },
  { address: "mailer-daemon@googlemail.com", what: "bounce notifications" },
  { address: "noreply@tm.openai.com", what: "ChatGPT login codes" },
  { address: "notify@mail.notion.so", what: "Notion device-login notices" },
  { address: "notify@updates.notion.so", what: "Notion device-login notices" },
  { address: "adctr@microsoft.com", what: "ad billing reminders" },
  { address: "no-reply@eztexting.com", what: "EZ Texting account notices" },
  { address: "support@bearly.ai", what: "Bearly login tokens" },
  { address: "noreply@airtable.com", what: "Airtable notifications" },
];

/**
 * Deliberately NOT on the list. Each looks mechanical and is not:
 *
 *  no-reply@accounts.google.com  one alert reports a passkey added without authorisation
 *  no-reply@zoom.us              carries all 519 voicemails, plus the Sri Lanka sign-in
 *  support@ahrefs.com            13 unrequested "change your email" requests -- takeover pattern
 *  noreply@business.facebook.com the classifier calls these phishing, which is worth seeing
 *  noreply@appsheet.com          carries the fake "law firm" IP-claim campaign
 *
 * Adding any of these needs a human to look at the mail first, not a code review.
 */
const DELIBERATELY_EXCLUDED = [
  "no-reply@accounts.google.com",
  "no-reply@zoom.us",
  "support@ahrefs.com",
  "noreply@business.facebook.com",
  "noreply@appsheet.com",
];

// Belt and braces on top of the sender allowlist. A machine sender should never
// produce these, so if one does, something has changed and a human should look.
const NEVER_TOUCH_CATEGORIES = ["care_seeker", "legal", "voicemail"];
const VOICEMAIL_SUBJECTS = /voicemail|voice message|missed call/i;
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

  const confirm = request.nextUrl.searchParams.get("confirm");
  const allowed = new Set(MACHINE_SENDERS.map((s) => s.address));

  try {
    const db = getServiceClient();

    // Sender lives on the message, so start there and resolve back to threads.
    const senderRows = await chunked([...allowed], 25, async (chunk) => {
      const { data, error } = await db
        .from("support_email_messages")
        .select("thread_id, from_email")
        .in("from_email", chunk)
        .eq("direction", "in");
      if (error) throw error;
      return data ?? [];
    });
    const senderByThread = new Map<string, string>();
    for (const row of senderRows) {
      if (!senderByThread.has(String(row.thread_id))) {
        senderByThread.set(String(row.thread_id), String(row.from_email).toLowerCase());
      }
    }

    const candidateIds = [...senderByThread.keys()];
    const threads = (await chunked(candidateIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { data, error } = await db
        .from("support_email_threads")
        .select("id, subject, category, state, unread, gmail_label_ids, matched_profile_id, matched_provider_id")
        .in("id", chunk)
        .in("state", ["needs_reply", "escalated"]);
      if (error) throw error;
      return data ?? [];
    })) as Array<{
      id: string; subject: string; category: string; state: string; unread: boolean;
      gmail_label_ids: string[] | null; matched_profile_id: string | null; matched_provider_id: string | null;
    }>;

    const skipped: Array<{ subject: string; why: string }> = [];
    const eligible = threads.filter((t) => {
      if (NEVER_TOUCH_CATEGORIES.includes(t.category)) {
        skipped.push({ subject: t.subject, why: `category ${t.category}` }); return false;
      }
      if (VOICEMAIL_SUBJECTS.test(t.subject)) {
        skipped.push({ subject: t.subject, why: "voicemail subject" }); return false;
      }
      if (t.matched_profile_id || t.matched_provider_id) {
        skipped.push({ subject: t.subject, why: "matches an Olera identity" }); return false;
      }
      return true;
    }).slice(0, MAX_THREADS_PER_RUN);

    const total = eligible.length;
    const bySender: Record<string, number> = {};
    for (const t of eligible) {
      const s = senderByThread.get(t.id) ?? "(unknown)";
      bySender[s] = (bySender[s] ?? 0) + 1;
    }

    if (!confirm) {
      return NextResponse.json({
        dryRun: true,
        action: "mark handled + remove INBOX/UNREAD in Gmail",
        basis: "sender allowlist only -- no classifier category or confidence is consulted",
        matching: total,
        bySender,
        senders: MACHINE_SENDERS,
        deliberatelyExcluded: DELIBERATELY_EXCLUDED,
        skipped: skipped.slice(0, 20),
        skippedCount: skipped.length,
        confirmUrl: `/api/admin/support-email/bulk-machine-senders?confirm=${total}`,
        sample: eligible.slice(0, 15).map((t) => ({
          subject: t.subject, category: t.category, from: senderByThread.get(t.id),
        })),
      });
    }

    if (Number(confirm) !== total) {
      return NextResponse.json({
        error: "Confirmation count does not match the current cohort. Re-run the dry run and use the fresh number.",
        expected: total, received: Number(confirm),
      }, { status: 409 });
    }
    if (!total) return NextResponse.json({ ok: true, processed: 0, note: "Nothing from these senders is queued." });

    const threadIds = eligible.map((t) => t.id);
    const gmailMessageIds = await chunked(threadIds, SUPABASE_IN_CHUNK, async (chunk) => {
      const { data, error } = await db
        .from("support_email_messages").select("gmail_message_id").in("thread_id", chunk);
      if (error) throw error;
      return (data ?? []).map((m) => String(m.gmail_message_id));
    });

    const { data: mailboxes, error: mailboxError } = await db
      .from("support_mailboxes").select("*").not("encrypted_refresh_token", "is", null).limit(1);
    if (mailboxError) throw mailboxError;
    const mailbox = (mailboxes ?? [])[0] as SupportMailboxRow | undefined;
    if (!mailbox?.encrypted_refresh_token) throw new Error("No connected Gmail mailbox.");
    const accessToken = await gmailAccessToken(decryptGmailToken(mailbox.encrypted_refresh_token));

    // Gmail first; it is the source of truth.
    await chunked(gmailMessageIds, GMAIL_BATCH_MODIFY_LIMIT, async (chunk) => {
      await batchModifyGmailMessages(accessToken, chunk, { removeLabelIds: ["INBOX", "UNREAD"] });
      return [];
    });

    const now = new Date().toISOString();
    const actor = admin.email;
    // Mirror the label change locally, grouped by label set, so the archive
    // endpoint does not re-offer these.
    const byLabelSet = new Map<string, { labels: string[]; ids: string[] }>();
    for (const t of eligible) {
      const stripped = (t.gmail_label_ids ?? []).filter((l) => l !== "INBOX" && l !== "UNREAD");
      const key = JSON.stringify(stripped);
      const group = byLabelSet.get(key);
      if (group) group.ids.push(t.id);
      else byLabelSet.set(key, { labels: stripped, ids: [t.id] });
    }
    for (const { labels, ids } of byLabelSet.values()) {
      await chunked(ids, SUPABASE_IN_CHUNK, async (chunk) => {
        const { error } = await db.from("support_email_threads").update({
          state: "handled", unread: false, gmail_label_ids: labels,
          handled_at: now, handled_by: actor, snoozed_until: null, updated_at: now,
        }).in("id", chunk);
        if (error) throw error;
        return [];
      });
    }

    await chunked(threadIds, 500, async (chunk) => {
      const { error } = await db.from("support_email_actions").insert(
        chunk.map((threadId) => ({
          thread_id: threadId, actor, action: "bulk_machine_sender_archive",
          details: { sender: senderByThread.get(threadId) ?? null },
        })),
      );
      if (error) console.error("[support-email] machine-sender audit insert failed:", error);
      return [];
    });
    await logAuditAction({
      adminUserId: admin.id,
      action: "support_email_bulk_machine_senders",
      targetType: "support_email_thread",
      targetId: `machine-senders:${threadIds.length}`,
      details: { bySender, processed: threadIds.length, gmailMessages: gmailMessageIds.length },
    });

    return NextResponse.json({
      ok: true,
      processed: threadIds.length,
      gmailMessagesModified: gmailMessageIds.length,
      bySender,
      skippedForSafety: skipped.length,
      note: "Archived. Nothing was deleted; all of it stays in All Mail, and marking one unread in Gmail returns it to Needs attention.",
    });
  } catch (err) {
    console.error("[support-email] machine sender sweep failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Machine sender sweep failed" },
      { status: 500 },
    );
  }
}
