import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  readBenefitsCascade,
  cascadeStatus,
  readBenefitsCase,
  caseStatus,
  lifecycleStatus,
  benefitsSituationLine,
  type CascadeStatus,
  type CaseStatus,
  type Lifecycle,
} from "@/lib/family-comms/benefits-cascade.server";
import { readBenefitsNavigator } from "@/lib/family-comms/benefits-navigator.server";

/**
 * GET /api/admin/benefits/families?from=<ISO>&to=<ISO>
 *     (legacy: ?days=7|30|90 · all-time: ?all=1 · default: last 30 days)
 *
 * Read layer for the Benefits Families queue. Aggregates what the intake
 * flow already captures — no new instrumentation:
 *   - seeker_activity `benefits_completed` events (the completion + its
 *     attribution metadata)
 *   - business_profiles enrichment answers (relationship / timeline /
 *     payment methods, captured post-submit)
 *   - email_log engagement for the results email
 *   - benefits_results_tokens.last_viewed_at (did they open /m/{token})
 *
 * Per-family match lists are intentionally NOT surfaced here: matches are
 * deterministic per (state, care need) — a keyword filter, not eligibility —
 * so the per-family signal lives in enrichment + engagement, not the list.
 */

const WINDOW_DAYS = [7, 30, 90] as const;

interface FamilyRow {
  /** Navigator letter status for the row chip (full draft rides the per-family GET). */
  navigator: { status: "pending" | "sent" | "dismissed"; composedAt: string | null } | null;
  profileId: string;
  displayName: string | null;
  email: string | null;
  state: string | null;
  careNeed: string | null;
  matchCount: number | null;
  topProgram: string | null;
  entrySource: string | null;
  providerSlug: string | null;
  isNewUser: boolean;
  completedAt: string;
  enrichment: {
    relationship: string | null;
    timeline: string | null;
    payments: string[] | null;
  };
  /** Held eligibility facts, humanized ("age 72, on Medicaid, income
   *  $1,500–$2,500/mo"). Null until the family gives a Phase 3 fact. */
  situation: string | null;
  /** All three eligibility asks answered (prefer-not-to-say counts). */
  situationComplete: boolean;
  /** Reachability: textable = phone + sms_consent + not opted out (the SMS
   *  system can reach them); hasPhone alone = manual call only. */
  reach: { hasPhone: boolean; textable: boolean };
  signals: {
    emailOpened: boolean;
    emailClicked: boolean;
    resultsViewed: boolean;
    enriched: boolean;
  };
  /** Benefits Cascade progress (Phase 2): matched → first_step_sent →
   *  moving / wants_help / wrong_program. Derived from
   *  metadata.benefits_cascade, stamped by the coordinator rungs + the
   *  /benefits-outcome capture. */
  cascade: {
    status: CascadeStatus;
    firstStepProgram: string | null;
    firstStepSentAt: string | null;
    outcomeAt: string | null;
    outcomeReason: string | null;
  };
  /** Stuck-state routing (null = healthy / being worked / resolved) + the
   *  admin case record. Two ignored automated touches → a human's queue. */
  caseStatus: CaseStatus | null;
  caseInfo: {
    noteCount: number;
    contactedAt: string | null;
    resolvedAt: string | null;
  };
  /** The one family-centric status the queue renders + filters on. */
  lifecycle: Lifecycle;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function humanizeSource(path: string): string {
  const segs = path.split("/").filter(Boolean);
  const last = segs[segs.length - 1] || path;
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Range resolution: explicit from/to ISO bounds (the DateRangePopover
    // sends these), ?all=1 for unbounded, legacy ?days for old callers,
    // default = last 30 days. The prior-window delta compares an equal-length
    // window immediately before `from` — meaningless for all-time, so it goes
    // null there and the client hides it.
    const search = request.nextUrl.searchParams;
    const parseIso = (s: string | null): Date | null => {
      if (!s) return null;
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };
    let fromDate = parseIso(search.get("from"));
    let toDate = parseIso(search.get("to"));
    if (!fromDate && !search.get("all")) {
      const daysParam = Number(search.get("days"));
      const fallbackDays = (WINDOW_DAYS as readonly number[]).includes(daysParam) ? daysParam : 30;
      fromDate = new Date(Date.now() - fallbackDays * 86400e3);
      toDate = null;
    }
    if (fromDate && toDate && toDate <= fromDate) toDate = null;
    const windowMs = fromDate ? (toDate ?? new Date()).getTime() - fromDate.getTime() : null;
    const days = windowMs ? Math.max(1, Math.round(windowMs / 86400e3)) : null;
    const since = fromDate?.toISOString() ?? null;
    const until = toDate?.toISOString() ?? null;
    const prevSince =
      fromDate && windowMs ? new Date(fromDate.getTime() - windowMs).toISOString() : null;

    const db = getServiceClient();

    const bounded = <T extends { gte(c: string, v: string): T; lt(c: string, v: string): T }>(q: T): T => {
      let out = q;
      if (since) out = out.gte("created_at", since);
      if (until) out = out.lt("created_at", until);
      return out;
    };

    const [{ data: events, error: eventsErr }, { count: windowCount }, prevRes] = await Promise.all([
      bounded(
        db
          .from("seeker_activity")
          .select("profile_id, created_at, metadata")
          .eq("event_type", "benefits_completed"),
      )
        .order("created_at", { ascending: false })
        .limit(500),
      // True completion count — the row fetch above caps at 500, so counts
      // must not come from events.length or growth silently under-reports.
      bounded(
        db
          .from("seeker_activity")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "benefits_completed"),
      ),
      prevSince && since
        ? db
            .from("seeker_activity")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "benefits_completed")
            .gte("created_at", prevSince)
            .lt("created_at", since)
        : Promise.resolve({ count: null }),
    ]);
    const prevCount = prevRes.count;
    if (eventsErr) throw eventsErr;

