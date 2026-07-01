"use client";

export type VerificationStatus = "idle" | "verifying" | "valid" | "risky" | "invalid" | "unknown";

interface EmailVerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

/**
 * Badge showing email verification status.
 * - idle: nothing shown
 * - verifying: spinner + "Verifying..."
 * - valid: ✓ Valid email (green)
 * - risky: ⚠️ Catch-all (amber)
 * - invalid: ✗ Will bounce (red)
 * - unknown: ? Could not verify (gray)
 */
export default function EmailVerificationBadge({
  status,
  className = "",
}: EmailVerificationBadgeProps) {
  if (status === "idle") return null;

  const config: Record<
    Exclude<VerificationStatus, "idle">,
    { icon: React.ReactNode; text: string; classes: string }
  > = {
    verifying: {
      icon: (
        <svg
          className="w-3 h-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      text: "Verifying...",
      classes: "text-gray-500",
    },
    valid: {
      icon: <span>✓</span>,
      text: "Valid email",
      classes: "text-emerald-600",
    },
    risky: {
      icon: <span>⚠️</span>,
      text: "Catch-all",
      classes: "text-amber-600",
    },
    invalid: {
      icon: <span>✗</span>,
      text: "Will bounce",
      classes: "text-red-600",
    },
    unknown: {
      icon: <span>?</span>,
      text: "Could not verify",
      classes: "text-gray-400",
    },
  };

  // invalid / risky: an operator may legitimately override these (they've
  // confirmed the address by phone or off the provider's site). Show a compact,
  // calm amber flag with the "why + what to do" tucked into a hover tooltip —
  // rather than a scary red verdict and a wall of inline text.
  const guidance: Partial<Record<VerificationStatus, { label: string; tip: string }>> = {
    invalid: {
      label: "May bounce",
      tip: "An automated check thinks this address would bounce. If you've confirmed it with the provider, save anyway — we'll trust it from here.",
    },
    risky: {
      label: "Catch-all",
      tip: "This domain accepts all mail, so we can't confirm a real inbox. Use a named address if you can — or save anyway if you've confirmed it.",
    },
  };

  if (status === "invalid" || status === "risky") {
    const g = guidance[status]!;
    return (
      <span
        className={`relative inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 ${className}`}
      >
        <span aria-hidden>⚠</span>
        {g.label}
        {/* Tooltip only shows on hover of the (i) icon */}
        <span className="group relative cursor-help">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">i</span>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-10 mb-1.5 w-56 rounded-lg bg-gray-900 px-2.5 py-2 text-xs font-normal leading-snug text-gray-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            {g.tip}
          </span>
        </span>
      </span>
    );
  }

  const { icon, text, classes } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${classes} ${className}`}
    >
      {icon} {text}
    </span>
  );
}
