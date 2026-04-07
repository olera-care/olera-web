"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

type TypeFilter = "all" | "inquiry" | "application" | "invitation" | "needs_email" | "archived";

/* ── Confirmation Dialog ────────────────────────────────────── */

function ConfirmDeleteDialog({
  title,
  message,
  onConfirm,
  onCancel,
  deleting,
}: {
  title: string;
  message: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for deletion (required)..."
          className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
          rows={3}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={deleting || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArchiveDialog({
  count,
  onConfirm,
  onCancel,
  archiving,
}: {
  count: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  archiving: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Archive {count === 1 ? "lead" : `${count} leads`}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Archived leads are hidden from the main view but can be restored later.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for archiving (e.g. provider unreachable after 2 attempts)..."
          className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
          rows={3}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={archiving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={archiving || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {archiving ? "Archiving..." : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CARE_TYPE_LABELS: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "ASAP",
  within_month: "Within 1 month",
  few_months: "Within 3 months",
  researching: "Exploring",
};

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
};

interface ConnectionProfile {
  id: string;
  display_name: string;
  type: string;
  slug?: string;
  source_provider_id?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  care_types?: string[];
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

function InlineEmailInput({
  lead,
  onEmailAdded,
}: {
  lead: Lead;
  onEmailAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !lead.to_profile?.id) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads/add-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: lead.to_profile.id,
          email: email.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => onEmailAdded(), 1500);
        if (data.emailsSent > 0) {
          setError(null);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <span className="text-xs font-medium text-green-600">
        Saved & notified
      </span>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        placeholder="provider@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-44 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        disabled={saving}
        required
      />
      <button
        type="submit"
        disabled={saving || !email.trim()}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        {saving ? "..." : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

const PAGE_SIZE = 25;

export default function AdminLeadsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TypeFilter) || "all";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>(initialTab);

  // Search & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Engagement data
  const [engagement, setEngagement] = useState<Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }>>({});

  // Delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const leadsBeforeDelete = useRef<Lead[]>([]);

  // Archive state
  const [archiveDialog, setArchiveDialog] = useState<{ ids: string[] } | null>(null);
  const [archiving, setArchiving] = useState(false);

  const requestArchiveSingle = (lead: Lead) => {
    setArchiveDialog({ ids: [lead.id] });
  };

  const requestArchiveBulk = () => {
    setArchiveDialog({ ids: Array.from(selectedIds) });
  };

  const executeArchive = async (reason: string) => {
    if (!archiveDialog) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: archiveDialog.ids, action: "archive", reason }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchLeads();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to archive leads");
      }
    } catch {
      setError("Network error while archiving");
    } finally {
      setArchiving(false);
      setArchiveDialog(null);
    }
  };

  const executeUnarchive = async (ids: string[]) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "unarchive" }),
      });
      if (res.ok) {
        fetchLeads();
      } else {
        setError("Failed to unarchive");
      }
    } catch {
      setError("Network error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const requestDeleteSingle = (lead: Lead) => {
    const from = lead.from_profile?.display_name ?? "Unknown";
    const to = lead.to_profile?.display_name ?? "Unknown";
    setConfirmDelete({ ids: [lead.id], label: `Delete the lead from ${from} \u2192 ${to}?` });
  };

  const requestDeleteBulk = () => {
    const count = selectedIds.size;
    setConfirmDelete({
      ids: Array.from(selectedIds),
      label: `Permanently delete ${count} lead${count === 1 ? "" : "s"}? This cannot be undone.`,
    });
  };

  const executeDelete = async (reason: string) => {
    if (!confirmDelete) return;
    setDeleting(true);
    leadsBeforeDelete.current = leads;

    // Optimistic removal
    const idsToDelete = new Set(confirmDelete.ids);
    setLeads((prev) => prev.filter((l) => !idsToDelete.has(l.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });

    try {
      const res = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: confirmDelete.ids, reason }),
      });

      if (!res.ok) {
        // Rollback
        setLeads(leadsBeforeDelete.current);
        const data = await res.json();
        setError(data.error || "Failed to delete leads");
      }
    } catch {
      setLeads(leadsBeforeDelete.current);
      setError("Network error while deleting");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      if (filter === "archived") {
        params.set("archived", "true");
      } else {
        if (filter !== "all" && filter !== "needs_email") params.set("type", filter);
        if (filter === "needs_email") params.set("needs_email", "true");
      }
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.connections ?? []);
        setTotal(data.total ?? 0);
        setEngagement(data.engagement ?? {});
      } else {
        setError("Failed to load leads. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setError("Failed to load leads. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter, page, debouncedSearch]);

  // Debounce search input (300ms)
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  };

  // Reset page & selection when filter changes
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setSelectedIds(new Set());
    fetchLeads();
  }, [fetchLeads]);

  const tabs: { label: string; value: TypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Needs Email", value: "needs_email" },
    { label: "Inquiries", value: "inquiry" },
    { label: "Applications", value: "application" },
    { label: "Invitations", value: "invitation" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-lg text-gray-600 mt-1">
              View all connections and inquiries across the platform.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {total} total
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
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

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-800">
            {selectedIds.size} selected
          </span>
          {filter === "archived" ? (
            <button
              onClick={() => executeUnarchive(Array.from(selectedIds))}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Unarchive selected
            </button>
          ) : (
            <button
              onClick={requestArchiveBulk}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Archive selected
            </button>
          )}
          <button
            onClick={requestDeleteBulk}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
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
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && selectedIds.size === leads.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">From</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">To</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Care Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Urgency</th>
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
                  const providerSlug = (lead.to_profile as ConnectionProfile & { slug?: string })?.slug;
                  const providerEngagement = engagement[providerSlug || providerEditorId || lead.to_profile?.id || ""];

                  // Resolve care type and urgency — prefer profile metadata, fall back to connection message
                  let careTypeDisplay: string | null = null;
                  let urgencyDisplay: string | null = null;

                  const fromMeta = lead.from_profile?.metadata as Record<string, unknown> | undefined;
                  const fromCareTypes = lead.from_profile?.care_types as string[] | undefined;

                  if (fromCareTypes && fromCareTypes.length > 0) {
                    careTypeDisplay = fromCareTypes[0];
                  }
                  if (fromMeta?.timeline) {
                    urgencyDisplay = TIMELINE_LABELS[fromMeta.timeline as string] || (fromMeta.timeline as string);
                  }

                  // Fallback: parse connections.message JSON
                  if ((!careTypeDisplay || !urgencyDisplay) && lead.message) {
                    try {
                      const msg = JSON.parse(lead.message);
                      if (!careTypeDisplay && msg.care_type) {
                        careTypeDisplay = CARE_TYPE_LABELS[msg.care_type] || msg.care_type;
                      }
                      if (!urgencyDisplay && msg.urgency) {
                        urgencyDisplay = URGENCY_LABELS[msg.urgency] || msg.urgency;
                      }
                    } catch { /* ignore */ }
                  }

                  const isFromFamily = lead.from_profile?.type === "family";

                  return (
                  <tr key={lead.id} className={`hover:bg-gray-50 ${needsEmail ? "bg-amber-50" : ""} ${selectedIds.has(lead.id) ? "bg-blue-50" : ""}`}>
                    <td className="w-10 px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {isFromFamily ? (
                        <Link href={`/admin/care-seekers/${lead.from_profile?.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                          {lead.from_profile?.display_name ?? "Unknown"}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {lead.from_profile?.display_name ?? "Unknown"}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {lead.from_profile?.type ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {providerEditorId ? (
                        <Link href={`/admin/directory/${providerEditorId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                          {lead.to_profile?.display_name ?? "Unknown"}
                        </Link>
                      ) : providerSlug ? (
                        <Link href={`/provider/${providerSlug}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline" target="_blank">
                          {lead.to_profile?.display_name ?? "Unknown"}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {lead.to_profile?.display_name ?? "Unknown"}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {lead.to_profile?.type ?? "—"}
                        </p>
                        {needsEmail && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            No email
                          </span>
                        )}
                        {providerEngagement && (
                          <div className="flex items-center gap-1" title={
                            providerEngagement.contact_revealed ? "Contacted (copied info)" :
                            providerEngagement.lead_opened ? "Opened lead" :
                            providerEngagement.email_clicked ? "Clicked email" : ""
                          }>
                            <span className={`w-1.5 h-1.5 rounded-full ${providerEngagement.email_clicked ? "bg-blue-400" : "bg-gray-200"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${providerEngagement.lead_opened ? "bg-amber-400" : "bg-gray-200"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${providerEngagement.contact_revealed ? "bg-green-500" : "bg-gray-200"}`} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {careTypeDisplay ? (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                          {careTypeDisplay}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {urgencyDisplay ? (
                        <span className="text-xs text-gray-600">{urgencyDisplay}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
                      <div className="flex items-center gap-2">
                        {needsEmail && (
                          <InlineEmailInput lead={lead} onEmailAdded={fetchLeads} />
                        )}
                        {lead.metadata?.archived ? (
                          <button
                            onClick={() => executeUnarchive([lead.id])}
                            title="Unarchive lead"
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            onClick={() => requestArchiveSingle(lead)}
                            title="Archive lead"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => requestDeleteSingle(lead)}
                          title="Delete lead"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmDelete && (
        <ConfirmDeleteDialog
          title={confirmDelete.ids.length === 1 ? "Delete lead" : "Delete leads"}
          message={confirmDelete.label}
          onConfirm={(reason) => executeDelete(reason)}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      {/* Archive dialog */}
      {archiveDialog && (
        <ArchiveDialog
          count={archiveDialog.ids.length}
          onConfirm={executeArchive}
          onCancel={() => setArchiveDialog(null)}
          archiving={archiving}
        />
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
