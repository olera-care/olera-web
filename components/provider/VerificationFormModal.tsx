"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";

export interface VerificationSubmission {
  name: string;
  role: string;
  phone: string;
  affiliation: string;
  documentUrl: string | null;
}

export interface ExistingVerificationData {
  name: string;
  role: string;
  phone?: string | null;
  affiliation?: string | null;
  submitted_at?: string;
}

interface VerificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VerificationSubmission) => Promise<void>;
  businessName: string;
  /** If true, shows "I'll do this later" option */
  allowDismiss?: boolean;
  onDismiss?: () => void;
  /** Pre-fill form with existing data (for updates) */
  existingData?: ExistingVerificationData;
  /** Whether this is an update to an existing submission */
  isUpdate?: boolean;
}

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "administrator", label: "Administrator" },
  { value: "executive_director", label: "Executive Director" },
  { value: "office_manager", label: "Office Manager" },
  { value: "marketing", label: "Marketing / Communications" },
  { value: "staff", label: "Staff Member" },
  { value: "other", label: "Other" },
];

export default function VerificationFormModal({
  isOpen,
  onClose,
  onSubmit,
  businessName,
  allowDismiss = true,
  onDismiss,
  existingData,
  isUpdate = false,
}: VerificationFormModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset/pre-fill form state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Pre-fill with existing data if available (for updates)
      setName(existingData?.name || "");
      setRole(existingData?.role || "");
      setPhone(existingData?.phone || "");
      setAffiliation(existingData?.affiliation || "");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, existingData]);

  const isValid = name.trim().length > 0 && role.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        role,
        phone: phone.trim(),
        affiliation: affiliation.trim(),
        documentUrl: null, // Document upload to be added later
      });
      // Note: Parent handles navigation after successful submit, no need to call onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUpdate ? "Update Verification" : "Verify Your Business"}
      size="lg"
      footer={
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <button
            type="submit"
            form="verification-form"
            disabled={!isValid || submitting}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all min-h-[52px] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              isUpdate ? "Update Submission" : "Submit for Review"
            )}
          </button>
          {allowDismiss && !isUpdate && (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm"
            >
              I&apos;ll do this later
            </button>
          )}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            {isUpdate
              ? "Your updated information will be reviewed within 1-2 business days."
              : "Until verified, contact info remains hidden from families."}
          </p>
        </div>
      }
    >
      <form id="verification-form" onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Header description */}
        <div className="pb-1">
          <p className="text-gray-600 text-[15px] leading-relaxed">
            {isUpdate ? (
              <>Update your verification details for <span className="font-medium text-gray-900">{businessName}</span>.</>
            ) : (
              <>Help us confirm you represent <span className="font-medium text-gray-900">{businessName}</span>. We review most requests within 1-2 business days.</>
            )}
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="ver-name" className="block text-[13px] font-semibold text-gray-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="ver-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white transition-all min-h-[48px]"
            required
          />
        </div>

        {/* Role - using custom Select */}
        <Select
          label="Your role"
          required
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
          placeholder="Select your role..."
        />

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="ver-phone" className="block text-[13px] font-semibold text-gray-700">
            Phone number
          </label>
          <input
            id="ver-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white transition-all min-h-[48px]"
          />
          <p className="text-xs text-gray-400 mt-1">Optional, but helps us reach you faster.</p>
        </div>

        {/* Affiliation */}
        <div className="space-y-1.5">
          <label htmlFor="ver-affiliation" className="block text-[13px] font-semibold text-gray-700">
            How are you affiliated with this business?
          </label>
          <textarea
            id="ver-affiliation"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="I'm the owner and have been operating this facility since 2018..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-300 focus:bg-white resize-none transition-all"
          />
        </div>

        {/* Error message with icon */}
        {error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-700" role="alert">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
