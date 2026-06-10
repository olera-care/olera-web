"use client";

/**
 * ResearchWorkspace — the single surface for partner prospecting.
 *
 * Replaces the old PartnerSourcingModal + PartnerAuditModal split. One drawer,
 * one sequence, one source of truth (the Site record):
 *
 *   ① Links    Build the approved research link set (AI suggest + manual + searches)
 *   ② Extract  AI reads the kept links → draft offices + people
 *   ③ Verify   Fully edit offices/members; move people; create offices
 *   ④ Review   Read-only summary — the source of truth before outreach
 *   ⑤ Attest   Confirm the research is done → mark this category complete
 *   ⑥ Generate Materialize outreach-ready contacts into prospects
 *
 * State persists on student_outreach_campuses.partner_research.workspace[subtype]
 * (no student_outreach rows until Generate). See lib/medjobs/research-workspace.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { PartnerSubtype, PartnerCandidate } from "@/lib/medjobs/partner-sourcing";
import {
  emptyWorkspace,
  mergeSearches,
  predefinedSearches,
  wsId,
  type SearchState,
  type WorkspaceLink,
  type WorkspaceMember,
  type WorkspaceOffice,
  type WorkspaceState,
} from "@/lib/medjobs/research-workspace";

type Step = "links" | "extract" | "verify" | "review" | "attest" | "generate";

const STEPS: { key: Step; label: string }[] = [
  { key: "links", label: "Links" },
  { key: "extract", label: "Extract" },
  { key: "verify", label: "Verify" },
  { key: "review", label: "Review" },
  { key: "attest", label: "Attest" },
  { key: "generate", label: "Generate" },
];

const SUBTYPES: { key: PartnerSubtype; label: string }[] = [
  { key: "advisor", label: "Advising offices" },
  { key: "student_org", label: "Student orgs" },
  { key: "dept_head", label: "Department heads" },
];

function bodyError(body: unknown, fallback: string): string {
  const e = (body as { error?: unknown } | null)?.error;
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

/** Convert one AI candidate into a workspace office (org-shaped). */
function candidateToOffice(c: PartnerCandidate): WorkspaceOffice {
  const members: WorkspaceMember[] = [];
  for (const o of c.officers ?? []) {
    if (!o.name && !o.email) continue;
    members.push({ id: wsId(), name: o.name ?? null, role: o.role ?? null, email: o.email ?? null, source_url: o.source_url ?? null });
  }
  if (c.faculty_advisor?.name || c.faculty_advisor?.email) {
    members.push({
      id: wsId(),
      name: c.faculty_advisor.name ?? null,
      role: "Faculty advisor",
      email: c.faculty_advisor.email ?? null,
      source_url: c.faculty_advisor.source_url ?? null,
    });
  }
  // dept_head is person-shaped — fold the chair in as the single member.
  if (c.subtype === "dept_head" && (c.name || c.email)) {
    members.push({ id: wsId(), name: c.name ?? null, role: c.title ?? "Department chair", email: c.email ?? null, phone: c.phone ?? null, source_url: c.source_url ?? null });
  }
  return {
    id: wsId(),
    name: c.subtype === "dept_head" && c.department ? `${c.department} Department` : c.name ?? "Untitled office",
    general_email: c.org_email ?? (c.subtype === "dept_head" ? c.email : null) ?? null,
    general_phone: c.phone ?? null,
    website: c.website ?? null,
    notes: c.notes ?? null,
    members,
  };
}

interface Props {
  campusSlug: string;
  universityName: string;
  onClose: () => void;
  /** Refetch the parent lists (counts, cards). */
  onChanged: () => void;
}

