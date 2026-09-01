import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import {
  matchesNudgeEmail,
} from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/matches-nudge
 *
 * Runs daily. Two jobs:
 *
 * F3 — Family nudge: families with 2+ initiated conversations, at least 1
 *       quiet for 48hrs, and Matches NOT active. Send once only.
 *
 * P1 — Provider incomplete profile: providers signed up 48hrs+ ago whose
 *       profile is missing key fields. Send once only.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("matches-nudge", async () => {
  try {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    let familyNudges = 0;

    // ── F3: Family nudge ──────────────────────────────────────────

    // Get families who have sent inquiries (type="inquiry") — these are
    // families who reached out to providers directly
    const { data: familyConnections } = await db
      .from("connections")
      .select("from_profile_id, status, updated_at")
      .eq("type", "inquiry")
      .in("status", ["pending", "accepted"])
      .limit(500);

    if (familyConnections && familyConnections.length > 0) {
      // Group by family profile
      const familyMap = new Map<
        string,
        { total: number; quietCount: number }
      >();

      for (const conn of familyConnections) {
        const entry = familyMap.get(conn.from_profile_id) || {
          total: 0,
          quietCount: 0,
        };
        entry.total++;
        if (conn.updated_at < fortyEightHoursAgo) {
          entry.quietCount++;
        }
        familyMap.set(conn.from_profile_id, entry);
      }

      // Filter: 2+ total, at least 1 quiet for 48hrs
      const eligibleFamilyIds = Array.from(familyMap.entries())
        .filter(([, stats]) => stats.total >= 2 && stats.quietCount >= 1)
        .map(([id, stats]) => ({ id, total: stats.total }));

      if (eligibleFamilyIds.length > 0) {
        // Fetch their profiles — check Matches not active + not already nudged
        const { data: familyProfiles } = await db
          .from("business_profiles")
          .select("id, display_name, email, metadata")
          .in(
            "id",
            eligibleFamilyIds.map((f) => f.id),
          )
          .eq("type", "family");

        for (const fp of familyProfiles || []) {
          const meta = (fp.metadata || {}) as Record<string, unknown>;
          const carePost = meta.care_post as
            | { status: string }
            | undefined;

          // Skip if Matches already active or already nudged
          if (carePost?.status === "active") continue;
          if (meta.matches_nudge_email_sent) continue;
          if (meta.nudges_unsubscribed === true) continue;
          if (!fp.email) continue;

          const stats = eligibleFamilyIds.find((f) => f.id === fp.id);

          const mnSubject = "Still waiting to hear back?";
          const mnLogId = await reserveEmailLogId({ to: fp.email, subject: mnSubject, emailType: "matches_nudge", recipientType: "family" });

          // Build URL with magic link for one-click access
          const redirectPath = appendTrackingParams("/portal/profile", mnLogId);
          let matchesUrl = `${siteUrl}${redirectPath}`;

          try {
            const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
              type: "magiclink",
              email: fp.email,
              options: {
                redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(redirectPath)}`,
              },
            });
            if (!magicLinkError && magicLinkData?.properties?.action_link) {
              matchesUrl = magicLinkData.properties.action_link;
            }
          } catch (linkErr) {
            console.error("[matches-nudge] magic link failed:", linkErr);
            // Continue with fallback URL
          }

          await sendEmail({
            to: fp.email,
            subject: mnSubject,
            html: matchesNudgeEmail({
              unsubscribeId: fp.id,
              familyName: fp.display_name || "there",
              unansweredCount: stats?.total || 2,
              matchesUrl,
            }),
            emailType: "matches_nudge",
            recipientType: "family",
            emailLogId: mnLogId ?? undefined,
          });

          // Mark as sent
          await db
            .from("business_profiles")
            .update({
              metadata: { ...meta, matches_nudge_email_sent: true },
            })
            .eq("id", fp.id);

          familyNudges++;
        }
      }
    }

    // ── P1 (RETIRED 2026-09-01) ─────────────────────────────────────
    // provider_incomplete_profile used to live here. It asked providers with a
    // thin profile to finish it, 48h after signup. Retired because the
    // onboarding profile-preview email now owns that ask, on a tighter trigger
    // and with a better hook (its own opening line, inherited).
    //
    // It had also stopped working long before it was removed. The query had no
    // lower time bound, so `created_at <= 48h ago` matched every organization
    // profile ever created (2,169 rows), and `.limit(200)` with no ORDER BY
    // returned the same arbitrary oldest page every day. Of the 200 it kept
    // returning, zero were sendable. 145 sends in its life, 6 in its last month.

    return NextResponse.json({
      status: "ok",
      familyNudges,
    });
  } catch (err) {
    console.error("[cron/matches-nudge] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
  });
}
