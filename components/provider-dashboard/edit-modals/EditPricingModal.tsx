"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const COMMON_SERVICES = [
  "Private Room",
  "Semi-Private Room",
  "Studio",
  "1 Bedroom",
  "2 Bedroom",
  "Memory Care",
  "Skilled Nursing",
  "Respite Care",
  "Adult Day Care",
  "Home Care",
  "Companion Care",
  "Personal Care",
];

const RATE_TYPES = [
  { value: "per month", label: "Monthly" },
  { value: "per day", label: "Daily" },
  { value: "per hour", label: "Hourly" },
  { value: "per visit", label: "Per Visit" },
  { value: "flat rate", label: "Flat Rate" },
];

interface PricingRow {
  service: string;
  rate: string;
  rateType: string;
}

function parseStartingPrice(range: string): { price: string; type: string } {
  if (!range) return { price: "", type: "per month" };
  const numbers = range.match(/[\d,]+/g);
  const price = numbers?.[0]?.replace(/,/g, "") || "";
  const lower = range.toLowerCase();
  let type = "per month";
  if (lower.includes("hour")) type = "per hour";
  else if (lower.includes("day") || lower.includes("daily")) type = "per day";
  else if (lower.includes("visit")) type = "per visit";
  else if (lower.includes("flat")) type = "flat rate";
  return { price, type };
}

function formatStartingPrice(price: string, type: string): string {
  if (!price) return "";
  const num = parseInt(price, 10);
  const formatted = isNaN(num) ? price : num.toLocaleString("en-US");
  const label = RATE_TYPES.find((r) => r.value === type)?.label?.toLowerCase() || type;
  return `$${formatted} ${label}`;
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
  const [contactForPricing, setContactForPricing] = useState(
    metadata.contact_for_pricing || false
  );
  const parsed = parseStartingPrice(metadata.price_range || "");
  const [startingPrice, setStartingPrice] = useState(parsed.price);
  const [priceType, setPriceType] = useState(parsed.type);
  const [rows, setRows] = useState<PricingRow[]>(
    metadata.pricing_details && metadata.pricing_details.length > 0
      ? metadata.pricing_details.map((d) => ({
          service: d.service,
          rate: d.rate.replace(/^\$/, ""),
          rateType: d.rateType,
        }))
      : []
  );
  const [customService, setCustomService] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const composedRange = formatStartingPrice(startingPrice, priceType);
  const originalRows =
    metadata.pricing_details && metadata.pricing_details.length > 0
      ? metadata.pricing_details
      : [];

  // Normalize rows for comparison (add $ prefix like we do on save)
  const normalizedRows = rows.map((r) => ({
    ...r,
    rate: r.rate ? `$${r.rate.replace(/^\$/, "")}` : "",
  }));

  const hasChanges =
    contactForPricing !== (metadata.contact_for_pricing || false) ||
    composedRange !== (metadata.price_range || "") ||
    JSON.stringify(normalizedRows) !== JSON.stringify(originalRows);

  const selectedServices = rows.map((r) => r.service);

  function toggleService(service: string) {
    if (selectedServices.includes(service)) {
      setRows((prev) => prev.filter((r) => r.service !== service));
    } else {
      setRows((prev) => [...prev, { service, rate: "", rateType: "per month" }]);
    }
  }

  function addCustomService() {
    const trimmed = customService.trim();
    if (trimmed && !selectedServices.includes(trimmed)) {
      setRows((prev) => [...prev, { service: trimmed, rate: "", rateType: "per month" }]);
    }
    setCustomService("");
  }

  function updateRow(service: string, field: "rate" | "rateType", value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.service === service ? { ...row, [field]: value } : row
      )
    );
  }

  function removeRow(service: string) {
    setRows((prev) => prev.filter((r) => r.service !== service));
  }

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const validRows = rows
        .filter((r) => r.service.trim())
        .map((r) => ({
          ...r,
          rate: r.rate ? `$${r.rate.replace(/^\$/, "")}` : "",
        }));
      await saveProfile({
        profileId: profile.id,
        metadataFields: {
          contact_for_pricing: contactForPricing,
          price_range: contactForPricing ? "" : composedRange || undefined,
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
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Pricing"
      size="2xl"
      footer={
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
      }
    >
      <div className="space-y-5 pt-2">
        {/* Starting Price Section */}
        <div className="space-y-3">
          <label className="block text-base font-medium text-gray-700">
            Starting Price
          </label>

          {/* Contact for pricing toggle */}
          <button
            type="button"
            onClick={() => setContactForPricing(!contactForPricing)}
            className="flex items-center gap-3 w-full"
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                contactForPricing
                  ? "bg-primary-500 border-primary-500"
                  : "border-warm-300 bg-white"
              }`}
            >
              {contactForPricing && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[15px] text-gray-700">Contact for pricing</span>
          </button>

          {/* Starting price input */}
          {!contactForPricing && (
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value.replace(/[^\d,]/g, ""))}
                  placeholder="e.g. 3,500"
                  aria-label="Starting price"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
                />
              </div>

              {/* Rate type pills */}
              <div className="flex flex-wrap gap-1.5">
                {RATE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPriceType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      priceType === type.value
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "bg-white border-warm-100 text-gray-900 hover:border-warm-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service Pricing Section */}
        <div className="space-y-3">
          <label className="block text-base font-medium text-gray-700">
            Service Pricing
          </label>

          {/* Service pills */}
          <div className="flex flex-wrap gap-2">
            {COMMON_SERVICES.map((service) => {
              const isSelected = selectedServices.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleService(service)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    isSelected
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-warm-100 text-gray-900 hover:border-warm-200"
                  }`}
                >
                  {service}
                </button>
              );
            })}
            {/* Custom services not in the predefined list */}
            {selectedServices
              .filter((s) => !COMMON_SERVICES.includes(s))
              .map((service) => (
                <button
                  key={service}
                  type="button"
                  role="checkbox"
                  aria-checked
                  onClick={() => toggleService(service)}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium border bg-primary-50 border-primary-300 text-primary-700 transition-all duration-200"
                >
                  {service}
                </button>
              ))}
          </div>

          {/* Custom service input */}
          <div className="relative">
            <input
              type="text"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              placeholder="Add custom service"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomService();
                }
              }}
              className="w-full pl-4 pr-16 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
            />
            <button
              type="button"
              onClick={addCustomService}
              disabled={!customService.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected service pricing cards */}
        {rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.service}
                className="rounded-xl border border-warm-100 bg-vanilla-50/50 p-4 space-y-3"
              >
                {/* Service header with remove */}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-gray-900">
                    {row.service}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.service)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-warm-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    aria-label={`Remove ${row.service}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Rate input with $ prefix */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.rate}
                    onChange={(e) => updateRow(row.service, "rate", e.target.value.replace(/^\$/, ""))}
                    placeholder="0"
                    aria-label={`Rate for ${row.service}`}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px]"
                  />
                </div>

                {/* Rate type pills */}
                <div className="flex flex-wrap gap-1.5">
                  {RATE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateRow(row.service, "rateType", type.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                        row.rateType === type.value
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-warm-100 text-gray-900 hover:border-warm-200"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4" role="alert">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700 flex-1">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
