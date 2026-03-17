import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { studentWelcomeEmail } from "@/lib/medjobs-email-templates";
import { sendSlackAlert } from "@/lib/slack";

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

function computeCompleteness(data: {
  displayName?: string;
  university?: string;
  major?: string;
  programTrack?: string;
  city?: string;
  state?: string;
  availabilityType?: string;
  certifications?: string[];
  careExperienceTypes?: string[];
  resumeUrl?: string;
  videoIntroUrl?: string;
}): number {
  const fields = [
    { filled: !!data.displayName, weight: 15 },
    { filled: !!data.university, weight: 15 },
    { filled: !!data.major, weight: 10 },
    { filled: !!data.programTrack, weight: 10 },
    { filled: !!data.city && !!data.state, weight: 10 },
    { filled: !!data.availabilityType, weight: 10 },
    { filled: (data.certifications?.length ?? 0) > 0, weight: 10 },
    { filled: (data.careExperienceTypes?.length ?? 0) > 0, weight: 5 },
    { filled: !!data.resumeUrl, weight: 10 },
    { filled: !!data.videoIntroUrl, weight: 5 },
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
      campus,
      major,
      graduationYear,
      programTrack,
      // Location
      city,
      state,
      zip,
      // Experience
      certifications,
      yearsCaregiving,
      careExperienceTypes,
      languages,
      // Availability
      availabilityType,
      hoursPerWeek,
      availableStart,
      transportation,
      maxCommuteMiles,
      // Media
      resumeUrl,
      videoIntroUrl,
      linkedinUrl,
      // Description
      description,
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
    if (!university?.trim()) {
      return NextResponse.json({ error: "University is required" }, { status: 400 });
    }

    const trimmedName = displayName.trim().slice(0, 100);
    const slug = generateSlug(trimmedName, university);

    const metadata = {
      university: university?.trim(),
      university_id: universityId || undefined,
      campus: campus?.trim() || undefined,
      major: major?.trim() || undefined,
      graduation_year: graduationYear ? Number(graduationYear) : undefined,
      program_track: programTrack || undefined,
      certifications: certifications?.filter(Boolean) || [],
      years_caregiving: yearsCaregiving ? Number(yearsCaregiving) : undefined,
      care_experience_types: careExperienceTypes?.filter(Boolean) || [],
      languages: languages?.filter(Boolean) || [],
      availability_type: availabilityType || undefined,
      hours_per_week: hoursPerWeek ? Number(hoursPerWeek) : undefined,
      available_start: availableStart || undefined,
      transportation: transportation ?? undefined,
      max_commute_miles: maxCommuteMiles ? Number(maxCommuteMiles) : undefined,
      resume_url: resumeUrl || undefined,
      video_intro_url: videoIntroUrl || undefined,
      linkedin_url: linkedinUrl?.trim() || undefined,
      profile_completeness: 0,
      seeking_status: "actively_looking" as const,
    };

    // Compute completeness
    metadata.profile_completeness = computeCompleteness({
      displayName: trimmedName,
      university: metadata.university,
      major: metadata.major,
      programTrack: metadata.program_track,
      city,
      state,
      availabilityType: metadata.availability_type,
      certifications: metadata.certifications,
      careExperienceTypes: metadata.care_experience_types,
      resumeUrl: metadata.resume_url,
      videoIntroUrl: metadata.video_intro_url,
    });

    // Create profile
    const { data: profile, error } = await supabaseAdmin
      .from("business_profiles")
      .insert({
        slug,
        type: "student",
        display_name: trimmedName,
        description: description?.trim() || null,
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
        is_active: true,
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

    // Fire-and-forget: Slack alert
    try {
      await sendSlackAlert(
        `New MedJobs student: ${trimmedName} (${metadata.university || "unknown university"}, ${metadata.program_track || "unknown track"}) — ${city || "?"}, ${state || "?"}`
      );
    } catch (err) {
      console.error("[medjobs/apply] slack error:", err);
    }

    return NextResponse.json({ profileId: profile.id, slug });
  } catch (err) {
    console.error("[medjobs/apply] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
