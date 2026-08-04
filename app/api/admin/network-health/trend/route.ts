import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import {
  canonicalizeMeaningfulProviderActivity,
  fetchMeaningfulProviderActivity,
} from "@/lib/admin-provider-activity";
import {
  ADMIN_TREND_TIME_ZONE,
  buildZonedCountSeries,
  buildZonedDistinctSeries,
  isPartialLastBucket,
  percentageDelta,
  resolveTrendBucket,
  type TrendBucket,
} from "@/lib/admin-trends";
import { createTwilioClient } from "@/lib/twilio";

export const maxDuration = 30;

const TREND_METRICS = [
  "questions_asked",
  "leads_received",
  "active_providers",
  "questions_answered",
  "provider_page_views",
  "benefits_requested",
  "email_clicks",
  "text_messages_received",
  "referral_sources_reviewed",
  "referral_calls_started",
  "referral_partners_gained",
  "reviews_received",
  "provider_accounts_claimed",
] as const;

type TrendMetric = (typeof TREND_METRICS)[number];

type ActivityRow = {
  created_at: string;
  profile_id: string | null;
  provider_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
};

type TimestampRow = { timestamp: string | null };

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type LoadedRows<T> = {
  rows: T[];
  truncated: boolean;
  error: Error | null;
};

// Supabase serves up to 10k rows per page in this project. Keep a hard ceiling
// so an unexpectedly large range cannot turn one admin graph into an unbounded
// request, while leaving enough room for the standard 90-day/12-month page-view
// presets at current traffic levels.
const PAGE_SIZE = 10000;
const MAX_SERIES_ROWS = 250000;
const MAX_TWILIO_ROWS = 2000;

function isTrendMetric(value: string | null): value is TrendMetric {
  return TREND_METRICS.includes(value as TrendMetric);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchPaged<T>(
  loadPage: (from: number, to: number) => Promise<PageResult<T>>,
  maxRows = MAX_SERIES_ROWS,
): Promise<LoadedRows<T>> {
  const rows: T[] = [];
  for (let offset = 0; offset < maxRows; offset += PAGE_SIZE) {
    const result = await loadPage(offset, offset + PAGE_SIZE - 1);
    if (result.error) {
      return { rows: [], truncated: false, error: new Error(result.error.message) };
    }
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { rows, truncated: false, error: null };
  }
  return { rows, truncated: true, error: null };
}

async function fetchActivityRows(
  db: SupabaseClient,
  eventTypes: string[],
  from: Date,
  to: Date,
  requireAnonymousSession = false,
): Promise<LoadedRows<ActivityRow>> {
  return fetchPaged<ActivityRow>(async (pageFrom, pageTo) => {
    let query = db
      .from("provider_activity")
      .select("created_at, profile_id, provider_id, event_type, metadata")
      .in("event_type", eventTypes)
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true });
    if (requireAnonymousSession) {
      query = query
        .not("metadata->>session_id", "is", null)
        .neq("metadata->>session_id", "");
    }
    const result = await query.range(pageFrom, pageTo);
    return {
      data: (result.data ?? []) as ActivityRow[],
      error: result.error,
    };
  });
}

async function fetchQuestionTimestamps(
  db: SupabaseClient,
  from: Date,
  to: Date,
  answered: boolean,
): Promise<LoadedRows<TimestampRow>> {
  return fetchPaged<TimestampRow>(async (pageFrom, pageTo) => {
    const timestampColumn = answered ? "answered_at" : "created_at";
    let query = db
      .from("provider_questions")
      .select(timestampColumn)
      .gte(timestampColumn, from.toISOString())
      .lt(timestampColumn, to.toISOString())
      .order(timestampColumn, { ascending: true });
    if (answered) {
      query = query
        .not("answered_at", "is", null)
        .not("answer", "is", null)
        .neq("answer", "");
    }
    const result = await query.range(pageFrom, pageTo);
    const data = (result.data ?? []).map((row) => ({
      timestamp: (row as Record<string, string | null>)[timestampColumn] ?? null,
    }));
    return { data, error: result.error };
  });
}

async function fetchBenefitsTimestamps(
  db: SupabaseClient,
  from: Date,
  to: Date,
): Promise<LoadedRows<TimestampRow>> {
  return fetchPaged<TimestampRow>(async (pageFrom, pageTo) => {
    const result = await db
      .from("seeker_activity")
      .select("created_at")
      .eq("event_type", "benefits_completed")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .range(pageFrom, pageTo);
    return {
      data: (result.data ?? []).map((row) => ({ timestamp: row.created_at })),
      error: result.error,
    };
  });
}

