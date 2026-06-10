"use client";

/**
 * PartnerAuditModal — required manual-audit gate (Chunk 1.3, S25 / R3).
 *
 * AI sourcing is never sufficient by itself. Before a Site's prospecting can be
 * marked complete for a subtype, the admin must: review the AI source links,
 * run a pre-filled set of manual searches, add anyone the AI missed, and
 * confirm the research is exhausted. State persists per subtype in the Site's
 * partner_research.audit (via PATCH /campuses/[slug]); the existing
 * research-complete mechanism is the gate.
 */

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { PartnerSubtype, SourceLink } from "@/lib/medjobs/partner-sourcing";

interface Props {
  campusSlug: string;
  universityName: string;
  subtype: PartnerSubtype;
  onClose: () => void;
  onComplete: () => void;
}

const SUBTYPE_LABEL: Record<PartnerSubtype, string> = {
  advisor: "advisors",
  student_org: "student organizations",
  dept_head: "department heads",
};

function googleUrl(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
function linkedinUrl(q: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

/** Pre-filled manual searches per subtype, each opening in a new tab. */
function manualSearches(subtype: PartnerSubtype, uni: string): { key: string; label: string; url: string }[] {
  if (subtype === "advisor") {
    return [
      { key: "s_advisor_office", label: `Google: "${uni} pre-health advisor"`, url: googleUrl(`${uni} pre-health advisor`) },
      { key: "s_advisor_staff", label: `Google: "${uni} health professions advising staff"`, url: googleUrl(`${uni} health professions advising staff`) },
      { key: "s_advisor_cns", label: `Google: ${uni} college of science academic advising`, url: googleUrl(`${uni} college of natural sciences academic advising`) },
      { key: "s_advisor_li", label: `LinkedIn: pre-health advisor ${uni}`, url: linkedinUrl(`pre-health advisor ${uni}`) },
    ];
  }
  if (subtype === "dept_head") {
    return [
      { key: "s_dept_bio", label: `Google: ${uni} biology department chair`, url: googleUrl(`${uni} biology department chair`) },
      { key: "s_dept_chem", label: `Google: ${uni} chemistry department chair`, url: googleUrl(`${uni} chemistry department chair`) },
      { key: "s_dept_health", label: `Google: ${uni} public health / kinesiology department head`, url: googleUrl(`${uni} public health kinesiology department head`) },
      { key: "s_dept_dir", label: `Google: ${uni} department chairs directory`, url: googleUrl(`${uni} department chairs directory`) },
    ];
  }
  return [
    { key: "s_org_premed", label: `Google: ${uni} pre-med society`, url: googleUrl(`${uni} pre-med society`) },
    { key: "s_org_dir", label: `Google: ${uni} student organizations directory pre-health`, url: googleUrl(`${uni} student organizations directory pre-health`) },
    { key: "s_org_ig", label: `Google: ${uni} pre-health club instagram`, url: googleUrl(`${uni} pre-health club instagram`) },
    { key: "s_org_advisor", label: `Google: ${uni} pre-med society faculty advisor`, url: googleUrl(`${uni} pre-med society faculty advisor`) },
  ];
}

export function PartnerAuditModal({ campusSlug, universityName, subtype, onClose, onComplete }: Props) {
  const [sources, setSources] = useState<SourceLink[]>([]);
  const [steps, setSteps] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searches = manualSearches(subtype, universityName);
  // Required: review AI links + every manual search + added-missed + exhausted.
  const requiredKeys = ["reviewed_ai", ...searches.map((s) => s.key), "added_missed", "exhausted"];
  const doneCount = requiredKeys.filter((k) => steps[k]).length;
  const allDone = requiredKeys.every((k) => steps[k]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/medjobs/source-partners?campus_slug=${encodeURIComponent(campusSlug)}`);
        if (res.ok) {
          const d = await res.json();
          if (cancelled) return;
          const pr = (d.partner_research ?? {}) as {
            sources?: Record<string, SourceLink[]>;
            audit?: Record<string, { steps?: Record<string, boolean> }>;
          };
          setSources(pr.sources?.[subtype] ?? []);
          setSteps(pr.audit?.[subtype]?.steps ?? {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campusSlug, subtype]);

  const set = (key: string, val: boolean) => setSteps((s) => ({ ...s, [key]: val }));

  const persist = useCallback(
    async (complete: boolean) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/student-outreach/campuses/${campusSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partner_audit: { subtype, steps, complete } }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Save failed");
        if (complete) onComplete();
        else onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [campusSlug, subtype, steps], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const Check = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <label className="flex items-start gap-2 text-sm text-gray-800">
      <input type="checkbox" checked={!!steps[k]} onChange={(e) => set(k, e.target.checked)} className="mt-1" />
      <span>{children}</span>
    </label>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      title={`Finish prospecting · ${universityName} · ${SUBTYPE_LABEL[subtype]}`}
      subtitle="AI gives you a head start. You finish the job before marking this complete."
      footer={
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{doneCount} of {requiredKeys.length} required steps</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => persist(false)} loading={saving}>
              Save progress
            </Button>
            <Button size="sm" onClick={() => persist(true)} loading={saving} disabled={!allDone}>
              Mark prospecting complete
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-5">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">1 · Review what the AI found</p>
            {sources.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-xs text-gray-400">No saved source map — run “Find partners” first, or rely on the manual searches below.</p>
            )}
            <Check k="reviewed_ai">Opened all source links and skimmed for contacts the AI missed</Check>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">2 · Run these manual searches</p>
            <div className="space-y-2">
              {searches.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <Check k={s.key}>{s.label}</Check>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary-600 hover:underline">
                    open ↗
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">3 · Add anyone the AI missed</p>
            <Check k="added_missed">
              Added any missed prospects by hand (via “Find partners” → add, or the Site’s stakeholder page) — or confirmed there were none
            </Check>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">4 · Confirm</p>
            <Check k="exhausted">I’ve exhausted this research as far as is reasonable</Check>
          </section>
        </div>
      )}
    </Modal>
  );
}
