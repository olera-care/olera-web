import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { generateProviderSlug } from "@/lib/slugify";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/claim/deferred
 *
 * Attempts to claim a provider listing via email/domain matching.
 * This is called after the user has authenticated (OTP verified).
 *
 * Auto-verification happens when:
 * 1. User's email exactly matches the email on file for the provider
 * 2. User's email domain matches the provider's website domain
 *
 * If neither condition is met, returns 403 - caller should fall back
 * to sending a verification code to the business email on file.
 *
 * Request body: { providerId: string }
 * Returns:
 * - 200: { success: true, profileSlug } - Claimed with verified status
 * - 401: Not authenticated
 * - 403: No email/domain match - needs manual verification
 * - 404: Provider not found
 * - 409: Already claimed by someone else
 */
export async function POST(request: Request) {
  try {
    // Require authentication
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get provider info
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, email, website, city, state, slug, provider_description, phone, hero_image_url, provider_logo")
      .eq("provider_id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check if already claimed
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, account_id, claim_state, slug")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    if (existingProfile?.claim_state === "claimed" && existingProfile.account_id) {
      // Check if it's claimed by the current user
      const { data: userAccount } = await db
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile.account_id === userAccount?.id) {
        // Already claimed by this user - success
        return NextResponse.json({ success: true, profileSlug: existingProfile.slug });
      }
      return NextResponse.json({ error: "Already claimed by another user" }, { status: 409 });
    }

    // Check for email/domain match
    const userEmail = user.email?.toLowerCase();
    const providerEmail = provider.email?.toLowerCase();
    const providerWebsite = provider.website;

    // 1. Exact email match
    const emailMatches = userEmail && providerEmail && userEmail === providerEmail;

    // 2. Domain match (user's email domain matches website domain)
    let domainMatches = false;
    if (userEmail && providerWebsite) {
      try {
        const emailDomain = userEmail.split("@")[1];
        const websiteUrl = providerWebsite.startsWith("http")
          ? providerWebsite
          : `https://${providerWebsite}`;
        const websiteDomain = new URL(websiteUrl).hostname.replace(/^www\./, "");
        domainMatches = emailDomain === websiteDomain;
      } catch {
        // Invalid URL - skip domain matching
      }
    }

    if (!emailMatches && !domainMatches) {
      // No match - caller should fall back to business email verification
      return NextResponse.json(
        { error: "Email/domain mismatch - verification required" },
        { status: 403 }
      );
    }

    // Match found! Create or update profile with verified status

    // Ensure user has an account
    let { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      const { data: newAccount, error: accountErr } = await db
        .from("accounts")
        .insert({
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "",
          onboarding_completed: true,
        })
        .select("id")
        .single();

      if (accountErr) {
        if (accountErr.code === "23505") {
          const { data: raceAccount } = await db
            .from("accounts")
            .select("id")
            .eq("user_id", user.id)
            .single();
          account = raceAccount;
        }
        if (!account) {
          return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
        }
      } else {
        account = newAccount;
      }
    }

    const accountId = account!.id as string;

    let profileSlug: string;
    let profileId: string;

    if (existingProfile) {
      // Update existing unclaimed profile
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({
          account_id: accountId,
          claim_state: "claimed",
          verification_state: "verified",
        })
        .eq("id", existingProfile.id);

      if (updateErr) {
        return NextResponse.json({ error: "Failed to claim listing" }, { status: 500 });
      }
      profileSlug = existingProfile.slug;
      profileId = existingProfile.id;
    } else {
      // Create new profile
      profileSlug = provider.slug || generateProviderSlug(provider.provider_name, provider.state);

      const { data: newProfile, error: insertErr } = await db
        .from("business_profiles")
        .insert({
          account_id: accountId,
          source_provider_id: providerId,
          slug: profileSlug,
          type: "organization",
          display_name: provider.provider_name,
          description: provider.provider_description,
          image_url: provider.hero_image_url || provider.provider_logo,
          phone: provider.phone,
          email: provider.email,
          website: provider.website,
          city: provider.city,
          state: provider.state,
          claim_state: "claimed",
          verification_state: "verified",
          source: "claimed_from_directory",
          is_active: true,
        })
        .select("id")
        .single();

      if (insertErr || !newProfile) {
        return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
      }
      profileId = newProfile.id;
    }

    // Update account
    await db
      .from("accounts")
      .update({ onboarding_completed: true, active_profile_id: profileId })
      .eq("id", accountId);

    return NextResponse.json({ success: true, profileSlug, profileId });
  } catch (err) {
    console.error("Deferred claim error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
