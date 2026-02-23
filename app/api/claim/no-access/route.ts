import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/claim/no-access
 *
 * Submits a manual review request when the user can't access the provider email.
 *
 * Request body:
 * - providerId: string
 * - providerName: string
 * - contactName: string
 * - reason: string
 * - alternativeEmail: string
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
    const { providerId, providerName, contactName, reason, alternativeEmail } = body;

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
      reason: `[No email access] ${reason.trim()}\n\nAlternative email: ${alternativeEmail.trim()}`,
    });

    if (insertErr) {
      console.error("No-access request insert error:", insertErr);
      return NextResponse.json(
        { error: `Failed to submit request: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("No-access route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
