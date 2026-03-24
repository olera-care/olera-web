"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Question {
  id: string;
  provider_id: string;
  provider_name: string | null;
  provider_editor_id: string | null;
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

type TabValue = "unanswered" | "needs_email" | "answered" | "removed" | "";

const TABS: { label: string; value: TabValue; showCount?: boolean }[] = [
  { label: "Needs Email", value: "needs_email", showCount: true },
  { label: "Unanswered", value: "unanswered", showCount: true },
  { label: "Answered", value: "answered" },
  { label: "Removed", value: "removed" },
  { label: "All", value: "" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Live",
  approved: "Live",
  answered: "Answered",
  rejected: "Removed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-emerald-50 text-emerald-600",
  approved: "bg-emerald-50 text-emerald-600",
  answered: "bg-sky-50 text-sky-700",
  rejected: "bg-red-50 text-red-500",
};

function InlineEmailInput({
  providerSlug,
  onEmailAdded,
}: {
  providerSlug: string;
  onEmailAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !providerSlug) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions/add-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug, email: email.trim() }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onEmailAdded(), 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Email saved — question forwarded
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        placeholder="provider@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-56 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-300"
        disabled={saving}
        required
      />
      <button
        type="submit"
        disabled={saving || !email.trim()}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        {saving ? "Saving..." : "Add & Send"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("needs_email");
  const [count, setCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<{ pending: number; needs_email: number }>({ pending: 0, needs_email: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (activeTab === "needs_email") {
        params.set("needs_email", "true");
      } else if (activeTab === "unanswered") {
        // Unanswered = pending + approved (both are live, awaiting provider response)
        params.set("status", "pending");
      } else if (activeTab === "removed") {
        params.set("status", "rejected");
      } else if (activeTab) {
        params.set("status", activeTab);
      }
      const res = await fetch(`/api/admin/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestions(data.questions);
      setCount(data.count);
      if (data.tabCounts) setTabCounts(data.tabCounts);
    } catch {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleRemove = async (id: string) => {
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

  const handleRestore = async (id: string) => {
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Questions</h1>
        <p className="text-sm text-gray-400 mt-1">
          Questions go live immediately. Supply provider emails and remove spam.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {TABS.map((tab) => {
          const tabCount = tab.value === "unanswered" ? tabCounts.pending
            : tab.value === "needs_email" ? tabCounts.needs_email
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
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.value
                    ? "bg-gray-900 text-white"
                    : tab.value === "needs_email"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                }`}>
                  {tabCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20">
          {activeTab === "needs_email" ? (
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="space-y-2">
          {questions.map((q) => {
            const needsEmail = q.metadata?.needs_provider_email === true;
            const providerLabel = q.provider_name || q.provider_id;
            const isRemoved = q.status === "rejected";
            const isLive = q.status === "pending" || q.status === "approved";

            return (
              <div
                key={q.id}
                className={`rounded-xl border px-5 py-4 transition-colors ${
                  needsEmail
                    ? "border-amber-200 bg-amber-50/50"
                    : isRemoved
                      ? "border-gray-100 bg-gray-50/50 opacity-60"
                      : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                {/* Main row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Question text */}
                    <a
                      href={`/provider/${q.provider_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-[15px] font-medium leading-snug hover:underline transition-colors ${isRemoved ? "text-gray-400 line-through" : "text-gray-900 hover:text-primary-600"}`}
                    >
                      {q.question}
                    </a>

                    {/* Meta line */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{q.asker_name}</span>
                      <span className="text-gray-200">·</span>
                      {q.provider_editor_id ? (
                        <Link
                          href={`/admin/directory/${q.provider_editor_id}`}
                          className="text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          {providerLabel}
                        </Link>
                      ) : (
                        <a
                          href={`/provider/${q.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          {providerLabel}
                        </a>
                      )}
                      {needsEmail && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-amber-600 font-medium">No email</span>
                        </>
                      )}
                      <span className="text-gray-200">·</span>
                      <span>{formatDate(q.created_at)}</span>
                    </div>
                  </div>

                  {/* Right side: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLive && (
                      <button
                        onClick={() => handleRemove(q.id)}
                        disabled={actionLoading === q.id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        Remove
                      </button>
                    )}
                    {isRemoved && (
                      <button
                        onClick={() => handleRestore(q.id)}
                        disabled={actionLoading === q.id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                      >
                        Restore
                      </button>
                    )}
                    {!isLive && !isRemoved && (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[q.status] || "bg-gray-50 text-gray-500"}`}>
                        {STATUS_LABELS[q.status] || q.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Answer display */}
                {q.answer && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600">{q.answer}</p>
                  </div>
                )}

                {/* Email input — the primary action for needs_email */}
                {needsEmail && (
                  <div className="mt-3 pt-3 border-t border-amber-100">
                    <InlineEmailInput
                      providerSlug={q.provider_id}
                      onEmailAdded={fetchQuestions}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {!loading && questions.length > 0 && (
        <div className="mt-4 text-xs text-gray-300 text-right">
          {count} {activeTab === "needs_email" ? "needing email" : activeTab === "unanswered" ? "unanswered" : activeTab === "removed" ? "removed" : "total"}
        </div>
      )}
    </div>
  );
}
