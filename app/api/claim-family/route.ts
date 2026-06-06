import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

/**
 * GET /api/claim-family?otk=<token>&next=<destination>
 *
 * One-click magic link landing for family emails. Handles authentication
 * flow server-side in a single response:
 *
 *  1. Validates the HMAC-signed token (family email + 72h expiry)
 *  2. Creates or resolves a Supabase auth user for the email
 *  3. Establishes a session by verifying a fresh magic-link OTP server-side,
 *     writing auth cookies onto the redirect response
 *  4. Redirects to the destination URL (e.g., /portal/inbox?id=123)
 *
 * This gives families the same 72-hour link expiry as providers, vs the
 * 1-hour Supabase magic link default.
 *
 * Query params:
 *   - otk: Required. The signed claim token (HMAC-SHA256, 72h expiry)
 *   - next: Required. Destination path to redirect to after auth
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("otk");
  const nextPath = url.searchParams.get("next");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  console.log("[claim-family] route hit", {
    hasToken: !!token,
    nextPath: nextPath || "(none)",
  });

  // Validate required params
  if (!token) {
    console.error("[claim-family] missing token");
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  if (!nextPath) {
    console.error("[claim-family] missing next param");
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  // Validate token (HMAC + expiry)
  const validation = validateClaimToken(token);
  if (!validation.valid) {
    console.error("[claim-family] token validation failed:", validation.error);
    // Token invalid/expired - redirect to inbox (they can sign in manually)
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  const { email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[claim-family] missing env vars");
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Create or resolve the auth user
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
      console.error("[claim-family] createUser failed:", createError.message);
      return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
    }
  } else {
    userId = createdUser?.user?.id;
  }

  // Generate a magic-link token hash we can verify to mint a session
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[claim-family] generateLink failed:", linkError?.message);
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // Verify the OTP on a plain @supabase/supabase-js client with implicit flow
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
    console.error("[claim-family] verifyOtp failed:", otpError?.message);
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  // Build the redirect response and write session cookies onto it
  const redirectTarget = new URL(`${siteUrl}${nextPath}`);
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
    console.error("[claim-family] setSession failed:", setSessionError.message);
    return NextResponse.redirect(`${siteUrl}/portal/inbox`, { status: 303 });
  }

  // Ensure an account row exists (families don't need profile linking)
  if (!userId) {
    console.error("[claim-family] could not resolve userId");
    return NextResponse.redirect(redirectTarget, { status: 303 });
  }

  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!account) {
    const displayName = normalizedEmail.split("@")[0] || "Family";

    const { error: accountError } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        display_name: displayName,
        onboarding_completed: true, // Family onboarding happens implicitly via email claim
      })
      .select("id")
      .single();

    if (accountError) {
      console.error("[claim-family] account insert failed:", accountError.message);
      // Non-fatal: session is already set, they're signed in
    }
  }

  console.log("[claim-family] success, redirecting to:", redirectTarget.toString());

  return response;
}
