"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AttachmentRow } from "@/app/api/admin/medjobs/attachments/route";

/**
 * Collateral on a record.
 *
 * Named for what it holds rather than for the mechanism, and deliberately
 * not "Attachment" — TaskView already exports one of those and it means a
 * link to an SOP document, which is a different thing entirely.
 *
 * Rendered twice with the same data: on the record, where it lists
 * everything, and on a task, where `taskId` both filters the list to what
 * arrived with that task and files anything new against it.
 *
 * Signed URLs expire, so the list is fetched when it is opened rather than
 * held — a link that worked an hour ago is not a link.
 */

const KB = 1024;
const human = (n: number) =>
  n < KB ? `${n} B` : n < KB * KB ? `${Math.round(n / KB)} KB` : `${(n / KB / KB).toFixed(1)} MB`;

const icon = (mime: string) =>
  mime.startsWith("image/") ? "🖼" : mime === "application/pdf" ? "📄" : "📎";

export default function Collateral({
  outreachId,
  taskId,
  label = "Files",
  compact = false,
  onLoaded,
}: {
  outreachId: string;
  /** Set on a task: filters to that task's files and files new ones to it. */
  taskId?: string;
  label?: string;
  compact?: boolean;
  /**
   * Handed the whole record's files each time they are read.
   *
   * The record drawer wants them for the history — a finished task showing
   * what arrived with it — and one fetch shared beats every row asking.
   */
  onLoaded?: (rows: AttachmentRow[]) => void;
}) {
  const [rows, setRows] = useState<AttachmentRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/medjobs/attachments?outreachId=${encodeURIComponent(outreachId)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as { rows?: AttachmentRow[]; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load the files");
        return;
      }
      setRows(json.rows ?? []);
      onLoaded?.(json.rows ?? []);
      setError(null);
    } catch {
      setError("Could not reach the server");
    }
    // onLoaded is left out on purpose: a caller passing an inline function
    // would make this reload on every render of theirs, forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outreachId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("outreachId", outreachId);
        if (taskId) form.append("taskId", taskId);
        const res = await fetch("/api/admin/medjobs/attachments", { method: "POST", body: form });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(`${file.name}: ${json.error ?? "not uploaded"}`);
          break;
        }
      }
      await load();
    } catch {
      setError("Not uploaded — could not reach the server");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string, filename: string) => {
    if (!window.confirm(`Delete ${filename}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/medjobs/attachments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Not deleted");
        return;
      }
      await load();
    } catch {
      setError("Not deleted — could not reach the server");
    } finally {
      setBusy(false);
    }
  };

  const mine = (rows ?? []).filter((r) => (taskId ? r.taskId === taskId : true));

  // On a task with nothing attached, the whole thing is one small button.
  if (compact && mine.length === 0 && !error) {
    return (
      <div className="mt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="text-[12px] text-gray-500 underline hover:text-gray-900 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Attach a file"}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
          {mine.length > 0 ? ` · ${mine.length}` : ""}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="text-[12px] text-gray-500 underline hover:text-gray-900 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Attach a file"}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-1 rounded-md border border-error-200 bg-error-25 px-3 py-2 text-[12.5px] text-error-700">
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="mt-1 text-[12px] text-gray-400">Loading…</p>
      ) : mine.length === 0 ? (
        <p className="mt-1 text-[12px] text-gray-400">
          Nothing yet. Screenshots of their reply, a brochure, a deck they sent over.
        </p>
      ) : (
        <ul className="mt-1 space-y-1">
          {mine.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-[12.5px]">
              <span aria-hidden>{icon(r.mime)}</span>
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-primary-700 underline hover:no-underline"
                >
                  {r.filename}
                </a>
              ) : (
                <span className="min-w-0 flex-1 truncate text-gray-500">{r.filename}</span>
              )}
              <span className="shrink-0 text-[11.5px] tabular-nums text-gray-400">
                {human(r.sizeBytes)}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(r.id, r.filename)}
                className="shrink-0 text-[11.5px] text-gray-400 underline hover:text-error-700 disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
