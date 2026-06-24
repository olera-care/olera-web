import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * One-click "contact the Olera team" from the Your Market playbook (ads guidance,
 * community playbook). Notifies the team via Slack so the provider never leaves
 * the page — no mailto, no composing. Degrades gracefully if Slack isn't configured.
 */
const LABELS: Record<string, string> = {
  ads_guidance: "ads guidance",
  community_playbook: "the community playbook",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { type?: string; city?: string; state?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const label = body.type ? LABELS[body.type] : undefined;
  if (!label) return NextResponse.json({ error: "invalid type" }, { status: 400 });

  // Resolve the provider for a useful alert (best-effort).
  const { data: account } = await supabase.from("accounts").select("id").eq("user_id", user.id).maybeSingle();
  const { data: profiles } = account
    ? await supabase.from("business_profiles").select("display_name, city, state").eq("account_id", account.id).in("type", ["organization", "caregiver"]).limit(1)
    : { data: null };
  const profile = profiles?.[0];
  const loc = body.city ? `${body.city}${body.state ? ", " + body.state : ""}` : profile ? `${profile.city ?? ""}${profile.state ? ", " + profile.state : ""}` : "";

  try {
    const { sendSlackAlert } = await import("@/lib/slack");
    await sendSlackAlert(
      `🎯 *${profile?.display_name ?? "A provider"}* (${user.email}) requested *${label}*${loc ? ` — ${loc}` : ""} from Your Market.`,
    );
  } catch (e) {
    console.warn("[market-request] slack notify failed", e);
  }

  return NextResponse.json({ ok: true });
}
