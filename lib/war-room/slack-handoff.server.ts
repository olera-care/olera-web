import type { SupabaseClient } from "@supabase/supabase-js";
import { answerFounderQuestion } from "./conversation.server";
import { handoffQuestion, handoffSavedReply, saveHandoff } from "./handoff.server";
import { readThread } from "./oncall.server";
import { threadTranscript, type ThreadMessage } from "./oncall";
import { slackApi } from "./sources.server";

/**
 * "hand this off" from Slack: #cortex, a DM with Cortex, or a thread where
 * Cortex was mentioned.
 *
 * Until 9 Oct 2026 the phrase only worked on Telegram. In Slack it reached the
 * answer engine, which said "the system will write up a brief now" and nothing
 * was saved; TJ said it twice that day (the provider-recommendations thread and
 * the Benefits Finder measurement thread) and both briefs were lost. The brief
 * is written from the Slack conversation itself, and the reply says it was
 * handed off only when the row exists.
 *
 * Only TJ hands off: the overnight runner builds open briefs, and a brief from
 * anyone else would spend his Claude plan without his say.
 */

type RawMessage = { user?: string; app_id?: string; text?: string; ts?: string; files?: unknown[] };

/** The conversation the brief is written from: the thread, or the recent channel when there is no thread. */
async function conversationFor(token: string, channel: string, threadTs: string | null, botUserId: string | null, ownAppId: string | null): Promise<ThreadMessage[]> {
  if (threadTs) return (await readThread(token, channel, threadTs, botUserId, ownAppId)).messages;
  const history = await slackApi<{ messages?: RawMessage[] }>(token, "conversations.history", { channel, limit: 20 });
  return (history.messages ?? []).reverse().map((m) => ({
    user: m.user ?? null,
    name: null,
    text: m.text ?? "",
    ts: m.ts ?? "",
    fromCortex: Boolean((botUserId && m.user === botUserId) || (ownAppId && m.app_id === ownAppId)),
    files: (m.files ?? []).length,
  }));
}

export async function slackHandoff(db: SupabaseClient, args: {
  channel: string;
  /** The thread the phrase was said in, or null for a top-level message. */
  threadTs: string | null;
  note: string;
  user: string | null;
  founderId: string | null;
  botUserId: string | null;
  ownAppId: string | null;
  /** "Slack #cortex", "a Slack DM", "a Slack thread". */
  source: string;
}): Promise<string> {
  if (!args.founderId || args.user !== args.founderId) {
    return "Only TJ can hand work off to Claude Code. TJ, say \"hand this off\" here if you want it written up.";
  }
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return "Nothing handed off: I can't read Slack right now (no bot token).";
  let transcript = "";
  try {
    transcript = threadTranscript(await conversationFor(token, args.channel, args.threadTs, args.botUserId, args.ownAppId), 20_000);
  } catch (error) {
    return `Nothing handed off: I couldn't read this conversation (${error instanceof Error ? error.message : String(error)}).`;
  }
  const brief = await answerFounderQuestion(db, handoffQuestion(args.note, args.source, transcript), null, null, { mode: "handoff", surface: "slack" });
  if (!brief.answered) return `Nothing handed off: I couldn't write the brief (${brief.reply.slice(0, 200)}).`;
  try {
    const saved = await saveHandoff(db, { body: brief.reply, note: args.note, chatId: `slack:${args.channel}`, source: args.source });
    return handoffSavedReply(saved);
  } catch (error) {
    return `Nothing handed off: saving it failed (${error instanceof Error ? error.message : String(error)}). Here's the brief so it isn't lost:\n\n${brief.reply.slice(0, 3_500)}`;
  }
}
