"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";

// ── Types ──

interface DeletionRequest {
  id: string;
  display_name: string;
  type: string;
  category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  source_provider_id: string | null;
  claim_state: string;
  deletion_requested_at: string;
  requester_email: string | null;
}

interface DeletedProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  deleted: boolean;
  deleted_at: string | null;
  linked_profile: {
    profile_id: string;
    display_name: string;
    deletion_approved_at: string;
  } | null;
}

type Tab = "requests" | "history";
type ActionType = "approve" | "deny" | "restore" | "purge";

// ── Page ──

export default function AdminDeletionsPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [history, setHistory] = useState<DeletedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: ActionType;
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/deletions?tab=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (tab === "requests") {
        setRequests(data.requests ?? []);
      } else {
        setHistory(data.history ?? []);
      }
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: ActionType, id: string) => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/deletions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      setConfirmAction(null);
      await fetchData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deletions</h1>
        <p className="text-lg text-gray-600 mt-1">
          Manage provider deletion requests and deleted listing history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === "requests"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Requests
          {requests.length > 0 && tab !== "requests" && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {requests.length}
            </span>
          )}
          {requests.length > 0 && tab === "requests" && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold">
              {requests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === "history"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          History
          {history.length > 0 && tab === "history" && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : tab === "requests" ? (
        <RequestsTab
          requests={requests}
          actionLoading={actionLoading}
          confirmAction={confirmAction}
          onConfirm={setConfirmAction}
          onAction={handleAction}
          daysSince={daysSince}
        />
      ) : (
        <HistoryTab
          history={history}
          actionLoading={actionLoading}
          confirmAction={confirmAction}
          onConfirm={setConfirmAction}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

// ── Requests Tab ──

function RequestsTab({
  requests,
  actionLoading,
  confirmAction,
  onConfirm,
  onAction,
  daysSince,
}: {
  requests: DeletionRequest[];
  actionLoading: string | null;
  confirmAction: { type: ActionType; id: string; name: string } | null;
  onConfirm: (v: { type: ActionType; id: string; name: string } | null) => void;
  onAction: (action: ActionType, id: string) => void;
  daysSince: (d: string) => number;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">No deletion requests</p>
        <p className="text-sm text-gray-500 mt-1">All provider pages are active</p>
      </div>
    );
  }

  return (
    <div>
      {/* Warning banner */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-amber-700">
          Providers listed here have requested deletion of their page.
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((req) => {
          const days = daysSince(req.deletion_requested_at);
          const isConfirming = confirmAction?.id === req.id;

          return (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {req.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Requested{" "}
                    {new Date(req.deletion_requested_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </p>
                </div>
                <div className="text-center shrink-0 ml-4">
                  <p className="text-2xl font-bold text-red-500">{days}</p>
                  <p className="text-xs text-gray-400">days</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4">
                {req.requester_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">{req.requester_email}</span>
                  </div>
                )}
                {req.city && req.state && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {req.city}, {req.state}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-600">owner</span>
                </div>
              </div>

              {/* Actions */}
              {isConfirming ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    {confirmAction.type === "approve"
                      ? `Approving will soft-delete ${req.display_name}. You can restore or permanently purge it later from History.`
                      : `This will dismiss the deletion request. ${req.display_name} will remain active.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAction(confirmAction.type, req.id)
                      }
                      disabled={actionLoading === req.id}
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
                        confirmAction.type === "approve"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      {actionLoading === req.id
                        ? "Processing..."
                        : confirmAction.type === "approve"
                        ? "Approve Deletion"
                        : "Deny Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirm(null)}
                      disabled={actionLoading === req.id}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onConfirm({ type: "approve", id: req.id, name: req.display_name })
                  }
                  className="w-full bg-red-50 border border-red-200 text-red-600 font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Review Deletion Request
                </button>
              )}

              {/* Deny link — always visible below the main action */}
              {!isConfirming && (
                <button
                  type="button"
                  onClick={() =>
                    onConfirm({ type: "deny", id: req.id, name: req.display_name })
                  }
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Deny request instead
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History Tab ──

function HistoryTab({
  history,
  actionLoading,
  confirmAction,
  onConfirm,
  onAction,
}: {
  history: DeletedProvider[];
  actionLoading: string | null;
  confirmAction: { type: ActionType; id: string; name: string } | null;
  onConfirm: (v: { type: ActionType; id: string; name: string } | null) => void;
  onAction: (action: ActionType, id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">No deletion history</p>
        <p className="text-sm text-gray-500 mt-1">No providers have been deleted yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-600">
          Previously deleted providers. Restore or permanently purge records.
        </p>
      </div>

      <div className="space-y-4">
        {history.map((item) => {
          const isConfirming = confirmAction?.id === item.provider_id;

          return (
            <div
              key={item.provider_id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900 line-through decoration-gray-400">
                      {item.provider_name}
                    </h3>
                    <Badge variant="rejected">DELETED</Badge>
                  </div>
                  {item.city && item.state && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {item.city}, {item.state}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-14 shrink-0">Type</span>
                  <span className="text-gray-600">{item.provider_category}</span>
                </div>
                {item.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-14 shrink-0">Phone</span>
                    <span className="text-gray-600">{item.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-14 shrink-0">ID</span>
                  <span className="text-gray-500 font-mono text-xs">
                    {item.provider_id}
                  </span>
                </div>
                {item.deleted_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-14 shrink-0">Deleted</span>
                    <span className="text-gray-600">
                      {new Date(item.deleted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isConfirming ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    {confirmAction.type === "restore"
                      ? `This will restore ${item.provider_name} and make it visible in search results again.`
                      : `This will permanently delete ${item.provider_name}. This action cannot be undone.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAction(confirmAction.type, item.provider_id)
                      }
                      disabled={actionLoading === item.provider_id}
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
                        confirmAction.type === "purge"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-primary-600 text-white hover:bg-primary-700"
                      }`}
                    >
                      {actionLoading === item.provider_id
                        ? "Processing..."
                        : confirmAction.type === "restore"
                        ? "Confirm Restore"
                        : "Permanently Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirm(null)}
                      disabled={actionLoading === item.provider_id}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onConfirm({
                        type: "restore",
                        id: item.provider_id,
                        name: item.provider_name,
                      })
                    }
                    className="flex-1 bg-primary-50 border border-primary-200 text-primary-600 font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onConfirm({
                        type: "purge",
                        id: item.provider_id,
                        name: item.provider_name,
                      })
                    }
                    className="flex-1 bg-red-50 border border-red-200 text-red-600 font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Purge
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
