"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { ALL_RESOURCE_CATEGORIES, RESOURCE_CATEGORY_CONFIG } from "@/types/resource";
import type { ContentArticleListItem, ContentStatus } from "@/types/content";

type TabFilter = "all" | ContentStatus;

function SortArrow({ dir }: { dir: "asc" | "desc" }) {
  return <span className="text-xs">{dir === "asc" ? "\u25B2" : "\u25BC"}</span>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminContentPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ContentArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [featured, setFeatured] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tab, setTab] = useState<TabFilter>("all");
  const [creating, setCreating] = useState(false);
  const [authors, setAuthors] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "20",
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      if (tab !== "all") params.set("status", tab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (author) params.set("author", author);
      if (featured) params.set("featured", featured);

      const res = await fetch(`/api/admin/content?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 0);
        if (data.authors) setAuthors(data.authors);
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = `API error ${res.status}: ${errData.error || res.statusText}`;
        console.error(msg);
        setError(msg);
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, author, featured, sortBy, sortDir, tab]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  function handleCategoryChange(val: string) {
    setCategory(val);
    setPage(1);
  }
  function handleAuthorChange(val: string) {
    setAuthor(val);
    setPage(1);
  }
  function handleFeaturedChange(val: string) {
    setFeatured(val);
    setPage(1);
  }
  function handleTabChange(val: TabFilter) {
    setTab(val);
    setPage(1);
  }
  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Article" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/content/${data.article.id}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to create article");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const tabs: { label: string; value: TabFilter }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ];

  const statusVariant: Record<ContentStatus, "default" | "verified" | "pending" | "rejected"> = {
    draft: "pending",
    published: "verified",
    archived: "rejected",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content</h1>
          <p className="text-lg text-gray-600 mt-1">
            {total} article{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating..." : "+ New Article"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title..."
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
          {ALL_RESOURCE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {RESOURCE_CATEGORY_CONFIG[cat].label}
            </option>
          ))}
        </select>

        <select
          value={author}
          onChange={(e) => handleAuthorChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">All Authors</option>
          {authors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={featured}
          onChange={(e) => handleFeaturedChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">All Articles</option>
          <option value="true">Featured Only</option>
          <option value="false">Not Featured</option>
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

      {/* Error */}
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
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No articles found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      <button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors">
                        Title {sortBy === "title" && <SortArrow dir={sortDir} />}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Author</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      <button onClick={() => toggleSort("published_at")} className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors">
                        Published {sortBy === "published_at" && <SortArrow dir={sortDir} />}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      <button onClick={() => toggleSort("updated_at")} className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors">
                        Updated {sortBy === "updated_at" && <SortArrow dir={sortDir} />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/content/${article.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {article.featured && (
                            <span className="text-yellow-500 text-sm" title="Featured">
                              &#9733;
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                            {article.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {RESOURCE_CATEGORY_CONFIG[article.category]?.label ?? article.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {article.author_name}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant[article.status]}>
                          {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {article.published_at ? formatDate(article.published_at) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(article.updated_at)}
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
            itemsPerPage={20}
            onPageChange={setPage}
            itemLabel="articles"
          />
        </>
      )}
    </div>
  );
}
