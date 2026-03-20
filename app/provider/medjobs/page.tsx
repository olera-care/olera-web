"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCandidates: number;
  newThisWeek: number;
  pendingApplications: number;
}

export default function ProviderMedJobsPage() {
  const { activeProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalCandidates: 0, newThisWeek: 0, pendingApplications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!activeProfile) return;

      try {
        // Total student candidates
        const { count: totalCandidates } = await createClient()
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .eq("type", "student")
          .eq("is_active", true);

        // New this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: newThisWeek } = await createClient()
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .eq("type", "student")
          .eq("is_active", true)
          .gte("created_at", weekAgo.toISOString());

        // Pending applications to this provider
        const { count: pendingApplications } = await createClient()
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("to_profile_id", activeProfile.id)
          .eq("type", "application")
          .eq("status", "pending");

        setStats({
          totalCandidates: totalCandidates || 0,
          newThisWeek: newThisWeek || 0,
          pendingApplications: pendingApplications || 0,
        });
      } catch (err) {
        console.error("[provider/medjobs] stats error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [activeProfile]);

  const statCards = [
    {
      label: "Total Candidates",
      value: stats.totalCandidates,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      color: "primary",
      href: "/provider/medjobs/candidates",
    },
    {
      label: "New This Week",
      value: stats.newThisWeek,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "emerald",
      href: "/provider/medjobs/candidates?sort=newest",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
        </svg>
      ),
      color: "orange",
      href: "/provider/connections",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    primary: { bg: "bg-primary-50", text: "text-primary-700", iconBg: "bg-primary-100 text-primary-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", iconBg: "bg-orange-100 text-orange-600" },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MedJobs</h1>
          <p className="mt-1 text-gray-500">Find student caregivers for your team</p>
        </div>
        <Link
          href="/provider/medjobs/candidates"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          Browse Candidates
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => {
          const colors = colorMap[card.color];
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`${colors.bg} rounded-2xl p-5 hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {loading ? "—" : card.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/provider/medjobs/candidates"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Browse Candidates</p>
              <p className="text-xs text-gray-500">Search and filter student profiles</p>
            </div>
          </Link>
          <Link
            href="/provider/connections"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Applications Inbox</p>
              <p className="text-xs text-gray-500">Review student applications</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
