import type { SupabaseClient } from "@supabase/supabase-js";
import { answerFounderQuestion } from "./conversation.server";
import { imageFiles, type DmFile } from "./dm-intake";
import { downloadSlackFile } from "./attachments.server";
import { slackApi } from "./sources.server";
import { postAsCortex } from "./team-messages.server";
import { fireRoutine } from "./visualize.server";
import {
  BUILD_TIMEOUT_MS,
  bodyHasMarker,
  buildStartedReply,
  buildTimedOutReply,
  canStartBuild,
  isGoCommand,
  isStopCommand,
  mergedReply,
  planRevisedSincePr,
  queuedReply,
  notFounderGoReply,
  oncallText,
  planFooter,
  prOpenedReply,
  routinePayload,
  threadTranscript,
  type OncallCase,
  type ThreadMessage,
} from "./oncall";

/**
 * Cortex on call, the Slack and database side. See ./oncall.ts for the loop
 * and the rules; this file only carries them out.
 */

const TABLE = "cortex_oncall_cases";

/**
 * Cortex's own Slack user id. An event's authorizations name the bot only when
 * the bot token is the one Slack picked; with a user token installed too it can
 * name a person, and then a mention in #cortex would be answered twice.
 */
let botUserIdCache: string | null = null;
export async function cortexBotUserId(): Promise<string | null> {
  if (botUserIdCache) return botUserIdCache;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  const auth = await slackApi<{ user_id?: string }>(token, "auth.test", {}).catch(() => null);
  botUserIdCache = auth?.user_id ?? null;
  return botUserIdCache;
}

function founderUserId(): string | null {
  const id = process.env.WAR_ROOM_BRIEF_SLACK_USER_ID?.trim() || "";
  return /^[UW][A-Z0-9]{2,}$/i.test(id) ? id : null;
}

async function getCase(db: SupabaseClient, channel: string, threadTs: string): Promise<OncallCase | null> {
  const { data, error } = await db.from(TABLE).select("*").eq("channel", channel).eq("thread_ts", threadTs).maybeSingle();
  if (error) throw new Error(error.code === "42P01" ? "the on-call table isn't there yet (migration 276)" : error.message);
  return (data as OncallCase | null) ?? null;
}

type RawSlackMessage = { user?: string; bot_id?: string; app_id?: string; text?: string; ts?: string; files?: DmFile[] };

/** The thread, oldest first, with names, plus the image files in it (newest last). */
async function readThread(token: string, channel: string, threadTs: string, botUserId: string | null, ownAppId: string | null) {
  const replies = await slackApi<{ messages?: RawSlackMessage[] }>(token, "conversations.replies", { channel, ts: threadTs, limit: 60 });
  const raw = replies.messages ?? [];
  const names = new Map<string, string | null>();
  await Promise.all([...new Set(raw.map((m) => m.user).filter((u): u is string => Boolean(u)))].map(async (userId) => {
    const info = await slackApi<{ user?: { real_name?: string; profile?: { real_name?: string; display_name?: string } } }>(token, "users.info", { user: userId }).catch(() => null);
    names.set(userId, info?.user?.profile?.display_name || info?.user?.real_name || info?.user?.profile?.real_name || null);
  }));
  const messages: ThreadMessage[] = raw.map((m) => ({
    user: m.user ?? null,
    name: m.user ? names.get(m.user) ?? null : null,
    text: m.text ?? "",
    ts: m.ts ?? "",
    fromCortex: Boolean((botUserId && m.user === botUserId) || (ownAppId && m.app_id === ownAppId)),
    files: (m.files ?? []).length,
  }));
  const images = raw.flatMap((m) => imageFiles(m.files));
  return { messages, images };
}

