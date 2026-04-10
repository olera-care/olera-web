import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { generateMedJobsNotificationUrl } from "@/lib/claim-tokens";
import { interviewRequestEmail } from "@/lib/email-templates";
import { getAccessTier, canScheduleInterview } from "@/lib/medjobs-access";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate a URL-safe slug from organization name
 */
function generateSlug(orgName: string, city: string): string {
  const base = `${orgName}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * POST /api/medjobs/interviews/quick
 *
 * Create an interview request from an unauthenticated provider.
 * Creates a "pending" business_profile (no account_id) and the interview,
 * then sends a confirmation email with a magic link.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentProfileId,
      type = "video",
      proposedTime,
      notes,
      provider,
    } = body;

    // Validate required fields
    if (!studentProfileId || !proposedTime) {
      return NextResponse.json(
        { error: "studentProfileId and proposedTime are required" },
        { status: 400 }
      );
    }

    if (!provider?.email || !provider?.organization || !provider?.city) {
      return NextResponse.json(
        { error: "Provider email, organization, and city are required" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Validate the student profile exists and is a student
    const { data: student, error: studentError } = await admin
      .from("business_profiles")
      .select("id, display_name, email, slug")
      .eq("id", studentProfileId)
      .eq("type", "student")
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const normalizedEmail = provider.email.trim().toLowerCase();

    let providerProfileId: string;
    let providerDisplayName: string;
    let providerSlug: string;
    let isNewProfile = false;

    // If an existing org was selected from autocomplete, try to find/link it
    if (provider.selectedOrgSlug) {
      // First try to find a business_profile by slug
      let existingProfile = await admin
        .from("business_profiles")
        .select("id, account_id, display_name, slug")
        .eq("slug", provider.selectedOrgSlug)
        .in("type", ["organization", "caregiver"])
        .maybeSingle()
        .then(r => r.data);

      // If not found and we have providerId, try by source_provider_id
      if (!existingProfile && provider.selectedOrgProviderId) {
        existingProfile = await admin
          .from("business_profiles")
          .select("id, account_id, display_name, slug")
          .eq("source_provider_id", provider.selectedOrgProviderId)
          .in("type", ["organization", "caregiver"])
          .limit(1)
          .maybeSingle()
          .then(r => r.data);
      }

      if (existingProfile) {
        // Use the existing profile (already linked to an org)
        providerProfileId = existingProfile.id;
        providerDisplayName = existingProfile.display_name;
        providerSlug = existingProfile.slug;
      } else {
        // Selected org from olera-providers - create a business_profile linked to it
        const { data: newProfile, error: profileError } = await admin
          .from("business_profiles")
          .insert({
            slug: provider.selectedOrgSlug,
            type: "organization",
            display_name: provider.organization,
            email: normalizedEmail,
            city: provider.city,
            state: provider.state || null,
            source_provider_id: provider.selectedOrgProviderId || null,
            care_types: [],
            source: "medjobs_quick_schedule",
          })
          .select("id")
          .single();

        if (profileError) {
          // Handle race condition: unique constraint violation means another request just created it
          if (profileError.code === "23505") {
            // Re-fetch the profile that was just created
            const { data: raceProfile } = await admin
              .from("business_profiles")
              .select("id, display_name, slug")
              .eq("slug", provider.selectedOrgSlug)
              .single();

            if (raceProfile) {
              providerProfileId = raceProfile.id;
              providerDisplayName = raceProfile.display_name;
              providerSlug = raceProfile.slug;
            } else {
              console.error("[medjobs/interviews/quick] race condition but no profile found:", profileError);
              return NextResponse.json({ error: "Failed to create provider profile" }, { status: 500 });
            }
          } else {
            console.error("[medjobs/interviews/quick] profile creation error:", profileError);
            return NextResponse.json({ error: "Failed to create provider profile" }, { status: 500 });
          }
        } else if (newProfile) {
          providerProfileId = newProfile.id;
          providerDisplayName = provider.organization;
          providerSlug = provider.selectedOrgSlug;
          isNewProfile = true;
        } else {
          return NextResponse.json({ error: "Failed to create provider profile" }, { status: 500 });
        }
      }
    } else {
      // No org selected from autocomplete - check by email or create new
      const { data: existingProfile } = await admin
        .from("business_profiles")
        .select("id, account_id, display_name, slug")
        .eq("email", normalizedEmail)
        .in("type", ["organization", "caregiver"])
        .maybeSingle();

      if (existingProfile) {
        // Use existing profile
        providerProfileId = existingProfile.id;
        providerDisplayName = existingProfile.display_name;
        providerSlug = existingProfile.slug;
      } else {
        // Create a new business_profile without account_id
        const slug = generateSlug(provider.organization, provider.city);
        const displayName = provider.organization;

        const { data: newProfile, error: profileError } = await admin
          .from("business_profiles")
          .insert({
            slug,
            type: "organization",
            display_name: displayName,
            email: normalizedEmail,
            city: provider.city,
            state: provider.state || null,
            care_types: [],
            source: "medjobs_quick_schedule",
          })
          .select("id")
          .single();

        if (profileError || !newProfile) {
          console.error("[medjobs/interviews/quick] profile creation error:", profileError);
          return NextResponse.json({ error: "Failed to create provider profile" }, { status: 500 });
        }

        providerProfileId = newProfile.id;
        providerDisplayName = displayName;
        providerSlug = slug;
        isNewProfile = true;
      }
    }

    // Paywall check: if the provider profile already exists and is exhausted, block
    if (!isNewProfile) {
      const { data: existingMeta } = await admin
        .from("business_profiles")
        .select("metadata")
        .eq("id", providerProfileId)
        .single();
      const meta = ((existingMeta?.metadata as Record<string, unknown>) ?? {});
      const access = getAccessTier(true, meta);
      if (!canScheduleInterview(access)) {
        return NextResponse.json({ error: "upgrade_required", tier: access.tier }, { status: 402 });
      }
    }

    // Create the interview
    const { data: interview, error: interviewError } = await admin
      .from("interviews")
      .insert({
        provider_profile_id: providerProfileId,
        student_profile_id: studentProfileId,
        status: "proposed",
        type,
        proposed_time: proposedTime,
        notes: notes || null,
        proposed_by: providerProfileId,
      })
      .select("id")
      .single();

    if (interviewError || !interview) {
      console.error("[medjobs/interviews/quick] interview creation error:", interviewError);
      // Clean up the profile if we just created it
      if (isNewProfile) {
        await admin.from("business_profiles").delete().eq("id", providerProfileId);
      }
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    // Increment credits used for outbound request
    try {
      await admin.rpc("increment_profile_metadata_counter", {
        p_profile_id: providerProfileId,
        p_key: "medjobs_credits_used",
      });
    } catch (err) {
      console.error("[medjobs/interviews/quick] credit increment error:", err);
    }

    // Generate magic link URL for the confirmation email
    const magicLinkUrl = generateMedJobsNotificationUrl(
      providerSlug,
      normalizedEmail,
      "interview",
      interview.id
    );

    // Format date/time for email
    const proposedDate = new Date(proposedTime);
    const formattedDateTime = proposedDate.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const typeLabel = type === "video" ? "Video" : type === "in_person" ? "In-Person" : "Phone";

    // Send confirmation email to the provider
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `Interview request sent to ${student.display_name}`,
        html: interviewRequestEmail({
          providerName: providerDisplayName,
          studentName: student.display_name,
          interviewType: typeLabel,
          dateTime: formattedDateTime,
          notes: notes || null,
          magicLinkUrl,
        }),
        emailType: "interview_request_sent",
      });
    } catch (emailError) {
      console.error("[medjobs/interviews/quick] email error:", emailError);
      // Don't fail the request if email fails — the interview is created
    }

    // Also notify the student that they have an interview request
    if (student.email) {
      try {
        await sendEmail({
          to: student.email,
          subject: `Interview request from ${providerDisplayName}`,
          html: `
            <h2>You have an interview request!</h2>
            <p><strong>${providerDisplayName}</strong> would like to schedule a ${typeLabel.toLowerCase()} interview.</p>
            <p><strong>Proposed time:</strong> ${formattedDateTime}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/medjobs/interviews">View & respond on Olera</a></p>
          `,
          emailType: "interview_proposed",
        });
      } catch (emailError) {
        console.error("[medjobs/interviews/quick] student email error:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      providerProfileId,
    });
  } catch (err) {
    console.error("[medjobs/interviews/quick] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
