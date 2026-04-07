"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
  formatHoursPerWeek,
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

// Generate calendar days for the current and next month
function getCalendarDays(): { date: Date; dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = today.getFullYear();
  const month = today.getMonth();

  // Start from the first day of current month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  // Calculate days to show (current month + some of next month)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInNextMonth = new Date(year, month + 2, 0).getDate();

  const days: { date: Date; dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean }[] = [];

  // Add empty slots for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    const d = new Date(year, month, 1 - (startDayOfWeek - i));
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isPast: d < today,
    });
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      dayNum: i,
      isCurrentMonth: true,
      isPast: d < today,
    });
  }

  // Add days to complete the grid (6 rows * 7 = 42 days)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      dayNum: i,
      isCurrentMonth: false,
      isPast: false,
    });
  }

  return days;
}

function getMonthYearLabel(): string {
  const today = new Date();
  return today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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

  // Calendar data
  const calendarDays = useMemo(() => getCalendarDays(), []);
  const monthYearLabel = useMemo(() => getMonthYearLabel(), []);

  // Candidate info
  const candidateFirstName = getFirstName(candidate.displayName);
  const candidateTrack = getTrackLabel(candidate.metadata);
  const candidateLocation = [candidate.city, candidate.state].filter(Boolean).join(", ");
  const candidateHours = formatHoursPerWeek(candidate.metadata);
  const candidateCerts = candidate.metadata.certifications || [];

  // Pronoun helper (default to "they")
  const pronoun = "they";
  const pronounCap = "They";

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
  // Render: Candidate Card (Right Column)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderCandidateCard = (showScheduleSummary: boolean) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Photo and basic info */}
      <div className="flex flex-col items-center text-center">
        {candidate.imageUrl ? (
          <Image
            src={candidate.imageUrl}
            alt={candidate.displayName}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-primary-600">
              {candidate.displayName?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {candidate.displayName}
        </h3>

        {(candidateTrack || candidateLocation) && (
          <p className="mt-1 text-sm text-gray-500">
            {[candidateTrack, candidateLocation].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* Highlights */}
      {(candidateHours || candidateCerts.length > 0) && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="space-y-2">
            {candidateHours && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {candidateHours}
              </div>
            )}
            {candidateCerts.slice(0, 2).map((cert) => (
              <div key={cert} className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {cert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule summary (Step 2 only) */}
      {showScheduleSummary && selectedDate && selectedTime && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Your request
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              {format === "video" && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              )}
              {format === "phone" && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              )}
              {format === "in_person" && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              )}
              {format === "flexible" && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              )}
              <span className="capitalize">{format === "in_person" ? "In person" : format}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDateDisplay(selectedDate)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeSlot(selectedTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Step 1 - Schedule
  // ─────────────────────────────────────────────────────────────────────────────

  const renderScheduleStep = () => (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Column - Form */}
      <div className="flex-1 lg:pr-8 lg:border-r lg:border-gray-100">
        <div className="max-w-lg mx-auto lg:mx-0 py-6 lg:py-10">
          {/* Mobile: Compact candidate card */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {candidate.imageUrl ? (
                <Image
                  src={candidate.imageUrl}
                  alt={candidate.displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    {candidate.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{candidate.displayName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {[candidateTrack, candidateLocation].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
            When would you like to meet?
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {candidateFirstName} will confirm within 24 hours.
          </p>

          {/* Format */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Format
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    format === opt.value
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date
            </label>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-center mb-4">
                <span className="text-sm font-semibold text-gray-900">{monthYearLabel}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !day.isPast && setSelectedDate(day.dateStr)}
                    disabled={day.isPast}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                      ${day.isPast
                        ? "text-gray-300 cursor-not-allowed"
                        : selectedDate === day.dateStr
                          ? "bg-gray-900 text-white font-semibold"
                          : day.isCurrentMonth
                            ? "text-gray-900 hover:bg-gray-100"
                            : "text-gray-400 hover:bg-gray-50"
                      }
                    `}
                  >
                    {day.dayNum}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Time
            </label>
            <div className="relative">
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a time</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTimeSlot(slot)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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
              placeholder="Topics you'd like to cover..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Next button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToStep2}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl text-base font-semibold text-white transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Candidate Card (Desktop only) */}
      <div className="hidden lg:block w-80 pl-8 py-10">
        <div className="sticky top-6">
          {renderCandidateCard(false)}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Step 2 - Provider Info
  // ─────────────────────────────────────────────────────────────────────────────

  const renderInfoStep = () => (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Column - Form */}
      <div className="flex-1 lg:pr-8 lg:border-r lg:border-gray-100">
        <div className="max-w-lg mx-auto lg:mx-0 py-6 lg:py-10">
          {/* Mobile: Compact candidate card */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {candidate.imageUrl ? (
                <Image
                  src={candidate.imageUrl}
                  alt={candidate.displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    {candidate.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{candidate.displayName}</p>
                <p className="text-xs text-gray-500">
                  {formatDateDisplay(selectedDate)} · {formatTimeSlot(selectedTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
            Who should {candidateFirstName} expect?
          </h1>
          <p className="mt-2 text-base text-gray-500">
            We&apos;ll send your confirmation here.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name fields */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your name
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Work email */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Organization */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Company or facility name"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* City */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              City
            </label>
            <div ref={cityDropdownRef} className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setState("");
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Start typing a city..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {showCityDropdown && cityResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[240px] overflow-y-auto">
                  {cityResults.map((c) => (
                    <button
                      key={`${c.city}-${c.state}`}
                      type="button"
                      onClick={() => handleCitySelect(c.city, c.state)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span className="font-medium text-gray-700">{c.city}, {c.state}</span>
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
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl text-base font-semibold text-white transition-colors"
            >
              {submitting ? "Sending..." : "Send request"}
            </button>
          </div>

          {/* Back + Sign in */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
            <span className="text-sm text-gray-500">
              Have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  // TODO: Open sign in modal
                }}
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign in
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - Candidate Card (Desktop only) */}
      <div className="hidden lg:block w-80 pl-8 py-10">
        <div className="sticky top-6">
          {renderCandidateCard(true)}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Confirmation
  // ─────────────────────────────────────────────────────────────────────────────

  const renderConfirmation = () => (
    <div className="h-full flex items-center justify-center py-10">
      <div className="max-w-md mx-auto text-center px-4">
        {/* Success icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
          Request sent to {candidateFirstName}
        </h1>
        <p className="mt-3 text-base text-gray-500">
          {pronounCap}&apos;ll be in touch within 24 hours. Check your email to confirm and manage your request.
        </p>

        {/* Summary card */}
        <div className="mt-8 bg-gray-50 rounded-xl p-5 text-left">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Format</span>
              <span className="font-medium text-gray-900 capitalize">
                {format === "in_person" ? "In person" : format}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {formatDateDisplay(selectedDate)} · {formatTimeSlot(selectedTime)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">From</span>
              <span className="font-medium text-gray-900">{organization}</span>
            </div>
          </div>
        </div>

        {/* Email confirmation */}
        <div className="mt-4 py-3 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">Confirmation sent to</p>
          <p className="text-sm font-medium text-gray-900">{email}</p>
        </div>

        {/* Close button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
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
      size="fullscreen"
      hideHeader
    >
      <div className="h-full">
        {step === "schedule" && renderScheduleStep()}
        {step === "info" && renderInfoStep()}
        {step === "confirmation" && renderConfirmation()}
      </div>
    </Modal>
  );
}
