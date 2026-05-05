import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackBenefitsStarted } from "@/lib/slack";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const careNeedLabel: string = body.careNeedLabel || "Unknown";
    const stateCode: string | null = body.stateCode || null;
    const stateName: string | null = body.stateName || null;
    const providerName: string | null = body.providerName || null;
    const providerSlug: string | null = body.providerSlug || null;
    const sessionId: string | null = body.sessionId || null;
    const variant: string | null = body.variant || null;
    const entrySource: string | null = body.entrySource || null;

    const alert = slackBenefitsStarted({
      careNeedLabel,
      stateCode,
      stateName,
      providerName,
      providerSlug,
      entrySource,
    });

    // Persist as an anonymous provider_activity row so the admin analytics
    // KPI strip can count benefits-intake starts. Keyed on providerSlug since
    // the intake always launches from a provider page; sessionId enables
    // dedup if the modal re-mounts. Editorial mounts skip the insert
    // (no providerSlug) — the Slack alert still fires.
    const db = getServiceDb();
    const shouldInsert = db && providerSlug && sessionId;

    // Awaited via Promise.allSettled — fire-and-forget gets killed by
    // Vercel's serverless runtime once the response goes out (cost a 7h
    // diagnosis on the agent-outreach route, 2026-05-03). Adds ~200-400ms
    // latency but guarantees the alert lands. allSettled so a Slack or DB
    // failure doesn't abort the response. The client uses keepalive +
    // ignored result, so server-side latency here is invisible to the UI.
    const results = await Promise.allSettled([
      sendSlackAlert(alert.text, alert.blocks),
      ...(shouldInsert
        ? [
            db.from("provider_activity").insert({
              provider_id: providerSlug,
              profile_id: null,
              event_type: "benefits_started",
              metadata: {
                session_id: sessionId,
                care_need: careNeedLabel,
                state: stateCode,
                provider_name: providerName,
                variant,
              },
            }),
          ]
        : []),
    ]);
    if (results[0].status === "rejected") {
      console.error("[track-start] Slack alert failed:", results[0].reason);
    }
    if (shouldInsert && results[1] && results[1].status === "rejected") {
      console.error("[track-start] benefits_started insert failed:", results[1].reason);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track-start] Error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
