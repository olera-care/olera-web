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
  onConnect: () => void;
  onEdit: () => void;
}

export default function ReturningUserState({
  phone,
  intentData,
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
        className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors"
      >
        Connect
      </button>

      <div className="mt-2.5">
        <PhoneButton phone={phone} revealed onReveal={() => {}} />
      </div>
    </>
  );
}
