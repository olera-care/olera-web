import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import {
  goLiveReminderEmail,
  familyProfileIncompleteEmail,
  providerRecommendationEmail,
  postConnectionFollowupEmail,
  dormantReengagementEmail,
} from "@/lib/email-templates";

/**
 * GET /api/cron/family-nudges
 *
 * Runs daily at 3 PM UTC. Five-email priority waterfall:
 *
 * 1. Go Live Reminder — profile complete, not live, 24h+ old
 * 2. Profile Incomplete — missing care_types or location, 3+ days old
 * 3. Provider Recommendation — complete profile, zero connections, 5+ days old
 * 4. Dormant Re-engagement — zero connections, 14+ days old
 * 5. Post-Connection Follow-up — has connection 30+ days old
 *
 * Each email sent at most ONCE per family (metadata flag guard).
 * At most ONE email per family per cron run (priority waterfall).
 */
export const maxDuration = 60;

// ── Care type mapping: family profile → olera-providers ──

const CARE_TYPE_TO_CATEGORY: Record<string, string> = {
  "Home Care": "Home Care (Non-medical)",
  "Home Health Care": "Home Health Care",
  "Assisted Living": "Assisted Living",
  "Memory Care": "Memory Care",
  "Nursing Home": "Nursing Home",
  "Independent Living": "Independent Living",
  "Hospice Care": "Hospice",
  "Adult Day Care": "Adult Day Care",
};

// ── Provider recommendation types ──

