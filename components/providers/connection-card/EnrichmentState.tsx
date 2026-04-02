"use client";

import { useState, useCallback, useEffect } from "react";
import Pill from "./Pill";
import { URGENCY_OPTIONS, RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient, UrgencyValue } from "./types";
import {
  getPricingForProviderSync,
  formatPricingRange,
  getFundingOptions,
  type PricingRange,
} from "@/lib/pricing-ranges";

interface EnrichmentStateProps {
  providerName: string;
  onSave: (data: {
    careRecipient?: CareRecipient;
    urgency?: UrgencyValue;
    firstName: string;
  }) => void;
  onSkip: () => void;
  saving?: boolean;
  initialRecipient?: CareRecipient | null;
  initialUrgency?: UrgencyValue | null;
  careTypes?: string[];
  priceRange?: string | null;
}

export default function EnrichmentState({
  providerName,
  onSave,
  onSkip,
  saving,
  initialRecipient = null,
  initialUrgency = null,
  careTypes = [],
  priceRange = null,
}: EnrichmentStateProps) {
  const [recipient, setRecipient] = useState<CareRecipient | null>(initialRecipient);
  const [urgency, setUrgency] = useState<UrgencyValue | null>(initialUrgency);
  const [firstName, setFirstName] = useState("");
  const [showFunding, setShowFunding] = useState(false);

  // Resolve pricing from care types
  const pricing = getPricingForProviderSync(careTypes);
  const displayRange = priceRange || (pricing.range ? formatPricingRange(pricing.range) : null);
  const fundingOptions = getFundingOptions();

  const hasSelections = recipient && urgency;
  const hasAnything = hasSelections || firstName.trim();
  const canSave = hasAnything && !saving;

  const handleSave = useCallback(() => {
    // Save whatever data we have — firstName alone is worth saving
    onSave({
      careRecipient: recipient || undefined,
      urgency: urgency || undefined,
      firstName: firstName.trim(),
    });
  }, [recipient, urgency, firstName, onSave]);

  return (
    <div>
      {/* Success header */}
      <div className="flex items-center gap-2.5 mb-3">
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
          Request sent to {providerName}
        </p>
      </div>

      {/* ── Pricing section ── */}
      {displayRange && !pricing.isHospice && (
        <div className="bg-gray-50 rounded-xl px-3.5 py-3 mb-3">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
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

      {/* ── Funding options ── */}
      {displayRange && !pricing.isHospice && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowFunding(!showFunding)}
            className="text-[13px] text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            {showFunding ? "Hide" : "Ways to pay"} →
          </button>
          {showFunding && (
            <div className="mt-2 space-y-1.5">
              {fundingOptions.map((opt) => (
                <div key={opt.label} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5 shrink-0">·</span>
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
                className="text-[12px] text-primary-600 font-medium hover:underline mt-1 inline-block"
              >
                Check your eligibility →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 my-3" />

      {/* ── Personalization prompt ── */}
      <p className="text-[13px] text-gray-500 mb-3">
        Help us personalize your request:
      </p>

      {/* First name */}
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Your first name"
        autoComplete="given-name"
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150 mb-3"
      />

      {/* Who needs care? */}
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        Who needs care?
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {RECIPIENT_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            selected={recipient === opt.value}
            onClick={() => setRecipient(opt.value as CareRecipient)}
            small
          />
        ))}
      </div>

      {/* When? */}
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        How soon do you need care?
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {URGENCY_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            selected={urgency === opt.value}
            onClick={() => setUrgency(opt.value as UrgencyValue)}
            small
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
