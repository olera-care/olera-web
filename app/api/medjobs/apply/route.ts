import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { studentWelcomeEmail } from "@/lib/medjobs-email-templates";
import { sendSlackAlert, slackMedJobsNewStudent } from "@/lib/slack";
import { sendLoopsEvent } from "@/lib/loops";
import type { IntendedProfessionalSchool, StudentProgramTrack } from "@/lib/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  acknowledgmentsCompleted?: boolean;
}): number {
  const fields = [
    { filled: !!data.displayName, weight: 15 },
    { filled: !!data.university, weight: 15 },
    { filled: !!data.major, weight: 10 },
    { filled: !!data.intendedSchool, weight: 10 },
    { filled: !!data.city && !!data.state, weight: 10 },
    { filled: (data.availabilityTypes?.length ?? 0) > 0, weight: 10 },
    { filled: (data.certifications?.length ?? 0) > 0, weight: 5 },
    { filled: (data.careExperienceTypes?.length ?? 0) > 0, weight: 5 },
    { filled: !!data.videoIntroUrl, weight: 15 },
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

    // Fire-and-forget: welcome email
    try {
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: "Welcome to Olera MedJobs!",
        html: studentWelcomeEmail({
          studentName: trimmedName,
          university: metadata.university || "",
          profileSlug: slug,
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

    // Fire-and-forget: Loops event (student audience — seeker domain)
    try {
      await sendLoopsEvent({
        email: email.trim().toLowerCase(),
        eventName: "medjobs_student_signup",
        audience: "seeker",
        eventProperties: {
          university: metadata.university || "",
          intended_school: metadata.intended_professional_school || "",
          program_track: metadata.program_track || "",
          city: city || "",
          state: state || "",
        },
        contactProperties: {
          firstName: trimmedName.split(" ")[0],
          lastName: trimmedName.split(" ").slice(1).join(" "),
          source: "medjobs",
        },
      });
    } catch (err) {
      console.error("[medjobs/apply] loops error:", err);
    }

    return NextResponse.json({ profileId: profile.id, slug });
  } catch (err) {
    console.error("[medjobs/apply] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
