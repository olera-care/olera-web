"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import { PROVIDER_CATEGORIES } from "@/lib/types";
import type { DirectoryListItem } from "@/lib/types";

type TabFilter = "all" | "published" | "deleted" | "no_city";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function AdminDirectoryPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<DirectoryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Add Provider modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [creating, setCreating] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showToast(message: string, type: "success" | "error" = "success") {
    clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (stateFilter) params.set("state", stateFilter);

      const res = await fetch(`/api/admin/directory/export?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Export failed", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "olera-providers.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${total.toLocaleString()} providers`);
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "50",
        tab,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (stateFilter) params.set("state", stateFilter);

      const res = await fetch(`/api/admin/directory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 0);
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = `API error ${res.status}: ${errData.error || res.statusText}`;
        console.error(msg);
        setError(msg);
      }
    } catch (err) {
      console.error("Failed to fetch directory:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, stateFilter, tab]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Reset page when filters change
  function handleCategoryChange(val: string) {
    setCategory(val);
    setPage(1);
  }
  function handleStateChange(val: string) {
    setStateFilter(val);
    setPage(1);
  }
  function handleTabChange(val: TabFilter) {
    setTab(val);
    setPage(1);
  }

  // Create new provider
  async function handleCreate() {
    if (!newName.trim() || !newCategory) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: newName.trim(),
          provider_category: newCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/directory/${data.provider.provider_id}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Failed to create provider", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  }

  // Delete/restore modal state
  const [deleteModal, setDeleteModal] = useState<{
    providerId: string;
    providerName: string;
    currentlyDeleted: boolean;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  function requestToggleDelete(providerId: string, providerName: string, currentlyDeleted: boolean) {
    if (currentlyDeleted) {
      // Restore doesn't need a reason
      executeToggleDelete(providerId, providerName, true, "");
    } else {
      setDeleteReason("");
      setDeleteModal({ providerId, providerName, currentlyDeleted });
    }
  }

  async function executeToggleDelete(providerId: string, providerName: string, currentlyDeleted: boolean, reason: string) {
    setDeleteSubmitting(true);

    // Optimistic update
    setProviders((prev) =>
      prev.map((p) =>
        p.provider_id === providerId ? { ...p, deleted: !currentlyDeleted } : p
      )
    );

    try {
      const res = await fetch(`/api/admin/directory/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleted: !currentlyDeleted,
          ...(reason ? { _delete_reason: reason } : {}),
        }),
      });
      if (res.ok) {
        showToast(currentlyDeleted ? "Provider restored" : "Provider deleted");
        fetchProviders();
      } else {
        // Revert optimistic update
        setProviders((prev) =>
          prev.map((p) =>
            p.provider_id === providerId ? { ...p, deleted: currentlyDeleted } : p
          )
        );
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || `Failed to ${currentlyDeleted ? "restore" : "delete"} provider`, "error");
      }
    } catch {
      // Revert optimistic update
      setProviders((prev) =>
        prev.map((p) =>
          p.provider_id === providerId ? { ...p, deleted: currentlyDeleted } : p
        )
      );
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeleteSubmitting(false);
      setDeleteModal(null);
    }
  }

  const tabs: { label: string; value: TabFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Deleted", value: "deleted" },
    { label: "No City", value: "no_city" },
  ];

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={[
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all",
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Directory</h1>
          <p className="text-lg text-gray-600 mt-1">
            {total.toLocaleString()} providers in directory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => {
              setNewName("");
              setNewCategory("");
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Add Provider
          </button>
        </div>
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Provider</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sunrise Senior Living"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim() && newCategory) handleCreate();
              }}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-6"
            >
              <option value="">Select a category...</option>
              {PROVIDER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Provider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by provider name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          options={[{ value: "", label: "All Categories" }, ...PROVIDER_CATEGORIES.map(cat => ({ value: cat, label: cat }))]}
          value={category}
          onChange={handleCategoryChange}
          size="sm"
          className="w-48"
        />

        <Select
          options={[{ value: "", label: "All States" }, ...US_STATES.map(st => ({ value: st, label: st }))]}
          value={stateFilter}
          onChange={handleStateChange}
          size="sm"
          className="w-36"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No providers found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rating</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Images</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {providers.map((provider) => (
                    <tr
                      key={provider.provider_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/directory/${provider.provider_id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                          {provider.provider_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {provider.provider_category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {[provider.city, provider.state].filter(Boolean).join(", ") || "\u2014"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {provider.google_rating != null ? provider.google_rating.toFixed(1) : "\u2014"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {provider.image_count > 0 ? (
                          <span className="text-green-600">{provider.image_count}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={provider.deleted ? "rejected" : "verified"}>
                          {provider.deleted ? "Deleted" : "Published"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestToggleDelete(provider.provider_id, provider.provider_name, provider.deleted);
                          }}
                          className={[
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                            provider.deleted
                              ? "text-green-700 bg-green-50 hover:bg-green-100"
                              : "text-red-700 bg-red-50 hover:bg-red-100",
                          ].join(" ")}
                        >
                          {provider.deleted ? "Restore" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={50}
            onPageChange={setPage}
            itemLabel="providers"
          />
        </>
      )}

      {/* Delete reason modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Delete &ldquo;{deleteModal.providerName}&rdquo;
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please provide a reason for deleting this provider. This will be logged for audit purposes.
            </p>

            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Duplicate listing, closed business, doesn't fit service model..."
              className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              rows={3}
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  executeToggleDelete(
                    deleteModal.providerId,
                    deleteModal.providerName,
                    deleteModal.currentlyDeleted,
                    deleteReason.trim()
                  )
                }
                disabled={deleteSubmitting || !deleteReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting..." : "Delete Provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
