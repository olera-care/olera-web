"use client";

import { useEffect, useRef, useState } from "react";
import { LADDERS, rungAt, type ContactField } from "@/lib/medjobs/ladders";
import { Attachment } from "./TaskView";
import {
  dueLabel,
  formatPhone,
  isCheck,
  isReady,
  longDate,
  shortDate,
  stillToCome,
  taskTitle,
  type BoardRecord,
  type BoardTask,
} from "@/lib/medjobs/task-board";

/**
 * The record — a provider, advising office, student org, event or
 * professor. This is where everything that has happened is held: who we
 * talk to, what was done and when, what was learned, and what the ladder
 * still has in store.
 *
 * Notes live here and only here. In the university list they were noise.
 */

const FIELDS: ContactField[] = ["contact", "role", "phone", "email"];
const LABEL: Record<ContactField, string> = {
  contact: "Primary contact",
  role: "Role",
  phone: "Phone",
  email: "Email",
};

/**
 * What a job board has instead of a person.
 *
 * A channel is not somebody you call, so Primary contact, Role, Phone and
 * Address described nothing and sat there as six dashes. These are the two
 * links the rungs are actually about, plus whoever owns the board if anyone
 * does.
 */
export type ChannelField = "boardUrl" | "postingUrl" | "contact" | "email" | "servicesEmail";

const CHANNEL_LINKS: Array<{ key: ChannelField; label: string; hint: string }> = [
  { key: "boardUrl", label: "Job board link", hint: "Where an employer signs in or submits" },
  { key: "postingUrl", label: "Listing link", hint: "The live posting, once it is up" },
];

const CHANNEL_PEOPLE: Array<{ key: ChannelField; label: string }> = [
  { key: "contact", label: "Name" },
  { key: "email", label: "Email" },
  { key: "servicesEmail", label: "Employer services" },
];

/** Bare host for display: the scheme and a trailing slash are noise here. */
function tidyHost(url: string): string {
  const v = url.trim();
  if (!v) return "";
  return v.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
}

