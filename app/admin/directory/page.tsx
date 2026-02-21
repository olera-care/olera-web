"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
      }
    } catch (err) {
      console.error("Failed to fetch directory:", err);
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

  const tabs: { label: string; value: TabFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Deleted", value: "deleted" },
    { label: "No City", value: "no_city" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Provider Directory</h1>
        <p className="text-lg text-gray-600 mt-1">
          {total.toLocaleString()} providers in directory
        </p>
      </div>

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
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">All Categories</option>
          {PROVIDER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => handleStateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">All States</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
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
                        {[provider.city, provider.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {provider.google_rating != null ? provider.google_rating.toFixed(1) : "—"}
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
