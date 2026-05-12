#!/usr/bin/env node

/**
 * Pull engagement metrics for /product-led-growth.
 *
 * Mirrors the semantics of app/api/admin/analytics/summary/route.ts so the
 * slash command never disagrees with what /admin/analytics shows. Outputs
 * a single JSON object to stdout. /product-led-growth pipes this into its
 * Notion report and Running Thread entry.
 *
 * Usage:
 *   node scripts/growth-pull.js              # Last 24h vs prior 24h (daily mode)
 *   node scripts/growth-pull.js --days 7     # Last 7d vs prior 7d (weekly mode)
 *   node scripts/growth-pull.js --days 30    # Last 30d vs prior 30d (monthly mode)
 *
 * No file system writes. Stdout-only by design -- pipe to a file if you want
 * to keep a snapshot.
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

function parseDays() {
  const idx = process.argv.findIndex((a) => a === "--days" || a.startsWith("--days="));
  if (idx === -1) return 1;
  const arg = process.argv[idx];
  const raw = arg.includes("=") ? arg.split("=")[1] : process.argv[idx + 1];
  const n = parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) {
    console.error("--days must be a positive integer");
    process.exit(1);
  }
  return n;
}

const days = parseDays();

const PROVIDER_RAW_EVENT_TYPES = [
  "page_view",
  "search_click",
  "benefits_started",
  "lead_received",
  "review_received",
  "question_received",
];
const PROVIDER_DISTINCT_EVENT_TYPES = [
  "one_click_access",
  "claim_completed",
  "question_responded",
  "analytics_teaser_cta_clicked",
];
const SEEKER_RAW_EVENT_TYPES = ["benefits_completed", "matches_activated"];

async function fetchWindow(fromIso, toIso) {
  const [providerRes, seekerRes, distinctRes, openersRes, savesRes, familyProfilesRes] =
    await Promise.all([
      db
        .from("provider_activity")
        .select("event_type, metadata")
        .in("event_type", PROVIDER_RAW_EVENT_TYPES)
        .gte("created_at", fromIso)
        .lt("created_at", toIso)
        .limit(50000),
      db
        .from("seeker_activity")
        .select("event_type")
        .in("event_type", SEEKER_RAW_EVENT_TYPES)
        .gte("created_at", fromIso)
        .lt("created_at", toIso)
        .limit(50000),
      db
        .from("provider_activity")
        .select("provider_id, event_type, metadata")
        .in("event_type", PROVIDER_DISTINCT_EVENT_TYPES)
        .gte("created_at", fromIso)
        .lt("created_at", toIso)
        .limit(50000),
      db
        .from("email_log")
        .select("provider_id")
        .eq("email_type", "question_received")
        .eq("recipient_type", "provider")
        .not("first_opened_at", "is", null)
        .gte("first_opened_at", fromIso)
        .lt("first_opened_at", toIso)
        .limit(50000),
      // Relational layer (Strategy Brief: the writes we want families making).
      // connections.type='save' rows created in-window; business_profiles
      // type='family' rows created in-window (save = profile, post the 5/1 fix).
      db
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("type", "save")
        .gte("created_at", fromIso)
        .lt("created_at", toIso),
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .gte("created_at", fromIso)
        .lt("created_at", toIso),
    ]);

  for (const r of [providerRes, seekerRes, distinctRes, openersRes, savesRes, familyProfilesRes]) {
    if (r.error) throw new Error(`window query failed: ${r.error.message}`);
  }

  const counts = Object.fromEntries(
    [...PROVIDER_RAW_EVENT_TYPES, ...SEEKER_RAW_EVENT_TYPES].map((k) => [k, 0]),
  );
  const sessions = new Set();
  for (const r of providerRes.data ?? []) {
    counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;
    if (r.event_type === "page_view") {
      const sid = r.metadata?.session_id;
      if (typeof sid === "string" && sid) sessions.add(sid);
    }
  }
  for (const r of seekerRes.data ?? []) {
    counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;
  }

  const sets = {
    qa_signins: new Set(),
    page_claims: new Set(),
    question_answerers: new Set(),
    lead_engagers: new Set(),
    teaser_clickers: new Set(),
  };
  for (const r of distinctRes.data ?? []) {
    if (!r.provider_id) continue;
    const pid = r.provider_id;
    if (r.event_type === "one_click_access") {
      const action = r.metadata?.action;
      if (action === "question") sets.qa_signins.add(pid);
      else if (action === "lead") sets.lead_engagers.add(pid);
    } else if (r.event_type === "claim_completed") {
      if (r.metadata?.source === "page") sets.page_claims.add(pid);
    } else if (r.event_type === "question_responded") {
      sets.question_answerers.add(pid);
    } else if (r.event_type === "analytics_teaser_cta_clicked") {
      sets.teaser_clickers.add(pid);
    }
  }

  const openers = new Set();
  for (const r of openersRes.data ?? []) {
    if (r.provider_id) openers.add(r.provider_id);
  }

  return {
    counts,
    unique_sessions_page_view: sessions.size,
    provider_distinct_counts: {
      qa_signins: sets.qa_signins.size,
      page_claims: sets.page_claims.size,
      question_answerers: sets.question_answerers.size,
      lead_engagers: sets.lead_engagers.size,
      teaser_clickers: sets.teaser_clickers.size,
      qa_email_openers: openers.size,
    },
    seeker_relational: {
      saves: savesRes.count ?? 0,
      family_profiles_created: familyProfilesRes.count ?? 0,
    },
  };
}

async function fetchTopProviders(sevenDaysAgoIso) {
  const { data, error } = await db
    .from("provider_activity")
    .select("provider_id, created_at, metadata")
    .eq("event_type", "page_view")
    .gte("created_at", sevenDaysAgoIso)
    .limit(50000);
  if (error) throw new Error(`top providers query failed: ${error.message}`);

  const byProvider = new Map();
  for (const r of data ?? []) {
    const sid = r.metadata?.session_id;
    if (typeof sid !== "string" || !sid) continue;
    const pid = String(r.provider_id);
    const entry = byProvider.get(pid) ?? {
      provider_id: pid,
      raw_views_7d: 0,
      sessions: new Set(),
      last_seen: r.created_at,
    };
    entry.raw_views_7d += 1;
    entry.sessions.add(sid);
    if (r.created_at > entry.last_seen) entry.last_seen = r.created_at;
    byProvider.set(pid, entry);
  }
  const top = [...byProvider.values()]
    .sort((a, b) => b.raw_views_7d - a.raw_views_7d)
    .slice(0, 10)
    .map((p) => ({
      provider_id: p.provider_id,
      raw_views_7d: p.raw_views_7d,
      unique_sessions_7d: p.sessions.size,
      last_seen: p.last_seen,
    }));

  const slugs = top.map((p) => p.provider_id);
  if (slugs.length > 0) {
    const { data: nameRows } = await db
      .from("olera-providers")
      .select("slug, provider_name")
      .in("slug", slugs);
    const nameBySlug = new Map();
    for (const n of nameRows ?? []) {
      if (n.slug && n.provider_name) nameBySlug.set(n.slug, n.provider_name);
    }
    for (const p of top) {
      p.provider_name = nameBySlug.get(p.provider_id) ?? null;
    }
  }
  return top;
}

async function fetchActions(now) {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const [disputesRes, needsEmailRes, justStaleRes, staleBacklogRes] = await Promise.all([
    db
      .from("disputes")
      .select("id, provider_name, reason, created_at", { count: "exact" })
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("provider_questions")
      .select("id", { count: "exact", head: true })
      .contains("metadata", { needs_provider_email: true })
      .neq("status", "archived")
      .neq("status", "rejected"),
    db
      .from("provider_questions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fortyEightHoursAgo)
      .lt("created_at", oneDayAgo)
      .is("answered_at", null)
      .neq("status", "archived")
      .neq("status", "rejected"),
    db
      .from("provider_questions")
      .select("id", { count: "exact", head: true })
      .lt("created_at", fortyEightHoursAgo)
      .is("answered_at", null)
      .neq("status", "archived")
      .neq("status", "rejected"),
  ]);

  return {
    new_disputes_24h: disputesRes.count ?? 0,
    dispute_rows: disputesRes.data ?? [],
    needs_provider_email_backlog: needsEmailRes.count ?? 0,
    just_hit_48h_unanswered: justStaleRes.count ?? 0,
    total_unanswered_backlog: staleBacklogRes.count ?? 0,
  };
}

async function fetchMarketplaceHealth() {
  // Provider count is the denominator for marketplace-health ratios.
  // Family-profile count is the seeker-side base we're trying to grow
  // (Running Thread Open Question #2). business_profiles type='family' is
  // the table: rows are created by the save flow, the benefits intake, and
  // explicit signup. "Public" (the "let providers find me" toggle) is a
  // metadata flag we don't break out yet -- the total is the meaningful
  // denominator for now.
  const [providersRes, familyProfilesRes] = await Promise.all([
    db.from("olera-providers").select("slug", { count: "exact", head: true }),
    db.from("business_profiles").select("id", { count: "exact", head: true }).eq("type", "family"),
  ]);
  return {
    total_providers: providersRes.count ?? null,
    family_profiles_total: familyProfilesRes.count ?? null,
    // Kept for back-compat with prior report consumers; not yet broken out.
    public_seeker_profiles: null,
  };
}

async function main() {
  const now = new Date();
  const windowMs = days * 24 * 60 * 60 * 1000;
  const currentFrom = new Date(now.getTime() - windowMs).toISOString();
  const currentTo = now.toISOString();
  const priorFrom = new Date(now.getTime() - 2 * windowMs).toISOString();
  const priorTo = currentFrom;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [current, prior, topProviders, actions, marketplace] = await Promise.all([
    fetchWindow(currentFrom, currentTo),
    fetchWindow(priorFrom, priorTo),
    fetchTopProviders(sevenDaysAgo),
    fetchActions(now),
    fetchMarketplaceHealth(),
  ]);

  const result = {
    generated_at: now.toISOString(),
    window: {
      days,
      current: { from: currentFrom, to: currentTo },
      prior: { from: priorFrom, to: priorTo },
    },
    current,
    prior,
    top_providers_7d: topProviders,
    actions,
    marketplace_health: marketplace,
  };

  process.stdout.write(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
