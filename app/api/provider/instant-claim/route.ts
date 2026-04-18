import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateUniqueSlug } from "@/lib/slug";
import { sendEmail } from "@/lib/email";

/**
 * Creates a Supabase admin client with service role key.
 * Bypasses RLS — only use server-side.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(url, serviceKey);
}

/**
 * Generate a simple provider welcome email HTML
 */
function providerWelcomeEmailHtml(opts: {
  providerName: string;
  dashboardUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Welcome to Olera</h1>
      <p style="font-size: 15px; color: #6b7280; margin: 0 0 20px; line-height: 1.5;">
        Hi ${opts.providerName}, you've successfully claimed your listing on Olera.
      </p>
      <p style="font-size: 15px; color: #6b7280; margin: 0 0 8px; line-height: 1.5;">Here's what you can do now:</p>
      <ul style="font-size: 14px; color: #6b7280; margin: 0 0 24px; padding-left: 20px; line-height: 1.8;">
        <li><strong>Complete your profile</strong> to attract more families</li>
        <li><strong>Respond to inquiries</strong> from care seekers</li>
        <li><strong>Hire caregivers</strong> through MedJobs</li>
      </ul>
      <div style="text-align: center;">
        <a href="${opts.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #199087; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
      </div>
    </div>
    <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
      &copy; ${new Date().getFullYear()} Olera Care. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * POST /api/provider/instant-claim
 *
 * Instantly claims an olera-providers listing for users with business emails.
 * Creates auth user, account, business_profile, and membership in one go.
 * Returns a token for auto-sign-in on the client.
 *
 * Request body:
 * - providerId: string (provider_id from olera-providers, or source_provider_id for business_profiles)
 * - providerName: string
 * - providerSlug?: string
 * - email: string (user's business email)
 * - city?: string
 * - state?: string
 * - sourceType?: "olera-providers" | "business_profiles" (indicates source of the listing)
 * - sourceProviderId?: string (for business_profiles, the linked olera-providers ID if any)
 *
 * Returns:
 * - 200: { tokenHash: string, profileId: string, accountId: string }
 * - 400: Validation error
 * - 409: Already claimed or account conflict
 * - 429: Rate limited
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      providerId,
      providerName,
      providerSlug,
      email,
      city,
      state,
      sourceType,
      sourceProviderId,
    } = body;

    // Validation
    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = providerName?.trim() || "Provider";

    const supabaseAdmin = getAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    // ─── Rate limiting: max 5 instant claim attempts per email per hour ───
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabaseAdmin
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", normalizedEmail)
      .eq("email_type", "provider_instant_claim_attempt")
      .gte("created_at", oneHourAgo);

    if ((recentAttempts ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Too many claim attempts. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // Log this attempt for rate limiting (fire-and-forget)
    void supabaseAdmin
      .from("email_log")
      .insert({
        recipient_email: normalizedEmail,
        sender_email: "system",
        subject: "Instant claim attempt",
        email_type: "provider_instant_claim_attempt",
        recipient_type: "provider",
      })
      .then(({ error }) => {
        if (error) console.error("[instant-claim] rate limit log error:", error);
      });

    // ─── Determine the actual source_provider_id ───
    // If the listing came from business_profiles, use its source_provider_id
    // If it came from olera-providers, use providerId directly
    let actualSourceProviderId: string;
    if (sourceType === "business_profiles" && sourceProviderId) {
      actualSourceProviderId = sourceProviderId;
    } else {
      actualSourceProviderId = providerId;
    }

    // ─── Check if listing is already claimed or has pending claim ───
    const { data: existingProfile } = await supabaseAdmin
      .from("business_profiles")
      .select("id, account_id, claim_state, email, city, state")
      .eq("source_provider_id", actualSourceProviderId)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.claim_state === "claimed" && existingProfile.account_id) {
        return NextResponse.json(
          { error: "This listing has already been claimed by another account", code: "ALREADY_CLAIMED" },
          { status: 409 }
        );
      }

      // If there's a pending claim by a different email, block
      if (existingProfile.claim_state === "pending" && existingProfile.email) {
        const pendingEmail = existingProfile.email.toLowerCase();
        if (pendingEmail !== normalizedEmail) {
          return NextResponse.json(
            { error: "This listing has a pending claim. Please try again later.", code: "PENDING_CLAIM" },
            { status: 409 }
          );
        }
        // Same email - they can proceed (maybe they're retrying)
      }
    }

    // ─── Create or get auth user ───
    // Instead of listUsers(), we try to create and handle the "already exists" error
    let authUserId: string;

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { display_name: displayName, source: "provider-instant-claim" },
    });

    if (createUserError) {
      if (
        createUserError.message?.includes("already been registered") ||
        createUserError.message?.includes("already exists")
      ) {
        // User exists - get their ID via generateLink (efficient, single lookup)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedEmail,
        });
        if (linkError || !linkData?.user?.id) {
          console.error("[instant-claim] failed to resolve existing user:", linkError);
          throw new Error("User exists but could not be resolved");
        }
        authUserId = linkData.user.id;
        console.log("[instant-claim] existing auth user found:", authUserId);
      } else {
        throw createUserError;
      }
    } else {
      authUserId = newUser.user.id;
      console.log("[instant-claim] new auth user created:", authUserId);
    }

    // ─── Check existing account and profile type ───
    const { data: existingAccount } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (existingAccount) {
      // Check what type of profile they have
      const { data: accountProfile } = await supabaseAdmin
        .from("business_profiles")
        .select("id, type, source_provider_id")
        .eq("account_id", existingAccount.id)
        .eq("is_active", true)
        .maybeSingle();

      if (accountProfile) {
        // Block if they have a non-organization profile (family/caregiver)
        if (accountProfile.type !== "organization") {
          return NextResponse.json(
            {
              error: "This email is already used for a personal account. Please use a different business email.",
              code: "ACCOUNT_TYPE_MISMATCH"
            },
            { status: 409 }
          );
        }

        // Block if they have a different organization profile
        if (accountProfile.source_provider_id !== actualSourceProviderId) {
          return NextResponse.json(
            {
              error: "You already have a business profile. Please sign in to manage your listing.",
              code: "PROFILE_EXISTS"
            },
            { status: 409 }
          );
        }

        // They're re-claiming the same listing - this is fine, continue
        console.log("[instant-claim] user re-claiming same listing");
      }
    }

    // ─── Create or get account ───
    let accountId: string;

    if (existingAccount) {
      accountId = existingAccount.id;
      console.log("[instant-claim] using existing account:", accountId);
    } else {
      const { data: newAccount, error: accountError } = await supabaseAdmin
        .from("accounts")
        .insert({
          user_id: authUserId,
          display_name: displayName,
          onboarding_completed: true,
        })
        .select("id")
        .single();

      if (accountError) {
        console.error("[instant-claim] account creation error:", accountError);
        throw accountError;
      }
      accountId = newAccount.id;
      console.log("[instant-claim] new account created:", accountId);
    }

    // ─── Create or update business_profile ───
    const slug = providerSlug || await generateUniqueSlug(supabaseAdmin, displayName);

    let profileId: string;

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("business_profiles")
        .update({
          account_id: accountId,
          display_name: displayName,
          email: normalizedEmail,
          city: city || existingProfile.city || null,
          state: state || existingProfile.state || null,
          claim_state: "claimed",
          verification_state: "verified",
          is_active: true,
        })
        .eq("id", existingProfile.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("[instant-claim] profile update error:", updateError);
        throw updateError;
      }
      profileId = updatedProfile.id;
      console.log("[instant-claim] profile updated:", profileId);
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("business_profiles")
        .insert({
          source_provider_id: actualSourceProviderId,
          account_id: accountId,
          display_name: displayName,
          slug,
          email: normalizedEmail,
          city: city || null,
          state: state || null,
          type: "organization",
          claim_state: "claimed",
          verification_state: "verified",
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[instant-claim] profile creation error:", insertError);
        throw insertError;
      }
      profileId = newProfile.id;
      console.log("[instant-claim] profile created:", profileId);
    }

    // ─── Create membership if not exists ───
    const { data: existingMembership } = await supabaseAdmin
      .from("memberships")
      .select("id")
      .eq("account_id", accountId)
      .maybeSingle();

    if (!existingMembership) {
      const { error: membershipError } = await supabaseAdmin
        .from("memberships")
        .insert({
          account_id: accountId,
          plan: "free",
          status: "free",
        });

      if (membershipError) {
        // Log but don't fail - membership is not critical for basic functionality
        console.error("[instant-claim] membership creation error:", membershipError);
      } else {
        console.log("[instant-claim] membership created for account:", accountId);
      }
    }

    // ─── Update account's active_profile_id ───
    await supabaseAdmin
      .from("accounts")
      .update({
        active_profile_id: profileId,
        onboarding_completed: true,
      })
      .eq("id", accountId);

    // ─── Generate auto-sign-in token ───
    let tokenHash: string | undefined;

    try {
      const { data: signInLink } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/provider` },
      });
      if (signInLink?.properties?.hashed_token) {
        tokenHash = signInLink.properties.hashed_token;
      }
    } catch (err) {
      console.error("[instant-claim] sign-in token error:", err);
    }

    // ─── Send welcome email (fire-and-forget) ───
    sendEmail({
      to: normalizedEmail,
      subject: "Welcome to Olera!",
      html: providerWelcomeEmailHtml({
        providerName: displayName,
        dashboardUrl: `${siteUrl}/provider`,
      }),
      emailType: "provider_welcome",
      recipientType: "provider",
      providerId: profileId,
    }).catch((err) => {
      console.error("[instant-claim] welcome email error:", err);
    });

    return NextResponse.json({
      tokenHash,
      profileId,
      accountId,
    });

  } catch (error) {
    console.error("[instant-claim] error:", error);
    return NextResponse.json(
      { error: "Failed to claim listing" },
      { status: 500 }
    );
  }
}
