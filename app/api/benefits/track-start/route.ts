import { NextResponse } from "next/server";
import { sendSlackAlert, slackBenefitsStarted } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const careNeedLabel: string = body.careNeedLabel || "Unknown";
    const stateCode: string | null = body.stateCode || null;
    const stateName: string | null = body.stateName || null;
    const providerName: string | null = body.providerName || null;
    const providerSlug: string | null = body.providerSlug || null;

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track-start] Error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
