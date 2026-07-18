"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { normalizeProviderName } from "@/lib/normalize-provider-name";

interface BlocklistEntry {
  id: string;
  provider_name: string;
  normalized_name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  place_id: string | null;
  reason: string;
  evidence: string | null;
  notes: string | null;
  added_by_email: string | null;
  added_at: string;
}

const REASON_OPTIONS = [
  { value: "provider_request", label: "Provider request" },
  { value: "data_sweep", label: "Data sweep" },
  { value: "duplicate", label: "Duplicate" },
  { value: "out_of_scope", label: "Out of scope" },
  { value: "other", label: "Other" },
] as const;

function reasonBadgeVariant(reason: string): "rejected" | "pending" | "default" {
  switch (reason) {
    case "provider_request":
      return "rejected";
    case "data_sweep":
      return "pending";
    default:
      return "default";
  }
}

export default function AdminRemovalBlocklistPage() {
  const [entries, setEntries] = useState<BlocklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BlocklistEntry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEntries = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = q?.trim()
        ? `/api/admin/removal-blocklist?q=${encodeURIComponent(q.trim())}`
        : "/api/admin/removal-blocklist";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setError("Failed to load blocklist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => fetchEntries(search), 300);
    return () => clearTimeout(handle);
  }, [search, fetchEntries]);

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/removal-blocklist?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      setConfirmDelete(null);
      await fetchEntries(search);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Removal Blocklist</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Providers we must never re-add to the directory. Independent of{" "}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">olera-providers.deleted</code>{" "}
            so hard-deleted-era takedowns are still enforced.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium whitespace-nowrap"
        >
          + Add entry
        </button>
      </div>

      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name (uses same normalization as match check)…"
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {search.trim() && (
          <p className="text-xs text-gray-500 mt-1">
            Normalized: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{normalizeProviderName(search)}</code>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Provider</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Evidence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Added</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {search.trim() ? "No matches." : "Blocklist is empty."}
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{e.provider_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <code className="bg-gray-50 px-1 rounded">{e.normalized_name}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {[e.city, e.state].filter(Boolean).join(", ") || (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={reasonBadgeVariant(e.reason)}>
                      {e.reason.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">
                    {e.evidence || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    <div>{new Date(e.added_at).toLocaleDateString()}</div>
                    {e.added_by_email && (
                      <div className="text-xs text-gray-400">{e.added_by_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmDelete(e)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
        {search.trim() && ` matching "${search}"`}
      </p>

      {/* Add modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchEntries(search);
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remove from blocklist?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{confirmDelete.provider_name}</strong> will no longer be protected from
              re-add. Only do this if the entry was added in error.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add modal ──

function AddEntryModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [providerName, setProviderName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [reason, setReason] = useState<string>("provider_request");
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const normalized = normalizeProviderName(providerName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/removal-blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: providerName.trim(),
          city: city.trim() || null,
          state: state.trim() || null,
          phone: phone.trim() || null,
          place_id: placeId.trim() || null,
          reason,
          evidence: evidence.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add entry");
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 max-w-lg w-full my-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add to blocklist
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              required
              placeholder="e.g. The Mariemont Care Center"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            {normalized && (
              <p className="text-xs text-gray-500 mt-1">
                Normalized: <code className="bg-gray-100 px-1 rounded">{normalized}</code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="CA"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google place_id
              </label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence</label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={2}
              placeholder="Email date, ticket #, GSC removal date, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional context"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !providerName.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add to blocklist"}
          </button>
        </div>
      </form>
    </div>
  );
}
