"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";

interface VerificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VerificationSubmission) => Promise<void>;
  businessName: string;
  /** If true, shows "I'll do this later" option */
  allowDismiss?: boolean;
  onDismiss?: () => void;
}

export interface VerificationSubmission {
  name: string;
  role: string;
  phone: string;
  affiliation: string;
  documentUrl: string | null;
}

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "administrator", label: "Administrator" },
  { value: "marketing", label: "Marketing Director" },
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
}: VerificationFormModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setRole("");
      setPhone("");
      setAffiliation("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

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
      title="Complete Verification"
      size="lg"
      footer={
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            form="verification-form"
            disabled={!isValid || submitting}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
          {allowDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              I&apos;ll do this later
            </button>
          )}
          <p className="text-xs text-gray-400 text-center">
            Until verified, some features are limited (contact info hidden).
          </p>
        </div>
      }
    >
      <form id="verification-form" onSubmit={handleSubmit} className="space-y-5 pt-4">
        <p className="text-gray-600">
          Help us confirm you&apos;re with <span className="font-medium text-gray-900">{businessName}</span>.
          We review most requests within 1-2 business days.
        </p>

        {/* Name */}
        <div>
          <label htmlFor="ver-name" className="block text-sm font-medium text-gray-900 mb-1.5">
            Your full name <span className="text-red-500">*</span>
          </label>
          <input
            id="ver-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-gray-900 placeholder:text-gray-400 transition-colors"
            required
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="ver-role" className="block text-sm font-medium text-gray-900 mb-1.5">
            Your role <span className="text-red-500">*</span>
          </label>
          <select
            id="ver-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-gray-900 bg-white transition-colors"
            required
          >
            <option value="">Select your role...</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="ver-phone" className="block text-sm font-medium text-gray-900 mb-1.5">
            Phone number
          </label>
          <input
            id="ver-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-gray-900 placeholder:text-gray-400 transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Optional, but helps us reach you faster.</p>
        </div>

        {/* Affiliation */}
        <div>
          <label htmlFor="ver-affiliation" className="block text-sm font-medium text-gray-900 mb-1.5">
            How are you affiliated with this business?
          </label>
          <textarea
            id="ver-affiliation"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="I'm the owner and have been operating this facility since 2018..."
            rows={3}
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-gray-900 placeholder:text-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
