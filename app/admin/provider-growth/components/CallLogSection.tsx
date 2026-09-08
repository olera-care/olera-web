"use client";

/**
 * CallLogSection - Call logging UI for provider growth tracking
 *
 * Allows admins to log call attempts, view call history, and edit/delete their own logs.
 */

import { useState, useEffect, useCallback } from "react";
import {
  CALL_STATUSES,
  CALL_STATUS_LABELS,
  CALL_STATUS_COLORS,
  type CallStatus,
} from "@/lib/provider-growth/stages";

interface CallLogEntry {
  id: string;
  tracking_id: string;
  status: CallStatus;
  notes: string | null;
  admin_id: string;
  admin_name: string | null;
  created_at: string;
}

interface CallLogSectionProps {
  trackingId: string;
  businessProfileId: string;
  onCallLogged?: () => void;
}

export function CallLogSection({ trackingId, businessProfileId, onCallLogged }: CallLogSectionProps) {
  const [logs, setLogs] = useState<CallLogEntry[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedStatus, setSelectedStatus] = useState<CallStatus>("voicemail");
  const [callNotes, setCallNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<CallStatus>("voicemail");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/provider-growth/call-logs?tracking_id=${trackingId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setCurrentAdminId(data.current_admin_id);
      }
    } catch (e) {
      console.error("Failed to fetch call logs:", e);
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/provider-growth/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: trackingId,
          business_profile_id: businessProfileId,
          status: selectedStatus,
          notes: callNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log call");
      }

      const data = await res.json();

      // Add the new log to the top of the list
      setLogs((prev) => [data.log, ...prev]);
      setCallNotes("");
      setSelectedStatus("voicemail");

      // Notify parent to refresh
      onCallLogged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log call");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log: CallLogEntry) => {
    setEditingId(log.id);
    setEditStatus(log.status);
    setEditNotes(log.notes || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setEditError(null);

    try {
      const res = await fetch("/api/admin/provider-growth/call-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touchpoint_id: editingId,
          status: editStatus,
          notes: editNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update call log");
      }

      const data = await res.json();

      // Update the log in the list
      setLogs((prev) => prev.map((l) => (l.id === editingId ? data.log : l)));
      setEditingId(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/provider-growth/call-logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touchpoint_id: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete call log");
      }

      // Remove from list
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirmId(null);

      // Notify parent to refresh
      onCallLogged?.()
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-900">Call Log</div>

      {/* Log new call form */}
      <div className="p-3 bg-gray-50 rounded-lg space-y-3">
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CallStatus)}
            className="flex-shrink-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white"
          >
            {CALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CALL_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !submitting) {
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "..." : "Log Call"}
          </button>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>

      {/* Call history */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading calls...</div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-gray-500">No calls logged yet</div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="group p-2 bg-white border border-gray-200 rounded-lg">
              {editingId === log.id ? (
                // Edit mode
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as CallStatus)}
                      className="flex-shrink-0 rounded border border-gray-300 px-2 py-1 text-sm bg-white"
                    >
                      {CALL_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {CALL_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                  {editError && <div className="text-xs text-red-600">{editError}</div>}
                </div>
              ) : deleteConfirmId === log.id ? (
                // Delete confirmation
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Delete this call log?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatTimestamp(log.created_at)}</span>
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded ${CALL_STATUS_COLORS[log.status]}`}
                      >
                        {CALL_STATUS_LABELS[log.status]}
                      </span>
                      {log.admin_name && (
                        <span className="text-xs text-gray-400">{log.admin_name}</span>
                      )}
                    </div>
                    {log.admin_id === currentAdminId && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(log)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(log.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {log.notes && (
                    <div className="mt-1 text-sm text-gray-600">{log.notes}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
