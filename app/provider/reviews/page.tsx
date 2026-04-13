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

// Avatar gradient (deterministic by name) - matches connections page
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

function MessageIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
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

function PlayIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14l11-7-11-7z" />
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

// ── Send Request Form ──

function SendRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "sms">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: [{ name: clientName.trim(), email: email.trim() }],
          message: "Hi, we'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.",
          delivery_method: deliveryMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send request");
      }

      setSuccessMessage(`Review request sent to ${clientName}`);
      setClientName("");
      setEmail("");
      onSuccess?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Success message */}
      {successMessage && (
        <div
          className="flex items-center gap-3 p-4 bg-success-50 border border-success-100 rounded-xl text-success-700 text-[15px]"
          role="alert"
        >
          <CheckCircleIcon className="w-5 h-5 shrink-0 text-success-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div
          className="flex items-center gap-3 p-4 bg-error-50 border border-error-100 rounded-xl text-error-700 text-[15px]"
          role="alert"
        >
          <svg className="w-5 h-5 shrink-0 text-error-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Client Name */}
      <div>
        <label htmlFor="clientName" className="block text-[15px] font-medium text-gray-700 mb-2">
          Client name
        </label>
        <input
          type="text"
          id="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter client's name"
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all min-h-[52px]"
          required
          autoComplete="name"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-2">
          Email address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all min-h-[52px]"
          required
          autoComplete="email"
        />
      </div>

      {/* Delivery Method */}
      <div>
        <label className="block text-[15px] font-medium text-gray-700 mb-2">
          Delivery method
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDeliveryMethod("email")}
            aria-pressed={deliveryMethod === "email"}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 transition-all min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1 ${
              deliveryMethod === "email"
                ? "border-primary-400 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <MailIcon className="w-5 h-5" />
            <span className="font-semibold text-[15px]">Email</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed min-h-[52px]"
          >
            <MessageIcon className="w-5 h-5" />
            <span className="font-semibold text-[15px]">SMS</span>
            <span className="text-xs bg-gray-200/80 text-gray-500 px-2 py-0.5 rounded-md font-medium">Soon</span>
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!clientName.trim() || !email.trim() || isSubmitting}
        className="w-full py-4 rounded-xl bg-primary-600 text-white text-[15px] font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 shadow-sm hover:shadow min-h-[52px]"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </span>
        ) : (
          "Send request"
        )}
      </button>
    </form>
  );
}

// ── Sent Requests List ──

function SentRequestsList({ refreshKey }: { refreshKey: number }) {
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/review-requests");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRequests(data.requests || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sent requests:", err);
        setError("Failed to load sent requests");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading sent requests">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-warm-100" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-warm-100 rounded mb-2" />
                <div className="h-3 w-48 bg-warm-50 rounded" />
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
        <p className="text-gray-500 text-[15px]">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-vanilla-100 flex items-center justify-center mx-auto mb-4">
          <MailIcon className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-display font-bold text-gray-900 mb-2">No requests sent yet</h3>
        <p className="text-[15px] text-gray-500 leading-relaxed max-w-xs mx-auto">
          When you send review requests, they&apos;ll appear here so you can track them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request, idx) => (
        <div
          key={request.id}
          className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-xs transition-all"
          style={{ animation: `fadeIn 0.2s ease-out ${idx * 50}ms both` }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient(request.clientName)} flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
              <span className="text-sm font-bold text-gray-600">
                {getInitials(request.clientName)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-[15px]">
                  {request.clientName}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  request.status === "sent"
                    ? "bg-success-50 text-success-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {request.status === "sent" ? "Sent" : request.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {request.recipient}
              </p>
              <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <MailIcon className="w-3.5 h-3.5" />
                  {request.deliveryMethod === "email" ? "Email" : "SMS"}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{formatDate(request.sentAt)}</span>
              </div>
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
      description: "One click to review. No account needed for your client.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Video placeholder */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 via-vanilla-50 to-warm-50 flex items-center justify-center relative group cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-white/95 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
          <PlayIcon className="w-7 h-7 text-primary-600 ml-0.5" />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-medium text-gray-600 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 inline-block shadow-xs">
            Learn how to get more reviews
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-display font-bold text-gray-900">Tips for success</h3>
        </div>
        <div className="space-y-4">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-700">{i + 1}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-[15px]">{tip.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──

function ReviewsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="mb-6 lg:mb-8">
            <div className="h-8 w-32 bg-warm-100 rounded-lg mb-2" />
            <div className="h-4 w-64 bg-warm-50 rounded" />
          </div>
          <div className="h-12 w-64 bg-vanilla-100 border border-warm-100/60 rounded-xl mb-6" />
          <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-8">
            <div className="bg-white rounded-2xl border border-warm-100/60 p-6 h-80" />
            <div className="hidden lg:block bg-white rounded-2xl border border-warm-100/60 h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ProviderReviewsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("send_request");
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback to refresh sent requests list after sending
  const handleSendSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const TABS: { id: TabFilter; label: string }[] = [
    { id: "send_request", label: "Send request" },
    { id: "sent_requests", label: "Sent requests" },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-[28px] font-display font-bold text-gray-900 tracking-tight">
              Reviews
            </h1>
            <p className="text-[15px] text-gray-500 mt-1.5 leading-relaxed">
              Request reviews from your clients to build trust with families.
            </p>
          </div>

          {/* Pill tabs - matches other provider pages */}
          <div className="mb-6">
            <div
              className="inline-flex gap-0.5 bg-vanilla-100 border border-warm-100/60 p-1 rounded-xl"
              role="tablist"
              aria-label="Review request tabs"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-lg text-[15px] font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1 ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content grid */}
          <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-8 lg:items-start">
            {/* Main content */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={activeTab}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:p-6 mb-6 lg:mb-0"
            >
              {activeTab === "send_request" && <SendRequestForm onSuccess={handleSendSuccess} />}
              {activeTab === "sent_requests" && <SentRequestsList refreshKey={refreshKey} />}
            </div>

            {/* Right panel - Tips */}
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
