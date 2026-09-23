"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScriptRow, SuggestionRow } from "@/app/api/admin/medjobs/scripts/route";

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
  // Not a ladder. The starter pack sits above Providers because it is what
  // somebody reads before they have a task to read about.
  general: "General",
  providers: "Providers",
  students: "Students",
  jobboard: "Job boards",
  advisors: "Advisors",
  orgs: "Student orgs",
  events: "Events",
  professors: "Professors",
};

// Section first, so a situation that names one groups under it rather than
// falling to the end with the situations that name none.
const groupLabel = (row: ScriptRow) =>
  SECTION_LABEL[row.section ?? ""] ?? (row.kind === "situation" ? "Situations" : "Other");

interface Draft {
  instructions: string;
  videoUrl: string;
  callScript: string;
  emailSubject: string;
  emailBody: string;
  notes: string;
}

const draftOf = (r: ScriptRow): Draft => ({
  instructions: r.instructions ?? "",
  videoUrl: r.videoUrl ?? "",
  callScript: r.callScript ?? "",
  emailSubject: r.emailSubject ?? "",
  emailBody: r.emailBody ?? "",
  notes: r.notes ?? "",
});

/**
 * The embeddable form of a YouTube link.
 *
 * Accepts what people actually paste — a watch URL, a share link, a Shorts
 * link, or an id on its own — and returns null for anything else rather than
 * building an iframe around a stranger's URL.
 */
export function youTubeEmbed(url: string): string | null {
  const t = url.trim();
  if (/^[\w-]{11}$/.test(t)) return `https://www.youtube.com/embed/${t}`;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtube-nocookie.com") {
    return null;
  }
  const v = u.searchParams.get("v");
  if (v && /^[\w-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}`;
  const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})$/);
  return m ? `https://www.youtube.com/embed/${m[2]}` : null;
}

