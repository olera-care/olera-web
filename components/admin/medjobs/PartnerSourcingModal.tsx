"use client";

/**
 * PartnerSourcingModal — AI partner-sourcing widget (Chunk 1.2).
 *
 * Flow (see docs/medjobs/PARTNER_RECRUITMENT_SYSTEM.md §14, S2-S5):
 *   1. config     — pick subtype (+ optional dept scope) → Find sources
 *   2. sourcemap  — review the tiered source links → Extract candidates
 *   3. review     — accept / edit / reject candidates (per-field source links,
 *                   dedup flags) → Accept N
 *
 * Sourcing is read-only (POST /api/admin/medjobs/source-partners). Accepting
 * writes through the EXISTING POST /api/admin/student-outreach/stakeholders
 * path — no new write surface. Nothing is saved until the admin accepts.
 */

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type {
  PartnerCandidate,
  PartnerSubtype,
  SourceLink,
} from "@/lib/medjobs/partner-sourcing";

const SUBTYPES: { key: PartnerSubtype; label: string }[] = [
  { key: "advisor", label: "Pre-health advisors" },
  { key: "student_org", label: "Student organizations" },
  { key: "dept_head", label: "Department heads" },
];

type Step = "config" | "sourcemap" | "review";

interface Props {
  campusSlug: string;
  universityName: string;
  onClose: () => void;
  /** Called after at least one candidate is accepted (parent refetches). */
  onAccepted: () => void;
  /** Hand off to the required manual-audit gate for the chosen subtype. */
  onOpenAudit?: (subtype: PartnerSubtype) => void;
}

