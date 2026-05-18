import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isBlockedEmailDomain } from "@/lib/email-validation";

/**
 * Creates a Supabase admin client with service role key.
 * Bypasses RLS — only use server-side.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey);
}

/**
 * POST /api/auth/check-email-type
 *
 * Checks if an email is already associated with an account of a different type.
 * Used before sending OTP to prevent users from using an email that's already
 * tied to a family or caregiver account for provider onboarding.
 *
 * Checks both:
 * 1. business_profiles.email - profiles may have email set
 * 2. accounts.email - accounts may have email set
 *
 * Request body:
 * - email: string
 * - intendedType: "organization" | "family" | "caregiver"
 *
 * Returns:
 * - 200: { available: true } - email can be used for this account type
 * - 200: { available: false, existingType: string } - email is used for different type
 * - 400: Missing email
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, intendedType = "organization" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Reject abuse domains before any OTP is sent.
    if (isBlockedEmailDomain(normalizedEmail)) {
      return NextResponse.json({
        available: false,
        blocked: true,
        error: "This email address can't be used to create an account.",
      });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      // If no admin client, we can't check - allow through and let the API handle it
      return NextResponse.json({ available: true });
    }

    // Map type to user-friendly name
    const typeNames: Record<string, string> = {
      family: "family",
      organization: "provider",
      caregiver: "caregiver",
    };

    // Check 1: Query business_profiles directly by email
    const { data: profilesByEmail, error: profilesError } = await adminClient
      .from("business_profiles")
      .select("id, type, account_id")
      .ilike("email", normalizedEmail)
      .eq("is_active", true);

    if (profilesError) {
      console.error("[check-email-type] Error querying profiles by email:", profilesError);
    }

    if (profilesByEmail && profilesByEmail.length > 0) {
      // Check if any profile is a different type than intended
      const conflictingProfile = profilesByEmail.find((p) => p.type !== intendedType);
      if (conflictingProfile) {
        const friendlyType = typeNames[conflictingProfile.type] || conflictingProfile.type;
        return NextResponse.json({
          available: false,
          existingType: friendlyType,
        });
      }

      // Check if they already have a provider profile (can only have one)
      if (intendedType === "organization") {
        const hasOrgProfile = profilesByEmail.some((p) => p.type === "organization");
        if (hasOrgProfile) {
          return NextResponse.json({
            available: false,
            existingType: "provider",
            alreadyHasProfile: true,
          });
        }
      }
    }

    // Check 2: Query accounts by email and check their profiles
    const { data: accountByEmail, error: accountError } = await adminClient
      .from("accounts")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (accountError) {
      console.error("[check-email-type] Error querying account by email:", accountError);
    }

    if (accountByEmail) {
      // Found an account with this email - check its profiles
      const { data: accountProfiles, error: accountProfilesError } = await adminClient
        .from("business_profiles")
        .select("id, type")
        .eq("account_id", accountByEmail.id)
        .eq("is_active", true);

      if (accountProfilesError) {
        console.error("[check-email-type] Error querying account profiles:", accountProfilesError);
      }

      if (accountProfiles && accountProfiles.length > 0) {
        // Check if any profile is a different type than intended
        const conflictingProfile = accountProfiles.find((p) => p.type !== intendedType);
        if (conflictingProfile) {
          const friendlyType = typeNames[conflictingProfile.type] || conflictingProfile.type;
          return NextResponse.json({
            available: false,
            existingType: friendlyType,
          });
        }

        // Check if they already have a provider profile
        if (intendedType === "organization") {
          const hasOrgProfile = accountProfiles.some((p) => p.type === "organization");
          if (hasOrgProfile) {
            return NextResponse.json({
              available: false,
              existingType: "provider",
              alreadyHasProfile: true,
            });
          }
        }
      }
    }

    // No conflicts found - email is available
    return NextResponse.json({ available: true });
  } catch (err) {
    console.error("[check-email-type] Error:", err);
    // On error, allow through - the claim/create API will catch it
    return NextResponse.json({ available: true });
  }
}
