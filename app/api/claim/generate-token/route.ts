import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateClaimUrl } from "@/lib/claim-tokens";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/claim/generate-token
 *
 * Generates a signed claim token URL for email campaigns.
 * Admin-only endpoint (should be protected in production).
 *
 * Request body: { providerId: string }
 * Returns: { url: string, email: string, expiresIn: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required." }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // Look up provider
    const { data: provider, error: providerErr } = await db
      .from("olera-providers")
      .select("email, slug, provider_name, provider_id")
      .eq("provider_id", providerId)
      .single();

    if (providerErr || !provider) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json(
        { error: "Provider has no email on file. Cannot generate claim link." },
        { status: 422 }
      );
    }

    const slug = provider.slug || provider.provider_id;
    const url = generateClaimUrl(providerId, slug, provider.email);

    return NextResponse.json({
      url,
      email: provider.email,
      providerName: provider.provider_name,
      expiresIn: "72 hours",
    });
  } catch (err) {
    console.error("Generate token error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
