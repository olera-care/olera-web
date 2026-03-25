import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { providerReachOutEmail } from "@/lib/email-templates";
import { sendSlackAlert } from "@/lib/slack";

/**
 * POST /api/matches/notify-reach-out
 *
 * Fires email notification to family when a provider sends a reach-out.
 * Called after the client-side connection insert succeeds.
 *
 * Body: { toProfileId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { toProfileId } = (await request.json()) as { toProfileId: string };
    if (!toProfileId) {
      return NextResponse.json({ error: "Missing toProfileId" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get provider's active profile
    const { data: account } = await db
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    // Fetch provider and family profiles in parallel
    const [{ data: provider }, { data: family }] = await Promise.all([
      db
        .from("business_profiles")
        .select("display_name, city, state")
        .eq("id", account.active_profile_id)
        .single(),
      db
        .from("business_profiles")
        .select("display_name, email, city")
        .eq("id", toProfileId)
        .single(),
    ]);

    if (!family?.email) {
      return NextResponse.json({ success: true, skipped: "no_email" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const providerCity = provider?.city || family?.city || "your area";

    // Get the reach-out message from the most recent connection
    const { data: conn } = await db
      .from("connections")
      .select("message")
      .eq("from_profile_id", account.active_profile_id)
      .eq("to_profile_id", toProfileId)
      .eq("type", "request")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    await sendEmail({
      to: family.email,
      subject: `A provider in ${providerCity} is interested in your care needs`,
      html: providerReachOutEmail({
        familyName: family.display_name || "there",
        providerName: provider?.display_name || "A care provider",
        city: providerCity,
        message: conn?.message || null,
        matchesUrl: `${siteUrl}/portal/matches`,
      }),
      emailType: "provider_reach_out",
      recipientType: "family",
      providerId: account.active_profile_id,
    });

    // Slack alert (fire-and-forget)
    try {
      await sendSlackAlert(
        `📬 Provider reach-out: ${provider?.display_name || "Provider"} → ${family.display_name || "Family"} (${providerCity})`,
      );
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[matches/notify-reach-out] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
