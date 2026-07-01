"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

interface ProviderQuestionGroupProps {
  provider: ProviderData;
  stats: ProviderStats;
  questions: Question[];
  /** Whether any question has email_dead (bounced) */
  hasDeliveryIssue?: boolean;
  onEmailAdded: () => void;
  onArchiveProvider: (providerId: string, providerName: string) => void;
  onArchiveQuestion: (questionId: string) => void;
  onRemoveQuestion: (questionId: string) => void;
  onRestoreQuestion: (questionId: string) => void;
  actionLoading: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ProviderStatusBadge({ provider }: { provider: ProviderData }) {
  // Claimed + Verified
  if (provider.isAccountClaimed && (provider.verificationState === "verified" || provider.verificationState === "not_required" || !provider.verificationState)) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Verified
      </span>
    );
  }

  // Claimed but pending verification
  if (provider.isAccountClaimed && provider.verificationState === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 rounded">
        Pending
      </span>
    );
  }

  // Claimed but unverified/rejected
  if (provider.isAccountClaimed) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded">
        Unverified
      </span>
    );
  }

  // Unclaimed
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-50 rounded">
      Unclaimed
    </span>
  );
}

function EmailStatusBadge({ provider, hasDeliveryIssue }: { provider: ProviderData; hasDeliveryIssue?: boolean }) {
  if (provider.isAccountClaimed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Claimed
      </span>
    );
  }

  // Email exists but bounced/failed
  if (provider.email && hasDeliveryIssue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Email bounced
      </span>
    );
  }

  // Email exists and working
  if (provider.email) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {provider.email}
      </span>
    );
  }

  // No email
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Needs email
    </span>
  );
}

function InlineEmailInput({
  providerSlug,
  existingEmail,
  emailIsDead,
  prefillEmail,
  onEmailAdded,
}: {
  providerSlug: string;
  existingEmail?: string | null;
  emailIsDead?: boolean;
  prefillEmail?: string | null;
  onEmailAdded: () => void;
}) {
  const [email, setEmail] = useState(prefillEmail || (emailIsDead ? "" : existingEmail || ""));

  // Update email when prefillEmail changes (from candidate selection)
  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forceKind, setForceKind] = useState<"undeliverable" | "risky" | null>(null);
  const hasExistingEmail = !!existingEmail && !emailIsDead;

  async function submit(force: boolean) {
    if (!email.trim() || !providerSlug) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions/add-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug, email: email.trim(), force }),
      });

      if (res.ok) {
        setSuccess(true);
        setForceKind(null);
        setTimeout(() => onEmailAdded(), 1400);
      } else {
        const data = await res.json();
        setError(data.message || data.error || "Couldn't save that — try again.");
        setForceKind(
          res.status === 422 && (data.error === "undeliverable" || data.error === "risky")
            ? data.error
            : null,
        );
      }
    } catch {
      setError("Network hiccup — try again.");
      setForceKind(null);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(false);
  }

  if (success) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {hasExistingEmail ? "Questions forwarded" : "Saved — questions forwarded"}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="provider@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64 px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 placeholder:text-gray-300 transition"
          disabled={saving}
          required
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={saving || !email.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100"
        >
          {saving ? (
            "Checking..."
          ) : (
            <>
              {hasExistingEmail ? "Send all" : "Add & send all"}
              <span aria-hidden className="text-white/50">→</span>
            </>
          )}
        </button>
        {hasExistingEmail && !error && !saving && email === existingEmail && (
          <span className="text-xs text-gray-400">on file</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-gray-500">
          {error}
          {forceKind && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={saving}
                className="text-gray-400 underline underline-offset-2 hover:text-gray-700 transition disabled:opacity-40"
              >
                {forceKind === "risky" ? "add it anyway" : "send to it anyway"}
              </button>
            </>
          )}
        </p>
      )}
    </form>
  );
}

