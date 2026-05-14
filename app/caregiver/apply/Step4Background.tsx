"use client";

import { useState } from "react";
import OleraSelect from "./OleraSelect";

/* ─── Types ───────────────────────────────────────────────── */

export interface BackgroundFormState {
  legalName: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  authorizeCheck: boolean;
  authorizeShare: boolean;
  submitted: boolean;
}

export const INITIAL_BACKGROUND: BackgroundFormState = {
  legalName: "",
  dateOfBirth: "",
  ssn: "",
  address: "",
  city: "",
  state: "TX",
  zip: "",
  authorizeCheck: false,
  authorizeShare: false,
  submitted: false,
};

/* ─── Component ───────────────────────────────────────────── */

export default function Step4Background({
  background,
  setBackground,
  prefillName,
  onBack,
  onContinue,
}: {
  background: BackgroundFormState;
  setBackground: React.Dispatch<React.SetStateAction<BackgroundFormState>>;
  prefillName: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Pre-fill legal name from Step 1 on first render */
  if (!background.legalName && prefillName) {
    setBackground((s) => ({ ...s, legalName: prefillName }));
  }

  const field = (
    key: keyof BackgroundFormState,
    label: string,
    type = "text",
    placeholder = "",
    helper?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={background[key] as string}
        onChange={(e) => setBackground((s) => ({ ...s, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border ${
          errors[key] ? "border-error-300 ring-1 ring-error-300" : "border-gray-300"
        } text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
      />
      {helper && <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5">
        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {helper}
      </p>}
      {errors[key] && <p className="text-xs text-error-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!background.legalName.trim()) e.legalName = "Legal name is required";
    if (!background.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!background.ssn.trim()) e.ssn = "SSN is required";
    if (!background.address.trim()) e.address = "Address is required";
    if (!background.city.trim()) e.city = "City is required";
    if (!background.zip.trim()) e.zip = "ZIP code is required";
    if (!background.authorizeCheck) e.authorizeCheck = "Authorization is required";
    if (!background.authorizeShare) e.authorizeShare = "Authorization is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setBackground((s) => ({ ...s, submitted: true }));
    }
  };

  const WE_CHECK = [
    "National criminal records",
    "Sex offender registry",
    "Identity verification (cross-referenced with Step 3)",
    "Address history",
  ];

  const WE_DONT_CHECK = [
    "Credit history",
    "Medical records",
    "Immigration status",
  ];

  /* ── Submitted success state ── */
  if (background.submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Background check authorized
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-50 border border-warning-100 text-warning-700 text-sm font-medium mt-3 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Pending review, usually 2-3 business days
          </div>
          <div>
            <button
              onClick={onContinue}
              className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
            >
              Continue to availability
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Background check
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Required for everyone who works with families on Olera. This usually takes 2-3 business days.
        </p>
        <div className="mt-4 bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-warning-900">One-time fee: $34.99</p>
            <p className="text-xs text-warning-700 mt-0.5">Covers your background check and identity verification. The platform is free to use.</p>
          </div>
        </div>
      </div>

      {/* Why this matters */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <div className="text-sm text-primary-800">
          <p>Families trust us to send qualified caregivers into their homes. A clean background check is required for everyone on the platform — no exceptions.</p>
          <p className="mt-2 text-primary-600">Most students pass with no issues. We use Checkr, the same service that screens drivers for Lyft and Uber.</p>
        </div>
      </div>

      {/* What we check / don't check */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What we check</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">We check</p>
            <ul className="space-y-2.5">
              {WE_CHECK.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">We don&apos;t check</p>
            <ul className="space-y-2.5">
              {WE_DONT_CHECK.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Authorization + personal info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your information</h3>
          <p className="text-sm text-gray-400 mb-5">
            Used only for the background check. Encrypted in transit and at rest.
          </p>
        </div>

        {field("legalName", "Full legal name", "text", "As it appears on your ID")}

        <div className="grid sm:grid-cols-2 gap-4">
          {field("dateOfBirth", "Date of birth", "date")}
          {field("ssn", "Social Security Number", "password", "XXX-XX-XXXX", "Encrypted and only used for the background check — never stored by Olera.")}
        </div>

        {field("address", "Street address", "text", "123 Main St, Apt 4B")}

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            {field("city", "City", "text", "Houston")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <OleraSelect
              value={background.state}
              onChange={(v) => setBackground((s) => ({ ...s, state: v || "TX" }))}
              options={["TX", "LA", "OK", "AR", "NM"]}
              placeholder="State"
            />
          </div>
          <div>
            {field("zip", "ZIP", "text", "77001")}
          </div>
        </div>
      </div>

      {/* Authorization checkboxes */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Authorization</h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={background.authorizeCheck}
            onChange={(e) => setBackground((s) => ({ ...s, authorizeCheck: e.target.checked }))}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              style={{ accentColor: "#4d8a8a" }}
          />
          <span className="text-sm text-gray-700">
            I authorize Olera and Checkr to conduct a background check.
          </span>
        </label>
        {errors.authorizeCheck && <p className="text-xs text-error-500 ml-7">{errors.authorizeCheck}</p>}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={background.authorizeShare}
            onChange={(e) => setBackground((s) => ({ ...s, authorizeShare: e.target.checked }))}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              style={{ accentColor: "#4d8a8a" }}
          />
          <span className="text-sm text-gray-700">
            I understand the results will be shared with Olera to determine my eligibility to provide care.
          </span>
        </label>
        {errors.authorizeShare && <p className="text-xs text-error-500 ml-7">{errors.authorizeShare}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="order-2 sm:order-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to identity verification
        </button>
        <div className="order-1 sm:order-2 flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
          >
            Authorize background check
          </button>
        </div>
      </div>
    </div>
  );
}
