import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/claim/no-access
 *
 * Submits a manual review request when the user can't access the provider email.
 * Does NOT require authentication — tracked by claimSession like other claim endpoints.
 *
 * Request body:
 * - providerId: string
 * - providerName: string
 * - contactName: string
 * - reason: string
 * - alternativeEmail: string
 * - contactPhone: string (optional)
 * - claimSession: string (optional, for tracking)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, providerName, contactName, reason, alternativeEmail, contactPhone, claimSession } = body;

    if (!providerId || !contactName?.trim() || !reason?.trim() || !alternativeEmail?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // Store as a dispute with type "no_email_access" for manual review
    const { error: insertErr } = await db.from("disputes").insert({
      provider_id: providerId,
      provider_name: providerName || "",
      claimant_name: contactName.trim(),
      claimant_role: "Email access request",
      reason: `[No email access] ${reason.trim()}\n\nAlternative email: ${alternativeEmail.trim()}${contactPhone ? `\nPhone: ${contactPhone.trim()}` : ""}`,
    });

    if (insertErr) {
      console.error("No-access request insert error:", insertErr);
      return NextResponse.json(
        { error: `Failed to submit request: ${insertErr.message}` },
        { status: 500 }
      );
    }

    // Update the provider's claim_state to "pending" so they get limited portal access
    // after auto-sign-in. This tells the UI to show restricted/blurred content.
    const { error: updateErr } = await db
      .from("business_profiles")
      .update({ claim_state: "pending" })
      .or(`id.eq.${providerId},source_provider_id.eq.${providerId}`)
      .eq("claim_state", "unclaimed");

    if (updateErr) {
      console.error("No-access claim_state update error:", updateErr);
      // Non-fatal — the dispute was still created
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("No-access route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
