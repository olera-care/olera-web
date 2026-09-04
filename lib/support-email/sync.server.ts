import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptGmailToken } from "./crypto.server";
import {
  GmailApiError,
  getGmailAttachment,
  getGmailMessage,
  getGmailMessageMetadata,
  getGmailProfile,
  gmailAccessToken,
  listGmailHistory,
  listGmailMessages,
  normalizeGmailMessage,
  watchGmail,
  type NormalizedGmailMessage,
} from "./gmail.server";
import { classifySupportThread } from "./classify.server";
import type { MatchedSupportIdentity } from "./types";

export interface SupportMailboxRow {
  id: string;
  email: string;
  encrypted_refresh_token: string | null;
  gmail_history_id: string | null;
  watch_expiration: string | null;
  full_sync_page_token: string | null;
  full_sync_complete: boolean;
  full_sync_messages_imported: number;
  sync_status: "disconnected" | "backfilling" | "connected" | "error";
  last_error: string | null;
  updated_at: string;
}

// Gmail can return several messages from one conversation in the same API
// page. Serialize writes for that conversation so an older refresh cannot
// finish last and overwrite the aggregate produced by a newer one. Different
// Gmail threads still import concurrently.
const threadImports = new Map<string, Promise<unknown>>();
const MAX_TRANSCRIPT_BYTES = 500_000;
const SYNC_LEASE_MS = 6 * 60 * 1_000;
const ACTIVE_SYNC_LEASE = "__olera_support_sync_active__";
// Fetch several records, then process a prefix bounded by changed messages.
// A bulk operation is one atomic record and must never be split across cursors.
const HISTORY_PAGE_SIZE = 100;
const HISTORY_MESSAGE_BUDGET = 100;
const HISTORY_DRAIN_MS = 180_000;
const MAX_HISTORY_CHUNKS = 500;

function isTranscriptAttachment(attachment: NormalizedGmailMessage["attachments"][number]): boolean {
  return /\.(?:srt|txt|vtt)$/i.test(attachment.filename) ||
    ["application/x-subrip", "text/plain", "text/vtt"].includes(attachment.mimeType);
}

async function appendRemoteVoicemailTranscripts(
  accessToken: string,
  message: NormalizedGmailMessage,
): Promise<NormalizedGmailMessage> {
  if (!/voicemail|voice message|missed call/i.test(message.subject)) return message;
  const transcripts = message.attachments.filter((attachment) =>
    attachment.attachmentId && attachment.size <= MAX_TRANSCRIPT_BYTES && isTranscriptAttachment(attachment),
  );
  if (!transcripts.length) return message;

  const bodies = await Promise.all(transcripts.map(async (attachment) => {
    try {
      const response = await getGmailAttachment(accessToken, message.gmailMessageId, String(attachment.attachmentId));
      const bytes = Buffer.from(response.data, "base64url");
      if (bytes.byteLength > MAX_TRANSCRIPT_BYTES) return null;
      const text = bytes.toString("utf8").trim();
      return text ? `[Attached transcript: ${attachment.filename}]\n${text}` : null;
    } catch (err) {
      console.error(`[support-email] could not read transcript attachment ${attachment.filename}:`, err);
      return null;
    }
  }));
  const additions = bodies.filter((value): value is string => Boolean(value));
  if (!additions.length) return message;
  // Put the transcript first so it remains in the classifier's bounded
  // conversation window even when the notification carries a long footer.
  return { ...message, bodyText: [...additions, message.bodyText].filter(Boolean).join("\n\n").slice(0, 500_000) };
}

async function serializeThreadImport<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = threadImports.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  threadImports.set(key, current);
  try {
    return await current;
  } finally {
    if (threadImports.get(key) === current) threadImports.delete(key);
  }
}

async function matchIdentity(db: SupabaseClient, email: string | null): Promise<MatchedSupportIdentity> {
  if (!email) return { profileId: null, profileType: null, profileName: null, providerId: null };
  const normalized = email.toLowerCase();
  const { data: profiles } = await db
    .from("business_profiles")
    .select("id, type, display_name, source_provider_id")
    .ilike("email", normalized)
    .limit(5);
  const profile = (profiles ?? []).find((p) => p.type === "family") ?? profiles?.[0];
  if (profile) {
    return {
      profileId: String(profile.id),
      profileType: profile.type === "family" ? "family" : profile.type === "student" ? "student" : "provider",
      profileName: profile.display_name ? String(profile.display_name) : null,
      providerId: profile.source_provider_id ? String(profile.source_provider_id) : null,
    };
  }
  const { data: provider } = await db
    .from("olera-providers")
    .select("provider_id, provider_name")
    .ilike("email", normalized)
    .not("deleted", "is", true)
    .limit(1)
    .maybeSingle();
  return provider
    ? { profileId: null, profileType: "provider", profileName: provider.provider_name ? String(provider.provider_name) : null, providerId: String(provider.provider_id) }
    : { profileId: null, profileType: null, profileName: null, providerId: null };
}

