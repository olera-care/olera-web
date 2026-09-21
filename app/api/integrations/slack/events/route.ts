import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { ingestSlackEventEvidence, verifySlackRequest } from "@/lib/war-room/sources.server";
import { captureFounderAnswer } from "@/lib/war-room/founder-loop.server";

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
