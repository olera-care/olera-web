"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import ProviderQuestionGroup from "@/components/admin/ProviderQuestionGroup";
import { resolveRange, type DateRangeValue } from "@/components/admin/DateRangePopover";

interface Question {
  id: string;
  provider_id: string;
  provider_name: string | null;
  provider_editor_id: string | null;
  provider_email: string | null;
  asker_name: string;
  asker_email: string | null;
  question: string;
  answer: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
}

interface ProviderData {
  id: string;
  name: string | null;
  slug: string;
  email: string | null;
  phone: string | null;
  editorId: string | null;
  isAccountClaimed: boolean;
  verificationState: string | null;
  isArchived: boolean;
}

interface ProviderStats {
  total: number;
  needsEmail: number;
  pending: number;
  answered: number;
  archived: number;
}

interface ProviderGroup {
  provider: ProviderData;
  stats: ProviderStats;
  questions: Question[];
}

type TabValue = "unanswered" | "needs_email" | "answered" | "removed" | "archived" | "";

const TABS: { label: string; value: TabValue; showCount?: boolean }[] = [
  { label: "Needs Email", value: "needs_email", showCount: true },
  { label: "Unanswered", value: "unanswered", showCount: true },
  { label: "Answered", value: "answered" },
  { label: "Removed", value: "removed" },
  { label: "Archived", value: "archived", showCount: true },
  { label: "All", value: "" },
];

