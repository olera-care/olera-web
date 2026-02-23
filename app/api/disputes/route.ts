import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { error: insertErr } = await db.from("disputes").insert({
      provider_id,
      provider_name,
      claimant_name: claimant_name.trim(),
      claimant_role: claimant_role.trim(),
      reason: reason.trim(),
    });

    if (insertErr) {
      console.error("Dispute insert error:", insertErr);
      return NextResponse.json(
        { error: `Failed to submit dispute: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dispute route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
