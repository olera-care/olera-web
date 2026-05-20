"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient } from "./types";

type EnrichmentStep = "recipient" | "timeline" | "contact";
type TimelineValue = "immediate" | "within_1_month" | "within_3_months" | "exploring";
type ContactPref = "Call" | "Text" | "Email";

interface EnrichmentStateProps {
  providerName: string;
  onSave: (data: {
    careRecipient?: CareRecipient;
    urgency?: string;
    contactPreference?: ContactPref;
    phone?: string;
  }) => void;
  onSkip: () => void;
  saving?: boolean;
  priceRange?: string | null;
  /** @deprecated No longer used in new UI but kept for backward compatibility */
  careTypes?: string[];
  /** Custom success banner title. Defaults to "Sent to {providerName}" */
  successTitle?: string;
  /** Custom success banner subtitle. Defaults to "{priceRange} estimated" if priceRange exists */
  successSubtitle?: string;
  /** Hide the success banner entirely */
  hideSuccessBanner?: boolean;
}

const TIMELINE_OPTIONS: { label: string; value: TimelineValue }[] = [
  { label: "As soon as possible", value: "immediate" },
  { label: "Within a month", value: "within_1_month" },
  { label: "In a few months", value: "within_3_months" },
  { label: "Just researching", value: "exploring" },
];

const CONTACT_OPTIONS: { label: string; value: ContactPref; needsPhone: boolean }[] = [
  { label: "Call", value: "Call", needsPhone: true },
  { label: "Text", value: "Text", needsPhone: true },
  { label: "Email", value: "Email", needsPhone: false },
];

export default function EnrichmentState({
  providerName,
  onSave,
  onSkip,
  saving,
  priceRange = null,
  careTypes: _careTypes,
  successTitle,
  successSubtitle,
  hideSuccessBanner = false,
}: EnrichmentStateProps) {
  void _careTypes; // Suppress unused variable warning

  const [step, setStep] = useState<EnrichmentStep>("recipient");
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [timeline, setTimeline] = useState<TimelineValue | null>(null);
  const [contactPref, setContactPref] = useState<ContactPref | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Compute display values
  const displayTitle = successTitle ?? `Sent to ${providerName}`;
  const displaySubtitle = successSubtitle ?? (priceRange ? `${priceRange} estimated` : null);

  // Auto-focus phone input when it appears
  useEffect(() => {
    if (showPhoneInput && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [showPhoneInput]);

  // Step 1: Select recipient → auto-advance to timeline
  const selectRecipient = useCallback((val: CareRecipient) => {
    setRecipient(val);
    setTimeout(() => setStep("timeline"), 150);
  }, []);

  // Step 2: Select timeline → auto-advance to contact
  const selectTimeline = useCallback((val: TimelineValue) => {
    setTimeline(val);
    setTimeout(() => setStep("contact"), 150);
  }, []);

  // Step 3: Select contact preference
  const selectContact = useCallback((opt: typeof CONTACT_OPTIONS[number]) => {
    setContactPref(opt.value);

    if (opt.needsPhone) {
      // Show phone input for Call/Text
      setShowPhoneInput(true);
    } else {
      // Email selected - save immediately
      onSave({
        careRecipient: recipient || undefined,
        urgency: timeline || undefined,
        contactPreference: opt.value,
      });
    }
  }, [recipient, timeline, onSave]);

  // Submit with phone number
  const handlePhoneSubmit = useCallback(() => {
    onSave({
      careRecipient: recipient || undefined,
      urgency: timeline || undefined,
      contactPreference: contactPref || undefined,
      phone: phone.trim() || undefined,
    });
  }, [recipient, timeline, contactPref, phone, onSave]);

  // Handle Enter key on phone input
  const handlePhoneKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && phone.trim()) {
      handlePhoneSubmit();
    }
  }, [phone, handlePhoneSubmit]);

  // Skip from any step — save whatever we have
  const handleSkip = useCallback(() => {
    if (step === "recipient" && !recipient) {
      onSkip();
    } else {
      onSave({
        careRecipient: recipient || undefined,
        urgency: timeline || undefined,
        contactPreference: contactPref || undefined,
        phone: phone.trim() || undefined,
      });
    }
  }, [step, recipient, timeline, contactPref, phone, onSave, onSkip]);

  return (
    <div>
      {/* Success banner */}
      {!hideSuccessBanner && (
        <div className="mb-6 bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
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
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {displayTitle}
              </p>
              {displaySubtitle && (
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {displaySubtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Who needs care? */}
      {step === "recipient" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Who needs care?
          </h3>
          <div className="space-y-2 mb-4">
            {RECIPIENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectRecipient(opt.value as CareRecipient)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  recipient === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 2: How soon? */}
      {step === "timeline" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How soon do you need care?
          </h3>
          <div className="space-y-2 mb-4">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectTimeline(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  timeline === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 3: Contact preference */}
      {step === "contact" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Best way to reach you?
          </h3>

          {!showPhoneInput ? (
            // Show contact options
            <>
              <div className="space-y-2 mb-4">
                {CONTACT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectContact(opt)}
                    disabled={saving}
                    className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                      contactPref === opt.value
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Skip"}
              </button>
            </>
          ) : (
            // Phone input (appears after selecting Call or Text)
            <div className="animate-in fade-in duration-200">
              {/* Selected preference indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[14px] text-gray-600">
                  {contactPref === "Call" ? "I prefer a call" : "I prefer a text"}
                </span>
              </div>

              {/* Phone input */}
              <div className="mb-4">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="Your phone number"
                  autoComplete="tel"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-150"
                />
              </div>

              {/* Continue button - disabled until phone entered */}
              <button
                onClick={handlePhoneSubmit}
                disabled={saving || !phone.trim()}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold text-center transition-all duration-150 border ${
                  phone.trim()
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 active:scale-[0.98]"
                    : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {saving ? "Saving..." : "Continue"}
              </button>

              {/* Skip option */}
              <button
                onClick={handleSkip}
                disabled={saving}
                className="w-full py-2 mt-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
