"use client";

/**
 * ResearchWorkspace — office-centric partner prospecting.
 *
 *   ① Find offices    Gather a few pages that reveal the advising office(s).
 *   ② Verify offices  Office cards: confirm name + email + tag. Optional ask-for
 *                     names and high-bar latched advisors. The office is the prospect.
 *   ③ Generate        Verified offices → prospects in the In-Basket.
 *
 * State lives on student_outreach_campuses.partner_research.workspace[subtype].
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { PartnerSubtype, ExtractedOffice, SocialLink } from "@/lib/medjobs/partner-sourcing";
import {
  emptyWorkspace,
  mergeSearches,
  normOffice,
  predefinedSearches,
  wsId,
  OFFICE_TAGS,
  type OfficeTag,
  type SearchState,
  type WorkspaceAdvisor,
  type WorkspaceLink,
  type WorkspaceOffice,
  type WorkspaceState,
} from "@/lib/medjobs/research-workspace";

type Step = "links" | "offices" | "generate";

const STEPS: { key: Step; label: string }[] = [
  { key: "links", label: "Find offices" },
  { key: "offices", label: "Verify offices" },
  { key: "generate", label: "Generate" },
];

// Dept heads are person-shaped (one chair per department), so the office-centric
// labels read wrong for them. Relabel without forking the step machinery.
function stepLabel(key: Step, subtype: PartnerSubtype): string {
  if (subtype === "dept_head") {
    if (key === "links") return "Find departments";
    if (key === "offices") return "Verify chairs";
  }
  if (subtype === "student_org") {
    if (key === "links") return "Find organizations";
    if (key === "offices") return "Verify orgs";
  }
  return STEPS.find((s) => s.key === key)?.label ?? key;
}

const SUBTYPES: { key: PartnerSubtype; label: string }[] = [
  { key: "advisor", label: "Advising" },
  { key: "student_org", label: "Student orgs" },
  { key: "dept_head", label: "Departments" },
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

interface Props {
  campusSlug: string;
  universityName: string;
  onClose: () => void;
  onChanged: () => void;
}

export function ResearchWorkspace({ campusSlug, universityName, onClose, onChanged }: Props) {
  const router = useRouter();
  const [done, setDone] = useState<{ created: number } | null>(null);
  const [subtype, setSubtype] = useState<PartnerSubtype>("advisor");
  const [step, setStep] = useState<Step>("links");
  const [ws, setWs] = useState<WorkspaceState>(emptyWorkspace());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [suggested, setSuggested] = useState<WorkspaceLink[]>([]);
  const [reading, setReading] = useState(false);
  const [genSel, setGenSel] = useState<Record<string, { include: boolean; advisors: Set<string> }>>({});

  // ── load ──────────────────────────────────────────────────────────────
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
          workspace: { links: cur.links, searches: cur.searches, offices: cur.offices, advisors: cur.advisors },
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
      offices: w.offices.map((o) => ({ ...o, source_link_ids: o.source_link_ids.filter((x) => x !== id) })),
    }));
  const addManualLink = (urlStr: string, title: string): WorkspaceLink | null => {
    const clean = urlStr.trim();
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

  // ── step 2: extract offices ───────────────────────────────────────────
  // Default the office tag from the WORKFLOW subtype, not the AI's guess —
  // the model sometimes tags an advising office as "department", which then
  // generated a department-head prospect. The admin can recategorize in the card.
  const defaultTag: OfficeTag =
    subtype === "student_org" ? "student_org" : subtype === "dept_head" ? "department" : "advising_office";
  const mergeExtracted = useCallback((extracted: ExtractedOffice[], linkId: string | null) => {
    setWs((w) => {
      const offices = w.offices.map((o) => ({ ...o, source_link_ids: [...o.source_link_ids], ask_for: [...o.ask_for] }));
      const advisors = [...w.advisors];
      for (const eo of extracted) {
        const key = normOffice(eo.name);
        let office = offices.find((o) => normOffice(o.name) === key);
        if (!office) {
          office = {
            id: wsId(),
            name: eo.name,
            tag: defaultTag,
            email: eo.email ?? null,
            phone: eo.phone ?? null,
            website: eo.website ?? null,
            ask_for: [...eo.ask_for],
            notes: null,
            socials: eo.socials ? [...eo.socials] : [],
            source_link_ids: linkId ? [linkId] : [],
            person_name: eo.person_name ?? null,
            person_title: eo.person_title ?? null,
          };
          offices.push(office);
        } else {
          if (!office.email) office.email = eo.email ?? null;
          if (!office.phone) office.phone = eo.phone ?? null;
          if (!office.website) office.website = eo.website ?? null;
          if (!office.person_name) office.person_name = eo.person_name ?? null;
          if (!office.person_title) office.person_title = eo.person_title ?? null;
          if ((!office.socials || office.socials.length === 0) && eo.socials?.length)
            office.socials = [...eo.socials];
          office.ask_for = [...new Set([...office.ask_for, ...eo.ask_for])].slice(0, 3);
          if (linkId && !office.source_link_ids.includes(linkId)) office.source_link_ids.push(linkId);
        }
        const seen = new Set(
          advisors.filter((a) => a.office_id === office!.id).map((a) => (a.email?.toLowerCase() || a.name?.toLowerCase() || "")),
        );
        for (const ea of eo.advisors) {
          const k = ea.email?.toLowerCase() || ea.name?.toLowerCase() || "";
          if (k && seen.has(k)) continue;
          seen.add(k);
          advisors.push({ id: wsId(), office_id: office.id, name: ea.name, role: ea.role, email: ea.email, phone: ea.phone, source_url: eo.source_url });
        }
      }
      return { ...w, offices, advisors };
    });
  }, [defaultTag]);

  const extractLink = useCallback(
    async (linkId: string) => {
      const link = wsRef.current.links.find((l) => l.id === linkId);
      if (!link) return;
      try {
        const res = await fetch("/api/admin/medjobs/source-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campus_slug: campusSlug, subtype, stage: "extract_url", url: link.url }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) throw new Error(bodyError(d, "Couldn't read a page"));
        mergeExtracted((d?.offices ?? []) as ExtractedOffice[], linkId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Extract failed");
      } finally {
        setWs((w) => ({ ...w, links: w.links.map((l) => (l.id === linkId ? { ...l, extracted: true } : l)) }));
      }
    },
    [campusSlug, subtype, mergeExtracted],
  );

  const readLinks = useCallback(
    async (onlyNew: boolean) => {
      setReading(true);
      setError(null);
      try {
        for (const l of wsRef.current.links) {
          if (onlyNew && l.extracted) continue;
          await extractLink(l.id);
        }
      } finally {
        setReading(false);
      }
    },
    [extractLink],
  );

  // Auto-read any not-yet-read links when Verify opens.
  const autoPass = useRef(false);
  useEffect(() => {
    if (step !== "offices") {
      autoPass.current = false;
      return;
    }
    if (loading || autoPass.current) return;
    autoPass.current = true;
    void readLinks(true);
  }, [step, loading, readLinks]);

  const parseOfficePage = async (urlStr: string, text: string) => {
    setReading(true);
    setError(null);
    try {
      let linkId: string | null = null;
      if (urlStr.trim() && /^https?:\/\//i.test(urlStr.trim())) {
        const link = addManualLink(urlStr, "");
        linkId = link?.id ?? null;
      }
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, stage: "parse_text", text, url: urlStr.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyError(d, "Couldn't read that text"));
      const offices = (d?.offices ?? []) as ExtractedOffice[];
      if (offices.length === 0) throw new Error("No office found in that text.");
      mergeExtracted(offices, linkId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that text");
    } finally {
      setReading(false);
    }
  };

  // office mutations
  const patchOffice = (id: string, patch: Partial<WorkspaceOffice>) =>
    setWs((w) => ({ ...w, offices: w.offices.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  const removeOffice = (id: string) =>
    setWs((w) => ({ ...w, offices: w.offices.filter((o) => o.id !== id), advisors: w.advisors.filter((a) => a.office_id !== id) }));
  const addOffice = () =>
    setWs((w) => ({
      ...w,
      offices: [...w.offices, { id: wsId(), name: "", tag: defaultTag, ask_for: [], source_link_ids: [] }],
    }));
  const addAdvisor = (officeId: string) =>
    setWs((w) => ({ ...w, advisors: [...w.advisors, { id: wsId(), office_id: officeId, name: "", role: "", email: "", phone: "" }] }));
  const patchAdvisor = (id: string, patch: Partial<WorkspaceAdvisor>) =>
    setWs((w) => ({ ...w, advisors: w.advisors.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const removeAdvisor = (id: string) =>
    setWs((w) => ({ ...w, advisors: w.advisors.filter((a) => a.id !== id) }));
  // Paste raw text about an advisor → AI structures it → latch under the office.
  const parseAdvisor = async (officeId: string, text: string) => {
    setReading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/source-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, stage: "parse_advisor", text }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyError(d, "Couldn't read that text"));
      const found = (d?.advisors ?? []) as { name?: string; role?: string; email?: string; phone?: string }[];
      if (found.length === 0) throw new Error("No advisor found in that text.");
      setWs((w) => ({
        ...w,
        advisors: [
          ...w.advisors,
          ...found.map((a) => ({ id: wsId(), office_id: officeId, name: a.name ?? null, role: a.role ?? null, email: a.email ?? null, phone: a.phone ?? null })),
        ],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that text");
    } finally {
      setReading(false);
    }
  };

  const verifiedOffices = ws.offices.filter((o) => o.verified);
  const canGenerate = verifiedOffices.length > 0;

  // ── step 3: generate ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "generate") return;
    setGenSel((cur) => {
      const next = { ...cur };
      for (const o of verifiedOffices) {
        if (!next[o.id]) next[o.id] = { include: true, advisors: new Set() };
      }
      return next;
    });
  }, [step, verifiedOffices]);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await save();
      const offices = verifiedOffices
        .filter((o) => genSel[o.id]?.include)
        .map((o) => ({ office_id: o.id, advisor_ids: [...(genSel[o.id]?.advisors ?? new Set<string>())] }));
      if (offices.length === 0) {
        setError("Select at least one office.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/medjobs/research-workspace/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_slug: campusSlug, subtype, offices }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyError(d, "Generate failed"));
      await fetch(`/api/admin/student-outreach/campuses/${campusSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_audit: { subtype, steps: { generated: true }, complete: true } }),
      });
      setWs((w) => ({ ...w, generated_at: new Date().toISOString() }));
      onChanged();
      setDone({ created: (d?.created as number) ?? offices.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }, [campusSlug, subtype, verifiedOffices, genSel, save, onChanged]);

  const finish = useCallback(() => {
    onClose();
    router.push(`/admin/student-outreach/campus/${campusSlug}`);
  }, [onClose, router, campusSlug]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

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
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i <= stepIndex ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
              {stepLabel(s.key, subtype)}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[11px] text-gray-400">{savedAt ? `Saved ${savedAt}` : "Autosaves"}</span>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {done ? (
        <div className="py-16 text-center">
          <p className="text-4xl">✓</p>
          <p className="mt-3 text-lg font-semibold text-gray-900">
            {done.created} {subtype === "dept_head" ? "chair" : subtype === "student_org" ? "organization" : "office"} prospect{done.created === 1 ? "" : "s"} created
          </p>
          <p className="mt-1 text-sm text-gray-500">
            They&apos;re in your In-Basket for {universityName}. Next:{" "}
            {subtype === "dept_head"
              ? "an optional intro call, then launch outreach."
              : subtype === "student_org"
                ? "review each org, then launch outreach."
                : "confirm each office by a quick call, then launch outreach."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button size="sm" onClick={finish}>View {universityName} prospects →</Button>
            <button onClick={() => setDone(null)} className="text-xs text-gray-500 hover:underline">Keep researching</button>
          </div>
        </div>
      ) : loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading workspace…</p>
      ) : (
        <div className="pb-6">
          {step === "links" && (
            <LinksStep ws={ws} suggested={suggested} busy={busy} onSuggest={suggestLinks} onKeep={keepLink} onRemove={removeLink} onAddManual={addManualLink} onToggleSearch={toggleSearch} onNext={() => setStep("offices")} />
          )}
          {step === "offices" && (
            <OfficesStep
              ws={ws}
              subtype={subtype}
              reading={reading}
              canGenerate={canGenerate}
              onReadLinks={() => void readLinks(false)}
              onParsePage={parseOfficePage}
              onAddOffice={addOffice}
              onPatchOffice={patchOffice}
              onRemoveOffice={removeOffice}
              onAddAdvisor={addAdvisor}
              onPatchAdvisor={patchAdvisor}
              onRemoveAdvisor={removeAdvisor}
              onParseAdvisor={parseAdvisor}
              onNext={() => setStep("generate")}
            />
          )}
          {step === "generate" && (
            <GenerateStep ws={ws} offices={verifiedOffices} genSel={genSel} setGenSel={setGenSel} busy={busy} onPatchOffice={patchOffice} onGenerate={generate} onBack={() => setStep("offices")} />
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
        Goal: gather a few pages that name an advising office and show its email/phone — pre-health first,
        then nursing/allied, then career services.
      </p>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested by AI — office pages</p>
          <Button size="sm" variant="ghost" onClick={onSuggest} loading={busy}>✦ Suggest links</Button>
        </div>
        {suggested.length === 0 ? (
          <p className="text-xs text-gray-400">Click “Suggest links” for the best office/contact pages, then keep them.</p>
        ) : (
          <ul className="space-y-1.5">
            {suggested.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  {(l.why || l.likely) && (
                    <span className="block text-[11px] text-gray-500">{l.why}{l.why && l.likely ? " · " : ""}{l.likely ? <span className="text-gray-400">likely: {l.likely}</span> : null}</span>
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
                <input type="checkbox" checked={s.ran} onChange={() => onToggleSearch(s.key)} />{s.label}
              </label>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary-600 hover:underline">open ↗</a>
            </div>
          ))}
        </div>
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Kept links ({ws.links.length})</p>
        {ws.links.length === 0 ? (
          <p className="text-xs text-gray-400">No links kept yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {ws.links.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-800">{l.title}</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary-600 hover:underline">{l.url} ↗</a>
                </div>
                <button onClick={() => onRemove(l.id)} className="shrink-0 text-xs text-gray-400 hover:text-red-600">remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex justify-end">
        <Button size="sm" onClick={onNext} disabled={ws.links.length === 0}>Next: Verify offices →</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 2 — Verify offices
// ───────────────────────────────────────────────────────────────────────────
function OfficesStep({
  ws,
  subtype,
  reading,
  canGenerate,
  onReadLinks,
  onParsePage,
  onAddOffice,
  onPatchOffice,
  onRemoveOffice,
  onAddAdvisor,
  onPatchAdvisor,
  onRemoveAdvisor,
  onParseAdvisor,
  onNext,
}: {
  ws: WorkspaceState;
  subtype: PartnerSubtype;
  reading: boolean;
  canGenerate: boolean;
  onReadLinks: () => void;
  onParsePage: (url: string, text: string) => void;
  onAddOffice: () => void;
  onPatchOffice: (id: string, patch: Partial<WorkspaceOffice>) => void;
  onRemoveOffice: (id: string) => void;
  onAddAdvisor: (officeId: string) => void;
  onPatchAdvisor: (id: string, patch: Partial<WorkspaceAdvisor>) => void;
  onRemoveAdvisor: (id: string) => void;
  onParseAdvisor: (officeId: string, text: string) => void;
  onNext: () => void;
}) {
  const isDeptHead = subtype === "dept_head";
  const isOrg = subtype === "student_org";
  const linkById = new Map(ws.links.map((l) => [l.id, l]));
  // Verified offices collapse to a one-line summary for a sense of completion;
  // expand to edit again.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {isDeptHead ? (
            <>
              The department <b>chair</b> is the prospect — one person per department. Confirm the chair’s
              <b> name</b> and <b>email</b> (their direct address, not a general advising inbox).
            </>
          ) : isOrg ? (
            <>
              The student <b>organization</b> is the prospect. Confirm a way to reach a rep — an <b>email</b>,
              an officer / faculty advisor with their own contact, or a <b>social</b> channel (clubs often
              reply fastest on Instagram / GroupMe).
            </>
          ) : (
            <>
              The office is the prospect. Confirm each office’s <b>email</b> and <b>tag</b> — that’s all outreach needs.
              Advisors are optional and only when they have their own contact.
            </>
          )}
        </p>
        <Button size="sm" variant="ghost" onClick={onReadLinks} loading={reading}>✦ Re-read links</Button>
      </div>

      {ws.offices.length === 0 && !reading && (
        <p className="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          {isDeptHead
            ? "No chairs found yet. Re-read links, paste a department page, or add one by hand."
            : isOrg
              ? "No organizations found yet. Re-read links, paste a club / directory page, or add one by hand."
              : "No offices found yet. Re-read links, paste an office page, or add one by hand."}
        </p>
      )}

      {ws.offices.map((o) => {
        const collapsed = o.verified && !expanded.has(o.id);
        if (collapsed) {
          return (
            <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-emerald-600">✓</span>
                <span className="truncate font-medium text-gray-900">
                  {isDeptHead
                    ? `${o.person_name || "(no chair)"}${o.name ? ` — ${o.name}` : ""}`
                    : o.name || "(unnamed office)"}
                </span>
                <span className="shrink-0 text-[11px] text-gray-500">{o.email || (o.call_only ? "☎ call-only" : "")}</span>
              </span>
              <button onClick={() => setExpanded((s) => new Set(s).add(o.id))} className="shrink-0 text-xs text-primary-600 hover:underline">edit</button>
            </div>
          );
        }
        return (
          <OfficeCard
            key={o.id}
            office={o}
            isDeptHead={isDeptHead}
            isOrg={isOrg}
            advisors={ws.advisors.filter((a) => a.office_id === o.id)}
            sources={o.source_link_ids.map((id) => linkById.get(id)).filter(Boolean) as WorkspaceLink[]}
            reading={reading}
            onPatch={(id, patch) => {
              onPatchOffice(id, patch);
              if (patch.verified) setExpanded((s) => { const n = new Set(s); n.delete(id); return n; });
            }}
            onRemove={onRemoveOffice}
            onAddAdvisor={onAddAdvisor}
            onPatchAdvisor={onPatchAdvisor}
            onRemoveAdvisor={onRemoveAdvisor}
            onParseAdvisor={onParseAdvisor}
          />
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onAddOffice}>
          {isDeptHead ? "+ Add chair by hand" : isOrg ? "+ Add organization by hand" : "+ Add office by hand"}
        </Button>
        <PasteOfficePage reading={reading} onParse={onParsePage} isDeptHead={isDeptHead} isOrg={isOrg} />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">{ws.offices.filter((o) => o.verified).length} of {ws.offices.length} verified</span>
        <Button size="sm" onClick={onNext} disabled={!canGenerate}>Next: Generate →</Button>
      </div>
    </div>
  );
}

function OfficeCard({
  office: o,
  isDeptHead,
  isOrg,
  advisors,
  sources,
  reading,
  onPatch,
  onRemove,
  onAddAdvisor,
  onPatchAdvisor,
  onRemoveAdvisor,
  onParseAdvisor,
}: {
  office: WorkspaceOffice;
  isDeptHead: boolean;
  isOrg: boolean;
  advisors: WorkspaceAdvisor[];
  sources: WorkspaceLink[];
  reading: boolean;
  onPatch: (id: string, patch: Partial<WorkspaceOffice>) => void;
  onRemove: (id: string) => void;
  onAddAdvisor: (officeId: string) => void;
  onPatchAdvisor: (id: string, patch: Partial<WorkspaceAdvisor>) => void;
  onRemoveAdvisor: (id: string) => void;
  onParseAdvisor: (officeId: string, text: string) => void;
}) {
  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";
  const reachable = Boolean(o.email) || Boolean(o.call_only);

  // ── Department-head card: ONE chair per department (person-shaped) ──
  if (isDeptHead) {
    const chairReachable = Boolean(o.email) || Boolean(o.phone) || Boolean(o.call_only);
    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <input value={o.name} onChange={(e) => onPatch(o.id, { name: e.target.value })} placeholder="Department (e.g. Department of Biology)" className={`${input} flex-1 font-medium`} />
          <div className="flex shrink-0 items-center gap-2">
            {sources.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-600 hover:underline">source ↗</a>
            ))}
            <button onClick={() => onRemove(o.id)} className="text-[11px] text-gray-400 hover:text-red-600">remove</button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={o.person_name ?? ""} onChange={(e) => onPatch(o.id, { person_name: e.target.value })} placeholder="Chair / head name (e.g. Dr. Jane Smith)" className={`${input} ${!o.person_name ? "border-amber-300 bg-amber-50" : ""}`} />
          <input value={o.person_title ?? ""} onChange={(e) => onPatch(o.id, { person_title: e.target.value })} placeholder="Title / role (e.g. Department Chair)" className={input} />
          <input value={o.email ?? ""} onChange={(e) => onPatch(o.id, { email: e.target.value })} placeholder="✉ Chair's direct email" className={`${input} ${!o.email && !o.call_only ? "border-amber-300 bg-amber-50" : ""}`} />
          <input value={o.phone ?? ""} onChange={(e) => onPatch(o.id, { phone: e.target.value })} placeholder="☎ Phone" className={input} />
        </div>

        {!o.person_name && (
          <p className="mb-2 text-[11px] text-amber-700">No chair named yet — add the chair/head, or paste the department page.</p>
        )}
        {!o.email && (
          <p className="mb-2 text-[11px] text-amber-700">
            No email yet — add the chair&apos;s address, or{" "}
            <button onClick={() => onPatch(o.id, { call_only: !o.call_only })} className="font-medium underline">
              {o.call_only ? "unmark Call-only" : "mark Call-only (phone lead)"}
            </button>
          </p>
        )}

        <label className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${chairReachable ? "border-gray-200 text-gray-800" : "border-gray-100 text-gray-400"}`} title={chairReachable ? undefined : "Add an email/phone or mark Call-only first."}>
          <input type="checkbox" checked={!!o.verified} disabled={!chairReachable} onChange={(e) => onPatch(o.id, { verified: e.target.checked })} />
          Verified — this chair is correct and ready
        </label>
      </div>
    );
  }

  const nameLabel = isOrg ? "Organization name" : "Office name";
  const emailLabel = isOrg ? "✉ Club / officer email" : "✉ Office email (required for outreach)";
  const phoneLabel = isOrg ? "☎ Phone (optional)" : "☎ Office phone";
  const rosterLabel = isOrg ? "Officers & faculty advisor" : "Advisors";
  const addRosterLabel = isOrg ? "+ add officer / advisor" : "+ add advisor";
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <input value={o.name} onChange={(e) => onPatch(o.id, { name: e.target.value })} placeholder={nameLabel} className={`${input} flex-1 font-medium`} />
        <div className="flex shrink-0 items-center gap-2">
          {sources.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-600 hover:underline">source ↗</a>
          ))}
          <button onClick={() => onRemove(o.id)} className="text-[11px] text-gray-400 hover:text-red-600">remove</button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Tag is only meaningful for the advisor flow (which can encounter an
            advising office vs a department vs a club). Orgs are always orgs. */}
        {!isOrg && (
          <label className="flex items-center gap-1 text-[11px] text-gray-600">
            Tag
            <select value={o.tag} onChange={(e) => onPatch(o.id, { tag: e.target.value as OfficeTag })} className="flex-1 rounded border border-gray-200 bg-white px-1 py-1 text-sm">
              {OFFICE_TAGS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        )}
        <input value={o.website ?? ""} onChange={(e) => onPatch(o.id, { website: e.target.value })} placeholder={isOrg ? "Website / Linktree (optional)" : "Website (optional)"} className={input} />
        <input value={o.email ?? ""} onChange={(e) => onPatch(o.id, { email: e.target.value })} placeholder={emailLabel} className={`${input} ${!o.email && !o.call_only ? "border-amber-300 bg-amber-50" : ""}`} />
        <input value={o.phone ?? ""} onChange={(e) => onPatch(o.id, { phone: e.target.value })} placeholder={phoneLabel} className={input} />
      </div>

      {/* Socials — a PRIMARY reach channel for clubs, so they're first-class
          here (view + edit), not buried. Shown for student orgs only. */}
      {isOrg && (
        <SocialsEditor
          socials={o.socials ?? []}
          onChange={(socials) => onPatch(o.id, { socials })}
        />
      )}

      {!o.email && (
        <p className="mb-2 text-[11px] text-amber-700">
          {isOrg ? "No email yet — add a club/officer email or a social handle above, or " : "No email yet — add one, or "}
          <button onClick={() => onPatch(o.id, { call_only: !o.call_only })} className="font-medium underline">
            {o.call_only ? "unmark Call-only" : "mark Call-only (phone lead)"}
          </button>
        </p>
      )}

      {/* Roster — officers + faculty advisor (orgs) / advisors (offices); only
          people with their own contact. */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{rosterLabel} ({advisors.length}) — optional, with their own email/phone</p>
          <button onClick={() => onAddAdvisor(o.id)} className="text-[11px] font-medium text-primary-600 hover:underline">{addRosterLabel}</button>
        </div>
        {advisors.map((a) => (
          <div key={a.id} className="mt-1 flex flex-wrap items-center gap-1.5">
            <input value={a.name ?? ""} onChange={(e) => onPatchAdvisor(a.id, { name: e.target.value })} placeholder="Name" className={`${input} w-32`} />
            <input value={a.role ?? ""} onChange={(e) => onPatchAdvisor(a.id, { role: e.target.value })} placeholder="Role" className={`${input} w-32`} />
            <input value={a.email ?? ""} onChange={(e) => onPatchAdvisor(a.id, { email: e.target.value })} placeholder="Own email" className={`${input} w-40`} />
            <input value={a.phone ?? ""} onChange={(e) => onPatchAdvisor(a.id, { phone: e.target.value })} placeholder="Phone" className={`${input} w-28`} />
            <button onClick={() => onRemoveAdvisor(a.id)} className="text-[11px] text-gray-400 hover:text-red-600">remove</button>
          </div>
        ))}
        <PasteAdvisor officeId={o.id} reading={reading} onParse={onParseAdvisor} />
      </div>

      <label className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${reachable ? "border-gray-200 text-gray-800" : "border-gray-100 text-gray-400"}`} title={reachable ? undefined : "Add an email or mark Call-only first."}>
        <input type="checkbox" checked={!!o.verified} disabled={!reachable} onChange={(e) => onPatch(o.id, { verified: e.target.checked })} />
        {isOrg ? "Verified — this organization is correct and ready" : "Verified — this office is correct and ready"}
      </label>
    </div>
  );
}

/** Inline editor for a club's social channels (Instagram / Discord / GroupMe …).
 *  Surfaced for student orgs since social is often the only reliable reach. */
function SocialsEditor({ socials, onChange }: { socials: SocialLink[]; onChange: (next: SocialLink[]) => void }) {
  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";
  const patch = (i: number, p: Partial<SocialLink>) => onChange(socials.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Socials ({socials.length}) — Instagram / Discord / GroupMe / Linktree</p>
        <button onClick={() => onChange([...socials, { platform: "", url: "" }])} className="text-[11px] font-medium text-primary-600 hover:underline">+ add social</button>
      </div>
      {socials.map((s, i) => (
        <div key={i} className="mt-1 flex flex-wrap items-center gap-1.5">
          <input value={s.platform ?? ""} onChange={(e) => patch(i, { platform: e.target.value })} placeholder="Platform (e.g. Instagram)" className={`${input} w-36`} />
          <input value={s.url ?? ""} onChange={(e) => patch(i, { url: e.target.value })} placeholder="Handle or URL" className={`${input} w-56`} />
          <button onClick={() => onChange(socials.filter((_, j) => j !== i))} className="text-[11px] text-gray-400 hover:text-red-600">remove</button>
        </div>
      ))}
    </div>
  );
}

function PasteAdvisor({ officeId, reading, onParse }: { officeId: string; reading: boolean; onParse: (officeId: string, text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) {
    return <button onClick={() => setOpen(true)} className="mt-1 text-[11px] font-medium text-primary-600 hover:underline">or paste an advisor’s info →</button>;
  }
  return (
    <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-2">
      <p className="mb-1 text-[11px] text-gray-600">Paste an advisor’s details (name, title, email, phone) — we’ll organize it.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={"An-Janet Smith — Pre-Health Advisor · ajsmith@uni.edu · (512) 555-1212"} className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
      <div className="mt-1 flex justify-end gap-2">
        <button onClick={() => { setOpen(false); setText(""); }} className="text-[11px] text-gray-500 hover:underline">Cancel</button>
        <button onClick={() => { if (text.trim()) { onParse(officeId, text.trim()); setText(""); setOpen(false); } }} disabled={reading || !text.trim()} className="rounded-md bg-primary-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
          {reading ? "Reading…" : "Organize advisor"}
        </button>
      </div>
    </div>
  );
}

function PasteOfficePage({ reading, onParse, isDeptHead, isOrg }: { reading: boolean; onParse: (url: string, text: string) => void; isDeptHead?: boolean; isOrg?: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const label = isDeptHead ? "Paste a department page →" : isOrg ? "Paste a club / directory page →" : "Paste an office page →";
  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-xs font-medium text-primary-600 hover:underline">{label}</button>;
  }
  return (
    <div className="w-full rounded-md border border-primary-200 bg-primary-50/40 p-2">
      <p className="mb-1 text-[11px] font-semibold text-primary-800">{isDeptHead ? "Paste a department page — we’ll pull the chair’s name, email & phone" : isOrg ? "Paste a club or org-directory page — we’ll pull the club’s contact + socials" : "Paste an office page — we’ll pull its name, email & phone"}</p>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Page URL (optional, becomes a source link)" className="mb-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={"Health Professions Advising Office\nContact: hpo@uni.edu · (512) 471-3172"} className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none" />
      <div className="mt-1 flex justify-end gap-2">
        <button onClick={() => { setOpen(false); setText(""); setUrl(""); }} className="text-xs text-gray-500 hover:underline">Cancel</button>
        <button onClick={() => { if (text.trim()) { onParse(url, text.trim()); setText(""); setUrl(""); setOpen(false); } }} disabled={reading || !text.trim()} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
          {reading ? "Reading…" : "Read & add office"}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 3 — Generate
// ───────────────────────────────────────────────────────────────────────────
function GenerateStep({
  ws,
  offices,
  genSel,
  setGenSel,
  busy,
  onPatchOffice,
  onGenerate,
  onBack,
}: {
  ws: WorkspaceState;
  offices: WorkspaceOffice[];
  genSel: Record<string, { include: boolean; advisors: Set<string> }>;
  setGenSel: (fn: (s: Record<string, { include: boolean; advisors: Set<string> }>) => Record<string, { include: boolean; advisors: Set<string> }>) => void;
  busy: boolean;
  onPatchOffice: (id: string, patch: Partial<WorkspaceOffice>) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const tagLabel = (t: OfficeTag) => OFFICE_TAGS.find((x) => x.key === t)?.label ?? t;
  const toggleInclude = (id: string) =>
    setGenSel((s) => ({ ...s, [id]: { include: !(s[id]?.include ?? true), advisors: s[id]?.advisors ?? new Set() } }));
  const toggleAdvisor = (oid: string, aid: string) =>
    setGenSel((s) => {
      const cur = s[oid] ?? { include: true, advisors: new Set<string>() };
      const advisors = new Set(cur.advisors);
      if (advisors.has(aid)) advisors.delete(aid);
      else advisors.add(aid);
      return { ...s, [oid]: { ...cur, advisors } };
    });

  const count = offices.filter((o) => genSel[o.id]?.include).length;
  const input = "rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">These offices become prospects in your In-Basket. Edit anything, then generate.</p>

      {ws.generated_at && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ Prospects generated. Generating again creates additional rows.</p>
      )}

      {offices.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          No verified offices yet. <button onClick={onBack} className="text-primary-600 hover:underline">Back to Verify offices</button>.
        </p>
      )}

      {offices.map((o) => {
        const advisors = ws.advisors.filter((a) => a.office_id === o.id);
        const callOnly = !o.email;
        return (
          <div key={o.id} className="rounded-lg border border-gray-200 p-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={genSel[o.id]?.include ?? true} onChange={() => toggleInclude(o.id)} />
              <span className="font-medium text-gray-900">{o.name || "(unnamed office)"}</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{tagLabel(o.tag)}</span>
              {callOnly && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">☎ Call-only</span>}
            </label>
            <div className="mt-1 grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
              <input value={o.email ?? ""} onChange={(e) => onPatchOffice(o.id, { email: e.target.value })} placeholder="✉ Office email" className={input} />
              <input value={o.phone ?? ""} onChange={(e) => onPatchOffice(o.id, { phone: e.target.value })} placeholder="☎ Phone" className={input} />
            </div>
            {advisors.map((a) => (
              <label key={a.id} className="mt-1 flex items-center gap-2 pl-6 text-sm text-gray-700">
                <input type="checkbox" checked={genSel[o.id]?.advisors?.has(a.id) ?? false} disabled={!a.email} onChange={() => toggleAdvisor(o.id, a.id)} />
                also email {a.name || "advisor"}{a.role ? ` (${a.role})` : ""}{a.email ? <span className="text-gray-500"> → {a.email}</span> : <span className="text-gray-400"> (no email)</span>}
              </label>
            ))}
          </div>
        );
      })}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button onClick={onBack} className="text-xs text-gray-500 hover:underline">← Back to Verify offices</button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{count} office{count === 1 ? "" : "s"} → In-Basket</span>
          <Button size="sm" onClick={onGenerate} loading={busy} disabled={count === 0}>Generate {count} → In-Basket</Button>
        </div>
      </div>
    </div>
  );
}
