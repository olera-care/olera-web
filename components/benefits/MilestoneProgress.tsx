"use client";

import { useCareProfile } from "@/lib/benefits/care-profile-context";
import {
  INTAKE_STEPS,
  CARE_PREFERENCES,
  PRIMARY_NEEDS,
  INCOME_RANGES,
  MEDICAID_STATUSES,
} from "@/lib/types/benefits";
import type { IntakeStep } from "@/lib/types/benefits";

// ─── Step Icons ─────────────────────────────────────────────────────────────

const STEP_ICONS: Record<IntakeStep, React.ReactNode> = {
  0: (
    // Map pin
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  1: (
    // Person
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  2: (
    // House
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  3: (
    // Heart
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  4: (
    // Dollar
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  5: (
    // Shield
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStepSummary(
  stepIndex: IntakeStep,
  answers: ReturnType<typeof useCareProfile>["answers"],
  locationDisplay: string
): string | null {
  switch (stepIndex) {
    case 0:
      return locationDisplay || answers.stateCode || null;
    case 1:
      return answers.age ? `${answers.age} years old` : null;
    case 2:
      return answers.carePreference
        ? CARE_PREFERENCES[answers.carePreference].displayTitle
        : null;
    case 3:
      if (answers.primaryNeeds.length === 0) return null;
      if (answers.primaryNeeds.length <= 2) {
        return answers.primaryNeeds
          .map((n) => PRIMARY_NEEDS[n].displayTitle)
          .join(", ");
      }
      return `${PRIMARY_NEEDS[answers.primaryNeeds[0]].displayTitle} +${answers.primaryNeeds.length - 1} more`;
    case 4:
      return answers.incomeRange
        ? INCOME_RANGES[answers.incomeRange].displayTitle
        : null;
    case 5:
      return answers.medicaidStatus
        ? MEDICAID_STATUSES[answers.medicaidStatus].shortTitle
        : null;
    default:
      return null;
  }
}

// ─── Milestone Row ──────────────────────────────────────────────────────────

function MilestoneRow({
  stepIndex,
  isLast,
}: {
  stepIndex: IntakeStep;
  isLast: boolean;
}) {
  const { step: currentStep, goToStep, pageState, answers, locationDisplay } =
    useCareProfile();

  const summary = getStepSummary(stepIndex, answers, locationDisplay);
  const stepInfo = INTAKE_STEPS[stepIndex];

  const isCurrent = currentStep === stepIndex && pageState === "intake";
  const isCompleted =
    summary !== null && (stepIndex < currentStep || pageState !== "intake");
  const isClickable = isCompleted || isCurrent;

  function handleClick() {
    if (isClickable) goToStep(stepIndex);
  }

  return (
    <div className="flex gap-3 group">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Milestone circle */}
        <div
          className={[
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
            isCurrent
              ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
              : isCompleted
                ? "bg-primary-50 text-primary-600 ring-1 ring-primary-200"
                : "bg-gray-100 text-gray-400",
          ].join(" ")}
        >
          {isCompleted ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            STEP_ICONS[stepIndex]
          )}
        </div>

        {/* Connector line */}
        {!isLast && (
          <div
            className={[
              "w-px flex-1 min-h-[12px] transition-colors duration-200",
              isCompleted ? "bg-primary-200" : "bg-gray-200",
            ].join(" ")}
          />
        )}
      </div>

      {/* Content column */}
      <div
        className={[
          "flex-1 min-w-0 pb-4",
          isClickable
            ? "cursor-pointer group-hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors duration-150"
            : "",
        ].join(" ")}
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable ? `${isCompleted ? "Edit" : "Go to"} ${stepInfo.title}` : undefined}
        aria-current={isCurrent ? "step" : undefined}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && isClickable) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center justify-between gap-2 min-h-[32px]">
          <div className="flex items-center gap-1.5">
            <span
              className={[
                "text-sm font-medium leading-8",
                isCurrent
                  ? "text-primary-700 font-semibold"
                  : isCompleted
                    ? "text-gray-900"
                    : "text-gray-400",
              ].join(" ")}
            >
              {stepInfo.title}
            </span>
            {isCurrent && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-700">
                now
              </span>
            )}
          </div>

          {/* Edit pencil for completed steps */}
          {isCompleted && (
            <svg
              className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
            </svg>
          )}
        </div>

        {/* Answer summary for completed steps */}
        {isCompleted && summary && (
          <p className="text-xs text-gray-500 leading-tight truncate -mt-1">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const STEPS: IntakeStep[] = [0, 1, 2, 3, 4, 5];

export default function MilestoneProgress() {
  return (
    <nav aria-label="Care profile steps">
      {STEPS.map((s) => (
        <MilestoneRow key={s} stepIndex={s} isLast={s === 5} />
      ))}
    </nav>
  );
}
