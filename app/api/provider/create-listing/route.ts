import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
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
    console.warn("SUPABASE_SERVICE_ROLE_KEY not configured — falling back to authenticated client");
    return null;
  }
  return createClient(url, serviceKey);
}

/**
 * POST /api/provider/create-listing
 *
 * Creates a new provider listing for an authenticated user.
 * User must be authenticated via OTP verification before calling this endpoint.
 *
 * Request body:
 * - email: string
 * - orgName: string
 * - city: string
 * - state: string
 * - phone?: string
 * - careTypes: string[]
 *
 * Returns:
 * - 200: { profileId: string, slug: string }
 * - 401: Not authenticated
 * - 400: Missing required fields
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

    // Hard block: abuse domains may not create listings (see
    // lib/email-validation.ts BLOCKED_DOMAINS).
    if (isBlockedEmailDomain(user.email ?? "")) {
      console.warn(`[create-listing] blocked domain: ${user.email}`);
      return NextResponse.json(
        { error: "This email address can't be used to create a listing." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, orgName, city, state, phone, careTypes } = body;

    // Validate required fields
    if (!email || !orgName || !city || !state) {
      return NextResponse.json(
        { error: "email, orgName, city, and state are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Use admin client to bypass RLS
    const adminClient = getAdminClient();
    const db = adminClient || supabase;

    // Get or create the user's account
    let account;
    const { data: existingAccount, error: accountErr } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccount) {
      account = existingAccount;

      // STRICT ACCOUNT SEPARATION: Check if user already has a profile of a different type
      // One email = one account type (family, provider, caregiver are separate)
      const { data: anyExistingProfile } = await db
        .from("business_profiles")
        .select("id, type")
        .eq("account_id", existingAccount.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (anyExistingProfile && anyExistingProfile.type !== "organization") {
        return NextResponse.json(
          {
            error: "This email is already used for a different account type. Please use a different email to create a provider listing.",
            code: "ACCOUNT_TYPE_MISMATCH"
          },
          { status: 409 }
        );
      }

      // Check if user already has a provider profile (they can only have one for now)
      const { data: existingProviderProfile } = await db
        .from("business_profiles")
        .select("id, slug")
        .eq("account_id", existingAccount.id)
        .eq("type", "organization")
        .eq("is_active", true)
        .maybeSingle();

      if (existingProviderProfile) {
        // User already has a provider profile - return it instead of creating new
        return NextResponse.json({
          profileId: existingProviderProfile.id,
          slug: existingProviderProfile.slug,
          alreadyExists: true,
        });
      }
    } else {
      // Create account for new user
      const { data: newAccount, error: createAccountErr } = await db
        .from("accounts")
        .insert({
          user_id: user.id,
          email: normalizedEmail,
          type: "provider",
          onboarding_completed: true,
        })
        .select("id")
        .single();

      if (createAccountErr || !newAccount) {
        console.error("[create-listing] Failed to create account:", createAccountErr);
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }
      account = newAccount;
    }

    // Check for existing profile with same email to prevent duplicates
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, slug, display_name, claim_state, account_id")
      .ilike("email", normalizedEmail)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (existingProfile) {
      // Profile exists - claim it instead of creating new
      if (existingProfile.account_id && existingProfile.account_id !== account.id) {
        return NextResponse.json(
          { error: "A listing with this email already exists and is owned by another account" },
          { status: 409 }
        );
      }

      // Claim the existing profile
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({
          account_id: account.id,
          claim_state: "claimed",
          verification_state: "verified",
        })
        .eq("id", existingProfile.id);

      if (updateErr) {
        console.error("[create-listing] Failed to claim existing profile:", updateErr);
        return NextResponse.json(
          { error: "Failed to claim listing" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        profileId: existingProfile.id,
        slug: existingProfile.slug,
        claimed: true,
      });
    }

    // Generate slug for new profile
    const baseSlug = `${orgName}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    // Add random suffix to avoid collisions
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

    // Create new business_profile
    const { data: newProfile, error: createError } = await db
      .from("business_profiles")
      .insert({
        display_name: orgName.trim(),
        email: normalizedEmail,
        city: city.trim(),
        state: state.trim(),
        phone: phone?.trim() || null,
        care_types: careTypes || [],
        slug: uniqueSlug,
        type: "organization",
        claim_state: "claimed",
        verification_state: "verified",
        account_id: account.id,
        source: "self_service",
        is_active: true,
      })
      .select("id, slug")
      .single();

    if (createError || !newProfile) {
      console.error("[create-listing] Failed to create profile:", createError);
      return NextResponse.json(
        { error: "Failed to create listing" },
        { status: 500 }
      );
    }

    // Mark account onboarding as completed
    await db
      .from("accounts")
      .update({ onboarding_completed: true })
      .eq("id", account.id);

    return NextResponse.json({
      profileId: newProfile.id,
      slug: newProfile.slug,
      created: true,
    });
  } catch (err) {
    console.error("[create-listing] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
