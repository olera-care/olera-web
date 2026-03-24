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
      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium transition-opacity duration-200">
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
        className="w-56 px-3 py-2 text-sm bg-white/80 border-0 border-b border-gray-200 rounded-none focus:outline-none focus:border-gray-900 placeholder:text-gray-300 transition-colors"
        disabled={saving}
        required
      />
      <button
        type="submit"
        disabled={saving || !email.trim()}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all duration-150 disabled:opacity-40"
      >
        {saving ? "Saving..." : "Add & Send"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
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
    <div className="bg-[#faf9f7] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 px-4 sm:px-6 lg:px-8 py-8 min-h-full">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Questions</h1>
        <p className="text-[13px] text-gray-300 mt-1.5 tracking-wide">
          Questions go live immediately. Supply provider emails and remove spam.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200/60">
        {TABS.map((tab) => {
          const tabCount = tab.value === "unanswered" ? tabCounts.pending
            : tab.value === "needs_email" ? tabCounts.needs_email
            : null;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b tracking-wide transition-colors ${
                activeTab === tab.value
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-300 hover:text-gray-500"
              }`}
            >
              {tab.label}
              {tab.showCount && tabCount !== null && tabCount > 0 && (
                <span className={`ml-1.5 text-[12px] ${
                  activeTab === tab.value
                    ? "text-gray-900"
                    : tab.value === "needs_email"
                      ? "text-amber-500"
                      : "text-gray-300"
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
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-24">
          {activeTab === "needs_email" ? (
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-300">All questions have provider emails</p>
            </div>
          ) : (
            <p className="text-sm text-gray-300">
              No {activeTab === "unanswered" ? "unanswered" : activeTab === "removed" ? "removed" : activeTab || ""} questions
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q) => {
            const needsEmail = q.metadata?.needs_provider_email === true;
            const providerLabel = q.provider_name || q.provider_id;
            const isRemoved = q.status === "rejected";
            const isLive = q.status === "pending" || q.status === "approved";
            const showEmailInput = needsEmail && !isRemoved;

            return (
              <div
                key={q.id}
                className={`group rounded-xl px-5 py-4 transition-all duration-150 ${
                  needsEmail && !isRemoved
                    ? "bg-amber-50/60"
                    : isRemoved
                      ? "bg-gray-50/40 opacity-50"
                      : "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
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
                      className={`text-[15px] font-medium leading-snug transition-colors duration-150 ${
                        isRemoved
                          ? "text-gray-400 line-through"
                          : "text-gray-900 hover:text-primary-600"
                      }`}
                    >
                      {q.question}
                    </a>

                    {/* Meta line */}
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-gray-300">
                      <span>{q.asker_name}</span>
                      {q.provider_editor_id ? (
                        <Link
                          href={`/admin/directory/${q.provider_editor_id}`}
                          className="text-gray-400 hover:text-primary-600 transition-colors duration-150"
                        >
                          {providerLabel}
                        </Link>
                      ) : (
                        <a
                          href={`/provider/${q.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary-600 transition-colors duration-150"
                        >
                          {providerLabel}
                        </a>
                      )}
                      {needsEmail && !isRemoved && (
                        <span className="text-amber-500 font-medium">No email</span>
                      )}
                      <span>{formatDate(q.created_at)}</span>
                    </div>
                  </div>

                  {/* Right side: actions — hover reveal for Remove */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLive && (
                      <button
                        onClick={() => handleRemove(q.id)}
                        disabled={actionLoading === q.id}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-red-500 rounded-lg transition-all duration-150 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    )}
                    {isRemoved && (
                      <button
                        onClick={() => handleRestore(q.id)}
                        disabled={actionLoading === q.id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-600 rounded-lg transition-colors duration-150 disabled:opacity-40"
                      >
                        Restore
                      </button>
                    )}
                    {!isLive && !isRemoved && (
                      <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${STATUS_COLORS[q.status] || "bg-gray-50 text-gray-400"}`}>
                        {STATUS_LABELS[q.status] || q.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Answer display */}
                {q.answer && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-100">
                    <p className="text-sm text-gray-500">{q.answer}</p>
                  </div>
                )}

                {/* Email input — only on live needs_email questions */}
                {showEmailInput && (
                  <div className="mt-3 pt-3 border-t border-amber-100/60">
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
        <div className="mt-6 text-[11px] text-gray-300 text-right tracking-wide">
          {count} {activeTab === "needs_email" ? "needing email" : activeTab === "unanswered" ? "unanswered" : activeTab === "removed" ? "removed" : "total"}
        </div>
      )}
    </div>
  );
}
