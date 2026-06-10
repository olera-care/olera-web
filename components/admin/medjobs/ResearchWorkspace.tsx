"use client";

/**
 * ResearchWorkspace — the single surface for partner prospecting.
 *
 *   ① Links            Confirm the approved link set (flagship advising pages).
 *   ② Extract & Verify The per-link microscope: each link is a section, its
 *                      contacts sit under it, and a "confirmed nothing's missing"
 *                      sign-off sits below those cards. Auto-extracts on open;
 *                      re-extract a page or add a new one inline.
 *   ③ Generate         Final prospect cards (Edit + source link) → In-Basket.
 *
 * State lives on student_outreach_campuses.partner_research.workspace[subtype]
 * (no student_outreach rows until Generate). See lib/medjobs/research-workspace.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { PartnerSubtype, PartnerCandidate } from "@/lib/medjobs/partner-sourcing";
import {
  contactsFromCandidate,
  emptyWorkspace,
  isGeneralContact,
  mergeSearches,
  predefinedSearches,
  wsId,
  INDIVIDUAL,
  UNASSIGNED,
  type SearchState,
  type WorkspaceContact,
  type WorkspaceLink,
  type WorkspaceOffice,
  type WorkspaceState,
} from "@/lib/medjobs/research-workspace";

type Step = "links" | "work" | "generate";

const STEPS: { key: Step; label: string }[] = [
  { key: "links", label: "Links" },
  { key: "work", label: "Extract & Verify" },
  { key: "generate", label: "Generate" },
];

const SUBTYPES: { key: PartnerSubtype; label: string }[] = [
  { key: "advisor", label: "Advising offices" },
  { key: "student_org", label: "Student orgs" },
  { key: "dept_head", label: "Department heads" },
];

const NEW_OFFICE = "__new__";

function bodyError(body: unknown, fallback: string): string {
  const e = (body as { error?: unknown } | null)?.error;
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

interface Props {
  campusSlug: string;
  universityName: string;
  onClose: () => void;
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

  const [suggested, setSuggested] = useState<WorkspaceLink[]>([]);
  const [extracting, setExtracting] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [outreach, setOutreach] = useState<Set<string>>(new Set());

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
  const save = useCallback(async () => {
    const cur = wsRef.current;
    try {
      const res = await fetch("/api/admin/medjobs/research-workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          subtype,
          workspace: { links: cur.links, searches: cur.searches, contacts: cur.contacts, offices: cur.offices },
        }),
      });
      if (!res.ok) throw new Error(bodyError(await res.json().catch(() => null), "Save failed"));
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }, [campusSlug, subtype]);

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
      const kept = new Set(ws.links.map((l) => l.url));
      setSuggested(
        (d.sources ?? [])
          .filter((s: { url?: string }) => s.url && !kept.has(s.url))
          .map((s: { title?: string; url: string; tier?: WorkspaceLink["tier"]; why?: string; likely?: string }) => ({
            id: wsId(),
            title: s.title ?? s.url,
            url: s.url,
            tier: s.tier ?? null,
            why: s.why ?? null,
            likely: s.likely ?? null,
            source: "ai" as const,
          })),
      );
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
    setWs((w) => ({
      ...w,
      links: w.links.filter((l) => l.id !== id),
      contacts: w.contacts.filter((c) => c.source_link_id !== id),
    }));
  const addManualLink = (url: string, title: string): WorkspaceLink | null => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setError("Paste a valid http(s) link.");
      return null;
    }
    const link: WorkspaceLink = { id: wsId(), url: clean, title: title.trim() || clean, source: "manual", tier: null };
    setWs((w) => ({ ...w, links: [...w.links, link] }));
    return link;
  };
  const toggleSearch = (key: string) =>
    setWs((w) => ({ ...w, searches: w.searches.map((s) => (s.key === key ? { ...s, ran: !s.ran } : s)) }));

  // ── step 2: extract & verify ──────────────────────────────────────────
  const extractLink = useCallback(
    async (linkId: string) => {
      const link = wsRef.current.links.find((l) => l.id === linkId);
      if (!link) return;
      setExtracting((s) => new Set(s).add(linkId));
      try {
        const res = await fetch("/api/admin/medjobs/source-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campus_slug: campusSlug, subtype, stage: "extract_url", url: link.url }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) throw new Error(bodyError(d, "Couldn't read that page"));
        const cands = (d?.candidates ?? []) as PartnerCandidate[];
        setWs((w) => {
          const offices = [...w.offices];
          const emails = new Set(
            w.contacts.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[],
          );
          const add: WorkspaceContact[] = [];
          for (const c of cands) {
            const { contacts, officeName } = contactsFromCandidate(c, linkId);
            if (officeName) {
              const key = officeName.trim().toLowerCase();
              if (!offices.some((o) => o.name.trim().toLowerCase() === key)) {
                offices.push({ id: wsId(), name: officeName });
              }
            }
            for (const ct of contacts) {
              const em = ct.email?.toLowerCase();
              if (em && emails.has(em)) continue;
              if (em) emails.add(em);
              add.push(ct);
            }
          }
          return {
            ...w,
            offices,
            contacts: [...w.contacts, ...add],
            links: w.links.map((l) => (l.id === linkId ? { ...l, extracted: true } : l)),
          };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Extract failed");
        // Still mark extracted so auto-extract doesn't loop on a bad page.
        setWs((w) => ({ ...w, links: w.links.map((l) => (l.id === linkId ? { ...l, extracted: true } : l)) }));
      } finally {
        setExtracting((s) => {
          const next = new Set(s);
          next.delete(linkId);
          return next;
        });
      }
    },
    [campusSlug, subtype],
  );

  // Auto-extract any not-yet-extracted link whenever Step 2 opens (idempotent —
  // already-extracted links are skipped, so re-entering or adding a link in
  // Step 1 then returning picks up only the new pages).
  const autoPass = useRef(false);
  useEffect(() => {
    if (step !== "work") {
      autoPass.current = false;
      return;
    }
    if (loading || autoPass.current) return;
    autoPass.current = true;
    (async () => {
      for (const l of wsRef.current.links) {
        if (!l.extracted) await extractLink(l.id);
      }
    })();
  }, [step, loading, extractLink]);

  const addLinkAndExtract = async (url: string, title: string) => {
    const link = addManualLink(url, title);
    if (link) await extractLink(link.id);
  };

  // contact + office mutations
  const patchContact = (id: string, patch: Partial<WorkspaceContact>) =>
    setWs((w) => ({ ...w, contacts: w.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const removeContact = (id: string) =>
    setWs((w) => ({ ...w, contacts: w.contacts.filter((c) => c.id !== id) }));
  const addContact = (linkId: string | null) =>
    setWs((w) => ({
      ...w,
      contacts: [...w.contacts, { id: wsId(), source_link_id: linkId, name: "", assignment: UNASSIGNED }],
    }));
  const createOfficeAnd = (name: string, assignIds: string[]): string => {
    const office: WorkspaceOffice = { id: wsId(), name: name.trim() };
    setWs((w) => ({
      ...w,
      offices: [...w.offices, office],
      contacts: w.contacts.map((c) => (assignIds.includes(c.id) ? { ...c, assignment: office.id } : c)),
    }));
    return office.id;
  };
  const assignContact = (id: string, value: string) => {
    if (value === NEW_OFFICE) {
      const name = window.prompt("New office name");
      if (name?.trim()) createOfficeAnd(name, [id]);
      return;
    }
    patchContact(id, { assignment: value });
  };
  const bulkAssign = (linkId: string, value: string) => {
    const ids = ws.contacts.filter((c) => c.source_link_id === linkId && !c.assignment).map((c) => c.id);
    if (ids.length === 0) return;
    if (value === NEW_OFFICE) {
      const name = window.prompt("New office name");
      if (name?.trim()) createOfficeAnd(name, ids);
      return;
    }
    setWs((w) => ({ ...w, contacts: w.contacts.map((c) => (ids.includes(c.id) ? { ...c, assignment: value } : c)) }));
  };
  const setConfirmed = (linkId: string, confirmed: boolean) => {
    setWs((w) => ({ ...w, links: w.links.map((l) => (l.id === linkId ? { ...l, confirmed } : l)) }));
    if (confirmed) setExpanded((s) => { const n = new Set(s); n.delete(linkId); return n; });
    else setExpanded((s) => new Set(s).add(linkId));
  };

  const allConfirmed = ws.links.length > 0 && ws.links.every((l) => l.confirmed);

  // ── step 3: generate ──────────────────────────────────────────────────
  const officeGroups = useMemo(() => {
    const byOffice = new Map<string, WorkspaceContact[]>();
    const individuals: WorkspaceContact[] = [];
    for (const c of ws.contacts) {
      if (c.assignment === INDIVIDUAL) individuals.push(c);
      else if (c.assignment) {
        const list = byOffice.get(c.assignment) ?? [];
        list.push(c);
        byOffice.set(c.assignment, list);
      }
    }
    return { byOffice, individuals };
  }, [ws.contacts]);

  // Default outreach selection on entering generate: each office's general
  // contact (or its first contact if no general).
  useEffect(() => {
    if (step !== "generate") return;
    setOutreach((cur) => {
      if (cur.size > 0) return cur;
      const next = new Set<string>();
      for (const [, members] of officeGroups.byOffice) {
        const general = members.find(isGeneralContact) ?? members[0];
        if (general) next.add(general.id);
      }
      return next;
    });
  }, [step, officeGroups]);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await save();
      const ids = [...outreach];
      const res = await fetch("/api/admin/medjobs/research-workspace/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, outreach_contact_ids: ids }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyError(d, "Generate failed"));
      // Mark this category complete (sets research_complete when all 3 done).
      await fetch(`/api/admin/student-outreach/campuses/${campusSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_audit: { subtype, steps: { generated: true }, complete: true } }),
      });
      setWs((w) => ({ ...w, generated_at: new Date().toISOString() }));
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }, [campusSlug, subtype, outreach, save, onChanged]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // ── render ────────────────────────────────────────────────────────────
  const header = (
    <div className="flex-1">
      <h2 className="text-lg font-semibold text-gray-900">Research · {universityName}</h2>
      <div className="mt-1 flex items-center gap-2">
        {SUBTYPES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              autoPass.current = false;
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
      <div className="sticky top-0 z-10 -mx-5 mb-4 border-b border-gray-100 bg-white px-5 py-2 sm:-mx-7 sm:px-7">
        <div className="flex items-center gap-1 text-xs">
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
          <span className="ml-auto shrink-0 text-[11px] text-gray-400">{savedAt ? `Saved ${savedAt}` : "Autosaves"}</span>
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
              onNext={() => setStep("work")}
            />
          )}
          {step === "work" && (
            <WorkStep
              ws={ws}
              extracting={extracting}
              expanded={expanded}
              setExpanded={setExpanded}
              allConfirmed={allConfirmed}
              onExtractLink={extractLink}
              onAddContact={addContact}
              onPatchContact={patchContact}
              onRemoveContact={removeContact}
              onAssign={assignContact}
              onBulkAssign={bulkAssign}
              onSetConfirmed={setConfirmed}
              onAddLinkAndExtract={addLinkAndExtract}
              onNext={() => setStep("generate")}
            />
          )}
          {step === "generate" && (
            <GenerateStep
              ws={ws}
              groups={officeGroups}
              outreach={outreach}
              setOutreach={setOutreach}
              busy={busy}
              onPatchContact={patchContact}
              onGenerate={generate}
              onReview={() => setStep("work")}
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
  onAddManual: (url: string, title: string) => WorkspaceLink | null;
  onToggleSearch: (key: string) => void;
  onNext: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Build the best set of source pages. Nothing is saved to the Site until you <b>Keep</b> it.
      </p>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested by AI — flagship advising pages</p>
          <Button size="sm" variant="ghost" onClick={onSuggest} loading={busy}>✦ Suggest links</Button>
        </div>
        {suggested.length === 0 ? (
          <p className="text-xs text-gray-400">Click “Suggest links” for a few flagship advising pages, then keep the good ones.</p>
        ) : (
          <ul className="space-y-1.5">
            {suggested.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  {(l.why || l.likely) && (
                    <span className="block text-[11px] text-gray-500">
                      {l.why}{l.why && l.likely ? " · " : ""}{l.likely ? <span className="text-gray-400">likely: {l.likely}</span> : null}
                    </span>
                  )}
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">{l.url} ↗</a>
                </div>
                <button onClick={() => onKeep(l)} className="shrink-0 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100">Keep</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Predefined searches — check off as you run them</p>
        <div className="space-y-1.5">
          {ws.searches.map((s: SearchState) => (
            <div key={s.key} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={s.ran} onChange={() => onToggleSearch(s.key)} />
                {s.label}
              </label>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary-600 hover:underline">open ↗</a>
            </div>
          ))}
        </div>
        {/* Add-a-link sits right under the searches — run a search, find a page, paste it. */}
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-[11px] font-medium text-gray-700">Add a link you found by hand</p>
          <div className="flex flex-wrap gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="min-w-[200px] flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-40 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
            <button onClick={() => { if (onAddManual(url, title)) { setUrl(""); setTitle(""); } }} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">Add</button>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Kept link set ({ws.links.length}) — saved to the Site</p>
        {ws.links.length === 0 ? (
          <p className="text-xs text-gray-400">No links kept yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {ws.links.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  <span className="ml-2 text-[10px] uppercase text-gray-400">{l.source}</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary-600 hover:underline">{l.url} ↗</a>
                </div>
                <button onClick={() => onRemove(l.id)} className="shrink-0 text-xs text-gray-400 hover:text-red-600">remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <Button size="sm" onClick={onNext} disabled={ws.links.length === 0}>Next: Extract &amp; verify →</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 2 — Extract & Verify (the per-link microscope)
// ───────────────────────────────────────────────────────────────────────────
function WorkStep({
  ws,
  extracting,
  expanded,
  setExpanded,
  allConfirmed,
  onExtractLink,
  onAddContact,
  onPatchContact,
  onRemoveContact,
  onAssign,
  onBulkAssign,
  onSetConfirmed,
  onAddLinkAndExtract,
  onNext,
}: {
  ws: WorkspaceState;
  extracting: Set<string>;
  expanded: Set<string>;
  setExpanded: (fn: (s: Set<string>) => Set<string>) => void;
  allConfirmed: boolean;
  onExtractLink: (id: string) => void;
  onAddContact: (linkId: string | null) => void;
  onPatchContact: (id: string, patch: Partial<WorkspaceContact>) => void;
  onRemoveContact: (id: string) => void;
  onAssign: (id: string, value: string) => void;
  onBulkAssign: (linkId: string, value: string) => void;
  onSetConfirmed: (linkId: string, confirmed: boolean) => void;
  onAddLinkAndExtract: (url: string, title: string) => void;
  onNext: () => void;
}) {
  const [newUrl, setNewUrl] = useState("");
  const confirmedCount = ws.links.filter((l) => l.confirmed).length;
  const byHand = ws.contacts.filter((c) => c.source_link_id === null);

  // Office roll-up.
  const officeCounts = new Map<string, number>();
  let individualCount = 0;
  let unassignedCount = 0;
  for (const c of ws.contacts) {
    if (c.assignment === INDIVIDUAL) individualCount += 1;
    else if (c.assignment) officeCounts.set(c.assignment, (officeCounts.get(c.assignment) ?? 0) + 1);
    else unassignedCount += 1;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Work each page: reopen it, check the contacts we pulled, fix or add, assign each to an office,
        then confirm. New pages you find extract right here.
      </p>

      {ws.links.map((link) => {
        const contacts = ws.contacts.filter((c) => c.source_link_id === link.id);
        const isExtracting = extracting.has(link.id);
        const open = !link.confirmed || expanded.has(link.id);
        const unassigned = contacts.filter((c) => !c.assignment).length;
        return (
          <div key={link.id} className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <button
                onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(link.id)) n.delete(link.id); else n.add(link.id); return n; })}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <span className="text-gray-400">{open ? "▼" : "▸"}</span>
                <span className="truncate text-sm font-medium text-gray-900">{link.title}</span>
                {link.confirmed && <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">confirmed ✓</span>}
                <span className="shrink-0 text-[11px] text-gray-400">{isExtracting ? "extracting…" : `${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}</span>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">open ↗</a>
                <button onClick={() => onExtractLink(link.id)} disabled={isExtracting} className="text-xs text-gray-500 hover:underline disabled:opacity-50">✦ re-extract</button>
              </div>
            </div>

            {open && (
              <div className="space-y-2 border-t border-gray-100 px-3 py-2">
                {contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} offices={ws.offices} onPatch={onPatchContact} onRemove={onRemoveContact} onAssign={onAssign} />
                ))}
                {contacts.length === 0 && !isExtracting && (
                  <p className="text-[11px] text-gray-400">No contacts found on this page — add by hand, or it had none.</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button onClick={() => onAddContact(link.id)} className="text-xs font-medium text-primary-600 hover:underline">+ Add a contact you see on this page</button>
                  {unassigned > 0 && (
                    <label className="flex items-center gap-1 text-[11px] text-gray-500">
                      assign all unassigned →
                      <select defaultValue="" onChange={(e) => { onBulkAssign(link.id, e.target.value); e.target.value = ""; }} className="rounded border border-gray-200 bg-white px-1 py-0.5">
                        <option value="" disabled>office…</option>
                        {ws.offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        <option value={INDIVIDUAL}>Individual</option>
                        <option value={NEW_OFFICE}>+ New office…</option>
                      </select>
                    </label>
                  )}
                </div>
                <label
                  className={`mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    unassigned > 0 ? "border-gray-100 text-gray-400" : "border-gray-200 text-gray-800"
                  }`}
                  title={unassigned > 0 ? "Assign every contact to an office or individual first." : undefined}
                >
                  <input type="checkbox" checked={!!link.confirmed} disabled={unassigned > 0} onChange={(e) => onSetConfirmed(link.id, e.target.checked)} />
                  I reopened this page and confirmed nothing&apos;s missing
                  {unassigned > 0 && <span className="text-[11px]">— assign {unassigned} contact{unassigned === 1 ? "" : "s"} first</span>}
                </label>
              </div>
            )}
          </div>
        );
      })}

      {byHand.length > 0 && (
        <div className="rounded-lg border border-gray-200 px-3 py-2">
          <p className="mb-2 text-sm font-medium text-gray-900">Added by hand</p>
          <div className="space-y-2">
            {byHand.map((c) => (
              <ContactCard key={c.id} contact={c} offices={ws.offices} onPatch={onPatchContact} onRemove={onRemoveContact} onAssign={onAssign} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
        <p className="mb-1 text-[11px] font-medium text-gray-700">Add a link you found while verifying</p>
        <div className="flex flex-wrap gap-2">
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://…" className="min-w-[220px] flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
          <button onClick={() => { if (newUrl.trim()) { onAddLinkAndExtract(newUrl, ""); setNewUrl(""); } }} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">Extract →</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">
          Offices so far: {ws.offices.filter((o) => (officeCounts.get(o.id) ?? 0) > 0).map((o) => `${o.name} (${officeCounts.get(o.id)})`).join(" · ") || "none"}
          {individualCount > 0 ? ` · Individuals (${individualCount})` : ""}
          {unassignedCount > 0 ? ` · ${unassignedCount} unassigned` : ""}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{confirmedCount} of {ws.links.length} pages confirmed</span>
          <Button size="sm" onClick={onNext} disabled={!allConfirmed}>Next: Generate →</Button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  contact: c,
  offices,
  onPatch,
  onRemove,
  onAssign,
}: {
  contact: WorkspaceContact;
  offices: WorkspaceOffice[];
  onPatch: (id: string, patch: Partial<WorkspaceContact>) => void;
  onRemove: (id: string) => void;
  onAssign: (id: string, value: string) => void;
}) {
  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";
  return (
    <div className="rounded border border-gray-100 bg-gray-50/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        <input value={c.name ?? ""} onChange={(e) => onPatch(c.id, { name: e.target.value })} className={`${input} w-32`} placeholder="Name" />
        <input value={c.role ?? ""} onChange={(e) => onPatch(c.id, { role: e.target.value })} className={`${input} w-32`} placeholder="Role" />
        <input value={c.email ?? ""} onChange={(e) => onPatch(c.id, { email: e.target.value })} className={`${input} w-44`} placeholder="Email" />
        <input value={c.phone ?? ""} onChange={(e) => onPatch(c.id, { phone: e.target.value })} className={`${input} w-28`} placeholder="Phone" />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[11px] text-gray-600">
          assign →
          <select
            value={c.assignment === INDIVIDUAL || offices.some((o) => o.id === c.assignment) ? c.assignment : ""}
            onChange={(e) => onAssign(c.id, e.target.value)}
            className={`rounded border px-1 py-0.5 ${c.assignment ? "border-gray-200 text-gray-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}
          >
            <option value="">Choose office…</option>
            {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            <option value={INDIVIDUAL}>Individual (no office)</option>
            <option value={NEW_OFFICE}>+ New office…</option>
          </select>
        </label>
        {c.source_url && <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-600 hover:underline">src ↗</a>}
        <button onClick={() => onRemove(c.id)} className="ml-auto text-[11px] text-gray-400 hover:text-red-600">remove</button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 3 — Generate
// ───────────────────────────────────────────────────────────────────────────
function GenerateStep({
  ws,
  groups,
  outreach,
  setOutreach,
  busy,
  onPatchContact,
  onGenerate,
  onReview,
}: {
  ws: WorkspaceState;
  groups: { byOffice: Map<string, WorkspaceContact[]>; individuals: WorkspaceContact[] };
  outreach: Set<string>;
  setOutreach: (fn: (s: Set<string>) => Set<string>) => void;
  busy: boolean;
  onPatchContact: (id: string, patch: Partial<WorkspaceContact>) => void;
  onGenerate: () => void;
  onReview: () => void;
}) {
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const officeName = new Map(ws.offices.map((o) => [o.id, o.name]));
  const toggle = (id: string) =>
    setOutreach((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleEdit = (id: string) =>
    setEditing((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const linkById = new Map(ws.links.map((l) => [l.id, l]));
  const sourcesFor = (members: WorkspaceContact[]) => {
    const seen = new Set<string>();
    const out: WorkspaceLink[] = [];
    for (const m of members) {
      if (m.source_link_id && !seen.has(m.source_link_id)) {
        seen.add(m.source_link_id);
        const l = linkById.get(m.source_link_id);
        if (l) out.push(l);
      }
    }
    return out;
  };

  const prospectCount =
    [...groups.byOffice.values()].filter((ms) => ms.some((m) => outreach.has(m.id))).length +
    groups.individuals.filter((c) => outreach.has(c.id)).length;

  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";
  const editFields = (c: WorkspaceContact) => (
    <div className="mt-1 flex flex-wrap gap-1.5 pl-6">
      <input value={c.name ?? ""} onChange={(e) => onPatchContact(c.id, { name: e.target.value })} className={`${input} w-32`} placeholder="Name" />
      <input value={c.role ?? ""} onChange={(e) => onPatchContact(c.id, { role: e.target.value })} className={`${input} w-32`} placeholder="Role" />
      <input value={c.email ?? ""} onChange={(e) => onPatchContact(c.id, { email: e.target.value })} className={`${input} w-44`} placeholder="Email" />
      <input value={c.phone ?? ""} onChange={(e) => onPatchContact(c.id, { phone: e.target.value })} className={`${input} w-28`} placeholder="Phone" />
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        These become prospects you can start outreach to. Edit anything, peek at the source once more,
        then generate. The office general contact is the default; promote specific people only when you
        mean to email them directly.
      </p>

      {ws.generated_at && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ Prospects generated. Generating again creates additional prospect rows.
        </p>
      )}

      {[...groups.byOffice.entries()].map(([oid, members]) => {
        const general = members.find(isGeneralContact);
        const people = members.filter((m) => !isGeneralContact(m));
        const isEditing = editing.has(oid);
        return (
          <div key={oid} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{officeName.get(oid) ?? "Office"}</p>
              <button onClick={() => toggleEdit(oid)} className="text-xs text-primary-600 hover:underline">{isEditing ? "Done" : "Edit ▾"}</button>
            </div>
            {general && (
              <div>
                <label className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" checked={outreach.has(general.id)} disabled={!general.email} onChange={() => toggle(general.id)} />
                  Office general contact{general.email ? <span className="text-gray-500"> → {general.email}</span> : <span className="text-gray-400"> (no email)</span>}
                </label>
                {isEditing && editFields(general)}
              </div>
            )}
            {people.map((m) => (
              <div key={m.id}>
                <label className="mt-1 flex items-center gap-2 pl-5 text-sm text-gray-700">
                  <input type="checkbox" checked={outreach.has(m.id)} disabled={!m.email} onChange={() => toggle(m.id)} />
                  {m.name || "(unnamed)"}{m.role ? ` (${m.role})` : ""}{m.email ? <span className="text-gray-500"> → {m.email}</span> : <span className="text-gray-400"> (no email)</span>}
                </label>
                {isEditing && editFields(m)}
              </div>
            ))}
            <p className="mt-2 text-[11px] text-gray-400">
              sources: {sourcesFor(members).map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline"> {l.title} ↗ </a>
              )) || "—"}
            </p>
          </div>
        );
      })}

      {groups.individuals.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="font-medium text-gray-900">Individuals</p>
          {groups.individuals.map((c) => {
            const isEditing = editing.has(c.id);
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between">
                  <label className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={outreach.has(c.id)} disabled={!c.email} onChange={() => toggle(c.id)} />
                    {c.name || "(unnamed)"}{c.role ? ` (${c.role})` : ""}{c.email ? <span className="text-gray-500"> → {c.email}</span> : <span className="text-gray-400"> (no email)</span>}
                  </label>
                  <button onClick={() => toggleEdit(c.id)} className="text-xs text-primary-600 hover:underline">{isEditing ? "Done" : "Edit ▾"}</button>
                </div>
                {isEditing && editFields(c)}
              </div>
            );
          })}
        </div>
      )}

      {groups.byOffice.size === 0 && groups.individuals.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          No contacts assigned yet. <button onClick={onReview} className="text-primary-600 hover:underline">Back to Extract &amp; Verify</button> to assign them.
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button onClick={onReview} className="text-xs text-gray-500 hover:underline">← Back to Extract &amp; Verify</button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{prospectCount} prospect{prospectCount === 1 ? "" : "s"} → In-Basket</span>
          <Button size="sm" onClick={onGenerate} loading={busy} disabled={prospectCount === 0}>
            Generate {prospectCount} → In-Basket
          </Button>
        </div>
      </div>
    </div>
  );
}
