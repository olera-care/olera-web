/**
 * DEPRECATED FOR PRODUCTION — kept as backup and for local dev.
 *
 * The production Resend webhook receiver is now the Supabase Edge Function at
 * `supabase/functions/resend-webhook/index.ts`. Resend no longer sends events
 * to this URL — Vercel's Bot Protection edge layer blocks Resend's GCP-origin
 * POSTs (Resend dispatches via Svix, also on GCP) with 403 regardless of
 * firewall config (April 2026 — same wall the Stripe webhook hit). Supabase
 * Edge Functions are not behind that layer, so we route webhooks there.
 *
 * WHEN EDITING: mirror any changes to the Supabase function at
 * `supabase/functions/resend-webhook/index.ts` until one is deleted.
 *
 * LOCAL DEV: this route still works against `npm run dev` for local testing
 * since Vercel Bot Protection only runs in production deploys.
 *
 * ROLLBACK: if the Supabase function fails, re-register this URL in the
 * Resend Dashboard (`https://olera.care/api/resend/webhook` or staging
 * equivalent) and disable the Supabase endpoint. No code changes required.
 *
 * Receives email lifecycle events (sent / delivered / opened / clicked /
 * bounced / complained / etc) from Resend and persists them via
 * lib/resend-events.ts.
 *
 * Always returns 200 on internal failures so Resend doesn't retry forever.
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
