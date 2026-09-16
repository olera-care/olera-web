import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { profileIncompleteNudgeEmail, medjobsReviewNudgeEmail } from "@/lib/medjobs-email-templates";
import { calculateCompleteness, getIncompleteSections } from "@/lib/medjobs-completeness";
import { generateStudentPortalUrl } from "@/lib/claim-tokens";
import type { StudentMetadata } from "@/lib/types";
import { withCronRun } from "@/lib/crons/run";

/** Student profile row from the nudge query */
interface StudentNudgeRow {
  id: string;
  slug: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  metadata: StudentMetadata | null;
  created_at: string;
  is_active: boolean;
}

/**
 * GET /api/cron/medjobs-nudge
 *
 * Runs daily at 10 AM CT (15:00 UTC).
 *
 * Nudge cadence for incomplete profiles (< 100%):
 *   Nudge 1: Day 1 (24hrs after signup)
 *   Nudge 2: Day 3
 *   Nudge 3: Day 5
 *   Nudge 4: Day 7
 *   Nudge 5-8: Every 2 weeks
 *   Stop after nudge 8 (~6 weeks)
 *
 * For 100% complete profiles (review nudge cadence):
 *   - If already live (is_active) or approved → skip
 *   - If review requested but not approved → skip (waiting for admin)
 *   - Otherwise, nudge to request review:
 *       Nudge 1: Day 0 (immediate)
 *       Nudge 2: Day 2
 *       Nudge 3: Day 5
 *       Nudge 4: Day 10
 *       Stop after nudge 4
 */

const NUDGE_CADENCE_DAYS = [1, 3, 5, 7, 21, 35, 49, 63]; // Day thresholds for nudges 1-8
const MAX_NUDGES = 8;

// Review nudge cadence — less aggressive since profile is complete
// Day 0: immediate, Day 2, Day 5, Day 10 (4 nudges total)
const REVIEW_NUDGE_CADENCE_DAYS = [0, 2, 5, 10];
const MAX_REVIEW_NUDGES = 4;

