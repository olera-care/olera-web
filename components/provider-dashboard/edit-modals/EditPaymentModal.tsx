"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const PAYMENT_OPTIONS = [
  "Private Pay",
  "Long-Term Care Insurance",
  "VA Benefits",
  "Credit Card",
  "Check",
  "Wire Transfer",
  "Sliding Scale",
];

export default function EditPaymentModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const [acceptsMedicare, setAcceptsMedicare] = useState(
    metadata.accepts_medicare || false
  );
  const [acceptsMedicaid, setAcceptsMedicaid] = useState(
    metadata.accepts_medicaid || false
  );
  const [payments, setPayments] = useState<string[]>(
    metadata.accepted_payments || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    acceptsMedicare !== (metadata.accepts_medicare || false) ||
    acceptsMedicaid !== (metadata.accepts_medicaid || false) ||
    JSON.stringify(payments) !== JSON.stringify(metadata.accepted_payments || []);

  function togglePayment(method: string) {
    setPayments((prev) =>
      prev.includes(method)
        ? prev.filter((p) => p !== method)
        : [...prev, method]
    );
  }

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        profileId: profile.id,
        metadataFields: {
          accepts_medicare: acceptsMedicare,
          accepts_medicaid: acceptsMedicaid,
          accepted_payments: payments,
        },
        existingMetadata: (profile.metadata || {}) as Record<string, unknown>,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Accepted Payments & Insurance" size="lg">
      <div className="space-y-5 pt-2">
        {/* Insurance toggles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Government Insurance
          </label>
          <div className="space-y-2">
            {[
              { key: "medicare", label: "Medicare", value: acceptsMedicare, setter: setAcceptsMedicare },
              { key: "medicaid", label: "Medicaid", value: acceptsMedicaid, setter: setAcceptsMedicaid },
            ].map(({ key, label, value, setter }) => (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={value}
                onClick={() => setter(!value)}
                className={`w-full flex items-center gap-3 rounded-xl p-4 border transition-all duration-200 text-left ${
                  value
                    ? "bg-primary-50/80 border-primary-200/60"
                    : "bg-warm-50 border-warm-100 hover:border-warm-200"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    value
                      ? "bg-primary-600 border-primary-600"
                      : "border-warm-300 bg-white"
                  }`}
                >
                  {value && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[15px] font-medium ${value ? "text-primary-700" : "text-gray-700"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Methods
          </label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((method) => {
              const selected = payments.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => togglePayment(method)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    selected
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-warm-100 text-warm-600 hover:border-warm-200"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>

      <ModalFooter
        saving={saving}
        hasChanges={hasChanges}
        onClose={onClose}
        onSave={handleSave}
        guidedMode={guidedMode}
        guidedStep={guidedStep}
        guidedTotal={guidedTotal}
        onGuidedBack={onGuidedBack}
      />
    </Modal>
  );
}
