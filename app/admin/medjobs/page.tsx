"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { StudentMetadata, StudentProgramTrack } from "@/lib/types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  created_at: string;
}

export default function AdminMedJobsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, applications: 0 });

  useEffect(() => {
    async function load() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [studentsRes, totalRes, weekRes, appsRes] = await Promise.all([
        supabase
          .from("business_profiles")
          .select("id, slug, display_name, email, city, state, metadata, is_active, created_at")
          .eq("type", "student")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .eq("type", "student"),
        supabase
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .eq("type", "student")
          .gte("created_at", weekAgo),
        supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("type", "application"),
      ]);

      setStudents((studentsRes.data || []) as StudentRow[]);
      setStats({
        total: totalRes.count || 0,
        thisWeek: weekRes.count || 0,
        applications: appsRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? students.filter((s) =>
        s.display_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        (s.metadata.university || "").toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MedJobs</h1>
          <p className="text-sm text-gray-500 mt-1">Student caregiver talent marketplace</p>
        </div>
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
        ) : filtered.length === 0 ? (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((student) => {
                const meta = student.metadata;
                const completeness = meta.profile_completeness ?? 0;
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/medjobs/candidates/${student.slug}`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                          target="_blank"
                        >
                          {student.display_name}
                        </Link>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
