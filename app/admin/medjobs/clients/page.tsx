"use client";

/**
 * v9.0 Phase 7 Commit P: Clients page — operational scope.
 *
 * Shows providers with at least one pending Step Board task — the
 * same operational denominator as the In Basket Clients tab and the
 * sidebar Clients fraction. Quiet clients (T&C-accepted, no pending
 * task) live in Logs (which surfaces every client that has any
 * logged action).
 *
 * Brand-new clients without any task fall through; the system
 * should auto-queue a "first check-in" task on T&C accept (separate
 * follow-up).
 *
 * Past history → Logs filtered to source=client.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { ClientCard } from "@/components/admin/medjobs/cards/ClientCard";
import { CardOverflowMenu } from "@/components/admin/medjobs/cards/CardOverflowMenu";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import type { ClientRow } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
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
      // v9.0 Phase 7 Commit P: operational scope.
      params.set("with_pending_task", "true");
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
      <PulseHeader
        title="MedJobs · Clients"
        kpiSuffix="new clients"
        statsPath="/api/admin/student-outreach/stats?metric=clients"
        range={range}
        onRangeChange={setRange}
      />
      <p className="-mt-6 mb-4 text-sm text-gray-500">
        Provider clients with active Step Board work. Quiet clients
        and past actions live in{" "}
        <a
          href="/admin/medjobs/logs?source=client"
          className="font-medium text-primary-700 underline hover:no-underline"
        >
          Logs
        </a>
        .
      </p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by provider name or email…"
        className="mb-6 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
      />

      {/* v9.0 Phase 7 Commit M: keep rows rendered during background
          refetches; "Loading…" only on first load. */}
      {loading && rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          No clients with pending steps right now. View past activity in{" "}
          <a
            href="/admin/medjobs/logs?source=client"
            className="font-medium text-primary-700 underline hover:no-underline"
          >
            Logs
          </a>
          .
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <ClientCard
                row={r}
                onManage={() => setOpenProviderId(r.id)}
                overflowMenu={
                  <CardOverflowMenu
                    items={[
                      ...(r.stripe_customer_id
                        ? [
                            {
                              label: "View in Stripe",
                              onClick: () => {
                                window.open(
                                  `https://dashboard.stripe.com/customers/${r.stripe_customer_id}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              },
                            },
                          ]
                        : []),
                      ...(r.slug
                        ? [
                            {
                              label: "View public profile",
                              onClick: () => {
                                window.open(`/${r.slug}`, "_blank", "noopener,noreferrer");
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Add custom step",
                        onClick: () => setOpenProviderId(r.id),
                      },
                    ]}
                  />
                }
              />
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
