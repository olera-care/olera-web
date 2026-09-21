"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScriptRow } from "@/app/api/admin/medjobs/scripts/route";

/**
 * The master scripts document.
 *
 * Every call script and every piece of email copy MedJobs uses, in one place,
 * organised by ladder and rung, with the situations no rung covers at the end.
 * A task links straight to its own section rather than carrying a copy of it,
 * so there is one version of anything and no two places to keep in step.
 *
 * Every section is editable in place. That is the point of the page: the
 * person who has just worked out what to say is the person who should be able
 * to write it down, and they should not need a deploy to do it.
 */

const SECTION_LABEL: Record<string, string> = {
  providers: "Providers",
  students: "Students",
  jobboard: "Job boards",
  advisors: "Advisors",
  orgs: "Student orgs",
  events: "Events",
  professors: "Professors",
};

const groupLabel = (row: ScriptRow) =>
  row.kind === "situation" ? "Situations" : SECTION_LABEL[row.section ?? ""] ?? "Other";

interface Draft {
  callScript: string;
  emailSubject: string;
  emailBody: string;
  notes: string;
}

const draftOf = (r: ScriptRow): Draft => ({
  callScript: r.callScript ?? "",
  emailSubject: r.emailSubject ?? "",
  emailBody: r.emailBody ?? "",
  notes: r.notes ?? "",
});

export default function ScriptsDoc() {
  const [rows, setRows] = useState<ScriptRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/medjobs/scripts", { cache: "no-store" });
      const json = (await res.json()) as { rows?: ScriptRow[]; error?: string };
      if (!res.ok) {
        setLoadError(json.error ?? "Could not load the document");
        return;
      }
      setRows(json.rows ?? []);
      setLoadError(null);
    } catch {
      setLoadError("Could not reach the server");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The deep link from a task arrives as a hash, and the sections do not
  // exist until the fetch lands — so the browser's own jump has already
  // failed by then and we have to do it again ourselves.
  const jumped = useRef(false);
  useEffect(() => {
    if (!rows || jumped.current) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    jumped.current = true;
    // Deferred by a turn so the jump happens after the browser has laid the
    // new sections out, rather than against the height it had a moment ago.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }, 0);
  }, [rows]);

  const groups = useMemo(() => {
    const out = new Map<string, ScriptRow[]>();
    for (const r of rows ?? []) {
      const g = groupLabel(r);
      out.set(g, [...(out.get(g) ?? []), r]);
    }
    return [...out.entries()];
  }, [rows]);

  if (loadError) {
    return (
      <p className="rounded-lg border border-error-200 bg-error-25 px-4 py-3 text-[13px] text-error-700">
        {loadError}
      </p>
    );
  }
  if (!rows) return <p className="text-[13px] text-gray-500">Loading…</p>;

  return (
    <div className="flex gap-8">
      <nav className="sticky top-6 hidden h-fit w-56 shrink-0 lg:block">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Contents
        </p>
        {groups.map(([label, list]) => (
          <div key={label} className="mb-4">
            <p className="mb-1 text-[12px] font-semibold text-gray-900">{label}</p>
            <ul className="space-y-0.5">
              {list.map((r) => (
                <li key={r.slug}>
                  <a
                    href={`#${r.slug}`}
                    className="block truncate text-[12.5px] text-gray-500 hover:text-primary-700"
                  >
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-8">
        {groups.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-3 border-b border-gray-200 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </h2>
            <div className="space-y-5">
              {list.map((r) => (
                <Entry key={r.slug} row={r} onSaved={load} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Entry({ row, onSaved }: { row: ScriptRow; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(row));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const empty = !row.callScript && !row.emailBody && !row.notes;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: row.slug, ...draft }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        // Said out loud and left on screen. A save that quietly did nothing
        // is the failure this whole board has already been bitten by once.
        setError(json.error ?? "Not saved — the server refused it");
        return;
      }
      setEditing(false);
      onSaved();
    } catch {
      setError("Not saved — could not reach the server");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy — select the text and copy it by hand");
    }
  };

  return (
    <article id={row.slug} className="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-gray-900">{row.title}</h3>
        <button
          type="button"
          onClick={() => {
            setDraft(draftOf(row));
            setError(null);
            setEditing((v) => !v);
          }}
          className="shrink-0 text-[12.5px] text-gray-500 underline hover:text-gray-900"
        >
          {editing ? "Cancel" : empty ? "Add" : "Edit"}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-md border border-error-200 bg-error-25 px-3 py-2 text-[12.5px] text-error-700">
          {error}
        </p>
      )}

      {editing ? (
        <div className="mt-3 space-y-3">
          <Field
            label="Call script"
            value={draft.callScript}
            rows={6}
            onChange={(v) => setDraft((d) => ({ ...d, callScript: v }))}
          />
          <Field
            label="Email subject"
            value={draft.emailSubject}
            rows={1}
            onChange={(v) => setDraft((d) => ({ ...d, emailSubject: v }))}
          />
          <Field
            label="Email body"
            value={draft.emailBody}
            rows={12}
            onChange={(v) => setDraft((d) => ({ ...d, emailBody: v }))}
          />
          <Field
            label="What we have learned"
            value={draft.notes}
            rows={8}
            onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {empty && (
            <p className="text-[12.5px] italic text-gray-400">
              Nothing written yet. Add what you say on this one.
            </p>
          )}
          {row.callScript && (
            <Block
              label="Call script"
              text={row.callScript}
              onCopy={() => void copy("script", row.callScript ?? "")}
              copied={copied === "script"}
            />
          )}
          {row.emailBody && (
            <div>
              <Label>Email</Label>
              <div className="rounded-md border border-gray-200 bg-gray-50">
                {row.emailSubject && (
                  <p className="border-b border-gray-200 px-3 py-2 text-[12.5px] font-semibold text-gray-900">
                    {row.emailSubject}
                  </p>
                )}
                <p className="whitespace-pre-wrap px-3 py-2.5 text-[12.5px] leading-relaxed text-gray-700">
                  {row.emailBody}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copy("email", row.emailBody ?? "")}
                className="mt-1 text-[12px] text-gray-500 underline hover:text-gray-900"
              >
                {copied === "email" ? "Copied" : "Copy the email"}
              </button>
            </div>
          )}
          {row.notes && <Block label="What we have learned" text={row.notes} />}
        </div>
      )}
    </article>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{children}</p>
);

function Block({
  label,
  text,
  onCopy,
  copied,
}: {
  label: string;
  text: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-gray-700">
        {text}
      </p>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="mt-1 text-[12px] text-gray-500 underline hover:text-gray-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-[12.5px] leading-relaxed text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </label>
  );
}
