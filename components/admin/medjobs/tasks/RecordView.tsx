"use client";

import { LADDERS, rungAt, type ContactField } from "@/lib/medjobs/ladders";
import {
  dueLabel,
  isReady,
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
  contact: "Contact name",
  role: "Role",
  phone: "Phone",
  email: "Email",
};

export default function RecordView({
  record,
  onField,
  onOpenTask,
  onRevive,
}: {
  record: BoardRecord;
  onField: (field: ContactField, value: string) => void;
  onOpenTask: (task: BoardTask) => void;
  onRevive: () => void;
}) {
  const ladder = LADDERS[record.section];
  const ready = record.tasks.filter(isReady);
  const scheduled = record.tasks.filter((t) => !t.done && !isReady(t));
  const history = record.tasks.filter((t) => t.done).slice().reverse();
  const ahead = stillToCome(record);
  const stopped =
    record.step === null && record.state !== null && record.state !== ladder.goal && record.state !== "done";

  return (
    <div className="px-5 py-4">
      <h3 className="text-[15px] font-semibold text-gray-900">{record.name}</h3>
      <p className="mt-0.5 text-[12.5px] text-gray-500">
        {ladder.label}
        {record.state ? ` · ${record.state}` : ""}
      </p>

      <div className="mt-4 space-y-1.5">
        {FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2.5">
            <span className="w-20 shrink-0 text-[12px] text-gray-500">{LABEL[f]}</span>
            <input
              value={record[f]}
              onChange={(e) => onField(f, e.target.value)}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
            />
          </label>
        ))}
      </div>

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
          <Row key={t.id} task={t} onOpen={() => onOpenTask(t)} />
        ))}
      </Band>
      <Band label="Scheduled">
        {scheduled.map((t) => (
          <Row key={t.id} task={t} onOpen={() => onOpenTask(t)} />
        ))}
      </Band>
      <Band label="History">
        {history.map((t) => (
          <Row key={t.id} task={t} done onOpen={() => onOpenTask(t)} />
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