async function ensureThread(db: SupabaseClient, mailbox: SupportMailboxRow, message: NormalizedGmailMessage): Promise<string> {
  const { data: existing } = await db
    .from("support_email_threads")
    .select("id")
    .eq("mailbox_id", mailbox.id)
    .eq("gmail_thread_id", message.gmailThreadId)
    .maybeSingle();
  if (existing?.id) return String(existing.id);
  const { data, error } = await db
    .from("support_email_threads")
    .insert({
      mailbox_id: mailbox.id,
      gmail_thread_id: message.gmailThreadId,
      subject: message.subject,
      snippet: message.snippet,
      gmail_label_ids: message.labelIds,
      last_message_at: message.internalDate,
      unread: message.labelIds.includes("UNREAD"),
    })
    .select("id")
    .single();
  if (error) {
    // A duplicate insert race is harmless; resolve the winner.
    const { data: winner, error: winnerError } = await db
      .from("support_email_threads")
      .select("id")
      .eq("mailbox_id", mailbox.id)
      .eq("gmail_thread_id", message.gmailThreadId)
      .single();
    if (winnerError || !winner) throw error;
    return String(winner.id);
  }
  return String(data.id);
}

function dbMessage(mailboxId: string, threadId: string, m: NormalizedGmailMessage) {
  return {
    mailbox_id: mailboxId,
    thread_id: threadId,
    gmail_message_id: m.gmailMessageId,
    rfc_message_id: m.rfcMessageId,
    direction: m.direction,
    from_email: m.fromEmail,
    from_name: m.fromName,
    to_emails: m.toEmails,
    cc_emails: m.ccEmails,
    reply_to: m.replyTo,
    subject: m.subject,
    snippet: m.snippet,
    body_text: m.bodyText,
    gmail_label_ids: m.labelIds,
    raw_headers: m.rawHeaders,
    internal_date: m.internalDate,
    has_attachments: m.attachments.length > 0,
    attachments: m.attachments,
    list_unsubscribe: m.listUnsubscribe,
    list_unsubscribe_post: m.listUnsubscribePost,
    auto_submitted: m.autoSubmitted,
    updated_at: new Date().toISOString(),
  };
}

function fromDbMessage(m: Record<string, unknown>): NormalizedGmailMessage {
  return {
    gmailMessageId: String(m.gmail_message_id),
    gmailThreadId: "",
    rfcMessageId: m.rfc_message_id ? String(m.rfc_message_id) : null,
    direction: m.direction === "out" ? "out" : "in",
    fromEmail: m.from_email ? String(m.from_email) : null,
    fromName: m.from_name ? String(m.from_name) : null,
    toEmails: (m.to_emails as string[]) ?? [],
    ccEmails: (m.cc_emails as string[]) ?? [],
    replyTo: m.reply_to ? String(m.reply_to) : null,
    subject: String(m.subject ?? "(no subject)"),
    snippet: String(m.snippet ?? ""),
    bodyText: String(m.body_text ?? ""),
    labelIds: (m.gmail_label_ids as string[]) ?? [],
    rawHeaders: (m.raw_headers as Record<string, string>) ?? {},
    internalDate: String(m.internal_date),
    attachments: (m.attachments as NormalizedGmailMessage["attachments"]) ?? [],
    listUnsubscribe: (m.list_unsubscribe as string[]) ?? [],
    listUnsubscribePost: Boolean(m.list_unsubscribe_post),
    autoSubmitted: m.auto_submitted ? String(m.auto_submitted) : null,
  };
}