    // One row per family — keep the latest completion per profile.
    const latestByProfile = new Map<string, { created_at: string; metadata: Record<string, unknown> }>();
    for (const ev of events ?? []) {
      if (!ev.profile_id || latestByProfile.has(ev.profile_id)) continue;
      latestByProfile.set(ev.profile_id, { created_at: ev.created_at, metadata: ev.metadata ?? {} });
    }
    const profileIds = [...latestByProfile.keys()];

    // Hydrate profiles, results-page views, and email engagement in chunks.
    const profiles = new Map<
      string,
      {
        display_name: string | null;
        email: string | null;
        state: string | null;
        phone: string | null;
        phone_validity: string | null;
        metadata: Record<string, unknown>;
      }
    >();
    const viewedProfiles = new Set<string>();
    const viewedAtByProfile = new Map<string, string>();
    for (const ids of chunk(profileIds, 100)) {
      const [{ data: profs }, { data: tokens }] = await Promise.all([
        db.from("business_profiles").select("id, display_name, email, state, phone, phone_validity, metadata").in("id", ids),
        db.from("benefits_results_tokens").select("profile_id, last_viewed_at").in("profile_id", ids),
      ]);
      for (const p of profs ?? []) profiles.set(p.id, p);
      for (const t of tokens ?? []) {
        if (t.last_viewed_at) {
          viewedProfiles.add(t.profile_id);
          const prev = viewedAtByProfile.get(t.profile_id);
          if (!prev || t.last_viewed_at > prev) viewedAtByProfile.set(t.profile_id, t.last_viewed_at);
        }
      }
    }

    const emails = [...profiles.values()].map((p) => p.email).filter((e): e is string => !!e);
    const opened = new Set<string>();
    const clicked = new Set<string>();
    for (const batch of chunk(emails, 100)) {
      const { data: logs } = await db
        .from("email_log")
        .select("recipient, first_opened_at, first_clicked_at")
        .eq("email_type", "benefits_results_saved")
        .in("recipient", batch);
      for (const log of logs ?? []) {
        if (log.first_opened_at) opened.add(log.recipient);
        if (log.first_clicked_at) clicked.add(log.recipient);
      }
    }

    // Build rows + aggregations in one pass.
    const families: FamilyRow[] = [];
    const bySource = new Map<string, { label: string; path: string | null; count: number }>();
    const byState = new Map<string, number>();
    const byCareNeed = new Map<string, number>();
    let engaged = 0;
    let enrichedCount = 0;
    let situationCompleteCount = 0;
    let textableCount = 0;
    let wantsHelp = 0;
    let navigatorPending = 0;
    const stuckCounts: Record<string, number> = {};
    const lifecycleCounts: Record<string, number> = {};

