import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

/**
 * GET /api/medjobs/claim-interview-student?otk=<token>&interviewId=<id>
 *
 * STUDENT-side one-click magic link for MedJobs interview notifications. The
 * mirror of /api/medjobs/claim-interview, but oriented at the (already
 * registered) student on the receiving end of a provider's interview request.
 *
 * Unlike the provider claim handler, this does NOT create or link a
 * placeholder profile — a live student always already has an account and a
 * student business_profile. We re-derive the student from the interview,
 * verify the token's email matches, mint a session, and redirect to the
 * portal interviews tab with ?newInterview=<id> so the detail modal auto-opens.
 */
export async function GET(request: NextRequest) {
  console.log("[claim-interview-student] route hit", { url: request.url });
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
    console.error("[claim-interview-student] missing env vars");
    return errorResponse("Server configuration error.");
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Look up the interview → student profile to verify the token's email
  //    actually matches the invited student.
  const { data: interview, error: interviewLookupError } = await admin
    .from("interviews")
    .select("id, student_profile_id")
    .eq("id", interviewId)
    .single();
  if (!interview) {
    console.error("[claim-interview-student] interview lookup failed:", interviewLookupError?.message);
    return errorResponse("Interview not found.");
  }

  const { data: studentProfile, error: profileLookupError } = await admin
    .from("business_profiles")
    .select("id, email, account_id")
    .eq("id", interview.student_profile_id)
    .single();
  if (!studentProfile) {
    console.error("[claim-interview-student] student profile lookup failed:", profileLookupError?.message);
    return errorResponse("Candidate profile not found.");
  }
  if (studentProfile.email?.toLowerCase() !== normalizedEmail) {
    console.error("[claim-interview-student] email mismatch");
    return errorResponse("This link does not match the invited email.");
  }

  // 3. Create or resolve the auth user (idempotent — a live student should
  //    already exist, but handle the cold case gracefully).
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
      console.error("[claim-interview-student] createUser failed:", createError.message);
      return errorResponse("Could not sign you in. Please try again.");
    }
  } else {
    userId = createdUser?.user?.id;
  }

  // 4. Generate a magic-link token hash we can verify to mint a session.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[claim-interview-student] generateLink failed:", linkError?.message);
    return errorResponse("Could not establish session. Please try again.");
  }
  if (!userId) userId = linkData.user?.id;
  const tokenHash = linkData.properties.hashed_token;

  // 5. Verify the OTP on a plain client with implicit flow (createServerClient
  //    may force PKCE, which rejects token_hash verification).
  const otpClient = createClient(supabaseUrl, anonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: otpData, error: otpError } = await otpClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (otpError || !otpData?.session) {
    console.error("[claim-interview-student] verifyOtp failed:", otpError?.message);
    return errorResponse("Could not sign you in. Please try again.");
  }

  // 6. Build the redirect response and write session cookies onto it.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectTarget = new URL(`${siteUrl}/portal/medjobs/interviews`);
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
    console.error("[claim-interview-student] setSession failed:", setSessionError.message);
    return errorResponse("Could not establish session. Please try again.");
  }

  // 7. Ensure an account row exists for the student. A live student profile is
  //    already linked to its account; this only covers the cold edge case
  //    where the auth user was just created. We never relink the profile to a
  //    different account — if it's already linked, leave it.
  if (!userId) {
    return errorResponse("Could not resolve user.");
  }

  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!account) {
    const { data: newAccount, error: accountError } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        display_name: normalizedEmail.split("@")[0] || "Candidate",
      })
      .select("id")
      .single();
    if (accountError || !newAccount) {
      console.error("[claim-interview-student] account insert failed:", accountError?.message);
      return errorResponse("Could not set up your account.");
    }
    // Link the student profile if it has no account yet (cold edge case only).
    if (!studentProfile.account_id) {
      await admin
        .from("business_profiles")
        .update({ account_id: newAccount.id })
        .eq("id", studentProfile.id);
      await admin
        .from("accounts")
        .update({ active_profile_id: studentProfile.id })
        .eq("id", newAccount.id);
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
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
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
