import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateClaimToken } from "@/lib/claim-tokens";
import { sendEmail } from "@/lib/email";
import {
  claimVerificationEmail,
  signupVerificationEmail,
} from "@/lib/email-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

/**
 * POST /api/provider/send-claim-email
 *
 * Sends a magic-link verification email for either:
 * 1. Claiming an existing listing (slug provided)
 * 2. Creating a new organization (slug === "new")
 *
 * Public endpoint — no auth required.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      email,
      orgName,
      city,
      state,
      phone,
      careTypes,
      pendingClaim,
    } = body as {
      slug: string;
      email: string;
      orgName?: string;
      city?: string;
      state?: string;
      phone?: string;
      careTypes?: string[];
      pendingClaim?: boolean; // If true, claim will be marked as "pending" for manual review
    };

    if (!slug || !email) {
      return NextResponse.json(
        { error: "slug and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getAdmin();

    // ── Rate limiting: max 3 emails per address per hour ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await db
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", normalizedEmail)
      .in("email_type", ["claim_verification", "signup_verification"])
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Too many verification emails sent. Please try again later." },
        { status: 429 }
      );
    }

    // ── Mode 1: Claim existing listing ──
    if (slug !== "new") {
      // Look up provider by slug in olera-providers first
      let providerName = orgName || "your organization";
      let providerSlug = slug;

      const { data: oleraProvider } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, slug")
        .eq("slug", slug)
        .not("deleted", "is", true)
        .maybeSingle();

      if (oleraProvider) {
        providerName = oleraProvider.provider_name;
        providerSlug = oleraProvider.slug || slug;
      } else {
        // Fallback: check business_profiles
        const { data: bp } = await db
          .from("business_profiles")
          .select("id, display_name, slug, claim_state")
          .eq("slug", slug)
          .maybeSingle();

        if (bp) {
          providerName = bp.display_name;
          providerSlug = bp.slug;

          // Don't allow claiming already-claimed profiles
          if (bp.claim_state === "claimed") {
            return NextResponse.json(
              { error: "This listing has already been claimed. Please sign in instead." },
              { status: 409 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Provider not found" },
            { status: 404 }
          );
        }
      }

      const token = generateClaimToken(providerSlug, normalizedEmail);
      const pendingParam = pendingClaim ? "&pending=true" : "";
      const verifyUrl = `${BASE_URL}/provider/${providerSlug}/onboard?action=claim&otk=${token}${pendingParam}`;

      await sendEmail({
        to: normalizedEmail,
        subject: `Verify your email to manage ${providerName}`,
        html: claimVerificationEmail({
          providerName,
          verifyUrl,
          providerSlug,
        }),
        emailType: "claim_verification",
        recipientType: "provider",
        metadata: { slug: providerSlug, pendingClaim: pendingClaim || false },
      });

      return NextResponse.json({
        success: true,
        emailHint: maskEmail(normalizedEmail),
      });
    }

    // ── Mode 2: Create new organization ──
    if (!orgName || !city || !state) {
      return NextResponse.json(
        { error: "orgName, city, and state are required for new organizations" },
        { status: 400 }
      );
    }

    // Check for existing profile with same email to prevent duplicates
    const { data: existingByEmail } = await db
      .from("business_profiles")
      .select("id, slug, display_name, claim_state")
      .ilike("email", normalizedEmail)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (existingByEmail) {
      // Profile exists with this email — send claim email for it instead of creating a new one
      const token = generateClaimToken(existingByEmail.slug, normalizedEmail);
      const verifyUrl = `${BASE_URL}/provider/${existingByEmail.slug}/onboard?action=claim&otk=${token}`;

      await sendEmail({
        to: normalizedEmail,
        subject: `Verify your email to manage ${existingByEmail.display_name}`,
        html: claimVerificationEmail({
          providerName: existingByEmail.display_name,
          verifyUrl,
          providerSlug: existingByEmail.slug,
        }),
        emailType: "claim_verification",
        recipientType: "provider",
        metadata: { slug: existingByEmail.slug, deduped: true },
      });

      return NextResponse.json({
        success: true,
        emailHint: maskEmail(normalizedEmail),
      });
    }

    // Generate slug for new profile
    const baseSlug = `${orgName}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    // Add random suffix to avoid collisions
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

    // Create ghost business_profile
    const { data: newProfile, error: createError } = await db
      .from("business_profiles")
      .insert({
        display_name: orgName.trim(),
        email: normalizedEmail,
        city: city.trim(),
        state: state.trim(),
        phone: phone?.trim() || null,
        care_types: careTypes || [],
        slug: uniqueSlug,
        type: "organization",
        claim_state: "unclaimed",
        source: "self_service",
        is_active: true,
      })
      .select("id, slug")
      .single();

    if (createError || !newProfile) {
      console.error("[send-claim-email] Failed to create ghost profile:", createError);
      return NextResponse.json(
        { error: "Failed to create organization profile" },
        { status: 500 }
      );
    }

    const token = generateClaimToken(newProfile.slug, normalizedEmail);
    const verifyUrl = `${BASE_URL}/provider/${newProfile.slug}/onboard?action=signup&otk=${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Verify your email to set up ${orgName.trim()}`,
      html: signupVerificationEmail({
        orgName: orgName.trim(),
        verifyUrl,
      }),
      emailType: "signup_verification",
      recipientType: "provider",
      metadata: { slug: newProfile.slug, profileId: newProfile.id },
    });

    return NextResponse.json({
      success: true,
      emailHint: maskEmail(normalizedEmail),
      slug: newProfile.slug,
    });
  } catch (err) {
    console.error("[send-claim-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