async function refreshThread(db: SupabaseClient, mailbox: SupportMailboxRow, threadId: string): Promise<void> {
  const [{ data: rows, error }, { data: current }] = await Promise.all([
    db.from("support_email_messages").select("*").eq("thread_id", threadId).order("internal_date", { ascending: true }),
    db.from("support_email_threads").select("*").eq("id", threadId).single(),
  ]);
  if (error || !rows?.length || !current) {
    if (error) throw error;
    return;
  }
  const messages = rows.map((r) => fromDbMessage(r as Record<string, unknown>));
  const latest = messages[messages.length - 1];
  const latestInbound = [...messages].reverse().find((m) => m.direction === "in") ?? null;
  const identity = await matchIdentity(db, latestInbound?.fromEmail ?? null);
  const participants = [...new Set(messages.flatMap((m) => [m.fromEmail, ...m.toEmails, ...m.ccEmails]).filter((v): v is string => Boolean(v)))];
  const latestChanged = current.analysis_message_id !== latest.gmailMessageId;
  const labelsChanged = JSON.stringify([...(current.gmail_label_ids ?? [])].sort()) !== JSON.stringify([...latest.labelIds].sort());
  const inActiveInbox = latest.labelIds.includes("INBOX") && !latest.labelIds.includes("SPAM") && !latest.labelIds.includes("TRASH");
  let state = String(current.state);
  // UNREAD is asymmetric. Losing it means someone merely read the mail in Gmail
  // and must never undo a deliberate handled/noise/snoozed/escalated decision.
  // Gaining it is an explicit "bring this back" gesture, and is the only way to
  // reopen a thread from Gmail's side.
  const settled = ["handled", "noise", "snoozed", "escalated"].includes(String(current.state));
  const gainedUnread = latest.labelIds.includes("UNREAD") &&
    !(current.gmail_label_ids ?? []).includes("UNREAD");
  if (latestChanged || labelsChanged) {
    if (latest.labelIds.includes("SPAM") || latest.labelIds.includes("TRASH")) state = "noise";
    // Replying always means handled: we engaged with it.
    else if (latest.direction === "out") state = "handled";
    // Leaving the inbox also settles a thread, but must not overwrite `noise`.
    // Noise is a classification ("this was junk"), not a workflow step, and
    // archiving is precisely what happens to noise -- so the old behaviour
    // guaranteed the Noise view drained into Handled and the label was lost.
    else if (!inActiveInbox) state = current.state === "noise" ? "noise" : "handled";
    // Otherwise only a genuinely new message, or a deliberate mark-as-unread,
    // reopens a settled conversation.
    else if (latestChanged || gainedUnread || !settled) state = "needs_reply";
  }

  const baseUpdate: Record<string, unknown> = {
    subject: latest.subject,
    snippet: latest.snippet || latest.bodyText.slice(0, 240),
    participants,
    gmail_label_ids: latest.labelIds,
    last_message_at: latest.internalDate,
    message_count: messages.length,
    unread: latest.labelIds.includes("UNREAD"),
    state,
    matched_profile_id: identity.profileId,
    matched_profile_type: identity.profileType,
    matched_profile_name: identity.profileName,
    matched_provider_id: identity.providerId,
    updated_at: new Date().toISOString(),
  };

  const staleVoicemailAnalysis = current.category === "voicemail" &&
    current.agent_reason === "The subject identifies this as a voice-channel message.";
  if ((latestChanged || staleVoicemailAnalysis) && latest.direction === "in" && inActiveInbox) {
    const recommendation = await classifySupportThread({ messages, identity });
    Object.assign(baseUpdate, {
      category: recommendation.category,
      priority: recommendation.priority,
      agent_summary: recommendation.summary,
      agent_reason: recommendation.reason,
      agent_confidence: recommendation.confidence,
      suggested_action: recommendation.suggestedAction,
      suggested_owner: recommendation.suggestedOwner,
      suggested_draft: recommendation.suggestedDraft,
      agent_risk_flags: recommendation.riskFlags,
      analyzed_at: new Date().toISOString(),
      analysis_message_id: latest.gmailMessageId,
    });
    if (recommendation.category === "marketing" && recommendation.confidence >= 0.98) {
      baseUpdate.state = "noise";
    }
    const { error: recommendationError } = await db.from("support_email_recommendations").upsert({
      thread_id: threadId,
      gmail_message_id: latest.gmailMessageId,
      category: recommendation.category,
      priority: recommendation.priority,
      summary: recommendation.summary,
      reason: recommendation.reason,
      confidence: recommendation.confidence,
      suggested_action: recommendation.suggestedAction,
      suggested_owner: recommendation.suggestedOwner,
      suggested_draft: recommendation.suggestedDraft,
      risk_flags: recommendation.riskFlags,
      model: recommendation.model,
    }, { onConflict: "thread_id,gmail_message_id" });
    if (recommendationError) throw recommendationError;
  } else if (latestChanged) {
    baseUpdate.analysis_message_id = latest.gmailMessageId;
  }
  const { error: updateError } = await db.from("support_email_threads").update(baseUpdate).eq("id", threadId);
  if (updateError) throw updateError;
}

