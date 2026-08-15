import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { ingestSlackEventEvidence, verifySlackRequest } from "@/lib/war-room/sources.server";

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
    const result = await ingestSlackEventEvidence(getServiceClient(), payload.event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[war-room] Slack event ingestion failed:", error);
    return NextResponse.json({ error: "Could not store Slack evidence" }, { status: 500 });
  }
}
