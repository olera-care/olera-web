"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──

type TabFilter = "send_request" | "sent_requests";

interface SentRequest {
  id: string;
  clientName: string;
  recipient: string;
  deliveryMethod: string;
  sentAt: string;
  status: string;
}

interface ReviewStats {
  totalSent: number;
  thisMonth: number;
  monthlyLimit: number;
}

// ── Helpers ──

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

// ── Icons ──

function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function LinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function TrendingUpIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ── Default message ──

const DEFAULT_MESSAGE = "Hi, we'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.";

// ── Stats Header ──

function StatsHeader({ stats, isLoading }: { stats: ReviewStats; isLoading: boolean }) {
  const usagePercent = stats.monthlyLimit > 0 ? Math.min((stats.thisMonth / stats.monthlyLimit) * 100, 100) : 0;
  const remaining = Math.max(stats.monthlyLimit - stats.thisMonth, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Sent */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <MailIcon className="w-4 h-4" />
          <span className="text-xs font-medium">Total Sent</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <TrendingUpIcon className="w-4 h-4" />
          <span className="text-xs font-medium">This Month</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
      </div>

      {/* Usage - with progress bar */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)] col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Monthly Usage</span>
          <span className="text-xs font-semibold text-gray-700">{stats.thisMonth}/{stats.monthlyLimit}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercent >= 90 ? "bg-amber-500" : "bg-primary-500"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {remaining <= 3 && remaining > 0 && (
          <p className="text-xs text-amber-600 mt-1.5 font-medium">{remaining} requests remaining</p>
        )}
      </div>

      {/* Pro tip / upgrade hint */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-200/40 p-4 col-span-2 lg:col-span-1">
        <div className="flex items-start gap-2">
          <StarIcon className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary-900">Pro tip</p>
            <p className="text-xs text-primary-700 mt-0.5 leading-relaxed">
              Providers with 10+ reviews see 3x more inquiries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Send Request Form ──

function SendRequestForm({
  onSuccess,
  providerSlug,
  stats,
}: {
  onSuccess?: () => void;
  providerSlug?: string;
  stats: ReviewStats;
}) {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const isAtLimit = stats.thisMonth >= stats.monthlyLimit;

  // Auto-dismiss success after 4 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim() || !message.trim() || isSubmitting || isAtLimit) return;

    setIsSubmitting(true);
    setShowSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: [{ name: clientName.trim(), email: email.trim() }],
          message: message.trim(),
          delivery_method: "email",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      const failedResults = data.results?.filter((r: { status: string }) => r.status === "failed") || [];
      if (failedResults.length > 0) {
        throw new Error(failedResults[0]?.error || "Failed to send email");
      }

      setSuccessName(clientName);
      setShowSuccess(true);
      setClientName("");
      setEmail("");
      setMessage(DEFAULT_MESSAGE);
      onSuccess?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!providerSlug) return;
    const link = `${window.location.origin}/review/${providerSlug}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Success celebration state
  if (showSuccess) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="relative w-16 h-16 mx-auto mb-4 animate-success-bounce">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
          <div className="absolute -bottom-0.5 -left-1 w-2 h-2 bg-primary-400 rounded-full" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Request sent!</h3>
        <p className="text-sm text-gray-500 mb-4">
          {successName} will receive your review request shortly.
        </p>
        <button
          type="button"
          onClick={() => setShowSuccess(false)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* At limit warning */}
      {isAtLimit && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <ClockIcon className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Monthly limit reached</p>
            <p className="text-amber-700 mt-0.5">You&apos;ve used all {stats.monthlyLimit} requests this month. Resets on the 1st.</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-error-50 border border-error-100 rounded-xl text-error-700 text-sm" role="alert">
          <svg className="w-5 h-5 shrink-0 text-error-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Client Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Client name
          </label>
          <input
            type="text"
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Jane Smith"
            disabled={isAtLimit}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            disabled={isAtLimit}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
            required
            autoComplete="off"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
          Your message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Write a personal message..."
          disabled={isAtLimit}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all duration-200 resize-y min-h-[120px] leading-relaxed disabled:bg-gray-50 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!clientName.trim() || !email.trim() || !message.trim() || isSubmitting || isAtLimit}
        className="w-full py-4 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 shadow-[0_4px_12px_rgb(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgb(0,0,0,0.2)] disabled:shadow-none"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <MailIcon className="w-5 h-5" />
            Send review request
          </span>
        )}
      </button>

      {/* Direct link option */}
      {providerSlug && (
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <LinkIcon className="w-4 h-4" />
            {linkCopied ? (
              <span className="text-emerald-600 font-medium">Link copied!</span>
            ) : (
              <span>Copy direct review link</span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}

// ── Sent Requests List ──

function SentRequestsList({ requests, isLoading, error }: { requests: SentRequest[]; isLoading: boolean; error: string | null }) {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading sent requests">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <MailIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No requests sent yet</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          When you send review requests, they&apos;ll appear here so you can track them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request, idx) => (
        <div
          key={request.id}
          className="bg-gray-50/50 hover:bg-gray-50 rounded-xl p-4 transition-all duration-200"
          style={{ animation: `fadeIn 0.2s ease-out ${idx * 40}ms both` }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(request.clientName)} flex items-center justify-center shrink-0`}>
              <span className="text-sm font-semibold text-gray-600">
                {getInitials(request.clientName)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">
                  {request.clientName}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  request.status === "sent"
                    ? "bg-emerald-100 text-emerald-700"
                    : request.status === "clicked"
                    ? "bg-blue-100 text-blue-700"
                    : request.status === "reviewed"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {request.status === "sent" && "Sent"}
                  {request.status === "clicked" && "Clicked"}
                  {request.status === "reviewed" && "Reviewed"}
                  {!["sent", "clicked", "reviewed"].includes(request.status) && request.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {request.recipient}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                {formatDate(request.sentAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tips Panel ──

function TipsPanel() {
  const tips = [
    {
      title: "Ask right after service",
      description: "Reach out within 24-48 hours while the experience is fresh.",
    },
    {
      title: "Make it personal",
      description: "Use their name and mention specific care you provided.",
    },
    {
      title: "Keep it simple",
      description: "One click to review. We help them write it.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Stats highlight */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUpIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">3x</p>
            <p className="text-sm text-primary-100">more inquiries</p>
          </div>
        </div>
        <p className="text-sm text-primary-100 leading-relaxed">
          Providers with 10+ Google reviews see significantly more family inquiries.
        </p>
      </div>

      {/* Tips */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Tips for success</h3>
        </div>
        <div className="space-y-4">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-700">{i + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ProviderReviewsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("send_request");
  const [providerSlug, setProviderSlug] = useState<string | null>(null);
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReviewStats>({ totalSent: 0, thisMonth: 0, monthlyLimit: 10 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch provider slug
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/provider/profile");
        if (res.ok) {
          const data = await res.json();
          setProviderSlug(data.profile?.slug || null);
        }
      } catch {
        // Silently fail
      }
    })();
  }, []);

  // Fetch requests and compute stats
  const fetchRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/review-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const reqs = data.requests || [];
      setRequests(reqs);
      setRequestsError(null);

      // Compute stats from requests
      const now = new Date();
      const thisMonthRequests = reqs.filter((r: SentRequest) => {
        const sentDate = new Date(r.sentAt);
        return sentDate.getMonth() === now.getMonth() && sentDate.getFullYear() === now.getFullYear();
      });

      setStats({
        totalSent: reqs.length,
        thisMonth: thisMonthRequests.length,
        monthlyLimit: 10, // TODO: fetch from subscription tier
      });
    } catch (err) {
      console.error("Failed to fetch sent requests:", err);
      setRequestsError("Failed to load sent requests");
    } finally {
      setIsLoadingRequests(false);
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSendSuccess = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);

  const TABS: { id: TabFilter; label: string; count?: number }[] = [
    { id: "send_request", label: "Send Request" },
    { id: "sent_requests", label: "History", count: requests.length },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes success-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-success-bounce {
          animation: success-bounce 0.4s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Review Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Request reviews from clients to build trust and attract more families.
            </p>
          </div>

          {/* Stats header */}
          <StatsHeader stats={stats} isLoading={isLoadingStats} />

          {/* Tabs */}
          <div className="mb-5">
            <div
              className="inline-flex gap-1 bg-gray-100 p-1 rounded-xl"
              role="tablist"
              aria-label="Review request tabs"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                      activeTab === tab.id ? "bg-gray-100 text-gray-600" : "bg-gray-200/50 text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content grid */}
          <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6 lg:items-start">
            {/* Main content */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.04)] p-5 lg:p-6 mb-6 lg:mb-0">
              {activeTab === "send_request" && (
                <SendRequestForm
                  onSuccess={handleSendSuccess}
                  providerSlug={providerSlug || undefined}
                  stats={stats}
                />
              )}
              {activeTab === "sent_requests" && (
                <SentRequestsList
                  requests={requests}
                  isLoading={isLoadingRequests}
                  error={requestsError}
                />
              )}
            </div>

            {/* Tips panel */}
            <div className="hidden lg:block sticky top-24">
              <TipsPanel />
            </div>
          </div>

          {/* Mobile tips */}
          <div className="lg:hidden mt-6">
            <TipsPanel />
          </div>
        </div>
      </div>
    </>
  );
}
