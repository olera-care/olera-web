"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/ui/Modal";
import UpgradeModal from "@/components/medjobs/UpgradeModal";
import { useCitySearch } from "@/hooks/use-city-search";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";
import type { StudentMetadata } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = "schedule" | "info" | "confirmation";

type InterviewFormat = "video" | "phone" | "in_person" | "flexible";

interface CandidateInfo {
  id: string;
  slug: string;
  displayName: string;
  imageUrl: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
}

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
  candidate: CandidateInfo;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: InterviewFormat; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "phone", label: "Phone" },
  { value: "in_person", label: "In person" },
  { value: "flexible", label: "Flexible" },
];

// Time slots from 8 AM to 6 PM in 30-min increments
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFirstName(name: string): string {
  return name?.split(" ")[0] || "This candidate";
}

function formatTimeSlot(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12}:00 ${period}` : `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Generate date options for next 30 days
function getDateOptions(): { value: string; label: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    let label: string;
    if (i === 0) {
      label = "Today";
    } else if (i === 1) {
      label = "Tomorrow";
    } else {
      label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
    }

    options.push({ value: dateStr, label });
  }

  return options;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Dropdown Component
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
}

function StyledDropdown({
  options,
  value,
  onChange,
  placeholder,
  label,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white border border-gray-200 rounded-xl px-4 py-3
          text-left text-sm transition-all min-h-[48px]
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${selectedOption ? "text-gray-900" : "text-gray-500"}
        `}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width: position.width,
          }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[100] max-h-[280px] overflow-y-auto overscroll-contain"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 text-left text-sm transition-colors min-h-[44px]
                ${opt.value === value
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function QuickScheduleModal({
  isOpen,
  onClose,
  onScheduled,
  candidate,
}: QuickScheduleModalProps) {
  // Step state
  const [step, setStep] = useState<Step>("schedule");

  // Step 1: Schedule data
  const [format, setFormat] = useState<InterviewFormat>("video");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2: Provider info
  const [organization, setOrganization] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<SelectedOrg | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [email, setEmail] = useState("");

  // City search
  const { results: cityResults } = useCitySearch(city);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const [cityDropdownPosition, setCityDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Update city dropdown position
  useEffect(() => {
    if (showCityDropdown && cityInputRef.current) {
      const rect = cityInputRef.current.getBoundingClientRect();
      setCityDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showCityDropdown]);

  // Close city dropdown on click outside
  useEffect(() => {
    if (!showCityDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        cityInputRef.current?.contains(e.target as Node) ||
        cityDropdownRef.current?.contains(e.target as Node)
      ) return;
      setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCityDropdown]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Date options
  const dateOptions = useMemo(() => getDateOptions(), []);
  const timeOptions = useMemo(() => TIME_SLOTS.map(slot => ({ value: slot, label: formatTimeSlot(slot) })), []);

  // Candidate info
  const candidateFirstName = getFirstName(candidate.displayName);

  // Validation
  const canProceedToStep2 = selectedDate && selectedTime;
  const canSubmit = organization.trim() && city.trim() && email.trim() && email.includes("@");

  // Handlers
  const handleNext = useCallback(() => {
    if (canProceedToStep2) {
      setStep("info");
      setError("");
    }
  }, [canProceedToStep2]);

  const handleBack = useCallback(() => {
    setStep("schedule");
    setError("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const proposedTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

      const res = await fetch("/api/medjobs/interviews/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: candidate.id,
          type: format === "flexible" ? "video" : format,
          proposedTime,
          notes: notes.trim() || undefined,
          provider: {
            email: email.trim().toLowerCase(),
            organization: organization.trim(),
            city: city.trim(),
            state: state.trim(),
            // Include selected org info for linking
            selectedOrgSlug: selectedOrg?.slug || null,
            selectedOrgSource: selectedOrg?.source || null,
            selectedOrgProviderId: selectedOrg?.providerId || null,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 402 || data.error === "upgrade_required") {
        setShowUpgradeModal(true);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Failed to send request. Please try again.");
        return;
      }

      setStep("confirmation");
      onScheduled?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedDate, selectedTime, format, notes, candidate.id, email, organization, city, state, selectedOrg]);

  const handleCitySelect = useCallback((selectedCity: string, selectedState: string) => {
    setCity(selectedCity);
    setState(selectedState);
    setShowCityDropdown(false);
  }, []);

  // Handle organization selection from autocomplete
  const handleOrgSelect = useCallback((org: SelectedOrg | null) => {
    setSelectedOrg(org);
    if (org) {
      // Auto-fill city from selected org
      if (org.city && org.state) {
        setCity(org.city);
        setState(org.state);
      } else {
        // Org doesn't have city/state - clear fields so user knows to fill them
        setCity("");
        setState("");
      }
    } else {
      // "Create new" selected - clear city/state so user must enter them
      setCity("");
      setState("");
    }
  }, []);

  // Reset on close
  const handleClose = useCallback(() => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep("schedule");
      setFormat("video");
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
      setOrganization("");
      setSelectedOrg(null);
      setCity("");
      setState("");
      setEmail("");
      setError("");
    }, 200);
  }, [onClose]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Step 1 - Schedule
  // ─────────────────────────────────────────────────────────────────────────────

  const renderScheduleStep = () => (
    <div className="pt-4 pb-6">
      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mt-4">
        Schedule an interview
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {candidateFirstName} will confirm within 24 hours.
      </p>

      {/* Format */}
      <div className="mt-7">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Format
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormat(opt.value)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                format === opt.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time - side by side */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Date
          </label>
          <StyledDropdown
            options={dateOptions}
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Select date"
            label="Select date"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Time
          </label>
          <StyledDropdown
            options={timeOptions}
            value={selectedTime}
            onChange={setSelectedTime}
            placeholder="Select time"
            label="Select time"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you'd like to discuss..."
          rows={2}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
        />
      </div>

      {/* Next button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceedToStep2}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-sm font-semibold text-white transition-colors min-h-[48px]"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Step 2 - Provider Info
  // ─────────────────────────────────────────────────────────────────────────────

  const renderInfoStep = () => (
    <div className="pt-4 pb-6">
      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mt-4">
        Your organization
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        We&apos;ll send confirmation to your email.
      </p>

      {error && (
        <div className="mt-5 p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Organization - Autocomplete */}
      <div className="mt-7">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Organization
        </label>
        <OrganizationSearch
          value={organization}
          onChange={(value) => {
            setOrganization(value);
            // Clear selected org when user types
            if (selectedOrg && value !== selectedOrg.name) {
              setSelectedOrg(null);
            }
          }}
          onSelect={handleOrgSelect}
          placeholder="Search or create new..."
        />
        {selectedOrg && (
          <p className="mt-2 text-sm text-primary-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selected: {selectedOrg.name}
          </p>
        )}
      </div>

      {/* City - auto-fills from org or manual entry */}
      <div className="mt-5">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-3">
          City
        </label>
        <div className="relative">
          <div className="relative">
            <input
              ref={cityInputRef}
              id="city"
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setState("");
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Start typing..."
              autoComplete="off"
              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[48px]"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {showCityDropdown && cityResults.length > 0 && createPortal(
            <div
              ref={cityDropdownRef}
              style={{
                position: "fixed",
                top: cityDropdownPosition.top,
                left: cityDropdownPosition.left,
                width: cityDropdownPosition.width,
              }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[100] max-h-[200px] overflow-y-auto overscroll-contain"
            >
              {cityResults.map((c) => (
                <button
                  key={`${c.city}-${c.state}`}
                  type="button"
                  onClick={() => handleCitySelect(c.city, c.state)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="text-gray-700">{c.city}, {c.state}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
          {state && (
            <p className="mt-2 text-sm text-gray-500">{city}, {state}</p>
          )}
        </div>
      </div>

      {/* Work email */}
      <div className="mt-5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
          Work email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organization.com"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[48px]"
        />
        <p className="mt-2 text-xs text-gray-500">We&apos;ll send interview details here</p>
      </div>

      {/* Submit button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-sm font-semibold text-white transition-colors min-h-[48px]"
        >
          {submitting ? "Sending..." : "Send request"}
        </button>
      </div>

      {/* Back link */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 px-4"
        >
          Back
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Confirmation
  // ─────────────────────────────────────────────────────────────────────────────

  const renderConfirmation = () => (
    <div className="py-8 text-center">
      {/* Email icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900">
        Check your email
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-[300px] mx-auto">
        We sent a verification link to{" "}
        <span className="font-semibold text-gray-900">{email}</span>.
        Click it to access your account and manage your interviews.
      </p>

      {/* Interview summary card */}
      <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-left">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold text-emerald-800">Request sent to {candidateFirstName}</span>
        </div>
        <div className="space-y-1.5 text-sm text-emerald-700">
          <div className="flex justify-between">
            <span>When</span>
            <span className="font-medium">{formatDateDisplay(selectedDate)}, {formatTimeSlot(selectedTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Format</span>
            <span className="font-medium capitalize">{format === "in_person" ? "In person" : format}</span>
          </div>
        </div>
      </div>

      {/* Close button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors min-h-[48px]"
        >
          Got it
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────

  // Step indicator dots component
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 pb-2">
      <div className={`w-2 h-2 rounded-full transition-colors ${step === "schedule" ? "bg-gray-900" : "bg-gray-200"}`} />
      <div className={`w-2 h-2 rounded-full transition-colors ${step === "info" ? "bg-gray-900" : "bg-gray-200"}`} />
    </div>
  );

  if (showUpgradeModal) {
    return <UpgradeModal creditsUsed={3} onClose={handleClose} />;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      hideHeader
    >
      {step === "schedule" && renderScheduleStep()}
      {step === "info" && renderInfoStep()}
      {step === "confirmation" && renderConfirmation()}
    </Modal>
  );
}
