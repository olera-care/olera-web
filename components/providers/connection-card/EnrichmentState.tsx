"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Pill from "./Pill";
import { URGENCY_OPTIONS, RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient, UrgencyValue } from "./types";
import {
  getPricingForProviderSync,
  formatPricingRange,
  getFundingOptions,
} from "@/lib/pricing-ranges";

type NotifyChannel = "text" | "whatsapp" | "email";
type EnrichmentStep = "notify" | "recipient" | "urgency";

interface EnrichmentStateProps {
  providerName: string;
  onSave: (data: {
    phone: string;
    notifyChannel: NotifyChannel;
    careRecipient?: CareRecipient;
    urgency?: UrgencyValue;
  }) => void;
  onSkip: () => void;
  saving?: boolean;
  careTypes?: string[];
  priceRange?: string | null;
}

const NOTIFY_OPTIONS: { label: string; value: NotifyChannel }[] = [
  { label: "Text me", value: "text" },
  { label: "WhatsApp me", value: "whatsapp" },
  { label: "Email is fine", value: "email" },
];

export default function EnrichmentState({
  providerName,
  onSave,
  onSkip,
  saving,
  careTypes = [],
  priceRange = null,
}: EnrichmentStateProps) {
  const [step, setStep] = useState<EnrichmentStep>("notify");
  const [notifyChannel, setNotifyChannel] = useState<NotifyChannel | null>(null);
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [urgency, setUrgency] = useState<UrgencyValue | null>(null);
  const [showFunding, setShowFunding] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const needsPhone = notifyChannel === "text" || notifyChannel === "whatsapp";

  // Auto-focus phone input when a phone-requiring channel is selected
  useEffect(() => {
    if (needsPhone && step === "notify") {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [needsPhone, step]);

  // Resolve pricing from care types
  const pricing = getPricingForProviderSync(careTypes);
  const displayRange = priceRange || (pricing.range ? formatPricingRange(pricing.range) : null);
  const fundingOptions = getFundingOptions();

  // Step 1: notify channel is complete when channel selected + phone if needed
  const notifyComplete = notifyChannel === "email" || (needsPhone && phone.trim());

  // Advance from notify → recipient
  const advanceFromNotify = useCallback(() => {
    if (notifyComplete) setStep("recipient");
  }, [notifyComplete]);

  // Recipient tap → auto-advance to urgency
  const selectRecipient = useCallback((val: CareRecipient) => {
    setRecipient(val);
    setTimeout(() => setStep("urgency"), 200);
  }, []);

  // Urgency tap → save everything
  const selectUrgency = useCallback((val: UrgencyValue) => {
    setUrgency(val);
    // Small delay for visual feedback, then save
    setTimeout(() => {
      onSave({
        phone: (notifyChannel === "text" || notifyChannel === "whatsapp") ? phone.trim() : "",
        notifyChannel: notifyChannel || "email",
        careRecipient: recipient || undefined,
        urgency: val,
      });
    }, 200);
  }, [notifyChannel, phone, recipient, onSave]);

  // Skip from any step — save whatever we have
  const handleSkip = useCallback(() => {
    if (step === "notify" && !notifyChannel) {
      // Nothing collected yet — true skip
      onSkip();
    } else {
      // Save partial data
      onSave({
        phone: needsPhone ? phone.trim() : "",
        notifyChannel: notifyChannel || "email",
        careRecipient: recipient || undefined,
        urgency: urgency || undefined,
      });
    }
  }, [step, notifyChannel, needsPhone, phone, recipient, urgency, onSave, onSkip]);

  return (
    <div>
      {/* Success header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-gray-900">
          Sent to {providerName}
        </p>
      </div>

      {/* ── Pricing section (only on step 1) ── */}
      {step === "notify" && (
        <>
          {displayRange && !pricing.isHospice && (
            <div className="bg-gray-50 rounded-xl px-3.5 py-3 mb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Typical range
              </p>
              <p className="text-[18px] font-bold text-gray-900">
                {displayRange}
              </p>
              {pricing.range?.description && (
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                  {pricing.range.description}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                Actual costs vary based on care level and services needed.
              </p>
            </div>
          )}

          {pricing.isHospice && (
            <div className="bg-gray-50 rounded-xl px-3.5 py-3 mb-3">
              <p className="text-[13px] text-gray-600">
                Hospice care is typically covered by Medicare, Medicaid, or private insurance at no cost to the family.
              </p>
            </div>
          )}

          {/* Funding options */}
          {displayRange && !pricing.isHospice && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowFunding(!showFunding)}
                className="text-[13px] text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Ways to pay {showFunding ? "↑" : "→"}
              </button>
              {showFunding && (
                <div className="mt-2 space-y-1.5">
                  {fundingOptions.map((opt) => (
                    <div key={opt.label} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5 shrink-0">·</span>
                      <div>
                        <span className="text-[12px] font-medium text-gray-700">{opt.label}</span>
                        {opt.monthlySavings && (
                          <span className="text-[11px] text-gray-400 ml-1">
                            (saves ${opt.monthlySavings.low.toLocaleString()}–${opt.monthlySavings.high.toLocaleString()}/mo)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <a
                    href="/benefits/finder"
                    className="text-[12px] text-gray-500 font-medium hover:text-gray-700 hover:underline mt-1 inline-block"
                  >
                    Check your eligibility →
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 my-4" />
        </>
      )}

      {/* ── Step 1: Notification channel ── */}
      {step === "notify" && (
        <>
          <p className="text-[13px] font-medium text-gray-700 mb-2">
            How should we let you know when they respond?
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {NOTIFY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={notifyChannel === opt.value}
                onClick={() => setNotifyChannel(opt.value)}
                small
              />
            ))}
          </div>

          {needsPhone && (
            <input
              ref={phoneInputRef}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-150 mb-3"
            />
          )}

          <button
            onClick={notifyComplete ? advanceFromNotify : onSkip}
            disabled={saving}
            className={`w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-150 ${
              notifyComplete
                ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            {notifyComplete ? "Next" : "Skip for now"}
          </button>

          {notifyComplete && (
            <button
              onClick={handleSkip}
              className="w-full mt-2.5 text-[13px] text-gray-400 hover:text-gray-600 font-normal cursor-pointer bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          )}
        </>
      )}

      {/* ── Step 2: Who needs care? ── */}
      {step === "recipient" && (
        <>
          <p className="text-[13px] font-medium text-gray-700 mb-3">
            Who needs care?
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {RECIPIENT_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={recipient === opt.value}
                onClick={() => selectRecipient(opt.value as CareRecipient)}
                small
              />
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="w-full mt-1 text-[13px] text-gray-400 hover:text-gray-600 font-normal cursor-pointer bg-transparent border-none transition-colors"
          >
            Skip
          </button>
        </>
      )}

      {/* ── Step 3: How soon? ── */}
      {step === "urgency" && (
        <>
          <p className="text-[13px] font-medium text-gray-700 mb-3">
            How soon do you need care?
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {URGENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={urgency === opt.value}
                onClick={() => selectUrgency(opt.value as UrgencyValue)}
                small
              />
            ))}
          </div>

          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full mt-1 text-[13px] text-gray-400 hover:text-gray-600 font-normal cursor-pointer bg-transparent border-none transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Skip"}
          </button>
        </>
      )}
    </div>
  );
}
