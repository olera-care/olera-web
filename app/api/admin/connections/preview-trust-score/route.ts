import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { scoreClaimTrust, extractDomainFromWebsite } from "@/lib/claim-trust";

/**
 * POST /api/admin/connections/preview-trust-score
 *
 * Preview what trust level a provider would receive if they claimed
 * their account with the given email. This helps admins choose the
 * best email when adding/editing provider emails.
 *
 * Body: { email: string, providerId: string }
 * Returns: { level: "high" | "medium" | "low", reason: string }
 */
export const runtime = "nodejs";
export const maxDuration = 15; // scoreClaimTrust has 5s timeout, add buffer

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Authorization check
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { email, providerId } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!providerId || typeof providerId !== "string") {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch provider details needed for trust scoring
    const { data: provider, error: providerError } = await db
      .from("business_profiles")
      .select("display_name, city, state, category, website, source_provider_id")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      console.error("[preview-trust-score] Provider fetch failed:", providerError);
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Fall back to olera-providers for missing fields
    let city = provider.city;
    let state = provider.state;
    let website = provider.website;
    if (provider.source_provider_id && (!city || !state || !website)) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("city, state, website")
        .eq("provider_id", provider.source_provider_id)
        .maybeSingle();
      if (iosProvider) {
        city = city || iosProvider.city;
        state = state || iosProvider.state;
        website = website || iosProvider.website;
      }
    }

    // Score the trust level
    const result = await scoreClaimTrust({
      email: email.trim().toLowerCase(),
      providerName: provider.display_name || "Unknown Provider",
      providerCity: city,
      providerState: state,
      providerCategory: provider.category,
      providerDomain: extractDomainFromWebsite(website),
    });

    return NextResponse.json({
      level: result.level,
      reason: result.reason,
    });
  } catch (err) {
    console.error("[preview-trust-score] Error:", err);
    return NextResponse.json(
      { error: "Failed to score trust level" },
      { status: 500 }
    );
  }
}
