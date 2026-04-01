"use client";

import { useCareProfile } from "@/lib/benefits/care-profile-context";
import {
  INTAKE_STEPS,
  CARE_PREFERENCES,
  PRIMARY_NEEDS,
  INCOME_RANGES,
  MEDICAID_STATUSES,
  VETERAN_STATUSES,
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
    case 6:
      return answers.veteranStatus
        ? VETERAN_STATUSES[answers.veteranStatus].shortTitle
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
      {/* Timeline column — thin teal line + light outline checks */}
      <div className="flex flex-col items-center pt-0.5">
        {isCompleted ? (
          <div className="w-4 h-4 rounded-full border-[1.5px] border-primary-400 flex items-center justify-center shrink-0 bg-primary-50">
            <svg
              className="w-2.5 h-2.5 text-primary-500"
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
          <div className="w-4 h-4 rounded-full border-[1.5px] border-primary-500 bg-primary-500 shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-[1.5px] border-gray-200 shrink-0" />
        )}

        {/* Connector — thin teal/gray line */}
        {!isLast && (
          <div
            className={[
              "w-[1.5px] flex-1 min-h-[6px]",
              isCompleted ? "bg-primary-200" : "bg-gray-100",
            ].join(" ")}
          />
        )}
      </div>

      {/* Content column */}
      <div
        className={[
          "flex-1 min-w-0 pb-4",
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
            "text-sm leading-5",
            isCurrent
              ? "text-gray-900 font-medium"
              : isCompleted
                ? "text-gray-900 font-medium"
                : "text-gray-400",
          ].join(" ")}
        >
          {stepInfo.title}
        </span>

        {isCompleted && summary && (
          <p className="text-xs text-gray-400 leading-tight truncate mt-0.5">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Compact summary (for results state) ────────────────────────────────────

function CompactSummary() {
  const { answers, locationDisplay, goToStep } = useCareProfile();

  const parts: string[] = [];
  if (locationDisplay || answers.stateCode) parts.push(locationDisplay || answers.stateCode || "");
  if (answers.age) parts.push(`${answers.age}yo`);
  if (answers.carePreference && answers.carePreference !== "unsure")
    parts.push(CARE_PREFERENCES[answers.carePreference].displayTitle);
  if (answers.primaryNeeds.length > 0) {
    if (answers.primaryNeeds.length === 1) {
      parts.push(PRIMARY_NEEDS[answers.primaryNeeds[0]].displayTitle);
    } else {
      parts.push(`${answers.primaryNeeds.length} care needs`);
    }
  }
  if (answers.incomeRange) parts.push(INCOME_RANGES[answers.incomeRange].displayTitle);
  if (answers.medicaidStatus) parts.push(MEDICAID_STATUSES[answers.medicaidStatus].shortTitle);

  if (parts.length === 0) return null;

  return (
    <button
      onClick={() => goToStep(0)}
      className="w-full text-left bg-transparent border-none p-0 cursor-pointer group"
    >
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
        {parts.join(" · ")}
      </p>
      <p className="text-[10px] text-gray-300 group-hover:text-primary-500 mt-0.5 transition-colors">
        Edit profile
      </p>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const STEPS: IntakeStep[] = [0, 1, 2, 3, 4, 5, 6];

export default function MilestoneProgress() {
  return (
    <nav aria-label="Care profile steps">
      {STEPS.map((s) => (
        <MilestoneRow key={s} stepIndex={s} isLast={s === 6} />
      ))}
    </nav>
  );
}
