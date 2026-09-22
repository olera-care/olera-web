import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendSlackDirectMessage } from "@/lib/slack";
import { ingestSlackEventEvidence, verifySlackRequest } from "@/lib/war-room/sources.server";
import { captureFounderAnswer, findAskByThread } from "@/lib/war-room/founder-loop.server";
import { answerFounderQuestion, classifyMessage } from "@/lib/war-room/conversation.server";
import { parseScanCommand, runScanCommand } from "@/lib/war-room/scan-command.server";

export const maxDuration = 30;

type SlackEventsEnvelope = {
  type?: string;
  challenge?: string;
  event?: {
    type?: string;
    channel?: string;
    channel_type?: string;
    ts?: string;
    thread_ts?: string;
    text?: string;
    user?: string;
    bot_id?: string;
    subtype?: string;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifySlackRequest(
    request.headers.get("x-slack-signature"),
    request.headers.get("x-slack-request-timestamp"),
    rawBody,
  )) {
    return NextResponse.json({ error: "Invalid Slack signature" }, { status: 401 });
  }

  let payload: SlackEventsEnvelope;
  try {
    payload = JSON.parse(rawBody) as SlackEventsEnvelope;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type === "url_verification" && payload.challenge) {
    return NextResponse.json({ challenge: payload.challenge });
  }
  if (payload.type !== "event_callback" || !payload.event) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const db = getServiceClient();

    // A direct message from a human is the founder answering the question the
    // daily brief asked. This is the only path by which his knowledge reaches
    // the investigation loop: probes resolve the unknowns that happen to be SQL,
    // and nothing else did until now.
    //
    // Channel messages still go to the evidence reader below — an answer is a
    // reply in the DM, not a remark in a channel.
    if (payload.event.channel_type === "im" && !payload.event.bot_id && !payload.event.subtype && payload.event.text) {
      // Slack retries anything it does not see answered within three seconds,
      // up to three times. Every branch below can exceed that: starting a scan
      // plus confirming it, and answering a question, which measured 2.5 to 6.4
      // seconds against live data. A serverless route cannot answer Slack early
      // and keep working, because it can be frozen the moment it responds.
      //
      // So retries are acknowledged and dropped. The first attempt is doing the
      // work. Without this, one question would be answered three times, charged
      // three times, and one answer would be written to the record three times.
      if (request.headers.get("x-slack-retry-num")) {
        return NextResponse.json({ ok: true, retry: true });
      }

      // `chat.postMessage` accepts either a user id (U.../W...) or an IM channel
      // id (D...) as its channel, so this variable delivers the daily brief
      // correctly whichever shape it holds, and nothing has ever needed to know
      // which. Authorisation does: only a user id can be compared to
      // `event.user`. Comparing a D-channel id against a sender would never
      // match, which would have rejected the founder's own replies and broken
      // the answer loop that works in production today.
      //
      // So the two uses are separated. `dmTarget` delivers, and works either
      // way. `founderUserId` authorises, and is null unless we hold something
      // that can actually identify a person.
      const dmTarget = process.env.WAR_ROOM_BRIEF_SLACK_USER_ID?.trim() || null;
      const founderUserId = dmTarget && /^[UW][A-Z0-9]{2,}$/i.test(dmTarget) ? dmTarget : null;

      // "scan" is a command, not an answer. Checked before capture so the word
      // is never filed as evidence against whatever was last asked.
      const command = parseScanCommand(payload.event.text);
      if (command) {
        // A scan spends real money, so only the founder may start one. Without
        // this, anyone who can DM the bot could run up the bill, and the
        // confirmation would be delivered to the founder rather than to them --
        // he would see replies to commands he never typed.
        //
        // Being unable to identify him is a misconfiguration, not an
        // unauthorised request, so it says so rather than going quiet. A
        // command that silently does nothing is indistinguishable from a broken
        // deploy, and that ambiguity has cost this project days before.
        if (!founderUserId) {
          if (dmTarget) {
            await sendSlackDirectMessage(
              dmTarget,
              "I cannot start a scan: WAR_ROOM_BRIEF_SLACK_USER_ID is not a Slack user id, so I cannot verify who is asking. It needs to be the U... id, not a D... channel id.",
            ).catch(() => null);
          }
          return NextResponse.json({ ok: true, scanCommand: { ignored: "founder id not a user id" } });
        }
        if (payload.event.user !== founderUserId) {
          return NextResponse.json({ ok: true, scanCommand: { ignored: "not the founder" } });
        }

        const result = await runScanCommand(db, command);
        // Awaited, not fired and forgotten: this route can be frozen the moment
        // it responds, and an unsent confirmation looks exactly like a scan
        // that never started.
        await sendSlackDirectMessage(dmTarget ?? founderUserId, result.reply).catch(() => null);
        return NextResponse.json({ ok: true, scanCommand: { started: result.started, runId: result.runId ?? null } });
      }

      // Anyone who can DM this bot was having their words recorded as a
      // `founder_answered` event and fed to the next scan attributed to the
      // founder. Trust in this path is total and deliberate -- an answer here
      // outranks a probe -- which is exactly why it must be him.
      //
      // Fails OPEN when the env var is unset, because this loop works in
      // production today and an unset variable must not silently break it. It
      // only rejects when we positively know the sender is somebody else.
      if (founderUserId && payload.event.user !== founderUserId) {
        return NextResponse.json({ ok: true, founderAnswer: { captured: false, reason: "not the founder" } });
      }

      // A reply typed in the thread of the brief that asked names its own
      // subject. Outside a thread there is nothing to resolve, so the older
      // latest-ask rule still applies -- stated here rather than hidden, since
      // it is wrong whenever a newer brief landed in between.
      const threadTs = payload.event.thread_ts;
      const addressed = threadTs ? await findAskByThread(db, threadTs) : null;

      // A question is not an answer. Filing one as evidence writes it into the
      // record attributed to the founder and hands it to the next scan, which
      // is worse than doing nothing.
      if (classifyMessage(payload.event.text) === "question") {
        const answer = await answerFounderQuestion(db, payload.event.text, addressed?.investigationId ?? null);
        if (dmTarget) {
          await sendSlackDirectMessage(dmTarget, answer.reply, { threadTs }).catch(() => null);
        }
        return NextResponse.json({ ok: true, question: { answered: answer.answered } });
      }

      const captured = await captureFounderAnswer(db, payload.event.text, addressed);
      // Acknowledged, and naming what it was filed against. Silence is what
      // made a reply landing on the wrong condition indistinguishable from a
      // reply landing nowhere at all.
      if (dmTarget) {
        const ack = captured.captured
          ? `Recorded against *${captured.title ?? "the open question"}*.`
          : `I did not record that: ${captured.reason ?? "unknown reason"}.`;
        await sendSlackDirectMessage(dmTarget, ack, { threadTs }).catch(() => null);
      }
      return NextResponse.json({ ok: true, founderAnswer: captured });
    }

    const result = await ingestSlackEventEvidence(db, payload.event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[war-room] Slack event ingestion failed:", error);
    return NextResponse.json({ error: "Could not store Slack evidence" }, { status: 500 });
  }
}
