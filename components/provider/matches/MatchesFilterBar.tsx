"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

// ── Filter Types ──

export interface MatchesFilters {
  location: string | null; // null = all locations, string = specific city
  services: string[];
  payment: string[];
  timeline: "all" | "immediate" | "within_1_month" | "exploring";
}

export const DEFAULT_FILTERS: MatchesFilters = {
  location: null,
  services: [],
  payment: [],
  timeline: "all",
};

// ── Filter Options ──

export const SERVICE_OPTIONS = [
  { id: "home_care", label: "Home Care" },
  { id: "memory_care", label: "Memory Care" },
  { id: "assisted_living", label: "Assisted Living" },
  { id: "skilled_nursing", label: "Skilled Nursing" },
  { id: "independent_living", label: "Independent Living" },
  { id: "respite_care", label: "Respite Care" },
  { id: "hospice", label: "Hospice" },
  { id: "adult_day_care", label: "Adult Day Care" },
];

export const PAYMENT_OPTIONS = [
  { id: "medicaid", label: "Medicaid" },
  { id: "private_pay", label: "Private Pay" },
  { id: "va_benefits", label: "VA Benefits" },
  { id: "medicare", label: "Medicare" },
  { id: "long_term_care_insurance", label: "Long-Term Care Insurance" },
  { id: "aid_attendance", label: "Aid & Attendance" },
];

export const TIMELINE_OPTIONS = [
  { id: "all", label: "All timelines" },
  { id: "immediate", label: "Immediate" },
  { id: "within_1_month", label: "Within 1 month" },
  { id: "exploring", label: "Exploring" },
] as const;

// ── Icons ──

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function LocationIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ── Dropdown Menu Component ──

