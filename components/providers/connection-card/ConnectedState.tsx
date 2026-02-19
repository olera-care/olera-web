"use client";

import Link from "next/link";
import PhoneButton from "./PhoneButton";
import {
  CARE_TYPE_LABELS,
  RECIPIENT_LABELS,
  URGENCY_LABELS,
} from "./constants";
import type { IntentData } from "./types";

interface ConnectedStateProps {
  phone: string | null;
  intentData: IntentData | null;
  connectionId: string | null;
}

export default function ConnectedState({
  phone,
  intentData,
  connectionId,
}: ConnectedStateProps) {
  const inboxHref = connectionId
    ? `/portal/inbox?id=${connectionId}`
    : "/portal/inbox";

  const careTypeLabel = intentData?.careType
    ? CARE_TYPE_LABELS[intentData.careType] || intentData.careType
    : "";
  const recipientLabel = intentData?.careRecipient
    ? RECIPIENT_LABELS[intentData.careRecipient] || intentData.careRecipient
    : "";
  const urgencyLabel = intentData?.urgency
    ? URGENCY_LABELS[intentData.urgency] || intentData.urgency
    : "";

  const hasIntent = careTypeLabel || recipientLabel || urgencyLabel;

  return (
    <>
      {/* Intent preview */}
      {hasIntent && (
        <div className="px-3.5 py-3.5 bg-gray-50 rounded-[10px] mb-3.5 border border-gray-100">
          {careTypeLabel && (
            <p className="text-sm font-semibold text-gray-800">
              {careTypeLabel}
            </p>
          )}
          {(recipientLabel || urgencyLabel) && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {[recipientLabel, urgencyLabel].filter(Boolean).join(" · ")}
            </p>
          )}
          <Link
            href={inboxHref}
            className="text-xs text-primary-600 font-medium mt-2 inline-block underline decoration-primary-600/25 underline-offset-2 hover:decoration-primary-600/50 transition-colors"
          >
            Edit details
          </Link>
        </div>
      )}

      {/* Phone — fully revealed */}
      <PhoneButton phone={phone} revealed onReveal={() => {}} />

      {/* Message CTA */}
      <Link
        href={inboxHref}
        className="block w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-500 rounded-[10px] text-[15px] font-semibold text-white text-center transition-colors"
      >
        Message
      </Link>
    </>
  );
}
