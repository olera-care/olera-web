import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { generateUniqueSlug } from "@/lib/slug";

/**
 * Creates a Supabase admin client with service role key.
 * Bypasses RLS — only use server-side.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not configured — falling back to authenticated client");
    return null;
  }
  return createClient(url, serviceKey);
}

/**
 * POST /api/provider/claim-listing
 *
 * Claims an olera-providers listing by creating a business_profile linked to it.
 * Checks email match for auto-verification.
 *
 * Request body:
 * - providerId: string (provider_id from olera-providers)
 * - providerName: string
 * - providerSlug?: string
 * - providerEmail?: string (email on file for the listing)
 * - city?: string
 * - state?: string
 *
 * Returns:
 * - 200: { profileId: string, verificationState: string }
 * - 401: Not authenticated
 * - 404: Listing not found
 * - 409: Already claimed
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      providerId,
      providerName,
      providerSlug,
      providerEmail,
      city,
      state,
    } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient();
    const db = adminClient || supabase;

    // Get the user's account
    const { data: account, error: accountErr } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (accountErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    // Check if this listing is already claimed (business_profile with this source_provider_id exists)
    const { data: existingClaim } = await db
      .from("business_profiles")
      .select("id, account_id")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    if (existingClaim) {
      if (existingClaim.account_id === account.id) {
        // Already claimed by this user - just return success
        return NextResponse.json({
          profileId: existingClaim.id,
          verificationState: "verified", // They already own it
          alreadyOwned: true,
        });
      } else {
        // Claimed by someone else
        return NextResponse.json(
          { error: "This listing has already been claimed by another account" },
          { status: 409 }
        );
      }
    }

    // Check if user already has a provider profile (they can only have one for now)
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, source_provider_id, verification_state")
      .eq("account_id", account.id)
      .eq("type", "organization")
      .eq("is_active", true)
      .maybeSingle();

    if (existingProfile) {
      // User already has a provider profile
      // If they already have a source_provider_id linked, don't overwrite it
      if (existingProfile.source_provider_id && existingProfile.source_provider_id !== providerId) {
        return NextResponse.json(
          { error: "Your account is already linked to a different listing. Contact support to change it." },
          { status: 409 }
        );
      }

      // Link the source_provider_id to existing profile
      // Check email match for verification
      const userEmail = user.email?.toLowerCase();
      const listingEmail = providerEmail?.toLowerCase();
      const emailMatches = userEmail && listingEmail && userEmail === listingEmail;

      // Also check domain match (e.g., john@sunrise.com matches sunrise.com website)
      let domainMatches = false;
      if (userEmail) {
        try {
          const { data: providerRecord } = await db
            .from("olera-providers")
            .select("website")
            .eq("provider_id", providerId)
            .maybeSingle();

          if (providerRecord?.website) {
            const emailDomain = userEmail.split("@")[1];
            const websiteUrl = providerRecord.website.startsWith("http")
              ? providerRecord.website
              : `https://${providerRecord.website}`;
            const websiteDomain = new URL(websiteUrl).hostname.replace(/^www\./, "");
            domainMatches = emailDomain === websiteDomain;
          }
        } catch {
          // Ignore URL parsing errors
        }
      }

      const shouldAutoVerify = emailMatches || domainMatches;

      // Update existing profile to link to this source provider
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({
          source_provider_id: providerId,
          claim_state: "claimed",
          verification_state: shouldAutoVerify ? "verified" : "unverified",
        })
        .eq("id", existingProfile.id);

      if (updateErr) {
        console.error("Update profile error:", updateErr);
        return NextResponse.json(
          { error: "Failed to link listing to your profile" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        profileId: existingProfile.id,
        verificationState: shouldAutoVerify ? "verified" : "unverified",
      });
    }

    // No existing profile - create a new business_profile linked to the olera-providers listing
    const userEmail = user.email?.toLowerCase();
    const listingEmail = providerEmail?.toLowerCase();
    const emailMatches = userEmail && listingEmail && userEmail === listingEmail;

    // Check domain match
    let domainMatches = false;
    if (userEmail) {
      try {
        const { data: providerRecord } = await db
          .from("olera-providers")
          .select("website")
          .eq("provider_id", providerId)
          .maybeSingle();

        if (providerRecord?.website) {
          const emailDomain = userEmail.split("@")[1];
          const websiteUrl = providerRecord.website.startsWith("http")
            ? providerRecord.website
            : `https://${providerRecord.website}`;
          const websiteDomain = new URL(websiteUrl).hostname.replace(/^www\./, "");
          domainMatches = emailDomain === websiteDomain;
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    const shouldAutoVerify = emailMatches || domainMatches;

    // Generate unique slug for the new profile (don't use providerSlug to avoid collisions)
    const slug = await generateUniqueSlug(db, providerName || "Provider", city || "", state || "");

    // Create the business_profile
    const { data: newProfile, error: insertErr } = await db
      .from("business_profiles")
      .insert({
        account_id: account.id,
        source_provider_id: providerId,
        slug,
        type: "organization",
        display_name: providerName || "My Business",
        email: user.email || null,
        city: city || null,
        state: state || null,
        claim_state: "claimed",
        verification_state: shouldAutoVerify ? "verified" : "unverified",
        source: "claimed_from_directory",
        is_active: true,
        metadata: {},
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Create profile error:", insertErr);
      return NextResponse.json(
        { error: `Failed to claim listing: ${insertErr.message}` },
        { status: 500 }
      );
    }

    // Create membership for the new provider
    const { data: existingMembership } = await db
      .from("memberships")
      .select("id")
      .eq("account_id", account.id)
      .limit(1);

    if (!existingMembership || existingMembership.length === 0) {
      await db.from("memberships").insert({
        account_id: account.id,
        plan: "free",
        status: "free",
      });
    }

    // Update account: mark onboarding complete + set active profile
    await db
      .from("accounts")
      .update({
        onboarding_completed: true,
        active_profile_id: newProfile.id,
      })
      .eq("id", account.id);

    return NextResponse.json({
      profileId: newProfile.id,
      verificationState: shouldAutoVerify ? "verified" : "unverified",
    });
  } catch (err) {
    console.error("Claim listing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
