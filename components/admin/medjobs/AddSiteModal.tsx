"use client";

/**
 * v9.0 Phase 7: Add Site modal. Triggered from the Sites page header
 * action. Lets admin activate a university territory by picking from
 * the PARTNER_UNIVERSITIES preset list.
 *
 * The DB table is still `student_outreach_campuses`; only the UI says
 * "site". Endpoint stays /api/admin/student-outreach/campuses.
 *
 * Catchment audit preview: when the modal opens, we side-fetch the
 * /api/admin/medjobs/catchment-audit payload and surface each
 * university's "providers in catchment" count next to its name in the
 * dropdown. Lets admin see "this Site will generate N Provider
 * Prospects" before committing — catches the empty-catchment trap up
 * front (the Michigan-State 1-provider case) instead of after
 * activation.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import Select from "@/components/ui/Select";
import { refreshMedJobs } from "@/hooks/useMedJobsRefresh";

interface Props {
  existingSlugs?: ReadonlySet<string>;
  onClose: () => void;
  onCreated: (slug: string, name: string) => void;
}

interface AuditCountsBySlug {
  providers_in_catchment: number;
  providers_in_states: number;
  empty_cities_count: number;
}

export function AddSiteModal({ existingSlugs, onClose, onCreated }: Props) {
  const existing = existingSlugs ?? new Set<string>();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditBySlug, setAuditBySlug] = useState<Record<string, AuditCountsBySlug>>({});
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/medjobs/catchment-audit");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, AuditCountsBySlug> = {};
        for (const r of (data.rows ?? []) as Array<{
          slug: string;
          providers_in_catchment: number;
          providers_in_states: number;
          empty_cities: Array<{ city: string; state: string }>;
        }>) {
          map[r.slug] = {
            providers_in_catchment: r.providers_in_catchment,
            providers_in_states: r.providers_in_states,
            empty_cities_count: r.empty_cities.length,
          };
        }
        setAuditBySlug(map);
      } catch {
        /* non-critical — preview just won't render */
      } finally {
        if (!cancelled) setAuditLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedUni = useMemo(
    () => PARTNER_UNIVERSITIES.find((u) => u.slug === selectedSlug) ?? null,
    [selectedSlug],
  );
  const selectedAudit = selectedSlug ? auditBySlug[selectedSlug] : null;

  const submit = async () => {
    if (!selectedUni) {
      setError("Pick a university first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/student-outreach/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedUni.slug,
          name: selectedUni.name,
          state: selectedUni.state,
          city: selectedUni.city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add site");
      refreshMedJobs();
      onCreated(selectedUni.slug, selectedUni.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add Site</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Activate a university territory. The counts below show how many
            non-medical home care providers in our directory match each
            catchment — i.e. how many Provider Prospects this Site will
            generate.
          </p>
        </header>

        <div className="space-y-3 px-6 py-4">
          <Select
            label="University"
            value={selectedSlug}
            onChange={(val) => {
              setSelectedSlug(val);
              setError(null);
            }}
            placeholder="Pick a university…"
            searchable
            searchPlaceholder="Search universities..."
            size="sm"
            options={PARTNER_UNIVERSITIES.map((u) => {
              const a = auditBySlug[u.slug];
              const countSuffix = a
                ? ` — ${a.providers_in_catchment} in catchment`
                : "";
              return {
                value: u.slug,
                label: `${u.name} (${u.city}, ${u.state})${existing.has(u.slug) ? " — added" : countSuffix}`,
                disabled: existing.has(u.slug),
              };
            })}
          />

          {selectedUni && (
            <CatchmentPreview
              uni={selectedUni}
              audit={selectedAudit}
              loading={auditLoading && !selectedAudit}
            />
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <p className="text-[11px] text-gray-500">
            See all rankings on the{" "}
            <Link
              href="/admin/medjobs/catchment-audit"
              className="font-medium text-primary-700 hover:underline"
            >
              Catchment Audit
            </Link>{" "}
            page. Catchment lists edited in{" "}
            <code>lib/staffing-outreach/partner-universities.ts</code>.
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !selectedSlug}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add Site"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CatchmentPreview({
  uni,
  audit,
  loading,
}: {
  uni: { name: string; catchment: Array<{ city: string; state: string }> };
  audit: AuditCountsBySlug | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Loading catchment density…
      </div>
    );
  }
  if (!audit) return null;
  const dense = audit.providers_in_catchment >= 5;
  const empty = audit.providers_in_catchment === 0;
  const tone = empty
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : dense
      ? "border-primary-200 bg-primary-50 text-primary-900"
      : "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <div className={`space-y-1 rounded-md border px-3 py-2 text-xs ${tone}`}>
      <p>
        <span className="font-semibold tabular-nums">
          {audit.providers_in_catchment}
        </span>{" "}
        provider{audit.providers_in_catchment === 1 ? "" : "s"} in catchment
        will become Provider Prospects.
      </p>
      <p className="text-[11px] opacity-80">
        Catchment covers {uni.catchment.length} cities. {audit.providers_in_states}{" "}
        providers exist across the catchment states overall;{" "}
        {audit.empty_cities_count} catchment cit
        {audit.empty_cities_count === 1 ? "y has" : "ies have"} zero providers.
      </p>
      {empty && (
        <p className="text-[11px] font-medium">
          ⚠ This Site will generate no Provider Prospects on activation. Run
          enrichment for the catchment first, or expand the city list in{" "}
          <code>partner-universities.ts</code>.
        </p>
      )}
    </div>
  );
}
