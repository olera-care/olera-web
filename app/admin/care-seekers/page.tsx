"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FamilyMetadata } from "@/lib/types";

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
};

type FilterTab = "all" | "guest" | "claimed";

interface SeekerRow {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  care_types: string[];
  metadata: FamilyMetadata;
  account_id: string | null;
  claim_state: string;
  source: string;
  created_at: string;
}

export default function AdminCareSeekersPage() {
  const router = useRouter();
  const [seekers, setSeekers] = useState<SeekerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [stats, setStats] = useState({ total: 0, guests: 0, thisWeek: 0 });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showToast(message: string, type: "success" | "error" = "success") {
    clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "guest") params.set("guest_only", "true");
      if (filter === "claimed") params.set("claimed_only", "true");

      const res = await fetch(`/api/admin/care-seekers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSeekers(data.seekers ?? []);
        // Only update total from all-tab fetches to keep stats stable
        if (filter === "all" && !debouncedSearch) {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const thisWeek = (data.seekers ?? []).filter(
            (s: SeekerRow) => new Date(s.created_at) >= weekAgo
          ).length;
          const guests = (data.seekers ?? []).filter(
            (s: SeekerRow) => !s.account_id
          ).length;
          setStats({ total: data.total ?? 0, guests, thisWeek });
        }
      }
    } catch (err) {
      console.error("Failed to fetch care seekers:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter]);

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/care-seekers?per_page=100");
        if (res.ok) {
          const data = await res.json();
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const thisWeek = (data.seekers ?? []).filter(
            (s: SeekerRow) => new Date(s.created_at) >= weekAgo
          ).length;
          const guests = (data.seekers ?? []).filter(
            (s: SeekerRow) => !s.account_id
          ).length;
          setStats({ total: data.total ?? 0, guests, thisWeek });
        }
      } catch { /* ignore */ }
    }
    loadStats();
  }, []);

  useEffect(() => {
    fetchSeekers();
  }, [fetchSeekers]);

  async function handleDelete(seeker: SeekerRow) {
    if (!confirm(`Delete "${seeker.display_name}"? This will also delete all their connections. This cannot be undone.`)) return;

    // Optimistic removal
    setSeekers((prev) => prev.filter((s) => s.id !== seeker.id));

    try {
      const res = await fetch(`/api/admin/care-seekers/${seeker.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Deleted ${seeker.display_name}`);
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      } else {
        // Revert
        setSeekers((prev) => [...prev, seeker].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        showToast("Failed to delete care seeker", "error");
      }
    } catch {
      setSeekers((prev) => [...prev, seeker].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      showToast("Network error", "error");
    }
  }

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "All", value: "all" },
    { label: "Guest", value: "guest" },
    { label: "Claimed", value: "claimed" },
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Care Seekers</h1>
        <p className="text-sm text-gray-500 mt-1">Families and individuals looking for care</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Seekers</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? "—" : stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Guests (unclaimed)</p>
          <p className="text-2xl font-bold text-amber-600">{loading ? "—" : stats.guests}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">New This Week</p>
          <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : stats.thisWeek}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
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

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : seekers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No care seekers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Care Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Timeline</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {seekers.map((seeker) => {
                  const meta = seeker.metadata || {};
                  const isGuest = !seeker.account_id;
                  return (
                    <tr
                      key={seeker.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/care-seekers/${seeker.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {seeker.display_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{seeker.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{seeker.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {seeker.care_types.length > 0 ? (
                          <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                            {seeker.care_types[0]}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {meta.timeline ? TIMELINE_LABELS[meta.timeline] || meta.timeline : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {isGuest ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            Guest
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Claimed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(seeker.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(seeker);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
