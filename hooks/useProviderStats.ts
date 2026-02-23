"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface MonthlyEntry {
  /** ISO month key, e.g. "2026-02" */
  month: string;
  /** Display label, e.g. "Feb" */
  label: string;
  count: number;
}

export interface ProviderStats {
  totalInquiries: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  expiredCount: number;
  /** Accepted / (accepted + declined + expired). null when no resolved connections. */
  responseRate: number | null;
  /** Last 6 calendar months, oldest first. */
  monthlyInquiries: MonthlyEntry[];
  loading: boolean;
}

const EMPTY: ProviderStats = {
  totalInquiries: 0,
  acceptedCount: 0,
  declinedCount: 0,
  pendingCount: 0,
  expiredCount: 0,
  responseRate: null,
  monthlyInquiries: [],
  loading: true,
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildLast6Months(): { month: string; label: string }[] {
  const result: { month: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ month, label: MONTH_LABELS[d.getMonth()] });
  }
  return result;
}

export function useProviderStats(profileId: string | undefined): ProviderStats {
  const [stats, setStats] = useState<ProviderStats>(EMPTY);

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) {
      setStats({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("connections")
          .select("id, type, status, created_at")
          .or(
            `to_profile_id.eq.${profileId},from_profile_id.eq.${profileId}`
          )
          .neq("type", "save")
          .neq("type", "dismiss");

        if (cancelled) return;
        if (error) {
          console.error("[olera] stats query error:", error.message);
          setStats({ ...EMPTY, loading: false });
          return;
        }

        const rows = data || [];

        // Count by status
        let accepted = 0;
        let declined = 0;
        let pending = 0;
        let expired = 0;

        for (const r of rows) {
          switch (r.status) {
            case "accepted":
              accepted++;
              break;
            case "declined":
              declined++;
              break;
            case "pending":
              pending++;
              break;
            case "expired":
            case "archived":
              expired++;
              break;
          }
        }

        // Response rate
        const resolved = accepted + declined + expired;
        const responseRate =
          resolved > 0 ? Math.round((accepted / resolved) * 100) : null;

        // Monthly buckets
        const months = buildLast6Months();
        const countMap = new Map<string, number>();
        for (const r of rows) {
          const key = r.created_at?.slice(0, 7); // "YYYY-MM"
          if (key) countMap.set(key, (countMap.get(key) || 0) + 1);
        }

        const monthlyInquiries: MonthlyEntry[] = months.map((m) => ({
          ...m,
          count: countMap.get(m.month) || 0,
        }));

        setStats({
          totalInquiries: rows.length,
          acceptedCount: accepted,
          declinedCount: declined,
          pendingCount: pending,
          expiredCount: expired,
          responseRate,
          monthlyInquiries,
          loading: false,
        });
      } catch (err) {
        console.error("[olera] stats fetch failed:", err);
        if (!cancelled) setStats({ ...EMPTY, loading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return stats;
}
