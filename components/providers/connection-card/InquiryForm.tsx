"use client";

import { useState, useCallback } from "react";

interface InquiryFormProps {
  providerName: string;
  onSubmit: (data: {
    email: string;
    fullName: string;
    phone: string;
    message: string;
  }) => void;
  submitting?: boolean;
  error?: string;
}

export default function InquiryForm({
  providerName,
  onSubmit,
  submitting,
  error,
}: InquiryFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
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

    onSubmit({
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      message:
        message.trim() ||
        `I'd like to learn more about your services and availability.`,
    });
  }, [email, fullName, phone, message, honeypot, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !submitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitting]
  );

  const canSubmit = email.trim().length > 0 && !submitting;
  const displayError = error || localError;

  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold text-gray-900">
        Connect with {providerName}
      </p>

      {/* Email — required */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Your email address"
        autoComplete="email"
        className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
      />

      {/* Name + Phone — side by side */}
      <div className="flex gap-2.5">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Full name"
          autoComplete="name"
          className="flex-1 min-w-0 px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Phone"
          autoComplete="tel"
          className="flex-1 min-w-0 px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
        />
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="I'd like to learn more about your services and availability."
        rows={3}
        className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
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
        disabled={!canSubmit}
        className={`w-full h-12 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 ${
          canSubmit
            ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
            : "bg-gray-200 text-gray-400 cursor-default"
        }`}
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Sending..." : "Send inquiry"}
      </button>

      {/* TOS */}
      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        By submitting, you agree to our{" "}
        <a href="/terms" className="text-gray-500 underline underline-offset-2">
          TOS
        </a>{" "}
        &{" "}
        <a
          href="/privacy"
          className="text-gray-500 underline underline-offset-2"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
