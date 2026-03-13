import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { sendLoopsEvent } from "@/lib/loops";
import { generateUniqueSlugFromName } from "@/lib/slug";
import { sanitizeDisplayName, validateReturnUrl } from "@/lib/validation";

/**
 * GET /auth/callback
 *
 * Handles the OAuth redirect from Google (or other providers).
 * Exchanges the authorization code for a session, ensures an account
 * row exists, then redirects to the `next` query param (or `/`).
 *
 * Uses the middleware-style cookie pattern so session cookies are
 * explicitly set on the redirect response (not lost in transit).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate next parameter to prevent open redirect attacks
  const next = validateReturnUrl(searchParams.get("next"), "/");

  if (!code) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Build redirect response first — cookies will be set directly on it
  const response = NextResponse.redirect(`${origin}${next}`);

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("OAuth callback error:", error?.message);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Ensure account row exists (same pattern as /api/auth/ensure-account)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && serviceKey) {
      const admin = createClient(url, serviceKey);
      const { data: existing } = await admin
        .from("accounts")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existing) {
        // Create account
        const rawName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "";
        const displayName = sanitizeDisplayName(rawName, "User");

        const { data: newAccount } = await admin.from("accounts").insert({
          user_id: data.user.id,
          display_name: displayName,
          onboarding_completed: false,
        }).select("id").single();

        // Create family profile (every user gets one)
        if (newAccount) {
          const familySlug = await generateUniqueSlugFromName(admin, displayName);
          await admin.from("business_profiles").insert({
            account_id: newAccount.id,
            slug: familySlug,
            type: "family",
            display_name: displayName,
            claim_state: "claimed",
            verification_state: "unverified",
            source: "user_created",
            metadata: {},
          });
        }

        // Loops: new account created
        try {
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || "";
          const nameParts = fullName.trim().split(/\s+/);
          await sendLoopsEvent({
            email: data.user.email || "",
            eventName: "user_signup",
            audience: "seeker",
            eventProperties: { source: "web_v2" },
            contactProperties: {
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
            },
          });
        } catch {
          // Non-blocking
        }
      } else {
        // Account exists — ensure family profile exists (handles edge cases)
        const { data: existingFamily } = await admin
          .from("business_profiles")
          .select("id")
          .eq("account_id", existing.id)
          .eq("type", "family")
          .limit(1)
          .maybeSingle();

        if (!existingFamily) {
          const rawName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0] ||
            "";
          const familyDisplayName = sanitizeDisplayName(rawName, "My Family");

          const familySlug = await generateUniqueSlugFromName(admin, familyDisplayName);
          await admin.from("business_profiles").insert({
            account_id: existing.id,
            slug: familySlug,
            type: "family",
            display_name: familyDisplayName,
            claim_state: "claimed",
            verification_state: "unverified",
            source: "user_created",
            metadata: {},
          });
        }
      }
    }

    return response;
  } catch (err) {
    console.error("OAuth callback unexpected error:", err);
    return NextResponse.redirect(`${origin}${next}`);
  }
}
