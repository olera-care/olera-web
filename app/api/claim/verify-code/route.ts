import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const MAX_ATTEMPTS = 5;

/**
 * POST /api/claim/verify-code
 *
 * Verifies a 6-digit code for provider page claim.
 * No authentication required — tracked by claim_session UUID.
 *
 * Request body: { providerId: string, code: string, claimSession: string }
 * Returns: { verified: true, claimSession: string } or { verified: false, error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, code, claimSession } = body;

    if (!providerId || !code) {
      return NextResponse.json({ error: "Provider ID and code are required." }, { status: 400 });
    }

    if (!claimSession || !UUID_RE.test(claimSession)) {
      return NextResponse.json({ error: "Valid claim session is required." }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // Find the most recent unexpired code for this provider + claim_session
    const now = new Date().toISOString();
    const { data: record, error: lookupErr } = await db
      .from("claim_verification_codes")
      .select("id, code, attempts")
      .eq("provider_id", providerId)
      .eq("claim_session", claimSession)
      .gt("expires_at", now)
      .lt("attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupErr) {
      console.error("Verification lookup error:", lookupErr);
      return NextResponse.json({ error: "Verification failed." }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json(
        { verified: false, error: "Code expired or too many attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Check code
    if (record.code !== code.trim()) {
      // Increment attempts
      await db
        .from("claim_verification_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return NextResponse.json(
        {
          verified: false,
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Code matches — mark as verified and clean up other codes for this session
    await db
      .from("claim_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", record.id);

    // Delete other codes for this provider+session (keep only the verified one)
    await db
      .from("claim_verification_codes")
      .delete()
      .eq("provider_id", providerId)
      .eq("claim_session", claimSession)
      .neq("id", record.id);

    return NextResponse.json({ verified: true, claimSession });
  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
