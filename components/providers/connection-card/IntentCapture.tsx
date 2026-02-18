"use client";

import StepIndicator from "./StepIndicator";
import Pill from "./Pill";
import {
  CARE_TYPE_LABELS,
  URGENCY_OPTIONS,
  RECIPIENT_OPTIONS,
} from "./constants";
import type {
  IntentStep,
  IntentData,
  CareRecipient,
  CareTypeValue,
  UrgencyValue,
} from "./types";

interface IntentCaptureProps {
  intentStep: IntentStep;
  intentData: IntentData;
  availableCareTypes: CareTypeValue[];
  submitting?: boolean;
  onSelectRecipient: (val: CareRecipient) => void;
  onSelectCareType: (val: CareTypeValue) => void;
  onSelectUrgency: (val: UrgencyValue) => void;
  onConnect: () => void;
}

export default function IntentCapture({
  intentStep,
  intentData,
  availableCareTypes,
  submitting,
  onSelectRecipient,
  onSelectCareType,
  onSelectUrgency,
  onConnect,
}: IntentCaptureProps) {
  const { careRecipient, careType, urgency } = intentData;

  const canConnect = urgency !== null;

  return (
    <>
      <StepIndicator current={intentStep} total={3} />

      {/* Step 0: Who needs care? */}
      {intentStep === 0 && (
        <>
          <p className="text-[15px] font-semibold text-gray-800 mb-3">
            Who needs care?
          </p>
          <div className="flex flex-col gap-1.5 mb-4">
            {RECIPIENT_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={careRecipient === opt.value}
                onClick={() => onSelectRecipient(opt.value)}
              />
            ))}
          </div>
        </>
      )}

      {/* Step 1: What type of care? */}
      {intentStep === 1 && (
        <>
          <p className="text-[15px] font-semibold text-gray-800 mb-3">
            What type of care?
          </p>
          <div className="flex flex-col gap-1.5 mb-4">
            {availableCareTypes.map((ct) => (
              <Pill
                key={ct}
                label={CARE_TYPE_LABELS[ct] || ct}
                selected={careType === ct}
                onClick={() => onSelectCareType(ct)}
              />
            ))}
          </div>
        </>
      )}

      {/* Step 2: When do you need care? */}
      {intentStep === 2 && (
        <>
          <p className="text-[15px] font-semibold text-gray-800 mb-3">
            When do you need care?
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {URGENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={urgency === opt.value}
                onClick={() => onSelectUrgency(opt.value)}
              />
            ))}
          </div>
        </>
      )}

      {/* Connect button — visible on all steps */}
      <button
        onClick={onConnect}
        disabled={!canConnect || submitting}
        className={`w-full py-3.5 border-none rounded-[10px] text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          submitting
            ? "bg-primary-400 text-white/80 cursor-not-allowed"
            : canConnect
              ? "bg-primary-600 text-white hover:bg-primary-500 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-default"
        }`}
      >
        {submitting && (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {submitting ? "Connecting..." : "Connect"}
      </button>
    </>
  );
}
