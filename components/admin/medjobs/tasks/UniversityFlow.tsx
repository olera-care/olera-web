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
import TaskView from "./TaskView";

/**
 * A university, opened. It hands you one task, and when you finish it, the
 * next one — the record in hand first, then the next record in ladder
 * order. There is no list in between, because the list was never the work.
 *
 * Closing to the record is the only detour, and it is one click on the
 * name at the top of the task.
 */

type View =
  | { kind: "task"; recordId: string; taskId: string }
  | { kind: "record"; recordId: string }
  | { kind: "empty" };

export default function UniversityFlow({
  university,
  onClose,
  onChanged,
}: {
  university: BoardUniversity;
  onClose: () => void;
  /** The board behind needs its counts back after every change. */
  onChanged: () => void;
}) {
  const first = nextReady(university);
  const [view, setView] = useState<View>(
    first ? { kind: "task", recordId: first.record.id, taskId: first.task.id } : { kind: "empty" },
  );
  const [, force] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
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

  const celebrate = (msg: string) => {
    setCheer(msg);
    timers.current.push(window.setTimeout(() => setCheer(null), 1700));
  };

  const records = Object.values(university.records).flat();
  const record = "recordId" in view ? records.find((r) => r.id === view.recordId) ?? null : null;
  const task =
    view.kind === "task" && record ? record.tasks.find((t) => t.id === view.taskId) ?? null : null;

  /** Where every change lands: the next task, or the end of the day. */
  const land = (effect: Effect) => {
    if (effect.landOn) {
      setView({ kind: "task", recordId: effect.landOn.record.id, taskId: effect.landOn.task.id });
    } else {
      setView({ kind: "empty" });
    }
    redraw();
    if (effect.universityCleared) {
      celebrate(`${university.name} is clear for today`);
      timers.current.push(window.setTimeout(onClose, 1500));
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
            onClick={() => setView(pickUp())}
            className="text-[12.5px] text-primary-700 hover:underline"
          >
            {university.name}
          </button>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {left ? `${left} to do` : "Nothing left today"}
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
          onField={(f, v) => {
            record[f] = v;
            force((n) => n + 1);
          }}
          onOpenTask={(t: BoardTask) => setView({ kind: "task", recordId: record.id, taskId: t.id })}
          onRevive={() => {
            const t = revive(record);
            setView({ kind: "task", recordId: record.id, taskId: t.id });
            redraw();
          }}
        />
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-[14px] font-medium text-gray-900">Nothing left here today</p>
          <p className="mt-1 text-[13px] text-gray-500">Close this and take the next university.</p>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      {cheer && <Cheer message={cheer} />}
    </DrawerShell>
  );

  function pickUp(): View {
    const nx = nextReady(university, record);
    return nx ? { kind: "task", recordId: nx.record.id, taskId: nx.task.id } : { kind: "empty" };
  }
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
