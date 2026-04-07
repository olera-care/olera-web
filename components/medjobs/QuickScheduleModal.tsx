"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
} from "@/lib/medjobs-helpers";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
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

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto overscroll-contain"
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
        </div>
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // City search
  const { results: cityResults } = useCitySearch(city);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Date options
  const dateOptions = useMemo(() => getDateOptions(), []);
  const timeOptions = useMemo(() => TIME_SLOTS.map(slot => ({ value: slot, label: formatTimeSlot(slot) })), []);

  // Candidate info
  const candidateFirstName = getFirstName(candidate.displayName);
  const candidateTrack = getTrackLabel(candidate.metadata);
  const candidateLocation = [candidate.city, candidate.state].filter(Boolean).join(", ");

  // Validation
  const canProceedToStep2 = selectedDate && selectedTime;
  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && organization.trim() && city.trim();

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
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            organization: organization.trim(),
            city: city.trim(),
            state: state.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send request. Please try again.");
        return;
      }

      setStep("confirmation");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedDate, selectedTime, format, notes, candidate.id, firstName, lastName, email, organization, city, state]);

  const handleCitySelect = useCallback((selectedCity: string, selectedState: string) => {
    setCity(selectedCity);
    setState(selectedState);
    setShowCityDropdown(false);
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
      setFirstName("");
      setLastName("");
      setEmail("");
      setOrganization("");
      setCity("");
      setState("");
      setError("");
    }, 200);
  }, [onClose]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Step 1 - Schedule
  // ─────────────────────────────────────────────────────────────────────────────

  const renderScheduleStep = () => (
    <div className="pt-4 pb-6">
      {/* Candidate preview */}
      <div className="flex items-center gap-3 mb-8">
        {candidate.imageUrl ? (
          <Image
            src={candidate.imageUrl}
            alt={candidate.displayName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center ring-2 ring-white shadow-sm">
            <span className="text-lg font-semibold text-primary-600">
              {candidate.displayName?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{candidate.displayName}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {[candidateTrack, candidateLocation].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900">
        Schedule an interview
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {candidateFirstName} will confirm within 24 hours.
      </p>

      {/* Format */}
      <div className="mt-7">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Notes <span className="font-normal normal-case text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you'd like to discuss..."
          rows={2}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white resize-none transition-colors"
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
      {/* Summary pill */}
      <div className="flex items-center gap-2 mb-8 px-4 py-3 bg-gray-50 rounded-xl text-sm">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="text-gray-600">
          <span className="capitalize">{format === "in_person" ? "In person" : format}</span>
          <span className="mx-1.5 text-gray-300">·</span>
          {formatDateDisplay(selectedDate)}
          <span className="mx-1.5 text-gray-300">·</span>
          {formatTimeSlot(selectedTime)}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900">
        Your details
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        We&apos;ll send confirmation to your email.
      </p>

      {error && (
        <div className="mt-5 p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Name fields */}
      <div className="mt-7 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[48px]"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[48px]"
          />
        </div>
      </div>

      {/* Work email */}
      <div className="mt-5">
        <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Work email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[48px]"
        />
      </div>

      {/* Organization */}
      <div className="mt-5">
        <label htmlFor="organization" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Organization
        </label>
        <input
          id="organization"
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Company or facility name"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[48px]"
        />
      </div>

      {/* City */}
      <div className="mt-5">
        <label htmlFor="city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          City
        </label>
        <div ref={cityDropdownRef} className="relative">
          <input
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
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[48px]"
          />
          {showCityDropdown && cityResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-[200px] overflow-y-auto overscroll-contain">
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
            </div>
          )}
          {state && (
            <p className="mt-2 text-sm text-gray-500">{city}, {state}</p>
          )}
        </div>
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
      {/* Success icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900">
        Request sent!
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-[280px] mx-auto">
        {candidateFirstName} will review and confirm within 24 hours.
      </p>

      {/* Summary */}
      <div className="mt-8 bg-gray-50 rounded-xl p-5 text-left">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">With</span>
            <span className="font-medium text-gray-900">{candidate.displayName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">When</span>
            <span className="font-medium text-gray-900">
              {formatDateDisplay(selectedDate)}, {formatTimeSlot(selectedTime)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Format</span>
            <span className="font-medium text-gray-900 capitalize">
              {format === "in_person" ? "In person" : format}
            </span>
          </div>
        </div>
      </div>

      {/* Email note */}
      <p className="mt-5 text-xs text-gray-400">
        Confirmation sent to {email}
      </p>

      {/* Close button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-900 transition-colors min-h-[48px]"
        >
          Done
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      hideHeader
    >
      {step === "schedule" && renderScheduleStep()}
      {step === "info" && renderInfoStep()}
      {step === "confirmation" && renderConfirmation()}
    </Modal>
  );
}
