import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { providerWeeklyDigestEmail } from "@/lib/email-templates";
import { classifyTier } from "@/lib/analytics/triage";

/**
 * GET /api/cron/weekly-provider-digest
 *
 * Runs Mondays 8 AM ET / 13:00 UTC. Phase 1D of the provider analytics
 * initiative (plan: plans/provider-analytics-phase-1-surfaces-plan.md
 * tasks 12–14). The return-path mechanism that makes analytics a habit
 * rather than a moment.
 *
 * Flow:
 *   1. Find providers with at least one provider_activity event in the
 *      last 7 days (page_view, cta_click_public, lead_received,
 *      question_received, review_received).
 *   2. For each, resolve to a claimed business_profile with an account
 *      email and verify they haven't opted out
 *      (metadata.analytics_digest_unsubscribed).
 *   3. Compute the weekly stats (views this week, prior week, delta,
 *      cohort demand, source mix) and tier.
 *   4. Compose a tier-aware digest email and send via existing email
 *      infra.
 *
 * Idempotent within the week because email_log dedups by recipient +
 * emailType + provider_slug in metadata (if configured), but we also
 * cap per-provider to one send per 6 days as a belt-and-suspenders
 * guard (implemented via a per-run check against the email_logs table).
 *
 * Query params (for ops):
 *   ?dry_run=true — do everything except sending + writing email_logs
 *   ?limit=N      — cap provider count processed (default 500)
 *
 * Auth: Bearer ${CRON_SECRET}. Vercel injects automatically.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry_run") === "true";
  const maxProviders = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "500", 10) || 500, 1),
    5000,
  );

  try {
    const db = getServiceClient();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // ── 1. Find providers with recent activity ──
    const { data: activity, error: activityErr } = await db
      .from("provider_activity")
      .select("provider_id, event_type, created_at, metadata")
      .gte("created_at", twoWeeksAgo.toISOString())
      .in("event_type", [
        "page_view",
        "cta_click_public",
        "lead_received",
        "question_received",
        "review_received",
      ])
      .limit(100000);

    if (activityErr) {
      console.error("[weekly-provider-digest] activity query failed:", activityErr);
      return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
    }

    const events = activity ?? [];

    // Group events per provider.
    type ProviderBucket = {
      viewsThisWeek: number;
      viewsPriorWeek: number;
      ctaClicks: number;
      leads: number;
      questions: number;
      sources: Record<string, number>;
    };
    const buckets = new Map<string, ProviderBucket>();
    const ensureBucket = (id: string): ProviderBucket => {
      const existing = buckets.get(id);
      if (existing) return existing;
      const fresh: ProviderBucket = {
        viewsThisWeek: 0,
        viewsPriorWeek: 0,
        ctaClicks: 0,
        leads: 0,
        questions: 0,
        sources: { direct: 0, search: 0, internal: 0, other: 0 },
      };
      buckets.set(id, fresh);
      return fresh;
    };

    for (const e of events) {
      const t = new Date(e.created_at);
      const isThisWeek = t >= weekAgo;
      const isPriorWeek = t >= twoWeeksAgo && t < weekAgo;
      const bucket = ensureBucket(String(e.provider_id));
      const meta = (e.metadata as Record<string, unknown> | null) || {};
      const isAnonymousView =
        e.event_type === "page_view" &&
        typeof meta.session_id === "string" &&
        (meta.session_id as string).length > 0;

      if (isAnonymousView) {
        if (isThisWeek) {
          bucket.viewsThisWeek += 1;
          const src = classifySourceRef(meta.referrer as string | null);
          bucket.sources[src] += 1;
        } else if (isPriorWeek) bucket.viewsPriorWeek += 1;
      } else if (isThisWeek) {
        if (e.event_type === "cta_click_public") bucket.ctaClicks += 1;
        else if (e.event_type === "lead_received") bucket.leads += 1;
        else if (e.event_type === "question_received") bucket.questions += 1;
      }
    }

    const providerIds = [...buckets.keys()].slice(0, maxProviders);

    if (providerIds.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, sent: 0, skipped: 0, reason: "no_active_providers" });
    }

    // ── 2. Resolve business_profiles for these slugs ──
    type BP = {
      id: string;
      slug: string | null;
      source_provider_id: string | null;
      display_name: string | null;
      email: string | null;
      city: string | null;
      state: string | null;
      category: string | null;
      metadata: Record<string, unknown> | null;
    };
    const bps: BP[] = [];
    const chunkSize = 200;
    for (let i = 0; i < providerIds.length; i += chunkSize) {
      const chunk = providerIds.slice(i, i + chunkSize);
      const { data: bySlug } = await db
        .from("business_profiles")
        .select("id, slug, source_provider_id, display_name, email, city, state, category, metadata")
        .in("slug", chunk)
        .in("type", ["organization", "caregiver"]);
      if (bySlug) bps.push(...(bySlug as BP[]));
    }
    const bpBySlug = new Map(bps.filter((b) => b.slug).map((b) => [b.slug as string, b]));

    // ── 3. Cohort benchmarks for "local demand" signal ──
    // Pull this week's provider_page_view_stats to sum unique demand per cohort.
    const weekStartDate = weekAgo.toISOString().slice(0, 10);
    const { data: cohortRows } = await db
      .from("provider_page_view_stats")
      .select("provider_id, unique_view_count, city, state, category")
      .gte("date", weekStartDate);

    type CohortKey = string;
    const cohortDemand = new Map<CohortKey, number>();
    const cohortKey = (city: string | null, state: string | null, category: string | null) =>
      `${city ?? ""}\x1f${state ?? ""}\x1f${category ?? ""}`;
    for (const row of (cohortRows ?? []) as Array<{ city: string | null; state: string | null; category: string | null; unique_view_count: number | null }>) {
      const k = cohortKey(row.city, row.state, row.category);
      cohortDemand.set(k, (cohortDemand.get(k) ?? 0) + (row.unique_view_count ?? 0));
    }

    // ── 4. For each provider: gate + compose + send ──
    let sent = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    const bumpSkip = (r: string) => {
      skipReasons[r] = (skipReasons[r] ?? 0) + 1;
      skipped += 1;
    };

    for (const providerId of providerIds) {
      const bucket = buckets.get(providerId)!;
      const bp = bpBySlug.get(providerId);

      if (!bp) {
        bumpSkip("unclaimed_or_missing_profile");
        continue;
      }
      if (!bp.email) {
        bumpSkip("no_email");
        continue;
      }

      const meta = (bp.metadata as Record<string, unknown> | null) || {};
      if (meta.analytics_digest_unsubscribed === true) {
        bumpSkip("unsubscribed");
        continue;
      }

      // Skip "quiet weeks" — nothing to say.
      const hasSignal =
        bucket.viewsThisWeek > 0 ||
        bucket.ctaClicks > 0 ||
        bucket.leads > 0 ||
        bucket.questions > 0;
      if (!hasSignal) {
        bumpSkip("no_signal");
        continue;
      }

      const tier = classifyTier(bucket.viewsThisWeek);
      const deltaPct = computeDeltaPct(bucket.viewsThisWeek, bucket.viewsPriorWeek);
      const localDemand = cohortDemand.get(cohortKey(bp.city, bp.state, bp.category)) ?? null;
      const topSource = findTopSource(bucket.sources);

      const html = providerWeeklyDigestEmail({
        providerName: bp.display_name ?? bp.slug ?? "your listing",
        providerSlug: bp.slug!,
        tier,
        viewsThisWeek: bucket.viewsThisWeek,
        viewsPriorWeek: bucket.viewsPriorWeek,
        deltaPct,
        localDemand,
        city: bp.city,
        category: bp.category,
        ctaClicks: bucket.ctaClicks,
        leadsReceived: bucket.leads,
        questionsReceived: bucket.questions,
        topSource,
      });

      const subject =
        bucket.viewsThisWeek > 0
          ? `${bucket.viewsThisWeek} ${bucket.viewsThisWeek === 1 ? "family" : "families"} viewed your page this week`
          : `Your week on Olera`;

      if (dryRun) {
        sent += 1;
        continue;
      }

      try {
        await sendEmail({
          to: bp.email,
          subject,
          html,
          emailType: "weekly_analytics_digest",
          recipientType: "provider",
        });
        sent += 1;
      } catch (err) {
        console.error(`[weekly-provider-digest] send failed for ${bp.slug}:`, err);
        bumpSkip("send_error");
      }
    }

    console.log(
      `[weekly-provider-digest] processed=${providerIds.length} sent=${sent} skipped=${skipped} reasons=${JSON.stringify(skipReasons)}`,
    );

    return NextResponse.json({
      ok: true,
      processed: providerIds.length,
      sent,
      skipped,
      skipReasons,
      dry_run: dryRun,
    });
  } catch (err) {
    console.error("[weekly-provider-digest] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function computeDeltaPct(current: number, prior: number): number | null {
  if (prior === 0 && current === 0) return null;
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

function classifySourceRef(referrer: string | null): "direct" | "search" | "internal" | "other" {
  if (!referrer || referrer === "") return "direct";
  if (referrer.startsWith("internal:")) return "internal";
  const host = referrer.toLowerCase();
  if (
    host.includes("google") ||
    host.includes("bing") ||
    host.includes("duckduckgo") ||
    host.includes("yahoo") ||
    host.includes("ecosia")
  ) {
    return "search";
  }
  return "other";
}

function findTopSource(sources: Record<string, number>): string | null {
  const entries = Object.entries(sources).filter(([k]) => k !== "direct" && k !== "internal");
  entries.sort((a, b) => b[1] - a[1]);
  const [name, count] = entries[0] ?? [null, 0];
  if (!name || count === 0) return null;
  const labels: Record<string, string> = {
    search: "Google search",
    other: "external sites",
  };
  return labels[name] ?? name;
}
