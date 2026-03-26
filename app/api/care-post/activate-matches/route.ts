import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { matchesLiveEmail } from "@/lib/email-templates";
import { PRIMARY_NEEDS, type PrimaryNeed } from "@/lib/types/benefits";
import { generateUniqueSlug } from "@/lib/slug";
import { sanitizeDisplayName } from "@/lib/validation";
import { getSiteUrl } from "@/lib/site-url";

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
 * Maps PrimaryNeed keys to display titles for care_types
 */
function mapNeedsToCareTypes(needs: PrimaryNeed[]): string[] {
  return needs
    .map((need) => PRIMARY_NEEDS[need]?.displayTitle)
    .filter(Boolean) as string[];
}

/**
 * POST /api/care-post/activate-matches
 *
 * Activates the family's Matches profile and sends a confirmation email.
 * If no family profile exists, creates one using Benefits Finder data.
 *
 * Request body:
 * - city: string (from location display)
 * - state: string (from location display or stateCode)
 * - primaryNeeds: PrimaryNeed[] (from Benefits Finder step 4)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { city, state, primaryNeeds = [] } = body as {
      city?: string;
      state?: string;
      primaryNeeds?: PrimaryNeed[];
    };

    // Use admin client to bypass RLS
    const adminClient = getAdminClient();
    const db = adminClient || supabase;

    // Get the user's account
    const { data: account, error: accountErr } = await db
      .from("accounts")
      .select("id, active_profile_id, display_name")
      .eq("user_id", user.id)
      .single();

    if (accountErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    let profileId = account.active_profile_id;
    let profile;

    // Step 1: Check if user has an active profile
    if (profileId) {
      const { data: existingProfile } = await db
        .from("business_profiles")
        .select("id, metadata, type, display_name, city, state, care_types")
        .eq("id", profileId)
        .single();

      if (existingProfile?.type === "family") {
        profile = existingProfile;
      } else {
        // Active profile is not a family profile — look for one
        profileId = null;
      }
    }

    // Step 2: If no family profile is active, look for an existing one
    if (!profileId) {
      const { data: existingFamilyProfile } = await db
        .from("business_profiles")
        .select("id, metadata, type, display_name, city, state, care_types")
        .eq("account_id", account.id)
        .eq("type", "family")
        .limit(1)
        .maybeSingle();

      if (existingFamilyProfile) {
        profile = existingFamilyProfile;
        profileId = existingFamilyProfile.id;

        // Set this as the active profile
        await db
          .from("accounts")
          .update({ active_profile_id: profileId })
          .eq("id", account.id);
      }
    }

    // Step 3: If no family profile exists, create one
    if (!profileId) {
      const rawName = account.display_name || user.user_metadata?.full_name || "";
      const displayName = sanitizeDisplayName(rawName, "Family");
      const careTypes = mapNeedsToCareTypes(primaryNeeds);
      const slug = await generateUniqueSlug(db, displayName, city || "", state || "");

      const { data: newProfile, error: insertErr } = await db
        .from("business_profiles")
        .insert({
          account_id: account.id,
          slug,
          type: "family",
          display_name: displayName,
          city: city || null,
          state: state || null,
          care_types: careTypes,
          claim_state: "claimed",
          verification_state: "unverified",
          source: "benefits_finder",
          is_active: true,
          metadata: {
            timeline: "exploring",
            visible_to_families: true,
            visible_to_providers: true,
          },
        })
        .select("id, metadata, type, display_name, city, state, care_types")
        .single();

      if (insertErr) {
        console.error("Create family profile error:", insertErr);
        return NextResponse.json(
          { error: `Failed to create profile: ${insertErr.message}` },
          { status: 500 }
        );
      }

      profile = newProfile;
      profileId = newProfile.id;

      // Set this as the active profile
      await db
        .from("accounts")
        .update({ active_profile_id: profileId })
        .eq("id", account.id);
    }

    // Now we have a family profile — proceed with activation
    if (!profile || !profileId) {
      return NextResponse.json({ error: "Failed to create or find family profile" }, { status: 500 });
    }

    // Mark onboarding as completed when going live
    // This prevents users from being stuck on Welcome page forever
    await db
      .from("accounts")
      .update({ onboarding_completed: true })
      .eq("id", account.id);

    const metadata = (profile.metadata || {}) as Record<string, unknown>;

    // Check if already active
    const carePost = metadata.care_post as { status?: string } | undefined;
    if (carePost?.status === "active") {
      return NextResponse.json({ error: "Matches already active" }, { status: 400 });
    }

    // Ensure timeline is set (required for care post)
    if (!metadata.timeline) {
      metadata.timeline = "exploring";
    }

    // Update profile with Benefits Finder data if missing
    const profileUpdate: Record<string, unknown> = {};
    if (!profile.city && city) profileUpdate.city = city;
    if (!profile.state && state) profileUpdate.state = state;
    if ((!profile.care_types || profile.care_types.length === 0) && primaryNeeds.length > 0) {
      profileUpdate.care_types = mapNeedsToCareTypes(primaryNeeds);
    }

    // Publish the care post
    metadata.care_post = {
      status: "active",
      published_at: new Date().toISOString(),
    };
    profileUpdate.metadata = metadata;

    const { error: updateError } = await db
      .from("business_profiles")
      .update(profileUpdate)
      .eq("id", profileId);

    if (updateError) {
      console.error("Matches activation error:", updateError);
      return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
    }

    // Log family engagement event (fire-and-forget)
    db.from("seeker_activity").insert({
      profile_id: profileId,
      event_type: "matches_activated",
      metadata: {
        care_types: profile.care_types || [],
        city: city || profile.city || null,
        state: state || profile.state || null,
      },
    }).then(({ error: actErr }: { error: { message: string } | null }) => {
      if (actErr) console.error("[seeker_activity] matches_activated insert failed:", actErr);
    });

    // Send confirmation email with magic link (best-effort - don't fail the API if email fails)
    const userEmail = user.email;
    const familyName = profile.display_name || "there";
    const locationCity = city || profile.city || "your area";
    const siteUrl = getSiteUrl();
    const finalDestination = "/portal/matches";

    if (userEmail) {
      try {
        const mlSubject = "Your Matches profile is live";
        const mlLogId = await reserveEmailLogId({ to: userEmail, subject: mlSubject, emailType: "matches_live", recipientType: "family" });

        // Generate magic link so user can access matches without logging in again
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const trackedDest = appendTrackingParams(finalDestination, mlLogId);
        let matchesUrl = `${siteUrl}${trackedDest}`;

        if (url && serviceKey) {
          const authClient = createClient(url, serviceKey);
          const { data: linkData, error: linkError } = await authClient.auth.admin.generateLink({
            type: "magiclink",
            email: userEmail,
            options: {
              // Use /auth/magic-link handler which processes implicit flow tokens
              redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(trackedDest)}`,
            },
          });

          if (!linkError && linkData?.properties?.action_link) {
            // Use the Supabase-generated magic link URL
            matchesUrl = linkData.properties.action_link;
          } else if (linkError) {
            console.warn("[activate-matches] Failed to generate magic link, using regular URL:", linkError);
          }
        }

        await sendEmail({
          to: userEmail,
          subject: mlSubject,
          html: matchesLiveEmail({
            familyName,
            city: locationCity,
            matchesUrl,
          }),
          emailType: "matches_live",
          recipientType: "family",
          emailLogId: mlLogId ?? undefined,
        });
        console.log("[activate-matches] Confirmation email sent to:", userEmail);
      } catch (emailErr) {
        // Log but don't fail - the activation succeeded
        console.error("[activate-matches] Failed to send confirmation email:", emailErr);
      }
    } else {
      console.warn("[activate-matches] No email address available for user:", user.id);
    }

    return NextResponse.json({
      success: true,
      profileId,
      care_post: metadata.care_post,
    });
  } catch (err) {
    console.error("Matches activation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
