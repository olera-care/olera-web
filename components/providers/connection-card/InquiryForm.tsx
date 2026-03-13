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

  const displayError = error || localError;

  return (
    <div className="space-y-2.5">
      <p className="text-[16px] font-bold text-gray-900">
        Get in touch
      </p>

      {/* Email — required */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Your email address"
        autoComplete="email"
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
      />

      {/* Name + Phone — side by side */}
      <div className="flex gap-2">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Full name"
          autoComplete="name"
          className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Phone"
          autoComplete="tel"
          className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
        />
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="I'd like to learn more about your services and availability."
        rows={2}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-150"
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

      {/* Submit — always bold teal to invite engagement */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-default disabled:active:scale-100"
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Sending..." : "Connect with us"}
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
