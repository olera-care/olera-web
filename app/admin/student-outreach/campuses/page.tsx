"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Campus } from "@/lib/student-outreach/types";

/**
 * Campuses page — list of universities currently in the Student Outreach
 * funnel. Each campus is its own group of stakeholders (student orgs,
 * advisors, dept heads, professors).
 *
 * v8.10.18: manual campus creation removed. Campuses enter Student
 * Outreach only via the Staffing Outreach workflow — when a provider
 * becomes a Partner, their linked university auto-flows in
 * here. Prevents duplicate / accidental campus creation.
 */
export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/student-outreach/campuses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setCampuses(data.campuses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campuses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Universities you&apos;re targeting for student outreach. Each campus groups its own
            stakeholders (orgs, advisors, dept heads, professors). New campuses appear here
            automatically when a Staffing Outreach provider becomes a Partner.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/student-outreach"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Outreach queue
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : campuses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-gray-700">No campuses yet.</p>
          <p className="mt-1 text-xs text-gray-500">
            Campuses flow in automatically when a Staffing Outreach provider becomes a Partner.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {campuses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/student-outreach/campus/${c.slug}`}
                className="block rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  {!c.is_active && " · inactive"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
