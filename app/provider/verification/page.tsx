"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import {
  computeVerificationStatus,
  TIER_LABELS,
  type VerificationStep,
  type VerificationTier,
} from "@/lib/verification-tiers";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ShieldCheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// Benefit icons
function ShieldSmallIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function SparkleIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function TrendingUpIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tier Progress Card
// ---------------------------------------------------------------------------

function TierProgressCard({
  currentTier,
  tier2Progress,
}: {
  currentTier: VerificationTier;
  tier2Progress: number;
}) {
  const tier1Complete = currentTier >= 1;
  const tier2Complete = currentTier >= 2;

  const subtitles: Record<VerificationTier, string> = {
    1: "Your email is verified and your profile is claimed.",
    2: "Your profile is complete. You\u2019re ready for families to find you.",
    3: "Your identity has been fully verified.",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
          <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[15px] font-semibold text-gray-900">
            Level {currentTier}: {TIER_LABELS[currentTier]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {subtitles[currentTier]}
          </p>
        </div>
      </div>

      {/* 3-segment progress bar */}
      <div className="flex gap-1.5 mb-2.5">
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-700"
            style={{ width: tier1Complete ? "100%" : "50%" }}
          />
        </div>
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-700"
            style={{ width: tier2Complete ? "100%" : `${Math.round(tier2Progress * 100)}%` }}
          />
        </div>
        <div className="flex-1 h-2 rounded-full bg-gray-100" />
      </div>

      {/* Tier labels */}
      <div className="flex">
        {([1, 2, 3] as VerificationTier[]).map((tier) => (
          <span
            key={tier}
            className={`flex-1 text-[11px] ${
              tier === 1 ? "text-left" : tier === 2 ? "text-center" : "text-right"
            } ${
              tier <= currentTier
                ? "text-primary-600 font-medium"
                : "text-gray-400"
            }`}
          >
            {TIER_LABELS[tier]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Row
// ---------------------------------------------------------------------------

function StepRow({ step }: { step: VerificationStep }) {
  if (step.comingSoon) {
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400">{step.label}</p>
          <p className="text-xs text-gray-300 mt-0.5">{step.description}</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          Soon
        </span>
      </div>
    );
  }

  if (step.completed) {
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckIcon className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{step.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 shrink-0">
          Done
        </span>
      </div>
    );
  }

  // Actionable
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{step.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
      </div>
      {step.href && (
        <Link
          href={step.href}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0"
        >
          Complete &rarr;
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier Step Group
// ---------------------------------------------------------------------------

function TierStepGroup({
  tier,
  label,
  steps,
  comingSoon,
  compact,
}: {
  tier: VerificationTier;
  label: string;
  steps: VerificationStep[];
  comingSoon?: boolean;
  compact?: boolean;
}) {
  const allComplete = steps.every((s) => s.completed);

  return (
    <div className={compact ? "mb-6" : "mb-8"}>
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-[15px] font-semibold text-gray-900">
          {label}
        </h2>
        {comingSoon ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            Coming soon
          </span>
        ) : allComplete ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
            <CheckIcon className="w-3 h-3" />
            Complete
          </span>
        ) : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Benefits Section
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    icon: <ShieldSmallIcon className="w-[18px] h-[18px] text-primary-600" />,
    title: "Build trust",
    desc: "Families are more likely to reach out to verified providers.",
  },
  {
    icon: <SparkleIcon className="w-[18px] h-[18px] text-primary-600" />,
    title: "Stand out",
    desc: "Verification badges help your listing stand out in search.",
  },
  {
    icon: <TrendingUpIcon className="w-[18px] h-[18px] text-primary-600" />,
    title: "More inquiries",
    desc: "Verified providers receive more connection requests.",
  },
];

function BenefitsSection() {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h2 className="text-[15px] font-semibold text-gray-900 mb-5">
        Why verification matters
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
              {b.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{b.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {b.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function VerificationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="animate-pulse">
        <div className="h-6 w-44 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-8" />

        <div className="max-w-3xl">
          {/* Progress card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-gray-100 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
                <div className="h-3.5 w-64 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex gap-1.5 mb-2.5">
              <div className="flex-1 h-2 bg-gray-100 rounded-full" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full" />
            </div>
            <div className="flex">
              <div className="flex-1 h-3 w-16 bg-gray-100 rounded" />
              <div className="flex-1 flex justify-center"><div className="h-3 w-24 bg-gray-100 rounded" /></div>
              <div className="flex-1 flex justify-end"><div className="h-3 w-14 bg-gray-100 rounded" /></div>
            </div>
          </div>

          {/* Step groups: Tier 1 (compact), Tier 2, Tier 3 */}
          {[2, 5, 2].map((count, i) => (
            <div key={i} className={i === 0 ? "mb-6" : "mb-8"}>
              <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                {Array.from({ length: count }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3.5 w-28 bg-gray-200 rounded mb-1.5" />
                      <div className="h-3 w-52 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Benefits skeleton */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="h-4 w-40 bg-gray-200 rounded mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg border border-gray-100" />
                  <div className="flex-1">
                    <div className="h-3.5 w-20 bg-gray-200 rounded mb-1.5" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProviderVerificationPage() {
  const profile = useProviderProfile();
  const { user } = useAuth();

  if (!profile) return <VerificationSkeleton />;

  const status = computeVerificationStatus(profile, !!user?.email_confirmed_at);

  const tier1Steps = status.steps.filter((s) => s.tier === 1);
  const tier2Steps = status.steps.filter((s) => s.tier === 2);
  const tier3Steps = status.steps.filter((s) => s.tier === 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">
          Identity Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Build trust with families by completing your verification.
        </p>
      </div>

      <div className="max-w-3xl">
        <TierProgressCard
          currentTier={status.currentTier}
          tier2Progress={status.tier2Progress}
        />

        {/* Section label */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-5">
          Verification steps
        </p>

        {/* Tier 1 — compact since always auto-complete */}
        <TierStepGroup tier={1} label="Confirmed" steps={tier1Steps} compact />

        {/* Tier 2 — the primary actionable section */}
        <TierStepGroup tier={2} label="Profile Complete" steps={tier2Steps} />

        {/* Tier 3 — coming soon */}
        <TierStepGroup tier={3} label="Verified" steps={tier3Steps} comingSoon />

        <BenefitsSection />
      </div>
    </div>
  );
}
