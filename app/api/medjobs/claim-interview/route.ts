import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

/**
 * GET /api/medjobs/claim-interview?otk=<token>&interviewId=<id>
 *
 * One-click magic link landing for MedJobs interview scheduling. Handles
 * the entire claim flow server-side in a single response:
 *
 *  1. Validates the HMAC-signed token
 *  2. Creates or resolves a Supabase auth user for the token's email
 *  3. Establishes a session by verifying a fresh magic-link OTP server-side,
 *     writing auth cookies onto the redirect response
 *  4. Links the placeholder business_profile to the user's account
 *  5. Redirects to the calendar with ?newInterview=<id> so the UI can
 *     auto-open the detail modal for the newly scheduled interview
 *
 * All work happens before the redirect — the calendar page's first render
 * is already authenticated with the profile linked, so there's no race
 * with client-side cookie writes or placeholder-profile reads.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("otk");
  const interviewId = url.searchParams.get("interviewId");

  if (!token || !interviewId) {
    return errorResponse("Missing link parameters.");
  }

  // 1. Validate token (HMAC + expiry)
  const validation = validateClaimToken(token);
  if (!validation.valid) {
    return errorResponse(validation.error || "Invalid or expired link.");
  }
  const { email } = validation;
  const normalizedEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return errorResponse("Server configuration error.");
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Look up the interview + placeholder profile to verify the token
  //    actually matches a real scheduling record
  const { data: interview } = await admin
    .from("interviews")
    .select("id, provider_profile_id")
    .eq("id", interviewId)
    .single();
  if (!interview) {
    return errorResponse("Interview not found.");
  }

  const { data: providerProfile } = await admin
    .from("business_profiles")
    .select("id, email, account_id")
    .eq("id", interview.provider_profile_id)
    .single();
  if (!providerProfile) {
    return errorResponse("Provider profile not found.");
  }
  if (providerProfile.email?.toLowerCase() !== normalizedEmail) {
    return errorResponse("This link does not match the invited email.");
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
      console.error("[medjobs/claim/interview] createUser failed:", createError.message);
      return errorResponse("Could not sign you in. Please try again.");
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
    console.error("[medjobs/claim/interview] generateLink failed:", linkError?.message);
    return errorResponse("Could not establish session. Please try again.");
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // 5. Verify the OTP on a plain @supabase/supabase-js client with implicit
  //    flow. @supabase/ssr's createServerClient may force PKCE, which would
  //    reject token_hash verification (see lib/supabase/auth-client.ts for
  //    the matching client-side workaround).
  const otpClient = createClient(supabaseUrl, anonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: otpData, error: otpError } = await otpClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (otpError || !otpData?.session) {
    console.error("[medjobs/claim/interview] verifyOtp failed:", otpError?.message);
    return errorResponse("Could not sign you in. Please try again.");
  }

  // 6. Build the redirect response and write the session cookies onto it
  //    via the SSR cookie adapter. setSession doesn't involve PKCE, so it
  //    works regardless of the forced flow type on createServerClient.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectTarget = new URL(`${siteUrl}/provider/caregivers`);
  redirectTarget.searchParams.set("newInterview", interviewId);
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
    console.error("[medjobs/claim/interview] setSession failed:", setSessionError.message);
    return errorResponse("Could not establish session. Please try again.");
  }

  // 7. Ensure an account row, then link the placeholder profile to it.
  //    Idempotent: no-op if already linked to this account.
  if (!userId) {
    return errorResponse("Could not resolve user.");
  }

  let { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!account) {
    const { data: newAccount, error: accountError } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        display_name: normalizedEmail.split("@")[0] || "Provider",
      })
      .select("id")
      .single();
    if (accountError || !newAccount) {
      console.error("[medjobs/claim/interview] account insert failed:", accountError?.message);
      return errorResponse("Could not set up your account.");
    }
    account = newAccount;
  }

  if (providerProfile.account_id && providerProfile.account_id !== account.id) {
    return errorResponse("This profile is already linked to a different account.");
  }

  if (!providerProfile.account_id) {
    const { error: linkErr } = await admin
      .from("business_profiles")
      .update({ account_id: account.id, claim_state: "claimed" })
      .eq("id", providerProfile.id);
    if (linkErr) {
      console.error("[medjobs/claim/interview] profile link failed:", linkErr.message);
      return errorResponse("Could not link your profile.");
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

  return response;
}

function errorResponse(message: string) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Link error</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 48px 24px; background: #fafaf8; color: #111; }
  .card { max-width: 420px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { color: #6b7280; margin: 0 0 24px; }
  a { display: inline-block; padding: 10px 20px; background: #111; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
</style></head>
<body><div class="card">
  <h1>Link error</h1>
  <p>${escapeHtml(message)}</p>
  <a href="/">Go home</a>
</div></body></html>`;
  return new NextResponse(html, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
