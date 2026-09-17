"use client";

import { useState } from "react";
import { LADDERS, rungAt, type ContactField } from "@/lib/medjobs/ladders";
import {
  DEFERRALS,
  STOP_REASONS,
  canReopen,
  shortDate,
  strikesAt,
  taskTitle,
  type BoardRecord,
  type BoardTask,
} from "@/lib/medjobs/task-board";

/**
 * One task. The record it belongs to is named at the top with its phone and
 * email, because that is what you need in your hand before you press
 * anything.
 *
 * Deferring lives here as one control rather than a "Not yet" button on
 * every rung: putting something off is the same act everywhere, and it is
 * not an outcome.
 */

const FIELD_LABEL: Record<ContactField, string> = {
  contact: "Contact name",
  role: "Role",
  phone: "Phone",
  email: "Email",
};

const FIELD_HINT: Partial<Record<ContactField, string>> = {
  role: "President, outreach chair…",
};

/**
 * Fill the copy from the record. Every token has a fallback that still
 * reads as a sentence, so a half-filled record never sends "Hi ,".
 */
function fill(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => ctx[key] ?? "");
}

export default function TaskView({
  universityName,
  universitySlug,
  record,
  task,
  onOpenRecord,
  onAct,
  onDefer,
  onStop,
  onNote,
  onField,
  onFound,
  onFieldValue,
  onReopen,
  onAgain,
}: {
  universityName: string;
  universitySlug: string;
  record: BoardRecord;
  task: BoardTask;
  onOpenRecord: () => void;
  onAct: (actionIndex: number) => void;
  onDefer: (days: number) => void;
  onStop: (reason: string) => void;
  onNote: (text: string) => void;
  onField: (field: ContactField, value: string) => void;
  /** Research rungs: the names found, which become records on finishing. */
  onFound: (names: string[]) => void;
  /** A typed value the rung asked for. */
  onFieldValue: (key: string, value: string) => void;
  onReopen: () => void;
  onAgain: () => void;
}) {
  const [showEmail, setShowEmail] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDefer, setShowDefer] = useState(false);
  const [showStop, setShowStop] = useState(false);
  // "They replied" is the one outcome that carries information nobody can
  // reconstruct later, so it asks for it before moving on.
  const [replying, setReplying] = useState(false);
  const [draftName, setDraftName] = useState("");

  const rung = rungAt(task.section, task.step, task.round);
  if (!rung) return null;
  const ladder = LADDERS[record.section];
  // Unsuccessful attempts already logged against this rung. The one in hand
  // is the next one, so the label reads one higher.
  const attempts = strikesAt(record, task.step, task.round);

  // The flyer is a live URL, not an attachment name. Providers and everyone
  // reaching students get the audience the PDF is written for.
  const flyer = `${typeof window === "undefined" ? "" : window.location.origin}/api/medjobs/program-pdf?university=${
    encodeURIComponent(universitySlug)
  }&audience=${record.section === "students" ? "student" : "provider"}`;

  const ctx: Record<string, string> = {
    university: universityName,
    org: record.name,
    contact: record.contact || record.name,
    first: (record.contact || "there").split(" ")[0],
    role: record.role,
    approver: task.fields?.approver || "your department",
    flyer,
  };

  // A research rung fans out into whatever the operator found, so the
  // ladder's names are suggestions rather than the answer.
  const found = task.found ?? [];
  const suggestions = (rung.fanout ?? []).filter((n) => !found.includes(n));
  const addName = (raw: string) => {
    const name = raw.trim();
    if (!name || found.includes(name)) return;
    onFound([...found, name]);
    setDraftName("");
  };
  const needsNames = Boolean(rung.fanout) && found.length === 0;

  const contactLine = [
    record.contact,
    record.phone ? (
      <a key="p" href={`tel:${record.phone.replace(/[^\d+]/g, "")}`} className="text-primary-700 hover:underline">
        {record.phone}
      </a>
    ) : null,
    record.email ? (
      <a key="e" href={`mailto:${record.email}`} className="text-primary-700 hover:underline">
        {record.email}
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <div className="px-5 py-4">
      {/* Who this is with. */}
      <button
        type="button"
        onClick={onOpenRecord}
        className="block text-left text-[15px] font-semibold text-gray-900 hover:underline"
      >
        {record.name} <span className="font-normal text-gray-400">›</span>
      </button>
      {contactLine.length > 0 && (
        <p className="mt-0.5 text-[12.5px] text-gray-500">
          {contactLine.map((bit, i) => (
            <span key={i}>
              {i > 0 && <span className="px-1">·</span>}
              {bit}
            </span>
          ))}
        </p>
      )}

      {task.done ? (
        <div className="mt-4">
          <div className="rounded-md bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700">
            <b className="font-semibold text-gray-900">{task.outcome ?? "Logged"}</b>
            {" · "}
            {task.loggedOn ? shortDate(task.loggedOn) : "earlier"}
          </div>
          <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-gray-900">
            {taskTitle(task)}
          </h3>
          <p className="mt-1 text-[13.5px] text-gray-600">{rung.what}</p>
          <Note value={task.note} onChange={onNote} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {canReopen(record, task) && (
              <button type="button" onClick={onReopen} className={BTN_GO}>
                Reopen it
              </button>
            )}
            <button type="button" onClick={onAgain} className={BTN}>
              Do it again
            </button>
          </div>
          <p className="mt-2 text-[12.5px] text-gray-500">
            {canReopen(record, task)
              ? "Reopening puts this back as ready and removes whatever it queued."
              : "Work has already moved on, so this one can't be unwound. Doing it again adds a fresh task for today."}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-start gap-1.5">
            <h3 className="text-[17px] font-semibold tracking-tight text-gray-900">
              {taskTitle(task)}
              {rung.rounds ? <span className="ml-1 text-[14px] font-normal text-gray-400">of {rung.rounds}</span> : null}
            </h3>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-label="What this task is"
              aria-expanded={showHelp}
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                showHelp
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
              }`}
            >
              i
            </button>
            {attempts > 0 && (
              <span className="ml-auto shrink-0 pt-1 text-[12px] tabular-nums text-gray-500">
                attempt {attempts + 1}
              </span>
            )}
          </div>

          {attempts >= 3 && (
            <p className="mt-2 rounded-md border border-warning-200 bg-warning-50 px-3 py-2 text-[12.5px] leading-snug text-warning-800">
              After three attempts and no way to confirm the contact information, archive.
            </p>
          )}

          {showHelp && (
            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3.5 py-3">
              <Help label="What this is">{rung.what}</Help>
              <Help label="Why">{rung.why}</Help>
              <Help label="What to do">
                <ol className="list-decimal space-y-0.5 pl-4">
                  {rung.steps.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ol>
              </Help>
              <Help label={`Goal for ${ladder.label.toLowerCase()}`}>{ladder.goal}</Help>
              <p className="mt-2.5 border-t border-gray-200 pt-2.5 text-[12px] text-gray-500">
                Still not sure? Message the team in Slack and someone will pick it up.
              </p>
            </div>
          )}

          <ol className="mt-2.5 list-decimal space-y-0.5 pl-5 text-[13.5px] text-gray-700">
            {rung.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          {rung.attachment && <Attachment attachment={rung.attachment} />}

          {(rung.script || rung.email) && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setShowEmail((v) => !v)}
                className="text-[12.5px] text-gray-500 underline hover:text-gray-900"
              >
                {showEmail ? "Hide suggested call script and email copy" : "Show suggested call script and email copy"}
              </button>
              {showEmail && (
                <div className="mt-2 space-y-2">
                  {rung.script && (
                    <p className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-gray-700">
                      {rung.script}
                    </p>
                  )}
                  {rung.email && (
                    <>
                      <div className="rounded-md border border-gray-200 bg-gray-50">
                        <p className="border-b border-gray-200 px-3 py-2 text-[12.5px] font-semibold text-gray-900">
                          {fill(rung.email.subject, ctx)}
                        </p>
                        <p className="max-h-72 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 text-[12.5px] leading-relaxed text-gray-700">
                          {fill(rung.email.body, ctx)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={flyer}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12.5px] font-medium text-primary-700 underline hover:no-underline"
                        >
                          Open the flyer
                        </a>
                        <span className="text-[12px] text-gray-400">
                          Send it from your own inbox so the reply comes back to you.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {rung.fanout && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                What you found
              </p>
              {found.length === 0 ? (
                <p className="mt-0.5 text-[12.5px] text-gray-500">
                  Add each one you found. Every name becomes its own record with its own
                  outreach.
                </p>
              ) : (
                <ul className="mt-1">
                  {found.map((n, i) => (
                    <li
                      key={`${n}-${i}`}
                      className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0"
                    >
                      <span className="flex-1 text-[13.5px] text-gray-900">{n}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${n}`}
                        onClick={() => onFound(found.filter((_, j) => j !== i))}
                        className="px-1 text-[15px] leading-none text-gray-400 hover:text-error-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addName(draftName);
                }}
              >
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Name it and press Add"
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none"
                />
                <button type="submit" disabled={!draftName.trim()} className={draftName.trim() ? BTN : `${BTN} cursor-not-allowed opacity-40`}>
                  Add
                </button>
              </form>

              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-gray-400">Common here:</span>
                  {suggestions.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => addName(n)}
                      className="rounded-full border border-gray-300 px-2.5 py-1 text-[12px] text-gray-600 hover:border-primary-600 hover:text-primary-700"
                    >
                      + {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(rung.collects ?? []).map((f) => (
            <label key={f} className="mt-3 flex items-center gap-2.5">
              <span className="w-20 shrink-0 text-[12px] text-gray-500">{FIELD_LABEL[f]}</span>
              <input
                value={record[f]}
                onChange={(e) => onField(f, e.target.value)}
                placeholder={FIELD_HINT[f] ?? "—"}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
              />
            </label>
          ))}

          {(rung.inputs ?? []).map((f) => (
            <label key={f.key} className="mt-3 flex items-center gap-2.5">
              <span className="w-24 shrink-0 text-[12px] text-gray-500">{f.label}</span>
              <input
                type={f.type ?? "text"}
                value={task.fields?.[f.key] ?? ""}
                onChange={(e) => onFieldValue(f.key, e.target.value)}
                placeholder={f.type === "url" ? "https://…" : "—"}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
              />
            </label>
          ))}

          {!replying && <Note value={task.note} onChange={onNote} />}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {rung.actions.map((a, i) => {
              const blocked = needsNames && a.outcome === "fanout";
              return (
                <button
                  key={a.label}
                  type="button"
                  disabled={blocked}
                  onClick={() => onAct(i)}
                  title={a.hint}
                  className={`${
                    i === 0
                      ? BTN_GO
                      : a.outcome === "closed" || a.outcome === "archive"
                        ? BTN_BAD
                        : BTN
                  } ${blocked ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {a.outcome === "archive" && attempts >= 3
                    ? `Archive — ${attempts} attempts`
                    : a.label}
                </button>
              );
            })}
            {rung.reply && (
              <button
                type="button"
                onClick={() => {
                  setReplying(true);
                  setShowDefer(false);
                  setShowStop(false);
                }}
                className={BTN}
              >
                They replied
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowDefer((v) => !v);
                setShowStop(false);
              }}
              className={BTN}
            >
              Not yet
            </button>
            {/*
              Stopping is about a record somebody keeps contacting: a wrong
              number, a person who left, an agency that asked us to stop. A
              channel has none of those. The status it can take instead is
              "not available here", which belongs with the channel rather
              than on a task, and is not built yet.
            */}
            {record.section !== "jobboard" && (
              <button
                type="button"
                aria-label="More"
                onClick={() => {
                  setShowStop((v) => !v);
                  setShowDefer(false);
                }}
                className={`${BTN} tracking-widest text-gray-500`}
              >
                ···
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-3 rounded-md border border-primary-200 bg-primary-25 px-3.5 py-3">
              <label
                htmlFor="reply-note"
                className="text-[11px] font-semibold uppercase tracking-wide text-primary-800"
              >
                What they said
              </label>
              <p className="mt-0.5 text-[12px] text-gray-600">
                Paste their reply or write the gist, and anything they asked for. This is the
                only record of it.
              </p>
              <textarea
                id="reply-note"
                autoFocus
                value={task.note}
                onChange={(e) => onNote(e.target.value)}
                rows={4}
                placeholder="Paste the reply here…"
                className="mt-2 w-full resize-y rounded-md border border-gray-300 px-2.5 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!task.note.trim()}
                  onClick={() => {
                    setReplying(false);
                    onAct(-1);
                  }}
                  className={task.note.trim() ? BTN_GO : `${BTN_GO} cursor-not-allowed opacity-40`}
                >
                  Save and move on
                </button>
                <button type="button" onClick={() => setReplying(false)} className={BTN}>
                  Cancel
                </button>
                {!task.note.trim() && (
                  <span className="text-[12px] text-gray-500">Write something first.</span>
                )}
              </div>
            </div>
          )}

          {showDefer && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {DEFERRALS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => onDefer(d.days)}
                  className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12.5px] font-medium text-gray-700 hover:border-primary-600 hover:text-primary-700"
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {showStop && (
            <div className="mt-2.5 overflow-hidden rounded-md border border-gray-200">
              {STOP_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onStop(r)}
                  className="block w-full border-b border-gray-100 px-3 py-2.5 text-left text-[12.5px] text-gray-700 last:border-b-0 hover:bg-gray-50"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

/**
 * A document to look at while doing the rung.
 *
 * Served through the guarded SOP route by key, never as a public URL: these
 * are internal, and the route is the one place that decides who sees them.
 */
export function Attachment({ attachment }: { attachment: { label: string; doc: string } }) {
  return (
    <a
      href={`/api/admin/medjobs/sop?doc=${encodeURIComponent(attachment.doc)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary-700 hover:underline"
    >
      <DocIcon />
      {attachment.label}
    </a>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.1 1.4H4a1.3 1.3 0 0 0-1.3 1.3v8.6A1.3 1.3 0 0 0 4 12.6h6a1.3 1.3 0 0 0 1.3-1.3V4.6z" />
      <path d="M8.1 1.4v3.2h3.2" />
    </svg>
  );
}

function Help({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-[13px] leading-snug text-gray-700">{children}</div>
    </div>
  );
}

function Note({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Please leave a note before logging."
      rows={2}
      className="mt-3 w-full resize-y rounded-md border border-gray-300 px-2.5 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none"
    />
  );
}

const BTN =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-gray-800 hover:bg-gray-50";
const BTN_GO =
  "rounded-md border border-primary-600 bg-primary-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-primary-700";
const BTN_BAD =
  "rounded-md border border-error-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-error-700 hover:bg-error-50";
