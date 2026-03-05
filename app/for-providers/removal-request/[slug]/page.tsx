"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

const ACTION_OPTIONS = [
  { value: "hide", label: "Hide page" },
  { value: "delete", label: "Delete page" },
];

const REASON_OPTIONS = [
  { value: "i_own_this_business", label: "I own this business" },
  { value: "business_permanently_closed", label: "Business is permanently closed" },
  { value: "duplicate_listing", label: "Duplicate listing" },
  { value: "information_is_inaccurate", label: "Information is inaccurate" },
  { value: "privacy_concern", label: "Privacy concern" },
  { value: "other", label: "Other" },
];

export default function RemovalRequestPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const providerName = searchParams.get("provider_name") || "this provider";
  const providerId = searchParams.get("provider_id") || slug;

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!fullName.trim() && !!email.trim() && !!phone.trim() && !!action && !!reason;

  async function handleSubmit() {
    if (!canSubmit) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/removal-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          provider_name: providerName,
          provider_slug: slug,
          full_name: fullName.trim(),
          business_email: email.trim(),
          business_phone: phone.trim(),
          action,
          reason,
          additional_details: details.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmation screen ──
  if (submitted) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center">
            <Link
              href={`/provider/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to listing
            </Link>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center animate-wizard-in">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white animate-success-pop">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Thank you!</h1>
          <p className="text-lg font-medium text-gray-800 mb-3">Your request has been received</p>
          <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed mb-8">
            Our team will verify your ownership and contact you within 2 to 3 business days to confirm removal.
          </p>

          <Button onClick={() => window.history.back()} size="md">
            Done
          </Button>
        </div>
      </>
    );
  }

  // ── Form screen ──
  return (
    <>
      {/* Minimal top nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link
            href={`/provider/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to listing
          </Link>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pb-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Request to hide or remove page</h1>

        {/* Full name */}
        <div className="space-y-2">
          <label htmlFor="removal-full-name" className="block text-base font-medium text-gray-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="removal-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[48px]"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="removal-email" className="block text-base font-medium text-gray-700">
            Business email <span className="text-red-500">*</span>
          </label>
          <input
            id="removal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[48px]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label htmlFor="removal-phone" className="block text-base font-medium text-gray-700">
            Business phone number <span className="text-red-500">*</span>
          </label>
          <input
            id="removal-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[48px]"
          />
        </div>

        {/* Hide or delete */}
        <div className="space-y-2">
          <label htmlFor="removal-action" className="block text-base font-medium text-gray-700">
            Hide or delete page <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="removal-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className={`w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[48px] bg-white appearance-none ${
                !action ? "text-gray-400" : "text-gray-900"
              }`}
            >
              <option value="" disabled>Select</option>
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label htmlFor="removal-reason" className="block text-base font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="removal-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[48px] bg-white appearance-none ${
                !reason ? "text-gray-400" : "text-gray-900"
              }`}
            >
              <option value="" disabled>Select</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Additional details */}
        <div className="space-y-2">
          <label htmlFor="removal-details" className="block text-base font-medium text-gray-700">
            Additional details
          </label>
          <textarea
            id="removal-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Any additional context to help us process your request..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 resize-none"
          />
        </div>

        {formError && (
          <p className="text-sm text-red-600" role="alert">{formError}</p>
        )}

        {/* Submit button */}
        <div className="pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          >
            Submit request
          </Button>
          <p className="text-sm text-gray-500 text-center mt-3">
            By submitting, you agree to our{" "}
            <span className="text-primary-600 font-medium underline underline-offset-2">Takedown Policy</span>.
          </p>
        </div>
      </div>
    </>
  );
}
