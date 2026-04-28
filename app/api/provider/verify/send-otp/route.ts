import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { verificationOtpEmail } from "@/lib/email-templates";

// ============================================================
// Types
// ============================================================

interface SendOtpRequest {
  profileId: string;
  email: string;
  fullName: string;
  /** ISO timestamp when T&C was accepted (for compliance audit trail) */
  termsAcceptedAt?: string;
}

// ============================================================
// Supabase Admin Client
// ============================================================

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// ============================================================
// Generate 8-digit OTP
// ============================================================

function generateOtp(): string {
  // Generate cryptographically secure 8-digit code
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 100000000).toString().padStart(8, "0");
  return code;
}

// ============================================================
// Main Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendOtpRequest;
    const { profileId, email, fullName, termsAcceptedAt } = body;

    if (!profileId || !email || !fullName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify user owns this profile
    const { data: profile, error: fetchError } = await admin
      .from("business_profiles")
      .select("id, slug, display_name, account_id, metadata")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account || profile.account_id !== account.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    // Check if verification email is associated with another account type
    // Skip check if the user is verifying with their signup email
    const userEmail = user.email?.toLowerCase();
    if (normalizedEmail !== userEmail) {
      // Check 1: Query business_profiles directly by email
      const { data: profilesByEmail } = await admin
        .from("business_profiles")
        .select("id, type, account_id")
        .ilike("email", normalizedEmail)
        .eq("is_active", true);

      if (profilesByEmail && profilesByEmail.length > 0) {
        // Check for family or caregiver profiles
        const familyProfile = profilesByEmail.find((p) => p.type === "family");
        if (familyProfile) {
          return NextResponse.json(
            { success: false, error: "This email is linked to a family account. Please use a different email." },
            { status: 409 }
          );
        }

        const caregiverProfile = profilesByEmail.find((p) => p.type === "caregiver");
        if (caregiverProfile) {
          return NextResponse.json(
            { success: false, error: "This email is linked to a caregiver account. Please use a different email." },
            { status: 409 }
          );
        }

        // Check if another CLAIMED provider already uses this email (not the current user's account)
        // Skip unclaimed listings (account_id is null) - those are from data imports
        const otherOrgProfile = profilesByEmail.find(
          (p) => p.type === "organization" && p.account_id && p.account_id !== account.id
        );
        if (otherOrgProfile) {
          return NextResponse.json(
            { success: false, error: "This email is already associated with another provider account." },
            { status: 409 }
          );
        }
      }

      // Check 2: Query accounts by email and check their profiles
      const { data: accountByEmail } = await admin
        .from("accounts")
        .select("id")
        .ilike("email", normalizedEmail)
        .neq("id", account.id) // Exclude current user's account
        .maybeSingle();

      if (accountByEmail) {
        // Found another account with this email - check its profiles
        const { data: accountProfiles } = await admin
          .from("business_profiles")
          .select("id, type")
          .eq("account_id", accountByEmail.id)
          .eq("is_active", true);

        if (accountProfiles && accountProfiles.length > 0) {
          const familyProfile = accountProfiles.find((p) => p.type === "family");
          if (familyProfile) {
            return NextResponse.json(
              { success: false, error: "This email is linked to a family account. Please use a different email." },
              { status: 409 }
            );
          }

          const caregiverProfile = accountProfiles.find((p) => p.type === "caregiver");
          if (caregiverProfile) {
            return NextResponse.json(
              { success: false, error: "This email is linked to a caregiver account. Please use a different email." },
              { status: 409 }
            );
          }

          const orgProfile = accountProfiles.find((p) => p.type === "organization");
          if (orgProfile) {
            return NextResponse.json(
              { success: false, error: "This email is already associated with another provider account." },
              { status: 409 }
            );
          }
        }
      }
    }

    // Generate OTP and expiry (10 minutes)
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in profile metadata
    // Also set claimer_email and claimer_name at top level for Slack notifications
    // in subsequent verification attempts via other methods
    const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      claimer_email: normalizedEmail,
      claimer_name: fullName,
      // Store T&C acceptance timestamp for compliance audit trail
      ...(termsAcceptedAt && { terms_accepted_at: termsAcceptedAt }),
      verification_otp: {
        code: otp,
        email: normalizedEmail,
        fullName,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[send-otp] Failed to store OTP:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: `${otp} is your Olera verification code`,
        html: verificationOtpEmail({
          recipientName: fullName,
          code: otp,
          businessName: profile.display_name || "your business",
          expiresInMinutes: 10,
        }),
        emailType: "verification_otp",
        recipientType: "provider",
        providerId: profile.slug,
      });
    } catch (emailErr) {
      console.error("[send-otp] Failed to send email:", emailErr);
      return NextResponse.json(
        { success: false, error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    console.log(`[send-otp] Sent OTP to ${email} for ${profile.display_name}`);

    return NextResponse.json({
      success: true,
      expiresAt,
    });
  } catch (error) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
