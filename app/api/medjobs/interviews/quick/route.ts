import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { generateMedJobsNotificationUrl } from "@/lib/claim-tokens";
import { interviewRequestEmail, interviewProposedEmail } from "@/lib/email-templates";
import { getAccessTier, canScheduleInterview } from "@/lib/medjobs-access";
import { stopEmailSequence } from "@/lib/staffing-outreach/resend-automation";

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
      alternativeTime,
      notes,
      termsAcceptedAt,
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
      // No org selected from autocomplete - check by email first
      const { data: profileByEmail } = await admin
        .from("business_profiles")
        .select("id, account_id, display_name, slug")
        .eq("email", normalizedEmail)
        .in("type", ["organization", "caregiver"])
        .maybeSingle();

      if (profileByEmail) {
        // Use existing profile found by email
        providerProfileId = profileByEmail.id;
        providerDisplayName = profileByEmail.display_name;
        providerSlug = profileByEmail.slug;
      } else {
        // Email not found - also check by organization name + city to prevent paywall bypass
        // Use case-insensitive match on display_name and city
        const normalizedOrgName = provider.organization.trim().toLowerCase();
        const normalizedCity = provider.city.trim().toLowerCase();

        const { data: profileByOrg } = await admin
          .from("business_profiles")
          .select("id, account_id, display_name, slug")
          .ilike("display_name", normalizedOrgName)
          .ilike("city", normalizedCity)
          .in("type", ["organization", "caregiver"])
          .limit(1)
          .maybeSingle();

        if (profileByOrg) {
          // Found existing org by name + city - use it (paywall check will run)
          providerProfileId = profileByOrg.id;
          providerDisplayName = profileByOrg.display_name;
          providerSlug = profileByOrg.slug;
        } else {
          // No existing profile found - create a new one
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
    }

    // Paywall check and verification state check
    let isPendingVerification = false;

    if (!isNewProfile) {
      const { data: existingProfile } = await admin
        .from("business_profiles")
        .select("metadata, verification_state")
        .eq("id", providerProfileId)
        .single();
      const meta = ((existingProfile?.metadata as Record<string, unknown>) ?? {});
      const access = getAccessTier(true, meta);
      if (!canScheduleInterview(access)) {
        return NextResponse.json({ error: "upgrade_required", tier: access.tier }, { status: 402 });
      }

      // Check verification state - if not verified, hold the interview
      const verificationState = existingProfile?.verification_state as string | null;
      const isVerified = verificationState === "verified" || verificationState === "not_required";
      isPendingVerification = !isVerified;
    } else {
      // New profiles are always pending verification
      isPendingVerification = true;
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
        alternative_time: alternativeTime || null,
        notes: notes || null,
        proposed_by: providerProfileId,
        is_pending_verification: isPendingVerification,
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
    const { error: creditError } = await admin.rpc("increment_profile_metadata_counter", {
      p_profile_id: providerProfileId,
      p_key: "medjobs_credits_used",
    });
    if (creditError) {
      console.error("[medjobs/interviews/quick] credit increment error:", creditError);
    }

    // Store T&C acceptance timestamp in provider metadata (for audit trail)
    if (termsAcceptedAt) {
      const { data: currentProfile } = await admin
        .from("business_profiles")
        .select("metadata")
        .eq("id", providerProfileId)
        .single();

      const currentMeta = (currentProfile?.metadata as Record<string, unknown>) ?? {};
      // Only set if not already set (preserve first acceptance)
      if (!currentMeta.interview_terms_accepted_at) {
        await admin
          .from("business_profiles")
          .update({
            metadata: {
              ...currentMeta,
              interview_terms_accepted_at: termsAcceptedAt,
            },
          })
          .eq("id", providerProfileId);
      }

      // Auto-enrollment: Check if this provider is in staffing_outreach and auto-enroll them
      // Look up by provider_id (the olera-providers table ID) via source_provider_id
      // Note: Provider may be in multiple batches (different universities), so we use limit(1)
      // and order by updated_at to get the most recently active outreach record
      const sourceProviderId = provider.selectedOrgProviderId;
      if (sourceProviderId) {
        // Exclude enrolled and all closed statuses
        const excludedStatuses = ["enrolled", "closed", "bounced", "do_not_contact", "wrong_number"];
        const { data: outreachRows } = await admin
          .from("staffing_outreach")
          .select("id, status, batch_id, sequence_email")
          .eq("provider_id", sourceProviderId)
          .not("status", "in", `(${excludedStatuses.join(",")})`)
          .order("updated_at", { ascending: false })
          .limit(1);
        const outreach = outreachRows?.[0];

        if (outreach) {
          // Update outreach status to enrolled
          await admin
            .from("staffing_outreach")
            .update({
              status: "enrolled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", outreach.id);

          // Stop Resend automation if sequence was active
          if (outreach.sequence_email) {
            try {
              await stopEmailSequence(outreach.sequence_email);
              console.log(`[medjobs/interviews/quick] Stopped Resend sequence for ${outreach.sequence_email}`);
            } catch (e) {
              console.error("[medjobs/interviews/quick] Failed to stop Resend sequence:", e);
              // Non-fatal - enrollment still succeeded
            }
          }

          // Log touchpoint for audit trail
          await admin.from("staffing_touchpoints").insert({
            outreach_id: outreach.id,
            type: "system_enrolled",
            notes: "Auto-enrolled via interview T&C acceptance",
            payload: {
              interview_id: interview.id,
              provider_profile_id: providerProfileId,
              enrollment_source: "medjobs_quick_schedule",
            },
          });

          // Atomic increment of batch enrolled count
          await admin.rpc("increment_batch_enrolled", { p_batch_id: outreach.batch_id });
        }
      }
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

    // Notify the student only if NOT pending verification
    // If pending verification, email will be sent when provider verifies
    if (!isPendingVerification && student.email) {
      // Format alternative time if provided
      const formattedAltTime = alternativeTime
        ? new Date(alternativeTime).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })
        : null;

      try {
        await sendEmail({
          to: student.email,
          subject: `Interview request from ${providerDisplayName}`,
          html: interviewProposedEmail({
            proposerName: providerDisplayName,
            interviewType: typeLabel,
            proposedTime: formattedDateTime,
            alternativeTime: formattedAltTime,
            notes: notes || null,
            viewUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/medjobs/interviews`,
          }),
          emailType: "interview_proposed",
          recipientType: "student",
          recipientProfileId: student.id,
        });
      } catch (emailError) {
        console.error("[medjobs/interviews/quick] student email error:", emailError);
      }
    } else if (isPendingVerification) {
      console.log(`[medjobs/interviews/quick] Interview ${interview.id} pending verification - student email will be sent after provider verifies`);
    }

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      providerProfileId,
      isPendingVerification,
    });
  } catch (err) {
    console.error("[medjobs/interviews/quick] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
