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

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showToast(message: string, type: "success" | "error" = "success") {
    clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
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

  // Soft-delete or restore a provider
  async function handleToggleDelete(providerId: string, providerName: string, currentlyDeleted: boolean) {
    const action = currentlyDeleted ? "restore" : "delete";
    if (!confirm(`Are you sure you want to ${action} "${providerName}"?`)) return;

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
        body: JSON.stringify({ deleted: !currentlyDeleted }),
      });
      if (res.ok) {
        showToast(currentlyDeleted ? "Provider restored" : "Provider deleted");
        // Refresh to get accurate counts
        fetchProviders();
      } else {
        // Revert optimistic update
        setProviders((prev) =>
          prev.map((p) =>
            p.provider_id === providerId ? { ...p, deleted: currentlyDeleted } : p
          )
        );
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || `Failed to ${action} provider`, "error");
      }
    } catch {
      // Revert optimistic update
      setProviders((prev) =>
        prev.map((p) =>
          p.provider_id === providerId ? { ...p, deleted: currentlyDeleted } : p
        )
      );
      showToast("Network error. Please try again.", "error");
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
                            handleToggleDelete(provider.provider_id, provider.provider_name, provider.deleted);
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
    </div>
  );
}
