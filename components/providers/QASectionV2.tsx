"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface QAEntry {
  id?: string;
  question: string;
  answer?: string | null;
  asker_name?: string;
  asker_user_id?: string;
  status?: "pending" | "approved" | "answered";
  created_at?: string;
  answered_at?: string;
}

interface QASectionProps {
  providerId: string;
  providerName: string;
  providerImage?: string;
  questions?: QAEntry[];
  suggestedQuestions?: string[];
}

// More menu icon component
function MoreIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

// Arrow icon for suggestion cards
function ArrowIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300 group-hover/card:text-primary-600 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
    </svg>
  );
}

// Send icon for chat bar
function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

// Avatar gradient (deterministic by name)
const AVATAR_GRADIENTS = [
  "from-rose-100 to-pink-50",
  "from-sky-100 to-blue-50",
  "from-amber-100 to-yellow-50",
  "from-emerald-100 to-green-50",
  "from-violet-100 to-purple-50",
  "from-orange-100 to-amber-50",
  "from-teal-100 to-cyan-50",
  "from-fuchsia-100 to-pink-50",
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  if (!name || name === "Anonymous") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Format relative time
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function QASectionV2({
  providerId,
  providerName,
  providerImage,
  questions: initialQuestions = [],
  suggestedQuestions = [
    "What services do you provide?",
    "What are your rates or pricing?",
    "How quickly can you get started?",
    "Do you accept insurance or Medicaid?",
  ],
}: QASectionProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [questions, setQuestions] = useState<QAEntry[]>(initialQuestions);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Track which suggestion card was tapped (for success state)
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Guest enrichment state (post-submit identity capture)
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [enrichQuestionId, setEnrichQuestionId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [guestError, setGuestError] = useState("");
  const [enriching, setEnriching] = useState(false);

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<QAEntry | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Fetch public questions on mount
  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions?provider_id=${encodeURIComponent(providerId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions?.length > 0) {
          setQuestions(data.questions);
        }
      }
    } catch {
      // Silently fail — questions are non-critical
    }
  }, [providerId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Submit question — fires immediately for both auth and guest
  const submitQuestion = useCallback(async (questionText: string, suggestionIndex?: number) => {
    if (!questionText.trim()) return;

    setSubmitting(true);
    setSubmitStatus("idle");
    if (suggestionIndex !== undefined) setTappedIndex(suggestionIndex);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          question: questionText.trim(),
          honeypot: honeypot || undefined,
        }),
      });

      if (!res.ok) {
        setSubmitStatus("error");
        setTappedIndex(null);
        return;
      }

      const data = await res.json();
      if (data.question) {
        setQuestions((prev) => [data.question, ...prev]);

        // For guests: show enrichment prompt after successful submit
        if (!user && data.question.id) {
          setEnrichQuestionId(data.question.id);
          setShowEnrichment(true);
        }
      }

      setInputValue("");
      setSubmitStatus("success");

      // Auto-dismiss success for authenticated users
      if (user) {
        setTimeout(() => {
          setSubmitStatus("idle");
          setTappedIndex(null);
        }, 3000);
      }
    } catch {
      setSubmitStatus("error");
      setTappedIndex(null);
    } finally {
      setSubmitting(false);
    }
  }, [providerId, user, honeypot]);

  // Handle submit from chat bar
  const handleChatSubmit = () => {
    if (!inputValue.trim() || submitting) return;
    submitQuestion(inputValue);
  };

  // Enrich anonymous question with email (optional, post-submit)
  const handleEnrich = async () => {
    if (!enrichQuestionId) return;
    setGuestError("");

    // Honeypot
    if (honeypot) {
      setShowEnrichment(false);
      setTimeout(() => { setSubmitStatus("idle"); setTappedIndex(null); }, 2000);
      return;
    }

    if (!guestEmail.trim()) {
      setShowEnrichment(false);
      setTimeout(() => { setSubmitStatus("idle"); setTappedIndex(null); }, 2000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail.trim())) {
      setGuestError("Please enter a valid email.");
      return;
    }

    setEnriching(true);
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: enrichQuestionId,
          asker_email: guestEmail.trim().toLowerCase(),
        }),
      });
    } catch {
      // Non-blocking — question is already posted
    } finally {
      setEnriching(false);
      setShowEnrichment(false);
      setEnrichQuestionId(null);
      setGuestEmail("");
      setTimeout(() => { setSubmitStatus("idle"); setTappedIndex(null); }, 2000);
    }
  };

  const handleDismissEnrichment = () => {
    setShowEnrichment(false);
    setEnrichQuestionId(null);
    setGuestEmail("");
    setTimeout(() => { setSubmitStatus("idle"); setTappedIndex(null); }, 2000);
  };

  const handleEditSubmit = async () => {
    if (!editingQuestion?.id || !editValue.trim() || editSubmitting) return;

    setEditSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingQuestion.id, question: editValue.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update question");
        return;
      }

      const data = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...data.question } : q))
      );
      setEditingQuestion(null);
      setEditValue("");
    } catch {
      alert("Failed to update question");
    } finally {
      setEditSubmitting(false);
    }
  };

  const visibleQuestions = questions.slice(0, 2);
  const hasMore = questions.length > 2;
  const [showAllModal, setShowAllModal] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAllModal) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAllModal]);

  const hasQuestions = questions.length > 0;
  const answeredCount = questions.filter((q) => q.status === "answered" || q.answer).length;

  // Determine if we're in post-submit state (success or enrichment)
  const isPostSubmit = submitStatus === "success" || showEnrichment;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-tight">
          {hasQuestions ? "Families are asking" : "Got questions?"}
        </h2>
        {hasQuestions && (
          <p className="text-[14px] text-gray-400 mt-1.5">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {answeredCount > 0 && <> &middot; {answeredCount} answered</>}
          </p>
        )}
        {!hasQuestions && (
          <p className="text-[14px] text-gray-400 mt-1.5">
            Tap a question to ask {providerName} directly
          </p>
        )}
      </div>

      {/* ── Existing Q&A threads (social proof — shown ABOVE suggestions) ── */}
      {hasQuestions && (
        <div className="mb-6">
          {visibleQuestions.map((qa, index) => {
            const isAnswered = qa.status === "answered" || !!qa.answer;
            const isPending = !isAnswered;
            const isOwner = user?.id && qa.asker_user_id === user.id;
            const canEdit = isOwner && isPending;

            return (
              <div
                key={qa.id || index}
                className={`group/question py-4 ${index > 0 ? "border-t border-gray-100" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Asker avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(qa.asker_name || "Anonymous")} shrink-0 shadow-sm`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-gray-500">
                          {qa.asker_name || "Anonymous"}
                        </p>
                        {qa.created_at && (
                          <span className="text-[12px] text-gray-400">&middot; {timeAgo(qa.created_at)}</span>
                        )}
                      </div>
                      {canEdit && qa.id && (
                        <div className="relative" ref={openMenuId === qa.id ? menuRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === qa.id ? null : qa.id!)}
                            className="w-8 h-8 -mr-2 flex items-center justify-center rounded-full text-gray-400 lg:opacity-0 lg:group-hover/question:opacity-100 hover:text-gray-600 hover:bg-gray-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                            aria-label="More options"
                          >
                            <MoreIcon className="w-5 h-5" />
                          </button>
                          {openMenuId === qa.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestion(qa);
                                  setEditValue(qa.question);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                                Edit question
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-[15px] text-gray-800 leading-relaxed">
                      {qa.question}
                    </p>

                    {isAnswered && qa.answer ? (
                      <div className="mt-4">
                        <div className="flex items-start gap-3">
                          {providerImage ? (
                            <img
                              src={providerImage}
                              alt={providerName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 ring-2 ring-white">
                              <span className="text-xs font-bold text-primary-700">
                                {providerName.charAt(0)}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{providerName}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-primary-700 bg-primary-50 uppercase tracking-wide">
                                Provider
                              </span>
                            </div>

                            <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 border-l-2 border-primary-300">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {qa.answer}
                              </p>
                            </div>

                            {qa.answered_at && (
                              <p className="text-xs text-gray-400 mt-2">
                                Answered {timeAgo(qa.answered_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : isPending && isOwner ? (
                      <div className="mt-3 flex items-center gap-2 text-[13px] text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Awaiting response</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:underline transition-colors mt-1"
            >
              See all {questions.length} questions
            </button>
          )}
        </div>
      )}

      {/* ── Suggestion Cards OR Post-Submit State ── */}
      {isPostSubmit ? (
        /* ── Post-submit: success + enrichment ── */
        <div className="animate-in fade-in duration-200">
          {/* Success confirmation */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">Question sent</p>
              <p className="text-[13px] text-gray-400">We&apos;ll notify {providerName}</p>
            </div>
          </div>

          {/* Guest enrichment — single email field */}
          {showEnrichment && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[14px] font-medium text-gray-800 mb-1">
                Get notified when they reply
              </p>
              <p className="text-[12px] text-gray-400 mb-3">
                We&apos;ll email you — nothing else.
              </p>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !enriching) { e.preventDefault(); handleEnrich(); } }}
                  placeholder="Your email"
                  autoComplete="email"
                  autoFocus
                  className={`flex-1 min-w-0 px-3.5 py-2.5 border rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all ${
                    guestError ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleEnrich}
                  disabled={enriching || !guestEmail.trim()}
                  className="px-4 py-2.5 text-[14px] font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {enriching && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Notify me
                </button>
              </div>

              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {guestError && (
                <p className="text-xs text-red-500 mt-1.5" role="alert">{guestError}</p>
              )}

              <button
                type="button"
                onClick={handleDismissEnrichment}
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors mt-2.5"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Suggestion cards — the hero ── */
        <>
          {suggestedQuestions.length > 0 && (
            <div className="space-y-2 mb-4">
              {suggestedQuestions.map((q, i) => {
                const isTapped = tappedIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (submitting) return;
                      submitQuestion(q, i);
                    }}
                    disabled={submitting}
                    className={`group/card w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 cursor-pointer disabled:cursor-default ${
                      isTapped
                        ? "bg-primary-50 border-primary-200"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.99]"
                    }`}
                  >
                    <span className={`text-[15px] leading-snug flex-1 ${
                      isTapped ? "text-primary-700 font-medium" : "text-gray-700 font-medium"
                    }`}>
                      {q}
                    </span>
                    {isTapped && submitting ? (
                      <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin shrink-0" />
                    ) : (
                      <ArrowIcon />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Chat bar input — secondary ── */}
          <div className={`relative flex items-center gap-2 border rounded-xl transition-all duration-150 ${
            inputFocused
              ? "border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white"
              : "border-gray-200 bg-gray-50"
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              placeholder="Ask something else..."
              maxLength={1000}
              className="flex-1 min-w-0 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleChatSubmit}
              disabled={!inputValue.trim() || submitting}
              className={`mr-2 p-1.5 rounded-lg transition-all ${
                inputValue.trim()
                  ? "text-primary-600 hover:bg-primary-50 active:scale-95"
                  : "text-gray-300 cursor-default"
              }`}
              aria-label="Send question"
            >
              {submitting && !tappedIndex ? (
                <span className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin block" />
              ) : (
                <SendIcon className={`w-5 h-5 ${inputValue.trim() ? "text-primary-600" : "text-gray-300"}`} />
              )}
            </button>
          </div>

          {/* Error feedback */}
          {submitStatus === "error" && (
            <p className="text-[13px] text-red-500 mt-2">Something went wrong. Try again.</p>
          )}
        </>
      )}

      {/* ── Edit Question Modal ── */}
      {editingQuestion && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={() => setEditingQuestion(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-question-title"
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-lg mx-auto p-6"
          >
            <h3 id="edit-question-title" className="text-lg font-bold text-gray-900 mb-4">
              Edit your question
            </h3>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 focus:bg-white transition-all"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  setEditValue("");
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={!editValue.trim() || editValue.trim() === editingQuestion.question || editSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── All Questions Modal (Desktop) / Bottom Sheet (Mobile) ── */}
      {showAllModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setShowAllModal(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-questions-title"
            className="fixed z-50 bg-white shadow-2xl flex flex-col
              inset-x-0 bottom-0 h-[85vh] rounded-t-3xl
              lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:h-[640px] lg:w-[600px] lg:rounded-2xl lg:border lg:border-gray-200/60"
          >
            {/* Drag handle (mobile only) */}
            <div className="lg:hidden pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-gray-200/80 bg-gray-50/50 shrink-0 rounded-t-3xl lg:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="all-questions-title" className="text-lg lg:text-xl font-bold text-gray-900 tracking-tight">
                    Questions & Answers
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {questions.length} question{questions.length !== 1 ? "s" : ""} &middot; {answeredCount} answered
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-5 lg:px-6 py-5 lg:py-6">
                {questions.map((qa, index) => {
                  const isAnswered = qa.status === "answered" || !!qa.answer;
                  const isPending = !isAnswered;
                  const isOwner = user?.id && qa.asker_user_id === user.id;
                  const askerName = qa.asker_name || "Anonymous";

                  return (
                    <div
                      key={qa.id || index}
                      className={`${index > 0 ? "mt-6 pt-6 border-t border-gray-100" : ""}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(askerName)} flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
                          <span className="text-sm font-bold text-gray-600">
                            {getInitials(askerName)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[15px] font-semibold text-gray-900">
                              {askerName}
                            </p>
                            {qa.created_at && (
                              <span className="text-[13px] text-gray-400">&middot; {timeAgo(qa.created_at)}</span>
                            )}
                          </div>

                          <p className="text-[15px] text-gray-700 leading-relaxed">
                            {qa.question}
                          </p>

                          {isPending && isOwner && (
                            <div className="mt-3 flex items-center gap-2 text-[13px] text-gray-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Awaiting response</span>
                            </div>
                          )}

                          {isAnswered && qa.answer && (
                            <div className="mt-4 ml-0.5 pl-4 border-l-2 border-primary-200">
                              <div className="flex items-start gap-3">
                                {providerImage ? (
                                  <img
                                    src={providerImage}
                                    alt={providerName}
                                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                                    <span className="text-xs font-bold text-primary-700">
                                      {providerName.charAt(0)}
                                    </span>
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{providerName}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-primary-700 bg-primary-50 uppercase tracking-wide">
                                      Provider
                                    </span>
                                  </div>

                                  <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {qa.answer}
                                  </p>

                                  {qa.answered_at && (
                                    <p className="text-xs text-gray-400 mt-2">
                                      {timeAgo(qa.answered_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile footer */}
            <div className="lg:hidden shrink-0 border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-[15px] font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-colors active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
