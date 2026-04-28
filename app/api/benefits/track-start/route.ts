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

    const alert = slackBenefitsStarted({
      careNeedLabel,
      stateCode,
      stateName,
      providerName,
      providerSlug,
    });
    sendSlackAlert(alert.text, alert.blocks).catch((err) => {
      console.error("[track-start] Slack alert failed:", err);
    });

    // Persist as an anonymous provider_activity row so the admin analytics
    // KPI strip can count benefits-intake starts. Keyed on providerSlug since
    // the intake always launches from a provider page; sessionId enables
    // dedup if the modal re-mounts.
    const db = getServiceDb();
    if (db && providerSlug && sessionId) {
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
      }).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("[track-start] benefits_started insert failed:", error);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track-start] Error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
