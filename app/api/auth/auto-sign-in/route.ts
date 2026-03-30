import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/auto-sign-in
 *
 * Creates or resolves an auth user for an already-verified email and returns
 * a magic-link token hash for client-side session establishment.
 *
 * Used by the provider onboarding flow after OTP verification so the provider
 * doesn't have to sign in a second time through the auth modal.
 *
 * Request body: { email: string, claimSession: string }
 * Returns: { tokenHash: string } or error
 */
export async function POST(request: Request) {
  try {
    const { email, claimSession } = await request.json();

    if (!email || !claimSession) {
      return NextResponse.json(
        { error: "Email and claim session are required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const normalizedEmail = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    // Try to create the user first (no-op if already exists)
    let userId: string | undefined;
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

    if (createError) {
      if (
        createError.message?.includes("already been registered") ||
        createError.message?.includes("already exists")
      ) {
        // User exists — resolve via generateLink
        const { data: linkData } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: { redirectTo: `${siteUrl}/provider` },
          });
        userId = linkData?.user?.id;
      } else {
        console.error("Auto-sign-in: createUser failed:", createError.message);
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }
    } else {
      userId = newUser?.user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Could not resolve user" },
        { status: 500 }
      );
    }

    // Generate a magic link token for client-side session establishment
    const { data: signInLink, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/provider` },
      });

    if (linkError || !signInLink?.properties?.hashed_token) {
      console.error("Auto-sign-in: generateLink failed:", linkError?.message);
      return NextResponse.json(
        { error: "Failed to generate sign-in token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tokenHash: signInLink.properties.hashed_token,
      userId,
    });
  } catch (err) {
    console.error("Auto-sign-in error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
