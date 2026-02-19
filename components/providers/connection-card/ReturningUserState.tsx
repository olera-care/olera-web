"use client";

import PhoneButton from "./PhoneButton";
import {
  CARE_TYPE_LABELS,
  RECIPIENT_LABELS,
  URGENCY_LABELS,
} from "./constants";
import type { IntentData } from "./types";

interface ReturningUserStateProps {
  phone: string | null;
  intentData: IntentData;
  submitting?: boolean;
  onConnect: () => void;
  onEdit: () => void;
}

export default function ReturningUserState({
  phone,
  intentData,
  submitting,
  onConnect,
  onEdit,
}: ReturningUserStateProps) {
  const careTypeLabel = intentData.careType
    ? CARE_TYPE_LABELS[intentData.careType] || intentData.careType
    : "";
  const recipientLabel = intentData.careRecipient
    ? RECIPIENT_LABELS[intentData.careRecipient] || intentData.careRecipient
    : "";
  const urgencyLabel = intentData.urgency
    ? URGENCY_LABELS[intentData.urgency] || intentData.urgency
    : "";

  return (
    <>
      <div className="px-3.5 py-3.5 bg-gray-50 rounded-[10px] mb-3.5 border border-gray-100">
        <p className="text-sm font-semibold text-gray-800">{careTypeLabel}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {recipientLabel} &middot; {urgencyLabel}
        </p>
        <button
          onClick={onEdit}
          className="text-xs text-primary-600 font-medium mt-2 underline decoration-primary-600/25 underline-offset-2 hover:decoration-primary-600/50 transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          Edit details
        </button>
      </div>

      <button
        onClick={onConnect}
        disabled={submitting}
        className={`w-full py-3.5 border-none rounded-[10px] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 ${
          submitting
            ? "bg-primary-400 text-white/80 cursor-not-allowed"
            : "bg-primary-600 hover:bg-primary-500 text-white cursor-pointer"
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

      <div className="mt-2.5">
        <PhoneButton phone={phone} revealed onReveal={() => {}} />
      </div>
    </>
  );
}
