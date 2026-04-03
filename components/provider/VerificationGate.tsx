"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import type { ReactNode } from "react";

/**
 * Check if the active provider profile is pending verification.
 * Returns true when claim_state === "pending".
 */
export function useIsPendingProvider(): boolean {
  const { profiles, activeProfile } = useAuth();

  // Check activeProfile first, then fall back to any org profile
  if (activeProfile?.claim_state === "pending") return true;

  const orgProfile = (profiles || []).find(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  return orgProfile?.claim_state === "pending";
}

/**
 * Blurs children content if the provider is pending verification.
 * Prevents selection and interaction with sensitive data.
 */
export function BlurredIfPending({
  children,
  message = "Verify your identity to view this information",
}: {
  children: ReactNode;
  message?: string;
}) {
  const isPending = useIsPendingProvider();

  if (!isPending) return <>{children}</>;

  return (
    <div className="relative">
      <div
        className="blur-[6px] select-none pointer-events-none"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-sm text-gray-600 font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}
