"use client";

import { useAuth } from "@/components/auth/AuthProvider";

interface VerifiedInfoGateProps {
  /** Content shown to verified providers */
  children: React.ReactNode;
  /** Optional fallback for unverified providers (defaults to hiding entirely) */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders content based on the provider's verification status.
 * Verified providers see the full content, unverified see the fallback (or nothing).
 */
export function VerifiedInfoGate({ children, fallback = null }: VerifiedInfoGateProps) {
  const { activeProfile } = useAuth();
  const isVerified = activeProfile?.verification_state === "verified";

  if (isVerified) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface VerifiedNameDisplayProps {
  fullName: string;
  className?: string;
}

/**
 * Displays the candidate's name - full name for verified providers, first name only for unverified.
 */
export function VerifiedNameDisplay({ fullName, className }: VerifiedNameDisplayProps) {
  const { activeProfile } = useAuth();
  const isVerified = activeProfile?.verification_state === "verified";

  const firstName = fullName?.split(" ")[0] || "Candidate";
  const displayName = isVerified ? fullName : firstName;

  return <span className={className}>{displayName}</span>;
}
