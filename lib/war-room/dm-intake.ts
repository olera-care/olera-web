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
  return Boolean(cleanDmText(event.text) || (event.files ?? []).some((file) => (file.mimetype ?? "").startsWith("image/")));
}

/** The message as he wrote it, without the "Sent using Claude" line the connector appends. */
export function cleanDmText(text: string | undefined): string {
  return (text ?? "")
    .replace(/\n?\s*_?\*?Sent using\*?_?\s+\S*Claude\S*\s*$/i, "")
    .trim();
}

/**
 * Formats the model reads, and a size that survives base64. The API caps an
 * image at 5 MB after encoding, and base64 adds a third, so a 4.9 MB screenshot
 * that passed a 5 MB check would fail the whole answer, not just the image.
 */
const MODEL_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
export const MAX_IMAGE_BYTES = Math.floor((5 * 1024 * 1024 * 3) / 4) - 1024;

/** Images worth showing the model. */
export function imageFiles(files: DmFile[] | undefined): DmFile[] {
  return (files ?? []).filter((file) => MODEL_IMAGE_TYPES.has((file.mimetype ?? "").toLowerCase())
    && (file.size ?? 0) <= MAX_IMAGE_BYTES
    && Boolean(file.url_private_download || file.url_private));
}

/** Image files he sent that the model will not see, so the reply can say so. */
export function skippedImages(files: DmFile[] | undefined): DmFile[] {
  const shown = new Set(imageFiles(files));
  return (files ?? []).filter((file) => (file.mimetype ?? "").startsWith("image/") && !shown.has(file));
}

/**
 * An approval, and only an approval: the whole message is the verdict.
 * "Approved, go ahead", "approve", "yes, approve it", "Go ahead.", "ship it".
 *
 * Whole-message, not leading-word. Approving code work dispatches the
 * executor, and "go ahead and pull the numbers" starts with "go ahead" while
 * asking for something else entirely.
 */
const VERDICT = "(?:approved?|approve it|go ahead|ship it|do it|yes)";
const APPROVAL = new RegExp(`^${VERDICT}(?:[\\s,.!-]+(?:${VERDICT}|please|thanks|thank you))*[\\s.!]*$`, "i");
export function isApproval(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length > 60) return false;
  // "yes" alone answers whatever was last said; it approves only with a verdict word.
  if (/^yes[\s.!]*$/i.test(clean)) return false;
  return APPROVAL.test(clean);
}

type ApprovedLike = { title: string; action_kind?: string | null };
type ApprovalOutcome =
  | { approved: true; dispatch: { dispatched: boolean; detail: string } }
  | { approved: false; error: string };

/**
 * What approving did, in plain words. On 2026-09-26 the reply read "Approved:
 * <title>. Repository executor is not configured", an internal error string,
 * and when nothing was waiting the reply named an unrelated condition.
 */
export function approvalReply(proposal: ApprovedLike, outcome: ApprovalOutcome): string {
  if (!outcome.approved) return `I couldn't approve *${proposal.title}*: ${outcome.error}.`;
  if (outcome.dispatch.dispatched) {
    return `Approved: *${proposal.title}*. I've started the build; a pull request will show up for review.`;
  }
  if (proposal.action_kind === "code") {
    return /not configured/i.test(outcome.dispatch.detail)
      ? `Approved: *${proposal.title}*. It won't start by itself yet: the build runner isn't connected in production, so this needs someone to pick it up.`
      : `Approved: *${proposal.title}*. The build didn't start: ${outcome.dispatch.detail}`;
  }
  return `Approved: *${proposal.title}*. It's now with the owner named on it.`;
}

export function nothingWaitingReply(last: { title: string; approved_at: string } | null): string {
  if (!last) return "Nothing is waiting for your approval.";
  const when = new Date(last.approved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  return `Nothing is waiting for your approval. The last thing you approved was *${last.title}*, on ${when}.`;
}