export default function ScriptsDoc() {
  const [rows, setRows] = useState<ScriptRow[] | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Which section was just jumped to, so it can say so for a moment. A
  // contents list that scrolls somewhere without marking where is a list
  // that makes you hunt for the thing you just clicked.
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/medjobs/scripts", { cache: "no-store" });
      const json = (await res.json()) as {
        rows?: ScriptRow[];
        suggestions?: SuggestionRow[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? "Could not load the document");
        return;
      }
      setRows(json.rows ?? []);
      setSuggestions(json.suggestions ?? []);
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
  const flashTimer = useRef<number | null>(null);
  const jumpTo = useCallback((slug: string, smooth: boolean) => {
    document
      .getElementById(slug)
      ?.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
    setFlash(slug);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1800);
  }, []);

  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  const jumped = useRef(false);
  useEffect(() => {
    if (!rows || jumped.current) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    jumped.current = true;
    // Deferred by a turn so the jump happens after the browser has laid the
    // new sections out, rather than against the height it had a moment ago.
    window.setTimeout(() => jumpTo(id, false), 0);
  }, [rows, jumpTo]);

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
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.replaceState(null, "", `#${r.slug}`);
                      jumpTo(r.slug, true);
                    }}
                    className={`block truncate text-[12.5px] transition-colors ${
                      flash === r.slug
                        ? "font-medium text-primary-700"
                        : "text-gray-500 hover:text-primary-700"
                    }`}
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
        <SuggestionQueue suggestions={suggestions} onChanged={load} onJump={(slug) => jumpTo(slug, true)} />
        {groups.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-3 border-b border-gray-200 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </h2>
            <div className="space-y-5">
              {list.map((r) => (
                <Entry
                  key={r.slug}
                  row={r}
                  flash={flash === r.slug}
                  open={suggestions.filter((s) => s.status === "open" && s.scriptSlug === r.slug).length}
                  onSaved={load}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Entry({
  row,
  flash,
  open,
  onSaved,
}: {
  row: ScriptRow;
  flash: boolean;
  /** Improvements raised against this section and not yet answered. */
  open: number;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(row));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const empty = !row.instructions && !row.callScript && !row.emailBody && !row.notes;
  const video = row.videoUrl ? youTubeEmbed(row.videoUrl) : null;

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
    <article
      id={row.slug}
      className={`scroll-mt-6 rounded-lg border bg-white p-4 transition-all duration-500 ${
        flash
          ? "border-primary-400 shadow-md ring-2 ring-primary-300"
          : "border-gray-200 ring-0"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-gray-900">
          {row.title}
          {open > 0 && (
            <span className="ml-2 rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-warning-800">
              {open} suggested {open === 1 ? "change" : "changes"}
            </span>
          )}
        </h3>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSuggesting((v) => !v);
              setEditing(false);
            }}
            className="text-[12.5px] text-gray-500 underline hover:text-gray-900"
          >
            {suggesting ? "Cancel" : "Suggest an improvement"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(draftOf(row));
              setError(null);
              setSuggesting(false);
              setEditing((v) => !v);
            }}
            className="text-[12.5px] text-gray-500 underline hover:text-gray-900"
          >
            {editing ? "Cancel" : empty ? "Add" : "Edit"}
          </button>
        </div>
      </div>

      {suggesting && (
        <SuggestBox
          scriptSlug={row.slug}
          onDone={() => {
            setSuggesting(false);
            onSaved();
          }}
        />
      )}

      {error && (
        <p className="mt-2 rounded-md border border-error-200 bg-error-25 px-3 py-2 text-[12.5px] text-error-700">
          {error}
        </p>
      )}

      {editing ? (
        <div className="mt-3 space-y-3">
          <Field
            label="Instructions — what to do on this step, and why"
            value={draft.instructions}
            rows={10}
            onChange={(v) => setDraft((d) => ({ ...d, instructions: v }))}
          />
          <Field
            label="Video walkthrough (YouTube link)"
            value={draft.videoUrl}
            rows={1}
            onChange={(v) => setDraft((d) => ({ ...d, videoUrl: v }))}
          />
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
              Nothing written yet. Add what to do on this one.
            </p>
          )}
          {row.instructions && <Block label="Instructions" text={row.instructions} />}
          {row.videoUrl && (
            <div>
              <Label>Video walkthrough</Label>
              {/* Capped at max-w-md: at full column width the player is taller
                  than the script it explains and pushes everything off screen. */}
              {video ? (
                <div className="max-w-md overflow-hidden rounded-md border border-gray-200">
                  <iframe
                    src={video}
                    title={`${row.title} — walkthrough`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="aspect-video w-full"
                  />
                </div>
              ) : (
                // Not a YouTube link we recognise, so it is offered as a link
                // rather than wrapped in an iframe.
                <a
                  href={row.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12.5px] text-primary-700 underline hover:no-underline"
                >
                  {row.videoUrl}
                </a>
              )}
            </div>
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

/**
 * Raising an improvement against a section.
 *
 * Deliberately one box and one button. Anything that asks somebody mid-shift
 * to categorise their own idea before they can write it down is a form that
 * collects nothing.
 */
function SuggestBox({ scriptSlug, onDone }: { scriptSlug: string | null; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/scripts/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptSlug,
          kind: scriptSlug ? "improvement" : "new_step",
          body: text,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Not sent — the server refused it");
        return;
      }
      setText("");
      onDone();
    } catch {
      setError("Not sent — could not reach the server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-warning-200 bg-warning-25 p-3">
      <Label>{scriptSlug ? "What should change, and why?" : "What step is missing?"}</Label>
      <textarea
        value={text}
        rows={4}
        autoFocus
        placeholder="Say it however you would say it out loud."
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-[12.5px] leading-relaxed text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {error && <p className="mt-1 text-[12.5px] text-error-700">{error}</p>}
      <button
        type="button"
        onClick={() => void send()}
        disabled={busy || text.trim() === ""}
        className="mt-2 rounded-md bg-warning-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-warning-700 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send for review"}
      </button>
    </div>
  );
}

/**
 * Everything raised and not yet answered, at the top of the document.
 *
 * Anyone with admin access can clear it. A reply is required to accept or
 * decline, because to the person who raised it a silent accept reads the
 * same as being ignored.
 */
function SuggestionQueue({
  suggestions,
  onChanged,
  onJump,
}: {
  suggestions: SuggestionRow[];
  onChanged: () => void;
  onJump: (slug: string) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const open = suggestions.filter((s) => s.status === "open");
  const done = suggestions.filter((s) => s.status !== "open");

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
          Suggested changes{open.length > 0 ? ` · ${open.length} waiting` : ""}
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-[12.5px] text-gray-500 underline hover:text-gray-900"
          >
            {adding ? "Cancel" : "Suggest a new step"}
          </button>
          {done.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="text-[12.5px] text-gray-500 underline hover:text-gray-900"
            >
              {showDone ? "Hide answered" : `Answered (${done.length})`}
            </button>
          )}
        </div>
      </div>

      {adding && <SuggestBox scriptSlug={null} onDone={() => { setAdding(false); onChanged(); }} />}

      {open.length === 0 && !adding && (
        <p className="mt-1 text-[12.5px] text-gray-500">
          Nothing waiting. Anyone can raise one from any section below, and anyone here can
          answer it.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {open.map((s) => (
          <Suggestion key={s.id} row={s} onChanged={onChanged} onJump={onJump} />
        ))}
        {showDone &&
          done.map((s) => <Suggestion key={s.id} row={s} onChanged={onChanged} onJump={onJump} />)}
      </div>
    </section>
  );
}

function Suggestion({
  row,
  onChanged,
  onJump,
}: {
  row: SuggestionRow;
  onChanged: () => void;
  onJump: (slug: string) => void;
}) {
  const [reply, setReply] = useState(row.response ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settled = row.status !== "open";

  const resolve = async (status: "accepted" | "declined" | "open") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/scripts/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status, response: reply }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Not saved — the server refused it");
        return;
      }
      onChanged();
    } catch {
      setError("Not saved — could not reach the server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-[11.5px] text-gray-400">
        {row.kind === "new_step" ? "A new step" : row.scriptTitle ?? row.scriptSlug}
        {row.scriptSlug && (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => onJump(row.scriptSlug!)}
              className="underline hover:text-gray-700"
            >
              go to it
            </button>
          </>
        )}
        {row.raisedEmail ? ` · ${row.raisedEmail}` : ""} · {shortWhen(row.raisedAt)}
        {settled && ` · ${row.status}`}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-gray-800">
        {row.body}
      </p>
      {error && <p className="mt-1 text-[12.5px] text-error-700">{error}</p>}
      {settled ? (
        <>
          {row.response && (
            <p className="mt-1 text-[12.5px] italic text-gray-500">Answer: {row.response}</p>
          )}
          <button
            type="button"
            onClick={() => void resolve("open")}
            disabled={busy}
            className="mt-1 text-[12px] text-gray-500 underline hover:text-gray-900 disabled:opacity-50"
          >
            Reopen
          </button>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <input
            value={reply}
            placeholder="What you did about it — required"
            onChange={(e) => setReply(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-[12.5px] text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void resolve("accepted")}
              disabled={busy || reply.trim() === ""}
              className="rounded-md bg-success-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-success-700 disabled:opacity-50"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => void resolve("declined")}
              disabled={busy || reply.trim() === ""}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-[12.5px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Not doing it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const shortWhen = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
