"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import type { OrganizationMetadata } from "@/lib/types";

type StatusFilter = "pending" | "verified" | "unverified" | "all";

interface VerificationSubmission {
  name: string;
  role: string;
  phone?: string | null;
  affiliation?: string | null;
  submitted_at?: string;
}

interface Provider {
  id: string;
  display_name: string;
  type: string;
  category: string | null;
  city: string | null;
  state: string | null;
  verification_state: string;
  metadata: (OrganizationMetadata & { verification_submission?: VerificationSubmission }) | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  slug: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  executive_director: "Executive Director",
  office_manager: "Office Manager",
  marketing: "Marketing / Communications",
  staff: "Staff Member",
  other: "Other",
};

export default function AdminVerificationPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verification?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
      } else {
        setError("Failed to load verification requests. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
      setError("Failed to load verification requests. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setProviders((prev) => prev.filter((p) => p.id !== id));
        setSelectedProvider(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed to ${action} verification. Please try again.`);
      }
    } catch (err) {
      console.error("Action failed:", err);
      setActionError(`Failed to ${action} verification. Please check your connection.`);
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Verified", value: "verified" },
    { label: "Unverified", value: "unverified" },
    { label: "All", value: "all" },
  ];

  function getStatusVariant(state: string): "pending" | "verified" | "default" {
    switch (state) {
      case "pending":
        return "pending";
      case "verified":
        return "verified";
      default:
        return "default";
    }
  }

  // Get verification submission from metadata
  function getVerificationSubmission(provider: Provider): VerificationSubmission | null {
    return provider.metadata?.verification_submission || null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
        <p className="text-lg text-gray-600 mt-1">
          Review and approve provider identity verification requests.
        </p>
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
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {filter === "pending" ? "All caught up!" : `No ${filter} providers`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "pending"
              ? "No verification requests waiting for review."
              : `No providers with "${filter}" verification status.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Submitter</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Submitted</th>
                  {filter === "pending" && (
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider) => {
                  const submission = getVerificationSubmission(provider);
                  return (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {provider.image_url ? (
                            <img
                              src={provider.image_url}
                              alt={provider.display_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm font-medium">
                                {provider.display_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{provider.display_name}</p>
                            <p className="text-xs text-gray-400">
                              {provider.type === "organization" ? "Organization" : "Caregiver"}
                              {provider.category && ` · ${provider.category.replace(/_/g, " ")}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {submission ? (
                          <button
                            onClick={() => setSelectedProvider(provider)}
                            className="text-left group"
                          >
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                              {submission.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ROLE_LABELS[submission.role] || submission.role}
                            </p>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">No submission</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {[provider.city, provider.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(provider.verification_state)}>
                          {provider.verification_state}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {submission?.submitted_at
                          ? new Date(submission.submitted_at).toLocaleDateString()
                          : new Date(provider.updated_at).toLocaleDateString()}
                      </td>
                      {filter === "pending" && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setSelectedProvider(provider)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleAction(provider.id, "approve")}
                              disabled={actionLoading === provider.id}
                              className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === provider.id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleAction(provider.id, "reject")}
                              disabled={actionLoading === provider.id}
                              className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === provider.id ? "..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      {selectedProvider && (
        <VerificationReviewModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onApprove={() => handleAction(selectedProvider.id, "approve")}
          onReject={() => handleAction(selectedProvider.id, "reject")}
          isLoading={actionLoading === selectedProvider.id}
          showActions={filter === "pending"}
        />
      )}
    </div>
  );
}

// ── Verification Review Modal ──

interface VerificationReviewModalProps {
  provider: Provider;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
  showActions: boolean;
}

function VerificationReviewModal({
  provider,
  onClose,
  onApprove,
  onReject,
  isLoading,
  showActions,
}: VerificationReviewModalProps) {
  const submission = provider.metadata?.verification_submission;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Review Verification Request"
      size="lg"
      footer={
        showActions ? (
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Processing..." : "Approve Verification"}
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Provider Info */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {provider.image_url ? (
            <img
              src={provider.image_url}
              alt={provider.display_name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-lg font-semibold">
                {provider.display_name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider.display_name}</h3>
            <p className="text-sm text-gray-500">
              {provider.type === "organization" ? "Organization" : "Caregiver"}
              {provider.category && ` · ${provider.category.replace(/_/g, " ")}`}
            </p>
            <p className="text-sm text-gray-500">
              {[provider.city, provider.state].filter(Boolean).join(", ") || "No location"}
            </p>
          </div>
        </div>
      </div>

      {/* Submission Details */}
      {submission ? (
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Verification Submission
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Submitted by</p>
                  <p className="text-sm font-medium text-gray-900">{submission.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Role</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ROLE_LABELS[submission.role] || submission.role}
                  </p>
                </div>
              </div>

              {submission.phone && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="text-sm text-gray-700">{submission.phone}</p>
                </div>
              )}

              {submission.submitted_at && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                  <p className="text-sm text-gray-700">{formatDate(submission.submitted_at)}</p>
                </div>
              )}
            </div>
          </div>

          {submission.affiliation && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Affiliation Statement
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {submission.affiliation}
                </p>
              </div>
            </div>
          )}

          {/* Provider Contact Info */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Provider Contact
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {provider.email && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-gray-700">{provider.email}</span>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-gray-700">{provider.phone}</span>
                </div>
              )}
              {provider.slug && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <a
                    href={`/provider/${provider.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    View public profile →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No verification submission found.</p>
          <p className="text-gray-400 text-xs mt-1">This provider may have been marked pending manually.</p>
        </div>
      )}
    </Modal>
  );
}
