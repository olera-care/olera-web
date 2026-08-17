import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { seekerEventLabel } from "@/lib/activity/seeker-categories";

/**
 * Care-seeker counterpart to the provider comms timeline. It merges messages
 * addressed to the seeker's email with meaningful actions recorded against the
 * seeker's business_profiles.id.
 */
const TIMELINE_ACTIVITY_EVENTS = [
  "connection_sent",
  "profile_enriched",
  "profile_published",
  "go_live_skipped",
  "question_asked",
  "matches_activated",
  "benefits_completed",
  "save_nudge_signup_clicked",
  "save_nudge_dismissed",
  "save_nudge_converted",
  "benefits_results_viewed",
  "outreach_card_clicked",
  "outreach_request_submitted",
  "question_email_enriched",
  "connection_outcome_reported",
  "benefits_outcome_reported",
] as const;

type EmailRow = {
  id: string;
  email_type: string;
  subject: string;
  channel: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  error_message: string | null;
};

type ActivityRow = {
  id: string;
  event_type: string;
  related_provider_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type TimelineEvent =
  | {
      id: string;
      at: string;
      kind: "email";
      email: {
        log_id: string;
        email_type: string;
        subject: string;
        channel: string | null;
        status: string;
        delivered_at: string | null;
        first_opened_at: string | null;
        first_clicked_at: string | null;
        bounced_at: string | null;
        complained_at: string | null;
        error_message: string | null;
      };
    }
  | {
      id: string;
      at: string;
      kind: "activity";
      activity: {
        event_type: string;
        summary: string;
        metadata: Record<string, unknown> | null;
      };
    };

function summarizeActivity(row: ActivityRow): string {
  const metadata = row.metadata ?? {};
  const providerName = typeof metadata.provider_name === "string"
    ? metadata.provider_name
    : row.related_provider_id;

  switch (row.event_type) {
    case "connection_sent":
      return providerName ? `Connected with ${providerName}` : "Connected with a provider";
    case "question_asked":
      return providerName ? `Asked ${providerName} a question` : "Asked a provider a question";
    case "profile_enriched": {
      const fields = Array.isArray(metadata.enriched_fields)
        ? metadata.enriched_fields.filter((field): field is string => typeof field === "string")
        : [];
      return fields.length > 0 ? `Added profile details: ${fields.join(", ")}` : "Added profile details";
    }
    case "benefits_completed": {
      const matches = typeof metadata.match_count === "number" ? metadata.match_count : null;
      return matches === null ? "Completed a benefits guide" : `Completed a benefits guide (${matches} matches)`;
    }
    case "connection_outcome_reported": {
      const value = typeof metadata.value === "string" ? metadata.value.replace(/_/g, " ") : null;
      return value ? `Reported provider response: ${value}` : "Reported whether a provider responded";
    }
    case "benefits_outcome_reported": {
      const value = typeof metadata.value === "string" ? metadata.value.replace(/_/g, " ") : null;
      return value ? `Reported benefits progress: ${value}` : "Reported benefits progress";
    }
    default:
      return seekerEventLabel(row.event_type);
  }
}

function postgrestQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seekerId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { seekerId } = await params;
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.floor(rawLimit))) : 50;
    const perSourceCap = Math.min(200, limit * 4);
    const db = getServiceClient();

    const { data: seeker, error: seekerError } = await db
      .from("business_profiles")
      .select("id, email")
      .eq("id", seekerId)
      .eq("type", "family")
      .maybeSingle();

    if (seekerError || !seeker) {
      return NextResponse.json({ error: "Care seeker not found" }, { status: 404 });
    }

    // Family SMS rows store the profile UUID in provider_id (the legacy column
    // available on email_log), while email rows primarily key on recipient.
    // Match either so "Comms" really spans the channels already in the ledger.
    let emailRowsQuery = db
      .from("email_log")
      .select("id, email_type, subject, channel, status, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, error_message")
      .or("recipient_type.is.null,recipient_type.eq.family");
    let emailCountQuery = db
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .or("recipient_type.is.null,recipient_type.eq.family");

    const messageIdentityFilters = [
      seeker.email ? `recipient.eq.${postgrestQuote(seeker.email)}` : null,
      // Family SMS uses this legacy column as its stable profile key.
      `provider_id.eq.${seekerId}`,
      // Modern family emails carry the stable profile key in metadata. This
      // preserves history when the profile's current email has changed.
      `metadata->>family_profile_id.eq.${seekerId}`,
    ].filter((filter): filter is string => filter !== null).join(",");
    emailRowsQuery = emailRowsQuery.or(messageIdentityFilters);
    emailCountQuery = emailCountQuery.or(messageIdentityFilters);

    const emailRowsPromise = emailRowsQuery
      .order("created_at", { ascending: false })
      .limit(perSourceCap);

    let activityRowsQuery = db
      .from("seeker_activity")
      .select("id, event_type, related_provider_id, metadata, created_at")
      .in("event_type", [...TIMELINE_ACTIVITY_EVENTS]);
    let activityCountQuery = db
      .from("seeker_activity")
      .select("id", { count: "exact", head: true })
      .in("event_type", [...TIMELINE_ACTIVITY_EVENTS]);

    // Most events have profile_id. Save-nudge conversion is deliberately
    // written immediately after signup without it, but does carry user_email.
    // Matching that exact email keeps the meaningful conversion on the newly
    // created care seeker's timeline instead of silently dropping it.
    if (seeker.email) {
      const activityIdentityFilter = `profile_id.eq.${seekerId},metadata->>user_email.eq.${postgrestQuote(seeker.email)}`;
      activityRowsQuery = activityRowsQuery.or(activityIdentityFilter);
      activityCountQuery = activityCountQuery.or(activityIdentityFilter);
    } else {
      activityRowsQuery = activityRowsQuery.eq("profile_id", seekerId);
      activityCountQuery = activityCountQuery.eq("profile_id", seekerId);
    }

    const [emailRes, activityRes, emailCountRes, activityCountRes] = await Promise.all([
      emailRowsPromise,
      activityRowsQuery
        .order("created_at", { ascending: false })
        .limit(perSourceCap),
      emailCountQuery,
      activityCountQuery,
    ]);

    if (emailRes.error) {
      console.error("[care-seeker-comms-timeline] email_log query failed:", emailRes.error);
      return NextResponse.json({ error: "Failed to load emails" }, { status: 500 });
    }
    if (activityRes.error) {
      console.error("[care-seeker-comms-timeline] seeker_activity query failed:", activityRes.error);
      return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
    }

    const emailRows = (emailRes.data ?? []) as EmailRow[];
    const activityRows = (activityRes.data ?? []) as ActivityRow[];

    const emailEvents: TimelineEvent[] = emailRows.map((row) => ({
      id: `email:${row.id}`,
      at: row.created_at,
      kind: "email",
      email: {
        log_id: row.id,
        email_type: row.email_type,
        subject: row.subject,
        channel: row.channel,
        status: row.status,
        delivered_at: row.delivered_at,
        first_opened_at: row.first_opened_at,
        first_clicked_at: row.first_clicked_at,
        bounced_at: row.bounced_at,
        complained_at: row.complained_at,
        error_message: row.error_message,
      },
    }));

    const activityEvents: TimelineEvent[] = activityRows.map((row) => ({
      id: `activity:${row.id}`,
      at: row.created_at,
      kind: "activity",
      activity: {
        event_type: row.event_type,
        summary: summarizeActivity(row),
        metadata: row.metadata,
      },
    }));

    const events = [...emailEvents, ...activityEvents]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);

    return NextResponse.json({
      events,
      totalEmails: emailCountRes.count ?? emailEvents.length,
      totalActivity: activityCountRes.count ?? activityEvents.length,
      fetchedEmails: emailEvents.length,
      fetchedActivity: activityEvents.length,
    });
  } catch (error) {
    console.error("[care-seeker-comms-timeline] fatal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
