interface WizardNavProps {
  /** 1-indexed current step */
  currentStep: number;
  totalSteps: number;
  /** If undefined, Back button is hidden */
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export default function WizardNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  nextLoading = false,
}: WizardNavProps) {
  return (
    <div className="sticky bottom-0 z-30 bg-white border-t border-gray-200">
      {/* Progress segments */}
      <div className="flex gap-0.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepIndex = i + 1;
          const filled = stepIndex <= currentStep;

          return (
            <div
              key={i}
              className={`flex-1 h-[3px] transition-colors duration-300 ${
                i === 0 ? "rounded-l-full" : ""
              } ${i === totalSteps - 1 ? "rounded-r-full" : ""} ${
                filled ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          );
        })}
      </div>

      {/* Back / Next — matches the top nav's max-w-7xl container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-[15px] font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={[
            "px-7 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200",
            "bg-primary-600 text-white hover:bg-primary-700",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            "min-h-[48px]",
            nextDisabled ? "opacity-50 cursor-not-allowed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {nextLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              {nextLabel}
            </span>
          ) : (
            nextLabel
          )}
        </button>
      </div>
    </div>
  );
}
