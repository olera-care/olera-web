"use client";

interface VerifiedInfoGateProps {
  /** Content to show (no longer gated - everyone is verified via email) */
  children: React.ReactNode;
  /** Deprecated - no longer used since everyone has access */
  fallback?: React.ReactNode;
}

/**
 * Previously gated content based on verification status.
 * Now always renders children since everyone who completes email verification has full access.
 * Kept for backward compatibility - can be removed in future cleanup.
 */
export function VerifiedInfoGate({ children }: VerifiedInfoGateProps) {
  return <>{children}</>;
}

interface VerifiedNameDisplayProps {
  fullName: string;
  className?: string;
}

/**
 * Displays the candidate's full name.
 * Previously showed first name only for unverified providers.
 * Now always shows full name since everyone has full access.
 */
export function VerifiedNameDisplay({ fullName, className }: VerifiedNameDisplayProps) {
  return <span className={className}>{fullName}</span>;
}
