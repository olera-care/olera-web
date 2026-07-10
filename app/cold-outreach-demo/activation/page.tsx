"use client";

import { useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useNavbar } from "@/components/shared/NavbarContext";

// ============================================================
// Mock Data — simulates a provider receiving a question notification
// ============================================================

const MOCK_PROVIDER = {
  provider_id: "demo-emerald-oaks",
  provider_name: "Emerald Oaks Senior Living",
  slug: "emerald-oaks-senior-living",
  provider_category: "Assisted Living",
  city: "Austin",
  state: "TX",
  email: "info@emeraldoaks.com",
  phone: "(512) 555-0123",
  address: "1234 Oak Valley Drive",
  zipcode: 78701,
  provider_images: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80",
  provider_description: "A warm and welcoming assisted living community providing personalized care for seniors.",
  google_rating: 4.7,
  google_reviews_data: {
    rating: 4.7,
    review_count: 42,
  },
};

const MOCK_QUESTION = {
  id: "demo-question-1",
  asker_name: "Margaret Chen",
  question: "Does your facility offer memory care services? My mother has early-stage dementia and we're looking for a place that can provide the specialized attention she needs.",
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
};

// ============================================================
// Helper Functions
// ============================================================

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #5fa3a3, #7ab8b8)",
    "linear-gradient(135deg, #417272, #5fa3a3)",
    "linear-gradient(135deg, #4d8a8a, #7ab8b8)",
    "linear-gradient(135deg, #385e5e, #5fa3a3)",
    "linear-gradient(135deg, #5fa3a3, #96c8c8)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================
// Onboarding Header
// ============================================================

function OnboardingHeader({ providerName }: { providerName: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F0]/80 backdrop-blur-sm border-b border-gray-200/40">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <Image src="/images/olera-logo.png" alt="Olera" width={28} height={28} className="object-contain" />
            <span className="text-lg font-bold text-gray-900">Olera</span>
          </Link>

          {/* Center: Provider name — desktop only */}
          <span className="hidden sm:block text-sm font-medium text-gray-500 truncate max-w-[240px]">
            {providerName}
          </span>

          {/* Back */}
          <Link
            href="/cold-outreach-demo"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-500 rounded-lg hover:text-gray-700 hover:bg-white/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Analytics Teaser Card (Demo version — matches production UI)
// ============================================================

function AnalyticsTeaserCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">This month</p>
      </div>

      <p className="text-[22px] leading-snug font-display font-semibold text-gray-900 tracking-tight">
        127 families visited your page this month.
      </p>

      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        One reached out. The rest are still deciding.
      </p>

      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 mt-4 group cursor-default">
        See your visitors
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </div>
  );
}

// ============================================================
// Profile Preview Card (Demo version)
// ============================================================