async function refreshStaleVoicemails(
  db: SupabaseClient,
  mailbox: SupportMailboxRow,
  accessToken: string,
  limit = 5,
): Promise<number> {
  const { data, error } = await db
    .from("support_email_threads")
    .select("id, analysis_message_id")
    .eq("mailbox_id", mailbox.id)
    .eq("category", "voicemail")
    .eq("agent_reason", "The subject identifies this as a voice-channel message.")
    .in("state", ["needs_reply", "escalated"])
    .order("last_message_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  await inBatches(data ?? [], 2, async (thread) => {
    if (thread.analysis_message_id) {
      await importGmailMessage(db, mailbox, accessToken, String(thread.analysis_message_id));
    } else {
      await refreshThread(db, mailbox, String(thread.id));
    }
  });
  return data?.length ?? 0;
}

export async function importGmailMessage(db: SupabaseClient, mailbox: SupportMailboxRow, accessToken: string, gmailMessageId: string): Promise<string | null> {
  let raw;
  try {
    raw = await getGmailMessage(accessToken, gmailMessageId);
  } catch (err) {
    // A message can disappear between history/list and get (trash emptied,
    // draft replaced). It must not poison the rest of an otherwise valid page.
    if (err instanceof GmailApiError && err.status === 404) return null;
    // Some real Gmail messages contain MIME payloads that Gmail's own
    // `format=full` renderer cannot return. Preserve their headers, labels,
    // thread identity, and cursor position through the metadata representation
    // rather than letting one malformed body poison the whole mailbox sync.
    try {
      raw = await getGmailMessageMetadata(accessToken, gmailMessageId);
      console.warn(`[support-email] imported Gmail message ${gmailMessageId} from metadata after full payload failed`);
    } catch (metadataError) {
      if (metadataError instanceof GmailApiError && metadataError.status === 404) return null;
      throw metadataError;
    }
  }
  // Draft resources are editable containers, not conversation events. Olera
  // tracks its Gmail draft ID on the thread and imports the canonical SENT
  // message only after a human sends it.
  if (raw.labelIds?.includes("DRAFT")) return null;
  const normalized = await appendRemoteVoicemailTranscripts(accessToken, normalizeGmailMessage(raw, mailbox.email));
  return serializeThreadImport(`${mailbox.id}:${normalized.gmailThreadId}`, async () => {
    const threadId = await ensureThread(db, mailbox, normalized);
    const { error } = await db
      .from("support_email_messages")
      .upsert(dbMessage(mailbox.id, threadId, normalized), { onConflict: "mailbox_id,gmail_message_id" });
    if (error) throw error;
    await refreshThread(db, mailbox, threadId);
    return threadId;
  });
}

async function inBatches<T>(values: T[], size: number, fn: (value: T) => Promise<void>) {
  for (let i = 0; i < values.length; i += size) {
    // Promise.all rejects before its siblings finish. Releasing the mailbox
    // lease at that point lets a new worker overlap those still-active writes.
    const results = await Promise.allSettled(values.slice(i, i + size).map(fn));
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }
}

interface GmailLabelDelta {
  added: Set<string>;
  removed: Set<string>;
}

function recordLabelDelta(
  deltas: Map<string, GmailLabelDelta>,
  messageId: string,
  added: string[] = [],
  removed: string[] = [],
) {
  const delta = deltas.get(messageId) ?? { added: new Set<string>(), removed: new Set<string>() };
  for (const label of added) {
    delta.removed.delete(label);
    delta.added.add(label);
  }
  for (const label of removed) {
    delta.added.delete(label);
    delta.removed.add(label);
  }
  deltas.set(messageId, delta);
}

