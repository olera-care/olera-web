"use client";

/**
 * SpecificContactsSection — the shared "named contacts under a parent record"
 * section used by BOTH drawers, so they look and behave identically:
 *   - Provider drawer → "Decision makers"
 *   - Partner drawer  → "Advisors"
 *
 * Each is a list (research_data[researchKey]) of people found in research, added
 * by hand, or learned on the confirm call. Anyone with an email becomes a
 * selectable recipient at launch. Role + source are preselected to avoid
 * spelling/semantic drift. Persists via the existing update_research action —
 * the parent's launch flow materializes the list into recipients.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

export interface SpecificContact {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  source?: "website" | "call";
  source_url?: string;
}

function Segment({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
        active ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export function SpecificContactsSection({
  ctx,
  action,
  setError,
  researchKey,
  title,
  primaryRoleLabel,
  addLabel,
  helpText,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
  /** research_data key holding the list (e.g. "advisors" / "decision_makers"). */
  researchKey: string;
  /** Plural section title (e.g. "Advisors" / "Decision makers"). */
  title: string;
  /** Default role preselect label (e.g. "Advisor" / "Decision maker"). */
  primaryRoleLabel: string;
  /** Add-button label (e.g. "Add an advisor" / "Add decision maker"). */
  addLabel: string;
  helpText: string;
}) {
  const list =
    ((ctx.outreach.research_data as Record<string, unknown>)[researchKey] as SpecificContact[] | undefined) ?? [];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<SpecificContact>({});
  const [roleKind, setRoleKind] = useState<"primary" | "other">("primary");
  const [sourceKind, setSourceKind] = useState<"website" | "call">("website");

  const reset = () => {
    setDraft({});
    setRoleKind("primary");
    setSourceKind("website");
  };

  const persist = async (next: SpecificContact[]) => {
    try {
      await action("update_research", { research: { [researchKey]: next } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const add = async () => {
    if (!draft.name?.trim() && !draft.email?.trim()) {
      setError("Add a name or an email");
      return;
    }
    const titleVal = roleKind === "primary" ? primaryRoleLabel : draft.title?.trim() || "Other";
    const item: SpecificContact = {
      ...draft,
      title: titleVal,
      source: sourceKind,
      source_url: sourceKind === "website" ? draft.source_url?.trim() || undefined : undefined,
    };
    await persist([...list, item]);
    reset();
    setAdding(false);
  };

  const remove = (i: number) => persist(list.filter((_, idx) => idx !== i));

  const input =
    "w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-gray-400 focus:outline-none";

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {title} ({list.length})
        </p>
        <button
          type="button"
          onClick={() => { if (adding) reset(); setAdding((s) => !s); }}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          {adding ? "Cancel" : `+ ${addLabel}`}
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">{helpText}</p>

      {list.length > 0 && (
        <ul className="mt-2 space-y-1">
          {list.map((m, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-white px-2 py-1.5 text-xs">
              <span className="min-w-0">
                <span className="font-medium text-gray-800">{m.name || m.email || "(unnamed)"}</span>
                {m.title ? <span className="text-gray-500"> · {m.title}</span> : null}
                {m.email && m.name ? <span className="text-gray-500"> · {m.email}</span> : null}
                {m.source_url ? (
                  <>
                    {" "}
                    <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">src ↗</a>
                  </>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {m.email ? <span className="text-[10px] text-gray-400">emailable</span> : null}
                <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-600" title="Remove">×</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <input className={input} placeholder="Name" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <input className={input} placeholder="Email (optional)" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            <input className={`${input} col-span-2`} placeholder="Phone (optional)" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Role</p>
            <div className="flex gap-1.5">
              <Segment active={roleKind === "primary"} onClick={() => setRoleKind("primary")}>{primaryRoleLabel}</Segment>
              <Segment active={roleKind === "other"} onClick={() => setRoleKind("other")}>Other</Segment>
              {roleKind === "other" && (
                <input className={`${input} flex-1`} placeholder="Title (e.g. Director, Coordinator)" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Source</p>
            <div className="flex gap-1.5">
              <Segment active={sourceKind === "website"} onClick={() => setSourceKind("website")}>Website</Segment>
              <Segment active={sourceKind === "call"} onClick={() => setSourceKind("call")}>On a call</Segment>
            </div>
            {sourceKind === "website" && (
              <input className={`${input} mt-1.5`} placeholder="Source link (https://…)" value={draft.source_url ?? ""} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} />
            )}
          </div>

          <button onClick={add} className="w-full rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
            Save
          </button>
        </div>
      )}
    </div>
  );
}
