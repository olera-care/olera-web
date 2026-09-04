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
  const from = new Date(Date.now() - windowDays * 86_400_000).toISOString();
  const priorFrom = new Date(Date.now() - windowDays * 2 * 86_400_000).toISOString();

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
  ] = await Promise.all([
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "page_view").gte("created_at", from)
      .not("metadata->>session_id", "is", null).neq("metadata->>session_id", ""),
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "lead_received").gte("created_at", from),
    db.from("provider_question_asks").select("id", { count: "exact", head: true })
      .gte("created_at", from),
    db.from("provider_questions").select("id", { count: "exact", head: true })
      .is("canonical_question_id", null)
      .gte("created_at", from)
      .not("answer", "is", null).neq("answer", "")
      .not("answered_at", "is", null).lt("answered_at", generatedAt),
    db.from("seeker_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "benefits_completed").gte("created_at", from),
    db.from("provider_activity").select("id", { count: "exact", head: true })
      .eq("event_type", "claim_completed").gte("created_at", from),
    fetchMeaningfulProviderActivity(db, from, generatedAt),
    db.from("ad_campaign_requests")
      .select("provider_id, status, plan_status, plan_value, deleted_at")
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
  const compare = (id: string, label: string, current: number, priorValue: number, href: string) => ({
    id,
    label,
    current,
    prior: priorValue,
    changePct: priorValue === 0 ? null : ((current - priorValue) / priorValue) * 100,
    detail: `${windowDays} days versus the previous ${windowDays} days`,
    href,
  });
  const comparisons = [
    compare("provider-views", "Provider page views", facts.providerPageViews, prior[0], "/admin/analytics"),
    compare("inquiries", "Care inquiries", facts.leads, prior[1], "/admin/connections?direction=inbound"),
    compare("questions", "Provider questions", facts.questions, prior[2], "/admin/questions"),
    compare("answers", "Questions answered", facts.questionsAnswered, prior[3], "/admin/questions"),
    compare("benefits", "Benefits completed", facts.benefitsCompleted, prior[4], "/admin/benefits"),
    compare("claims", "Provider claims", facts.providerClaims, prior[5], "/admin/verification"),
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
