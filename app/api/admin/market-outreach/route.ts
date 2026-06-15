import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

const VIEW_EVENT = "market_diagnostic_viewed_no_leads";
const ACTION_EVENT = "market_outreach_status_updated";
const WORKED_STATUSES = new Set(["contacted", "responded", "referring"]);

type OutreachStatus = "to_contact" | "contacted" | "responded" | "referring" | "dismissed";
type QueueStage = "not_started" | "started" | "momentum" | "stale";

type MarketActivityRow = {
  provider_id: string | null;
  profile_id: string | null;
  event_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type OutreachRow = {
  provider_id: string;
  target_id: string;
  target_name: string | null;
  status: OutreachStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type BusinessProfileRow = {
  id: string;
  slug: string | null;
  source_provider_id: string | null;
  display_name: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  type: string | null;
  category: string | null;
  claim_state: string | null;
};

type ProviderAccumulator = {
  key: string;
  provider_id: string | null;
  profile_id: string | null;
  directory_id: string;
  name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  claim_state: string | null;
  viewed_at: string | null;
  last_action_at: string | null;
  status_counts: Record<OutreachStatus, number>;
  targets: Array<{
    id: string;
    name: string;
    status: OutreachStatus;
    updated_at: string;
  }>;
};

function latest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function makeEmptyCounts(): Record<OutreachStatus, number> {
  return {
    to_contact: 0,
    contacted: 0,
    responded: 0,
    referring: 0,
    dismissed: 0,
  };
}

function makeAccumulator(key: string): ProviderAccumulator {
  return {
    key,
    provider_id: null,
    profile_id: null,
    directory_id: key,
    name: key,
    email: null,
    city: null,
    state: null,
    category: null,
    claim_state: null,
    viewed_at: null,
    last_action_at: null,
    status_counts: makeEmptyCounts(),
    targets: [],
  };
}

function deriveStage(provider: ProviderAccumulator): QueueStage {
  const worked =
    provider.status_counts.contacted +
    provider.status_counts.responded +
    provider.status_counts.referring;

  if (provider.status_counts.responded > 0 || provider.status_counts.referring > 0) {
    return "momentum";
  }

  const lastTouch = provider.last_action_at ?? provider.viewed_at;
  const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (lastTouch && new Date(lastTouch).getTime() < staleCutoff && worked < 3) {
    return "stale";
  }

  if (worked > 0) return "started";
  return "not_started";
}

function stagePriority(stage: QueueStage): number {
  switch (stage) {
    case "stale":
      return 0;
    case "not_started":
      return 1;
    case "started":
      return 2;
    case "momentum":
      return 3;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: outreachRows, error: outreachError },
      { data: activityRows, error: activityError },
    ] = await Promise.all([
      db
        .from("market_referral_outreach")
        .select("provider_id, target_id, target_name, status, note, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10000),
      db
        .from("provider_activity")
        .select("provider_id, profile_id, event_type, metadata, created_at")
        .in("event_type", [VIEW_EVENT, ACTION_EVENT])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000),
    ]);

    if (outreachError) {
      console.error("Admin market outreach rows error:", outreachError);
      return NextResponse.json({ error: "Failed to fetch outreach rows" }, { status: 500 });
    }
    if (activityError) {
      console.error("Admin market outreach activity error:", activityError);
      return NextResponse.json({ error: "Failed to fetch outreach activity" }, { status: 500 });
    }

    const outreach = (outreachRows ?? []) as OutreachRow[];
    const activity = (activityRows ?? []) as MarketActivityRow[];

    const profileIds = new Set<string>();
    const providerIds = new Set<string>();
    for (const row of outreach) profileIds.add(row.provider_id);
    for (const row of activity) {
      if (row.profile_id) profileIds.add(row.profile_id);
      if (row.provider_id) providerIds.add(row.provider_id);
    }

    const profileById = new Map<string, BusinessProfileRow>();
    const profileBySlug = new Map<string, BusinessProfileRow>();
    const profileBySourceId = new Map<string, BusinessProfileRow>();

    const idList = Array.from(profileIds);
    if (idList.length > 0) {
      const { data: profilesById, error } = await db
        .from("business_profiles")
        .select("id, slug, source_provider_id, display_name, email, city, state, type, category, claim_state")
        .in("id", idList);

      if (error) {
        console.error("Admin market outreach profile id hydration error:", error);
      }

      for (const profile of (profilesById ?? []) as BusinessProfileRow[]) {
        profileById.set(profile.id, profile);
        if (profile.slug) profileBySlug.set(profile.slug, profile);
        if (profile.source_provider_id) profileBySourceId.set(profile.source_provider_id, profile);
      }
    }

    const unresolvedProviderIds = Array.from(providerIds).filter(
      (id) => !profileBySlug.has(id) && !profileBySourceId.has(id)
    );

    if (unresolvedProviderIds.length > 0) {
      const [{ data: profilesBySlug }, { data: profilesBySourceId }] = await Promise.all([
        db
          .from("business_profiles")
          .select("id, slug, source_provider_id, display_name, email, city, state, type, category, claim_state")
          .in("slug", unresolvedProviderIds),
        db
          .from("business_profiles")
          .select("id, slug, source_provider_id, display_name, email, city, state, type, category, claim_state")
          .in("source_provider_id", unresolvedProviderIds),
      ]);

      for (const profile of ([...(profilesBySlug ?? []), ...(profilesBySourceId ?? [])] as BusinessProfileRow[])) {
        profileById.set(profile.id, profile);
        if (profile.slug) profileBySlug.set(profile.slug, profile);
        if (profile.source_provider_id) profileBySourceId.set(profile.source_provider_id, profile);
      }
    }

    const providers = new Map<string, ProviderAccumulator>();

    function resolveProfile(row: { provider_id?: string | null; profile_id?: string | null }) {
      if (row.profile_id && profileById.has(row.profile_id)) return profileById.get(row.profile_id) ?? null;
      if (row.provider_id && profileBySlug.has(row.provider_id)) return profileBySlug.get(row.provider_id) ?? null;
      if (row.provider_id && profileBySourceId.has(row.provider_id)) return profileBySourceId.get(row.provider_id) ?? null;
      if (row.provider_id && profileById.has(row.provider_id)) return profileById.get(row.provider_id) ?? null;
      return null;
    }

    function getProvider(key: string) {
      const existing = providers.get(key);
      if (existing) return existing;
      const next = makeAccumulator(key);
      providers.set(key, next);
      return next;
    }

    function applyProfile(acc: ProviderAccumulator, profile: BusinessProfileRow | null) {
      if (!profile) return;
      acc.profile_id = profile.id;
      acc.directory_id = profile.source_provider_id ?? profile.slug ?? profile.id;
      acc.name = profile.display_name ?? acc.name;
      acc.email = profile.email ?? acc.email;
      acc.city = profile.city ?? acc.city;
      acc.state = profile.state ?? acc.state;
      acc.category = profile.category ?? acc.category;
      acc.claim_state = profile.claim_state ?? acc.claim_state;
    }

    for (const row of activity) {
      const profile = resolveProfile(row);
      const key = profile?.id ?? row.profile_id ?? row.provider_id;
      if (!key) continue;

      const acc = getProvider(key);
      acc.provider_id = row.provider_id ?? acc.provider_id;
      applyProfile(acc, profile);

      const metadata = row.metadata ?? {};
      acc.name = asString(metadata.provider_name) ?? acc.name;
      acc.city = asString(metadata.city) ?? acc.city;
      acc.state = asString(metadata.state) ?? acc.state;
      acc.email = asString(metadata.email) ?? acc.email;

      if (row.event_type === VIEW_EVENT) {
        acc.viewed_at = latest(acc.viewed_at, row.created_at);
      } else if (row.event_type === ACTION_EVENT) {
        acc.last_action_at = latest(acc.last_action_at, row.created_at);
      }
    }

    for (const row of outreach) {
      const profile = profileById.get(row.provider_id) ?? null;
      const acc = getProvider(row.provider_id);
      applyProfile(acc, profile);
      acc.profile_id = row.provider_id;
      acc.status_counts[row.status] = (acc.status_counts[row.status] ?? 0) + 1;
      if (WORKED_STATUSES.has(row.status)) {
        acc.last_action_at = latest(acc.last_action_at, row.updated_at);
      }
      acc.targets.push({
        id: row.target_id,
        name: row.target_name ?? row.target_id,
        status: row.status,
        updated_at: row.updated_at,
      });
    }

    const queue = Array.from(providers.values())
      .map((provider) => {
        provider.targets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const worked =
          provider.status_counts.contacted +
          provider.status_counts.responded +
          provider.status_counts.referring;
        const stage = deriveStage(provider);

        return {
          key: provider.key,
          provider_id: provider.provider_id,
          profile_id: provider.profile_id,
          directory_id: provider.directory_id,
          name: provider.name,
          email: provider.email,
          city: provider.city,
          state: provider.state,
          category: provider.category,
          claim_state: provider.claim_state,
          stage,
          viewed_at: provider.viewed_at,
          last_action_at: provider.last_action_at,
          total_targets: provider.targets.length,
          worked_targets: worked,
          status_counts: provider.status_counts,
          recent_targets: provider.targets.slice(0, 3),
        };
      })
      .sort((a, b) => {
        const priority = stagePriority(a.stage) - stagePriority(b.stage);
        if (priority !== 0) return priority;
        const aTouch = new Date(a.last_action_at ?? a.viewed_at ?? 0).getTime();
        const bTouch = new Date(b.last_action_at ?? b.viewed_at ?? 0).getTime();
        return bTouch - aTouch;
      });

    return NextResponse.json({
      providers: queue,
      totals: {
        viewed: queue.filter((p) => !!p.viewed_at).length,
        not_started: queue.filter((p) => p.stage === "not_started").length,
        started: queue.filter((p) => p.stage === "started").length,
        momentum: queue.filter((p) => p.stage === "momentum").length,
        stale: queue.filter((p) => p.stage === "stale").length,
        worked: queue.filter((p) => p.worked_targets > 0).length,
        referring: queue.filter((p) => p.status_counts.referring > 0).length,
      },
    });
  } catch (err) {
    console.error("Admin market outreach queue error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
