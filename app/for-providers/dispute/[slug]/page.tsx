"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

const ROLE_OPTIONS = [
  { value: "Owner", label: "Owner" },
  { value: "Administrator", label: "Administrator" },
  { value: "Executive Director", label: "Executive Director" },
  { value: "Office Manager", label: "Office Manager" },
  { value: "Marketing / Communications", label: "Marketing / Communications" },
  { value: "Staff Member", label: "Staff Member" },
  { value: "Other", label: "Other" },
];

export default function DisputePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const providerName = searchParams.get("provider_name") || "this provider";
  const providerId = searchParams.get("provider_id") || slug;

  // Form state
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!fullName.trim() && !!role && !!reason.trim();

  async function handleSubmit() {
    if (!canSubmit) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          provider_name: providerName,
          claimant_name: fullName.trim(),
          claimant_role: role,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit dispute");
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white animate-success-pop">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dispute submitted</h1>
          <p className="text-lg font-medium text-gray-800 mb-3">We&apos;ll review your claim</p>
          <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed mb-8">
            Our team will review your dispute and get back to you within 2–3 business days.
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
    <div className="min-h-[100dvh] flex flex-col bg-white">
      {/* Minimal top nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shrink-0">
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
              Dispute this claim
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Tell us about your connection to <strong className="text-gray-700">{providerName}</strong> and why you believe you should manage this listing.
            </p>
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-full-name" className="block text-[13px] font-semibold text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="dispute-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white transition-all min-h-[48px]"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-role" className="block text-[13px] font-semibold text-gray-700">
              Your role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="dispute-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-base focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white min-h-[48px] appearance-none cursor-pointer transition-all ${
                  !role ? "text-gray-400" : "text-gray-900"
                }`}
              >
                <option value="" disabled>Select your role…</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label htmlFor="dispute-reason" className="block text-[13px] font-semibold text-gray-700">
              Why should you manage this listing? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your connection to this organization..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white resize-none transition-all"
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700" role="alert">{formError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer with submit button */}
      <div
        className="shrink-0 border-t border-gray-100 bg-white px-4 pt-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
      >
        <div className="max-w-lg mx-auto">
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          >
            Submit dispute
          </Button>
        </div>
      </div>
    </div>
  );
}