    for (const [profileId, ev] of latestByProfile) {
      const meta = ev.metadata as Record<string, unknown>;
      const profile = profiles.get(profileId);
      const pMeta = (profile?.metadata ?? {}) as Record<string, unknown>;

      const relationship = (pMeta.relationship_to_recipient as string) || (pMeta.relationship as string) || null;
      const timeline = (pMeta.timeline as string) || null;
      const payments = Array.isArray(pMeta.payment_methods) ? (pMeta.payment_methods as string[]) : null;
      // Enriched = answered ANY follow-up. Includes the Phase 3 facts and
      // payment_unsure ("Not sure yet" writes its own flag, never
      // payment_methods) — without them this KPI would silently dip after
      // the payment-step reframe and read as an engagement regression.
      const enriched = Boolean(
        relationship ||
          timeline ||
          (payments && payments.length) ||
          pMeta.payment_unsure ||
          pMeta.age ||
          pMeta.medicaid_status ||
          pMeta.income_range,
      );
      // Situation complete = made it through all three eligibility asks
      // ("prefer not to say" counts as answered — this measures flow
      // completion; the situation line itself only shows real facts).
      const situationComplete = Boolean(pMeta.age && pMeta.medicaid_status && pMeta.income_range);
      // Textable = the SMS system can actually reach them (consent-aware).
      // Phone on file without consent = TJ can call, automation won't text.
      const hasPhone = Boolean(profile?.phone);
      const textable =
        hasPhone && Boolean(pMeta.sms_consent) && profile?.phone_validity !== "opted_out";

      const email = profile?.email ?? null;
      const signals = {
        emailOpened: email ? opened.has(email) : false,
        emailClicked: email ? clicked.has(email) : false,
        resultsViewed: viewedProfiles.has(profileId),
        enriched,
      };
      if (signals.emailOpened || signals.emailClicked || signals.resultsViewed) engaged++;
      if (enriched) enrichedCount++;
      if (situationComplete) situationCompleteCount++;
      if (textable) textableCount++;

      const state = (meta.state as string) || profile?.state || null;
      const careNeed = (meta.care_need as string) || null;
      const entrySource = (meta.entry_source as string) || null;
      const providerSlug = (meta.provider_slug as string) || null;

      if (state) byState.set(state, (byState.get(state) ?? 0) + 1);
      if (careNeed) byCareNeed.set(careNeed, (byCareNeed.get(careNeed) ?? 0) + 1);
      const sourceKey = entrySource || (providerSlug ? `/provider/${providerSlug}` : "direct");
      const existing = bySource.get(sourceKey);
      if (existing) existing.count++;
      else {
        bySource.set(sourceKey, {
          label: sourceKey === "direct" ? "Direct" : humanizeSource(sourceKey),
          path: sourceKey === "direct" ? null : sourceKey,
          count: 1,
        });
      }

      const cascadeMeta = readBenefitsCascade(pMeta);
      const status = cascadeStatus(cascadeMeta);
      if (status === "wants_help") wantsHelp++;
      const caseMeta = readBenefitsCase(pMeta);
      const cs = caseStatus(cascadeMeta, caseMeta, viewedAtByProfile.get(profileId) ?? null, Date.now());
      if (cs) stuckCounts[cs] = (stuckCounts[cs] ?? 0) + 1;
      const lifecycle = lifecycleStatus({
        cascade: cascadeMeta,
        caseMeta,
        completedAt: ev.created_at,
        lastViewedAt: viewedAtByProfile.get(profileId) ?? null,
        now: Date.now(),
      });
      lifecycleCounts[lifecycle.status] = (lifecycleCounts[lifecycle.status] ?? 0) + 1;

      const navMeta = readBenefitsNavigator(pMeta);
      if (navMeta.status === "pending") navigatorPending++;

      families.push({
        navigator: navMeta.status
          ? { status: navMeta.status, composedAt: navMeta.composed_at ?? null }
          : null,
        profileId,
        displayName: profile?.display_name ?? null,
        email,
        state,
        careNeed,
        matchCount: typeof meta.match_count === "number" ? meta.match_count : null,
        topProgram: (meta.top_program as string) || null,
        entrySource,
        providerSlug,
        isNewUser: Boolean(meta.is_new_user),
        completedAt: ev.created_at,
        enrichment: { relationship, timeline, payments },
        situation: benefitsSituationLine(pMeta),
        situationComplete,
        reach: { hasPhone, textable },
        signals,
        cascade: {
          status,
          firstStepProgram: cascadeMeta.first_step_program_name ?? null,
          firstStepSentAt: cascadeMeta.first_step_sent_at ?? null,
          outcomeAt: cascadeMeta.outcome_at ?? null,
          outcomeReason: cascadeMeta.outcome_reason ?? null,
        },
        caseStatus: cs,
        caseInfo: {
          noteCount: caseMeta.notes?.length ?? 0,
          contactedAt: caseMeta.contacted_at ?? null,
          resolvedAt: caseMeta.resolved_at ?? null,
        },
        lifecycle,
      });
    }

    // Queue order: the caseload floats by severity (wants_help > silent after
    // check-in > action stall > attention stall), everyone else newest-first.
    const SEVERITY: Record<string, number> = { needs_help: 0, stalled: 1 };
    families.sort((a, b) => {
      const ar = SEVERITY[a.lifecycle.status] ?? 9;
      const br = SEVERITY[b.lifecycle.status] ?? 9;
      if (ar !== br) return ar - br;
      return b.completedAt.localeCompare(a.completedAt);
    });

    return NextResponse.json({
      days,
      // The row fetch caps at 500 — flag it so the client can say so instead
      // of silently presenting a truncated table as complete.
      truncated: (events ?? []).length >= 500,
      summary: {
        completions: windowCount ?? (events ?? []).length,
        uniqueFamilies: families.length,
        prevCompletions: prevCount,
        engaged,
        enriched: enrichedCount,
        situationComplete: situationCompleteCount,
        textable: textableCount,
        wantsHelp,
        navigatorPending,
        stuck: stuckCounts,
        lifecycle: lifecycleCounts,
      },
      breakdown: {
        topSources: [...bySource.values()].sort((a, b) => b.count - a.count).slice(0, 6),
        topStates: [...byState.entries()]
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
        careNeeds: [...byCareNeed.entries()]
          .map(([careNeed, count]) => ({ careNeed, count }))
          .sort((a, b) => b.count - a.count),
      },
      families,
    });
  } catch (err) {
    console.error("Admin benefits families error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
