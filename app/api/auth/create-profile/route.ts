import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Account, Profile, ProfileCategory, Membership } from "@/lib/types";
import { sendLoopsEvent } from "@/lib/loops";
import { generateUniqueSlug } from "@/lib/slug";
import { validateDisplayName, sanitizeCareTypes } from "@/lib/validation";

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
 * POST /api/auth/create-profile
 *
 * Creates a business profile for the authenticated user.
 * Uses admin client to bypass RLS policies on business_profiles.
 *
 * Request body:
 * - intent: "family" | "provider"
 * - providerType?: "organization" | "caregiver" | null
 * - displayName: string
 * - orgName?: string
 * - city?: string
 * - state?: string
 * - zip?: string
 * - careTypes?: string[]
 * - category?: string | null
 * - description?: string
 * - phone?: string
 * - visibleToFamilies?: boolean
 * - visibleToProviders?: boolean
 * - claimedProfileId?: string | null
 * - careNeeds?: string[]
 * - isAddingProfile?: boolean
 *
 * Returns:
 * - 200: { profileId: string }
 * - 401: Not authenticated
 * - 400: Validation error
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
      intent,
      providerType,
      displayName,
      orgName,
      city,
      state,
      zip,
      careTypes = [],
      category,
      description,
      phone,
      visibleToFamilies,
      visibleToProviders,
      claimedProfileId,
      careNeeds,
      isAddingProfile = false,
    } = body;

    // Validate required fields
    if (!intent) {
      return NextResponse.json(
        { error: "Intent is required." },
        { status: 400 }
      );
    }

    // Validate and sanitize display name
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }
    const sanitizedDisplayName = nameValidation.value;

    // Sanitize care types arrays (filter invalid values, default to empty array)
    const sanitizedCareTypes = sanitizeCareTypes(careTypes);
    const sanitizedCareNeeds = sanitizeCareTypes(careNeeds);

    // Use admin client to bypass RLS, fall back to authenticated client
    const adminClient = getAdminClient();
    const db = adminClient || supabase;

    // Resolve the account for this user
    const { data: account, error: accountErr } = await db
      .from("accounts")
      .select("id, display_name")
      .eq("user_id", user.id)
      .single<Pick<Account, "id" | "display_name">>();

    if (accountErr || !account) {
      return NextResponse.json(
        { error: "Account not found. Please try again." },
        { status: 400 }
      );
    }

    const accountId = account.id;
    let profileId: string;

    if (intent === "provider") {
      const profileType = providerType === "caregiver" ? "caregiver" : "organization";

      if (claimedProfileId) {
        // Claiming an existing seeded profile
        // First, check if profile exists and is available for claiming
        const { data: existing, error: fetchErr } = await db
          .from("business_profiles")
          .select("account_id, display_name, city, state, zip, care_types, description, phone")
          .eq("id", claimedProfileId)
          .single<Profile & { account_id: string | null }>();

        if (fetchErr || !existing) {
          return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
          );
        }

        // Check if already claimed by someone else
        if (existing.account_id && existing.account_id !== accountId) {
          return NextResponse.json(
            { error: "This profile has already been claimed" },
            { status: 409 }
          );
        }

        // If already claimed by this user, just use it
        if (existing.account_id === accountId) {
          profileId = claimedProfileId;
        } else {
          // Atomic claim: only update if account_id is still NULL
          const claimUpdate: Record<string, unknown> = {
            account_id: accountId,
            claim_state: "pending",
          };

          if (!existing.display_name?.trim() && (orgName || sanitizedDisplayName))
            claimUpdate.display_name = orgName?.trim().slice(0, 100) || sanitizedDisplayName;
          if (!existing.city && city) claimUpdate.city = city;
          if (!existing.state && state) claimUpdate.state = state;
          if (!existing.zip && zip) claimUpdate.zip = zip;
          if ((!existing.care_types || existing.care_types.length === 0) && sanitizedCareTypes.length > 0)
            claimUpdate.care_types = sanitizedCareTypes;
          if (!existing.description?.trim() && description) claimUpdate.description = description;
          if (!existing.phone && phone) claimUpdate.phone = phone;

          // Use .is("account_id", null) to ensure atomic claim (race condition protection)
          const { data: claimResult, error: claimErr } = await db
            .from("business_profiles")
            .update(claimUpdate)
            .eq("id", claimedProfileId)
            .is("account_id", null)
            .select("id")
            .maybeSingle();

          if (claimErr) {
            console.error("Claim profile error:", claimErr);
            return NextResponse.json(
              { error: `Failed to claim profile: ${claimErr.message}` },
              { status: 500 }
            );
          }

          // If no rows were updated, someone else claimed it between our check and update
          if (!claimResult) {
            return NextResponse.json(
              { error: "This profile has already been claimed" },
              { status: 409 }
            );
          }

          profileId = claimedProfileId;
        }
      } else {
        // Create new provider profile
        const name = providerType === "organization" ? (orgName?.trim().slice(0, 100) || sanitizedDisplayName) : sanitizedDisplayName;
        const slug = await generateUniqueSlug(db, name, city || "", state || "");

        const { data: newProfile, error: insertErr } = await db
          .from("business_profiles")
          .insert({
            account_id: accountId,
            slug,
            type: profileType,
            category: (category as ProfileCategory) || null,
            display_name: name,
            description: description || null,
            phone: phone || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
            care_types: sanitizedCareTypes,
            claim_state: "pending",
            verification_state: "unverified",
            source: "user_created",
            is_active: true,
            metadata: {
              visible_to_families: visibleToFamilies ?? true,
              visible_to_providers: visibleToProviders ?? true,
            },
          })
          .select("id")
          .single();

        if (insertErr) {
          console.error("Create provider profile error:", insertErr);
          return NextResponse.json(
            { error: `Failed to create profile: ${insertErr.message}` },
            { status: 500 }
          );
        }

        profileId = newProfile.id;
      }

      // Create membership for providers (check first — no unique constraint on account_id)
      const { data: existingMembership } = await db
        .from("memberships")
        .select("id")
        .eq("account_id", accountId)
        .limit(1);

      if (!existingMembership || existingMembership.length === 0) {
        const { error: membershipErr } = await db.from("memberships").insert({
          account_id: accountId,
          plan: "free",
          status: "free",
        });

        if (membershipErr) {
          console.error("Create membership error:", membershipErr);
          return NextResponse.json(
            { error: `Failed to create membership: ${membershipErr.message}` },
            { status: 500 }
          );
        }
      }

      // Auto-create a baseline family profile so the Family Portal is always accessible.
      // Every user gets a family profile regardless of which portal they signed up through.
      const { data: existingFamilyProfile } = await db
        .from("business_profiles")
        .select("id")
        .eq("account_id", accountId)
        .eq("type", "family")
        .limit(1)
        .maybeSingle();

      if (!existingFamilyProfile) {
        const familySlug = await generateUniqueSlug(db, sanitizedDisplayName, city || "", state || "");
        await db.from("business_profiles").insert({
          account_id: accountId,
          slug: familySlug,
          type: "family",
          display_name: sanitizedDisplayName,
          city: city || null,
          state: state || null,
          care_types: [],
          claim_state: "claimed",
          verification_state: "unverified",
          source: "user_created",
          is_active: true,
          metadata: {
            visible_to_families: false,
            visible_to_providers: false,
          },
        });
      }
    } else {
      // Family profile — check if a baseline one already exists (created by ensure-account)
      const { data: existingFamilyProfile } = await db
        .from("business_profiles")
        .select("id, metadata")
        .eq("account_id", accountId)
        .eq("type", "family")
        .limit(1)
        .maybeSingle();

      if (existingFamilyProfile) {
        // Update the existing baseline family profile with the user's info
        // IMPORTANT: Preserve existing metadata (like care_post) while updating visibility flags
        const existingMetadata = (existingFamilyProfile.metadata || {}) as Record<string, unknown>;
        const mergedMetadata = {
          ...existingMetadata,
          visible_to_families: visibleToFamilies ?? existingMetadata.visible_to_families ?? true,
          visible_to_providers: visibleToProviders ?? existingMetadata.visible_to_providers ?? true,
        };

        const { error: updateErr } = await db
          .from("business_profiles")
          .update({
            display_name: sanitizedDisplayName,
            city: city || null,
            state: state || null,
            zip: zip || null,
            care_types: sanitizedCareNeeds.length > 0 ? sanitizedCareNeeds : sanitizedCareTypes,
            metadata: mergedMetadata,
          })
          .eq("id", existingFamilyProfile.id);

        if (updateErr) {
          console.error("Update family profile error:", updateErr);
          return NextResponse.json(
            { error: `Failed to update profile: ${updateErr.message}` },
            { status: 500 }
          );
        }

        profileId = existingFamilyProfile.id;
      } else {
        // No existing family profile — create one
        const slug = await generateUniqueSlug(db, sanitizedDisplayName, city || "", state || "");

        const { data: newProfile, error: insertErr } = await db
          .from("business_profiles")
          .insert({
            account_id: accountId,
            slug,
            type: "family",
            display_name: sanitizedDisplayName,
            city: city || null,
            state: state || null,
            zip: zip || null,
            care_types: sanitizedCareNeeds.length > 0 ? sanitizedCareNeeds : sanitizedCareTypes,
            claim_state: "claimed",
            verification_state: "unverified",
            source: "user_created",
            is_active: true,
            metadata: {
              visible_to_families: visibleToFamilies ?? true,
              visible_to_providers: visibleToProviders ?? true,
            },
          })
          .select("id")
          .single();

        if (insertErr) {
          console.error("Create family profile error:", insertErr);
          return NextResponse.json(
            { error: `Failed to create profile: ${insertErr.message}` },
            { status: 500 }
          );
        }

        profileId = newProfile.id;
      }
    }

    // Update account: mark onboarding complete + set active profile
    const accountUpdate: Record<string, unknown> = {
      onboarding_completed: true,
    };
    if (!account.display_name) {
      accountUpdate.display_name = sanitizedDisplayName;
    }
    if (!isAddingProfile) {
      accountUpdate.active_profile_id = profileId;
    }

    const { error: updateErr } = await db
      .from("accounts")
      .update(accountUpdate)
      .eq("id", accountId);

    if (updateErr) {
      console.error("Update account error:", updateErr);
      // Profile was created — don't fail the whole request
    }

    // Loops: onboarding completed
    try {
      const profileType = intent === "provider"
        ? (providerType === "caregiver" ? "caregiver" : "organization")
        : "family";
      const providerName = intent === "provider"
        ? (orgName?.trim().slice(0, 100) || sanitizedDisplayName)
        : sanitizedDisplayName;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
      await sendLoopsEvent({
        email: user.email || "",
        eventName: "onboarding_completed",
        audience: intent === "provider" ? "provider" : "seeker",
        eventProperties: {
          intent,
          profileType,
          provider_name: providerName,
          profile_link: `${siteUrl}/portal/profile`,
          city: city || "",
          state: state || "",
          care_type: sanitizedCareTypes[0] || "",
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ profileId });
  } catch (err) {
    console.error("Create profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
