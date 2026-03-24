import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { studentWelcomeEmail } from "@/lib/medjobs-email-templates";
import { sendSlackAlert, slackMedJobsNewStudent } from "@/lib/slack";
import type { IntendedProfessionalSchool, StudentProgramTrack } from "@/lib/types";

// Lazy initialization to avoid build-time errors when env vars are not available
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateSlug(name: string, university: string): string {
  const base = `${name}-${university}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Map intended_professional_school → program_track for backward compat */
function mapToProgramTrack(school?: IntendedProfessionalSchool): StudentProgramTrack | undefined {
  if (!school) return undefined;
  const map: Record<IntendedProfessionalSchool, StudentProgramTrack> = {
    medicine: "pre_med",
    nursing: "nursing",
    pa: "pre_pa",
    pt: "pre_health",
    public_health: "pre_health",
    undecided: "other",
  };
  return map[school];
}

function computeCompleteness(data: {
  displayName?: string;
  university?: string;
  major?: string;
  intendedSchool?: string;
  city?: string;
  state?: string;
  availabilityTypes?: string[];
  certifications?: string[];
  careExperienceTypes?: string[];
  videoIntroUrl?: string;
  driversLicenseUrl?: string;
  carInsuranceUrl?: string;
  acknowledgmentsCompleted?: boolean;
}): number {
  const fields = [
    { filled: !!data.displayName, weight: 10 },
    { filled: !!data.university, weight: 10 },
    { filled: !!data.major, weight: 5 },
    { filled: !!data.intendedSchool, weight: 5 },
    { filled: !!data.city && !!data.state, weight: 10 },
    { filled: (data.availabilityTypes?.length ?? 0) > 0, weight: 10 },
    { filled: (data.certifications?.length ?? 0) > 0, weight: 5 },
    { filled: (data.careExperienceTypes?.length ?? 0) > 0, weight: 5 },
    { filled: !!data.videoIntroUrl, weight: 15 },
    { filled: !!data.driversLicenseUrl, weight: 10 },
    { filled: !!data.carInsuranceUrl, weight: 10 },
    { filled: !!data.acknowledgmentsCompleted, weight: 5 },
  ];
  return fields.reduce((sum, f) => sum + (f.filled ? f.weight : 0), 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      // Personal
      displayName,
      email,
      phone,
      // Education
      university,
      universityId,
      major,
      intendedSchool,
      // Location
      city,
      state,
      zip,
      // Experience
      certifications,
      yearsCaregiving,
      careExperienceTypes,
      languages,
      // Availability (new structured fields)
      availabilityTypes,
      seasonalAvailability,
      durationCommitment,
      hoursPerWeekRange,
      // Acknowledgments
      acknowledgmentsCompleted,
      // Honeypot
      website: honeypot,
    } = body;

    // Honeypot check
    if (honeypot) {
      return NextResponse.json({ profileId: "ok" }, { status: 200 });
    }

    // Validation
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedName = displayName.trim().slice(0, 100);
    const normalizedEmailEarly = email.trim().toLowerCase();

    // Check for existing student profile with this email
    const supabaseCheck = getSupabaseAdmin();
    const { data: existingProfile } = await supabaseCheck
      .from("business_profiles")
      .select("id, slug")
      .eq("email", normalizedEmailEarly)
      .eq("type", "student")
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        profileId: existingProfile.id,
        slug: existingProfile.slug,
        existing: true,
      });
    }

    const slug = generateSlug(trimmedName, university || "student");

    const metadata = {
      university: university?.trim() || undefined,
      university_id: universityId || undefined,
      major: major?.trim() || undefined,
      intended_professional_school: intendedSchool || undefined,
      program_track: mapToProgramTrack(intendedSchool as IntendedProfessionalSchool),
      certifications: certifications?.filter(Boolean) || [],
      years_caregiving: yearsCaregiving ? (yearsCaregiving === "family" ? 0 : Number(yearsCaregiving)) : undefined,
      care_experience_types: careExperienceTypes?.filter(Boolean) || [],
      languages: languages?.filter(Boolean) || [],
      // New structured availability
      availability_types: availabilityTypes?.filter(Boolean) || [],
      seasonal_availability: seasonalAvailability?.filter(Boolean) || [],
      duration_commitment: durationCommitment || undefined,
      hours_per_week_range: hoursPerWeekRange || undefined,
      // Acknowledgments
      acknowledgments_completed: !!acknowledgmentsCompleted,
      acknowledgment_date: acknowledgmentsCompleted ? new Date().toISOString() : undefined,
      // Status
      profile_completeness: 0,
      seeking_status: "actively_looking" as const,
    };

    // Compute completeness
    metadata.profile_completeness = computeCompleteness({
      displayName: trimmedName,
      university: metadata.university,
      major: metadata.major,
      intendedSchool: metadata.intended_professional_school,
      city,
      state,
      availabilityTypes: metadata.availability_types,
      certifications: metadata.certifications,
      careExperienceTypes: metadata.care_experience_types,
      videoIntroUrl: undefined, // Not submitted yet
      acknowledgmentsCompleted: metadata.acknowledgments_completed,
    });

    const supabaseAdmin = getSupabaseAdmin();

    // Create profile — is_active: false until video submitted
    const { data: profile, error } = await supabaseAdmin
      .from("business_profiles")
      .insert({
        slug,
        type: "student",
        display_name: trimmedName,
        description: null,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zip: zip?.trim() || null,
        care_types: careExperienceTypes?.filter(Boolean) || [],
        metadata,
        claim_state: "unclaimed",
        verification_state: "unverified",
        source: "user_created",
        is_active: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[medjobs/apply] insert error:", error);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    // ── Create Supabase Auth user + accounts row + link to profile ──
    const normalizedEmail = email.trim().toLowerCase();
    let magicLink: string | undefined;

    try {
      // Try to create auth user — if email already exists, look up the existing one
      let authUserId: string;

      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          display_name: trimmedName,
          source: "medjobs",
        },
      });

      if (createUserError) {
        // Email already registered — use generateLink to get existing user info
        if (
          createUserError.message?.includes("already been registered") ||
          createUserError.message?.includes("already exists")
        ) {
          const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
          });
          if (!linkData?.user?.id) {
            throw new Error("User exists but could not be resolved");
          }
          authUserId = linkData.user.id;
          console.log("[medjobs/apply] existing auth user found:", authUserId);
        } else {
          throw createUserError;
        }
      } else {
        authUserId = newUser.user.id;
      }

      // Check if accounts row exists (existing care seeker may already have one)
      const { data: existingAccount } = await supabaseAdmin
        .from("accounts")
        .select("id")
        .eq("user_id", authUserId)
        .maybeSingle();

      let accountId: string;

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const { data: newAccount, error: accountError } = await supabaseAdmin
          .from("accounts")
          .insert({
            user_id: authUserId,
            display_name: trimmedName,
            onboarding_completed: true,
          })
          .select("id")
          .single();
        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Link student profile to account
      await supabaseAdmin
        .from("business_profiles")
        .update({ account_id: accountId, claim_state: "claimed" })
        .eq("id", profile.id);

      // Generate magic link for welcome email
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/medjobs/submit-video?slug=${slug}` },
      });
      if (!linkError && linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;
      }
    } catch (err) {
      // Non-blocking: profile was created, account linking failed
      // Student can still sign in later via ensure-account flow
      console.error("[medjobs/apply] account creation error:", err);
    }

    // Fire-and-forget: welcome email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Welcome to Olera MedJobs!",
        html: studentWelcomeEmail({
          studentName: trimmedName,
          university: metadata.university || "",
          profileSlug: slug,
          magicLink,
        }),
      });
    } catch (err) {
      console.error("[medjobs/apply] welcome email error:", err);
    }

    // Fire-and-forget: Slack alert (structured)
    try {
      const alert = slackMedJobsNewStudent({
        studentName: trimmedName,
        university: metadata.university || "Not specified",
        programTrack: metadata.intended_professional_school || metadata.program_track || "Not specified",
        location: [city, state].filter(Boolean).join(", ") || "Not specified",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (err) {
      console.error("[medjobs/apply] slack error:", err);
    }

    // NOTE: Do NOT send Loops event here — adding students to the seeker audience
    // enrolls them in the care-seeker onboarding drip (Logan's intro email).
    // MedJobs students get their own email flow via Resend (welcome + nudge).

    return NextResponse.json({ profileId: profile.id, slug });
  } catch (err) {
    console.error("[medjobs/apply] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
