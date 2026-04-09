"use client";

interface OnboardingBottomNavProps {
  /** Back button config - if not provided, back button is hidden */
  back?: {
    label?: string;
    onClick: () => void;
  };
  /** Primary action button config - if not provided, primary button is hidden */
  primary?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    /** Button color variant - defaults to "primary" (green) */
    variant?: "primary" | "amber";
  };
}

/**
 * Sticky bottom navigation for onboarding flow.
 * Provides consistent placement for back and primary action buttons.
 */
export default function OnboardingBottomNav({ back, primary }: OnboardingBottomNavProps) {
  // Don't render if no buttons
  if (!back && !primary) return null;

  const primaryVariant = primary?.variant || "primary";
  const primaryClasses =
    primaryVariant === "amber"
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-primary-600 hover:bg-primary-700";

  return (
    <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Safe area padding for iOS */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-3">
        {back && (
          <button
            type="button"
            onClick={back.onClick}
            className="px-5 py-3 text-gray-700 font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 min-h-[48px]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {back.label || "Back"}
          </button>
        )}
        {primary && (
          <button
            type="button"
            onClick={primary.onClick}
            disabled={primary.loading || primary.disabled}
            className={`flex-1 px-5 py-3 ${primaryClasses} text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2`}
          >
            {primary.loading && (
              <svg
                className="w-5 h-5 animate-spin"
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
            )}
            {primary.label}
          </button>
        )}
      </div>
    </div>
  );
}
