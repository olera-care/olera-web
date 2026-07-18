"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Dispute {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_slug: string | null;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  claimant_role: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  created_at: string;
  resolved_at: string | null;
  // Joined from business_profiles
  current_claimer_email: string | null;
  claim_trust_level: "high" | "medium" | "low" | null;
}

type StatusFilter = "pending" | "resolved" | "rejected" | "all";

// Role values from the dispute form (already human-readable)
// Kept as lookup for any legacy lowercase values
const ROLE_LABELS: Record<string, string> = {
  // Current form values (capitalized)
  "Owner": "Owner",
  "Administrator": "Administrator",
  "Executive Director": "Executive Director",
  "Office Manager": "Office Manager",
  "Marketing / Communications": "Marketing / Communications",
  "Staff Member": "Staff Member",
  "Other": "Other",
  // Legacy lowercase values (if any)
  owner: "Owner",
  administrator: "Administrator",
  manager: "Manager",
  employee: "Employee",
  authorized_representative: "Authorized Representative",
  family_member: "Family Member",
  other: "Other",
};

const TRUST_LEVEL_STYLES: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-green-700 bg-green-50" },
  medium: { label: "Medium", color: "text-amber-700 bg-amber-50" },
  low: { label: "Low", color: "text-red-700 bg-red-50" },
};

export default function AdminDisputesPage() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/disputes?status=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDisputes(data.disputes ?? []);
    } catch {
      setError("Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: "resolve" | "dismiss") => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      setSelectedDispute(null);
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
    { label: "Resolved", value: "resolved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <AdminPageHeader
        title="Disputes"
        description="Review ownership disputes for claimed providers."
      />

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
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {filter === "pending" ? "No pending disputes" : `No ${filter} disputes`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "pending" ? "All caught up!" : `No ${filter} disputes found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Disputer</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reason</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  {filter !== "pending" && (
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  )}
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{dispute.provider_name}</p>
                      {dispute.current_claimer_email && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Claimed by: {dispute.current_claimer_email}
                        </p>
                      )}
                      {dispute.provider_slug && (
                        <a
                          href={`/provider/${dispute.provider_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block"
                        >
                          View listing →
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{dispute.claimant_name}</p>
                      <p className="text-xs text-gray-500">{dispute.claimant_email}</p>
                      <p className="text-xs text-gray-400">
                        {ROLE_LABELS[dispute.claimant_role] || dispute.claimant_role}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-[200px] truncate" title={dispute.reason}>
                        {dispute.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(dispute.created_at)}
                    </td>
                    {filter !== "pending" && (
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            dispute.status === "resolved"
                              ? "verified"
                              : dispute.status === "rejected"
                              ? "rejected"
                              : "pending"
                          }
                        >
                          {dispute.status}
                        </Badge>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setError(""); setSelectedDispute(dispute); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <DisputeDetailsModal
          dispute={selectedDispute}
          onClose={() => { setSelectedDispute(null); setError(""); }}
          onResolve={() => handleAction(selectedDispute.id, "resolve")}
          onDismiss={() => handleAction(selectedDispute.id, "dismiss")}
          isLoading={actionLoading === selectedDispute.id}
          error={error}
        />
      )}
    </div>
  );
}

// ── Dispute Details Modal ──

interface DisputeDetailsModalProps {
  dispute: Dispute;
  onClose: () => void;
  onResolve: () => void;
  onDismiss: () => void;
  isLoading: boolean;
  error: string;
}

function DisputeDetailsModal({
  dispute,
  onClose,
  onResolve,
  onDismiss,
  isLoading,
  error,
}: DisputeDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPending = dispute.status === "pending";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Dispute Details"
      size="lg"
      footer={
        isPending ? (
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={onResolve}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Processing..." : "Unclaim & Resolve"}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        )
      }
    >
      {/* Provider Info */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Provider
        </p>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{dispute.provider_name}</h3>
              {dispute.provider_slug && (
                <a
                  href={`/provider/${dispute.provider_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View public page →
                </a>
              )}
            </div>
            {dispute.status !== "pending" && (
              <Badge
                variant={dispute.status === "resolved" ? "verified" : "rejected"}
              >
                {dispute.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Current Claimer */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Current Claimer
        </p>
        <div className="bg-gray-50 rounded-xl p-4">
          {dispute.current_claimer_email ? (
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-700">{dispute.current_claimer_email}</p>
              </div>
              {dispute.claim_trust_level && (
                <div>
                  <p className="text-xs text-gray-400">Trust Level</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${TRUST_LEVEL_STYLES[dispute.claim_trust_level]?.color || "text-gray-600 bg-gray-100"}`}>
                    {TRUST_LEVEL_STYLES[dispute.claim_trust_level]?.label || dispute.claim_trust_level}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Provider is not currently claimed</p>
          )}
        </div>
      </div>

      {/* Disputer Info */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Disputer
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-900">{dispute.claimant_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm text-gray-700">
                {ROLE_LABELS[dispute.claimant_role] || dispute.claimant_role}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-700">{dispute.claimant_email}</p>
            </div>
            {dispute.claimant_phone && (
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm text-gray-700">{dispute.claimant_phone}</p>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-gray-400 mb-1">Submitted</p>
            <p className="text-sm text-gray-600">{formatDate(dispute.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Dispute Reason */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Reason for Dispute
        </p>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {dispute.reason}
          </p>
        </div>
      </div>

      {/* Resolution info for resolved/rejected disputes */}
      {dispute.resolved_at && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {dispute.status === "resolved" ? "Resolved" : "Rejected"} on {formatDate(dispute.resolved_at)}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </Modal>
  );
}