export default function AdminQuestionsPage() {
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("needs_email");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalProviders, setTotalProviders] = useState(0);
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [tabCounts, setTabCounts] = useState<{ pending: number; needs_email: number; archived: number }>({ pending: 0, needs_email: 0, archived: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveProviderTarget, setArchiveProviderTarget] = useState<{ providerId: string; providerName: string } | null>(null);
  const [archiveProviderReason, setArchiveProviderReason] = useState("");
  const [archiveQuestionTarget, setArchiveQuestionTarget] = useState<string | null>(null);
  const [archiveQuestionReason, setArchiveQuestionReason] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "needs_email") params.set("tab", "needs_email");
      else if (activeTab === "unanswered") params.set("tab", "unanswered");
      else if (activeTab === "answered") params.set("tab", "answered");
      else if (activeTab === "removed") params.set("tab", "removed");
      else if (activeTab === "archived") params.set("tab", "archived");
      else params.set("tab", "all");

      const { from, to } = resolveRange(range);
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/questions/export?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Export failed", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "olera-questions.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${totalQuestions.toLocaleString()} questions`);
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For grouped mode, fetch all questions (no pagination) since pagination
      // by question count breaks provider grouping - the same provider could
      // appear on multiple pages with partial questions. Admin page volumes
      // are reasonable, so fetch all and let the UI handle display.
      const params = new URLSearchParams({
        limit: "500",
        offset: "0",
        grouped: "true",
      });
      if (activeTab === "needs_email") {
        params.set("needs_email", "true");
      } else if (activeTab === "unanswered") {
        params.set("status", "pending");
      } else if (activeTab === "removed") {
        params.set("status", "rejected");
      } else if (activeTab === "archived") {
        params.set("status", "archived");
      } else if (activeTab) {
        params.set("status", activeTab);
      }
      const { from, to } = resolveRange(range);
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProviderGroups(data.providers || []);
      setTotalQuestions(data.totalQuestions || 0);
      setTotalProviders(data.totalProviders || 0);
      if (data.tabCounts) setTabCounts(data.tabCounts);
    } catch {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [activeTab, range, debouncedSearch]); // Note: no pagination in grouped mode

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleRemoveQuestion = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected", is_public: false }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchQuestions();
    } catch {
      setError("Failed to remove question");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreQuestion = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "pending", is_public: true }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchQuestions();
    } catch {
      setError("Failed to restore question");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveQuestion = async (id: string, reason: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "archived", archive_reason: reason }),
      });
      if (!res.ok) throw new Error("Failed to archive");
      setArchiveQuestionTarget(null);
      setArchiveQuestionReason("");
      await fetchQuestions();
    } catch {
      setError("Failed to archive question");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveProvider = async (providerId: string, reason: string) => {
    setActionLoading(`provider:${providerId}`);
    try {
      const res = await fetch("/api/admin/questions/archive-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, reason: reason || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setArchiveProviderTarget(null);
      setArchiveProviderReason("");
      showToast(data.message || "Provider archived");
      await fetchQuestions();
    } catch {
      showToast("Failed to archive provider", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PulseHeader
        title="Questions"
        kpiSuffix="needing email"
        statsPath="/api/admin/questions/stats"
        range={range}
        onRangeChange={setRange}
      />

      {/* Search bar + Export button */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by provider name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-100">
        {TABS.map((tab) => {
          const tabCount = tab.value === "unanswered" ? tabCounts.pending
            : tab.value === "needs_email" ? tabCounts.needs_email
            : tab.value === "archived" ? tabCounts.archived
            : null;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.showCount && tabCount !== null && tabCount > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">
                  {tabCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : providerGroups.length === 0 ? (
        <div className="text-center py-24">
          {activeTab === "needs_email" ? (
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">All questions have provider emails</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No {activeTab === "unanswered" ? "unanswered" : activeTab === "removed" ? "removed" : activeTab || ""} questions
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {providerGroups.map((group) => (
            <ProviderQuestionGroup
              key={group.provider.id}
              provider={group.provider}
              stats={group.stats}
              questions={group.questions}
              onEmailAdded={fetchQuestions}
              onArchiveProvider={(providerId, providerName) => {
                setArchiveProviderTarget({ providerId, providerName });
                setArchiveProviderReason("");
              }}
              onArchiveQuestion={(questionId) => {
                setArchiveQuestionTarget(questionId);
                setArchiveQuestionReason("");
              }}
              onRemoveQuestion={handleRemoveQuestion}
              onRestoreQuestion={handleRestoreQuestion}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {!loading && providerGroups.length > 0 && (
        <div className="mt-6 px-2">
          <p className="text-sm text-gray-500">
            {totalProviders} provider{totalProviders !== 1 ? "s" : ""} · {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Archive question dialog */}
      {archiveQuestionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Archive question</h3>
            <p className="mt-2 text-sm text-gray-600">
              Archived questions are hidden from the public page but can be restored later.
            </p>
            <textarea
              value={archiveQuestionReason}
              onChange={(e) => setArchiveQuestionReason(e.target.value)}
              placeholder="Reason (e.g. provider unreachable after 2 attempts)..."
              className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setArchiveQuestionTarget(null); setArchiveQuestionReason(""); }}
                disabled={actionLoading === archiveQuestionTarget}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleArchiveQuestion(archiveQuestionTarget, archiveQuestionReason.trim())}
                disabled={actionLoading === archiveQuestionTarget || !archiveQuestionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === archiveQuestionTarget ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive provider dialog */}
      {archiveProviderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Archive provider
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Archive <span className="font-medium text-gray-900">{archiveProviderTarget.providerName}</span> from
              the Questions queue. This clears their current questions and
              auto-archives any future ones — so they stop showing up here. Their
              other emails and lead routing are unaffected. Reversible.
            </p>
            <textarea
              value={archiveProviderReason}
              onChange={(e) => setArchiveProviderReason(e.target.value)}
              placeholder="Reason (optional, e.g. out of business / unreachable)..."
              className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setArchiveProviderTarget(null); setArchiveProviderReason(""); }}
                disabled={actionLoading === `provider:${archiveProviderTarget.providerId}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleArchiveProvider(archiveProviderTarget.providerId, archiveProviderReason.trim())}
                disabled={actionLoading === `provider:${archiveProviderTarget.providerId}`}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === `provider:${archiveProviderTarget.providerId}` ? "Archiving..." : "Archive provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
