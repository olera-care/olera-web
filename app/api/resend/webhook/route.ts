/**
 * Resend webhook receiver.
 *
 * Receives email lifecycle events (sent / delivered / opened / clicked /
 * bounced / complained / etc) from Resend and persists them via
 * lib/resend-events.ts.
 *
 * Always returns 200 on internal failures (mirrors the Stripe webhook
 * pattern) so Resend doesn't retry forever and obscure debugging logs.
 *
 * VERCEL BOT PROTECTION RISK: per the Stripe webhook deprecation notice,
 * Vercel's edge bot-protection layer can block GCP-origin POSTs (which is
 * where Svix infra runs from). If Resend's "Send test event" returns 403,
 * mitigation is to re-host this route as a Supabase Edge Function at
 * supabase/functions/resend-webhook/index.ts. Logic stays identical.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordEmailEvent, verifyResendSignature } from "@/lib/resend-events";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const payload = verifyResendSignature(rawBody, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });
  if (!payload) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await recordEmailEvent(payload, svixId);
  } catch (err) {
    // Already logged inside recordEmailEvent; return 200 anyway so Resend
    // doesn't retry indefinitely.
    console.error("[resend-webhook] record failed:", err);
  }

  return NextResponse.json({ ok: true });
}
