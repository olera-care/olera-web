"use client";

import { useState, useCallback } from "react";
import Pill from "./Pill";
import { URGENCY_OPTIONS, RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient, UrgencyValue } from "./types";

interface EnrichmentStateProps {
  providerName: string;
  onSave: (data: { careRecipient: CareRecipient; urgency: UrgencyValue }) => void;
  onSkip: () => void;
  saving?: boolean;
}

export default function EnrichmentState({
  providerName,
  onSave,
  onSkip,
  saving,
}: EnrichmentStateProps) {
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [urgency, setUrgency] = useState<UrgencyValue | null>(null);

  const canSave = recipient && urgency && !saving;

  const handleSave = useCallback(() => {
    if (recipient && urgency) {
      onSave({ careRecipient: recipient, urgency });
    }
  }, [recipient, urgency, onSave]);

  return (
    <div>
      {/* Success header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-gray-900">
          Inquiry sent to {providerName}
        </p>
      </div>

      {/* Enrichment prompt */}
      <p className="text-[13px] text-gray-500 mb-3">
        Help them prepare for your conversation:
      </p>

      {/* Who needs care? */}
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        Who needs care?
      </p>
      <div className="flex flex-col gap-1.5 mb-3">
        {RECIPIENT_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            selected={recipient === opt.value}
            onClick={() => setRecipient(opt.value as CareRecipient)}
          />
        ))}
      </div>

      {/* When? */}
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        When do you need care?
      </p>
      <div className="flex flex-col gap-1.5 mb-4">
        {URGENCY_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            selected={urgency === opt.value}
            onClick={() => setUrgency(opt.value as UrgencyValue)}
          />
        ))}
      </div>

      {/* Save / Skip */}
      <button
        onClick={canSave ? handleSave : onSkip}
        className={`w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-150 ${
          canSave
            ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {saving ? "Saving..." : canSave ? "Save preferences" : "Skip for now"}
      </button>
    </div>
  );
}
