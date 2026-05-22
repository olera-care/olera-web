"use client";

/**
 * v9.0 Phase 7 Commit B: EntityStepBoard.
 *
 * Drawer section that renders the Step Board for a Client / Candidate
 * / Site — entities outside the legacy stakeholder workflow. Backed by
 * the polymorphic task tables added in migration 075:
 *   client + candidate → business_profile_tasks (kind discriminator)
 *   site               → site_tasks
 *
 * MVP scope: custom (manual_followup) tasks only. No auto-firing
 * cadence, no scheduled reminders. Add Step → text → Save; complete
 * marks the task done; delete cancels it.
 *
 * The stakeholder-side Step Board (in app/admin/student-outreach/Drawer.tsx)
 * has a richer model with multiple task_types and scheduled-vs-actionable
 * partitioning. This component intentionally stays simpler — it's the
 * minimum surface to attach a follow-up reminder to a non-stakeholder
 * entity.
 */

import { useCallback, useEffect, useState } from "react";
import { AddStakeholderTaskModal } from "@/app/admin/student-outreach/AddStakeholderTaskModal";
import { StepBoardCard } from "@/components/admin/medjobs/StepBoardCard";

interface EntityTask {
  id: string;
  task_type: "manual_followup";
  due_at: string;
  status: "pending" | "completed" | "cancelled" | "superseded";
  payload: Record<string, unknown> | null;
  created_at: string;
}

type EntityKind = "client" | "candidate" | "site";

interface Props {
  kind: EntityKind;
  /** business_profile_id for client/candidate; campus_id for site. */
  entityId: string;
  /** Display name for the modal header. */
  entityName: string;
  /** Optional callback fired after any mutation, so the host can
   *  refetch its tab counts / inventory. */
  onChange?: () => void;
}

function endpoints(kind: EntityKind) {
  if (kind === "site") {
    return {
      list: (id: string) => `/api/admin/medjobs/site-tasks?campus_id=${encodeURIComponent(id)}`,
      create: "/api/admin/medjobs/site-tasks",
      patch: (taskId: string) => `/api/admin/medjobs/site-tasks/${taskId}`,
      bodyForCreate: (id: string, summary: string) => ({ campus_id: id, summary }),
    };
  }
  return {
    list: (id: string) =>
      `/api/admin/medjobs/business-profile-tasks?business_profile_id=${encodeURIComponent(id)}&kind=${kind}`,
    create: "/api/admin/medjobs/business-profile-tasks",
    patch: (taskId: string) => `/api/admin/medjobs/business-profile-tasks/${taskId}`,
    bodyForCreate: (id: string, summary: string) => ({
      business_profile_id: id,
      kind,
      summary,
    }),
  };
}

function summaryOf(task: EntityTask): string {
  const s = (task.payload?.summary ?? task.payload?.notes ?? task.payload?.description) as
    | string
    | undefined;
  return s?.trim() || "(no description)";
}

function relative(iso: string): string {
  const t = new Date(iso).getTime();
  const ms = Date.now() - t;
  if (Number.isNaN(t)) return "";
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (ms < hr) return `${Math.max(1, Math.round(ms / min))}m ago`;
  if (ms < day) return `${Math.round(ms / hr)}h ago`;
  return `${Math.round(ms / day)}d ago`;
}

export function EntityStepBoard({ kind, entityId, entityName, onChange }: Props) {
  const ep = endpoints(kind);
  const [tasks, setTasks] = useState<EntityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<EntityTask | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ep.list(entityId));
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = await res.json();
      const all = (body.rows ?? []) as EntityTask[];
      setTasks(all.filter((t) => t.status === "pending"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ep, entityId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const handleCreate = async (summary: string) => {
    const res = await fetch(ep.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ep.bodyForCreate(entityId, summary)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to add step");
    }
    setShowAdd(false);
    await refetch();
    onChange?.();
  };

  const handleEdit = async (summary: string) => {
    if (!editing) return;
    const res = await fetch(ep.patch(editing.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", summary }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to save step");
    }
    setEditing(null);
    await refetch();
    onChange?.();
  };

  const patch = async (taskId: string, action: "complete" | "cancel") => {
    try {
      const res = await fetch(ep.patch(taskId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Action failed");
      await refetch();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step Board
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add step
        </button>
      </div>

      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      <div className="space-y-2">
        {loading ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-400">
            Loading…
          </p>
        ) : tasks.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-400">
            No steps yet. Add one to remind yourself of a follow-up.
          </p>
        ) : (
          tasks.map((t) => {
            const text = summaryOf(t);
            return (
              <StepBoardCard
                key={t.id}
                headline={text}
                subtitle="Custom step"
                footnote={`Added ${relative(t.created_at)}`}
                overflow={
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing(t)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      title="Edit step"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this step?")) void patch(t.id, "cancel");
                      }}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      title="Delete step"
                    >
                      Delete
                    </button>
                  </div>
                }
                cta={
                  <button
                    onClick={() => void patch(t.id, "complete")}
                    className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Log
                  </button>
                }
              />
            );
          })
        )}
      </div>

      {showAdd && (
        <AddStakeholderTaskModal
          organizationName={entityName}
          contactName={null}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleCreate}
        />
      )}
      {editing && (
        <AddStakeholderTaskModal
          organizationName={entityName}
          contactName={null}
          initialText={summaryOf(editing)}
          onCancel={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
    </section>
  );
}
