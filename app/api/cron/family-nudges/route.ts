import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  goLiveReminderEmail,
  familyProfileIncompleteEmail,
} from "@/lib/email-templates";

/**
 * GET /api/cron/family-nudges
 *
 * Runs daily. Two jobs:
 *
 * 1. Go Live Reminder — families with profile ≥ 50% complete (have care_types
 *    AND city/state) but care_post not active, account 24-48hrs old. Send once.
 *
 * 2. Profile Incomplete — families with profile < 50% complete (missing
 *    care_types OR city/state), account 3+ days old. Send once.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

    let goLiveCount = 0;
    let incompleteCount = 0;

    // Fetch family profiles created in the relevant window (24h+ ago)
    const { data: families } = await db
      .from("business_profiles")
      .select("id, display_name, email, city, state, care_types, metadata, created_at, account_id")
      .eq("type", "family")
      .lte("created_at", twentyFourHoursAgo)
      .limit(500);

    // We need account emails for families that don't have email on profile
    const accountIds = (families || [])
      .filter((f) => !f.email && f.account_id)
      .map((f) => f.account_id);

    let accountEmailMap: Record<string, string> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await db
        .from("accounts")
        .select("id, user_id")
        .in("id", accountIds);

      if (accounts && accounts.length > 0) {
        // Get emails from auth.users via admin API
        const { data: { users } } = await db.auth.admin.listUsers({
          perPage: 500,
        });
        const userEmailMap: Record<string, string> = {};
        for (const u of users || []) {
          if (u.email) userEmailMap[u.id] = u.email;
        }
        for (const acct of accounts) {
          if (acct.user_id && userEmailMap[acct.user_id]) {
            accountEmailMap[acct.id] = userEmailMap[acct.user_id];
          }
        }
      }
    }

    for (const family of families || []) {
      const meta = (family.metadata || {}) as Record<string, unknown>;
      const email = family.email || (family.account_id ? accountEmailMap[family.account_id] : null);
      if (!email) continue;

      const hasCareTypes = family.care_types && (family.care_types as string[]).length > 0;
      const hasLocation = !!(family.city && family.state);
      const profileSufficient = hasCareTypes && hasLocation;

      const carePost = meta.care_post as { status?: string } | undefined;
      const isLive = carePost?.status === "active";

      // ── Job 1: Go Live Reminder ──────────────────────────────────
      // Profile ≥ 50% complete, not live, 24-48h old, not already sent
      if (
        profileSufficient &&
        !isLive &&
        family.created_at >= fortyEightHoursAgo &&
        family.created_at <= twentyFourHoursAgo &&
        !meta.go_live_reminder_sent
      ) {
        await sendEmail({
          to: email,
          subject: "You're ready to go live — let providers find you",
          html: goLiveReminderEmail({
            familyName: family.display_name?.split(/\s+/)[0] || "there",
            matchesUrl: `${siteUrl}/portal/matches`,
          }),
        });

        await db
          .from("business_profiles")
          .update({ metadata: { ...meta, go_live_reminder_sent: true } })
          .eq("id", family.id);

        goLiveCount++;
        continue; // Don't send both emails to the same person
      }

      // ── Job 2: Profile Incomplete Reminder ───────────────────────
      // Profile < 50%, 3+ days old, not already sent
      if (
        !profileSufficient &&
        family.created_at <= threeDaysAgo &&
        !meta.profile_incomplete_reminder_sent
      ) {
        await sendEmail({
          to: email,
          subject: "Complete your profile to get matched",
          html: familyProfileIncompleteEmail({
            familyName: family.display_name?.split(/\s+/)[0] || "there",
            welcomeUrl: `${siteUrl}/welcome`,
          }),
        });

        await db
          .from("business_profiles")
          .update({ metadata: { ...meta, profile_incomplete_reminder_sent: true } })
          .eq("id", family.id);

        incompleteCount++;
      }
    }

    return NextResponse.json({
      status: "ok",
      goLiveReminders: goLiveCount,
      profileIncompleteReminders: incompleteCount,
    });
  } catch (err) {
    console.error("[cron/family-nudges] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
