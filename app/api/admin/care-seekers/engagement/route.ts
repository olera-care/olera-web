import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { calculateFamilyCompleteness } from "@/lib/admin/profile-completeness";
import type { FamilyMetadata } from "@/lib/types";

/**
 * GET /api/admin/care-seekers/engagement
 *
 * Returns nudge email engagement analytics for care seekers.
 * Tracks both profile completion and publishing as conversion events.
 *
 * Conversion definition:
 * - Completion: Profile completeness increased after receiving nudge (requires snapshot)
 * - Publish: Profile published after receiving nudge
 * - Attribution window: 30 days
 *
 * Note: Prior period comparison for "improved" metrics is not shown because
 * we don't have historical completeness timestamps - we can only compare
 * snapshots to current state, which doesn't work for past periods.
 */

// Email types that count as nudges
const NUDGE_EMAIL_TYPES = [
  "completion_nudge_1",
  "completion_nudge_2",
  "completion_nudge_3",
  "completion_nudge_4",
  "publish_nudge_1",
  "publish_nudge_2",
  "publish_nudge_3",
  "publish_nudge_4",
  "completion_maintenance",
  "publish_maintenance",
  // Legacy types
  "go_live_reminder",
  "family_profile_incomplete",
];

const COMPLETION_TYPES = [
  "completion_nudge_1",
  "completion_nudge_2",
  "completion_nudge_3",
  "completion_nudge_4",
  "completion_maintenance",
  "family_profile_incomplete",
];

const PUBLISH_TYPES = [
  "publish_nudge_1",
  "publish_nudge_2",
  "publish_nudge_3",
  "publish_nudge_4",
  "publish_maintenance",
  "go_live_reminder",
];

const ATTRIBUTION_WINDOW_DAYS = 30;
const MAX_EMAILS_PER_QUERY = 1000;

interface ProfileSnapshot {
  completeness: number;
  is_published: boolean;
}

interface EmailLogRow {
  id: string;
  recipient: string;
  email_type: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  metadata: {
    family_profile_id?: string;
    profile_snapshot?: ProfileSnapshot;
  } | null;
}

interface FamilyRow {
  id: string;
  email: string | null;
  metadata: FamilyMetadata | null;
  display_name: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[] | null;
  phone: string | null;
}

// Time window for filtering conversions
interface TimeWindow {
  start: Date;
  end: Date;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Define time windows for attribution
  const currentWindow: TimeWindow = { start: thirtyDaysAgo, end: now };
  const priorWindow: TimeWindow = { start: sixtyDaysAgo, end: thirtyDaysAgo };