/** What an href needs, from whatever somebody typed. */
function href(url: string): string {
  const v = url.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/**
 * Directions from this address to campus.
 *
 * The rung asks whether a provider is within an hour's drive, and that is a
 * question only a routing engine can answer — straight-line distance says
 * nothing about a mountain or a lake. Pre-filling both ends turns the check
 * into a click.
 */
function directions(address: string, destination: string): string {
  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${encodeURIComponent(address.trim())}` +
    `&destination=${encodeURIComponent(destination)}` +
    "&travelmode=driving"
  );
}

export default function RecordView({
  record,
  onField,
  onSaveFields,
  onWebsite,
  onRename,
  onAddress,
  onField2,
  onChannelField,
  onOpenTask,
  onCheck,
  onRevive,
  onArchive,
  onDelete,
  campus,
  busy,
}: {
  record: BoardRecord;
  onField: (field: ContactField, value: string) => void;
  /** Persist what was typed. Called on blur, not on every keystroke. */
  onSaveFields: () => void;
  /** The website an admin typed, which wins over whatever the directory has. */
  onWebsite: (value: string) => void;
  /** Rename the record — the agency trades under something else. */
  onRename: (value: string) => void;
  /** Where they are. Directory value unless somebody has corrected it. */
  onAddress: (value: string) => void;
  /** The second person, if the disclosure is open. */
  onField2: (field: ContactField, value: string) => void;
  /** Job board only: one of the channel's own fields changed. */
  onChannelField: (field: ChannelField, value: string) => void;
  onOpenTask: (task: BoardTask) => void;
  /** Tick or untick a rung that is worked here rather than on its own screen. */
  onCheck: (task: BoardTask, done: boolean) => void;
  onRevive: () => void;
  onArchive: () => void;
  /** Destroys the record. The caller confirms first. */
  onDelete: () => void;
  /** The university this record sits under — the other end of the drive. */
  campus?: { name: string; destination: string } | null;
  busy?: boolean;
}) {
  const ladder = LADDERS[record.section];
  const ready = record.tasks.filter(isReady);
  const scheduled = record.tasks.filter((t) => !t.done && !isReady(t));
  const history = record.tasks.filter((t) => t.done).slice().reverse();
  const ahead = stillToCome(record);
  const [editingName, setEditingName] = useState(false);
  const site = record.website ?? "";
  // A channel is not a record somebody created, so there is no name to
  // correct and nothing to archive or destroy. Offering either would be a
  // button that can only fail.
  const isChannel = record.section === "jobboard";
  // A student is somebody with their own profile. The board shows what it
  // needs to work them and links to the rest; correcting their name or
  // destroying them from an outreach screen is not ours to offer.
  const isStudent = record.section === "students";
  const fixed = isChannel || isStudent;
  const stopped =
    record.step === null && record.state !== null && record.state !== ladder.goal && record.state !== "done";

  return (
    <div className="px-5 py-4">
      {/*
        One line to work the record from: who they are, where to check them,
        and what to do about them. The name and the link sit together because
        the review is a glance between the two; the menu is pushed right so a
        destructive action is never under the cursor by accident.
      */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              value={record.name}
              onChange={(e) => onRename(e.target.value)}
              onBlur={() => {
                setEditingName(false);
                onSaveFields();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="w-full rounded-md border border-primary-600 bg-white px-2 py-1 text-[15px] font-semibold text-gray-900 focus:outline-none"
            />
          ) : (
            <h3 className="text-[15px] font-semibold leading-snug text-gray-900">
              {record.name}
              {!fixed && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  aria-label="Edit the name"
                  title="Edit the name"
                  className="ml-1.5 inline-flex align-middle text-gray-300 hover:text-gray-600"
                >
                  <PencilIcon />
                </button>
              )}
              {site && (
                <>
                  {" "}
                  <a
                    href={href(site)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 align-middle text-[12.5px] font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800 hover:decoration-primary-600"
                  >
                    <LinkIcon />
                    {tidyHost(site)}
                  </a>
                </>
              )}
            </h3>
          )}
          {record.state && (
            <p className="mt-0.5 text-[12.5px] text-gray-500">{record.state}</p>
          )}
          {isStudent && <ProfileLinks record={record} />}
        </div>
        {!fixed && <RecordMenu onArchive={onArchive} onDelete={onDelete} disabled={busy} />}
      </div>

      {isStudent ? (
        <StudentFields record={record} />
      ) : isChannel ? (
        <ChannelFields record={record} onChannelField={onChannelField} onSaveFields={onSaveFields} />
      ) : (
        <>
        <div className="mt-4 space-y-1.5">
          {FIELDS.map((f) => (
            <label key={f} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 text-[12px] text-gray-500">{LABEL[f]}</span>
              <input
                value={record[f]}
                onChange={(e) => onField(f, e.target.value)}
                onBlur={() => {
                  // Punctuate on the way out, so the field shows what is saved.
                  if (f === "phone") onField(f, formatPhone(record.phone));
                  onSaveFields();
                }}
                placeholder="—"
                className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
              />
            </label>
          ))}

          {/* Under Email, so a missing one can be filled in while you are here. */}
          <label className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] text-gray-500">Website</span>
            <input
              value={site}
              onChange={(e) => onWebsite(e.target.value)}
              onBlur={onSaveFields}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
            />
          </label>

          {/* Under Website, because checking the site and checking where they
              are is the same pass. */}
          <label className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] text-gray-500">Address</span>
            <input
              value={record.address ?? ""}
              onChange={(e) => onAddress(e.target.value)}
              onBlur={onSaveFields}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
            />
            {(record.address ?? "").trim() && campus && (
              <a
                href={directions(record.address, campus.destination)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Drive time to ${campus.name}`}
                aria-label={`Drive time to ${campus.name}`}
                className="shrink-0 rounded-md px-1.5 py-1 text-gray-400 hover:bg-gray-100 hover:text-primary-700"
              >
                <RouteIcon />
              </a>
            )}
          </label>
        </div>

        <SecondContact record={record} onField2={onField2} onSaveFields={onSaveFields} />
        </>
      )}

      {stopped && (
        <button
          type="button"
          onClick={onRevive}
          className="mt-4 rounded-md border border-gray-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-gray-800 hover:bg-gray-50"
        >
          Start this up again
        </button>
      )}

      <Band label="To do">
        {ready.map((t) => (
          <AnyRow key={t.id} task={t} busy={busy} onOpen={onOpenTask} onCheck={onCheck} />
        ))}
      </Band>
      <Band label="Scheduled">
        {scheduled.map((t) => (
          <AnyRow key={t.id} task={t} busy={busy} onOpen={onOpenTask} onCheck={onCheck} />
        ))}
      </Band>
      <SystemBand record={record} />
      <Band label="History">
        {history.map((t) => (
          <AnyRow key={t.id} task={t} done busy={busy} onOpen={onOpenTask} onCheck={onCheck} />
        ))}
      </Band>

      {ahead.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Still to come
          </p>
          {ahead.map((a) => (
            <div key={a.title} className="flex items-center gap-2 border-b border-gray-100 py-2 last:border-b-0">
              <span className="text-[13px] text-gray-300">☐</span>
              <span className="flex-1 text-[13px] text-gray-400">{a.title}</span>
              {a.recurring && <span className="text-[11.5px] text-gray-400">recurring</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * The two screens that belong to a student, named rather than drawn.
 *
 * An unlabelled arrow by somebody's name could go anywhere, and these two go
 * somewhere quite different: one is where you change what we hold about
 * them, the other is what a provider sees when we say here is a candidate.
 * Worth being able to look at the second before sending anybody to it.
 */
function ProfileLinks({ record }: { record: BoardRecord }) {
  const links = [
    { href: record.profileUrl, label: "Admin profile" },
    { href: record.publicUrl, label: "Public profile" },
  ].filter((l) => l.href);
  if (links.length === 0) return null;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800 hover:decoration-primary-600"
        >
          <OpenIcon />
          {l.label}
        </a>
      ))}
    </p>
  );
}

/**
 * A student, as a record.
 *
 * Read only, and deliberately. Everything here is the student's own profile,
 * which they filled in and can change; an outreach board that let somebody
 * overwrite it from the side would make two versions of the same person. The
 * arrow by their name opens the screen where it is edited.
 *
 * The application line is the one thing worth having in front of you while
 * working them, because the rung that follows is chasing exactly what it
 * lists.
 */
function StudentFields({ record }: { record: BoardRecord }) {
  const rows: Array<[string, string]> = [
    ["Applied", record.appliedOn ? longDate(record.appliedOn) : ""],
    ["Email", record.email],
    ["Phone", record.phone],
    ["Program", record.program ?? ""],
  ];
  const done = record.facts?.application_complete;
  const missing = record.missing ?? [];

  return (
    <div className="mt-4 space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-24 shrink-0 text-[12px] text-gray-500">{label}</span>
          <span className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-[13px] text-gray-900">
            {value?.trim() ? (
              label === "Email" ? (
                <a href={`mailto:${value}`} className="text-primary-700 hover:underline">
                  {value}
                </a>
              ) : label === "Phone" ? (
                <a
                  href={`tel:${value.replace(/[^\d+]/g, "")}`}
                  className="text-primary-700 hover:underline"
                >
                  {value}
                </a>
              ) : (
                value
              )
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </span>
        </div>
      ))}

      <div className="flex items-start gap-2.5 pt-0.5">
        <span className="w-24 shrink-0 pt-1.5 text-[12px] text-gray-500">Application</span>
        <div className="min-w-0 flex-1 px-2.5 py-1.5">
          <span
            className={`text-[13px] font-medium ${done ? "text-success-700" : "text-gray-900"}`}
          >
            {done ? "Complete" : `${record.completeness ?? 0}%`}
          </span>
          {!done && missing.length > 0 && (
            <p className="mt-0.5 text-[12px] leading-snug text-gray-500">
              missing {missing.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The rungs nobody had to do.
 *
 * Its own band, not History, because History is what somebody did. Telling
 * an operator that a thing is done matters as much as telling them what is
 * left — it is the difference between not chasing a student and chasing one
 * who finished their application a week ago.
 */
function SystemBand({ record }: { record: BoardRecord }) {
  const steps = LADDERS[record.section].steps;
  const rows = steps
    .map((rung, i) => ({ rung, i }))
    .filter(({ rung }) => rung.satisfiedBy && record.facts?.[rung.satisfiedBy]);
  if (rows.length === 0) return null;

  return (
    <>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Done by the system
      </p>
      {rows.map(({ rung, i }) => {
        const when = record.facts?.[rung.satisfiedBy as string];
        return (
          <div key={i} className="border-b border-gray-100 py-2 last:border-b-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-success-600">☑</span>
              <span className="flex-1 text-[13px] text-gray-400 line-through">{rung.title}</span>
              <span className="text-[11.5px] text-gray-500">
                {typeof when === "string" ? shortDate(when) : ""}
              </span>
            </div>
            {rung.satisfiedNote && (
              <p className="-mt-0.5 pb-1 pl-6 text-[12px] text-gray-500">{rung.satisfiedNote}</p>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * A job board, as a record.
 *
 * Two links and, optionally, whoever owns the board. The links sit at the
 * top because they are what every rung on this ladder is about: one rung
 * finds the first, another finds the second, and the rest are checks you
 * make by opening them. Each shows an arrow once there is something to
 * open, so the check is a click rather than a copy-paste.
 */
function ChannelFields({
  record,
  onChannelField,
  onSaveFields,
}: {
  record: BoardRecord;
  onChannelField: (field: ChannelField, value: string) => void;
  onSaveFields: () => void;
}) {
  const people = CHANNEL_PEOPLE.map((f) => (record[f.key] ?? "").trim()).filter(Boolean);
  const [open, setOpen] = useState(people.length > 0);

  return (
    <>
      <div className="mt-4 space-y-1.5">
        {CHANNEL_LINKS.map((f) => {
          const value = record[f.key] ?? "";
          return (
            <label key={f.key} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 text-[12px] text-gray-500">{f.label}</span>
              <input
                value={value}
                onChange={(e) => onChannelField(f.key, e.target.value)}
                onBlur={onSaveFields}
                placeholder="—"
                title={f.hint}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
              />
              {value.trim() && (
                <a
                  href={href(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${f.label.toLowerCase()}`}
                  aria-label={`Open ${f.label.toLowerCase()}`}
                  className="shrink-0 rounded-md px-1.5 py-1 text-gray-400 hover:bg-gray-100 hover:text-primary-700"
                >
                  <OpenIcon />
                </a>
              )}
            </label>
          );
        })}
      </div>

      {/* Nobody owns some job boards, so this stays shut until it holds
          somebody — the same promise the second contact makes. */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-primary-700 hover:text-primary-800 hover:underline"
        >
          <Chevron open={false} />
          Add a contact
        </button>
      ) : (
        <div className="mt-3 rounded-md border border-gray-100 bg-gray-50/60 p-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-1.5 flex w-full items-center gap-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
          >
            <Chevron open />
            Contact
            <span className="ml-auto text-[11px] font-medium normal-case tracking-normal">Hide</span>
          </button>
          <div className="space-y-1.5">
            {CHANNEL_PEOPLE.map((f) => (
              <label key={f.key} className="flex items-center gap-2.5">
                <span className="w-24 shrink-0 text-[12px] text-gray-500">{f.label}</span>
                <input
                  value={record[f.key] ?? ""}
                  onChange={(e) => onChannelField(f.key, e.target.value)}
                  onBlur={onSaveFields}
                  placeholder="—"
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-white px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * One row in a band, of whichever kind the rung asks for.
 *
 * Most rungs are an event with a screen of its own. A check rung is not —
 * it is finished here, by ticking it, which is why the two look different
 * on purpose: a box you can tick, rather than a row that opens something.
 */
function AnyRow({
  task,
  done,
  busy,
  onOpen,
  onCheck,
}: {
  task: BoardTask;
  done?: boolean;
  busy?: boolean;
  onOpen: (task: BoardTask) => void;
  onCheck: (task: BoardTask, done: boolean) => void;
}) {
  if (isCheck(task)) {
    return <CheckRow task={task} done={done} busy={busy} onCheck={onCheck} />;
  }
  return <Row task={task} done={done} onOpen={() => onOpen(task)} />;
}

/**
 * A rung you tick.
 *
 * Everything it asks for is already on the screen above — the name, the
 * link, the fields — so the row carries only the box, the title, and the
 * usual "i" for what the rung actually wants. Ticking is reversible while
 * nothing downstream has been logged, which is what makes a stray click
 * cost one click rather than an apology.
 */
function CheckRow({
  task,
  done,
  busy,
  onCheck,
}: {
  task: BoardTask;
  done?: boolean;
  busy?: boolean;
  onCheck: (task: BoardTask, done: boolean) => void;
}) {
  const [help, setHelp] = useState(false);
  const rung = rungAt(task.section, task.step, task.round);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2 py-2">
        <button
          type="button"
          disabled={busy}
          aria-pressed={Boolean(done)}
          onClick={() => onCheck(task, !done)}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span
            className={`text-[13px] ${
              done ? "text-success-600" : "text-gray-300 group-hover:text-primary-600"
            }`}
          >
            {done ? "☑" : "☐"}
          </span>
          <span
            className={`truncate text-[13px] ${
              done ? "text-gray-400 line-through" : "font-medium text-gray-900 group-hover:text-primary-700"
            }`}
          >
            {taskTitle(task)}
          </span>
        </button>
        {rung && (
          <button
            type="button"
            onClick={() => setHelp((v) => !v)}
            aria-label="What this task is"
            aria-expanded={help}
            className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold ${
              help
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
            }`}
          >
            i
          </button>
        )}
        <span
          className={`shrink-0 text-[11.5px] ${
            !done && isReady(task) ? "font-semibold text-warning-700" : "text-gray-500"
          }`}
        >
          {done ? (task.loggedOn ? shortDate(task.loggedOn) : "") : dueLabel(task.dueAt)}
        </span>
      </div>

      {help && rung && (
        <div className="mb-2.5 ml-6 rounded-md border border-gray-200 bg-gray-50 px-3.5 py-3">
          <Help label="What this is">{rung.what}</Help>
          <Help label="Why">{rung.why}</Help>
          <Help label="What to do">
            <ol className="list-decimal space-y-0.5 pl-4">
              {rung.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </Help>
          {rung.attachment && <Attachment attachment={rung.attachment} />}
        </div>
      )}

      {task.note && (
        <p className="-mt-0.5 pb-2 pl-6 text-[12px] leading-snug text-gray-500">{task.note}</p>
      )}
    </div>
  );
}

/** One labelled paragraph inside the "i" panel. Same look as the task screen. */
function Help({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-[13px] leading-snug text-gray-700">{children}</div>
    </div>
  );
}

function Band({ label, children }: { label: string; children: React.ReactNode[] }) {
  if (!children.length) return null;
  return (
    <>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {children}
    </>
  );
}

function Row({ task, done, onOpen }: { task: BoardTask; done?: boolean; onOpen: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2 py-2 text-left hover:bg-gray-50"
      >
        <span className={done ? "text-[13px] text-success-600" : "text-[13px] text-gray-300"}>
          {done ? "☑" : "☐"}
        </span>
        <span className={`flex-1 text-[13px] ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
          {taskTitle(task)}
        </span>
        <span
          className={`text-[11.5px] ${
            !done && isReady(task) ? "font-semibold text-warning-700" : "text-gray-500"
          }`}
        >
          {done ? (task.loggedOn ? shortDate(task.loggedOn) : "") : dueLabel(task.dueAt)}
        </span>
      </button>
      {done && task.outcome && task.outcome !== "Logged" && (
        <p className="-mt-0.5 pb-2 pl-6 text-[12px] font-semibold text-gray-600">{task.outcome}</p>
      )}
      {fieldLines(task).map((line) => (
        <p key={line} className="-mt-0.5 pb-2 pl-6 text-[12px] text-gray-600">
          {line}
        </p>
      ))}
      {task.note && <p className="-mt-0.5 pb-2 pl-6 text-[12px] leading-snug text-gray-500">{task.note}</p>}
    </div>
  );
}

/** What the task recorded — a meeting time, a posting link — read back. */
function fieldLines(task: BoardTask): string[] {
  const values = task.fields ?? {};
  const rung = rungAt(task.section, task.step, task.round);
  return (rung?.inputs ?? [])
    .filter((f) => values[f.key]?.trim())
    .map((f) => `${f.label}: ${values[f.key]}`);
}


/** The edit affordance on the name. Grey until hovered, so it is there when
 *  wanted and silent when not. */
function PencilIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.3 2.2l2.5 2.5L5 11.5l-3 .5.5-3z" />
    </svg>
  );
}

/** Open this link. An arrow leaving a box, which is what it does. */
function OpenIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 8.2v3.1a1.2 1.2 0 0 1-1.2 1.2H2.7a1.2 1.2 0 0 1-1.2-1.2V4.2A1.2 1.2 0 0 1 2.7 3h3.1" />
      <path d="M8.8 1.7h3.5v3.5" />
      <path d="M6.2 7.8l6.1-6.1" />
    </svg>
  );
}

/** A signpost for the drive to campus, next to the address. */
function RouteIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.2 1.8L1.9 6.1l4.3 1.7 1.7 4.3z" />
    </svg>
  );
}

/** A small outbound-link mark. Drawn rather than an icon font, so it inherits
 *  the link colour and never arrives a frame late. */
function LinkIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a2.5 2.5 0 0 0 3.6.3l2-2a2.5 2.5 0 0 0-3.5-3.6l-1 1" />
      <path d="M8 6a2.5 2.5 0 0 0-3.6-.3l-2 2A2.5 2.5 0 0 0 5.9 11.3l1-1" />
    </svg>
  );
}

/**
 * Archive and delete, behind a menu.
 *
 * They are out of the way on purpose. Both are one click from the top of the
 * record, but neither sits where a cursor rests, and delete is separated and
 * coloured so it cannot be mistaken for the safe one.
 */
function RecordMenu({
  onArchive,
  onDelete,
  disabled,
}: {
  onArchive: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-label="Record actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md px-2 py-1 text-[16px] leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
      >
        ···
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onArchive();
            }}
            className="block w-full px-3 py-2 text-left text-[13px] text-gray-800 hover:bg-gray-50"
          >
            Archive
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="block w-full border-t border-gray-100 px-3 py-2 text-left text-[13px] font-medium text-error-700 hover:bg-error-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The second person at an organisation.
 *
 * Collapsed, because one contact is the normal case and a second should not
 * cost the normal case any attention. It opens by itself when there is
 * already someone there, so an existing second contact is never hidden.
 */
function SecondContact({
  record,
  onField2,
  onSaveFields,
}: {
  record: BoardRecord;
  onField2: (field: ContactField, value: string) => void;
  onSaveFields: () => void;
}) {
  const existing = record.contact2;
  const filled = Boolean(
    existing && (existing.contact || existing.role || existing.phone || existing.email),
  );
  const [open, setOpen] = useState(filled);

  if (!open) {
    // Collapsed, but never silently. If somebody is in there, their name is
    // on the button, so a second contact is not hidden by a closed panel.
    const who = existing?.contact?.trim() || existing?.email?.trim();
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-primary-700 hover:text-primary-800 hover:underline"
      >
        <Chevron open={false} />
        {filled && who ? `Second contact · ${who}` : "Add a contact"}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-gray-100 bg-gray-50/60 p-2.5">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mb-1.5 flex w-full items-center gap-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
      >
        <Chevron open />
        Second contact
        <span className="ml-auto text-[11px] font-medium normal-case tracking-normal">
          Hide
        </span>
      </button>
      <div className="space-y-1.5">
        {FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] text-gray-500">
              {f === "contact" ? "Name" : LABEL[f]}
            </span>
            <input
              value={existing?.[f] ?? ""}
              onChange={(e) => onField2(f, e.target.value)}
              onBlur={() => {
                if (f === "phone") onField2(f, formatPhone(existing?.phone ?? ""));
                onSaveFields();
              }}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-white px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** The usual disclosure triangle, rotated rather than swapped. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`h-2.5 w-2.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}