async function fetchEmailClickTimestamps(
  db: SupabaseClient,
  from: Date,
  to: Date,
): Promise<LoadedRows<TimestampRow>> {
  return fetchPaged<TimestampRow>(async (pageFrom, pageTo) => {
    const result = await db
      .from("email_log")
      .select("first_clicked_at")
      .eq("channel", "email")
      .not("first_clicked_at", "is", null)
      .gte("first_clicked_at", from.toISOString())
      .lt("first_clicked_at", to.toISOString())
      .order("first_clicked_at", { ascending: true })
      .range(pageFrom, pageTo);
    return {
      data: (result.data ?? []).map((row) => ({ timestamp: row.first_clicked_at })),
      error: result.error,
    };
  });
}

async function fetchReviewTimestamps(
  db: SupabaseClient,
  table: "reviews" | "olera_reviews",
  from: Date,
  to: Date,
): Promise<LoadedRows<TimestampRow>> {
  return fetchPaged<TimestampRow>(async (pageFrom, pageTo) => {
    const result = await db
      .from(table)
      .select("created_at")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .range(pageFrom, pageTo);
    return {
      data: (result.data ?? []).map((row) => ({ timestamp: row.created_at })),
      error: result.error,
    };
  });
}

function summarizeTimestamps(
  timestamps: Date[],
  from: Date,
  to: Date,
  priorFrom: Date,
  bucket: TrendBucket,
) {
  const current = timestamps.filter((timestamp) => timestamp >= from && timestamp < to);
  const prior = timestamps.filter((timestamp) => timestamp >= priorFrom && timestamp < from);
  return {
    total: current.length,
    priorTotal: prior.length,
    delta: percentageDelta(current.length, prior.length),
    series: buildZonedCountSeries(current, from, to, bucket, ADMIN_TREND_TIME_ZONE),
  };
}

function summarizeDistinct(
  rows: Array<{ timestamp: Date; key: string }>,
  from: Date,
  to: Date,
  priorFrom: Date,
  bucket: TrendBucket,
) {
  const current = rows.filter((row) => row.timestamp >= from && row.timestamp < to);
  const prior = rows.filter((row) => row.timestamp >= priorFrom && row.timestamp < from);
  const currentTotal = new Set(current.map((row) => row.key)).size;
  const priorTotal = new Set(prior.map((row) => row.key)).size;
  return {
    total: currentTotal,
    priorTotal,
    delta: percentageDelta(currentTotal, priorTotal),
    series: buildZonedDistinctSeries(current, from, to, bucket, ADMIN_TREND_TIME_ZONE),
  };
}

function validDates(rows: TimestampRow[]): Date[] {
  return rows
    .map((row) => row.timestamp ? new Date(row.timestamp) : null)
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()));
}

