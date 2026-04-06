"use client";

import { useState, useCallback } from "react";
import {
  getPricingForProviderSync,
  formatPricingRange,
} from "@/lib/pricing-ranges";

interface InquiryFormProps {
  providerName: string;
  onSubmit: (data: { email: string; phone?: string; name?: string; message?: string }) => void;
  submitting?: boolean;
  error?: string;
  initialEmail?: string;
  connectionCount?: number;
  careTypes?: string[];
  priceRange?: string | null;
  city?: string | null;
  state?: string | null;
  variantConfig?: import("@/lib/experiments").VariantConfig;
}

export default function InquiryForm({
  providerName,
  onSubmit,
  submitting,
  error,
  initialEmail = "",
  connectionCount,
  careTypes = [],
  priceRange = null,
  city = null,
  state = null,
  variantConfig,
}: InquiryFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [localError, setLocalError] = useState("");

  // Variant-driven copy
  const fields = variantConfig?.fields ?? ["email"];
  const headlineText = variantConfig?.headline;
  const buttonText = variantConfig?.buttonText ?? "Request details";
  const trustLineText = variantConfig?.trustLine ?? "No spam. No sales calls.";

  // Resolve pricing from care types
  const pricing = getPricingForProviderSync(careTypes);
  const estimateRange = priceRange || (pricing.range ? formatPricingRange(pricing.range) : null);
  const careLabel = pricing.careTypeLabel || (careTypes.length > 0 ? careTypes[0] : null);
  const locationStr = [city, state].filter(Boolean).join(", ");

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validatePhone = (val: string) =>
    /^[\d\s()+-]{7,}$/.test(val);

  const handleSubmit = useCallback(() => {
    setLocalError("");
    if (honeypot) return;

    // Validate required fields based on variant config
    if (fields.includes("email")) {
      if (!email.trim()) {
        setLocalError("Please enter your email address.");
        return;
      }
      if (!validateEmail(email)) {
        setLocalError("Please enter a valid email address.");
        return;
      }
    }
    if (fields.includes("phone") && !email.trim()) {
      // If phone is required and no email, validate phone
      if (!phone.trim()) {
        setLocalError("Please enter your phone number.");
        return;
      }
      if (!validatePhone(phone)) {
        setLocalError("Please enter a valid phone number.");
        return;
      }
    }
    if (fields.includes("name") && !name.trim()) {
      setLocalError("Please enter your name.");
      return;
    }

    onSubmit({
      email: email.trim().toLowerCase(),
      ...(fields.includes("phone") && phone.trim() ? { phone: phone.trim() } : {}),
      ...(fields.includes("name") && name.trim() ? { name: name.trim() } : {}),
      ...(fields.includes("message") && message.trim() ? { message: message.trim() } : {}),
    });
  }, [email, phone, name, message, honeypot, onSubmit, fields]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !submitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitting]
  );

  const displayError = error || localError;

  return (
    <div>
      {/* ── Pricing context (the free value) ── */}
      {pricing.medicareCoverage === "full" ? (
        /* Medicare-covered care types (Home Health): lead with coverage, not price */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[18px] font-bold text-primary-700 leading-snug">
            Medicare / Medicaid may cover
          </p>
          {pricing.medicareNote && (
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              {pricing.medicareNote}
            </p>
          )}
        </div>
      ) : pricing.medicareCoverage === "partial" && estimateRange ? (
        /* Partial Medicare (Nursing Homes): show price + Medicare note */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
            {estimateRange}
          </p>
          <p className="text-[13px] text-gray-600 font-semibold mt-1.5">
            Area estimate — not this provider&apos;s actual price
          </p>
          {pricing.medicareNote && (
            <p className="text-[12px] text-primary-700 font-medium mt-2">
              {pricing.medicareNote}
            </p>
          )}
        </div>
      ) : estimateRange && !pricing.isHospice ? (
        /* Standard care types: show price estimate */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
            {estimateRange}
          </p>
          <p className="text-[13px] text-gray-600 font-semibold mt-1.5">
            Area estimate — not this provider&apos;s actual price
          </p>
        </div>
      ) : pricing.isHospice ? (
        <div className="mb-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Hospice is typically covered by Medicare, Medicaid, or insurance at no cost to families.
          </p>
        </div>
      ) : null}

      {/* ── Divider ── */}
      {(estimateRange || pricing.medicareCoverage || pricing.isHospice) && (
        <div className="border-t border-gray-100 mb-4" />
      )}

      {/* ── CTA section ── */}
      <p className="text-[15px] font-semibold text-gray-900 mb-3">
        {headlineText ?? (pricing.medicareCoverage ? "Check coverage & availability" : "Get actual pricing & availability")}
      </p>

      {/* ── Form fields (variant-driven) ── */}
      {fields.includes("name") && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your name"
          autoComplete="name"
          className={`w-full px-3.5 py-3 border rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150 mb-2 ${
            displayError && !name.trim() ? "border-red-300" : "border-gray-200"
          }`}
        />
      )}

      {fields.includes("email") && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your email address"
          autoComplete="email"
          className={`w-full px-3.5 py-3 border rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150 ${
            fields.includes("phone") || fields.includes("message") ? "mb-2" : ""
          } ${displayError && !email.trim() ? "border-red-300" : "border-gray-200"}`}
        />
      )}

      {fields.includes("phone") && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your phone number"
          autoComplete="tel"
          className={`w-full px-3.5 py-3 border rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150 ${
            fields.includes("message") ? "mb-2" : ""
          } ${displayError && fields.includes("phone") && !phone.trim() && !email.trim() ? "border-red-300" : "border-gray-200"}`}
        />
      )}

      {fields.includes("message") && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your care needs..."
          rows={3}
          className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150 resize-none"
        />
      )}

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {displayError && (
        <p className="text-xs text-red-600 mt-1.5" role="alert">
          {displayError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-3 py-3 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-default disabled:active:scale-100"
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Requesting..." : buttonText}
      </button>

      {/* Trust signal */}
      <p className="text-[13px] text-gray-600 text-center font-medium mt-3 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        {trustLineText}
      </p>

      {connectionCount != null && connectionCount >= 10 && (
        <p className="text-[11px] text-gray-400 text-center mt-1">
          {connectionCount} families checked this month
        </p>
      )}
    </div>
  );
}
