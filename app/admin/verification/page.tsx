"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import type { OrganizationMetadata } from "@/lib/types";

type StatusFilter = "pending" | "verified" | "unverified" | "all";

interface Provider {
  id: string;
  display_name: string;
  type: string;
  category: string | null;
  city: string | null;
  state: string | null;
  verification_state: string;
  metadata: OrganizationMetadata | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  slug: string | null;
}

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

  // Get verification documents from metadata
  function getVerificationDocs(provider: Provider) {
    const meta = provider.metadata;
    if (!meta) return [];
    const docs: { label: string; url: string }[] = [];
    if (meta.verification_id_image) {
      docs.push({ label: `ID (${meta.verification_id_type || "Unknown"})`, url: meta.verification_id_image });
    }
    if (meta.verification_manager_photo) {
      docs.push({ label: "Manager Photo", url: meta.verification_manager_photo });
    }
    if (meta.verification_affiliation_image) {
      docs.push({ label: "Affiliation Proof", url: meta.verification_affiliation_image });
    }
    return docs;
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No verification requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Documents</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Submitted</th>
                  {filter === "pending" && (
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider) => {
                  const docs = getVerificationDocs(provider);
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
                            {provider.email && (
                              <p className="text-sm text-gray-500">{provider.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {provider.type === "organization" ? "Organization" : "Caregiver"}
                        {provider.category && (
                          <span className="text-gray-400"> / {provider.category.replace(/_/g, " ")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {[provider.city, provider.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {docs.length > 0 ? (
                          <button
                            onClick={() => setSelectedProvider(provider)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View {docs.length} doc{docs.length > 1 ? "s" : ""}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">No documents</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(provider.verification_state)}>
                          {provider.verification_state}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(provider.updated_at).toLocaleDateString()}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedProvider && (
        <DocumentPreviewModal
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

// ── Document Preview Modal ──

interface DocumentPreviewModalProps {
  provider: Provider;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
  showActions: boolean;
}

function DocumentPreviewModal({
  provider,
  onClose,
  onApprove,
  onReject,
  isLoading,
  showActions,
}: DocumentPreviewModalProps) {
  const meta = provider.metadata;

  const docs: { label: string; url: string }[] = [];
  if (meta?.verification_id_image) {
    docs.push({ label: `ID Document (${meta.verification_id_type || "Unknown type"})`, url: meta.verification_id_image });
  }
  if (meta?.verification_manager_photo) {
    docs.push({ label: "Manager / Owner Photo", url: meta.verification_manager_photo });
  }
  if (meta?.verification_affiliation_image) {
    docs.push({ label: "Proof of Affiliation", url: meta.verification_affiliation_image });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Verification: ${provider.display_name}`}
      size="xl"
      footer={
        showActions ? (
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Approve
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Provider Info */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {provider.image_url ? (
            <img
              src={provider.image_url}
              alt={provider.display_name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-xl font-semibold">
                {provider.display_name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider.display_name}</h3>
            <p className="text-sm text-gray-500">
              {provider.type === "organization" ? "Organization" : "Caregiver"}
              {provider.category && ` / ${provider.category.replace(/_/g, " ")}`}
            </p>
            <p className="text-sm text-gray-500">
              {[provider.city, provider.state].filter(Boolean).join(", ") || "No location"}
            </p>
          </div>
        </div>
        {meta?.verification_role && (
          <p className="mt-3 text-sm text-gray-600">
            <span className="font-medium">Role:</span> {meta.verification_role}
          </p>
        )}
      </div>

      {/* Documents */}
      {docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No verification documents submitted.
        </div>
      ) : (
        <div className="space-y-6">
          {docs.map((doc, idx) => (
            <div key={idx}>
              <p className="text-sm font-medium text-gray-700 mb-2">{doc.label}</p>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={doc.url}
                  alt={doc.label}
                  className="w-full max-h-80 object-contain"
                />
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Open full size
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
