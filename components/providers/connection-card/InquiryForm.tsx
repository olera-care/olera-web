"use client";

import { useState, useCallback } from "react";

interface InquiryFormProps {
  providerName: string;
  onSubmit: (data: { email: string }) => void;
  submitting?: boolean;
  error?: string;
  initialEmail?: string;
  connectionCount?: number;
}

export default function InquiryForm({
  providerName,
  onSubmit,
  submitting,
  error,
  initialEmail = "",
  connectionCount,
}: InquiryFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [honeypot, setHoneypot] = useState("");
  const [localError, setLocalError] = useState("");

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = useCallback(() => {
    setLocalError("");

    // Honeypot — silently succeed if filled
    if (honeypot) return;

    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    onSubmit({ email: email.trim().toLowerCase() });
  }, [email, honeypot, onSubmit]);

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
    <div className="space-y-3">
      <p className="text-[17px] font-bold text-gray-900">
        What does this cost?
      </p>

      {/* Email — the only field */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Your email address"
        autoComplete="email"
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
      />

      {/* Honeypot — hidden */}
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
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-default disabled:active:scale-100"
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Checking..." : "Check cost & availability"}
      </button>

      {/* Trust signals */}
      <div className="space-y-1 pt-0.5">
        <p className="text-[12px] text-gray-500 text-center font-medium">
          No spam. No sales calls.
        </p>
        {connectionCount != null && connectionCount >= 10 && (
          <p className="text-[11px] text-gray-400 text-center">
            {connectionCount} families checked this month
          </p>
        )}
      </div>
    </div>
  );
}
