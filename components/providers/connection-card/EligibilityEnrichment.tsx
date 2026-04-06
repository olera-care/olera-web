"use client";

import { useState, useCallback } from "react";
import Pill from "./Pill";
import { URGENCY_OPTIONS, RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient, UrgencyValue } from "./types";
import {
  getPricingForProviderSync,
  formatPricingRange,
  getFundingOptions,
} from "@/lib/pricing-ranges";

interface EligibilityEnrichmentProps {
  providerName: string;
  onSave: (data: {
    phone: string;
    notifyChannel: "email";
    careRecipient?: CareRecipient;
    urgency?: UrgencyValue;
  }) => void;
  onSkip: () => void;
  saving?: boolean;
  careTypes?: string[];
  priceRange?: string | null;
}

/**
 * Eligibility-framed post-submit flow.
 *
 * Same data as the pricing enrichment, but framed as an eligibility assessment:
 * - "Based on [care type], here's what funding you may qualify for"
 * - Asks who needs care + urgency (framed as "assessment" questions)
 * - Shows funding options front-and-center (not collapsed)
 *
 * Reuses pricing-ranges.ts data — no new data sources needed.
 */
export default function EligibilityEnrichment({
  providerName,
  onSave,
  onSkip,
  saving,
  careTypes = [],
  priceRange = null,
}: EligibilityEnrichmentProps) {
  const [step, setStep] = useState<"results" | "recipient" | "urgency">("results");
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);

  const pricing = getPricingForProviderSync(careTypes);
  const displayRange = priceRange || (pricing.range ? formatPricingRange(pricing.range) : null);
  const fundingOptions = getFundingOptions();
  const careLabel = pricing.careTypeLabel || (careTypes.length > 0 ? careTypes[0] : "this type of care");

  const selectRecipient = useCallback((val: CareRecipient) => {
    setRecipient(val);
    setStep("urgency");
  }, []);

  const selectUrgency = useCallback((val: UrgencyValue) => {
    onSave({
      phone: "",
      notifyChannel: "email",
      careRecipient: recipient || undefined,
      urgency: val,
    });
  }, [recipient, onSave]);

  const handleSkip = useCallback(() => {
    if (step === "results") {
      setStep("recipient");
    } else {
      onSave({
        phone: "",
        notifyChannel: "email",
        careRecipient: recipient || undefined,
      });
    }
  }, [step, recipient, onSave]);

  return (
    <div>
      {/* ── Step 1: Eligibility results ── */}
      {step === "results" && (
        <>
          {/* Success header — eligibility framing */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-gray-900">
              Assessment sent to {providerName}
            </p>
          </div>

          {/* Eligibility result card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5 mb-3">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Preliminary eligibility
            </p>
            {pricing.medicareCoverage === "full" ? (
              <>
                <p className="text-[15px] font-bold text-gray-900">
                  Likely covered by Medicare/Medicaid
                </p>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                  {careLabel} is typically covered at no cost through Medicare or Medicaid. {providerName} will confirm your specific eligibility.
                </p>
              </>
            ) : pricing.medicareCoverage === "partial" ? (
              <>
                <p className="text-[15px] font-bold text-gray-900">
                  Partial coverage likely available
                </p>
                {displayRange && (
                  <p className="text-[13px] text-gray-700 mt-1">
                    Typical out-of-pocket: {displayRange}
                  </p>
                )}
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                  Medicare covers some {careLabel} costs. Additional funding options may reduce your share.
                </p>
              </>
            ) : pricing.isHospice ? (
              <>
                <p className="text-[15px] font-bold text-gray-900">
                  Typically fully covered
                </p>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                  Hospice care is covered by Medicare, Medicaid, or private insurance at no cost to families in most cases.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold text-gray-900">
                  Multiple funding options available
                </p>
                {displayRange && (
                  <p className="text-[13px] text-gray-700 mt-1">
                    Typical cost: {displayRange}
                  </p>
                )}
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                  You may qualify for programs that significantly reduce or cover the cost of {careLabel}.
                </p>
              </>
            )}
          </div>

          {/* Funding options — shown expanded (not collapsed like pricing variant) */}
          {!pricing.isHospice && fundingOptions.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Programs you may qualify for
              </p>
              <div className="space-y-2">
                {fundingOptions.map((opt) => (
                  <div key={opt.label} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
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
              </div>
              <a
                href="/benefits/finder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-emerald-600 font-medium hover:text-emerald-700 hover:underline mt-2 inline-block"
              >
                Full eligibility check →
              </a>
            </div>
          )}

          <button
            onClick={() => setStep("recipient")}
            className="w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-150 bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
          >
            Continue assessment
          </button>
          <button
            onClick={onSkip}
            className="w-full mt-2.5 text-[13px] text-gray-400 hover:text-gray-600 font-normal cursor-pointer bg-transparent border-none transition-colors"
          >
            Done for now
          </button>
        </>
      )}

      {/* ── Step 2: Who needs care? ── */}
      {step === "recipient" && (
        <>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">
            Help us assess your needs
          </p>
          <p className="text-[13px] text-gray-500 mb-3">
            Who is this care for?
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

      {/* ── Step 3: Timeline ── */}
      {step === "urgency" && (
        <>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">
            Almost done
          </p>
          <p className="text-[13px] text-gray-500 mb-3">
            When do you need care to start?
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {URGENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={false}
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