interface DropdownProps {
  trigger: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

function Dropdown({ trigger, isOpen, onOpenChange, children, align = "left" }: DropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => onOpenChange(false), isOpen);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      {trigger}
      {isOpen && (
        <div
          className={`absolute top-[calc(100%+8px)] ${align === "right" ? "right-0" : "left-0"} w-72 bg-white rounded-2xl shadow-lg border border-gray-200/80 py-2 z-50 animate-fade-in`}
          style={{ maxHeight: "320px", overflowY: "auto" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Filter Chip Button ──

interface FilterChipProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  badgeCount?: number;
  onClick: () => void;
}

function FilterChip({ label, icon, isActive, badgeCount, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-4 lg:px-5 py-2.5 lg:py-3 rounded-full text-[13px] lg:text-sm font-medium whitespace-nowrap",
        "transition-all duration-150 min-h-[40px] lg:min-h-[44px] flex items-center gap-2",
        "bg-white border shadow-sm",
        isActive
          ? "text-gray-900 border-2 border-primary-400"
          : "text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
      <ChevronDownIcon className={`w-3.5 h-3.5 ${isActive ? "text-gray-600" : "text-gray-400"}`} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badgeCount}
        </span>
      )}
    </button>
  );
}

// ── Main Component ──

interface MatchesFilterBarProps {
  filters: MatchesFilters;
  onChange: (filters: MatchesFilters) => void;
  resultCount: number;
  providerLocation: string | null; // e.g., "Houston, TX"
  onOpenSheet?: (type: "location" | "services" | "payment" | "timeline") => void;
}

export default function MatchesFilterBar({
  filters,
  onChange,
  resultCount,
  providerLocation,
  onOpenSheet,
}: MatchesFilterBarProps) {
  // Desktop dropdown states
  const [locationOpen, setLocationOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const closeAll = useCallback(() => {
    setLocationOpen(false);
    setServicesOpen(false);
    setPaymentOpen(false);
    setTimelineOpen(false);
  }, []);

  // Check if any filters are active
  const hasActiveFilters =
    filters.location !== null ||
    filters.services.length > 0 ||
    filters.payment.length > 0 ||
    filters.timeline !== "all";

  const clearAllFilters = () => {
    onChange(DEFAULT_FILTERS);
  };

  // Location label
  const locationLabel = filters.location || providerLocation || "All locations";

  // Timeline label
  const timelineLabel = TIMELINE_OPTIONS.find((t) => t.id === filters.timeline)?.label || "All timelines";

  // Services label
  const servicesLabel =
    filters.services.length === 0
      ? "Services"
      : filters.services.length === 1
        ? SERVICE_OPTIONS.find((s) => s.id === filters.services[0])?.label || "1 service"
        : `${filters.services.length} services`;

  // Payment label
  const paymentLabel =
    filters.payment.length === 0
      ? "Payment"
      : filters.payment.length === 1
        ? PAYMENT_OPTIONS.find((p) => p.id === filters.payment[0])?.label || "1 method"
        : `${filters.payment.length} methods`;

  // Toggle helpers for multi-select
  const toggleService = (id: string) => {
    const newServices = filters.services.includes(id)
      ? filters.services.filter((s) => s !== id)
      : [...filters.services, id];
    onChange({ ...filters, services: newServices });
  };

  const togglePayment = (id: string) => {
    const newPayment = filters.payment.includes(id)
      ? filters.payment.filter((p) => p !== id)
      : [...filters.payment, id];
    onChange({ ...filters, payment: newPayment });
  };

  // Mobile: detect and use bottom sheets
  const handleMobileClick = (type: "location" | "services" | "payment" | "timeline") => {
    if (onOpenSheet) {
      onOpenSheet(type);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main filter row */}
      <div className="flex items-center justify-between gap-3">
        {/* Desktop: dropdown triggers */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Location */}
          <Dropdown
            isOpen={locationOpen}
            onOpenChange={(open) => {
              if (open) closeAll();
              setLocationOpen(open);
            }}
            trigger={
              <FilterChip
                label={locationLabel}
                icon={<LocationIcon className="w-4 h-4 text-gray-400" />}
                isActive={filters.location !== null}
                onClick={() => {
                  closeAll();
                  setLocationOpen(!locationOpen);
                }}
              />
            }
          >
            <div className="px-2 py-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Location
              </p>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...filters, location: null });
                  setLocationOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 transition-colors ${
                  filters.location === null ? "bg-primary-50 text-primary-700" : "text-gray-900"
                }`}
              >
                {filters.location === null && <CheckIcon className="w-4 h-4 text-primary-600 shrink-0" />}
                {filters.location !== null && <span className="w-4" />}
                All locations
              </button>
              {providerLocation && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, location: providerLocation });
                    setLocationOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 transition-colors ${
                    filters.location === providerLocation ? "bg-primary-50 text-primary-700" : "text-gray-900"
                  }`}
                >
                  {filters.location === providerLocation && <CheckIcon className="w-4 h-4 text-primary-600 shrink-0" />}
                  {filters.location !== providerLocation && <span className="w-4" />}
                  {providerLocation}
                </button>
              )}
            </div>
          </Dropdown>

          {/* Services */}
          <Dropdown
            isOpen={servicesOpen}
            onOpenChange={(open) => {
              if (open) closeAll();
              setServicesOpen(open);
            }}
            trigger={
              <FilterChip
                label={servicesLabel}
                isActive={filters.services.length > 0}
                badgeCount={filters.services.length > 0 ? filters.services.length : undefined}
                onClick={() => {
                  closeAll();
                  setServicesOpen(!servicesOpen);
                }}
              />
            }
          >
            <div className="px-2 py-1">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Services
                </p>
                {filters.services.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, services: [] })}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              {SERVICE_OPTIONS.map((opt) => {
                const isSelected = filters.services.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleService(opt.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Dropdown>

          {/* Payment */}
          <Dropdown
            isOpen={paymentOpen}
            onOpenChange={(open) => {
              if (open) closeAll();
              setPaymentOpen(open);
            }}
            trigger={
              <FilterChip
                label={paymentLabel}
                isActive={filters.payment.length > 0}
                badgeCount={filters.payment.length > 0 ? filters.payment.length : undefined}
                onClick={() => {
                  closeAll();
                  setPaymentOpen(!paymentOpen);
                }}
              />
            }
          >
            <div className="px-2 py-1">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Payment
                </p>
                {filters.payment.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, payment: [] })}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              {PAYMENT_OPTIONS.map((opt) => {
                const isSelected = filters.payment.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePayment(opt.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Dropdown>

          {/* Timeline */}
          <Dropdown
            isOpen={timelineOpen}
            onOpenChange={(open) => {
              if (open) closeAll();
              setTimelineOpen(open);
            }}
            trigger={
              <FilterChip
                label={timelineLabel}
                isActive={filters.timeline !== "all"}
                onClick={() => {
                  closeAll();
                  setTimelineOpen(!timelineOpen);
                }}
              />
            }
          >
            <div className="px-2 py-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Timeline
              </p>
              {TIMELINE_OPTIONS.map((opt) => {
                const isSelected = filters.timeline === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange({ ...filters, timeline: opt.id });
                      setTimelineOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-primary-50 text-primary-700" : "text-gray-900"
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-4 h-4 text-primary-600 shrink-0" />}
                    {!isSelected && <span className="w-4" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Dropdown>
        </div>

        {/* Mobile: horizontal scroll filter chips */}
        <div className="lg:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide flex-1">
          <div className="flex gap-2.5 w-max">
            {/* Location */}
            <FilterChip
              label={locationLabel}
              icon={<LocationIcon className="w-4 h-4 text-gray-400" />}
              isActive={filters.location !== null}
              onClick={() => handleMobileClick("location")}
            />

            {/* Services */}
            <FilterChip
              label={servicesLabel}
              isActive={filters.services.length > 0}
              badgeCount={filters.services.length > 0 ? filters.services.length : undefined}
              onClick={() => handleMobileClick("services")}
            />

            {/* Payment */}
            <FilterChip
              label={paymentLabel}
              isActive={filters.payment.length > 0}
              badgeCount={filters.payment.length > 0 ? filters.payment.length : undefined}
              onClick={() => handleMobileClick("payment")}
            />

            {/* Timeline */}
            <FilterChip
              label={timelineLabel}
              isActive={filters.timeline !== "all"}
              onClick={() => handleMobileClick("timeline")}
            />
          </div>
        </div>

        {/* Clear all (desktop) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all
          </button>
        )}
      </div>

      {/* Result count row */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-[15px] lg:text-base text-gray-600">
          <span className="font-display font-bold text-gray-900">{resultCount}</span>
          {" "}{resultCount === 1 ? "match" : "matches"}
          {filters.location ? (
            <span className="text-gray-500"> in {filters.location}</span>
          ) : (
            <span className="text-gray-500"> available</span>
          )}
        </p>

        {/* Clear all (mobile) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="lg:hidden text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
