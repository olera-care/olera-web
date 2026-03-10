"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

type TypeFilter = "all" | "inquiry" | "application" | "invitation" | "needs_email";

interface ConnectionProfile {
  id: string;
  display_name: string;
  type: string;
  source_provider_id?: string;
}

interface Lead {
  id: string;
  type: string;
  status: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  from_profile: ConnectionProfile | null;
  to_profile: ConnectionProfile | null;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>("all");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const needsEmailParam = filter === "needs_email" ? "&needs_email=true" : "";
      const typeParam = filter !== "all" && filter !== "needs_email" ? `&type=${filter}` : "";
      const res = await fetch(`/api/admin/leads?limit=100${typeParam}${needsEmailParam}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.connections ?? []);
      } else {
        setError("Failed to load leads. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setError("Failed to load leads. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const tabs: { label: string; value: TypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Needs Email", value: "needs_email" },
    { label: "Inquiries", value: "inquiry" },
    { label: "Applications", value: "application" },
    { label: "Invitations", value: "invitation" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-lg text-gray-600 mt-1">
          View all connections and inquiries across the platform.
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No leads found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">From</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">To</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Message</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const needsEmail = lead.metadata?.needs_provider_email === true;
                  const providerEditorId = lead.to_profile?.source_provider_id;
                  return (
                  <tr key={lead.id} className={`hover:bg-gray-50 ${needsEmail ? "bg-amber-50" : ""}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {lead.from_profile?.display_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lead.from_profile?.type ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {lead.to_profile?.display_name ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {lead.to_profile?.type ?? "—"}
                        </p>
                        {needsEmail && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            No email
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {lead.message || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{lead.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {needsEmail && providerEditorId && (
                        <Link
                          href={`/admin/directory/${providerEditorId}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                          Add Email
                        </Link>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusVariant(status: string): "pending" | "verified" | "rejected" | "default" {
  switch (status) {
    case "pending":
      return "pending";
    case "accepted":
      return "verified";
    case "declined":
      return "rejected";
    default:
      return "default";
  }
}