  try {
    // Fetch nudge emails from last 30 days (current period) with limit
    const { data: currentEmails, error: currentError } = await db
      .from("email_log")
      .select("id, recipient, email_type, status, created_at, delivered_at, first_opened_at, first_clicked_at, metadata")
      .eq("recipient_type", "family")
      .in("email_type", NUDGE_EMAIL_TYPES)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(MAX_EMAILS_PER_QUERY);

    if (currentError) {
      console.error("[engagement] Current period query error:", currentError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Fetch nudge emails from prior 30 days (30-60 days ago) with limit
    const { data: priorEmails, error: priorError } = await db
      .from("email_log")
      .select("id, recipient, email_type, status, created_at, delivered_at, first_opened_at, first_clicked_at, metadata")
      .eq("recipient_type", "family")
      .in("email_type", NUDGE_EMAIL_TYPES)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(MAX_EMAILS_PER_QUERY);

    if (priorError) {
      console.error("[engagement] Prior period query error:", priorError);
      // Continue with current period data only
    }

    const emails = (currentEmails || []) as EmailLogRow[];
    const priorEmailsList = (priorEmails || []) as EmailLogRow[];

    // Get unique family profile IDs from emails that have snapshots
    const familyIdSet = new Set<string>();
    const recipientToFamilyId = new Map<string, string>();

    for (const email of [...emails, ...priorEmailsList]) {
      if (email.metadata?.family_profile_id) {
        familyIdSet.add(email.metadata.family_profile_id);
        recipientToFamilyId.set(email.recipient, email.metadata.family_profile_id);
      }
    }

    // Fetch current family profiles to compare against snapshots
    const familyIds = Array.from(familyIdSet);
    const familyMap = new Map<string, FamilyRow>();

    if (familyIds.length > 0) {
      // Batch fetch in chunks of 100
      const chunks: string[][] = [];
      for (let i = 0; i < familyIds.length; i += 100) {
        chunks.push(familyIds.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const { data: families } = await db
          .from("business_profiles")
          .select("id, email, metadata, display_name, image_url, city, state, description, care_types, phone")
          .in("id", chunk);

        if (families) {
          for (const f of families as FamilyRow[]) {
            familyMap.set(f.id, f);
          }
        }
      }
    }

    // Also fetch families by email for legacy emails without family_profile_id
    const recipientsWithoutId = [...emails, ...priorEmailsList]
      .filter(e => !e.metadata?.family_profile_id)
      .map(e => e.recipient);

    if (recipientsWithoutId.length > 0) {
      const uniqueRecipients = [...new Set(recipientsWithoutId)].slice(0, 100); // Limit
      const { data: familiesByEmail } = await db
        .from("business_profiles")
        .select("id, email, metadata, display_name, image_url, city, state, description, care_types, phone")
        .eq("type", "family")
        .in("email", uniqueRecipients);

      if (familiesByEmail) {
        for (const f of familiesByEmail as FamilyRow[]) {
          if (f.email && !recipientToFamilyId.has(f.email)) {
            familyMap.set(f.id, f);
            recipientToFamilyId.set(f.email, f.id);
          }
        }
      }
    }

    // Calculate funnel metrics for current period (can measure improvement against current state)
    const currentFunnel = calculateFunnel(emails, familyMap, recipientToFamilyId, currentWindow, true);

    // Calculate funnel metrics for prior period
    // NOTE: For prior period, we can only accurately measure published conversions
    // because we need published_at to fall within the prior window.
    // "Improved" metrics would compare old snapshots to current state, which is wrong.
    const priorFunnel = calculateFunnel(priorEmailsList, familyMap, recipientToFamilyId, priorWindow, false);

    // Calculate by sequence breakdown (current period only)
    const completionEmails = emails.filter(e => COMPLETION_TYPES.includes(e.email_type));
    const publishEmails = emails.filter(e => PUBLISH_TYPES.includes(e.email_type));

    const completionFunnel = calculateFunnel(completionEmails, familyMap, recipientToFamilyId, currentWindow, true);
    const publishFunnel = calculateFunnel(publishEmails, familyMap, recipientToFamilyId, currentWindow, true);

    // Calculate weekly trend (last 4 weeks)
    const trend = calculateWeeklyTrend(emails, familyMap, recipientToFamilyId);

    // Calculate rates using UNIQUE recipients at each stage
    const rates = {
      deliveryRate: currentFunnel.uniqueSent > 0
        ? Math.round((currentFunnel.uniqueDelivered / currentFunnel.uniqueSent) * 100) : 0,
      openRate: currentFunnel.uniqueDelivered > 0
        ? Math.round((currentFunnel.uniqueOpened / currentFunnel.uniqueDelivered) * 100) : 0,
      clickRate: currentFunnel.uniqueOpened > 0
        ? Math.round((currentFunnel.uniqueClicked / currentFunnel.uniqueOpened) * 100) : 0,
      conversionRate: currentFunnel.uniqueClicked > 0
        ? Math.round((currentFunnel.converted / currentFunnel.uniqueClicked) * 100) : 0,
    };

    const priorRates = {
      deliveryRate: priorFunnel.uniqueSent > 0
        ? Math.round((priorFunnel.uniqueDelivered / priorFunnel.uniqueSent) * 100) : 0,
      openRate: priorFunnel.uniqueDelivered > 0
        ? Math.round((priorFunnel.uniqueOpened / priorFunnel.uniqueDelivered) * 100) : 0,
      clickRate: priorFunnel.uniqueOpened > 0
        ? Math.round((priorFunnel.uniqueClicked / priorFunnel.uniqueOpened) * 100) : 0,
      conversionRate: priorFunnel.uniqueClicked > 0
        ? Math.round((priorFunnel.published / priorFunnel.uniqueClicked) * 100) : 0,
    };

    return NextResponse.json({
      funnel: {
        sent: currentFunnel.uniqueSent,
        delivered: currentFunnel.uniqueDelivered,
        opened: currentFunnel.uniqueOpened,
        clicked: currentFunnel.uniqueClicked,
        converted: currentFunnel.converted,
        improved: currentFunnel.improved,
        completed: currentFunnel.completed,
        published: currentFunnel.published,
      },
      rates,
      prior: {
        funnel: {
          sent: priorFunnel.uniqueSent,
          delivered: priorFunnel.uniqueDelivered,
          opened: priorFunnel.uniqueOpened,
          clicked: priorFunnel.uniqueClicked,
          converted: priorFunnel.published, // For prior, only published is accurate
          improved: null, // Can't accurately measure - would need historical snapshots
          completed: null,
          published: priorFunnel.published,
        },
        rates: priorRates,
      },
      bySequence: {
        completion: {
          sent: completionFunnel.uniqueSent,
          delivered: completionFunnel.uniqueDelivered,
          opened: completionFunnel.uniqueOpened,
          clicked: completionFunnel.uniqueClicked,
          improved: completionFunnel.improved,
          completed: completionFunnel.completed,
          published: completionFunnel.published,
          avgLift: completionFunnel.totalLift > 0 && completionFunnel.improvedCount > 0
            ? Math.round(completionFunnel.totalLift / completionFunnel.improvedCount)
            : 0,
        },
        publish: {
          sent: publishFunnel.uniqueSent,
          delivered: publishFunnel.uniqueDelivered,
          opened: publishFunnel.uniqueOpened,
          clicked: publishFunnel.uniqueClicked,
          improved: publishFunnel.improved,
          completed: publishFunnel.completed,
          published: publishFunnel.published,
        },
      },
      trend,
      windowDays: ATTRIBUTION_WINDOW_DAYS,
    });
  } catch (err) {
    console.error("[engagement] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface FunnelResult {
  // Unique recipient counts (deduplicated)
  uniqueSent: number;
  uniqueDelivered: number;
  uniqueOpened: number;
  uniqueClicked: number;
  // Conversion metrics (always unique)
  converted: number;
  improved: number;
  completed: number;
  published: number;
  // For avg lift calculation
  totalLift: number;
  improvedCount: number;
}

function calculateFunnel(
  emails: EmailLogRow[],
  familyMap: Map<string, FamilyRow>,
  recipientToFamilyId: Map<string, string>,
  window: TimeWindow,
  canMeasureImprovement: boolean // false for prior period
): FunnelResult {
  const result: FunnelResult = {
    uniqueSent: 0,
    uniqueDelivered: 0,
    uniqueOpened: 0,
    uniqueClicked: 0,
    converted: 0,
    improved: 0,
    completed: 0,
    published: 0,
    totalLift: 0,
    improvedCount: 0,
  };

  // Track unique recipients at each funnel stage
  const sentRecipients = new Set<string>();
  const deliveredRecipients = new Set<string>();
  const openedRecipients = new Set<string>();
  const clickedRecipients = new Set<string>();
  const convertedRecipients = new Set<string>();
  const improvedRecipients = new Set<string>();
  const completedRecipients = new Set<string>();
  const publishedRecipients = new Set<string>();

  for (const email of emails) {
    const recipient = email.recipient;

    // Count unique sent (all emails that weren't failed at send time)
    if (email.status !== "failed") {
      sentRecipients.add(recipient);
    }

    // Count unique delivered
    if (email.delivered_at) {
      deliveredRecipients.add(recipient);
    }

    // Count unique opened
    if (email.first_opened_at) {
      openedRecipients.add(recipient);
    }

    // Count unique clicked
    if (email.first_clicked_at) {
      clickedRecipients.add(recipient);
    }

    // Calculate conversions
    const familyId = email.metadata?.family_profile_id || recipientToFamilyId.get(recipient);
    if (!familyId) continue;

    const family = familyMap.get(familyId);
    if (!family) continue;

    const snapshot = email.metadata?.profile_snapshot;
    const emailDate = new Date(email.created_at);
    const meta = family.metadata || {};
    const isPublished = meta.care_post?.status === "active";
    const publishedAt = meta.care_post?.published_at;

    // Check if published after email AND within the attribution window
    if (isPublished && publishedAt && !publishedRecipients.has(recipient)) {
      const publishDate = new Date(publishedAt);
      const daysSinceEmail = (publishDate.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24);

      // Published must be:
      // 1. After the email was sent
      // 2. Within attribution window (30 days)
      // 3. Within our measurement window (for prior period accuracy)
      const publishedAfterEmail = daysSinceEmail >= 0 && daysSinceEmail <= ATTRIBUTION_WINDOW_DAYS;
      const publishedInWindow = publishDate >= window.start && publishDate <= window.end;

      if (publishedAfterEmail && publishedInWindow) {
        publishedRecipients.add(recipient);
        result.published++;
        if (!convertedRecipients.has(recipient)) {
          result.converted++;
          convertedRecipients.add(recipient);
        }
      }
    }

    // Check for completion improvement (only for current period where we can compare to current state)
    if (canMeasureImprovement && snapshot && COMPLETION_TYPES.includes(email.email_type)) {
      // Calculate current completeness
      const currentCompleteness = calculateFamilyCompleteness(family, family.email || "").percentage;
      const lift = currentCompleteness - snapshot.completeness;

      if (lift > 0 && !improvedRecipients.has(recipient)) {
        improvedRecipients.add(recipient);
        result.improved++;
        result.totalLift += lift;
        result.improvedCount++;

        // If not already counted as converted via publish
        if (!convertedRecipients.has(recipient)) {
          result.converted++;
          convertedRecipients.add(recipient);
        }
      }

      // Check if reached 100% completion (or ≥100 to be safe)
      if (currentCompleteness >= 100 && snapshot.completeness < 100 && !completedRecipients.has(recipient)) {
        completedRecipients.add(recipient);
        result.completed++;
      }
    }
  }

  result.uniqueSent = sentRecipients.size;
  result.uniqueDelivered = deliveredRecipients.size;
  result.uniqueOpened = openedRecipients.size;
  result.uniqueClicked = clickedRecipients.size;

  return result;
}

interface WeeklyData {
  week: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  improved: number;
  published: number;
}

function calculateWeeklyTrend(
  emails: EmailLogRow[],
  familyMap: Map<string, FamilyRow>,
  recipientToFamilyId: Map<string, string>
): WeeklyData[] {
  // Group emails by week
  const weekMap = new Map<string, EmailLogRow[]>();

  for (const email of emails) {
    const weekKey = getWeekStart(email.created_at);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(email);
  }

  // Calculate funnel for each week
  const weeks = Array.from(weekMap.keys()).sort().reverse().slice(0, 4);
  const now = new Date();

  return weeks.map(week => {
    const weekEmails = weekMap.get(week) || [];
    const weekStart = new Date(week);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // For weekly data, use current period logic (can measure improvement)
    const funnel = calculateFunnel(
      weekEmails,
      familyMap,
      recipientToFamilyId,
      { start: weekStart, end: weekEnd > now ? now : weekEnd },
      true
    );

    return {
      week,
      sent: funnel.uniqueSent,
      delivered: funnel.uniqueDelivered,
      opened: funnel.uniqueOpened,
      clicked: funnel.uniqueClicked,
      converted: funnel.converted,
      improved: funnel.improved,
      published: funnel.published,
    };
  });
}

/**
 * Get the Monday of the week for a given date string.
 * Returns ISO date string (YYYY-MM-DD).
 */
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust to get Monday
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}
