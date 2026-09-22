import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendSlackDirectMessage } from "@/lib/slack";
import { ingestSlackEventEvidence, verifySlackRequest } from "@/lib/war-room/sources.server";
import { captureFounderAnswer } from "@/lib/war-room/founder-loop.server";
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
      const founderUserId = process.env.WAR_ROOM_BRIEF_SLACK_USER_ID?.trim();

      // "scan" is a command, not an answer. Checked before capture so the word
      // is never filed as evidence against whatever was last asked.
      const command = parseScanCommand(payload.event.text);
      if (command) {
        // Slack retries anything it does not see answered within three seconds,
        // up to three times, and starting a scan plus sending a confirmation
        // can exceed that. The in-flight guard in queueWarRoomDiscovery already
        // stops a retry paying twice, but each retry would still send its own
        // Slack reply. A retry carries this header; the first attempt did the
        // work, so acknowledge and say nothing.
        if (request.headers.get("x-slack-retry-num")) {
          return NextResponse.json({ ok: true, scanCommand: { retry: true } });
        }

        // A scan spends real money, so only the founder may start one. Without
        // this, anyone who can DM the bot could run up the bill, and the
        // confirmation would be delivered to the founder rather than to them --
        // he would see replies to commands he never typed.
        //
        // Unset env means nobody is authorised, which is the safe default: the
        // bot simply does not answer the word.
        if (!founderUserId || payload.event.user !== founderUserId) {
          return NextResponse.json({ ok: true, scanCommand: { ignored: "not the founder" } });
        }

        const result = await runScanCommand(db, command);
        // Awaited, not fired and forgotten: this route can be frozen the moment
        // it responds, and an unsent confirmation looks exactly like a scan
        // that never started.
        await sendSlackDirectMessage(founderUserId, result.reply).catch(() => null);
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

      const captured = await captureFounderAnswer(db, payload.event.text);
      return NextResponse.json({ ok: true, founderAnswer: captured });
    }

    const result = await ingestSlackEventEvidence(db, payload.event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[war-room] Slack event ingestion failed:", error);
    return NextResponse.json({ error: "Could not store Slack evidence" }, { status: 500 });
  }
}
