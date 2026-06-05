import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

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
 * so the provider can still sign in manually. We never show an error page
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
  const fallbackToOnboard = (reason: string, slug?: string | null) => {
    console.log("[claim-lead] falling back to onboard:", { reason, slug, connectionId });

    // If we don't have a slug, redirect to home
    if (!slug) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
    }

    // Redirect to onboard page with the lead action params
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
    return fallbackToOnboard(validation.error, validation.providerId || null);
  }

  const { providerId: providerSlug, email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[claim-lead] missing env vars");
    return fallbackToOnboard("missing env vars", providerSlug);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Look up the provider's business_profile by slug
  //    The token's providerId is actually the provider slug
  const { data: providerProfile, error: profileError } = await admin
    .from("business_profiles")
    .select("id, slug, email, account_id, source_provider_id, display_name")
    .or(`slug.eq.${providerSlug},source_provider_id.eq.${providerSlug},id.eq.${providerSlug}`)
    .in("type", ["organization", "caregiver"])
    .maybeSingle();

  if (!providerProfile) {
    console.error("[claim-lead] provider profile lookup failed:", profileError?.message || "not found");
    return fallbackToOnboard("provider not found", providerSlug);
  }

  // Use the actual slug from the profile for onboard fallback (more reliable)
  const actualSlug = providerProfile.slug || providerProfile.source_provider_id || providerSlug;

  // Verify the token's email matches the provider's email
  if (providerProfile.email?.toLowerCase() !== normalizedEmail) {
    console.error("[claim-lead] email mismatch:", {
      tokenEmail: normalizedEmail,
      profileEmail: providerProfile.email?.toLowerCase(),
    });
    return fallbackToOnboard("email mismatch", actualSlug);
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
      return fallbackToOnboard("createUser failed", actualSlug);
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
    return fallbackToOnboard("generateLink failed", actualSlug);
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
    return fallbackToOnboard("verifyOtp failed", actualSlug);
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
    return fallbackToOnboard("setSession failed", actualSlug);
  }

  // 8. Ensure an account row exists, then link the profile to it (idempotent)
  if (!userId) {
    console.error("[claim-lead] could not resolve userId");
    return fallbackToOnboard("no userId", actualSlug);
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
      })
      .select("id")
      .single();

    if (accountError || !newAccount) {
      console.error("[claim-lead] account insert failed:", accountError?.message);
      // Non-fatal: session is already set, they're signed in
      // Just won't have the profile linked properly
    } else {
      account = newAccount;
    }
  }

  // Link profile to account if possible
  if (account) {
    if (providerProfile.account_id && providerProfile.account_id !== account.id) {
      // Profile owned by someone else — still let them in
      console.warn("[claim-lead] profile already linked to different account");
    } else if (!providerProfile.account_id) {
      // Link the unclaimed profile to this account
      const { error: linkErr } = await admin
        .from("business_profiles")
        .update({ account_id: account.id, claim_state: "claimed" })
        .eq("id", providerProfile.id);

      if (linkErr) {
        console.error("[claim-lead] profile link failed:", linkErr.message);
        // Non-fatal: they're still signed in
      } else {
        console.log("[claim-lead] profile linked to account");
      }

      // Set active profile if the account has none yet
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

  // 9. Track events (fire-and-forget, non-blocking)
  const providerKey = providerProfile.slug || providerProfile.source_provider_id || providerProfile.id;

  // Track one_click_access event for observability
  (async () => {
    try {
      await admin.from("provider_activity").insert({
        provider_id: providerKey,
        event_type: "one_click_access",
        metadata: {
          source: "claim-lead",
          connection_id: validConnectionId || null,
          email: normalizedEmail,
          email_log_id: emailTrackingId || null,
        },
      });
    } catch (err) {
      console.error("[claim-lead] activity tracking failed:", err);
    }
  })();

  // Track lead_opened if we have a specific connection
  if (validConnectionId) {
    (async () => {
      try {
        await admin.from("provider_activity").insert({
          provider_id: providerKey,
          event_type: "lead_opened",
          metadata: {
            lead_id: validConnectionId,
            connection_id: validConnectionId,
            source: "claim-lead",
          },
        });
      } catch (err) {
        console.error("[claim-lead] lead_opened tracking failed:", err);
      }
    })();
  }

  console.log("[claim-lead] success, redirecting to:", redirectTarget.toString());

  return response;
}
