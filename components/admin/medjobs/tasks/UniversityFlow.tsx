"use client";

import { useEffect, useRef, useState } from "react";
import { DrawerShell } from "@/components/admin/medjobs/DrawerShell";
import { rungAt, type ContactField } from "@/lib/medjobs/ladders";
import {
  complete,
  defer,
  doAgain,
  doneToday,
  nextReady,
  readyCount,
  reopen,
  revive,
  type BoardRecord,
  type BoardTask,
  type BoardUniversity,
  type Effect,
} from "@/lib/medjobs/task-board";
import RecordView from "./RecordView";
import SummaryView from "./SummaryView";
import TaskView from "./TaskView";

/**
 * A university, opened.
 *
 * It opens on the summary — the seven sections and what each is waiting on
 * — because an operator should be able to see the shape of a campus before
 * working it. Start the next task and it runs them in a row, each one
 * handing over the next without a list in between. The university name in
 * the header always comes back here.
 */

type View =
  | { kind: "summary" }
  | { kind: "task"; recordId: string; taskId: string }
  | { kind: "record"; recordId: string };

export default function UniversityFlow({
  university,
  onClose,
  onChanged,
  onReload,
}: {
  university: BoardUniversity;
  onClose: () => void;
  /**
   * An in-memory change. The board behind only needs to recount, and must
   * NOT refetch: task progress is not persisted yet, so a reload here would
   * throw away what the operator just did.
   */
  onChanged: () => void;
  /**
   * Something reached the database. Refetch, because a write changes more
   * than the field that was edited — an archived record leaves the board
   * entirely — and patching that in memory is how a screen starts lying
   * about what is saved.
   */
  onReload: () => void | Promise<void>;
}) {
  const [view, setView] = useState<View>({ kind: "summary" });
  const [, force] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  const redraw = () => {
    force((n) => n + 1);
    onChanged();
  };

  const say = (msg: string) => {
    setToast(msg);
    timers.current.push(window.setTimeout(() => setToast(null), 2200));
  };

  /**
   * Everything that has to reach the database goes through here. The board
   * is reloaded from the server afterwards rather than patched in memory,
   * because a delete changes more than the record it names and guessing at
   * the rest is how a screen starts lying about what is saved.
   */
  const send = async (payload: Record<string, unknown>, done: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/medjobs/tasks-board/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        say(json.error ?? "That did not save");
        return false;
      }
      say(done);
      await onReload();
      return true;
    } catch {
      say("Could not reach the server — nothing was saved");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const celebrate = (msg: string) => {
    setCheer(msg);
    timers.current.push(window.setTimeout(() => setCheer(null), 1700));
  };

  const records = Object.values(university.records).flat();
  const record = "recordId" in view ? records.find((r) => r.id === view.recordId) ?? null : null;
  const task =
    view.kind === "task" && record ? record.tasks.find((t) => t.id === view.taskId) ?? null : null;

  /** Where every change lands: the next task, or back to the summary. */
  const land = (effect: Effect) => {
    if (effect.landOn) {
      setView({ kind: "task", recordId: effect.landOn.record.id, taskId: effect.landOn.task.id });
    } else {
      setView({ kind: "summary" });
    }
    redraw();
    if (effect.universityCleared) {
      celebrate(`${university.name} is clear for today`);
    } else if (effect.recordCleared && record) {
      say(`${record.name} — done for today`);
    }
  };

  const act = (index: number) => {
    if (!record || !task) return;
    const rung = rungAt(task.section, task.step, task.round);
    if (!rung) return;
    const action =
      index === -1
        ? { label: "They replied", outcome: "replied" as const, delay: 0 }
        : rung.actions[index];
    if (!action) return;
    land(complete(university, record, task, action));
  };

  const left = readyCount(university);
  const done = doneToday(university);
  const pct = Math.round((done / Math.max(1, done + left)) * 100);

  return (
    <DrawerShell
      onClose={onClose}
      header={
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setView({ kind: "summary" })}
            className="text-left text-[13px] font-semibold text-gray-900 hover:underline"
          >
            {view.kind === "summary" ? university.name : `← ${university.name}`}
          </button>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {left ? `${left} task${left > 1 ? "s" : ""} waiting` : "Nothing left today"}
            {done ? ` · ${done} done` : ""}
          </p>
        </div>
      }
    >
      <div className="h-0.5 w-full bg-gray-100">
        <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {view.kind === "task" && record && task ? (
        <TaskView
          universityName={university.name}
          universitySlug={university.slug}
          record={record}
          task={task}
          onOpenRecord={() => setView({ kind: "record", recordId: record.id })}
          onAct={act}
          onDefer={(days) => land(defer(university, record, task, days))}
          onStop={(reason) => {
            const rung = rungAt(task.section, task.step, task.round);
            const action = rung?.actions[0];
            if (!action) return;
            land(complete(university, record, task, { ...action, outcome: "archive" }, reason));
          }}
          onNote={(text) => {
            task.note = text;
            force((n) => n + 1);
          }}
          onField={(f, v) => {
            record[f] = v;
            force((n) => n + 1);
          }}
          onFound={(names) => {
            task.found = names;
            force((n) => n + 1);
          }}
          onFieldValue={(key, value) => {
            task.fields = { ...(task.fields ?? {}), [key]: value };
            force((n) => n + 1);
          }}
          onReopen={() => {
            reopen(record, task);
            redraw();
          }}
          onAgain={() => {
            const copy = doAgain(record, task);
            setView({ kind: "task", recordId: record.id, taskId: copy.id });
            redraw();
          }}
        />
      ) : view.kind === "record" && record ? (
        <RecordView
          record={record}
          busy={busy}
          onField={(f, v) => {
            record[f] = v;
            force((n) => n + 1);
          }}
          onWebsite={(v) => {
            record.website = v;
            record.websiteEdited = true;
            force((n) => n + 1);
          }}
          onRename={(v) => {
            record.name = v;
            force((n) => n + 1);
          }}
          onField2={(f, v) => {
            record.contact2 = {
              contact: "",
              role: "",
              phone: "",
              email: "",
              ...(record.contact2 ?? {}),
              [f]: v,
            };
            force((n) => n + 1);
          }}
          onSaveFields={() => {
            void send(
              {
                op: "save_fields",
                recordId: record.id,
                fields: {
                  contact: record.contact,
                  role: record.role,
                  phone: record.phone,
                  email: record.email,
                },
                // Only sent when an admin has typed one. Otherwise the
                // directory stays the source and nothing is overridden with
                // a copy of what it already says.
                website: record.websiteEdited ? record.website : undefined,
                name: record.name,
                second: record.contact2,
              },
              "Saved",
            );
          }}
          onOpenTask={(t: BoardTask) => setView({ kind: "task", recordId: record.id, taskId: t.id })}
          onRevive={() => {
            const t = revive(record);
            setView({ kind: "task", recordId: record.id, taskId: t.id });
            redraw();
          }}
          onArchive={() => {
            void send({ op: "archive_record", recordId: record.id }, `${record.name} archived`)
              .then((ok) => { if (ok) setView({ kind: "summary" }); });
          }}
          onDelete={() => {
            // Destroying a record takes its call history with it, so the
            // name has to be in front of the person clicking.
            const sure = window.confirm(
              `Delete ${record.name}?\n\nThis removes the record and everything logged against it, including any calls migrated from the spreadsheet. It cannot be undone.\n\nArchive instead if you only want it off the board.`,
            );
            if (!sure) return;
            void send({ op: "delete_record", recordId: record.id }, `${record.name} deleted`)
              .then((ok) => { if (ok) setView({ kind: "summary" }); });
          }}
        />
      ) : (
        <SummaryView
          university={university}
          onStart={() => {
            const nx = nextReady(university);
            if (nx) setView({ kind: "task", recordId: nx.record.id, taskId: nx.task.id });
          }}
          onOpenRecord={(r) => setView({ kind: "record", recordId: r.id })}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      {cheer && <Cheer message={cheer} />}
    </DrawerShell>
  );
}

/** Finishing a university should feel like finishing something. */
function Cheer({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-[60] w-full max-w-2xl motion-reduce:hidden">
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-[22px] leading-none text-white">
          ✓
        </span>
      </div>
      <div className="absolute left-1/2 top-[calc(42%+46px)] -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}

export type { BoardRecord, ContactField };
