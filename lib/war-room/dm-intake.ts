/**
 * Which DM messages Cortex reads, and what they say. Pure, so it can be tested.
 *
 * Until 2026-09-26 any message carrying a `bot_id`, an `app_id` or a `subtype`
 * was treated as Cortex's own and dropped, to stop Cortex reading its own
 * replies. That also dropped two messages from the founder:
 *
 *   "Approved, go ahead" (Sep 25), posted from his account through the Claude
 *   Slack connector. It carries the connector's `app_id`, not ours.
 *
 *   "whats the deal with Rudy here?" (Sep 26), with a screenshot. A message with
 *   a file has `subtype: "file_share"`.
 *
 * Neither got a reply, and the approval never registered. Now a message is ours
 * only if it came from this app (`app_id` equals the event's `api_app_id`) or
 * from our bot user; and of the subtypes, only a plain message and a file share
 * are read.
 */

export type DmEvent = {
  user?: string;
  bot_id?: string;
  app_id?: string;
  subtype?: string;
  text?: string;
  files?: DmFile[];
};

export type DmFile = {
  id?: string;
  name?: string;
  mimetype?: string;
  size?: number;
  url_private?: string;
  url_private_download?: string;
};

export type DmEnvelope = {
  api_app_id?: string;
  authorizations?: Array<{ user_id?: string; is_bot?: boolean }>;
  event?: DmEvent;
};

const READABLE_SUBTYPES = new Set([undefined, "", "file_share"]);

/** Posted by this app or its bot user: never founder input. */
export function isOwnMessage(envelope: DmEnvelope): boolean {
  const event = envelope.event ?? {};
  const ownApp = envelope.api_app_id;
  // Without our own app id we cannot tell whose app it was, so any app-posted
  // message is treated as ours. Safe in the direction that matters: a missed
  // founder message is recoverable, a reply loop costs money every turn.
  if (!ownApp) return Boolean(event.app_id || event.bot_id);
  if (event.app_id && event.app_id === ownApp) return true;
  // Deliberately not "any bot_id": a message posted from the founder's account
  // by another app (the Claude connector) may carry that app's bot id, and the
  // exact shape could not be checked from here. Our own replies always carry
  // our app id and our bot user; other bots' posts arrive as subtype
  // "bot_message", which isReadableDm already refuses.
  const botUsers = (envelope.authorizations ?? []).filter((auth) => auth.is_bot).map((auth) => auth.user_id);
  return Boolean(event.user && botUsers.includes(event.user));
}

/** A DM Cortex should read: a person's message, text or file share, with something in it. */
export function isReadableDm(envelope: DmEnvelope): boolean {
  const event = envelope.event ?? {};
  if (isOwnMessage(envelope)) return false;
  if (!READABLE_SUBTYPES.has(event.subtype)) return false;
  return Boolean(cleanDmText(event.text) || imageFiles(event.files).length);
}

/** The message as he wrote it, without the "Sent using Claude" line the connector appends. */
export function cleanDmText(text: string | undefined): string {
  return (text ?? "")
    .replace(/\n?\s*_?\*?Sent using\*?_?\s+\S*Claude\S*\s*$/i, "")
    .trim();
}

/** Images worth showing the model: small enough to send inline. */
export function imageFiles(files: DmFile[] | undefined): DmFile[] {
  return (files ?? []).filter((file) => (file.mimetype ?? "").startsWith("image/")
    && (file.size ?? 0) <= 5 * 1024 * 1024
    && Boolean(file.url_private_download || file.url_private));
}

/**
 * An approval, and only an approval. Short, and leading with the verdict:
 * "Approved, go ahead", "approve", "yes, approve it", "go ahead", "ship it".
 * Anything longer, or a question, is conversation.
 */
export function isApproval(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length > 60 || clean.includes("?")) return false;
  return /^(yes[,.!]?\s+)?(approved?|approve it|go ahead|ship it|do it)\b/i.test(clean);
}
