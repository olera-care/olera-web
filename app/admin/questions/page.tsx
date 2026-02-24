"use client";

import { useState, useEffect, useCallback } from "react";

interface Question {
  id: string;
  provider_id: string;
  asker_name: string;
  asker_email: string | null;
  question: string;
  answer: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_TABS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Answered", value: "answered" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  answered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  flagged: "bg-gray-100 text-gray-800",
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [count, setCount] = useState(0);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (activeTab) params.set("status", activeTab);
      const res = await fetch(`/api/admin/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestions(data.questions);
      setCount(data.count);
    } catch {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAction = async (id: string, action: "approve" | "reject" | "answer") => {
    setActionLoading(id);
    try {
      const body: Record<string, unknown> = { id };
      if (action === "approve") {
        body.status = "approved";
        body.is_public = true;
      } else if (action === "reject") {
        body.status = "rejected";
        body.is_public = false;
      } else if (action === "answer") {
        const answer = answerDrafts[id]?.trim();
        if (!answer) return;
        body.answer = answer;
      }

      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Refresh list
      setAnswerDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
      await fetchQuestions();
    } catch {
      setError("Failed to update question");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate caregiver questions asked on provider pages
          </p>
        </div>
        <span className="text-sm text-gray-400">{count} total</span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Question List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No {activeTab || ""} questions found.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900">{q.question}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>By {q.asker_name}</span>
                    {q.asker_email && <span>{q.asker_email}</span>}
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Provider: <span className="font-mono text-gray-500">{q.provider_id}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${STATUS_COLORS[q.status] || "bg-gray-100 text-gray-600"}`}>
                  {q.status}
                </span>
              </div>

              {/* Answer (if exists) */}
              {q.answer && (
                <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                  <p className="text-sm text-gray-700">{q.answer}</p>
                </div>
              )}

              {/* Actions */}
              {q.status === "pending" && (
                <div className="mt-4 space-y-3">
                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(q.id, "approve")}
                      disabled={actionLoading === q.id}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleAction(q.id, "reject")}
                      disabled={actionLoading === q.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                  {/* Answer inline */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type an answer on behalf of the provider..."
                      value={answerDrafts[q.id] || ""}
                      onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                    />
                    <button
                      onClick={() => handleAction(q.id, "answer")}
                      disabled={actionLoading === q.id || !answerDrafts[q.id]?.trim()}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
