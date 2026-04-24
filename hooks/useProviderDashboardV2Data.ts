"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shape returned by GET /api/provider/dashboard. See that route for the
 * authoritative comments on each field.
 */
export interface ProviderDashboardV2Data {
  profile: {
    id: string;
    slug: string;
    source_provider_id: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    category: string | null;
  };
  window: "7d" | "30d" | "90d";
  greeting: {
    unansweredQuestions: number;
    fiveMostRecentUnanswered: Array<{
      id: string;
      question: string;
      askerName: string | null;
      createdAt: string;
    }>;
    viewsThisPeriod: number;
    viewsPriorPeriod: number;
    deltaPct: number | null;
    newLeadsThisPeriod: number;
  };
  reviews: {
    count: number;
    avgRating: number | null;
    oleraCount: number;
    googleCount: number;
    googleRating: number | null;
  };
  responseRate: {
    totalQuestions: number;
    answeredCount: number;
    windowDays: number;
  };
  recentActivity: Array<{
    id: string;
    kind: "question" | "question_answered" | "lead" | "review" | "page_view";
    timestamp: string;
    title: string;
    detail?: string;
    actionHref?: string;
    actorName?: string;
  }>;
  views: {
    thisPeriod: number;
    priorPeriod: number;
    deltaPct: number | null;
    lifetime: number;
  };
  cohort: {
    scope: "near" | "state" | null;
    demand: number;
    radiusMiles?: number;
  };
}

/**
 * Fetches the unified provider dashboard payload. Caller should have an
 * authenticated session. Failures are silent (data stays null); the page
 * can fall back to the old dashboard layout.
 *
 * `enabled` gates the fetch — pass false when the feature flag is off so
 * providers on the legacy dashboard don't pay for a wasted round-trip.
 */
export function useProviderDashboardV2Data(
  window: "7d" | "30d" | "90d" = "30d",
  enabled = true,
) {
  const [data, setData] = useState<ProviderDashboardV2Data | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/provider/dashboard?window=${window}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Not signed in" : "Failed to load");
        return;
      }
      const json = (await res.json()) as ProviderDashboardV2Data;
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [window, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