export default function ProviderQuestionGroup({
  provider,
  stats,
  questions,
  hasDeliveryIssue,
  onEmailAdded,
  onArchiveProvider,
  onArchiveQuestion,
  onRemoveQuestion,
  onRestoreQuestion,
  actionLoading,
}: ProviderQuestionGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [findingEmail, setFindingEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [emailCandidates, setEmailCandidates] = useState<Array<{
    email: string;
    source: string;
    confidence: number;
  }> | null>(null);

  const providerLabel = provider.name || provider.slug;
  const needsEmail = !provider.email && !provider.isAccountClaimed;
  const hasAnyEmailIssue = questions.some(
    (q) => q.metadata?.needs_provider_email === true || q.metadata?.email_dead === true
  );

  async function handleFindEmail() {
    setFindingEmail(true);
    setEmailCandidates(null);
    try {
      const res = await fetch("/api/admin/connections/find-provider-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug: provider.slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailCandidates(data.candidates || []);
      } else {
        // API error - show "no candidates found" state
        setEmailCandidates([]);
      }
    } catch {
      // Network error - show "no candidates found" state so user gets feedback
      setEmailCandidates([]);
    } finally {
      setFindingEmail(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden">
      {/* Provider Header */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="p-0.5 text-gray-400 hover:text-gray-600 transition"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {provider.editorId ? (
                <Link
                  href={`/admin/directory/${provider.editorId}`}
                  className="text-[15px] font-medium text-gray-900 hover:text-primary-600 transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {providerLabel}
                </Link>
              ) : (
                <a
                  href={`/provider/${provider.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-medium text-gray-900 hover:text-primary-600 transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {providerLabel}
                </a>
              )}
              <ProviderStatusBadge provider={provider} />
              <EmailStatusBadge provider={provider} hasDeliveryIssue={hasDeliveryIssue} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
              <span>{stats.total} question{stats.total !== 1 ? "s" : ""}</span>
              {stats.pending > 0 && <span>{stats.pending} pending</span>}
              {stats.answered > 0 && <span>{stats.answered} answered</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Show Find button when provider needs email OR has email issues (dead/bounced) */}
          {(needsEmail || hasAnyEmailIssue) && (
            <button
              onClick={handleFindEmail}
              disabled={findingEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {findingEmail ? (
                <>
                  <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find
                </>
              )}
            </button>
          )}
          <button
            onClick={() => onArchiveProvider(provider.slug, providerLabel)}
            disabled={actionLoading === `provider:${provider.slug}`}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-amber-600 transition disabled:opacity-50"
          >
            Archive
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 border-t border-gray-100">
          {/* Email Input Section (provider-level) */}
          {(needsEmail || hasAnyEmailIssue) && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="mb-2 text-[13px] text-gray-500 leading-relaxed">
                {provider.email ? (
                  <>
                    Email on file may have issues. Update to forward {stats.needsEmail > 1 ? "all questions" : "this question"}.
                  </>
                ) : (
                  <>
                    No email on file — add one to forward {stats.needsEmail > 1 ? `all ${stats.needsEmail} questions` : "this question"}.
                  </>
                )}
              </p>

              {emailCandidates && emailCandidates.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-2">Found via AI search:</p>
                  <div className="flex flex-wrap gap-2">
                    {emailCandidates.map((c, i) => (
                      <button
                        key={i}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border rounded-lg transition ${
                          selectedEmail === c.email ? "border-blue-500 ring-2 ring-blue-200" : "border-blue-200 hover:border-blue-400"
                        }`}
                        onClick={() => setSelectedEmail(c.email)}
                      >
                        {c.email}
                        <span className={`text-[10px] ${c.confidence >= 80 ? "text-emerald-600" : c.confidence >= 50 ? "text-amber-600" : "text-gray-400"}`}>
                          {c.confidence >= 80 ? "High" : c.confidence >= 50 ? "Med" : "Low"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {emailCandidates && emailCandidates.length === 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500">No email candidates found. Try a manual search:</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${providerLabel} contact email`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-gray-600 hover:text-primary-600 transition"
                  >
                    Search Google
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              <InlineEmailInput
                providerSlug={provider.slug}
                existingEmail={provider.email}
                emailIsDead={questions.some((q) => q.metadata?.email_dead === true)}
                prefillEmail={selectedEmail}
                onEmailAdded={onEmailAdded}
              />
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            {questions.map((q) => {
              const isRemoved = q.status === "rejected";
              const isArchived = q.status === "archived";
              const isLive = q.status === "pending" || q.status === "approved";

              return (
                <div
                  key={q.id}
                  className={`group py-2 ${isRemoved || isArchived ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isRemoved ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{q.asker_name}</span>
                        <span>·</span>
                        <span>{formatDate(q.created_at)}</span>
                        {q.status === "answered" && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600">Answered</span>
                          </>
                        )}
                        {isArchived && (
                          <>
                            <span>·</span>
                            <span className="text-gray-400">Archived</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isLive && (
                        <>
                          <button
                            onClick={() => onArchiveQuestion(q.id)}
                            disabled={actionLoading === q.id}
                            className="text-xs text-gray-400 hover:text-amber-600 transition disabled:opacity-40"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => onRemoveQuestion(q.id)}
                            disabled={actionLoading === q.id}
                            className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {(isArchived || isRemoved) && (
                        <button
                          onClick={() => onRestoreQuestion(q.id)}
                          disabled={actionLoading === q.id}
                          className="text-xs text-gray-400 hover:text-gray-900 transition disabled:opacity-40"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {q.answer && (
                    <div className="mt-2 pl-3 border-l-2 border-gray-100">
                      <p className="text-sm text-gray-500">{q.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