function ProfilePreviewCard({
  answered,
  askerName,
  questionText,
  answerPreview,
}: {
  answered?: boolean;
  askerName?: string;
  questionText?: string;
  answerPreview?: string;
}) {
  const primaryImage = MOCK_PROVIDER.provider_images;
  const location = `${MOCK_PROVIDER.city}, ${MOCK_PROVIDER.state}`;

  // Provider identity row
  const providerIdentity = (
    <div className="flex items-center gap-4">
      <Image src={primaryImage} alt={MOCK_PROVIDER.provider_name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-display font-semibold text-gray-900 truncate">{MOCK_PROVIDER.provider_name}</h3>
        <p className="text-sm text-gray-500 truncate">{MOCK_PROVIDER.provider_category} · {location}</p>
      </div>
    </div>
  );

  // Post-response state
  if (answered && askerName && questionText && answerPreview) {
    return (
      <div style={{ animation: "card-enter 0.3s ease-out both" }}>
        <AnalyticsTeaserCard />
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {providerIdentity}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
            <span className="text-primary-600 font-medium">1 question answered</span>
            <span>·</span>
            <span>{MOCK_PROVIDER.google_rating}★ · {MOCK_PROVIDER.google_reviews_data.review_count} reviews</span>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 mt-0.5" style={{ background: avatarGradient(askerName) }}>
                {getInitials(askerName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-snug">
                  &ldquo;{questionText.length > 80 ? questionText.substring(0, 77).trimEnd() + "..." : questionText}&rdquo;
                </p>
                <div className="mt-1.5 flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-gray-500 leading-snug">{answerPreview}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-response state
  return (
    <div style={{ animation: "card-enter 0.3s ease-out both", animationDelay: "200ms" }}>
      <AnalyticsTeaserCard />
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {providerIdentity}
      </div>
    </div>
  );
}

// ============================================================
// Inline Question Response (Demo version with activation CTA)
// ============================================================

function InlineQuestionResponse({
  askerName,
  onSubmitted,
}: {
  askerName: string;
  onSubmitted: (text: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showActivation, setShowActivation] = useState(false);

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    setSubmitted(true);
    onSubmitted(trimmed);
    setIsSubmitting(false);

    // After brief "Response sent" confirmation, show activation CTA
    setTimeout(() => {
      setShowActivation(true);
    }, 1200);
  };

  // Activation state — prompt to complete profile
  if (showActivation) {
    return (
      <div style={{ animation: "card-enter 0.3s ease-out both" }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-900">
            Response sent to {askerName}
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100 p-5">
          <h4 className="text-[15px] font-semibold text-gray-900 mb-1.5">
            Let your profile answer families' questions upfront
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Add photos, services, and details so families can learn about your community before reaching out. Let your profile do the talking.
          </p>
          <Link
            href="/cold-outreach-demo/profile-setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
          >
            Let's do it
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Success state — brief confirmation before activation
  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 pb-2" style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-gray-900">
          Response sent to {askerName}
        </p>
      </div>
    );
  }

  // Response form
  return (
    <div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your response..."
        rows={3}
        maxLength={2000}
        className="w-full px-4 py-3 text-[15px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 transition-all"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          {answer.length > 0 ? `${answer.length}/2,000` : ""}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? "Sending..." : "Send Response"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function ActivationPage() {
  const { setForceHidden } = useNavbar();
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState("");

  // Hide main navbar — this page has its own header (matches production SmartDashboardShell)
  useLayoutEffect(() => {
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [setForceHidden]);

  const timeAgo = formatTimeAgo(MOCK_QUESTION.created_at);
  const answerPreview = submittedAnswer.length > 120
    ? submittedAnswer.substring(0, 117).trimEnd() + "..."
    : submittedAnswer;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14">
      <OnboardingHeader providerName={MOCK_PROVIDER.provider_name} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        {/* Question Card */}
        <div
          className="relative z-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 transition-all duration-300"
          style={{ animation: "card-enter 0.25s ease-out both" }}
        >
          {/* Header + Question — dissolves after response */}
          {!questionAnswered && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <Image src="/images/olera-chat.png" alt="" width={48} height={48} className="w-12 h-12 shrink-0" />
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-900">
                    Someone has a question about your services
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{timeAgo}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0" style={{ background: avatarGradient(MOCK_QUESTION.asker_name) }}>
                    {getInitials(MOCK_QUESTION.asker_name)}
                  </div>
                  <p className="text-[15px] font-semibold text-gray-900">{MOCK_QUESTION.asker_name}</p>
                </div>
                <p className="text-[15px] text-gray-500 mt-3 leading-relaxed italic">
                  &ldquo;{MOCK_QUESTION.question}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Inline response form */}
          <InlineQuestionResponse
            askerName={MOCK_QUESTION.asker_name}
            onSubmitted={(text) => {
              setQuestionAnswered(true);
              setSubmittedAnswer(text);
            }}
          />
        </div>

        {/* Profile preview — adapts to pre/post response state */}
        <div className="mt-6">
          <ProfilePreviewCard
            answered={questionAnswered}
            askerName={questionAnswered ? MOCK_QUESTION.asker_name : undefined}
            questionText={questionAnswered ? MOCK_QUESTION.question : undefined}
            answerPreview={questionAnswered ? answerPreview : undefined}
          />
        </div>

        {/* Demo notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">This is a demo</p>
              <p className="text-sm text-amber-700 mt-0.5">
                This page demonstrates the activation flow when a provider receives a question via email and clicks through to respond. In production, this flow uses magic link authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