async function applyGmailLabelChanges(
  db: SupabaseClient,
  mailbox: SupportMailboxRow,
  accessToken: string,
  deltas: Map<string, GmailLabelDelta>,
): Promise<number> {
  const ids = [...deltas.keys()];
  if (!ids.length) return 0;
  const rows: Array<{
    id: string;
    thread_id: string;
    gmail_message_id: string;
    gmail_label_ids: string[];
    direction: "in" | "out";
    internal_date: string;
  }> = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db
      .from("support_email_messages")
      .select("id, thread_id, gmail_message_id, gmail_label_ids, direction, internal_date")
      .eq("mailbox_id", mailbox.id)
      .in("gmail_message_id", ids.slice(i, i + 100));
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
  }
  const found = new Set(rows.map((row) => row.gmail_message_id));
  const threadIds = [...new Set(rows.map((row) => row.thread_id))];
  const threadRows: Array<{ id: string; state: string; gmail_label_ids: string[]; last_message_at: string }> = [];
  for (let i = 0; i < threadIds.length; i += 100) {
    const { data, error } = await db.from("support_email_threads")
      .select("id, state, gmail_label_ids, last_message_at")
      .in("id", threadIds.slice(i, i + 100));
    if (error) throw error;
    threadRows.push(...((data ?? []) as typeof threadRows));
  }
  const threadsById = new Map(threadRows.map((thread) => [thread.id, thread]));
  const latestLabels = new Map<string, { labels: string[]; direction: "in" | "out" }>();
  const messageUpdates = new Map<string, { labels: string[]; ids: string[] }>();
  for (const row of rows) {
    const delta = deltas.get(row.gmail_message_id);
    if (!delta) continue;
    const labels = new Set(row.gmail_label_ids ?? []);
    delta.added.forEach((label) => labels.add(label));
    delta.removed.forEach((label) => labels.delete(label));
    const nextLabels = [...labels];
    if (JSON.stringify([...row.gmail_label_ids].sort()) !== JSON.stringify([...nextLabels].sort())) {
      // Bulk Gmail actions commonly put hundreds of identical label changes
      // into one history record. Group identical resulting label sets so one
      // cleanup does not become one database request per message.
      const key = JSON.stringify([...nextLabels].sort());
      const group = messageUpdates.get(key);
      if (group) group.ids.push(row.id);
      else messageUpdates.set(key, { labels: nextLabels, ids: [row.id] });
    }
    const thread = threadsById.get(row.thread_id);
    if (thread && new Date(row.internal_date).getTime() === new Date(thread.last_message_at).getTime()) {
      latestLabels.set(row.thread_id, { labels: nextLabels, direction: row.direction });
    }
  }
  const changedAt = new Date().toISOString();
  for (const { labels, ids: rowIds } of messageUpdates.values()) {
    for (let i = 0; i < rowIds.length; i += 200) {
      const { error } = await db.from("support_email_messages").update({
        gmail_label_ids: labels,
        updated_at: changedAt,
      }).in("id", rowIds.slice(i, i + 200));
      if (error) throw error;
    }
  }
  await inBatches(ids.filter((id) => !found.has(id)), 10, async (id) => {
    await importGmailMessage(db, mailbox, accessToken, id);
  });
  const threadUpdates = new Map<string, {
    payload: { gmail_label_ids: string[]; unread: boolean; state: string; updated_at: string };
    ids: string[];
  }>();
  for (const [threadId, latest] of latestLabels) {
    const thread = threadsById.get(threadId);
    if (!thread) continue;
    const inActiveInbox = latest.labels.includes("INBOX") &&
      !latest.labels.includes("SPAM") && !latest.labels.includes("TRASH");
    const settled = ["handled", "noise", "snoozed", "escalated"].includes(thread.state);
    const gainedUnread = latest.labels.includes("UNREAD") && !thread.gmail_label_ids.includes("UNREAD");
    let state = thread.state;
    if (latest.labels.includes("SPAM") || latest.labels.includes("TRASH")) state = "noise";
    else if (latest.direction === "out") state = "handled";
    else if (!inActiveInbox) state = state === "noise" ? "noise" : "handled";
    else if (gainedUnread || !settled) state = "needs_reply";
    const payload = {
      gmail_label_ids: latest.labels,
      unread: latest.labels.includes("UNREAD"),
      state,
      updated_at: changedAt,
    };
    const key = JSON.stringify(payload);
    const group = threadUpdates.get(key);
    if (group) group.ids.push(threadId);
    else threadUpdates.set(key, { payload, ids: [threadId] });
  }
  for (const { payload, ids: affectedThreadIds } of threadUpdates.values()) {
    for (let i = 0; i < affectedThreadIds.length; i += 200) {
      const { error } = await db.from("support_email_threads").update(payload)
        .in("id", affectedThreadIds.slice(i, i + 200));
      if (error) throw error;
    }
  }
  console.log("[support-email] applied Gmail label changes", {
    mailbox: mailbox.email,
    deltas: ids.length,
    matchedMessages: rows.length,
    missingMessages: ids.length - found.size,
    messageUpdateGroups: messageUpdates.size,
    threadUpdateGroups: threadUpdates.size,
  });
  return rows.length;
}

