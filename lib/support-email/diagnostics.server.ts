import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptGmailToken } from "./crypto.server";
import {
  GmailApiError, gmailAccessToken, getGmailProfile, getGmailMessageSyncMetadata,
  listGmailHistory, listGmailMessages,
} from "./gmail.server";

// Intentionally independent of sync.server/classify.server: this probe performs
// SELECTs and Gmail reads only, without leases, checkpoints, or classification.
export async function diagnoseSupportGmail(db: SupabaseClient) {
  const { data: mailboxes, error } = await db.from("support_mailboxes")
    .select("id,email,encrypted_refresh_token,gmail_history_id,last_sync_at,sync_status")
    .not("encrypted_refresh_token", "is", null);
  if (error) throw error;
  const results = [];
  for (const mailbox of mailboxes ?? []) {
    try {
      const token = await gmailAccessToken(decryptGmailToken(mailbox.encrypted_refresh_token));
      const [profile, page, history, latestStored] = await Promise.all([
        getGmailProfile(token),
        listGmailMessages(token, null, 20, "newer_than:30d"),
        mailbox.gmail_history_id ? listGmailHistory(token, mailbox.gmail_history_id, null, 100) : null,
        db.from("support_email_messages").select("internal_date")
          .eq("mailbox_id", mailbox.id).order("internal_date", { ascending: false }).limit(1),
      ]);
      if (latestStored.error) throw latestStored.error;
      const ids = (page.messages ?? []).map(message => message.id);
      const stored = ids.length ? await db.from("support_email_messages").select("gmail_message_id")
        .eq("mailbox_id", mailbox.id).in("gmail_message_id", ids) : { data: [], error: null };
      if (stored.error) throw stored.error;
      const storedIds = new Set((stored.data ?? []).map(message => message.gmail_message_id));
      const samples = [];
      // Small sequential samples avoid adding a burst to a recovering mailbox.
      for (const id of ids.slice(0, 5)) {
        const message = await getGmailMessageSyncMetadata(token, id);
        samples.push({ id, internalDate: message.internalDate
          ? new Date(Number(message.internalDate)).toISOString() : null,
          labels: message.labelIds ?? [], stored: storedIds.has(id) });
      }
      const records = history?.history ?? [];
      results.push({
        mailboxId: mailbox.id, email: mailbox.email, syncStatus: mailbox.sync_status,
        connectedGmailAddress: profile.emailAddress,
        storedCursor: mailbox.gmail_history_id, gmailCursor: profile.historyId,
        gmailMessages: profile.messagesTotal, latestStoredAt: latestStored.data?.[0]?.internal_date ?? null,
        recentSampleSize: ids.length, recentSampleMissing: ids.filter(id => !storedIds.has(id)).length,
        recentSamples: samples,
        history: { records: records.length, first: records[0]?.id ?? null,
          last: records.at(-1)?.id ?? null, hasMore: Boolean(history?.nextPageToken) },
      });
    } catch (error) {
      results.push({ mailboxId: mailbox.id, error: error instanceof Error ? error.message : String(error),
        ...(error instanceof GmailApiError ? { status: error.status, reasons: error.reasons } : {}) });
    }
  }
  return { readOnly: true, checkedAt: new Date().toISOString(), mailboxes: results };
}
