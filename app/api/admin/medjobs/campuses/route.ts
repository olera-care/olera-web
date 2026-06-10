import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

/**
 * GET /api/admin/medjobs/campuses
 *
 * Returns every campus with derived operational state. Powers the
 * Campuses tab — the single place where campus research lives in v9.0.
 *
 * Each row carries:
 *   - stage: 'provider_prospecting' | 'stakeholder_prospecting' | 'active'
 *   - research_complete: boolean (controls 'active' transition)
 *   - client_count: providers in catchment that are clients (in pilot
 *     or subscribed) — gates the Stage 1 → Stage 2 unlock
 *   - stakeholder_count: stakeholders in research stage for this campus
 *   - last_added_at: most recent stakeholder created_at, for sort
 *
 * Stage semantics (monotonic — once unlocked, doesn't revert):
 *   provider_prospecting:    no clients in catchment yet
 *   stakeholder_prospecting: ≥1 client; research_complete=false
 *   active:                  research_complete=true
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    const [
      { data: campuses },
      { data: providers },
      { data: stakeholders },
      { data: pendingSiteTasks },
    ] = await Promise.all([
      db
        .from("student_outreach_campuses")
        .select("id, slug, name, state, city, research_complete, is_active, created_at, viewed_at, partner_research")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      db
        .from("business_profiles")
        .select("city, state, metadata")
        .in("type", ["organization", "caregiver"]),
      db
        .from("student_outreach")
        .select("campus_id, status, created_at"),
      // v9.0 Phase 7 Commit H: pending site_tasks drive the
      // "Active with pending tasks" priority tier.
      // Commit O: also pull task created_at so the row's `unread`
      // flag can be computed against the campus's viewed_at.
      db
        .from("site_tasks")
        .select("campus_id, created_at")
        .eq("status", "pending"),
    ]);

    const sitesWithPendingTasks = new Set<string>();
    const latestPendingTaskByCampus = new Map<string, string>();
    for (const t of (pendingSiteTasks ?? []) as Array<{
      campus_id: string;
      created_at: string;
    }>) {
      sitesWithPendingTasks.add(t.campus_id);
      const cur = latestPendingTaskByCampus.get(t.campus_id);
      if (!cur || t.created_at > cur) {
        latestPendingTaskByCampus.set(t.campus_id, t.created_at);
      }
    }

    type ProviderLite = {
      city: string | null;
      state: string | null;
      metadata: Record<string, unknown> | null;
    };
    const providerIndex = new Map<string, ProviderLite[]>();
    for (const p of (providers ?? []) as ProviderLite[]) {
      if (!p.city || !p.state) continue;
      const key = `${p.city.toLowerCase()}|${p.state}`;
      if (!providerIndex.has(key)) providerIndex.set(key, []);
      providerIndex.get(key)!.push(p);
    }

    const PILOT_MS = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const isClientMeta = (m: Record<string, unknown> | null): boolean => {
      if (!m) return false;
      if (m.medjobs_subscription_active === true) return true;
      const accepted = m.interview_terms_accepted_at;
      if (typeof accepted !== "string") return false;
      const t = new Date(accepted).getTime();
      return !isNaN(t) && now - t < PILOT_MS;
    };

    const RESEARCH_STAGE = new Set(["prospect", "researched"]);
    const stakeholderCountByCampus = new Map<string, number>();
    const lastAddedByCampus = new Map<string, string>();
    for (const s of (stakeholders ?? []) as Array<{
      campus_id: string;
      status: string;
      created_at: string;
    }>) {
      if (RESEARCH_STAGE.has(s.status)) {
        stakeholderCountByCampus.set(
          s.campus_id,
          (stakeholderCountByCampus.get(s.campus_id) ?? 0) + 1,
        );
      }
      const cur = lastAddedByCampus.get(s.campus_id);
      if (!cur || s.created_at > cur) lastAddedByCampus.set(s.campus_id, s.created_at);
    }

    const rows = ((campuses ?? []) as Array<{
      id: string;
      slug: string;
      name: string;
      state: string | null;
      city: string | null;
      research_complete: boolean;
      is_active: boolean;
      created_at: string | null;
      viewed_at: string | null;
    }>).map((c) => {
      const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
      let clientCount = 0;
      if (uni) {
        for (const cc of uni.catchment) {
          const key = `${cc.city.toLowerCase()}|${cc.state}`;
          for (const p of providerIndex.get(key) ?? []) {
            if (isClientMeta(p.metadata)) clientCount += 1;
          }
        }
      }
      const stakeholderCount = stakeholderCountByCampus.get(c.id) ?? 0;
      const lastAddedAt = lastAddedByCampus.get(c.id) ?? null;

      const stage: "provider_prospecting" | "stakeholder_prospecting" | "active" =
        c.research_complete
          ? "active"
          : clientCount > 0
            ? "stakeholder_prospecting"
            : "provider_prospecting";

      // v9.0 Phase 7 Commit H: queue_age_days = days since the
      // territory was activated. Used by the SiteCard footnote on
      // idle items so stale rows are visually obvious.
      const queueAgeDays =
        c.created_at != null
          ? Math.max(0, Math.floor((now - new Date(c.created_at).getTime()) / 86400_000))
          : null;
      const hasPendingTask = sitesWithPendingTasks.has(c.id);
      // v9.0 Phase 7 Commit O: unread = there's a pending site_task
      // created after admin's last view (or admin never viewed).
      // Same shape as the unread model on student_outreach + business_profiles.
      const latestTaskCreated = latestPendingTaskByCampus.get(c.id) ?? null;
      const unread =
        latestTaskCreated != null &&
        (!c.viewed_at || latestTaskCreated > c.viewed_at);

      // Flatten the persisted AI source maps (all subtypes) into one deduped
      // list so the Site card can surface "Research sources" for quick access.
      const partnerSources: { title: string; url: string }[] = [];
      {
        const byType = (
          (c as { partner_research?: { sources?: Record<string, { title?: string; url?: string }[]> } })
            .partner_research?.sources ?? {}
        ) as Record<string, { title?: string; url?: string }[]>;
        const seen = new Set<string>();
        for (const list of Object.values(byType)) {
          for (const s of list ?? []) {
            if (s?.url && !seen.has(s.url)) {
              seen.add(s.url);
              partnerSources.push({ title: s.title ?? s.url, url: s.url });
            }
          }
        }
      }

      // Per-category prospecting completion (partner_research.audit), so the
      // Site card mirrors the In-Basket research card's per-category status.
      const audit = (
        (c as { partner_research?: { audit?: Record<string, { complete_at?: string }> } })
          .partner_research?.audit ?? {}
      ) as Record<string, { complete_at?: string }>;
      const partnerAudit = {
        advisor: Boolean(audit.advisor?.complete_at),
        student_org: Boolean(audit.student_org?.complete_at),
        dept_head: Boolean(audit.dept_head?.complete_at),
      };

      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        state: c.state,
        research_complete: c.research_complete,
        stage,
        client_count: clientCount,
        stakeholder_count: stakeholderCount,
        last_added_at: lastAddedAt,
        // v9.0 Phase 7 Commit H: throughput-queue fields.
        has_pending_task: hasPendingTask,
        queue_age_days: queueAgeDays,
        // v9.0 Phase 7 Commit O: unified unread flag.
        unread,
        // Persisted AI research source links (all subtypes, deduped).
        partner_sources: partnerSources,
        // Per-category audit completion (Advising / Orgs / Dept heads).
        partner_audit: partnerAudit,
      };
    });

    // v9.0 Phase 7 Commit H: throughput-queue priority sort. Default
    // ordering (no manual toggle) is what most directly serves
    // operational triage:
    //   0  Stage 2 with no stakeholders     (research needed — most urgent)
    //   1  Stage 2 with research in flight
    //   2  Active w/ pending site_tasks    (need admin action)
    //   3  Active idle                      (working as intended)
    //   4  Stage 1 (provider-prospecting)   (no clients yet)
    // Within a tier, oldest-in-queue first so stale items rise.
    const stagePriority: Record<string, number> = {
      stakeholder_prospecting_empty: 0,
      stakeholder_prospecting_progress: 1,
      active_with_tasks: 2,
      active_idle: 3,
      provider_prospecting: 4,
    };
    const tierKey = (r: (typeof rows)[number]): string => {
      if (r.stage === "stakeholder_prospecting" && r.stakeholder_count === 0) {
        return "stakeholder_prospecting_empty";
      }
      if (r.stage === "stakeholder_prospecting") {
        return "stakeholder_prospecting_progress";
      }
      if (r.stage === "active") {
        return r.has_pending_task ? "active_with_tasks" : "active_idle";
      }
      return r.stage; // provider_prospecting
    };
    rows.sort((a, b) => {
      const tierDelta =
        (stagePriority[tierKey(a)] ?? 99) - (stagePriority[tierKey(b)] ?? 99);
      if (tierDelta !== 0) return tierDelta;
      // Within a tier: oldest queue age first (stale items rise).
      const ageDelta = (b.queue_age_days ?? 0) - (a.queue_age_days ?? 0);
      if (ageDelta !== 0) return ageDelta;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/campuses] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
