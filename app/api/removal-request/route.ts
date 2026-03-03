import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/removal-request
 *
 * Submits a request to hide or remove a provider listing.
 * No authentication required — stored for admin review.
 *
 * Request body:
 * - provider_id: string
 * - provider_name: string
 * - provider_slug: string
 * - full_name: string
 * - business_email: string
 * - business_phone: string
 * - action: "hide" | "delete"
 * - reason: string
 * - additional_details: string | null
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_id,
      provider_name,
      provider_slug,
      full_name,
      business_email,
      business_phone,
      action,
      reason,
      additional_details,
    } = body;

    if (
      !provider_id ||
      !provider_name ||
      !full_name?.trim() ||
      !business_email?.trim() ||
      !business_phone?.trim() ||
      !action ||
      !reason
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    if (!["hide", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'hide' or 'delete'." },
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

    const { error: insertErr } = await db.from("removal_requests").insert({
      provider_id,
      provider_name,
      provider_slug: provider_slug || null,
      full_name: full_name.trim(),
      business_email: business_email.trim(),
      business_phone: business_phone.trim(),
      action,
      reason,
      additional_details: additional_details?.trim() || null,
    });

    if (insertErr) {
      console.error("Removal request insert error:", insertErr);
      return NextResponse.json(
        { error: `Failed to submit request: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Removal request route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
