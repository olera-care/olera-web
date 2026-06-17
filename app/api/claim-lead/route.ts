import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";
import {
  scoreClaimTrust,
  extractDomainFromWebsite,
  type ClaimTrustResult
} from "@/lib/claim-trust";
import { sendSlackAlert, slackProviderClaimed, slackSuspiciousClaim } from "@/lib/slack";

/**
 * GET /api/claim-lead?connectionId=<id>&otk=<token>
 *
 * One-click magic link landing for provider leads. Handles the entire
 * authentication flow server-side in a single response:
 *
 *  1. Validates the HMAC-signed token (provider email + expiry)
 *  2. Looks up the connection to verify it belongs to this provider
 *  3. Creates or resolves a Supabase auth user for the token's email
 *  4. Establishes a session by verifying a fresh magic-link OTP server-side,
 *     writing auth cookies onto the redirect response
 *  5. Links the provider's business_profile to the user's account (if unclaimed)
 *  6. Tracks the lead_opened event for engagement analytics
 *  7. Redirects to /provider/connections?id=<connectionId>
 *
 * FALLBACK BEHAVIOR:
 * If server-side auth fails at any step, we redirect to the onboard page
 * where they can claim their account manually. We never show an error page
 * that blocks the provider entirely.
 *
 * Query params:
 *   - otk: Required. The signed claim token (HMAC-SHA256)
 *   - connectionId: Optional. If provided, redirects to that specific lead.
 *                   If omitted, redirects to /provider/connections (list view)
 *   - eid: Optional. Email tracking ID for analytics
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("otk");
  const connectionId = url.searchParams.get("connectionId");
  const emailTrackingId = url.searchParams.get("eid");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  console.log("[claim-lead] route hit", {
    hasToken: !!token,
    connectionId: connectionId || "(none - list view)",
  });

  // Helper to fall back to onboard page when auth fails
  // IMPORTANT: We still track lead_opened even on fallback, so the connection
  // moves from "New" to "Viewed" in the admin panel. The provider clicked
  // the link and landed on our site - that's a "view" even if auth failed.
  const fallbackToOnboard = async (reason: string, slug?: string | null) => {
    console.log("[claim-lead] falling back to onboard:", { reason, slug, connectionId });

    // Track lead_opened even on fallback (if we have enough info)
    if (slug && connectionId) {
      try {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await admin.from("provider_activity").insert({
          provider_id: slug,
          event_type: "lead_opened",
          metadata: {
            connection_id: connectionId,
            lead_id: connectionId,
            source: "claim-lead-fallback",
            fallback_reason: reason,
          },
        });
        console.log("[claim-lead] Tracked lead_opened on fallback for:", slug);
      } catch (trackErr) {
        console.error("[claim-lead] Failed to track lead_opened on fallback:", trackErr);
      }
    }

    // If we don't have a slug, redirect to home
    if (!slug) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
    }

    // Redirect to onboard page where they can claim their account
    const fallbackUrl = new URL(`${siteUrl}/provider/${slug}/onboard`);
    fallbackUrl.searchParams.set("action", "lead");
    if (connectionId) {
      fallbackUrl.searchParams.set("actionId", connectionId);
    }
    return NextResponse.redirect(fallbackUrl.toString(), { status: 303 });
  };

  if (!token) {
    // No token - can't do anything, redirect to home
    return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
  }

  // 1. Validate token (HMAC + expiry)
  const validation = validateClaimToken(token);
  if (!validation.valid) {
    console.error("[claim-lead] token validation failed:", validation.error);
    // Token invalid/expired - redirect to onboard page if we have a slug, else home
    // This lets expired links still land on a useful page instead of a dead end
    return await fallbackToOnboard(validation.error, validation.providerId || null);
  }

  const { providerId: providerSlug, email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[claim-lead] missing env vars");
    return await fallbackToOnboard("missing env vars", providerSlug);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Look up the provider's business_profile by slug
  //    The token's providerId is actually the provider slug
  const { data: providerProfile, error: profileError } = await admin
    .from("business_profiles")
    .select("id, slug, email, account_id, source_provider_id, display_name, city, state, website")
    .or(`slug.eq.${providerSlug},source_provider_id.eq.${providerSlug},id.eq.${providerSlug}`)
    .in("type", ["organization", "caregiver"])
    .maybeSingle();

  if (!providerProfile) {
    console.error("[claim-lead] provider profile lookup failed:", profileError?.message || "not found");
    return await fallbackToOnboard("provider not found", providerSlug);
  }

  // Use the actual slug from the profile for onboard fallback (more reliable)
  const actualSlug = providerProfile.slug || providerProfile.source_provider_id || providerSlug;

  // Verify the token's email matches the provider's email
  if (providerProfile.email?.toLowerCase() !== normalizedEmail) {
    console.error("[claim-lead] email mismatch:", {
      tokenEmail: normalizedEmail,
      profileEmail: providerProfile.email?.toLowerCase(),
    });
    return await fallbackToOnboard("email mismatch", actualSlug);
  }

  // 3. If connectionId provided, verify it belongs to this provider
  let validConnectionId = connectionId;
  if (connectionId) {
    const { data: connection, error: connectionError } = await admin
      .from("connections")
      .select("id, to_profile_id")
      .eq("id", connectionId)
      .single();

    if (!connection) {
      console.warn("[claim-lead] connection not found:", connectionError?.message);
      validConnectionId = null; // Will redirect to list view
    } else if (connection.to_profile_id !== providerProfile.id) {
      console.warn("[claim-lead] connection doesn't belong to this provider");
      validConnectionId = null; // Will redirect to list view
    }
  }

  // 4. Create or resolve the auth user
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
      console.error("[claim-lead] createUser failed:", createError.message);
      return await fallbackToOnboard("createUser failed", actualSlug);
    }
  } else {
    userId = createdUser?.user?.id;
  }

  // 5. Generate a magic-link token hash we can verify to mint a session
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[claim-lead] generateLink failed:", linkError?.message);
    return await fallbackToOnboard("generateLink failed", actualSlug);
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // 6. Verify the OTP on a plain @supabase/supabase-js client with implicit flow
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
    console.error("[claim-lead] verifyOtp failed:", otpError?.message);
    return await fallbackToOnboard("verifyOtp failed", actualSlug);
  }

  // 7. Build the redirect response and write session cookies onto it
  const redirectTarget = new URL(`${siteUrl}/provider/connections`);

  // Add connection ID if we have a valid one (to open the drawer/highlight the lead)
  if (validConnectionId) {
    redirectTarget.searchParams.set("id", validConnectionId);
  }

  // Preserve email tracking ID for click attribution
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
    console.error("[claim-lead] setSession failed:", setSessionError.message);
    return await fallbackToOnboard("setSession failed", actualSlug);
  }

  // 8. Ensure an account row exists, then link the profile to it (idempotent)
  if (!userId) {
    console.error("[claim-lead] could not resolve userId");
    return await fallbackToOnboard("no userId", actualSlug);
  }

  let { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!account) {
    const displayName =
      providerProfile.display_name ||
      normalizedEmail.split("@")[0] ||
      "Provider";

    const { data: newAccount, error: accountError } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        display_name: displayName,
        onboarding_completed: true, // Provider onboarding happens implicitly via email claim
      })
      .select("id")
      .single();

    if (accountError) {
      // Handle race condition: if account creation failed due to unique constraint
      // (another request created it simultaneously), try to fetch it
      if (accountError.code === "23505") {
        const { data: raceAccount } = await admin
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .single();
        account = raceAccount;
      }

      if (!account) {
        console.error("[claim-lead] account creation failed:", accountError.message);
        // Session is already set, but without an account they can't claim the profile
        // Fall back to onboard page where they can try again
        return await fallbackToOnboard("account creation failed", actualSlug);
      }
    } else {
      account = newAccount;
    }
  }

  // 8b. Trust scoring & verification flow (matches /api/claim/finalize pattern)
  // Track whether this is a new claim (not a re-click)
  let isNewClaim = false;
  let trustResult: ClaimTrustResult = {
    level: "medium",
    reason: "not_scored"
  };

  // Link profile to account if possible
  if (account) {
    if (providerProfile.account_id && providerProfile.account_id !== account.id) {
      // Profile owned by someone else — still let them in
      console.warn("[claim-lead] profile already linked to different account");
    } else if (!providerProfile.account_id) {
      // This is a NEW claim - run trust scoring and link profile
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
        console.error("[claim-lead] trust scoring failed:", err);
      }

      const verificationState = trustResult.level === "high"
        ? "not_required"
        : "unverified";

      // Update all fields in one atomic operation (matches /api/claim/finalize pattern)
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
        console.error("[claim-lead] profile link failed:", linkErr.message);
        // Non-fatal: they're still signed in
        isNewClaim = false; // Failed to claim, don't send notifications
      } else {
        console.log("[claim-lead] profile linked to account with trust level:", trustResult.level);
      }

      // Set active profile if the account has none yet
      if (isNewClaim) {
        const { data: accountRow } = await admin
          .from("accounts")
          .select("active_profile_id")
          .eq("id", account.id)
          .single();

        if (!accountRow?.active_profile_id) {
          await admin
            .from("accounts")
            .update({ active_profile_id: providerProfile.id })
            .eq("id", account.id);
        }
      }
    }
  }

  // 9. Track events BEFORE returning (must complete before serverless terminates)
  const providerKey = providerProfile.slug || providerProfile.source_provider_id || providerProfile.id;

  // Track one_click_access event for observability
  const { error: accessError } = await admin.from("provider_activity").insert({
    provider_id: providerKey,
    event_type: "one_click_access",
    metadata: {
      source: "claim-lead",
      connection_id: validConnectionId || null,
      email: normalizedEmail,
      email_log_id: emailTrackingId || null,
    },
  });
  if (accessError) {
    console.error("[claim-lead] one_click_access tracking failed:", accessError.message);
  }

  // Only track lead_opened when we have a valid connection_id
  // Without connection_id, the event becomes an "orphan" that can't be matched
  // to a specific lead, causing providers to appear stuck in wrong tabs
  if (validConnectionId) {
    const { error: openedError } = await admin.from("provider_activity").insert({
      provider_id: providerKey,
      event_type: "lead_opened",
      metadata: {
        lead_id: validConnectionId,
        connection_id: validConnectionId,
        source: "claim-lead",
      },
    });
    if (openedError) {
      console.error("[claim-lead] lead_opened tracking failed:", openedError.message);
    }
  }

  // Track claim_completed event and send Slack notifications ONLY on new claims
  // (not on re-clicks of the claim link)
  if (isNewClaim) {
    // Track claim_completed event for admin visibility
    const { error: claimCompletedErr } = await admin.from("provider_activity").insert({
      provider_id: providerKey,
      profile_id: providerProfile.id,
      event_type: "claim_completed",
      metadata: {
        source: "email",
        connection_id: validConnectionId || null,
      },
    });
    if (claimCompletedErr) {
      console.error("[claim-lead] claim_completed tracking failed:", claimCompletedErr.message);
    }

    // Send Slack notifications (fire-and-forget)
    try {
      const alert = slackProviderClaimed({
        providerName: providerProfile.display_name || actualSlug,
        claimedByEmail: normalizedEmail,
        providerSlug: actualSlug,
        claimSource: "lead_email",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (slackErr) {
      console.error("[claim-lead] Slack claim notification failed:", slackErr);
    }

    // Suspicious claim alert for medium/low trust
    // Only send if trust scoring actually ran (not just using the default)
    if (trustResult.reason !== "not_scored" &&
        (trustResult.level === "medium" || trustResult.level === "low")) {
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
        console.error("[claim-lead] Slack suspicious claim alert failed:", slackErr);
      }
    }
  }

  console.log("[claim-lead] success, redirecting to:", redirectTarget.toString());

  return response;
}