export function PartnerSourcingModal({
  campusSlug,
  universityName,
  onClose,
  onAccepted,
  onOpenAudit,
}: Props) {
  const [step, setStep] = useState<Step>("config");
  const [subtype, setSubtype] = useState<PartnerSubtype>("advisor");
  const [departments, setDepartments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceLink[]>([]);
  const [chosenSources, setChosenSources] = useState<Set<number>>(new Set());

  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cost, setCost] = useState(0);

  const [dedupeEmails, setDedupeEmails] = useState<Set<string>>(new Set());
  const [dedupeNames, setDedupeNames] = useState<Set<string>>(new Set());

  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(0);

  // Load the Site's existing partners once for dedup flags.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/medjobs/source-partners?campus_slug=${encodeURIComponent(campusSlug)}`,
        );
        if (!res.ok) return;
        const d = (await res.json()) as { emails?: string[]; names?: string[] };
        if (cancelled) return;
        setDedupeEmails(new Set((d.emails ?? []).map((e) => e.toLowerCase())));
        setDedupeNames(new Set((d.names ?? []).map((n) => n.toLowerCase())));
      } catch {
        /* dedup is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campusSlug]);

  const deptList = () =>
    departments
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const findSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          subtype,
          stage: "source_map",
          departments: subtype === "dept_head" ? deptList() : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to find sources");
      const src = (d.sources ?? []) as SourceLink[];
      setSources(src);
      setChosenSources(new Set(src.map((_, i) => (src[i].tier !== "worth_a_look" ? i : -1)).filter((i) => i >= 0)));
      setCost((c) => c + (d.cost ?? 0));
      setStep("sourcemap");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, subtype, departments]); // eslint-disable-line react-hooks/exhaustive-deps

  const extract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chosen = sources.filter((_, i) => chosenSources.has(i));
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          subtype,
          stage: "extract",
          departments: subtype === "dept_head" ? deptList() : undefined,
          sources: chosen,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to extract candidates");
      const cands = (d.candidates ?? []) as PartnerCandidate[];
      setCandidates(cands);
      // Pre-select everything not already a prospect.
      const preselect = new Set<number>();
      cands.forEach((c, i) => {
        if (!isDupe(c)) preselect.add(i);
      });
      setSelected(preselect);
      setCost((cst) => cst + (d.cost ?? 0));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, subtype, departments, sources, chosenSources]); // eslint-disable-line react-hooks/exhaustive-deps

  function isDupe(c: PartnerCandidate): boolean {
    const email = (c.email ?? c.org_email ?? "").toLowerCase();
    const name = (c.name ?? "").toLowerCase();
    return (!!email && dedupeEmails.has(email)) || (!!name && dedupeNames.has(name));
  }

  function patchCandidate(i: number, patch: Partial<PartnerCandidate>) {
    setCandidates((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function toggle(set: Set<number>, i: number, setter: (s: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setter(next);
  }

  function buildStakeholderBody(c: PartnerCandidate) {
    const sharedResearch: Record<string, unknown> = {
      ai_sourced: true,
      source_url: c.source_url ?? null,
      profile_url: c.profile_url ?? null,
      notes: c.notes ?? null,
    };
    if (c.subtype === "student_org") {
      const advisor = c.faculty_advisor;
      const firstOfficer = c.officers?.find((o) => o.name || o.email) ?? null;
      const primary = advisor?.name || advisor?.email ? advisor : firstOfficer;
      return {
        campus_slug: campusSlug,
        stakeholder_type: "student_org",
        organization_name: c.name,
        notes: c.notes ?? null,
        research_data: {
          ...sharedResearch,
          general_contact: { email: c.org_email ?? null },
          org_email: c.org_email ?? null,
          website: c.website ?? null,
          directory_url: c.directory_url ?? null,
          socials: c.socials ?? [],
          officers: c.officers ?? [],
          faculty_advisor: c.faculty_advisor ?? null,
        },
        initial_contact: primary
          ? {
              name: primary.name ?? null,
              email: primary.email ?? null,
              role: advisor && primary === advisor ? "faculty_advisor" : (firstOfficer?.role ?? null),
            }
          : null,
      };
    }
    // advisor / dept_head
    return {
      campus_slug: campusSlug,
      stakeholder_type: c.subtype,
      department: c.subtype === "dept_head" ? (c.department ?? null) : null,
      organization_name:
        c.subtype === "dept_head" && c.department ? `${c.department} Department` : c.name,
      notes: c.notes ?? null,
      research_data: {
        ...sharedResearch,
        general_contact: { email: c.email ?? null, phone: c.phone ?? null },
      },
      initial_contact: {
        name: c.name ?? null,
        title: c.title ?? null,
        email: c.email ?? null,
        phone: c.phone ?? null,
      },
    };
  }

  const acceptSelected = useCallback(async () => {
    setAccepting(true);
    setError(null);
    let ok = 0;
    try {
      for (const i of selected) {
        const body = buildStakeholderBody(candidates[i]);
        const res = await fetch("/api/admin/student-outreach/stakeholders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) ok += 1;
        setAccepted(ok);
      }
      if (ok > 0) onAccepted();
      // Push the admin straight into the required manual audit for this subtype.
      if (onOpenAudit) onOpenAudit(subtype);
      else onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setAccepting(false);
    }
  }, [selected, candidates]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ────────────────────────────────────────────────────────────
  const footer =
    step === "config" ? (
      <div className="flex items-center justify-between">
        {onOpenAudit ? (
          <button
            type="button"
            onClick={() => onOpenAudit(subtype)}
            className="text-xs text-gray-500 hover:underline"
          >
            Skip to manual audit checklist →
          </button>
        ) : (
          <span />
        )}
        <Button size="sm" onClick={findSources} loading={loading}>
          Find sources →
        </Button>
      </div>
    ) : step === "sourcemap" ? (
      <div className="flex justify-between">
        <Button size="sm" variant="ghost" onClick={() => setStep("config")}>
          ← Back
        </Button>
        <Button size="sm" onClick={extract} loading={loading}>
          Extract candidates →
        </Button>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {selected.size} selected · est. ${cost.toFixed(2)}
        </span>
        <Button size="sm" onClick={acceptSelected} loading={accepting} disabled={selected.size === 0}>
          {accepting ? `Accepting ${accepted}/${selected.size}…` : `Accept ${selected.size} → prospects`}
        </Button>
      </div>
    );

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      title={`Find partners · ${universityName}`}
      subtitle={
        step === "config"
          ? "Pick who to find. AI gives you a head start; you verify."
          : step === "sourcemap"
            ? "Where to look — review, then pull candidates."
            : "Nothing is saved until you accept. Every field links its source."
      }
      footer={footer}
    >
      {error && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {step === "config" && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Who are we looking for?
            </p>
            <div className="space-y-2">
              {SUBTYPES.map((s) => (
                <label key={s.key} className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="subtype"
                    checked={subtype === s.key}
                    onChange={() => setSubtype(s.key)}
                  />
                  {s.label}
                </label>
              ))}
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <input type="radio" disabled /> Professors (locked — needs dept-head permission)
              </p>
            </div>
          </div>
          {subtype === "dept_head" && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-700">Departments (optional)</p>
              <input
                value={departments}
                onChange={(e) => setDepartments(e.target.value)}
                placeholder="biology, chemistry, public health…"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {step === "sourcemap" && (
        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No sources found. Go back and try again.</p>
          ) : (
            sources.map((s, i) => (
              <label
                key={s.url}
                className="flex items-start gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={chosenSources.has(i)}
                  onChange={() => toggle(chosenSources, i, setChosenSources)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="text-gray-800">{s.title}</span>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                    {s.tier.replace("_", " ")}
                  </span>
                  <br />
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.url} ↗
                  </a>
                </span>
              </label>
            ))
          )}
        </div>
      )}

      {step === "review" && (
        <div className="space-y-2">
          {candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No candidates extracted. Go back, broaden sources, and retry — or add prospects by hand.
            </p>
          ) : (
            candidates.map((c, i) => {
              const dupe = isDupe(c);
              return (
                <div
                  key={i}
                  className={`rounded-md border px-3 py-2 ${
                    selected.has(i) ? "border-primary-200 bg-primary-50/40" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(selected, i, setSelected)}
                      className="mt-1.5"
                    />
                    <div className="flex-1 space-y-1">
                      <input
                        value={c.name ?? ""}
                        onChange={(e) => patchCandidate(i, { name: e.target.value })}
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-gray-900 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                        placeholder="Name / organization"
                      />
                      {c.subtype === "dept_head" && (
                        <input
                          value={c.department ?? ""}
                          onChange={(e) => patchCandidate(i, { department: e.target.value })}
                          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-gray-600 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                          placeholder="Department"
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                        <input
                          value={(c.subtype === "student_org" ? c.org_email : c.email) ?? ""}
                          onChange={(e) =>
                            patchCandidate(
                              i,
                              c.subtype === "student_org"
                                ? { org_email: e.target.value, email: e.target.value }
                                : { email: e.target.value },
                            )
                          }
                          className="rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                          placeholder="✉ email"
                        />
                        {c.subtype !== "student_org" && (
                          <input
                            value={c.phone ?? ""}
                            onChange={(e) => patchCandidate(i, { phone: e.target.value })}
                            className="rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                            placeholder="☎ phone"
                          />
                        )}
                      </div>
                      {c.subtype === "student_org" && (
                        <p className="text-xs text-gray-500">
                          {c.faculty_advisor?.name
                            ? `★ Advisor: ${c.faculty_advisor.name}`
                            : "★ Advisor: not found"}
                          {c.officers?.length ? ` · ${c.officers.length} officer(s)` : ""}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {c.source_url && (
                          <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                            source ↗
                          </a>
                        )}
                        {c.profile_url && (
                          <a href={c.profile_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                            profile ↗
                          </a>
                        )}
                        {c.confidence && (
                          <span className="text-gray-400">confidence: {c.confidence}</span>
                        )}
                        {dupe && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                            ⚠ already a prospect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <button
            type="button"
            onClick={() => setStep("sourcemap")}
            className="mt-2 text-xs text-gray-500 hover:underline"
          >
            ← Back to sources (mine them by hand for anyone the AI missed)
          </button>
        </div>
      )}
    </Modal>
  );
}