const PAGE_SIZE = 500; // Fetch students in batches to handle >1000 students

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("medjobs-nudge", async () => {
  try {
    const db = getServiceClient();

    let nudged = 0;
    let reviewNudged = 0;
    let skipped = 0;
    let totalProcessed = 0;
    const now = Date.now();

    // Paginate through all students (Supabase defaults to 1000 row limit)
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: students, error } = await db
        .from("business_profiles")
        .select("id, slug, display_name, email, phone, city, state, image_url, metadata, created_at, is_active")
        .eq("type", "student")
        .not("email", "is", null)
        .not("display_name", "is", null)
        .range(offset, offset + PAGE_SIZE - 1)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[medjobs-nudge] query error:", error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }

      const batch = (students || []) as StudentNudgeRow[];
      hasMore = batch.length === PAGE_SIZE;
      offset += PAGE_SIZE;
      totalProcessed += batch.length;

    for (const student of batch) {
      // Skip if display_name is empty (belt and suspenders)
      if (!student.display_name?.trim()) {
        skipped++;
        continue;
      }

      const meta = (student.metadata || {}) as StudentMetadata;

      // Skip if student has unsubscribed from nudge emails
      if ((meta as Record<string, unknown>).nudges_unsubscribed) {
        skipped++;
        continue;
      }
      const hasPhoto = !!student.image_url;
      const hasBasicInfo = {
        hasName: !!student.display_name?.trim(),
        hasEmail: !!student.email,
        hasPhone: !!student.phone,
        hasUniversity: !!meta.university,
        hasLocation: !!(student.city && student.state),
      };

      // Recalculate completeness fresh (single source of truth)
      const completeness = calculateCompleteness(meta, hasPhoto, hasBasicInfo);

      // If 100% complete — check review flow status
      if (completeness >= 100) {
        // If profile is already live (is_active), skip entirely
        // This catches students approved before the review flow was implemented
        if (student.is_active) {
          skipped++;
          continue;
        }

        const metaRecord = meta as Record<string, unknown>;
        const reviewRequestedAt = metaRecord.review_requested_at as string | undefined;
        const approvedAt = metaRecord.approved_at as string | undefined;
        const applicationCompleted = metaRecord.application_completed as boolean | undefined;
        const reviewNudgeCount = (metaRecord.review_nudge_count as number) || 0;
        const reviewNudgeFirstSentAt = metaRecord.review_nudge_first_sent_at as string | undefined;
        const lastReviewNudgeSentAt = metaRecord.last_review_nudge_sent_at as string | undefined;

        // If already approved or application completed, skip (profile is live)
        if (approvedAt || applicationCompleted) {
          skipped++;
          continue;
        }

        // If review requested but not yet approved, skip (waiting for admin)
        if (reviewRequestedAt) {
          skipped++;
          continue;
        }

        // Check if we've maxed out review nudges
        if (reviewNudgeCount >= MAX_REVIEW_NUDGES) {
          skipped++;
          continue;
        }

        // Check if enough time has passed for the next review nudge
        // First nudge: immediate (day 0). Subsequent: based on cadence from first nudge.
        if (reviewNudgeCount > 0 && reviewNudgeFirstSentAt) {
          const daysSinceFirstNudge = (now - new Date(reviewNudgeFirstSentAt).getTime()) / (1000 * 60 * 60 * 24);
          const nextNudgeDay = REVIEW_NUDGE_CADENCE_DAYS[reviewNudgeCount] ?? Infinity;
          if (daysSinceFirstNudge < nextNudgeDay) {
            skipped++;
            continue;
          }
        }

        // Safety: don't send if we already sent today
        if (lastReviewNudgeSentAt) {
          const hoursSinceLastNudge = (now - new Date(lastReviewNudgeSentAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastNudge < 20) {
            skipped++;
            continue;
          }
        }

        // Send review nudge
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

          // Generate one-click sign-in URL with 15-day HMAC token
          const magicLink = generateStudentPortalUrl(
            student.email!,
            "/portal/medjobs",
            siteUrl
          );

          await sendEmail({
            to: student.email!,
            subject: "Your profile is ready — request a review to go live",
            html: medjobsReviewNudgeEmail({
              studentName: student.display_name,
              portalUrl: magicLink,
            }),
            emailType: "medjobs_review_nudge",
            recipientType: "student",
            recipientProfileId: student.id,
          });

          // Re-fetch metadata to reduce race condition risk
          const { data: freshProfile } = await db
            .from("business_profiles")
            .select("metadata")
            .eq("id", student.id)
            .single();
          const freshMeta = (freshProfile?.metadata || meta) as Record<string, unknown>;

          const nowIso = new Date().toISOString();
          await db.from("business_profiles").update({
            metadata: {
              ...freshMeta,
              review_nudge_count: reviewNudgeCount + 1,
              last_review_nudge_sent_at: nowIso,
              // Only set first_sent_at on the first nudge
              ...(reviewNudgeCount === 0 ? { review_nudge_first_sent_at: nowIso } : {}),
            },
          }).eq("id", student.id);

          reviewNudged++;
        } catch (err) {
          console.error(`[medjobs-nudge] review nudge email error for ${student.email}:`, err);
        }
        continue;
      }

      // Check nudge count
      const nudgeCount = (meta as Record<string, unknown>).nudge_count as number || 0;
      if (nudgeCount >= MAX_NUDGES) { skipped++; continue; }

      // Check if enough time has passed for the next nudge
      const daysSinceCreation = (now - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const nextNudgeDay = NUDGE_CADENCE_DAYS[nudgeCount] || Infinity;
      if (daysSinceCreation < nextNudgeDay) { skipped++; continue; }

      // Check we haven't sent today (safety — cron might run multiple times)
      const lastNudge = (meta as Record<string, unknown>).last_nudge_sent_at as string | undefined;
      if (lastNudge) {
        const hoursSinceLastNudge = (now - new Date(lastNudge).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastNudge < 20) { skipped++; continue; }
      }

      // Get incomplete sections for the email (matches portal UI)
      const incompleteSections = getIncompleteSections(meta, hasPhoto, hasBasicInfo);
      if (incompleteSections.length === 0) { skipped++; continue; }

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

        // Generate one-click sign-in URL with 15-day HMAC token
        const magicLink = generateStudentPortalUrl(
          student.email!,
          "/portal/medjobs/profile",
          siteUrl
        );

        await sendEmail({
          to: student.email!,
          subject: `Your MedJobs profile is ${completeness}% complete`,
          html: profileIncompleteNudgeEmail({
            studentName: student.display_name,
            completeness,
            missingItems: incompleteSections.slice(0, 5),
            magicLink,
            unsubscribeId: student.id,
          }),
          emailType: "profile_incomplete_nudge",
          recipientType: "student",
          recipientProfileId: student.id,
        });

        // Re-fetch metadata to reduce race condition risk
        const { data: freshProfile } = await db
          .from("business_profiles")
          .select("metadata")
          .eq("id", student.id)
          .single();
        const freshMeta = (freshProfile?.metadata || meta) as Record<string, unknown>;

        // Update nudge tracking
        await db
          .from("business_profiles")
          .update({
            metadata: {
              ...freshMeta,
              last_nudge_sent_at: new Date().toISOString(),
              nudge_count: nudgeCount + 1,
            },
          })
          .eq("id", student.id);

        nudged++;
      } catch (err) {
        console.error(`[medjobs-nudge] error for ${student.email}:`, err);
      }
    }
    } // end while (hasMore)

    return NextResponse.json({ nudged, reviewNudged, skipped, totalProcessed });
  } catch (err) {
    console.error("[medjobs-nudge] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