interface ProviderRec {
  name: string;
  category: string;
  slug: string;
  rating: number;
  reviewCount: number;
  reviewSnippet: string | null;
  city: string;
  state: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

// ── Provider query helpers (with caching) ──

const providerCountCache = new Map<string, number>();
const topProviderCache = new Map<string, ProviderRec[]>();

function cacheKey(city: string, state: string, careTypes: string[]): string {
  return `${city}|${state}|${[...careTypes].sort().join(",")}`;
}

async function countProvidersInArea(
  db: DB,
  city: string,
  state: string,
  careTypes: string[],
): Promise<number> {
  const key = cacheKey(city, state, careTypes);
  if (providerCountCache.has(key)) return providerCountCache.get(key)!;

  const categories = careTypes
    .map((ct) => CARE_TYPE_TO_CATEGORY[ct])
    .filter(Boolean);

  let query = db
    .from("olera-providers")
    .select("provider_id", { count: "exact", head: true })
    .eq("state", state)
    .ilike("city", city)
    .or("deleted.is.null,deleted.eq.false");

  if (categories.length > 0) {
    query = query.in("provider_category", categories);
  }

  const { count } = await query;
  const result = count ?? 0;
  providerCountCache.set(key, result);
  return result;
}

async function getTopProviders(
  db: DB,
  city: string,
  state: string,
  careTypes: string[],
  limit = 4,
): Promise<ProviderRec[]> {
  const key = cacheKey(city, state, careTypes);
  if (topProviderCache.has(key)) return topProviderCache.get(key)!;

  const categories = careTypes
    .map((ct) => CARE_TYPE_TO_CATEGORY[ct])
    .filter(Boolean);

  // Try city + state first
  let query = db
    .from("olera-providers")
    .select("provider_name, provider_category, slug, city, state, google_rating, google_reviews_data")
    .eq("state", state)
    .ilike("city", city)
    .or("deleted.is.null,deleted.eq.false")
    .not("google_rating", "is", null)
    .gte("google_rating", 3.5)
    .order("google_rating", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (categories.length > 0) {
    query = query.in("provider_category", categories);
  }

  let { data: providers } = await query;

  // Fall back to state-only if not enough results
  if (!providers || providers.length < 2) {
    let stateQuery = db
      .from("olera-providers")
      .select("provider_name, provider_category, slug, city, state, google_rating, google_reviews_data")
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false")
      .not("google_rating", "is", null)
      .gte("google_rating", 4.0)
      .order("google_rating", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (categories.length > 0) {
      stateQuery = stateQuery.in("provider_category", categories);
    }

    const { data: stateProviders } = await stateQuery;
    if (stateProviders && stateProviders.length > (providers?.length ?? 0)) {
      providers = stateProviders;
    }
  }

  const results: ProviderRec[] = (providers || []).map((p) => {
    const grd = p.google_reviews_data as {
      rating?: number;
      review_count?: number;
      reviews?: { text?: string }[];
    } | null;

    return {
      name: p.provider_name,
      category: p.provider_category,
      slug: p.slug || p.provider_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      rating: grd?.rating ?? p.google_rating ?? 0,
      reviewCount: grd?.review_count ?? 0,
      reviewSnippet: grd?.reviews?.[0]?.text?.slice(0, 150) ?? null,
      city: p.city ?? "",
      state: p.state ?? "",
    };
  });

  topProviderCache.set(key, results);
  return results;
}

// ── Main handler ──

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
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
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      goLiveReminders: 0,
      profileIncomplete: 0,
      providerRecommendations: 0,
      dormantReengagement: 0,
      postConnectionFollowup: 0,
      skipped: 0,
    };

    // ── Step 1: Fetch family profiles (24h+ old) ──
    const { data: families } = await db
      .from("business_profiles")
      .select("id, display_name, email, city, state, care_types, metadata, created_at, account_id")
      .eq("type", "family")
      .lte("created_at", oneDayAgo)
      .limit(500);

    if (!families?.length) {
      return NextResponse.json({ status: "ok", message: "No eligible families", ...counts });
    }

    // ── Step 2: Resolve emails (account fallback) ──
    const accountIds = families
      .filter((f) => !f.email && f.account_id)
      .map((f) => f.account_id);

    let accountEmailMap: Record<string, string> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await db
        .from("accounts")
        .select("id, user_id")
        .in("id", accountIds);

      if (accounts?.length) {
        const { data: { users } } = await db.auth.admin.listUsers({ perPage: 500 });
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

    // ── Step 3: Batch-fetch connections ──
    const familyIds = families.map((f) => f.id);
    const { data: allConnections } = await db
      .from("connections")
      .select("from_profile_id, to_profile_id, created_at, type")
      .in("from_profile_id", familyIds)
      .eq("type", "inquiry")
      .order("created_at", { ascending: true });

    // Build connection map
    const connectionMap = new Map<string, {
      hasConnections: boolean;
      firstConnectionDate: string | null;
      firstToProfileId: string | null;
    }>();
    for (const conn of allConnections || []) {
      if (!connectionMap.has(conn.from_profile_id)) {
        connectionMap.set(conn.from_profile_id, {
          hasConnections: true,
          firstConnectionDate: conn.created_at,
          firstToProfileId: conn.to_profile_id,
        });
      }
    }

    // ── Step 4: Priority waterfall for each family ──
    for (const family of families) {
      const meta = (family.metadata || {}) as Record<string, unknown>;
      const email = family.email || (family.account_id ? accountEmailMap[family.account_id] : null);
      if (!email) { counts.skipped++; continue; }

      const hasCareTypes = family.care_types && (family.care_types as string[]).length > 0;
      const hasLocation = !!(family.city && family.state);
      const profileSufficient = hasCareTypes && hasLocation;
      const carePost = meta.care_post as { status?: string } | undefined;
      const isLive = carePost?.status === "active";
      const connData = connectionMap.get(family.id);
      const hasConnections = connData?.hasConnections || false;
      const firstName = family.display_name?.split(/\s+/)[0] || "there";
      const careTypes = (family.care_types as string[]) || [];

      // ── Priority 1: Go Live Reminder (Day 1+) ──
      if (
        profileSufficient &&
        !isLive &&
        family.created_at <= oneDayAgo &&
        !meta.go_live_reminder_sent
      ) {
        const providerCount = await countProvidersInArea(db, family.city!, family.state!, careTypes);
        const topProviders = await getTopProviders(db, family.city!, family.state!, careTypes, 3);

        const subject = providerCount > 0
          ? `${providerCount} providers in ${family.city} are looking for families like yours`
          : `Providers in ${family.city} are looking for families like yours`;

        if (!dryRun) {
          const glrLogId = await reserveEmailLogId({ to: email, subject, emailType: "go_live_reminder", recipientType: "family" });
          await sendEmail({
            to: email,
            subject,
            html: goLiveReminderEmail({
              familyName: firstName,
              matchesUrl: appendTrackingParams(`${siteUrl}/portal/matches`, glrLogId),
              city: family.city!,
              providerCount,
              topProviders,
            }),
            emailType: "go_live_reminder",
            recipientType: "family",
            emailLogId: glrLogId ?? undefined,
          });
          await db.from("business_profiles")
            .update({ metadata: { ...meta, go_live_reminder_sent: true } })
            .eq("id", family.id);
        }
        counts.goLiveReminders++;
        continue;
      }

      // ── Priority 2: Profile Incomplete (Day 3+) ──
      if (
        !profileSufficient &&
        family.created_at <= threeDaysAgo &&
        !meta.profile_incomplete_reminder_sent
      ) {
        const missingCareTypes = !hasCareTypes;
        const missingLocation = !hasLocation;
        let providerCount: number | undefined;
        if (hasLocation) {
          providerCount = await countProvidersInArea(db, family.city!, family.state!, careTypes);
        }

        let subject: string;
        if (missingCareTypes && !missingLocation) {
          subject = "Tell us what you're looking for";
        } else if (!missingCareTypes && missingLocation) {
          subject = "Add your location to see providers near you";
        } else {
          subject = "Unlock care options near you";
        }

        if (!dryRun) {
          const piLogId = await reserveEmailLogId({ to: email, subject, emailType: "family_profile_incomplete", recipientType: "family" });
          await sendEmail({
            to: email,
            subject,
            html: familyProfileIncompleteEmail({
              familyName: firstName,
              welcomeUrl: appendTrackingParams(`${siteUrl}/welcome`, piLogId),
              missingCareTypes,
              missingLocation,
              providerCount,
              state: family.state || undefined,
            }),
            emailType: "family_profile_incomplete",
            recipientType: "family",
            emailLogId: piLogId ?? undefined,
          });
          await db.from("business_profiles")
            .update({ metadata: { ...meta, profile_incomplete_reminder_sent: true } })
            .eq("id", family.id);
        }
        counts.profileIncomplete++;
        continue;
      }

      // ── Priority 3: Provider Recommendation (Day 5+) ──
      if (
        profileSufficient &&
        !hasConnections &&
        family.created_at <= fiveDaysAgo &&
        !meta.provider_recommendation_sent
      ) {
        const providers = await getTopProviders(db, family.city!, family.state!, careTypes, 4);
        if (providers.length >= 2) {
          if (!dryRun) {
            const prSubject = `Top-rated providers in ${family.city} for you`;
            const prLogId = await reserveEmailLogId({ to: email, subject: prSubject, emailType: "provider_recommendation", recipientType: "family" });
            await sendEmail({
              to: email,
              subject: prSubject,
              html: providerRecommendationEmail({
                familyName: firstName,
                city: family.city!,
                providers,
                browseUrl: appendTrackingParams(`${siteUrl}/browse?city=${encodeURIComponent(family.city!)}&state=${encodeURIComponent(family.state!)}`, prLogId),
              }),
              emailType: "provider_recommendation",
              recipientType: "family",
              emailLogId: prLogId ?? undefined,
            });
            await db.from("business_profiles")
              .update({ metadata: { ...meta, provider_recommendation_sent: true } })
              .eq("id", family.id);
          }
          counts.providerRecommendations++;
          continue;
        }
      }

      // ── Priority 4: Dormant Re-engagement (Day 14+) ──
      if (
        !hasConnections &&
        family.created_at <= fourteenDaysAgo &&
        !meta.dormant_reengagement_sent
      ) {
        const providers = await getTopProviders(
          db, family.city || "", family.state || "", careTypes, 3,
        );
        if (providers.length >= 1) {
          if (!dryRun) {
            const drSubject = `Families in ${family.state || "your area"} are finding care on Olera`;
            const drLogId = await reserveEmailLogId({ to: email, subject: drSubject, emailType: "dormant_reengagement", recipientType: "family" });
            await sendEmail({
              to: email,
              subject: drSubject,
              html: dormantReengagementEmail({
                familyName: firstName,
                state: family.state || "your area",
                providers,
                browseUrl: appendTrackingParams(`${siteUrl}/browse${family.state ? `?state=${encodeURIComponent(family.state)}` : ""}`, drLogId),
              }),
              emailType: "dormant_reengagement",
              recipientType: "family",
              emailLogId: drLogId ?? undefined,
            });
            await db.from("business_profiles")
              .update({ metadata: { ...meta, dormant_reengagement_sent: true } })
              .eq("id", family.id);
          }
          counts.dormantReengagement++;
          continue;
        }
      }

      // ── Priority 5: Post-Connection Follow-up (30 days after first connection) ──
      if (
        hasConnections &&
        connData?.firstConnectionDate &&
        connData.firstConnectionDate <= thirtyDaysAgo &&
        !meta.post_connection_followup_sent
      ) {
        let providerName = "your provider";
        let providerSlug = "";

        if (connData.firstToProfileId) {
          const { data: providerBp } = await db
            .from("business_profiles")
            .select("display_name, slug")
            .eq("id", connData.firstToProfileId)
            .single();
          if (providerBp) {
            providerName = providerBp.display_name || providerName;
            providerSlug = providerBp.slug || "";
          }
        }

        if (!dryRun) {
          const pcfSubject = `How was your experience with ${providerName}?`;
          const pcfLogId = await reserveEmailLogId({ to: email, subject: pcfSubject, emailType: "post_connection_followup", recipientType: "family" });
          await sendEmail({
            to: email,
            subject: pcfSubject,
            html: postConnectionFollowupEmail({
              familyName: firstName,
              providerName,
              providerSlug,
              reviewUrl: appendTrackingParams(`${siteUrl}/provider/${providerSlug}#reviews`, pcfLogId),
            }),
            emailType: "post_connection_followup",
            recipientType: "family",
            emailLogId: pcfLogId ?? undefined,
          });
          await db.from("business_profiles")
            .update({ metadata: { ...meta, post_connection_followup_sent: true } })
            .eq("id", family.id);
        }
        counts.postConnectionFollowup++;
        continue;
      }
    }

    return NextResponse.json({ status: "ok", dry_run: dryRun, ...counts });
  } catch (err) {
    console.error("[cron/family-nudges] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
