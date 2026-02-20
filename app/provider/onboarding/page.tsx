"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

type ProviderType = "organization" | "caregiver";

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user, profiles, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    // If they already have a provider profile, redirect to hub
    const hasProviderProfile = (profiles || []).some(
      (p) => p.type === "organization" || p.type === "caregiver"
    );
    if (hasProviderProfile) {
      router.replace("/provider");
    }
  }, [user, profiles, isLoading, router]);

  const handleSelectType = (type: ProviderType) => {
    setProviderType(type);
    sessionStorage.setItem("olera_onboarding_provider_type", type);
    setStep(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-600">
            <span className="font-bold text-lg text-white">O</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Olera</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Exit
        </Link>
      </nav>

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {step === 1 && (
          <div className="w-full max-w-2xl">
            {/* Heading */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                How would you describe yourself?
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                We&apos;ll personalize your experience based on your answer.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Organization */}
              <button
                type="button"
                onClick={() => handleSelectType("organization")}
                className="group flex flex-col items-center text-center p-10 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-6 transition-colors duration-200">
                  <svg
                    className="w-10 h-10 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Assisted living, home care agency, memory care facility, and more
                </p>
              </button>

              {/* Private Caregiver */}
              <button
                type="button"
                onClick={() => handleSelectType("caregiver")}
                className="group flex flex-col items-center text-center p-10 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-6 transition-colors duration-200">
                  <svg
                    className="w-10 h-10 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Private Caregiver</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Individual caregiver offering personal care services to families
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              {providerType === "organization" ? "Great — you're an organization" : "Great — you're a private caregiver"}
            </h2>
            <p className="text-gray-500">Step 2 is coming next. Stay tuned.</p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
