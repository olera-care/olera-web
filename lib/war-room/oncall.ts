/**
 * Cortex on call: "@Cortex" in any Slack channel, on a bug or a change.
 *
 * TJ, 2026-10-08, after Ces reported in #careseeker-support that texts to
 * Connections leads showed only "Admin Reply": "this will be a powerful
 * addition for people to be able to just @Cortex and have Cortex handle it,
 * like an on-call engineer."
 *
 * The loop, one Slack thread per case (cortex_oncall_cases, migration 276):
 * 1. Anyone mentions Cortex. It reads the thread, screenshots included, and
 *    replies with what it thinks is happening, a plan, and its questions.
 * 2. People answer in the thread. Each new mention revises the plan.
 * 3. Only TJ's "@Cortex go" starts a build: a Claude Code routine that ends at
 *    a pull request to staging. Merging stays with TJ.
 * 4. A cron finds the pull request by the marker in its body and posts it back
 *    in the thread, then says so again when TJ merges it.
 *
 * Pure. The Slack and database side is oncall.server.ts; the checks are
 * scripts/check-cortex-oncall.ts.
 */

export type OncallStatus = "waiting" | "queued" | "building" | "pr_open" | "merged" | "failed" | "dropped";

export type OncallCase = {
  id: string;
  channel: string;
  thread_ts: string;
  requested_by: string | null;
  status: OncallStatus;
  plan: string | null;
  brief: string | null;
  session_url: string | null;
  pr_url: string | null;
  build_started_at: string | null;
  /** When the current plan was posted. */
  plan_at: string | null;
  /** When the cron found the current pull request. */
  pr_opened_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Slack's mention markup, "<@U0123ABC>" or "<@U0123ABC|cortex>". */
const MENTION = /<@[A-Z0-9]+(?:\|[^>]*)?>/g;

/** The message without mentions or the Claude connector's footer. */
export function oncallText(text: string | undefined): string {
  return (text ?? "")
    .replace(/\n?\s*_?\*?Sent using\*?_?\s+\S*Claude\S*\s*$/i, "")
    .replace(MENTION, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** True when the text mentions this user id (the bot). */
export function mentionsUser(text: string | undefined, userId: string | null | undefined): boolean {
  if (!text || !userId) return false;
  return new RegExp(`<@${userId}(?:\\|[^>]*)?>`).test(text);
}

/**
 * "go", "build it", "go ahead", "ship it", "approved". The whole message is the
 * verdict, as with dm-intake's isApproval: "go ahead and check the logs first"
 * is a request, not a go.
 */
const GO_WORD = "(?:go|go ahead|go for it|build it|build|ship it|approved?|do it|yes)";
const GO = new RegExp(`^${GO_WORD}(?:[\\s,.!-]+(?:${GO_WORD}|please|thanks|thank you|cortex))*[\\s.!]*$`, "i");
export function isGoCommand(text: string): boolean {
  return GO.test(text.replace(/[*_~`]/g, "").trim());
}

/** "stop", "cancel", "drop it", "never mind". Closes the case. */
const STOP = /^(?:stop|cancel|drop it|drop this|never ?mind|nvm|close (?:it|this))[\s.!]*$/i;
export function isStopCommand(text: string): boolean {
  return STOP.test(text.replace(/[*_~`]/g, "").trim());
}

/** Put in every pull request body so the cron can find it again. */
export function oncallMarker(caseId: string): string {
  return `cortex-oncall:${caseId}`;
}

/** The pull request a case points at, from a body that carries the marker. */
export function bodyHasMarker(body: string | null | undefined, caseId: string): boolean {
  return Boolean(body && body.includes(oncallMarker(caseId)));
}

/** A thread as the planner reads it: oldest first, one line per message, names not ids. */
export type ThreadMessage = { user: string | null; name: string | null; text: string; ts: string; fromCortex: boolean; files: number };

export function threadTranscript(messages: ThreadMessage[], maxChars = 12_000): string {
  const lines = messages.map((message) => {
    const who = message.fromCortex ? "Cortex" : message.name ?? "Someone";
    const files = message.files ? ` [${message.files} attachment${message.files === 1 ? "" : "s"}]` : "";
    return `${who}: ${oncallText(message.text) || "(no text)"}${files}`;
  });
  // The newest lines matter most when the thread is long: keep the opening
  // message (the report) and as much of the end as fits.
  let out = lines.join("\n");
  if (out.length <= maxChars && lines.length) return out;
  const head = lines[0] ?? "";
  const tail: string[] = [];
  let size = head.length + 40;
  for (let i = lines.length - 1; i > 0; i -= 1) {
    if (size + lines[i].length + 1 > maxChars) break;
    tail.unshift(lines[i]);
    size += lines[i].length + 1;
  }
  out = [head, "(earlier messages left out)", ...tail].join("\n");
  return out;
}

/** Who may start a build. */
export function canStartBuild(userId: string | null | undefined, founderId: string | null | undefined): boolean {
  return Boolean(userId && founderId && userId === founderId);
}

export function planFooter(founderId: string | null): string {
  const tj = founderId ? `<@${founderId}>` : "TJ";
  return `_Answer here and mention me to update the plan. ${tj}: say "@Cortex go" to build it. I stop at a pull request to staging; merging stays with you._`;
}

export function notFounderGoReply(founderId: string | null): string {
  const tj = founderId ? `<@${founderId}>` : "TJ";
  return `Only TJ can start a build. ${tj}, say "@Cortex go" here when the plan looks right.`;
}

export function buildStartedReply(sessionUrl: string): string {
  return `Building it now in a Claude Code session (<${sessionUrl}|watch it here>). It checks its own work, then opens a pull request to staging. I'll post the PR in this thread when it's up.`;
}

export function prOpenedReply(prUrl: string, prNumber: number | null, title: string | null): string {
  return `Pull request is up: <${prUrl}|${prNumber ? `#${prNumber}` : "open it"}>${title ? ` ${title}` : ""}. It goes to staging only after TJ reviews and merges it.`;
}

export function mergedReply(prUrl: string, prNumber: number | null): string {
  return `TJ merged <${prUrl}|${prNumber ? `#${prNumber}` : "the pull request"}> into staging. It reaches the live site with the next promotion to production.`;
}

/** With a PR up, "go" builds a follow-up only from a plan posted after the PR. */
export function planRevisedSincePr(c: Pick<OncallCase, "plan_at" | "pr_opened_at">): boolean {
  if (!c.plan_at) return false;
  if (!c.pr_opened_at) return true;
  return Date.parse(c.plan_at) > Date.parse(c.pr_opened_at);
}

export function queuedReply(): string {
  return "Another build is running, so this one is queued. It starts on its own when that one finishes, and I'll post here.";
}

/** How long a build may run with no pull request before the case says so. */
export const BUILD_TIMEOUT_MS = 3 * 60 * 60 * 1000;

export function buildTimedOutReply(sessionUrl: string | null): string {
  return `The build session ran for three hours without opening a pull request, so I've stopped waiting on it.${sessionUrl ? ` <${sessionUrl}|The session> shows where it got to.` : ""} Mention me with what to change and I'll plan it again.`;
}

/** The message the routine receives: what to build and how to mark the PR. */
export function routinePayload(args: { caseId: string; brief: string; channelName: string | null; permalink: string | null }): string {
  return [
    `Cortex on-call case ${args.caseId}${args.channelName ? `, raised in #${args.channelName}` : ""}.`,
    args.permalink ? `Slack thread: ${args.permalink}` : null,
    `Put this exact line in the pull request body so Cortex can find it: ${oncallMarker(args.caseId)}`,
    "",
    args.brief,
  ].filter((line) => line !== null).join("\n");
}
