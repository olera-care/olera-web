import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackDispute } from "@/lib/slack";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/disputes
 *
 * Submits an ownership dispute for a claimed provider listing.
 *
 * Request body:
 * - provider_id: string
 * - provider_name: string
 * - claimant_name: string
 * - claimant_role: string
 * - reason: string
 */
export async function POST(request: Request) {
  try {
    // Authenticate
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { provider_id, provider_name, claimant_name, claimant_role, reason } = body;

    if (!provider_id || !provider_name || !claimant_name?.trim() || !claimant_role?.trim() || !reason?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Rate limit: max 3 disputes per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("disputes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: "Too many disputes submitted. Please try again later." },
        { status: 429 }
      );
    }

    const { error: insertErr } = await db.from("disputes").insert({
      provider_id,
      provider_name,
      claimant_name: claimant_name.trim(),
      claimant_role: claimant_role.trim(),
      reason: reason.trim(),
      user_id: user.id,
    });

    if (insertErr) {
      console.error("Dispute insert error:", insertErr);
      return NextResponse.json(
        { error: `Failed to submit dispute: ${insertErr.message}` },
        { status: 500 }
      );
    }

    // Slack alert (fire-and-forget)
    try {
      const alert = slackDispute({
        providerName: provider_name,
        reportedBy: claimant_name.trim(),
        reason: reason.trim(),
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dispute route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
