"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudentMetadata, StudentProgramTrack } from "@/lib/types";

const PROGRAM_TRACK_LABELS: Record<StudentProgramTrack, string> = {
  pre_nursing: "Pre-Nursing",
  nursing: "Nursing",
  pre_med: "Pre-Med",
  pre_pa: "Pre-PA",
  pre_health: "Pre-Health",
  other: "Other",
};

interface StudentRow {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export default function AdminMedJobsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, applications: 0 });

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUniversity, setNewUniversity] = useState("");
  const [creating, setCreating] = useState(false);

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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/medjobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
        setStats((prev) => ({ ...prev, total: data.total ?? 0 }));
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch stats separately (week count + applications)
  useEffect(() => {
    async function loadStats() {
      try {
        // Use the main list endpoint for total, and we compute week/apps from the data
        const res = await fetch("/api/admin/medjobs?per_page=100");
        if (res.ok) {
          const data = await res.json();
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const thisWeek = (data.students ?? []).filter(
            (s: StudentRow) => new Date(s.created_at) >= weekAgo
          ).length;
          setStats((prev) => ({ ...prev, thisWeek }));
        }
      } catch { /* ignore */ }
    }
    loadStats();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/medjobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: newName.trim(),
          university: newUniversity.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewName("");
        setNewUniversity("");
        router.push(`/admin/medjobs/${data.student.id}`);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create student", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(student: StudentRow) {
    if (!confirm(`Delete "${student.display_name}"? This cannot be undone.`)) return;

    // Optimistic removal
    setStudents((prev) => prev.filter((s) => s.id !== student.id));

    try {
      const res = await fetch(`/api/admin/medjobs/${student.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Deleted ${student.display_name}`);
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      } else {
        // Revert
        setStudents((prev) => [...prev, student].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        showToast("Failed to delete student", "error");
      }
    } catch {
      setStudents((prev) => [...prev, student].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      showToast("Network error", "error");
    }
  }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MedJobs</h1>
          <p className="text-sm text-gray-500 mt-1">Student caregiver talent marketplace</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? "—" : stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">New This Week</p>
          <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : stats.thisWeek}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold text-primary-600">{loading ? "—" : stats.applications}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or university..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No students found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">University</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Track</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Profile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const meta = student.metadata || {};
                const completeness = meta.profile_completeness ?? 0;
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/medjobs/${student.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">
                          {student.display_name}
                        </span>
                        {student.email && (
                          <p className="text-xs text-gray-400">{student.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{meta.university || "—"}</td>
                    <td className="px-4 py-3">
                      {meta.program_track ? (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                          {PROGRAM_TRACK_LABELS[meta.program_track]}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {student.city && student.state ? `${student.city}, ${student.state}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${completeness >= 70 ? "bg-emerald-500" : completeness >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{completeness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(student);
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
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Sarah Chen"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <input
                  type="text"
                  value={newUniversity}
                  onChange={(e) => setNewUniversity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Texas A&M University"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewName(""); setNewUniversity(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
