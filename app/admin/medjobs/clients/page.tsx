"use client";

/**
 * v9.0 Phase 6: Clients page. Provider relationships in pilot or
 * subscribed state. List of provider business_profiles where
 * interview_terms_accepted_at is within 90 days OR
 * medjobs_subscription_active = true.
 *
 * Reference + management surface — not a triage queue. Triage tasks
 * for individual clients (e.g., trial ending soon) appear in In Basket
 * separately. This page is for browsing all current client
 * relationships.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { ClientCard } from "@/components/admin/medjobs/cards/ClientCard";
import type { ClientRow } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openProviderId, setOpenProviderId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const r = await fetch(`/api/admin/medjobs/clients?${params}`);
      if (!r.ok) throw new Error((await r.json()).error || "Failed to load clients");
      const d = await r.json();
      setRows(d.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">MedJobs · Clients</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Provider relationships in pilot or subscribed via Stripe.
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by provider name…"
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          No clients yet. Providers enter the pilot when they accept T&amp;C at first interview scheduling.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <ClientCard row={r} onManage={() => setOpenProviderId(r.id)} />
            </li>
          ))}
        </ul>
      )}

      {openProviderId && (
        <Drawer
          providerId={openProviderId}
          onClose={() => setOpenProviderId(null)}
        />
      )}
    </div>
  );
}