async function removeDeletedGmailMessages(
  db: SupabaseClient,
  mailbox: SupportMailboxRow,
  gmailMessageIds: string[],
): Promise<number> {
  if (!gmailMessageIds.length) return 0;
  const threadIds = new Set<string>();
  let deleted = 0;
  for (let i = 0; i < gmailMessageIds.length; i += 100) {
    const ids = gmailMessageIds.slice(i, i + 100);
    const { data: rows, error: readError } = await db
      .from("support_email_messages")
      .select("id, thread_id")
      .eq("mailbox_id", mailbox.id)
      .in("gmail_message_id", ids);
    if (readError) throw readError;
    if (!rows?.length) continue;
    rows.forEach((row) => threadIds.add(String(row.thread_id)));
    const { error: deleteError } = await db
      .from("support_email_messages")
      .delete()
      .in("id", rows.map((row) => row.id));
    if (deleteError) throw deleteError;
    deleted += rows.length;
  }

  await inBatches([...threadIds], 10, async (threadId) => {
    const { count, error: countError } = await db
      .from("support_email_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);
    if (countError) throw countError;
    if ((count ?? 0) === 0) {
      const { error: threadError } = await db.from("support_email_threads").delete().eq("id", threadId);
      if (threadError) throw threadError;
    } else {
      await refreshThread(db, mailbox, threadId);
    }
  });
  return deleted;
}

export async function backfillMailboxPage(db: SupabaseClient, mailbox: SupportMailboxRow, accessToken: string) {
  if (mailbox.full_sync_complete) return { imported: 0, complete: true };
  const page = await listGmailMessages(accessToken, mailbox.full_sync_page_token, 100);
  const ids = [...new Set((page.messages ?? []).map((m) => m.id))];
  let imported = 0;
  // Gmail reads and unrelated conversations run concurrently. Imports from the
  // same Gmail thread are serialized inside importGmailMessage.
  await inBatches(ids, 10, async (id) => {
    if (await importGmailMessage(db, mailbox, accessToken, id)) imported += 1;
  });
  const complete = !page.nextPageToken;
  const { error } = await db.from("support_mailboxes").update({
    full_sync_page_token: page.nextPageToken ?? null,
    full_sync_complete: complete,
    full_sync_messages_imported: Number(mailbox.full_sync_messages_imported ?? 0) + imported,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", mailbox.id);
  if (error) throw error;
  return { imported, complete, remainingEstimate: page.resultSizeEstimate ?? null };
}

export async function syncMailboxHistory(db: SupabaseClient, mailbox: SupportMailboxRow, accessToken: string) {
  if (!mailbox.gmail_history_id) return { imported: 0, deleted: 0, labelsUpdated: 0, historyId: null, hasMore: false };
  let finalHistoryId = mailbox.gmail_history_id;
  const fullMessageIds = new Set<string>();
  const deletedIds = new Set<string>();
  const labelDeltas = new Map<string, GmailLabelDelta>();
  let hasMore = false;
  try {
    const page = await listGmailHistory(accessToken, mailbox.gmail_history_id, null, HISTORY_PAGE_SIZE);
    const histories: NonNullable<typeof page.history> = [];
    let changedMessages = 0;
    const includedMessageIds = new Set<string>();
    for (const record of page.history ?? []) {
      const recordIds = new Set([
        ...(record.messages ?? []).map((message) => message.id),
        ...(record.messagesAdded ?? []).map((change) => change.message.id),
        ...(record.messagesDeleted ?? []).map((change) => change.message.id),
        ...(record.labelsAdded ?? []).map((change) => change.message.id),
        ...(record.labelsRemoved ?? []).map((change) => change.message.id),
      ]);
      // Preserve workflow transitions when the same message changes again.
      // Collapsing UNREAD added then removed would leave a handled thread
      // closed, even though the explicit unread action should reopen it.
      if (histories.length && (changedMessages + recordIds.size > HISTORY_MESSAGE_BUDGET ||
        [...recordIds].some((id) => includedMessageIds.has(id)))) break;
      histories.push(record);
      changedMessages += recordIds.size;
      recordIds.forEach((id) => includedMessageIds.add(id));
    }
    for (const history of histories) {
      const hasTypedChanges = Boolean(
        history.messagesAdded?.length || history.messagesDeleted?.length ||
        history.labelsAdded?.length || history.labelsRemoved?.length,
      );
      for (const added of history.messagesAdded ?? []) fullMessageIds.add(added.message.id);
      for (const removed of history.messagesDeleted ?? []) deletedIds.add(removed.message.id);
      for (const changed of history.labelsAdded ?? []) {
        if (changed.labelIds?.length) recordLabelDelta(labelDeltas, changed.message.id, changed.labelIds);
        else fullMessageIds.add(changed.message.id);
      }
      for (const changed of history.labelsRemoved ?? []) {
        if (changed.labelIds?.length) recordLabelDelta(labelDeltas, changed.message.id, [], changed.labelIds);
        else fullMessageIds.add(changed.message.id);
      }
      if (!hasTypedChanges) {
        for (const message of history.messages ?? []) fullMessageIds.add(message.id);
      }
    }
    hasMore = Boolean(page.nextPageToken) || histories.length < (page.history?.length ?? 0);
    finalHistoryId = hasMore
      ? histories.at(-1)?.id ?? mailbox.gmail_history_id
      : page.historyId ?? histories.at(-1)?.id ?? mailbox.gmail_history_id;
  } catch (err) {
    if (err instanceof GmailApiError && err.status === 404) {
      // Gmail discarded the cursor. A complete mailbox walk is the only safe
      // recovery; never silently jump over the missing interval.
      const profile = await getGmailProfile(accessToken);
      const { error: resetError } = await db.from("support_mailboxes").update({
        gmail_history_id: profile.historyId,
        full_sync_page_token: null,
        full_sync_complete: false,
        full_sync_messages_imported: 0,
        sync_status: "backfilling",
        updated_at: new Date().toISOString(),
      }).eq("id", mailbox.id);
      if (resetError) throw resetError;
      return { imported: 0, deleted: 0, labelsUpdated: 0, historyId: profile.historyId, hasMore: false, restartedFullSync: true };
    }
    throw err;
  }
  // A message deleted from Gmail is no longer available through get(), so it
  // must be removed explicitly from the operating copy. Specific delete events
  // win if the generic history.messages array also mentioned the same ID.
  for (const id of deletedIds) {
    fullMessageIds.delete(id);
    labelDeltas.delete(id);
  }
  for (const id of fullMessageIds) labelDeltas.delete(id);
  const deleted = await removeDeletedGmailMessages(db, mailbox, [...deletedIds]);
  let imported = 0;
  await inBatches([...fullMessageIds], 10, async (id) => {
    if (await importGmailMessage(db, mailbox, accessToken, id)) imported += 1;
  });
  const labelsUpdated = await applyGmailLabelChanges(db, mailbox, accessToken, labelDeltas);
  const { error: cursorError } = await db.from("support_mailboxes").update({
    gmail_history_id: finalHistoryId,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", mailbox.id);
  if (cursorError) throw cursorError;
  console.log("[support-email] history chunk", {
    mailbox: mailbox.email,
    from: mailbox.gmail_history_id,
    to: finalHistoryId,
    hasMore,
    fullMessages: fullMessageIds.size,
    labelsUpdated,
    deleted,
  });
  return { imported, deleted, labelsUpdated, historyId: finalHistoryId, hasMore };
}

export async function syncSupportMailbox(db: SupabaseClient, mailbox: SupportMailboxRow) {
  const { data: fresh, error: freshError } = await db.from("support_mailboxes").select("*").eq("id", mailbox.id).single();
  if (freshError || !fresh) throw freshError ?? new Error(`Mailbox ${mailbox.email} no longer exists`);
  const current = fresh as SupportMailboxRow;
  if (current.last_error === ACTIVE_SYNC_LEASE && new Date(current.updated_at).getTime() > Date.now() - SYNC_LEASE_MS) {
    return skippedSync(current);
  }
  const { data: claimed, error: claimError } = await db.from("support_mailboxes").update({
    sync_status: "backfilling",
    // An internal marker distinguishes an actively owned lease from the
    // user-facing "Catching up" state between bounded worker runs.
    last_error: ACTIVE_SYNC_LEASE,
    updated_at: new Date().toISOString(),
  }).eq("id", current.id).eq("updated_at", current.updated_at).select("*").maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return skippedSync(current);
  const activeMailbox = claimed as SupportMailboxRow;
  try {
    const drainDeadline = Date.now() + HISTORY_DRAIN_MS;
    if (!activeMailbox.encrypted_refresh_token) throw new Error(`Mailbox ${activeMailbox.email} is not connected`);
    const refreshToken = decryptGmailToken(activeMailbox.encrypted_refresh_token);
    const accessToken = await gmailAccessToken(refreshToken);
    const history = {
      imported: 0, deleted: 0, labelsUpdated: 0,
      historyId: activeMailbox.gmail_history_id,
      hasMore: true, restartedFullSync: false, chunks: 0,
    };
    do {
      const previousCursor = history.historyId;
      const chunk = await syncMailboxHistory(db, { ...activeMailbox, gmail_history_id: previousCursor }, accessToken);
      history.imported += chunk.imported;
      history.deleted += chunk.deleted;
      history.labelsUpdated += chunk.labelsUpdated;
      history.historyId = chunk.historyId;
      history.hasMore = chunk.hasMore;
      history.restartedFullSync = Boolean(chunk.restartedFullSync);
      history.chunks += 1;
      if (chunk.hasMore && chunk.historyId === previousCursor) {
        throw new Error("Gmail history returned more changes without advancing its cursor");
      }
    } while (history.hasMore && !history.restartedFullSync &&
      Date.now() < drainDeadline && history.chunks < MAX_HISTORY_CHUNKS);
    // syncMailboxHistory may have reset the persisted backfill after Gmail
    // expired its history cursor. Mirror that reset locally in this same worker
    // run instead of letting the stale mailbox object skip recovery.
    const backfillMailbox = history.restartedFullSync
      ? {
          ...activeMailbox,
          gmail_history_id: history.historyId,
          full_sync_page_token: null,
          full_sync_complete: false,
          full_sync_messages_imported: 0,
        }
      : activeMailbox;
    const backfill = Date.now() < drainDeadline
      ? await backfillMailboxPage(db, backfillMailbox, accessToken)
      : { imported: 0, complete: backfillMailbox.full_sync_complete };
    // Earlier releases intentionally recognized voicemails with a fast subject
    // rule, which left the operating brief generic. Revisit a small bounded batch
    // on each worker run so existing history becomes transcript-aware without a
    // costly one-shot mailbox reclassification.
    const refreshedVoicemails = history.hasMore || Date.now() >= drainDeadline ? 0 : await refreshStaleVoicemails(db, activeMailbox, accessToken);
    const expirationMs = activeMailbox.watch_expiration ? new Date(activeMailbox.watch_expiration).getTime() : 0;
    const topic = process.env.GMAIL_PUBSUB_TOPIC;
    let watchRenewed = false;
    if (topic && expirationMs < Date.now() + 48 * 60 * 60 * 1000) {
      const watched = await watchGmail(accessToken, topic);
      const { error: watchError } = await db.from("support_mailboxes").update({
        watch_expiration: new Date(Number(watched.expiration)).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", activeMailbox.id);
      if (watchError) throw watchError;
      watchRenewed = true;
    }
    const { error: finalError } = await db.from("support_mailboxes").update({
      sync_status: history.hasMore || !backfill.complete ? "backfilling" : "connected",
      last_sync_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", activeMailbox.id);
    if (finalError) throw finalError;
    return { history, backfill, refreshedVoicemails, watchRenewed };
  } catch (error) {
    // Only the worker that acquired the lease reports failure. Callers must
    // not overwrite a lock owned by another run when a pre-claim read fails.
    await db.from("support_mailboxes").update({
      sync_status: "error",
      last_error: error instanceof Error ? error.message : String(error),
      updated_at: new Date().toISOString(),
    }).eq("id", activeMailbox.id).eq("last_error", ACTIVE_SYNC_LEASE);
    throw error;
  }
}

function skippedSync(mailbox: SupportMailboxRow) {
  return {
    skipped: "already_syncing" as const,
    history: { imported: 0, deleted: 0, labelsUpdated: 0, historyId: mailbox.gmail_history_id, hasMore: true, chunks: 0 },
    backfill: { imported: 0, complete: mailbox.full_sync_complete },
    refreshedVoicemails: 0,
    watchRenewed: false,
  };
}
