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
    <div className="flex gap-3.5 group">
      {/* Timeline column */}
      <div className="flex flex-col items-center pt-1">
        {/* Dot / check */}
        {isCompleted ? (
          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        ) : isCurrent ? (
          <div className="w-5 h-5 rounded-full bg-gray-900 shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-[1.5px] border-gray-300 shrink-0" />
        )}

        {/* Connector */}
        {!isLast && (
          <div
            className={[
              "w-px flex-1 min-h-[8px]",
              isCompleted ? "bg-gray-300" : "bg-gray-200",
            ].join(" ")}
          />
        )}
      </div>

      {/* Content column */}
      <div
        className={[
          "flex-1 min-w-0 pb-5",
          isClickable ? "cursor-pointer" : "",
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
        <span
          className={[
            "text-text-sm leading-5",
            isCurrent
              ? "text-gray-900 font-medium"
              : isCompleted
                ? "text-gray-900 font-medium"
                : "text-gray-400",
          ].join(" ")}
        >
          {stepInfo.title}
        </span>

        {/* Answer summary for completed steps */}
        {isCompleted && summary && (
          <p className="text-text-xs text-gray-400 leading-tight truncate mt-0.5">
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
