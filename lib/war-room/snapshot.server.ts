import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countCanonicalProviders,
  fetchMeaningfulProviderActivity,
} from "@/lib/admin-provider-activity";
import {
  buildWarRoomMetrics,
  buildWarRoomSignals,
  chooseWarRoomRecommendation,
  type WarRoomFacts,
} from "@/lib/war-room/recommend";
import type {
  WarRoomDecision,
  WarRoomGrowthWeek,
  WarRoomSnapshot,
  WarRoomSource,
} from "@/lib/war-room/types";
import type { GrowthSnapshot } from "@/lib/growth/types";

type CountResult = { count: number | null; error: { message: string } | null };

function requireCount(label: string, result: CountResult) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.count ?? 0;
}

function ageLabel(value: string | null) {
  if (!value) return "Never";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function truncate(value: string, length = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}

function redactContactDetails(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[phone removed]");
}

function growthWeek(snapshot: GrowthSnapshot | undefined): WarRoomGrowthWeek | null {
  if (!snapshot) return null;
  const brandedClicks = snapshot.gsc?.query_mix.branded_clicks ?? 0;
  const nonBrandedClicks = snapshot.gsc?.query_mix.non_branded_clicks ?? 0;
  const classifiedClicks = brandedClicks + nonBrandedClicks;
  return {
    weekStart: snapshot.week_start,
    weekEnd: snapshot.week_end,
    sessions: snapshot.ga4.overview.sessions,
    totalUsers: snapshot.ga4.overview.total_users,
    pageViews: snapshot.ga4.overview.page_views,
    searchClicks: snapshot.gsc?.performance.clicks ?? null,
    searchImpressions: snapshot.gsc?.performance.impressions ?? null,
    inquiries: snapshot.marketplace.inquiries,
    questions: snapshot.marketplace.questions_asked,
    benefitsCompleted: snapshot.marketplace.benefits_completed,
    anomalies: snapshot.anomalies.map((anomaly) => anomaly.label),
    channels: snapshot.ga4.channels,
    organicLandingPages: snapshot.ga4.organic.landing_pages.slice(0, 12),
    searchTopPages: snapshot.gsc?.top_pages.slice(0, 12) ?? [],
    brandedSearchShare: classifiedClicks > 0 ? brandedClicks / classifiedClicks : null,
  };
}

export async function buildWarRoomSnapshot(
  db: SupabaseClient,
  windowDays = 30,
): Promise<WarRoomSnapshot> {
  const generatedAt = new Date().toISOString();
  // Both boundaries used to be computed from `Date.now()`, inside a function the
  // route calls fresh on every request with nothing cached, and the current
  // window had no upper bound at all. So both ends slid continuously and the
  // current window also grew all day against a fixed prior one.
  //
  // Re-running the provider-page-views query at six-hour anchors across nine
  // days returned anywhere from -11% to -31% with no change in code or data.
  // Three of those readings (-23.8%, -28.1%, -28.3%) were recorded as three
  // separate magnitudes for "the same nominal window" and raised a company-wide
  // data-integrity investigation that then blocked every other case for a month.
  // The card was the defect it was reporting.
  //
  // Anchor both windows to the start of the current UTC day and bound the
  // current one, so a given day's comparison is one number and both periods are
  // exactly `windowDays` long. Today's partial data is deliberately excluded:
  // a half-finished day compared against whole ones always reads as a decline.
  const windowEnd = new Date();
  windowEnd.setUTCHours(0, 0, 0, 0);
  const until = windowEnd.toISOString();
  const from = new Date(windowEnd.getTime() - windowDays * 86_400_000).toISOString();
  const priorFrom = new Date(windowEnd.getTime() - windowDays * 2 * 86_400_000).toISOString();

  const [
    pageViewsResult,
    leadsResult,
    questionsResult,
    answersResult,
    benefitsResult,
    claimsResult,
    providerActivity,
    adBoostResult,
    growthResult,
    supportResult,
    supportCountResult,
    supportUrgentResult,
    mailboxResult,
    recentQuestionResult,
    recentInquiryResult,
    decisionResult,
    questionHealthResult,
    callTouchResult,
    viewsFloorResult,
    leadsFloorResult,
    claimsFloorResult,
  ] = await Promise.all([
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "page_view").gte("created_at", from).lt("created_at", until)
      .not("metadata->>session_id", "is", null).neq("metadata->>session_id", ""),
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "lead_received").gte("created_at", from).lt("created_at", until),
    db.from("provider_question_asks").select("id", { count: "exact", head: true })
      .gte("created_at", from).lt("created_at", until),
    db.from("provider_questions").select("id", { count: "exact", head: true })
      .is("canonical_question_id", null)
      .gte("created_at", from).lt("created_at", until)
      .not("answer", "is", null).neq("answer", "")
      .not("answered_at", "is", null).lt("answered_at", until),
    db.from("seeker_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "benefits_completed").gte("created_at", from).lt("created_at", until),
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "claim_completed").gte("created_at", from).lt("created_at", until),
    fetchMeaningfulProviderActivity(db, from, until),
    // Was five columns and not one of them a date, so this view of Managed Ads
    // was timeless: it could count 7 requested but never that one of them had
    // been waiting 59 days. Worse, with no pause state and no photo state, a
    // provider deliberately held back for a Nextdoor test looked identical to
    // an abandoned one. TJ named that exact defect about the admin page on
    // 2026-09-17: "the page doesn't show that their email is paused
    // deliberately."
    db.from("ad_campaign_requests")
      .select("provider_id, display_name, status, plan_status, plan_value, deleted_at, created_at, subscribed_at, flight_start_date, flight_end_date, ended_at, ended_reason, photo_readiness_status, photo_update_requested_at, photo_update_submitted_at, provider_comms_paused_at, provider_comms_paused_reason")
      .is("deleted_at", null),
    db.from("growth_metric_snapshots")
      .select("week_start, week_end, source, definition_version, collected_at, ga4, gsc, marketplace, source_status, anomalies")
      .eq("source", "google_supabase")
      .order("week_start", { ascending: false })
      .limit(2),
    db.from("support_email_threads")
      .select("id, subject, snippet, agent_summary, category, priority, state, last_message_at")
      .gte("last_message_at", from)
      .order("last_message_at", { ascending: false })
      .limit(20),
    db.from("support_email_threads")
      .select("id", { count: "exact", head: true })
      .in("state", ["needs_reply", "escalated"]),
    db.from("support_email_threads")
      .select("id", { count: "exact", head: true })
      .in("state", ["needs_reply", "escalated"])
      .or("priority.eq.urgent,state.eq.escalated"),
    db.from("support_mailboxes")
      .select("sync_status, last_sync_at, full_sync_complete")
      .order("last_sync_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("provider_questions")
      .select("id, question, status, created_at")
      .is("canonical_question_id", null)
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(6),
    db.from("connections")
      .select("id, message, created_at")
      .eq("type", "inquiry")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(8),
    db.from("war_room_decisions")
      .select("id, recommendation_key, recommendation_title, decision, note, decided_by, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    db.from("provider_questions")
      .select("id, status, answer, metadata")
      .is("canonical_question_id", null)
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(50_000),
    // The human record. Without it a campaign stalled behind a photo request is
    // indistinguishable from one nobody chased, and on 2026-09-21 that produced
    // a confident, wrong reading that four providers had been abandoned. Three
    // of them had dead phone lines and a fourth never received the email,
    // all of it already called and logged by Ces on 2026-09-17.
    db.from("provider_touches")
      .select("provider_id, channel, outcome, occurred_at")
      .eq("channel", "call")
      .order("occurred_at", { ascending: false })
      .limit(500),
    // The oldest instrumented event PER event type. At windowDays=90 (selectable
    // on the admin route) the prior window opens before these rows exist at all,
    // so the comparison divides by a period that partly did not happen and
    // printed a confident +164% rise. A period that predates its own
    // instrumentation is not a comparison.
    //
    // Per type, not per table: provider_activity's first row of any kind is
    // 2026-03-27, but page_view and lead_received start 2026-04-22 and
    // claim_completed 2026-04-27. A single table-wide floor silently under-guards
    // every metric instrumented later than the earliest one.
    ...(["page_view", "lead_received", "claim_completed"] as const).map((eventType) =>
      db.from("provider_activity")
        .select("created_at")
        .eq("event_type", eventType)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()),
  ]);

  if (providerActivity.error) {
    throw new Error(`provider activity: ${providerActivity.error.message}`);
  }
  if (providerActivity.truncated) {
    throw new Error("provider activity exceeded the 100,000-row safety cap");
  }
  const activeProviderResult = await countCanonicalProviders(db, providerActivity.data);
  if (activeProviderResult.error) {
    throw new Error(`provider identity: ${activeProviderResult.error.message}`);
  }
  if (adBoostResult.error) throw new Error(`Ad Boost: ${adBoostResult.error.message}`);

  const adRows = adBoostResult.data ?? [];
  const payingRows = adRows.filter((row) => ["active", "past_due"].includes(row.plan_status ?? ""));

  // A stall is only a finding when nobody has acted on it. Counting "days since
  // we asked" alone says four providers were abandoned; the truth on
  // 2026-09-21 was three dead phone lines and one broken email address, every
  // one of them already called. So the count is split by what was actually
  // done, and a stall nobody attended is the only one that should read as a
  // problem. A call touch never fails the snapshot: losing the human record
  // should degrade the split, not the scan.
  const ADBOOST_STALL_DAYS = 14;
  const nowMs = Date.now();
  const daysSince = (iso: string | null | undefined) =>
    iso ? Math.floor((nowMs - Date.parse(iso)) / 86_400_000) : null;
  const daysUntil = (iso: string | null | undefined) =>
    iso ? Math.ceil((Date.parse(iso) - nowMs) / 86_400_000) : null;

  const callRows = (callTouchResult.error ? [] : callTouchResult.data ?? []) as Array<{
    provider_id: string | null;
    outcome: string | null;
    occurred_at: string | null;
  }>;
  // Newest first from the query, so the first hit per provider is the last call.
  const lastCallByProvider = new Map<string, { outcome: string | null; occurred_at: string | null }>();
  for (const row of callRows) {
    if (!row.provider_id || lastCallByProvider.has(row.provider_id)) continue;
    lastCallByProvider.set(row.provider_id, { outcome: row.outcome, occurred_at: row.occurred_at });
  }

  let stalledUnattended = 0;
  let stalledUnreachable = 0;
  let stalledPaused = 0;
  let stalledAttended = 0;
  for (const row of adRows) {
    if (row.status === "ended") continue;
    if (row.photo_readiness_status !== "update_requested") continue;
    if (row.photo_update_submitted_at) continue;
    const asked = daysSince(row.photo_update_requested_at);
    if (asked === null || asked < ADBOOST_STALL_DAYS) continue;
    // Deliberately held is not neglected. TJ, 2026-09-17: "the page doesn't
    // show that their email is paused deliberately."
    if (row.provider_comms_paused_at) { stalledPaused += 1; continue; }
    const call = row.provider_id ? lastCallByProvider.get(row.provider_id) : undefined;
    const calledSinceAsk = Boolean(call?.occurred_at && row.photo_update_requested_at
      && Date.parse(call.occurred_at) >= Date.parse(row.photo_update_requested_at));
    if (!calledSinceAsk) { stalledUnattended += 1; continue; }
    if (call?.outcome === "bad_number" || call?.outcome === "no_answer") stalledUnreachable += 1;
    else stalledAttended += 1;
  }

  // Losing the only paying provider is the single largest movement away from
  // the twelve-paid target, and nothing could see it coming without a date.
  const paidRenewalDays = payingRows
    .map((row) => daysUntil(row.flight_end_date))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  const growthRows = growthResult.error ? [] : growthResult.data as GrowthSnapshot[];
  const latestGrowth = growthRows[0] ?? null;
  const priorGrowth = growthRows[1] ?? null;
  const supportAvailable = !supportResult.error && !supportCountResult.error && !supportUrgentResult.error;
  const supportRows = supportAvailable ? supportResult.data ?? [] : [];
  const mail = mailboxResult.error ? null : mailboxResult.data;
  if (questionHealthResult.error) throw new Error(`provider question health: ${questionHealthResult.error.message}`);
  const questionRows = (questionHealthResult.data ?? []) as Array<{
    status: string | null;
    answer: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  if (questionRows.length >= 50_000) throw new Error("provider question health exceeded the 50,000-row safety cap");
  const questionExcluded = (row: typeof questionRows[number]) =>
    row.status === "archived"
    || row.status === "rejected"
    || row.metadata?.provider_not_interested === true
    || row.metadata?.provider_no_contact === true;
  const questionNeedsEmail = (row: typeof questionRows[number]) => row.metadata?.needs_provider_email === true;
  const questionHasDeadEmail = (row: typeof questionRows[number]) => row.metadata?.email_dead === true;
  const questionAnswered = (row: typeof questionRows[number]) => Boolean(row.answer?.trim());
  const reachableQuestionRows = questionRows.filter((row) =>
    !questionExcluded(row)
    && !questionNeedsEmail(row)
    && !questionHasDeadEmail(row),
  );

  const facts: WarRoomFacts = {
    windowDays,
    providerPageViews: requireCount("provider page views", pageViewsResult),
    leads: requireCount("care inquiries", leadsResult),
    questions: requireCount("provider questions", questionsResult),
    questionsAnswered: requireCount("provider answers", answersResult),
    benefitsCompleted: requireCount("benefits completions", benefitsResult),
    providerClaims: requireCount("provider claims", claimsResult),
    activeProviders: activeProviderResult.count,
    payingProviders: new Set(payingRows.map((row) => row.provider_id)).size,
    mrr: payingRows.reduce((sum, row) => sum + (row.plan_value ?? 0), 0),
    adBoostOpen: adRows.filter((row) => ["pending_profile", "requested", "scheduled", "live"].includes(row.status)).length,
    adBoostEndedUnpaid: adRows.filter((row) => row.status === "ended" && !["active", "past_due"].includes(row.plan_status ?? "")).length,
    adBoostStalledUnattended: stalledUnattended,
    adBoostStalledUnreachable: stalledUnreachable,
    adBoostStalledPaused: stalledPaused,
    adBoostStalledAttended: stalledAttended,
    adBoostSoonestPaidRenewalDays: paidRenewalDays[0] ?? null,
    adBoostCallRecordAvailable: !callTouchResult.error,
    supportUnhandled: supportCountResult.count ?? 0,
    supportUrgent: supportUrgentResult.count ?? 0,
    latestGrowthAt: latestGrowth?.week_end ? `${latestGrowth.week_end}T23:59:59Z` : null,
    growthSessions: latestGrowth?.ga4?.overview?.sessions ?? null,
    growthInquiries: latestGrowth?.marketplace?.inquiries ?? null,
  };

  const priorResults = await Promise.all([
    db.from("provider_activity").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", priorFrom).lt("created_at", from).not("metadata->>session_id", "is", null).neq("metadata->>session_id", ""),
    db.from("provider_activity").select("id", { count: "exact", head: true }).eq("event_type", "lead_received").gte("created_at", priorFrom).lt("created_at", from),
    db.from("provider_question_asks").select("id", { count: "exact", head: true }).gte("created_at", priorFrom).lt("created_at", from),
    db.from("provider_questions").select("id", { count: "exact", head: true }).is("canonical_question_id", null).gte("created_at", priorFrom).lt("created_at", from).not("answer", "is", null).neq("answer", "").not("answered_at", "is", null).lt("answered_at", from),
    db.from("seeker_activity").select("id", { count: "exact", head: true }).eq("event_type", "benefits_completed").gte("created_at", priorFrom).lt("created_at", from),
    db.from("provider_activity").select("id", { count: "exact", head: true }).eq("event_type", "claim_completed").gte("created_at", priorFrom).lt("created_at", from),
  ]);
  const prior = priorResults.map((result) => requireCount("prior-period comparison", result));

  // Only the provider_activity-backed rows are guarded. The other three read
  // different tables with their own instrumentation dates; extending the guard
  // means a floor query each, and provider_activity is where the fabricated
  // number was actually observed.
  const guardFor = (result: { data: unknown }) => {
    const floor = (result.data as { created_at?: string } | null)?.created_at ?? null;
    if (!floor || priorFrom >= floor) return null;
    return `No comparison: the previous ${windowDays} days open before this metric was instrumented on ${floor.slice(0, 10)}.`;
  };
  const viewsGuard = guardFor(viewsFloorResult);
  const leadsGuard = guardFor(leadsFloorResult);
  const claimsGuard = guardFor(claimsFloorResult);

  const compare = (
    id: string,
    label: string,
    current: number,
    priorValue: number,
    href: string,
    incomparable: string | null = null,
  ) => ({
    id,
    label,
    current,
    prior: priorValue,
    // A percentage against a period that did not exist, or against zero, is a
    // number the reader will act on and should never have been shown.
    changePct: incomparable || priorValue === 0 ? null : ((current - priorValue) / priorValue) * 100,
    detail: incomparable ?? `${windowDays} days versus the previous ${windowDays} days, both ending ${until.slice(0, 10)}`,
    href,
  });
  const comparisons = [
    // Labelled as server page views, not organic reach. These rows are
    // bot-inclusive: ~42% of mid-2026 traffic was one AWS datacentre, and this
    // metric was read as an organic-traffic decline when it is partly bot decay
    // off a bot-inflated base. The canonical organic series is growth_page_metrics.
    compare("provider-views", "Provider page views (server events, bot-inclusive)", facts.providerPageViews, prior[0], "/admin/analytics", viewsGuard),
    compare("inquiries", "Care inquiries", facts.leads, prior[1], "/admin/connections?direction=inbound", leadsGuard),
    compare("questions", "Provider questions", facts.questions, prior[2], "/admin/questions"),
    compare("answers", "Questions answered", facts.questionsAnswered, prior[3], "/admin/questions"),
    compare("benefits", "Benefits completed", facts.benefitsCompleted, prior[4], "/admin/benefits"),
    compare("claims", "Provider claims", facts.providerClaims, prior[5], "/admin/verification", claimsGuard),
  ];

  const sources: WarRoomSource[] = [
    {
      key: "product",
      label: "Product activity",
      status: "live",
      detail: `Supabase events through ${ageLabel(generatedAt)}`,
      updatedAt: generatedAt,
      href: "/admin/activity",
    },
    {
      key: "growth",
      label: "Traffic & search",
      status: !latestGrowth
        ? "missing"
        : Date.now() - new Date(`${latestGrowth.week_end}T23:59:59Z`).getTime() > 10 * 86_400_000
          ? "stale"
          : "live",
      detail: latestGrowth
        ? `${latestGrowth.source_status.gsc === "available" ? "GA4 + Search Console" : "GA4 only"} · week ending ${latestGrowth.week_end}`
        : growthResult.error ? "Growth query failed" : "No live weekly snapshot",
      updatedAt: latestGrowth?.collected_at ?? null,
      href: "/admin/organic-growth",
    },
    {
      key: "revenue",
      label: "Revenue · Ad Boost",
      status: "live",
      detail: "Stripe-backed Ad Boost plans; other revenue streams are not consolidated yet",
      updatedAt: generatedAt,
      href: "/admin/ad-boost",
    },
    {
      key: "email",
      label: "Customer email",
      status: !supportAvailable || !mail
        ? "missing"
        : mail.sync_status === "connected" && mail.last_sync_at
          ? "live"
          : "stale",
      detail: !supportAvailable
        ? "Support inbox tables are unavailable"
        : !mail
          ? "No support mailbox connected"
          : `${mail.sync_status} · ${mail.full_sync_complete ? "history synced" : "backfill incomplete"}`,
      updatedAt: mail?.last_sync_at ?? null,
      href: "/admin/support-email",
    },
    {
      key: "slack",
      label: "Slack context",
      status: "missing",
      detail: "Olera Web can send alerts, but cannot read Slack history yet",
      updatedAt: null,
    },
  ];

  const customerVoice = [
    ...supportRows.filter((row) =>
      !["automated", "marketing"].includes(row.category)
      || ["needs_reply", "escalated"].includes(row.state),
    ).slice(0, 6).map((row) => ({
      id: `email:${row.id}`,
      title: redactContactDetails(row.subject || "Support email"),
      summary: truncate(redactContactDetails(row.agent_summary || row.snippet || "No summary available")),
      category: row.category,
      priority: row.priority,
      at: row.last_message_at,
      href: "/admin/support-email",
    })),
    ...(recentQuestionResult.error ? [] : (recentQuestionResult.data ?? []).map((row) => ({
      id: `question:${row.id}`,
      title: "Question from a care seeker",
      summary: truncate(redactContactDetails(row.question)),
      category: "provider_question",
      priority: row.status === "pending" ? "high" : "normal",
      at: row.created_at,
      href: "/admin/questions",
    }))),
    ...(recentInquiryResult.error ? [] : (recentInquiryResult.data ?? []).map((row) => ({
      id: `inquiry:${row.id}`,
      title: "Care inquiry",
      summary: truncate(redactContactDetails(String(row.message || "Inquiry submitted"))),
      category: "care_inquiry",
      priority: "high",
      at: row.created_at,
      href: "/admin/connections?direction=inbound",
    }))),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return {
    generatedAt,
    windowDays,
    recommendation: chooseWarRoomRecommendation(facts),
    metrics: buildWarRoomMetrics(facts),
    comparisons,
    growth: {
      latest: growthWeek(latestGrowth ?? undefined),
      prior: growthWeek(priorGrowth ?? undefined),
    },
    providerQuestionHealth: {
      submitted: questionRows.length,
      answered: questionRows.filter(questionAnswered).length,
      intentionallyExcluded: questionRows.filter(questionExcluded).length,
      needsEmail: questionRows.filter(questionNeedsEmail).length,
      deadEmail: questionRows.filter(questionHasDeadEmail).length,
      reachableEligible: reachableQuestionRows.length,
      reachableAnswered: reachableQuestionRows.filter(questionAnswered).length,
    },
    signals: buildWarRoomSignals(facts),
    customerVoice,
    sources,
    decisions: decisionResult.error ? [] : (decisionResult.data ?? []) as WarRoomDecision[],
    latestRun: null,
  };
}
