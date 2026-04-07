"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

type StatusFilter = "pending" | "claimed" | "rejected" | "all";

interface Provider {
  id: string;
  display_name: string;
  type: string;
  category: string | null;
  city: string | null;
  state: string | null;
  claim_state: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  slug: string | null;
  source_provider_id: string | null;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/providers?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
      } else {
        setError("Failed to load providers. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
      setError("Failed to load providers. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setSelectedIds(new Set());
    fetchProviders();
  }, [fetchProviders]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setProviders((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed to ${action} provider. Please try again.`);
      }
    } catch (err) {
      console.error("Action failed:", err);
      setActionError(`Failed to ${action} provider. Please check your connection.`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkAction(action: "approve" | "reject" | "delete") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    setActionError(null);

    try {
      if (action === "delete") {
        const res = await fetch("/api/admin/providers", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data.error || "Failed to delete providers.");
          return;
        }
      } else {
        const res = await fetch("/api/admin/providers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds), action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data.error || `Failed to ${action} providers.`);
          return;
        }
      }
      setSelectedIds(new Set());
      fetchProviders();
    } catch {
      setActionError("Network error during bulk action.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/providers/export?status=${filter}`);
      if (!res.ok) {
        setActionError("Failed to export claims.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `olera-claims-${filter}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Failed to export claims.");
    } finally {
      setExporting(false);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === providers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(providers.map((p) => p.id)));
    }
  };

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "claimed" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
            <p className="text-lg text-gray-600 mt-1">
              Review and manage provider claim requests.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-800">
            {selectedIds.size} selected
          </span>
          {filter === "pending" && (
            <>
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                Approve selected
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                Reject selected
              </button>
            </>
          )}
          <button
            onClick={() => setConfirmBulkDelete(true)}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Delete selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No providers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={providers.length > 0 && selectedIds.size === providers.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  {filter === "pending" && (
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider) => (
                  <tr key={provider.id} className={`hover:bg-gray-50 ${selectedIds.has(provider.id) ? "bg-blue-50" : ""}`}>
                    <td className="w-10 px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(provider.id)}
                        onChange={() => toggleSelect(provider.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{provider.display_name}</p>
                      {provider.email && (
                        <p className="text-sm text-gray-500">{provider.email}</p>
                      )}
                      {provider.slug && (
                        <Link
                          href={`/provider/${provider.slug}`}
                          target="_blank"
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View Public Profile &rarr;
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {provider.type === "organization" ? "Organization" : "Caregiver"}
                      {provider.category && (
                        <span className="text-gray-400"> / {provider.category.replace(/_/g, " ")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {[provider.city, provider.state].filter(Boolean).join(", ") || "\u2014"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(provider.claim_state)}>
                        {provider.claim_state}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(provider.created_at).toLocaleDateString()}
                    </td>
                    {filter === "pending" && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleAction(provider.id, "approve")}
                            disabled={actionLoading === provider.id}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(provider.id, "reject")}
                            disabled={actionLoading === provider.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete {selectedIds.size} provider{selectedIds.size === 1 ? "" : "s"}</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete the selected provider profiles. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmBulkDelete(false); handleBulkAction("delete"); }}
                disabled={bulkLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusVariant(state: string): "pending" | "verified" | "rejected" | "default" {
  switch (state) {
    case "pending":
      return "pending";
    case "claimed":
      return "verified";
    case "rejected":
      return "rejected";
    default:
      return "default";
  }
}
