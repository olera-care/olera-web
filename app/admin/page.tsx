"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface OverviewStats {
  pendingProviders: number;
  totalInquiries: number;
  needsEmailCount: number;
  adminCount: number;
  imagesToReview: number;
  totalProviders: number;
  totalQuestions: number;
}

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  admin_email?: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setError(null);
      try {
        const [providersRes, leadsRes, needsEmailRes, teamRes, auditRes, imageStatsRes, directoryRes, questionsRes] = await Promise.all([
          fetch("/api/admin/providers?status=pending&count_only=true"),
          fetch("/api/admin/leads?count_only=true"),
          fetch("/api/admin/leads?needs_email=true&count_only=true"),
          fetch("/api/admin/team"),
          fetch("/api/admin/audit?limit=10"),
          fetch("/api/admin/images/stats"),
          fetch("/api/admin/directory?tab=all&per_page=1"),
          fetch("/api/admin/questions?count_only=true"),
        ]);

        const pendingData = providersRes.ok ? await providersRes.json() : { count: 0 };
        const leadsData = leadsRes.ok ? await leadsRes.json() : { count: 0 };
        const needsEmailData = needsEmailRes.ok ? await needsEmailRes.json() : { count: 0 };
        const teamData = teamRes.ok ? await teamRes.json() : { admins: [] };
        const auditData = auditRes.ok ? await auditRes.json() : { entries: [] };
        const imageStats = imageStatsRes.ok ? await imageStatsRes.json() : { needs_review: 0 };
        const directoryData = directoryRes.ok ? await directoryRes.json() : { total: 0 };
        const questionsData = questionsRes.ok ? await questionsRes.json() : { count: 0 };

        const anyFailed = [providersRes, leadsRes, needsEmailRes, teamRes, auditRes, imageStatsRes, directoryRes, questionsRes].some((r) => !r.ok);
        if (anyFailed) {
          setError("Some dashboard data failed to load. Numbers shown may be incomplete.");
        }

        setStats({
          pendingProviders: pendingData.count ?? 0,
          totalInquiries: leadsData.count ?? 0,
          needsEmailCount: needsEmailData.count ?? 0,
          adminCount: teamData.admins?.length ?? 0,
          imagesToReview: imageStats.needs_review ?? 0,
          totalProviders: directoryData.total ?? 0,
          totalQuestions: questionsData.count ?? 0,
        });
        setAuditLog(auditData.entries ?? []);
      } catch (err) {
        console.error("Failed to fetch admin overview:", err);
        setError("Failed to load dashboard data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 mt-1">
          Manage providers, view leads, and administer the team.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/providers" className="block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors">
            <p className="text-base text-gray-500 mb-1">Pending Providers</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.pendingProviders ?? 0}
            </p>
            <p className="text-base text-gray-500">Awaiting review</p>
          </div>
        </Link>
        <Link href="/admin/leads" className="block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors">
            <p className="text-base text-gray-500 mb-1">Total Inquiries</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalInquiries ?? 0}
            </p>
            <p className="text-base text-gray-500">All connections</p>
          </div>
        </Link>
        <Link href="/admin/leads?tab=needs_email" className="block">
          <div className={`p-6 rounded-xl border transition-colors ${(stats?.needsEmailCount ?? 0) > 0 ? "bg-amber-50 border-amber-200 hover:border-amber-300" : "bg-white border-gray-200 hover:border-primary-200"}`}>
            <p className="text-base text-gray-500 mb-1">Needs Email</p>
            <p className={`text-3xl font-bold mb-1 ${(stats?.needsEmailCount ?? 0) > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {stats?.needsEmailCount ?? 0}
            </p>
            <p className="text-base text-gray-500">Leads awaiting email</p>
          </div>
        </Link>
        <Link href="/admin/questions" className="block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors">
            <p className="text-base text-gray-500 mb-1">Q&A</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalQuestions?.toLocaleString() ?? 0}
            </p>
            <p className="text-base text-gray-500">Questions submitted</p>
          </div>
        </Link>
        <Link href="/admin/team" className="block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors">
            <p className="text-base text-gray-500 mb-1">Admin Team</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.adminCount ?? 0}
            </p>
            <p className="text-base text-gray-500">Active admins</p>
          </div>
        </Link>
        <Link href="/admin/directory" className="block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors">
            <p className="text-base text-gray-500 mb-1">Provider Directory</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalProviders?.toLocaleString() ?? 0}
            </p>
            <p className="text-base text-gray-500">Total providers</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        {auditLog.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No activity yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {auditLog.map((entry) => (
              <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatAction(entry.action, entry.target_type)}
                  </p>
                  <p className="text-sm text-gray-500">
                    by {entry.admin_email ?? "Unknown"} &middot; {formatDate(entry.created_at)}
                  </p>
                </div>
                <Badge variant={getActionBadgeVariant(entry.action)}>
                  {entry.action}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(action: string, targetType: string): string {
  const actionLabels: Record<string, string> = {
    approve_provider: "Approved a provider",
    reject_provider: "Rejected a provider",
    add_admin: "Added an admin",
    remove_admin: "Removed an admin",
    update_directory_provider: "Updated a directory provider",
  };
  return actionLabels[action] ?? `${action} on ${targetType}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionBadgeVariant(action: string): "verified" | "pending" | "default" {
  if (action.includes("approve")) return "verified";
  if (action.includes("reject")) return "pending";
  return "default";
}
