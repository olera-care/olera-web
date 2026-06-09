import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

/**
 * Editable profile sections the completion CTA may deep-link to. Mirrors the
 * dashboard's SectionId union (components/provider-dashboard/edit-modals/types).
 */
const EDITABLE_SECTIONS = new Set([
  "overview",
  "gallery",
  "services",
  "screening",
  "about",
  "pricing",
  "payment",
  "owner",
]);

/**
 * GET /api/claim-complete?otk=<token>&section=<section>
 *
 * One-click landing for the profile-completion ("sell the output") email CTA.
 * Mirrors /api/claim-lead: authenticates the provider server-side in a single
 * response, then redirects to the dashboard with the relevant editor open
 * (`/provider?edit=<section>`). Falls back to the onboard page on any failure —
 * never a dead end.
 *
 * Targets are CLAIMED providers (digest completion variant), so the profile is
 * already linked; this route mostly mints the session and redirects. The
 * profile-link step is kept idempotent so it's also safe for the rare unclaimed
 * case (e.g. a stale account row).
 *
 * Query params:
 *   - otk: Required. The signed claim token (HMAC-SHA256, 72h expiry).
 *   - section: Optional. One of EDITABLE_SECTIONS; opens that editor on arrival.
 *   - eid: Optional. Email tracking id for click attribution.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("otk");
  const sectionRaw = url.searchParams.get("section");
  const section = sectionRaw && EDITABLE_SECTIONS.has(sectionRaw) ? sectionRaw : null;
  const emailTrackingId = url.searchParams.get("eid");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Fall back to the onboard page (manual sign-in) when auth fails — never a
  // dead end. Mirrors claim-lead's fallback behaviour.
  const fallbackToOnboard = (reason: string, slug?: string | null) => {
    console.log("[claim-complete] falling back to onboard:", { reason, slug, section });
    if (!slug) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
    }
    const fallbackUrl = new URL(`${siteUrl}/provider/${slug}/onboard`);
    fallbackUrl.searchParams.set("action", "manage");
    return NextResponse.redirect(fallbackUrl.toString(), { status: 303 });
  };

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
  }

  // 1. Validate token (HMAC + expiry)
  const validation = validateClaimToken(token);
  if (!validation.valid) {
    console.error("[claim-complete] token validation failed:", validation.error);
    return fallbackToOnboard(validation.error, validation.providerId || null);
  }

  const { providerId: providerSlug, email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[claim-complete] missing env vars");
    return fallbackToOnboard("missing env vars", providerSlug);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Resolve the provider's business_profile (token's providerId is the slug)
  const { data: providerProfile, error: profileError } = await admin
    .from("business_profiles")
    .select("id, slug, email, account_id, source_provider_id, display_name")
    .or(`slug.eq.${providerSlug},source_provider_id.eq.${providerSlug},id.eq.${providerSlug}`)
    .in("type", ["organization", "caregiver"])
    .maybeSingle();

  if (!providerProfile) {
    console.error("[claim-complete] provider lookup failed:", profileError?.message || "not found");
    return fallbackToOnboard("provider not found", providerSlug);
  }

  const actualSlug = providerProfile.slug || providerProfile.source_provider_id || providerSlug;

  // Security boundary: the token email must match the provider's profile email.
  if (providerProfile.email?.toLowerCase() !== normalizedEmail) {
    console.error("[claim-complete] email mismatch");
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
      console.error("[claim-complete] createUser failed:", createError.message);
      return fallbackToOnboard("createUser failed", actualSlug);
    }
  } else {
    userId = createdUser?.user?.id;
  }

  // 4. Mint a session: generate a magic-link hash, verify it server-side
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[claim-complete] generateLink failed:", linkError?.message);
    return fallbackToOnboard("generateLink failed", actualSlug);
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // Verify on a plain implicit-flow client (createServerClient may force PKCE,
  // which rejects token_hash verification) — same as claim-lead.
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
    console.error("[claim-complete] verifyOtp failed:", otpError?.message);
    return fallbackToOnboard("verifyOtp failed", actualSlug);
  }

  // 5. Build the redirect (dashboard with the editor open) and write session
  //    cookies onto it.
  const redirectTarget = new URL(`${siteUrl}/provider`);
  if (section) redirectTarget.searchParams.set("edit", section);
  if (emailTrackingId) redirectTarget.searchParams.set("eid", emailTrackingId);

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
    console.error("[claim-complete] setSession failed:", setSessionError.message);
    return fallbackToOnboard("setSession failed", actualSlug);
  }

  // 6. Ensure an account exists and the profile is linked (idempotent)
  if (userId) {
    let { data: account } = await admin
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", userId)
      .single();

    if (!account) {
      const displayName =
        providerProfile.display_name || normalizedEmail.split("@")[0] || "Provider";
      const { data: newAccount, error: accountError } = await admin
        .from("accounts")
        .insert({ user_id: userId, display_name: displayName, onboarding_completed: true })
        .select("id, active_profile_id")
        .single();
      if (accountError) {
        console.error("[claim-complete] account insert failed:", accountError.message);
      } else {
        account = newAccount;
      }
    }

    if (account) {
      if (!providerProfile.account_id) {
        await admin
          .from("business_profiles")
          .update({ account_id: account.id, claim_state: "claimed" })
          .eq("id", providerProfile.id);
      }
      if (!account.active_profile_id) {
        await admin
          .from("accounts")
          .update({ active_profile_id: providerProfile.id })
          .eq("id", account.id);
      }
    }
  }

  // 7. Track one_click_access BEFORE returning (must complete before the
  //    serverless function terminates). one_click_access is already in the
  //    provider_activity event allowlist — no migration needed.
  const providerKey =
    providerProfile.slug || providerProfile.source_provider_id || providerProfile.id;
  const { error: accessError } = await admin.from("provider_activity").insert({
    provider_id: providerKey,
    event_type: "one_click_access",
    metadata: {
      source: "claim-complete",
      section: section || null,
      email: normalizedEmail,
      email_log_id: emailTrackingId || null,
    },
  });
  if (accessError) {
    console.error("[claim-complete] one_click_access tracking failed:", accessError.message);
  }

  console.log("[claim-complete] success, redirecting to:", redirectTarget.toString());
  return response;
}