async function loadSupabaseTrend(
  metric: Exclude<TrendMetric, "text_messages_received">,
  db: SupabaseClient,
  priorFrom: Date,
  from: Date,
  to: Date,
  bucket: TrendBucket,
) {
  if (metric === "active_providers") {
    const activity = await fetchMeaningfulProviderActivity(db, priorFrom.toISOString(), to.toISOString());
    if (activity.error) throw activity.error;
    if (activity.truncated) return { truncated: true } as const;
    const canonical = await canonicalizeMeaningfulProviderActivity(db, activity.data);
    if (canonical.error) throw canonical.error;
    return {
      ...summarizeDistinct(
        canonical.data.map((row) => ({ timestamp: new Date(row.createdAt), key: row.providerId })),
        from,
        to,
        priorFrom,
        bucket,
      ),
      truncated: false,
    } as const;
  }

  if (metric === "questions_asked" || metric === "questions_answered") {
    const result = await fetchQuestionTimestamps(db, priorFrom, to, metric === "questions_answered");
    if (result.error) throw result.error;
    if (result.truncated) return { truncated: true } as const;
    return { ...summarizeTimestamps(validDates(result.rows), from, to, priorFrom, bucket), truncated: false } as const;
  }

  if (metric === "benefits_requested") {
    const result = await fetchBenefitsTimestamps(db, priorFrom, to);
    if (result.error) throw result.error;
    if (result.truncated) return { truncated: true } as const;
    return { ...summarizeTimestamps(validDates(result.rows), from, to, priorFrom, bucket), truncated: false } as const;
  }

  if (metric === "email_clicks") {
    const result = await fetchEmailClickTimestamps(db, priorFrom, to);
    if (result.error) throw result.error;
    if (result.truncated) return { truncated: true } as const;
    return { ...summarizeTimestamps(validDates(result.rows), from, to, priorFrom, bucket), truncated: false } as const;
  }

  if (metric === "reviews_received") {
    const [legacy, guest] = await Promise.all([
      fetchReviewTimestamps(db, "reviews", priorFrom, to),
      fetchReviewTimestamps(db, "olera_reviews", priorFrom, to),
    ]);
    if (legacy.error) throw legacy.error;
    if (guest.error) throw guest.error;
    if (legacy.truncated || guest.truncated) return { truncated: true } as const;
    return {
      ...summarizeTimestamps(validDates([...legacy.rows, ...guest.rows]), from, to, priorFrom, bucket),
      truncated: false,
    } as const;
  }

  const eventTypes: Record<
    Exclude<
      TrendMetric,
      | "active_providers"
      | "questions_asked"
      | "questions_answered"
      | "benefits_requested"
      | "email_clicks"
      | "text_messages_received"
      | "reviews_received"
    >,
    string
  > = {
    leads_received: "lead_received",
    provider_page_views: "page_view",
    referral_sources_reviewed: "referral_source_viewed",
    referral_calls_started: "referral_call_clicked",
    referral_partners_gained: "market_outreach_status_updated",
    provider_accounts_claimed: "claim_completed",
  };
  const result = await fetchActivityRows(
    db,
    [eventTypes[metric]],
    priorFrom,
    to,
    metric === "provider_page_views",
  );
  if (result.error) throw result.error;
  if (result.truncated) return { truncated: true } as const;

  if (metric === "referral_sources_reviewed" || metric === "referral_partners_gained") {
    const distinctRows = result.rows.flatMap((row) => {
      if (metric === "referral_partners_gained" && row.metadata?.status !== "referring") return [];
      const providerId = row.profile_id ?? row.provider_id;
      const targetId = typeof row.metadata?.target_id === "string" ? row.metadata.target_id : null;
      if (!providerId || !targetId) return [];
      return [{ timestamp: new Date(row.created_at), key: `${providerId}:${targetId}` }];
    });
    return { ...summarizeDistinct(distinctRows, from, to, priorFrom, bucket), truncated: false } as const;
  }

  return {
    ...summarizeTimestamps(result.rows.map((row) => new Date(row.created_at)), from, to, priorFrom, bucket),
    truncated: false,
  } as const;
}

async function loadInboundSmsTrend(
  priorFrom: Date,
  from: Date,
  to: Date,
  bucket: TrendBucket,
) {
  const sender = process.env.TWILIO_FROM_NUMBER;
  const client = createTwilioClient();
  if (!client || !sender) throw new Error("SMS reporting is not configured");
  const messages = await client.messages.list({
    to: sender,
    dateSentAfter: priorFrom,
    dateSentBefore: to,
    limit: MAX_TWILIO_ROWS,
  });
  if (messages.length >= MAX_TWILIO_ROWS) return { truncated: true } as const;
  const timestamps = messages
    .map((message) => message.dateSent ?? message.dateCreated)
    .filter((date): date is Date => Boolean(date));
  return { ...summarizeTimestamps(timestamps, from, to, priorFrom, bucket), truncated: false } as const;
}

/** Full graph data for one selected Overview Activity metric. */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const metric = request.nextUrl.searchParams.get("metric");
  const from = parseDate(request.nextUrl.searchParams.get("date_from"));
  const requestedTo = parseDate(request.nextUrl.searchParams.get("date_to"));
  if (!isTrendMetric(metric)) {
    return NextResponse.json({ error: "Unknown trend metric" }, { status: 400 });
  }
  if (!from || !requestedTo) {
    return NextResponse.json({ error: "A bounded date range is required" }, { status: 400 });
  }

  const now = new Date();
  const to = requestedTo > now ? now : requestedTo;
  if (from >= to) {
    return NextResponse.json({ error: "The selected range has not started" }, { status: 400 });
  }
  const liveRange = requestedTo >= now || now.getTime() - to.getTime() < 5 * 60 * 1000;

  const priorFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
  const bucket = resolveTrendBucket(from, to);

  try {
    const result = metric === "text_messages_received"
      ? await loadInboundSmsTrend(priorFrom, from, to, bucket)
      : await loadSupabaseTrend(metric, getServiceClient(), priorFrom, from, to, bucket);

    if (result.truncated) {
      return NextResponse.json({
        metric,
        truncated: true,
        error: "This range contains too much raw activity to graph accurately.",
      });
    }

    return NextResponse.json({
      metric,
      ...result,
      bucket,
      partialLastBucket: isPartialLastBucket(to, bucket, ADMIN_TREND_TIME_ZONE),
      partialLastBucketLive: liveRange,
      comparison: result.priorTotal === 0 && result.total > 0 ? "quiet_prior" : "normal",
      timeZone: ADMIN_TREND_TIME_ZONE,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trend query failed";
    console.error(`[admin/network-health/trend] ${metric} failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
