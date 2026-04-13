"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewUpgradeModal from "@/components/provider/ReviewUpgradeModal";

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

function LinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function PlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

// ── Default message ──

const DEFAULT_MESSAGE = "Hi, we'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.";

// ── Video Panel ──

function VideoPanel() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="aspect-video relative">
        {isPlaying ? (
          <iframe
            src="https://www.youtube.com/embed/cb3TMkMNe3I?autoplay=1&rel=0"
            title="How to get more reviews"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full group"
          >
            {/* YouTube thumbnail */}
            <img
              src="https://img.youtube.com/vi/cb3TMkMNe3I/maxresdefault.jpg"
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to hqdefault if maxresdefault doesn't exist
                (e.target as HTMLImageElement).src = "https://img.youtube.com/vi/cb3TMkMNe3I/hqdefault.jpg";
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <PlayIcon className="w-7 h-7 text-gray-900 ml-1" />
              </div>
            </div>
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-medium text-sm">How to get more Google reviews</p>
              <p className="text-white/70 text-xs mt-0.5">2 min watch</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Send Request Form ──

function SendRequestForm({
  onSuccess,
  providerSlug,
  remainingRequests,
  creditsUsed,
  onUpgradeRequired,
}: {
  onSuccess?: () => void;
  providerSlug?: string;
  remainingRequests: number;
  creditsUsed: number;
  onUpgradeRequired: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const isAtLimit = remainingRequests <= 0;

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
        // Handle 402 - upgrade required
        if (res.status === 402 && data.upgrade_required) {
          onUpgradeRequired();
          return;
        }
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
      <div className="text-center py-10 animate-fade-in">
        <div className="relative w-16 h-16 mx-auto mb-4 animate-success-bounce">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
          <div className="absolute -bottom-0.5 -left-1 w-2 h-2 bg-primary-400 rounded-full" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Request sent!</h3>
        <p className="text-sm text-gray-500 mb-5">
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
      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm" role="alert">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200 resize-y min-h-[120px] leading-relaxed disabled:bg-gray-50 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Submit button */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={!clientName.trim() || !email.trim() || !message.trim() || isSubmitting || isAtLimit}
          className="w-full py-3.5 rounded-2xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 shadow-[0_4px_12px_rgb(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgb(0,0,0,0.2)] disabled:shadow-none"
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

        {/* Remaining requests - only show when low */}
        {remainingRequests <= 3 && remainingRequests > 0 && (
          <p className="text-center text-xs text-amber-600 font-medium">
            {remainingRequests} free request{remainingRequests === 1 ? "" : "s"} remaining
          </p>
        )}

        {/* At limit message */}
        {isAtLimit && (
          <button
            type="button"
            onClick={onUpgradeRequired}
            className="text-center text-xs text-primary-600 hover:text-primary-700 font-medium w-full"
          >
            Upgrade to Pro for unlimited requests
          </button>
        )}
      </div>

      {/* Direct link option */}
      {providerSlug && (
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
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
              <div className="w-10 h-10 rounded-full bg-gray-200" />
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
      <div className="text-center py-14 px-6">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <MailIcon className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No requests sent yet</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Sent requests will appear here.
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
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(request.clientName)} flex items-center justify-center shrink-0`}>
              <span className="text-xs font-semibold text-gray-600">
                {getInitials(request.clientName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">
                  {request.clientName}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                  Sent
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {request.recipient}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(request.sentAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
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
  const [remainingRequests, setRemainingRequests] = useState(3);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  // Fetch requests and credits info
  const fetchRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/review-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const reqs = data.requests || [];
      setRequests(reqs);
      setRequestsError(null);

      // Use credits info from API (lifetime limit, not monthly)
      const used = data.credits_used ?? 0;
      const remaining = data.is_paid ? Infinity : (data.credits_remaining ?? 3);
      setCreditsUsed(used);
      setRemainingRequests(remaining);
    } catch (err) {
      console.error("Failed to fetch sent requests:", err);
      setRequestsError("Failed to load sent requests");
    } finally {
      setIsLoadingRequests(false);
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

      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page header */}
          <div className="mb-5 lg:mb-8">
            <h1 className="text-2xl lg:text-[28px] font-display font-bold text-gray-900 tracking-tight">
              Review Requests
            </h1>
            <p className="text-[15px] text-gray-500 mt-1.5 leading-relaxed">
              Ask happy clients to leave a Google review.
            </p>
          </div>

          {/* Tabs - matches Q&A and Connections style */}
          <div className="mb-4 lg:mb-5">
            <div
              className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl w-max"
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
                  className={`px-5 py-2.5 rounded-lg text-[15px] font-semibold transition-all min-h-[44px] ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-semibold ${
                      activeTab === tab.id ? "bg-vanilla-100 text-gray-600" : "bg-warm-100/50 text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content grid - matches Q&A layout */}
          <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-8 lg:items-start">
            {/* Main content */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 lg:p-6 mb-6 lg:mb-0">
              {activeTab === "send_request" && (
                <SendRequestForm
                  onSuccess={handleSendSuccess}
                  providerSlug={providerSlug || undefined}
                  remainingRequests={remainingRequests}
                  creditsUsed={creditsUsed}
                  onUpgradeRequired={() => setShowUpgradeModal(true)}
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

            {/* Video panel */}
            <div className="hidden lg:block sticky top-24">
              <VideoPanel />
            </div>
          </div>

          {/* Mobile video */}
          <div className="lg:hidden mt-6">
            <VideoPanel />
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <ReviewUpgradeModal
          creditsUsed={creditsUsed}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
