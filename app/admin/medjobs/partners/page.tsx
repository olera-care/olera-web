"use client";

/**
 * v9.0 Phase 6: Partners page. Campus stakeholders in active_partner
 * status — advisors, dept heads, professors, student orgs that are
 * distributing student profiles to their members.
 *
 * Reference + relationship-management surface. Tasks for individual
 * partners (e.g., seasonal check-in due) appear in In Basket
 * separately.
 *
 * Excludes kind='provider' rows. Provider partners (historical or
 * paying) live in the Clients surface, not here.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { MedjobsCard } from "@/components/admin/medjobs/cards/MedjobsCard";
import { CardOverflowMenu } from "@/components/admin/medjobs/cards/CardOverflowMenu";
import { Pill } from "@/components/admin/medjobs/cards/StakeholderCard";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { KIND_LABELS } from "@/lib/student-outreach/types";
import { formatRelative } from "@/lib/student-outreach/formatters";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface PartnerRow {
  id: string;
  organization_name: string;
  department: string | null;
  kind: string;
  stakeholder_type: string | null;
  campus_name: string | null;
  viewed_at: string | null;
  last_edited_at: string;
  distribution_evidence: string | null;
  distribution_evidence_notes: string | null;
  primary_contact_name: string | null;
  primary_contact_role: string | null;
  primary_contact_email: string | null;
}

export default function PartnersPage() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // v9.0 Phase 7 Commit P: operational scope — partners with
      // pending tasks only, matching sidebar + In Basket Partners
      // tab. Quiet partners and past activity live in Logs.
      params.set("with_pending_task", "true");
      if (debouncedSearch) params.set("search", debouncedSearch);
      const r = await fetch(`/api/admin/medjobs/partners?${params}`);
      if (!r.ok) throw new Error((await r.json()).error || "Failed to load partners");
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
        title="MedJobs · Partners"
        kpiSuffix="new partners"
        statsPath="/api/admin/student-outreach/stats?metric=partners_added"
        range={range}
        onRangeChange={setRange}
      />
      <p className="-mt-6 mb-4 text-sm text-gray-500">
        Partners with active Step Board work. Quiet partners and past activity live in{" "}
        <a
          href="/admin/medjobs/logs?source=stakeholder"
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
        placeholder="Search by name, organization, or email…"
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
          No partners with pending steps right now. Quiet partners and past activity live in{" "}
          <a
            href="/admin/medjobs/logs?source=stakeholder"
            className="font-medium text-primary-700 underline hover:no-underline"
          >
            Logs
          </a>
          .
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const kindLabel =
              KIND_LABELS[(r.kind as keyof typeof KIND_LABELS) ?? "student_org"] ?? r.kind;
            const subtitle = [
              r.campus_name,
              kindLabel,
              r.primary_contact_role,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={r.id}>
                <MedjobsCard
                  title={r.primary_contact_name ?? r.organization_name}
                  subtitle={subtitle || null}
                  footnote={`Last activity ${formatRelative(r.last_edited_at)}`}
                  pill={<Pill>★ Active partner</Pill>}
                  onClick={() => setOpenOutreachId(r.id)}
                  hoverTitle="Open the partner drawer."
                  unread={r.viewed_at == null}
                  overflowMenu={
                    <CardOverflowMenu
                      items={[
                        {
                          label: "Mark as unread",
                          onClick: async () => {
                            await fetch(`/api/admin/student-outreach/${r.id}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "mark_unread" }),
                            });
                            void refetch();
                          },
                        },
                      ]}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => {
            // v9.0 Phase 7 Commit J: refetch on close so mark_read
            // (fired automatically when the drawer mounts) is
            // reflected in the list — card bolding clears.
            setOpenOutreachId(null);
            void refetch();
          }}
          onAction={() => { void refetch(); }}
        />
      )}
    </div>
  );
}