async function downloadImages(token: string, files: DmFile[]) {
  // The newest three: the latest screenshot is the one being talked about.
  const picked = files.slice(-3);
  const results = await Promise.allSettled(picked.map(async (file) => ({
    mediaType: (file.mimetype ?? "image/png").toLowerCase(),
    data: Buffer.from(await downloadSlackFile(token, file)).toString("base64"),
  })));
  return {
    images: results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

async function channelName(token: string, channel: string): Promise<string | null> {
  const info = await slackApi<{ channel?: { name?: string } }>(token, "conversations.info", { channel }).catch(() => null);
  return info?.channel?.name ?? null;
}

async function permalink(token: string, channel: string, ts: string): Promise<string | null> {
  const link = await slackApi<{ permalink?: string }>(token, "chat.getPermalink", { channel, message_ts: ts }).catch(() => null);
  return link?.permalink ?? null;
}

export type OncallMention = {
  channel: string;
  ts: string;
  threadTs: string;
  user: string;
  text: string;
  /** Files on the mention itself: what is left to read when the thread is not. */
  files?: DmFile[];
  botUserId: string | null;
  ownAppId: string | null;
};

/**
 * One mention of Cortex in a channel. Posts its reply in the thread and says
 * what it did. Never throws for a Slack or model failure: the person in the
 * thread is told, because a mention that gets no reply looks like a dead bot.
 */
export async function handleOncallMention(db: SupabaseClient, mention: OncallMention): Promise<{ action: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  const say = (text: string) => postAsCortex(mention.channel, text, { threadTs: mention.threadTs, token }).catch(() => null);
  if (!token) return { action: "no Slack token" };
  const founder = founderUserId();
  const text = oncallText(mention.text);
  let existing: OncallCase | null;
  try {
    existing = await getCase(db, mention.channel, mention.threadTs);
  } catch (error) {
    await say(`I can't take this on yet: ${error instanceof Error ? error.message : "the case store failed"}.`);
    return { action: "no table" };
  }

  if (existing && isStopCommand(text)) {
    if (mention.user !== founder && mention.user !== existing.requested_by) {
      await say("Only TJ or whoever raised this can close it.");
      return { action: "stop refused" };
    }
    await db.from(TABLE).update({ status: "dropped", updated_at: new Date().toISOString() }).eq("id", existing.id);
    await say("Closed. Mention me again in this thread to pick it back up.");
    return { action: "dropped" };
  }

  if (existing?.status === "building") {
    await say(`A build is already running${existing.session_url ? ` (<${existing.session_url}|watch it here>)` : ""}. I'll post the pull request here; mention me after that with any changes.`);
    return { action: "already building" };
  }

  if (existing?.plan && isGoCommand(text) && existing.status !== "merged" && existing.status !== "dropped") {
    if (!canStartBuild(mention.user, founder)) {
      await say(notFounderGoReply(founder));
      return { action: "go refused" };
    }
    // With a PR up, "go" builds a follow-up only once the plan has changed
    // since; otherwise it would build the same thing twice.
    if (existing.status === "pr_open" && !planRevisedSincePr(existing)) {
      await say(`The pull request is already up: <${existing.pr_url}|open it>. Tell me what to change and I'll plan a follow-up.`);
      return { action: "pr already open" };
    }
    return requestBuild(db, token, existing, { channel: mention.channel, threadTs: mention.threadTs, botUserId: mention.botUserId, ownAppId: mention.ownAppId }, say);
  }

  // Everything else is a request, or an answer to the plan's questions: read
  // the thread and plan (again).
  if (!existing) await say("On it. Reading the thread and checking the record; a plan in about a minute.");
  let thread: Awaited<ReturnType<typeof readThread>>;
  try {
    thread = await readThread(token, mention.channel, mention.threadTs, mention.botUserId, mention.ownAppId);
  } catch (error) {
    // A private channel needs groups:history; without it only this message is readable.
    thread = { messages: [{ user: mention.user, name: null, text: mention.text, ts: mention.ts, fromCortex: false, files: (mention.files ?? []).length }], images: imageFiles(mention.files) };
    console.error("[oncall] thread read failed:", error);
  }
  const { images, failed } = await downloadImages(token, thread.images);
  const name = await channelName(token, mention.channel);
  const asker = thread.messages.find((m) => m.ts === mention.ts)?.name ?? "Someone";
  const question = [
    `${asker} mentioned you in a Slack thread${name ? ` in #${name}` : ""}. Their latest message: "${text || "(no text)"}"`,
    "",
    "THE THREAD, OLDEST FIRST:",
    threadTranscript(thread.messages),
    existing?.plan ? "\nYour earlier plan is in the thread as Cortex's message. Revise it for what people said since: drop answered questions, change the steps if an answer changed them." : "",
    failed ? `\n${failed} screenshot(s) in the thread could not be opened.` : "",
  ].join("\n");
  const answer = await answerFounderQuestion(db, question, null, null, { mode: "oncall", images, surface: "slack" });
  if (!answer.answered) {
    await say(`I couldn't work this one out: ${answer.reply}`);
    return { action: "plan failed" };
  }
  const now = new Date().toISOString();
  const row = {
    channel: mention.channel,
    thread_ts: mention.threadTs,
    requested_by: existing?.requested_by ?? mention.user,
    // A PR that is up stays watched, so its merge is still reported; "go"
    // then builds a follow-up from this plan.
    status: existing?.status === "pr_open" ? "pr_open" : existing?.status === "queued" ? "queued" : "waiting",
    plan_at: now,
    plan: answer.reply,
    session_url: existing?.status === "pr_open" ? existing.session_url : null,
    pr_url: existing?.status === "pr_open" ? existing.pr_url : null,
    pr_opened_at: existing?.status === "pr_open" ? existing.pr_opened_at : null,
    build_started_at: null,
    updated_at: now,
  };
  const { error } = await db.from(TABLE).upsert(row, { onConflict: "channel,thread_ts" });
  if (error) {
    await say(`${answer.reply}\n\n_I couldn't save this case (${error.message}), so "go" won't work yet._`);
    return { action: "plan unsaved" };
  }
  await say(`${answer.reply}\n\n${planFooter(founder)}`);
  return { action: existing ? "plan revised" : "planned" };
}

type BuildContext = { channel: string; threadTs: string; botUserId: string | null; ownAppId: string | null };

/**
 * One build at a time: it spends TJ's Claude plan, and two routine sessions
 * may share a branch. A "go" while another case is building queues this one;
 * the cron starts it when that build ends.
 */
async function requestBuild(
  db: SupabaseClient,
  token: string,
  current: OncallCase,
  ctx: BuildContext,
  say: (text: string) => Promise<unknown>,
): Promise<{ action: string }> {
  const { data: running } = await db.from(TABLE).select("id").eq("status", "building").neq("id", current.id).limit(1);
  if (running?.length) {
    await db.from(TABLE).update({ status: "queued", updated_at: new Date().toISOString() }).eq("id", current.id);
    await say(queuedReply());
    return { action: "queued" };
  }
  return startBuild(db, token, current, ctx, say);
}

async function startBuild(
  db: SupabaseClient,
  token: string,
  current: OncallCase,
  mention: BuildContext,
  say: (text: string) => Promise<unknown>,
): Promise<{ action: string }> {
  const url = process.env.CORTEX_ONCALL_ROUTINE_URL?.trim();
  const routineToken = process.env.CORTEX_ONCALL_ROUTINE_TOKEN?.trim();
  if (!url || !routineToken) {
    await say("I can't start builds yet: the on-call routine isn't configured on the server (CORTEX_ONCALL_ROUTINE_URL and CORTEX_ONCALL_ROUTINE_TOKEN).");
    return { action: "routine not configured" };
  }
  // Claim the case first, so a double "go" (or Slack retrying it) starts one build.
  const now = new Date().toISOString();
  const { data: claimed } = await db.from(TABLE)
    .update({ status: "building", build_started_at: now, updated_at: now })
    .eq("id", current.id).in("status", ["waiting", "failed", "pr_open", "queued"])
    .select("id");
  if (!claimed?.length) return { action: "already claimed" };

  const thread = await readThread(token, mention.channel, mention.threadTs, mention.botUserId, mention.ownAppId).catch(() => null);
  const [name, link] = await Promise.all([channelName(token, mention.channel), permalink(token, mention.channel, mention.threadTs)]);
  const brief = [
    "# On-call fix from Slack",
    "## The thread, oldest first",
    thread ? threadTranscript(thread.messages, 20_000) : "(Could not read the thread; Cortex's plan below is the record.)",
    "## Cortex's latest plan",
    current.plan ?? "",
    "## Notes",
    "Screenshots in the thread are not attached here; Cortex read them and its plan describes what they show.",
    "TJ said go in the thread. Questions the plan left open and nobody answered: make the conservative choice, and list it under \"Decisions to check\" in the pull request body.",
  ].join("\n\n");
  const start = await fireRoutine(url, routineToken, routinePayload({ caseId: current.id, brief, channelName: name, permalink: link }));
  if (!start.started) {
    // Back where it was: a PR that was up is still up.
    await db.from(TABLE).update({ status: current.status === "pr_open" ? "pr_open" : "waiting", build_started_at: null, updated_at: new Date().toISOString() }).eq("id", current.id);
    await say(`I couldn't start the build: ${start.reason}. Say "@Cortex go" to try again.`);
    return { action: "routine refused" };
  }
  await db.from(TABLE).update({ brief, session_url: start.sessionUrl, pr_url: null, pr_opened_at: null, updated_at: new Date().toISOString() }).eq("id", current.id);
  await say(buildStartedReply(start.sessionUrl));
  return { action: "build started" };
}

type PullSummary = { number: number; html_url: string; title: string; body: string | null; state: string; merged_at: string | null };

async function github<T>(path: string): Promise<T> {
  const token = process.env.WAR_ROOM_GITHUB_TOKEN;
  if (!token) throw new Error("WAR_ROOM_GITHUB_TOKEN is not set");
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function repository(): string {
  const repo = process.env.WAR_ROOM_GITHUB_REPOSITORY?.trim() || "olera-care/olera-web";
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error("WAR_ROOM_GITHUB_REPOSITORY is not owner/name");
  return repo;
}

/**
 * The cron's half: find the pull request each running build opened, post it in
 * its thread, and say when TJ merges it. A build that opened nothing in three
 * hours is reported, not left hanging.
 */
export async function pollOncallCases(db: SupabaseClient): Promise<{ checked: number; posted: string[] }> {
  const { data, error } = await db.from(TABLE).select("*").in("status", ["building", "pr_open", "queued"]).limit(50);
  // Before migration 276 there is nothing to poll; not a failure every ten minutes.
  if (error?.code === "42P01") return { checked: 0, posted: [] };
  if (error) throw new Error(error.message);
  const cases = (data ?? []) as OncallCase[];
  if (!cases.length) return { checked: 0, posted: [] };
  const token = process.env.SLACK_BOT_TOKEN;
  const repo = repository();
  const posted: string[] = [];
  const say = (c: OncallCase, text: string) => postAsCortex(c.channel, text, { threadTs: c.thread_ts, token });
  const building = cases.filter((c) => c.status === "building");
  // Newest pulls, open and closed: one call covers every running build. A build
  // opens its PR within hours, so the last 50 always includes it.
  const recent = building.length
    ? await github<PullSummary[]>(`/repos/${repo}/pulls?state=all&sort=created&direction=desc&per_page=50`)
    : [];
  const now = Date.now();
  for (const c of building) {
    const pull = recent.find((p) => bodyHasMarker(p.body, c.id));
    if (pull) {
      await db.from(TABLE).update({ status: "pr_open", pr_url: pull.html_url, pr_opened_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", c.id);
      await say(c, prOpenedReply(pull.html_url, pull.number, pull.title));
      posted.push(`${c.id}: PR #${pull.number}`);
    } else if (c.build_started_at && now - Date.parse(c.build_started_at) > BUILD_TIMEOUT_MS) {
      await db.from(TABLE).update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", c.id);
      await say(c, buildTimedOutReply(c.session_url));
      posted.push(`${c.id}: timed out`);
    }
  }
  for (const c of cases.filter((x) => x.status === "pr_open" && x.pr_url)) {
    const number = Number(c.pr_url!.match(/\/pull\/(\d+)/)?.[1]);
    if (!number) continue;
    const pull = await github<PullSummary>(`/repos/${repo}/pulls/${number}`).catch(() => null);
    if (!pull) continue;
    if (pull.merged_at) {
      await db.from(TABLE).update({ status: "merged", updated_at: new Date().toISOString() }).eq("id", c.id);
      await say(c, mergedReply(pull.html_url, pull.number));
      posted.push(`${c.id}: merged`);
    } else if (pull.state === "closed") {
      await db.from(TABLE).update({ status: "dropped", updated_at: new Date().toISOString() }).eq("id", c.id);
      await say(c, `TJ closed <${pull.html_url}|#${pull.number}> without merging it. Mention me with what to change and I'll plan it again.`);
      posted.push(`${c.id}: closed`);
    }
  }
  // The next queued build, once nothing is building.
  const { data: stillBuilding } = await db.from(TABLE).select("id").eq("status", "building").limit(1);
  if (!stillBuilding?.length && token) {
    const { data: next } = await db.from(TABLE).select("*").eq("status", "queued").order("updated_at", { ascending: true }).limit(1);
    const queued = (next ?? [])[0] as OncallCase | undefined;
    if (queued) {
      const started = await startBuild(db, token, queued, { channel: queued.channel, threadTs: queued.thread_ts, botUserId: await cortexBotUserId(), ownAppId: null }, (text) => say(queued, text));
      posted.push(`${queued.id}: ${started.action}`);
    }
  }
  return { checked: cases.length, posted };
}