export function ResearchWorkspace({ campusSlug, universityName, onClose, onChanged }: Props) {
  const [subtype, setSubtype] = useState<PartnerSubtype>("advisor");
  const [step, setStep] = useState<Step>("links");
  const [ws, setWs] = useState<WorkspaceState>(emptyWorkspace());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // AI link suggestions awaiting keep/remove (not yet in the kept set).
  const [suggested, setSuggested] = useState<WorkspaceLink[]>([]);

  // Attestation checklist.
  const [attest, setAttest] = useState<Record<string, boolean>>({});
  const [attestComplete, setAttestComplete] = useState(false);

  // Generate selections: office_id → { include_office, member_ids:Set }
  const [gen, setGen] = useState<Record<string, { office: boolean; members: Set<string> }>>({});

  // ── load on subtype change ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuggested([]);
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/medjobs/research-workspace?campus_slug=${encodeURIComponent(campusSlug)}&subtype=${subtype}`,
        );
        const d = await res.json().catch(() => null);
        if (!res.ok) throw new Error(bodyError(d, "Couldn't load workspace"));
        if (cancelled) return;
        const loaded = (d.workspace ?? emptyWorkspace()) as WorkspaceState;
        loaded.searches = mergeSearches(loaded.searches ?? [], predefinedSearches(subtype, universityName));
        setWs(loaded);
        const audit = d.audit as { steps?: Record<string, boolean>; complete_at?: string | null } | null;
        setAttest(audit?.steps ?? {});
        setAttestComplete(Boolean(audit?.complete_at));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campusSlug, subtype, universityName]);

  // ── persistence ───────────────────────────────────────────────────────
  const wsRef = useRef(ws);
  wsRef.current = ws;
  const save = useCallback(
    async (override?: WorkspaceState) => {
      const cur = override ?? wsRef.current;
      try {
        const res = await fetch("/api/admin/medjobs/research-workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campus_slug: campusSlug,
            subtype,
            workspace: { links: cur.links, searches: cur.searches, offices: cur.offices },
          }),
        });
        if (!res.ok) throw new Error(bodyError(await res.json().catch(() => null), "Save failed"));
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    },
    [campusSlug, subtype],
  );

  // Debounced autosave on any workspace mutation (after initial load).
  const didLoad = useRef(false);
  useEffect(() => {
    if (loading) {
      didLoad.current = false;
      return;
    }
    if (!didLoad.current) {
      didLoad.current = true;
      return;
    }
    const t = setTimeout(() => void save(), 800);
    return () => clearTimeout(t);
  }, [ws, loading, save]);

  // ── step 1: links ─────────────────────────────────────────────────────
  const suggestLinks = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, stage: "source_map" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(bodyError(d, "Couldn't suggest links"));
      const keptUrls = new Set(ws.links.map((l) => l.url));
      const next: WorkspaceLink[] = (d.sources ?? [])
        .filter((s: { url?: string }) => s.url && !keptUrls.has(s.url))
        .map((s: { title?: string; url: string; tier?: WorkspaceLink["tier"]; why?: string; likely?: string }) => ({
          id: wsId(),
          title: s.title ?? s.url,
          url: s.url,
          tier: s.tier ?? null,
          why: s.why ?? null,
          likely: s.likely ?? null,
          source: "ai" as const,
        }));
      setSuggested(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [campusSlug, subtype, ws.links]);

  const keepLink = (link: WorkspaceLink) => {
    setWs((w) => ({ ...w, links: [...w.links, link] }));
    setSuggested((s) => s.filter((l) => l.id !== link.id));
  };
  const removeLink = (id: string) =>
    setWs((w) => ({ ...w, links: w.links.filter((l) => l.id !== id) }));
  const addManualLink = (url: string, title: string) => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setError("Paste a valid http(s) link.");
      return;
    }
    setWs((w) => ({
      ...w,
      links: [...w.links, { id: wsId(), url: clean, title: title.trim() || clean, source: "manual", tier: null }],
    }));
  };
  const toggleSearch = (key: string) =>
    setWs((w) => ({
      ...w,
      searches: w.searches.map((s) => (s.key === key ? { ...s, ran: !s.ran } : s)),
    }));

  // ── step 2: extract ───────────────────────────────────────────────────
  const extract = useCallback(async () => {
    if (ws.links.length === 0) {
      setError("Keep at least one link first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          subtype,
          stage: "extract",
          sources: ws.links.map((l) => ({ title: l.title, url: l.url })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(bodyError(d, "Extraction failed — try again or add by hand in Verify."));
      const cands = (d.candidates ?? []) as PartnerCandidate[];
      // Merge into existing offices, dedupe by lowercased name.
      setWs((w) => {
        const byName = new Map(w.offices.map((o) => [o.name.trim().toLowerCase(), o]));
        for (const c of cands) {
          const office = candidateToOffice(c);
          const key = office.name.trim().toLowerCase();
          const existing = byName.get(key);
          if (existing) {
            const seen = new Set(existing.members.map((m) => (m.email ?? m.name ?? "").toLowerCase()));
            for (const m of office.members) {
              const mk = (m.email ?? m.name ?? "").toLowerCase();
              if (mk && seen.has(mk)) continue;
              existing.members.push(m);
            }
            existing.general_email = existing.general_email ?? office.general_email;
            existing.general_phone = existing.general_phone ?? office.general_phone;
            existing.website = existing.website ?? office.website;
          } else {
            byName.set(key, office);
          }
        }
        return { ...w, offices: [...byName.values()] };
      });
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [campusSlug, subtype, ws.links]);

  // ── step 3: verify — office/member mutation helpers ───────────────────
  const patchOffice = (oid: string, patch: Partial<WorkspaceOffice>) =>
    setWs((w) => ({ ...w, offices: w.offices.map((o) => (o.id === oid ? { ...o, ...patch } : o)) }));
  const addOffice = () =>
    setWs((w) => ({
      ...w,
      offices: [...w.offices, { id: wsId(), name: "New office", members: [] }],
    }));
  const removeOffice = (oid: string) =>
    setWs((w) => ({ ...w, offices: w.offices.filter((o) => o.id !== oid) }));
  const addMember = (oid: string) =>
    setWs((w) => ({
      ...w,
      offices: w.offices.map((o) =>
        o.id === oid ? { ...o, members: [...o.members, { id: wsId(), name: "" }] } : o,
      ),
    }));
  const patchMember = (oid: string, mid: string, patch: Partial<WorkspaceMember>) =>
    setWs((w) => ({
      ...w,
      offices: w.offices.map((o) =>
        o.id === oid
          ? { ...o, members: o.members.map((m) => (m.id === mid ? { ...m, ...patch } : m)) }
          : o,
      ),
    }));
  const removeMember = (oid: string, mid: string) =>
    setWs((w) => ({
      ...w,
      offices: w.offices.map((o) =>
        o.id === oid ? { ...o, members: o.members.filter((m) => m.id !== mid) } : o,
      ),
    }));
  const moveMember = (fromOid: string, mid: string, toOid: string) =>
    setWs((w) => {
      const from = w.offices.find((o) => o.id === fromOid);
      const member = from?.members.find((m) => m.id === mid);
      if (!member) return w;
      return {
        ...w,
        offices: w.offices.map((o) => {
          if (o.id === fromOid) return { ...o, members: o.members.filter((m) => m.id !== mid) };
          if (o.id === toOid) return { ...o, members: [...o.members, member] };
          return o;
        }),
      };
    });

  // ── step 5: attest ────────────────────────────────────────────────────
  const ATTEST_ITEMS = [
    { key: "reviewed_links", label: "Reviewed AI links and kept the good ones" },
    { key: "ran_searches", label: "Ran the predefined searches" },
    { key: "added_links", label: "Added the links I found by hand" },
    { key: "verified_contacts", label: "Verified each contact (name / role / email)" },
    { key: "added_missed", label: "Added anyone the AI missed" },
    { key: "organized", label: "Offices organized correctly" },
  ];
  const attestAllDone = ATTEST_ITEMS.every((i) => attest[i.key]);
  const markComplete = useCallback(
    async (complete: boolean) => {
      setBusy(true);
      setError(null);
      try {
        await save();
        const res = await fetch(`/api/admin/student-outreach/campuses/${campusSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partner_audit: { subtype, steps: attest, complete } }),
        });
        if (!res.ok) throw new Error(bodyError(await res.json().catch(() => null), "Save failed"));
        setAttestComplete(complete);
        onChanged();
        if (complete) setStep("generate");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(false);
      }
    },
    [campusSlug, subtype, attest, save, onChanged],
  );

  // ── step 6: generate ──────────────────────────────────────────────────
  // Default selection: include office when it has an email.
  useEffect(() => {
    if (step !== "generate") return;
    setGen((cur) => {
      const next = { ...cur };
      for (const o of ws.offices) {
        if (!next[o.id]) next[o.id] = { office: Boolean(o.general_email), members: new Set() };
      }
      return next;
    });
  }, [step, ws.offices]);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await save();
      const selections = ws.offices
        .map((o) => ({
          office_id: o.id,
          include_office: gen[o.id]?.office ?? false,
          member_ids: [...(gen[o.id]?.members ?? new Set<string>())],
        }))
        .filter((s) => s.include_office || s.member_ids.length > 0);
      if (selections.length === 0) {
        setError("Pick at least one outreach contact.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/medjobs/research-workspace/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, selections }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyError(d, "Generate failed"));
      onChanged();
      setWs((w) => ({ ...w, generated_at: new Date().toISOString() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }, [campusSlug, subtype, ws.offices, gen, save, onChanged]);

  const totalPeople = useMemo(
    () => ws.offices.reduce((n, o) => n + o.members.length, 0),
    [ws.offices],
  );

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  };

  // ── render ────────────────────────────────────────────────────────────
  const header = (
    <div className="flex-1">
      <h2 className="text-lg font-semibold text-gray-900">Research · {universityName}</h2>
      <div className="mt-1 flex items-center gap-2">
        {SUBTYPES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setStep("links");
              setSubtype(s.key);
            }}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              subtype === s.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} size="fullscreen" title={header}>
      {/* Step rail */}
      <div className="sticky top-0 z-10 -mx-5 mb-4 border-b border-gray-100 bg-white px-5 py-2 sm:-mx-7 sm:px-7">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 ${
                step === s.key ? "bg-primary-50 font-semibold text-primary-700" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                i <= stepIndex ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>{i + 1}</span>
              {s.label}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[11px] text-gray-400">
            {savedAt ? `Saved ${savedAt}` : "Autosaves"}
          </span>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading workspace…</p>
      ) : (
        <div className="pb-6">
          {step === "links" && (
            <LinksStep
              ws={ws}
              suggested={suggested}
              busy={busy}
              onSuggest={suggestLinks}
              onKeep={keepLink}
              onRemove={removeLink}
              onAddManual={addManualLink}
              onToggleSearch={toggleSearch}
              onNext={goNext}
            />
          )}
          {step === "extract" && (
            <ExtractStep ws={ws} busy={busy} onExtract={extract} onBack={() => setStep("links")} />
          )}
          {step === "verify" && (
            <VerifyStep
              ws={ws}
              subtype={subtype}
              onAddOffice={addOffice}
              onRemoveOffice={removeOffice}
              onPatchOffice={patchOffice}
              onAddMember={addMember}
              onPatchMember={patchMember}
              onRemoveMember={removeMember}
              onMoveMember={moveMember}
              onNext={goNext}
            />
          )}
          {step === "review" && (
            <ReviewStep ws={ws} totalPeople={totalPeople} onNext={goNext} />
          )}
          {step === "attest" && (
            <AttestStep
              items={ATTEST_ITEMS}
              attest={attest}
              setAttest={setAttest}
              allDone={attestAllDone}
              complete={attestComplete}
              busy={busy}
              onSave={() => void markComplete(false)}
              onComplete={() => void markComplete(true)}
            />
          )}
          {step === "generate" && (
            <GenerateStep
              ws={ws}
              gen={gen}
              setGen={setGen}
              busy={busy}
              onGenerate={generate}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 1 — Links
// ───────────────────────────────────────────────────────────────────────────
function LinksStep({
  ws,
  suggested,
  busy,
  onSuggest,
  onKeep,
  onRemove,
  onAddManual,
  onToggleSearch,
  onNext,
}: {
  ws: WorkspaceState;
  suggested: WorkspaceLink[];
  busy: boolean;
  onSuggest: () => void;
  onKeep: (l: WorkspaceLink) => void;
  onRemove: (id: string) => void;
  onAddManual: (url: string, title: string) => void;
  onToggleSearch: (key: string) => void;
  onNext: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Build the best set of source links. Nothing is saved to the Site until you <b>Keep</b> it —
        the kept set is your approved research record.
      </p>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested by AI</p>
          <Button size="sm" variant="ghost" onClick={onSuggest} loading={busy}>
            ✦ Suggest links
          </Button>
        </div>
        {suggested.length === 0 ? (
          <p className="text-xs text-gray-400">Click “Suggest links” for a few flagship pages — then keep the good ones.</p>
        ) : (
          <ul className="space-y-1.5">
            {suggested.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  {l.tier && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                      {l.tier.replace("_", " ")}
                    </span>
                  )}
                  {(l.why || l.likely) && (
                    <span className="block text-[11px] text-gray-500">
                      {l.why}
                      {l.why && l.likely ? " · " : ""}
                      {l.likely ? <span className="text-gray-400">likely: {l.likely}</span> : null}
                    </span>
                  )}
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                    {l.url} ↗
                  </a>
                </div>
                <button
                  onClick={() => onKeep(l)}
                  className="shrink-0 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                >
                  Keep
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Predefined searches (check off as you run them)
        </p>
        <div className="space-y-1.5">
          {ws.searches.map((s: SearchState) => (
            <div key={s.key} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={s.ran} onChange={() => onToggleSearch(s.key)} />
                {s.label}
              </label>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary-600 hover:underline">
                open ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Kept link set ({ws.links.length}) — saved to the Site
        </p>
        {ws.links.length === 0 ? (
          <p className="text-xs text-gray-400">No links kept yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {ws.links.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  <span className="ml-2 text-[10px] uppercase text-gray-400">{l.source}</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary-600 hover:underline">
                    {l.url} ↗
                  </a>
                </div>
                <button onClick={() => onRemove(l.id)} className="shrink-0 text-xs text-gray-400 hover:text-red-600">
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-[11px] font-medium text-gray-700">Add a link you found by hand</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="min-w-[200px] flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-40 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <button
              onClick={() => {
                onAddManual(url, title);
                setUrl("");
                setTitle("");
              }}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button size="sm" onClick={onNext} disabled={ws.links.length === 0}>
          Next: Extract contacts →
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 2 — Extract
// ───────────────────────────────────────────────────────────────────────────
function ExtractStep({
  ws,
  busy,
  onExtract,
  onBack,
}: {
  ws: WorkspaceState;
  busy: boolean;
  onExtract: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        AI reads your <b>{ws.links.length}</b> kept link{ws.links.length === 1 ? "" : "s"} and drafts offices + people.
        Nothing becomes a prospect — this just fills the workspace. Re-run any time; people merge by name.
      </p>
      <ul className="space-y-1 text-xs text-gray-500">
        {ws.links.map((l) => (
          <li key={l.id} className="truncate">• {l.url}</li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={onBack}>← Back to links</Button>
        <Button size="sm" onClick={onExtract} loading={busy} disabled={ws.links.length === 0}>
          ✦ Extract contacts from kept links
        </Button>
      </div>
      {ws.offices.length > 0 && (
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Workspace currently has {ws.offices.length} office{ws.offices.length === 1 ? "" : "s"} —
          go to <b>Verify</b> to edit them.
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 3 — Verify
// ───────────────────────────────────────────────────────────────────────────
function VerifyStep({
  ws,
  subtype,
  onAddOffice,
  onRemoveOffice,
  onPatchOffice,
  onAddMember,
  onPatchMember,
  onRemoveMember,
  onMoveMember,
  onNext,
}: {
  ws: WorkspaceState;
  subtype: PartnerSubtype;
  onAddOffice: () => void;
  onRemoveOffice: (oid: string) => void;
  onPatchOffice: (oid: string, patch: Partial<WorkspaceOffice>) => void;
  onAddMember: (oid: string) => void;
  onPatchMember: (oid: string, mid: string, patch: Partial<WorkspaceMember>) => void;
  onRemoveMember: (oid: string, mid: string) => void;
  onMoveMember: (fromOid: string, mid: string, toOid: string) => void;
  onNext: () => void;
}) {
  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";
  const noun = subtype === "student_org" ? "organization" : subtype === "dept_head" ? "department" : "office";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Edit everything here — this is the source of truth. Move people between {noun}s, create new ones, fix every field.
        </p>
        <Button size="sm" variant="ghost" onClick={onAddOffice}>+ New {noun}</Button>
      </div>

      {ws.offices.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          No {noun}s yet. Run Extract, or add one by hand.
        </p>
      ) : (
        ws.offices.map((o) => (
          <div key={o.id} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <input
                value={o.name}
                onChange={(e) => onPatchOffice(o.id, { name: e.target.value })}
                className={`${input} flex-1 font-medium`}
                placeholder={`${noun} name`}
              />
              <button onClick={() => onRemoveOffice(o.id)} className="text-xs text-gray-400 hover:text-red-600">
                remove {noun}
              </button>
            </div>
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={o.general_email ?? ""}
                onChange={(e) => onPatchOffice(o.id, { general_email: e.target.value })}
                className={input}
                placeholder="General email"
              />
              <input
                value={o.general_phone ?? ""}
                onChange={(e) => onPatchOffice(o.id, { general_phone: e.target.value })}
                className={input}
                placeholder="General phone"
              />
              <input
                value={o.website ?? ""}
                onChange={(e) => onPatchOffice(o.id, { website: e.target.value })}
                className={input}
                placeholder="Website"
              />
            </div>
            <input
              value={o.notes ?? ""}
              onChange={(e) => onPatchOffice(o.id, { notes: e.target.value })}
              className={`${input} mb-3 w-full`}
              placeholder="Notes"
            />

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                People ({o.members.length})
              </p>
              <button onClick={() => onAddMember(o.id)} className="text-xs font-medium text-primary-600 hover:underline">
                + Add person
              </button>
            </div>
            <div className="mt-1 space-y-2">
              {o.members.map((m) => (
                <div key={m.id} className="rounded border border-gray-100 bg-gray-50/60 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    <input value={m.name ?? ""} onChange={(e) => onPatchMember(o.id, m.id, { name: e.target.value })} className={`${input} w-32`} placeholder="Name" />
                    <input value={m.role ?? ""} onChange={(e) => onPatchMember(o.id, m.id, { role: e.target.value })} className={`${input} w-32`} placeholder="Role" />
                    <input value={m.email ?? ""} onChange={(e) => onPatchMember(o.id, m.id, { email: e.target.value })} className={`${input} w-44`} placeholder="Email" />
                    <input value={m.phone ?? ""} onChange={(e) => onPatchMember(o.id, m.id, { phone: e.target.value })} className={`${input} w-32`} placeholder="Phone" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input
                      value={m.notes ?? ""}
                      onChange={(e) => onPatchMember(o.id, m.id, { notes: e.target.value })}
                      className={`${input} min-w-[160px] flex-1`}
                      placeholder="Notes"
                    />
                    {m.source_url && (
                      <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-600 hover:underline">
                        src ↗
                      </a>
                    )}
                    {ws.offices.length > 1 && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && onMoveMember(o.id, m.id, e.target.value)}
                        className="rounded border border-gray-200 bg-white px-1 py-1 text-[11px] text-gray-600"
                        title="Move to another office"
                      >
                        <option value="">Move to…</option>
                        {ws.offices.filter((x) => x.id !== o.id).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => onRemoveMember(o.id, m.id)} className="text-[11px] text-gray-400 hover:text-red-600">
                      remove
                    </button>
                  </div>
                </div>
              ))}
              {o.members.length === 0 && (
                <p className="text-[11px] text-gray-400">No people yet — add the advisors/staff you found.</p>
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={onNext}>Next: Final review →</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 4 — Review
// ───────────────────────────────────────────────────────────────────────────
function ReviewStep({ ws, totalPeople, onNext }: { ws: WorkspaceState; totalPeople: number; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">This is the source of truth before outreach.</p>
      {ws.offices.map((o) => {
        const noEmail = o.members.filter((m) => !m.email).length;
        return (
          <div key={o.id} className="rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">{o.name}</p>
            <p className="text-xs text-gray-500">
              {o.general_email ? `✉ ${o.general_email}` : "no general email"}
              {o.general_phone ? `   ☎ ${o.general_phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              People: {o.members.length === 0 ? "none" : o.members.map((m) => m.name || m.email || "—").join(", ")}
            </p>
            {noEmail > 0 && (
              <p className="mt-0.5 text-[11px] text-amber-600">⚠ {noEmail} {noEmail === 1 ? "person has" : "people have"} no email — fine, kept for reference.</p>
            )}
          </div>
        );
      })}
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-700">Research links ({ws.links.length})</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {ws.links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              {l.title} ↗
            </a>
          ))}
        </div>
        <p className="mt-2 text-gray-500">{ws.offices.length} office(s) · {totalPeople} people</p>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={onNext}>Looks right → attest</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 5 — Attest
// ───────────────────────────────────────────────────────────────────────────
function AttestStep({
  items,
  attest,
  setAttest,
  allDone,
  complete,
  busy,
  onSave,
  onComplete,
}: {
  items: { key: string; label: string }[];
  attest: Record<string, boolean>;
  setAttest: (fn: (s: Record<string, boolean>) => Record<string, boolean>) => void;
  allDone: boolean;
  complete: boolean;
  busy: boolean;
  onSave: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      {complete && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ This category is marked complete. You can still edit and re-save.
        </p>
      )}
      <div className="space-y-2">
        {items.map((i) => (
          <label key={i.key} className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!!attest[i.key]}
              onChange={(e) => setAttest((s) => ({ ...s, [i.key]: e.target.checked }))}
              className="mt-1"
            />
            {i.label}
          </label>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">
        The Site card clears the In-Basket only when Advising + Orgs + Dept heads are all complete.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onSave} loading={busy}>Save progress</Button>
        <Button size="sm" onClick={onComplete} loading={busy} disabled={!allDone}>
          Mark category complete →
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 6 — Generate
// ───────────────────────────────────────────────────────────────────────────
function GenerateStep({
  ws,
  gen,
  setGen,
  busy,
  onGenerate,
}: {
  ws: WorkspaceState;
  gen: Record<string, { office: boolean; members: Set<string> }>;
  setGen: (fn: (s: Record<string, { office: boolean; members: Set<string> }>) => Record<string, { office: boolean; members: Set<string> }>) => void;
  busy: boolean;
  onGenerate: () => void;
}) {
  const toggleOffice = (oid: string) =>
    setGen((s) => ({ ...s, [oid]: { office: !(s[oid]?.office ?? false), members: s[oid]?.members ?? new Set() } }));
  const toggleMember = (oid: string, mid: string) =>
    setGen((s) => {
      const cur = s[oid] ?? { office: false, members: new Set<string>() };
      const members = new Set(cur.members);
      if (members.has(mid)) members.delete(mid);
      else members.add(mid);
      return { ...s, [oid]: { ...cur, members } };
    });

  const prospectCount = ws.offices.filter(
    (o) => gen[o.id]?.office || (gen[o.id]?.members?.size ?? 0) > 0,
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Pick who outreach goes to. The office general contact is the default; promote specific people
        only when you mean to email them directly. Everyone else stays on the Site record for reference.
      </p>

      {ws.generated_at && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ Prospects generated. Generating again creates additional prospect rows.
        </p>
      )}

      {ws.offices.map((o) => (
        <div key={o.id} className="rounded-lg border border-gray-200 p-3">
          <p className="font-medium text-gray-900">{o.name}</p>
          <label className="mt-1 flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={gen[o.id]?.office ?? false}
              disabled={!o.general_email}
              onChange={() => toggleOffice(o.id)}
            />
            Office general contact
            {o.general_email ? <span className="text-gray-500"> → {o.general_email}</span> : <span className="text-gray-400"> (no email)</span>}
          </label>
          {o.members.map((m) => (
            <label key={m.id} className="mt-1 flex items-center gap-2 pl-5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={gen[o.id]?.members?.has(m.id) ?? false}
                disabled={!m.email}
                onChange={() => toggleMember(o.id, m.id)}
              />
              {m.name || "(unnamed)"}{m.role ? ` (${m.role})` : ""}
              {m.email ? <span className="text-gray-500"> → {m.email}</span> : <span className="text-gray-400"> (no email)</span>}
            </label>
          ))}
        </div>
      ))}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {prospectCount} prospect{prospectCount === 1 ? "" : "s"} will be created.
        </span>
        <Button size="sm" onClick={onGenerate} loading={busy} disabled={prospectCount === 0}>
          Generate {prospectCount} prospect{prospectCount === 1 ? "" : "s"} →
        </Button>
      </div>
    </div>
  );
}
