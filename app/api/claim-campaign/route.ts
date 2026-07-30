import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";
import {
  scoreClaimTrust,
  extractDomainFromWebsite,
  type ClaimTrustResult,
} from "@/lib/claim-trust";
import { sendSlackAlert, slackProviderClaimed, slackSuspiciousClaim } from "@/lib/slack";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * GET /api/claim-campaign?otk=<token>
 *
 * One-click magic link landing for provider cold outreach emails (SmartLead).
 * Handles the entire authentication flow server-side in a single response:
 *
 *  1. Validates the HMAC-signed token (provider email + expiry)
 *  2. Looks up the provider (olera-providers → business_profiles)
 *  3. Creates or resolves a Supabase auth user for the token's email
 *  4. Establishes a session by verifying a fresh magic-link OTP server-side,
 *     writing auth cookies onto the redirect response
 *  5. Links the provider's business_profile to the user's account (if unclaimed)
 *  6. Runs trust scoring for verification flow
 *  7. Tracks one_click_access and claim_completed events
 *  8. Sends Slack notifications for new claims
 *  9. Sends deferred notifications for pending leads/questions
 * 10. Redirects to /provider dashboard
 *
 * FALLBACK BEHAVIOR:
 * If server-side auth fails at any step, we redirect to the onboard page
 * where they can claim their account manually. We never show an error page
 * that blocks the provider entirely.
 *
 * Query params:
 *   - otk: Required. The signed claim token (HMAC-SHA256)
 *   - eid: Optional. Email tracking ID for analytics
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("otk");
  const emailTrackingId = url.searchParams.get("eid");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  console.log("[claim-campaign] route hit", { hasToken: !!token });

  // Helper to fall back to onboard page when auth fails
  const fallbackToOnboard = (reason: string, slug?: string | null) => {
    console.log("[claim-campaign] falling back to onboard:", { reason, slug });
    if (!slug) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
    }
    const fallbackUrl = new URL(`${siteUrl}/provider/${slug}/onboard`);
    fallbackUrl.searchParams.set("action", "claim");
    return NextResponse.redirect(fallbackUrl.toString(), { status: 303 });
  };

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
  }

  // 1. Validate token (HMAC + expiry)
  const validation = validateClaimToken(token);
  if (!validation.valid) {
    console.error("[claim-campaign] token validation failed:", validation.error);
    return fallbackToOnboard(validation.error, validation.providerId || null);
  }

  const { providerId, email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[claim-campaign] missing env vars");
    return fallbackToOnboard("missing env vars", providerId);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Look up the provider - first try olera-providers, then business_profiles
  //    The token's providerId could be a UUID (provider_id) or a slug
  let providerProfile: {
    id: string;
    slug: string | null;
    email: string | null;
    account_id: string | null;
    source_provider_id: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    website: string | null;
  } | null = null;

  // Try business_profiles first (claimed or unclaimed profiles)
  const { data: bpProfile } = await admin
    .from("business_profiles")
    .select("id, slug, email, account_id, source_provider_id, display_name, city, state, website")
    .or(`slug.eq.${providerId},source_provider_id.eq.${providerId},id.eq.${providerId}`)
    .in("type", ["organization", "caregiver"])
    .maybeSingle();

  if (bpProfile) {
    providerProfile = bpProfile;
  } else {
    // No BP exists yet - look up in olera-providers to get provider details
    // We'll need to create a BP after auth
    const { data: oleraProvider } = await admin
      .from("olera-providers")
      .select("provider_id, slug, email, provider_name, city, state, website")
      .or(`provider_id.eq.${providerId},slug.eq.${providerId}`)
      .maybeSingle();

    if (oleraProvider) {
      // Create a temporary profile object - we'll create the real BP after auth
      providerProfile = {
        id: "", // Will be set after BP creation
        slug: oleraProvider.slug || providerId,
        email: oleraProvider.email,
        account_id: null,
        source_provider_id: oleraProvider.provider_id,
        display_name: oleraProvider.provider_name,
        city: oleraProvider.city,
        state: oleraProvider.state,
        website: oleraProvider.website,
      };
    }
  }

  if (!providerProfile) {
    console.error("[claim-campaign] provider not found");
    return fallbackToOnboard("provider not found", providerId);
  }

  const actualSlug = providerProfile.slug || providerProfile.source_provider_id || providerId;

  // Verify the token's email matches the provider's email
  if (providerProfile.email?.toLowerCase() !== normalizedEmail) {
    console.error("[claim-campaign] email mismatch:", {
      tokenEmail: normalizedEmail,
      profileEmail: providerProfile.email?.toLowerCase(),
    });
    return fallbackToOnboard("email mismatch", actualSlug);
  }

  // 3. Create or resolve the auth user
  let userId: string | undefined;
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });

  if (createError) {
    const alreadyExists =
      createError.message?.includes("already been registered") ||
      createError.message?.includes("already exists");
    if (!alreadyExists) {
      console.error("[claim-campaign] createUser failed:", createError.message);
      return fallbackToOnboard("createUser failed", actualSlug);
    }
  } else {
    userId = createdUser?.user?.id;
  }

  // 4. Generate a magic-link token hash we can verify to mint a session
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[claim-campaign] generateLink failed:", linkError?.message);
    return fallbackToOnboard("generateLink failed", actualSlug);
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // 5. Verify the OTP on a plain @supabase/supabase-js client with implicit flow
  //    @supabase/ssr's createServerClient may force PKCE, which would reject
  //    token_hash verification
  const otpClient = createClient(supabaseUrl, anonKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: otpData, error: otpError } = await otpClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });

  if (otpError || !otpData?.session) {
    console.error("[claim-campaign] verifyOtp failed:", otpError?.message);
    return fallbackToOnboard("verifyOtp failed", actualSlug);
  }

  // 6. Build the redirect response and write session cookies onto it
  const redirectTarget = new URL(`${siteUrl}/provider`);
  if (emailTrackingId) {
    redirectTarget.searchParams.set("eid", emailTrackingId);
  }

  const response = NextResponse.redirect(redirectTarget, { status: 303 });

  const ssrClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error: setSessionError } = await ssrClient.auth.setSession({
    access_token: otpData.session.access_token,
    refresh_token: otpData.session.refresh_token,
  });

  if (setSessionError) {
    console.error("[claim-campaign] setSession failed:", setSessionError.message);
    return fallbackToOnboard("setSession failed", actualSlug);
  }

  // 7. Ensure an account row exists, then link the profile to it
  if (!userId) {
    console.error("[claim-campaign] could not resolve userId");
    return fallbackToOnboard("no userId", actualSlug);
  }

  let { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!account) {
    const displayName =
      providerProfile.display_name || normalizedEmail.split("@")[0] || "Provider";

    const { data: newAccount, error: accountError } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        display_name: displayName,
        onboarding_completed: true,
      })
      .select("id")
      .single();

    if (accountError) {
      // Handle race condition
      if (accountError.code === "23505") {
        const { data: raceAccount } = await admin
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .single();
        account = raceAccount;
      }

      if (!account) {
        console.error("[claim-campaign] account creation failed:", accountError.message);
        return fallbackToOnboard("account creation failed", actualSlug);
      }
    } else {
      account = newAccount;
    }
  }

  // 8. Trust scoring & profile linking
  let isNewClaim = false;
  let trustResult: ClaimTrustResult = { level: "medium", reason: "not_scored" };
  let finalProfileId = providerProfile.id;

  if (account) {
    // If no BP exists yet (olera-providers only), create one now
    if (!providerProfile.id && providerProfile.source_provider_id) {
      // Run trust scoring BEFORE creating BP
      try {
        trustResult = await scoreClaimTrust({
          email: normalizedEmail,
          providerName: providerProfile.display_name || actualSlug,
          providerCity: providerProfile.city,
          providerState: providerProfile.state,
          providerDomain: extractDomainFromWebsite(providerProfile.website),
        });
      } catch (err) {
        console.error("[claim-campaign] trust scoring failed:", err);
      }

      const verificationState = trustResult.level === "high" ? "not_required" : "unverified";

      const { data: newBp, error: bpCreateError } = await admin
        .from("business_profiles")
        .insert({
          type: "organization",
          slug: actualSlug,
          source_provider_id: providerProfile.source_provider_id,
          display_name: providerProfile.display_name,
          email: normalizedEmail,
          city: providerProfile.city,
          state: providerProfile.state,
          website: providerProfile.website,
          account_id: account.id,
          claim_state: "claimed",
          verification_state: verificationState,
          claim_trust_level: trustResult.level,
          claim_trust_reason: trustResult.reason,
        })
        .select("id")
        .single();

      if (bpCreateError) {
        // Handle race condition: if BP creation failed due to unique constraint
        // (another request created it simultaneously), try to fetch and link it
        if (bpCreateError.code === "23505") {
          console.log("[claim-campaign] BP already exists (race condition), fetching...");
          const { data: existingBp } = await admin
            .from("business_profiles")
            .select("id, account_id")
            .or(`slug.eq.${actualSlug},source_provider_id.eq.${providerProfile.source_provider_id}`)
            .in("type", ["organization", "caregiver"])
            .maybeSingle();

          if (existingBp) {
            finalProfileId = existingBp.id;
            // Only mark as new claim if it wasn't already linked to an account
            if (!existingBp.account_id) {
              isNewClaim = true;
              // Link it to this account
              await admin
                .from("business_profiles")
                .update({
                  account_id: account.id,
                  claim_state: "claimed",
                  verification_state: verificationState,
                  claim_trust_level: trustResult.level,
                  claim_trust_reason: trustResult.reason,
                })
                .eq("id", existingBp.id);
            }
          }
        } else {
          console.error("[claim-campaign] BP creation failed:", bpCreateError.message);
        }
      } else if (newBp) {
        finalProfileId = newBp.id;
        isNewClaim = true;
        console.log("[claim-campaign] new BP created with trust level:", trustResult.level);
      }

      // Send deferred notifications for new claims
      if (isNewClaim && finalProfileId) {
        sendDeferredNotificationsForProvider({
          profileId: finalProfileId,
          email: normalizedEmail,
          providerName: providerProfile.display_name || actualSlug,
          providerSlug: actualSlug,
          additionalSlugVariants: providerProfile.source_provider_id
            ? [providerProfile.source_provider_id]
            : [],
        }).catch((err) => {
          console.error("[claim-campaign] deferred notifications failed:", err);
        });
      }
    } else if (providerProfile.account_id && providerProfile.account_id !== account.id) {
      // Profile owned by someone else - still let them in
      console.warn("[claim-campaign] profile already linked to different account");
    } else if (!providerProfile.account_id) {
      // Existing BP but unclaimed - run trust scoring and link profile
      isNewClaim = true;

      try {
        trustResult = await scoreClaimTrust({
          email: normalizedEmail,
          providerName: providerProfile.display_name || actualSlug,
          providerCity: providerProfile.city,
          providerState: providerProfile.state,
          providerDomain: extractDomainFromWebsite(providerProfile.website),
        });
      } catch (err) {
        console.error("[claim-campaign] trust scoring failed:", err);
      }

      const verificationState = trustResult.level === "high" ? "not_required" : "unverified";

      const { error: linkErr } = await admin
        .from("business_profiles")
        .update({
          account_id: account.id,
          claim_state: "claimed",
          verification_state: verificationState,
          claim_trust_level: trustResult.level,
          claim_trust_reason: trustResult.reason,
        })
        .eq("id", providerProfile.id);

      if (linkErr) {
        console.error("[claim-campaign] profile link failed:", linkErr.message);
        isNewClaim = false;
      } else {
        console.log("[claim-campaign] profile linked with trust level:", trustResult.level);

        // Send deferred notifications for pending leads/questions
        sendDeferredNotificationsForProvider({
          profileId: providerProfile.id,
          email: normalizedEmail,
          providerName: providerProfile.display_name || actualSlug,
          providerSlug: actualSlug,
          additionalSlugVariants: providerProfile.source_provider_id
            ? [providerProfile.source_provider_id]
            : [],
        }).catch((err) => {
          console.error("[claim-campaign] deferred notifications failed:", err);
        });
      }
    }

    // Set active profile if the account has none yet (for ALL new claims)
    if (isNewClaim && finalProfileId) {
      const { data: accountRow } = await admin
        .from("accounts")
        .select("active_profile_id")
        .eq("id", account.id)
        .single();

      if (!accountRow?.active_profile_id) {
        await admin
          .from("accounts")
          .update({ active_profile_id: finalProfileId })
          .eq("id", account.id);
      }
    }
  }

  // 9. Track events BEFORE returning
  const providerKey = actualSlug;

  // Track one_click_access event
  const { error: accessError } = await admin.from("provider_activity").insert({
    provider_id: providerKey,
    event_type: "one_click_access",
    metadata: {
      source: "cold_outreach",
      email: normalizedEmail,
      email_log_id: emailTrackingId || null,
    },
  });
  if (accessError) {
    console.error("[claim-campaign] one_click_access tracking failed:", accessError.message);
  }

  // Track claim_completed and send Slack notifications ONLY on new claims
  if (isNewClaim) {
    const { error: claimCompletedErr } = await admin.from("provider_activity").insert({
      provider_id: providerKey,
      profile_id: finalProfileId || providerProfile.id,
      event_type: "claim_completed",
      metadata: {
        source: "cold_outreach",
      },
    });
    if (claimCompletedErr) {
      console.error("[claim-campaign] claim_completed tracking failed:", claimCompletedErr.message);
    }

    // Send Slack notifications
    try {
      const alert = slackProviderClaimed({
        providerName: providerProfile.display_name || actualSlug,
        claimedByEmail: normalizedEmail,
        providerSlug: actualSlug,
        claimSource: "cold_outreach",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (slackErr) {
      console.error("[claim-campaign] Slack claim notification failed:", slackErr);
    }

    // Suspicious claim alert for medium/low trust
    if (
      trustResult.reason !== "not_scored" &&
      (trustResult.level === "medium" || trustResult.level === "low")
    ) {
      try {
        const suspiciousAlert = slackSuspiciousClaim({
          providerName: providerProfile.display_name || actualSlug,
          providerSlug: actualSlug,
          claimedByEmail: normalizedEmail,
          trustLevel: trustResult.level,
          trustReason: trustResult.reason,
        });
        await sendSlackAlert(suspiciousAlert.text, suspiciousAlert.blocks);
      } catch (slackErr) {
        console.error("[claim-campaign] Slack suspicious claim alert failed:", slackErr);
      }
    }
  }

  console.log("[claim-campaign] success, redirecting to:", redirectTarget.toString());

  return response;
}
