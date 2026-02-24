"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

interface PricingRow {
  service: string;
  rate: string;
  rateType: string;
}

export default function EditPricingModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const [priceRange, setPriceRange] = useState(metadata.price_range || "");
  const [rows, setRows] = useState<PricingRow[]>(
    metadata.pricing_details && metadata.pricing_details.length > 0
      ? metadata.pricing_details.map((d) => ({
          service: d.service,
          rate: d.rate,
          rateType: d.rateType,
        }))
      : [{ service: "", rate: "", rateType: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    priceRange !== (metadata.price_range || "") ||
    JSON.stringify(rows) !==
      JSON.stringify(
        metadata.pricing_details && metadata.pricing_details.length > 0
          ? metadata.pricing_details
          : [{ service: "", rate: "", rateType: "" }]
      );

  function updateRow(index: number, field: keyof PricingRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { service: "", rate: "", rateType: "" }]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const validRows = rows.filter(
        (r) => r.service.trim() || r.rate.trim()
      );
      await saveProfile({
        profileId: profile.id,
        metadataFields: {
          price_range: priceRange || undefined,
          pricing_details: validRows.length > 0 ? validRows : undefined,
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
    <Modal isOpen onClose={onClose} title="Edit Pricing" size="xl">
      <div className="space-y-5 pt-2">
        <Input
          label="Price Range"
          value={priceRange}
          onChange={(e) => setPriceRange((e.target as HTMLInputElement).value)}
          placeholder="e.g. $3,500 - $6,000/month"
          helpText="A general price range for your services"
        />

        {/* Pricing details rows */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-3">
            Service Pricing Details
          </label>
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={row.service}
                    onChange={(e) => updateRow(i, "service", e.target.value)}
                    placeholder="Service name"
                    aria-label={`Service name for row ${i + 1}`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="text"
                    value={row.rate}
                    onChange={(e) => updateRow(i, "rate", e.target.value)}
                    placeholder="Rate"
                    aria-label={`Rate for row ${i + 1}`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={row.rateType}
                    onChange={(e) => updateRow(i, "rateType", e.target.value)}
                    aria-label={`Rate type for row ${i + 1}`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
                  >
                    <option value="">Type</option>
                    <option value="per month">Per Month</option>
                    <option value="per day">Per Day</option>
                    <option value="per hour">Per Hour</option>
                    <option value="per visit">Per Visit</option>
                    <option value="flat rate">Flat Rate</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="p-2.5 text-warm-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Remove pricing row ${i + 1}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            + Add another service
          </button>
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
