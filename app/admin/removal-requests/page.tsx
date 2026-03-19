"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";

interface RemovalRequest {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_slug: string | null;
  full_name: string;
  business_email: string;
  business_phone: string;
  action: "hide" | "delete";
  reason: string;
  additional_details: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

type StatusFilter = "pending" | "approved" | "rejected" | "all";

export default function AdminRemovalRequestsPage() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/removal-requests?status=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setError("Failed to load removal requests.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/removal-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
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

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Removal Requests</h1>
        <p className="text-lg text-gray-600 mt-1">
          Review and manage provider page removal requests.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
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
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">No {filter} requests</p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "pending" ? "All caught up!" : `No ${filter} removal requests found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Requester</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Action</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reason</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                {filter === "pending" && (
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{req.provider_name}</p>
                    {req.provider_slug && (
                      <a
                        href={`/provider/${req.provider_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View page →
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{req.full_name}</p>
                    <p className="text-xs text-gray-500">{req.business_email}</p>
                    <p className="text-xs text-gray-500">{req.business_phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={req.action === "delete" ? "rejected" : "default"}>
                      {req.action}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-[200px] truncate" title={req.reason}>
                      {req.reason.replace(/_/g, " ")}
                    </p>
                    {req.additional_details && (
                      <p className="text-xs text-gray-400 max-w-[200px] truncate" title={req.additional_details}>
                        {req.additional_details}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        req.status === "pending"
                          ? "pending"
                          : req.status === "approved"
                          ? "verified"
                          : "rejected"
                      }
                    >
                      {req.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  {filter === "pending" && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40"
                        >
                          {actionLoading === req.id ? "..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40"
                        >
                          {actionLoading === req.id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
