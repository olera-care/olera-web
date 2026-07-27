import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/benefits/families?days=30
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
  signals: {
    emailOpened: boolean;
    emailClicked: boolean;
    resultsViewed: boolean;
    enriched: boolean;
  };
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

    const daysParam = Number(request.nextUrl.searchParams.get("days"));
    const days = (WINDOW_DAYS as readonly number[]).includes(daysParam) ? daysParam : 30;
    const since = new Date(Date.now() - days * 86400e3).toISOString();
    const prevSince = new Date(Date.now() - days * 2 * 86400e3).toISOString();

    const db = getServiceClient();

    const [{ data: events, error: eventsErr }, { count: prevCount }] = await Promise.all([
      db
        .from("seeker_activity")
        .select("profile_id, created_at, metadata")
        .eq("event_type", "benefits_completed")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("seeker_activity")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "benefits_completed")
        .gte("created_at", prevSince)
        .lt("created_at", since),
    ]);
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
      { display_name: string | null; email: string | null; state: string | null; metadata: Record<string, unknown> }
    >();
    const viewedProfiles = new Set<string>();
    for (const ids of chunk(profileIds, 100)) {
      const [{ data: profs }, { data: tokens }] = await Promise.all([
        db.from("business_profiles").select("id, display_name, email, state, metadata").in("id", ids),
        db.from("benefits_results_tokens").select("profile_id, last_viewed_at").in("profile_id", ids),
      ]);
      for (const p of profs ?? []) profiles.set(p.id, p);
      for (const t of tokens ?? []) {
        if (t.last_viewed_at) viewedProfiles.add(t.profile_id);
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

    for (const [profileId, ev] of latestByProfile) {
      const meta = ev.metadata as Record<string, unknown>;
      const profile = profiles.get(profileId);
      const pMeta = (profile?.metadata ?? {}) as Record<string, unknown>;

      const relationship = (pMeta.relationship_to_recipient as string) || (pMeta.relationship as string) || null;
      const timeline = (pMeta.timeline as string) || null;
      const payments = Array.isArray(pMeta.payment_methods) ? (pMeta.payment_methods as string[]) : null;
      const enriched = Boolean(relationship || timeline || (payments && payments.length));

      const email = profile?.email ?? null;
      const signals = {
        emailOpened: email ? opened.has(email) : false,
        emailClicked: email ? clicked.has(email) : false,
        resultsViewed: viewedProfiles.has(profileId),
        enriched,
      };
      if (signals.emailOpened || signals.emailClicked || signals.resultsViewed) engaged++;
      if (enriched) enrichedCount++;

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

      families.push({
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
        signals,
      });
    }

    return NextResponse.json({
      days,
      summary: {
        completions: (events ?? []).length,
        uniqueFamilies: families.length,
        prevCompletions: prevCount ?? 0,
        engaged,
        enriched: enrichedCount,
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
