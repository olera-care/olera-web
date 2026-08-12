import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { decryptGmailToken } from "@/lib/support-email/crypto.server";
import {
  getGmailLabel,
  gmailAccessToken,
  listGmailLabels,
  type GmailLabel,
} from "@/lib/support-email/gmail.server";
import type { SupportMailboxRow } from "@/lib/support-email/sync.server";

export const maxDuration = 300;

/**
 * Read-only inventory of the support mailbox's Gmail labels.
 *
 * Deliberately has no delete path. Deleting a Gmail label is irreversible and
 * strips the grouping from every message that carried it, so the decision needs
 * names, volumes and recency in front of a human first. This endpoint supplies
 * exactly that; removal happens in Gmail's own Settings > Labels UI, or behind a
 * separate guarded endpoint once the keep/kill list is agreed.
 */

const SYSTEM_PREFIXES = ["CATEGORY_"];
const SYSTEM_LABELS = new Set([
  "INBOX", "UNREAD", "SENT", "DRAFT", "SPAM", "TRASH", "STARRED", "IMPORTANT",
  "CHAT", "YELLOW_STAR", "RED_STAR", "BLUE_STAR", "ORANGE_STAR", "GREEN_STAR", "PURPLE_STAR",
]);

function isSystem(label: GmailLabel): boolean {
  if (label.type === "system") return true;
  if (SYSTEM_LABELS.has(label.id)) return true;
  return SYSTEM_PREFIXES.some((prefix) => label.id.startsWith(prefix));
}

async function chunked<T, R>(values: T[], size: number, fn: (chunk: T[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < values.length; i += size) out.push(...(await fn(values.slice(i, i + size))));
  return out;
}

export async function GET(_request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const db = getServiceClient();
    const { data: mailboxes, error: mailboxError } = await db
      .from("support_mailboxes")
      .select("*")
      .not("encrypted_refresh_token", "is", null)
      .limit(1);
    if (mailboxError) throw mailboxError;
    const mailbox = (mailboxes ?? [])[0] as SupportMailboxRow | undefined;
    if (!mailbox?.encrypted_refresh_token) throw new Error("No connected Gmail mailbox.");
    const accessToken = await gmailAccessToken(decryptGmailToken(mailbox.encrypted_refresh_token));

    const { labels } = await listGmailLabels(accessToken);
    const userLabels = (labels ?? []).filter((l) => !isSystem(l));

    // Counts come from labels.get; 5 at a time keeps it well inside rate limits.
    const detailed = await chunked(userLabels, 5, (chunk) =>
      Promise.all(chunk.map(async (l) => {
        try {
          return await getGmailLabel(accessToken, l.id);
        } catch {
          return l;
        }
      })));

    // Recency comes from Olera's synced copy: Gmail exposes no "last used".
    const usage = new Map<string, { threads: number; newest: string }>();
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await db
        .from("support_email_threads")
        .select("gmail_label_ids, last_message_at")
        .order("last_message_at", { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (error) throw error;
      if (!data?.length) break;
      for (const row of data) {
        const when = String(row.last_message_at);
        for (const id of (row.gmail_label_ids ?? []) as string[]) {
          const current = usage.get(id);
          if (!current) usage.set(id, { threads: 1, newest: when });
          else {
            current.threads += 1;
            if (when > current.newest) current.newest = when;
          }
        }
      }
      if (data.length < PAGE) break;
    }

    const now = Date.now();
    const rows = detailed.map((label) => {
      const seen = usage.get(label.id);
      const daysSinceUsed = seen ? Math.floor((now - new Date(seen.newest).getTime()) / 86_400_000) : null;
      const messages = label.messagesTotal ?? 0;
      return {
        id: label.id,
        name: label.name,
        messagesTotal: messages,
        messagesUnread: label.messagesUnread ?? 0,
        threadsInOleraCopy: seen?.threads ?? 0,
        lastUsed: seen?.newest?.slice(0, 10) ?? null,
        daysSinceUsed,
        verdict: messages === 0
          ? "EMPTY - safe to delete"
          : daysSinceUsed === null
            ? "not seen in Olera's synced copy"
            : daysSinceUsed > 365
              ? "STALE >1yr"
              : daysSinceUsed > 180
                ? "stale >6mo"
                : "active",
      };
    }).sort((a, b) => b.messagesTotal - a.messagesTotal);

    return NextResponse.json({
      mailbox: mailbox.email,
      totalLabels: (labels ?? []).length,
      userLabels: rows.length,
      empty: rows.filter((r) => r.messagesTotal === 0).length,
      staleOverOneYear: rows.filter((r) => (r.daysSinceUsed ?? 0) > 365).length,
      note: "Read-only. Nothing is modified. Deleting a label is irreversible and strips it from every message that carried it.",
      labels: rows,
    });
  } catch (err) {
    console.error("[support-email] label inventory failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read labels" },
      { status: 500 },
    );
  }
}
