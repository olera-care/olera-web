"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveProfile } from "./save-profile";
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
  { value: "per visit", label: "Per visit" },
  { value: "flat rate", label: "Flat rate" },
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

function formatRateDisplay(rate: string, rateType: string): string {
  if (!rate) return "";
  const label = RATE_TYPES.find((r) => r.value === rateType)?.label || rateType;
  return `$${rate} ${label.toLowerCase()}`;
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
  // Always default to "Show my rates" when modal opens
  const [contactForPricing, setContactForPricing] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add service inline form state
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newRateType, setNewRateType] = useState("per month");

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
  const availableServices = COMMON_SERVICES.filter(
    (s) => !selectedServices.includes(s)
  );

  function removeRow(service: string) {
    setRows((prev) => prev.filter((r) => r.service !== service));
  }

  function handleAddService() {
    if (!newService.trim()) return;
    setRows((prev) => [
      ...prev,
      { service: newService, rate: newRate, rateType: newRateType },
    ]);
    setNewService("");
    setNewRate("");
    setNewRateType("per month");
    setIsAddingService(false);
  }

  function handleCancelAdd() {
    setNewService("");
    setNewRate("");
    setNewRateType("per month");
    setIsAddingService(false);
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

  // Custom footer with hairline border
  const footer = (
    <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
      {guidedMode ? (
        <>
          <div className="flex items-center gap-3">
            {onGuidedBack ? (
              <button
                type="button"
                onClick={onGuidedBack}
                disabled={saving}
                className="text-[14px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="text-[14px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {guidedStep} of {guidedTotal}
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-colors"
            >
              {saving
                ? "Saving..."
                : guidedStep === guidedTotal
                  ? "Finish"
                  : hasChanges
                    ? "Save & Next"
                    : "Next"}
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[14px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Pricing"
      size="md"
      footer={footer}
    >
      <div className="pt-2">
        {/* Section 1 — Display toggle */}
        <div className="pb-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setContactForPricing(false)}
              className={`py-3 px-4 rounded-xl text-[14px] font-medium border-2 transition-all duration-200 ${
                !contactForPricing
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Show my rates
            </button>
            <button
              type="button"
              onClick={() => setContactForPricing(true)}
              className={`py-3 px-4 rounded-xl text-[14px] font-medium border-2 transition-all duration-200 ${
                contactForPricing
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Contact for pricing
            </button>
          </div>
          <p className="text-[13px] text-gray-400 mt-3">
            {contactForPricing
              ? "Families will see 'Contact for pricing' and reach out to discuss."
              : "Families will see your rates upfront on your profile."}
          </p>
        </div>

        {!contactForPricing && (
          <>
            {/* Section 2 — Starting from */}
            <div className="py-5 border-t border-gray-100">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Starting from
              </label>
              <div className="flex gap-3">
                {/* Price input */}
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[15px] pointer-events-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startingPrice}
                    onChange={(e) =>
                      setStartingPrice(e.target.value.replace(/[^\d,]/g, ""))
                    }
                    placeholder="0"
                    aria-label="Starting price"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-[15px] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500"
                  />
                </div>
                {/* Frequency dropdown */}
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-[15px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 appearance-none shrink-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.25rem 1.25rem",
                    paddingRight: "2.5rem",
                  }}
                >
                  {RATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3 — Service rates */}
            <div className="py-5 border-t border-gray-100">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Service rates
              </label>

              {/* Existing service rows */}
              {rows.length > 0 && (
                <div className="space-y-2 mb-3">
                  {rows.map((row) => (
                    <div
                      key={row.service}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50"
                    >
                      <span className="text-[14px] font-medium text-gray-900 flex-1 min-w-0 truncate">
                        {row.service}
                      </span>
                      <span className="text-[14px] text-gray-500 shrink-0">
                        {formatRateDisplay(row.rate, row.rateType) || "No rate"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(row.service)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shrink-0"
                        aria-label={`Remove ${row.service}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add service inline form */}
              {isAddingService ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  {/* Service dropdown */}
                  <div>
                    <select
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25rem 1.25rem",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="">Select a service</option>
                      {availableServices.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                      <option value="__custom__">+ Custom service</option>
                    </select>
                  </div>

                  {/* Custom service input */}
                  {newService === "__custom__" && (
                    <input
                      type="text"
                      placeholder="Enter service name"
                      onChange={(e) => setNewService(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500"
                    />
                  )}

                  {/* Price input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] pointer-events-none">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newRate}
                      onChange={(e) =>
                        setNewRate(e.target.value.replace(/[^\d,]/g, ""))
                      }
                      placeholder="0"
                      aria-label="Service rate"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-[14px] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500"
                    />
                  </div>

                  {/* Frequency dropdown */}
                  <select
                    value={newRateType}
                    onChange={(e) => setNewRateType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.75rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.25rem 1.25rem",
                      paddingRight: "2.5rem",
                    }}
                  >
                    {RATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  {/* Confirm / Cancel */}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelAdd}
                      className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!newService.trim() || newService === "__custom__"}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                /* Add service button */
                <button
                  type="button"
                  onClick={() => setIsAddingService(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 text-[14px] font-medium text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add a service rate
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <div
            className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 mt-4"
            role="alert"
          >
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm text-red-700 flex-1">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
