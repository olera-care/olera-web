"use client";

import { useState, useMemo, useRef } from "react";
import OleraSelect from "./OleraSelect";

/* ─── Types ───────────────────────────────────────────────── */

export interface TimeSlot {
  start: string; // "9:00 AM"
  end: string;   // "3:00 PM"
}

export interface AvailabilityFormState {
  mode: "fixed" | "flexible" | null;
  fixedSlots: Record<string, string[]>;
  flexDays: string[];
  flexTimes: string[];
  responseTime: string;
  advanceNotice: string;
  /* Calendar-based */
  dateSlots: Record<string, TimeSlot[]>;     // "2026-05-14" -> slots
  recurringDays: Record<string, TimeSlot[]>; // "Tue" -> slots (every Tuesday)
  /* Visit duration */
  minVisit: string;
  maxVisit: string;
  overnightVisits: boolean;
  /* Rate */
  hourlyRate: number;
  overnightRate: number;
  showOvernightRate: boolean;
  /* Travel */
  zipCode: string;
  travelDistance: number;
  transportation: string;
  /* Driver's license */
  willDrive: boolean;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  licenseFrontPreview: string | null;
  licenseBackPreview: string | null;
  licenseFrontFile: File | null;
  licenseBackFile: File | null;
  insuranceCarrier: string;
  insurancePolicyNumber: string;
  insuranceCardPreview: string | null;
  insuranceCardFile: File | null;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  driveAcknowledgment: boolean;
}

export const INITIAL_AVAILABILITY: AvailabilityFormState = {
  mode: "fixed",
  fixedSlots: {},
  flexDays: [],
  flexTimes: [],
  responseTime: "",
  advanceNotice: "",
  dateSlots: {},
  recurringDays: {},
  minVisit: "2 hours",
  maxVisit: "4 hours",
  overnightVisits: false,
  hourlyRate: 20,
  overnightRate: 25,
  showOvernightRate: false,
  zipCode: "",
  travelDistance: 15,
  transportation: "",
  willDrive: false,
  licenseNumber: "",
  licenseState: "TX",
  licenseExpiry: "",
  licenseFrontPreview: null,
  licenseBackPreview: null,
  licenseFrontFile: null,
  licenseBackFile: null,
  insuranceCarrier: "",
  insurancePolicyNumber: "",
  insuranceCardPreview: null,
  insuranceCardFile: null,
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  driveAcknowledgment: false,
};

/* ─── Option Data ─────────────────────────────────────────── */

const TIMES = [
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM", "11:00 PM",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL: Record<string, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MIN_VISIT_OPTIONS = ["1 hour", "2 hours", "3 hours", "4 hours"];
const MAX_VISIT_OPTIONS = ["2 hours", "3 hours", "4 hours", "6 hours", "8 hours", "Full day (8+ hours)"];

const TRANSPORT_OPTIONS = [
  { value: "own_car", label: "I drive my own car" },
  { value: "shared_car", label: "I drive but don't have a car (Zipcar, etc.)" },
  { value: "transit", label: "I take public transit" },
  { value: "walk_bike", label: "I walk or bike (close-distance visits only)" },
];

/* ─── Helpers ─────────────────────────────────────────────── */

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDayName(year: number, month: number, day: number) {
  return DAY_NAMES[new Date(year, month, day).getDay()];
}

/* ─── Shared UI ───────────────────────────────────────────── */

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
      <h3 className="text-lg font-semibold text-gray-900 mb-0.5">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary-500" : "bg-gray-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

/* ─── Component ───────────────────────────────────────────── */

export default function Step6Availability({
  availability,
  setAvailability,
  careSpecialties,
  onBack,
  onContinue,
}: {
  availability: AvailabilityFormState;
  setAvailability: React.Dispatch<React.SetStateAction<AvailabilityFormState>>;
  careSpecialties?: string[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const licenseFrontRef = useRef<HTMLInputElement>(null);
  const licenseBackRef = useRef<HTMLInputElement>(null);
  const insuranceCardRef = useRef<HTMLInputElement>(null);

  const showDriverSection = availability.willDrive || (careSpecialties || []).includes("Transportation");

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newStart, setNewStart] = useState("9:00 AM");
  const [newEnd, setNewEnd] = useState("3:00 PM");

  const set = <K extends keyof AvailabilityFormState>(key: K, value: AvailabilityFormState[K]) => {
    setAvailability((s) => ({ ...s, [key]: value }));
  };

  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  /* Which dates have slots (either direct or via recurring) */
  const getSlotsForDate = (dk: string): TimeSlot[] => {
    const direct = availability.dateSlots[dk] || [];
    // Check recurring
    const [y, m, d] = dk.split("-").map(Number);
    const dayName = DAY_NAMES[new Date(y, m - 1, d).getDay()];
    const recurring = availability.recurringDays[dayName] || [];
    // Merge: direct takes priority, add recurring if no direct
    return direct.length > 0 ? direct : recurring;
  };

  const hasSlots = (dk: string) => getSlotsForDate(dk).length > 0;

  /* Add time slot to selected date */
  const addSlot = () => {
    if (!selectedDate) return;
    setAvailability((s) => {
      const current = s.dateSlots[selectedDate] || [];
      return {
        ...s,
        dateSlots: {
          ...s.dateSlots,
          [selectedDate]: [...current, { start: newStart, end: newEnd }],
        },
      };
    });
    setAddingSlot(false);
  };

  /* Remove a slot */
  const removeSlot = (dk: string, index: number) => {
    setAvailability((s) => {
      const current = [...(s.dateSlots[dk] || [])];
      current.splice(index, 1);
      return {
        ...s,
        dateSlots: { ...s.dateSlots, [dk]: current },
      };
    });
  };

  /* Toggle recurring */
  const selectedDayName = selectedDate
    ? DAY_NAMES[new Date(...selectedDate.split("-").map(Number) as [number, number, number]).getDay()]
    : null;
  // Fix: Date constructor months are 0-indexed
  const getSelectedDayName = () => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return DAY_NAMES[new Date(y, m - 1, d).getDay()];
  };
  const selDayName = getSelectedDayName();
  const isRecurring = selDayName ? (availability.recurringDays[selDayName] || []).length > 0 : false;

  const toggleRecurring = () => {
    if (!selectedDate || !selDayName) return;
    setAvailability((s) => {
      const directSlots = s.dateSlots[selectedDate] || [];
      if (isRecurring) {
        // Turn off recurring
        const newRecurring = { ...s.recurringDays };
        delete newRecurring[selDayName];
        return { ...s, recurringDays: newRecurring };
      } else {
        // Turn on recurring — copy current date's slots to recurring
        return {
          ...s,
          recurringDays: { ...s.recurringDays, [selDayName]: directSlots.length > 0 ? directSlots : [{ start: "9:00 AM", end: "3:00 PM" }] },
        };
      }
    });
  };

  /* Earnings estimate */
  const estimateWeeklyHours = () => {
    // Count recurring days + unique date slots in current week
    const recurringCount = Object.values(availability.recurringDays).reduce(
      (sum, slots) => sum + slots.reduce((s, slot) => {
        const si = TIMES.indexOf(slot.start);
        const ei = TIMES.indexOf(slot.end);
        return s + Math.max((ei - si) * 0.5, 1);
      }, 0),
      0
    );
    const dateCount = Object.values(availability.dateSlots).reduce(
      (sum, slots) => sum + slots.reduce((s, slot) => {
        const si = TIMES.indexOf(slot.start);
        const ei = TIMES.indexOf(slot.end);
        return s + Math.max((ei - si) * 0.5, 1);
      }, 0),
      0
    );
    return Math.max(Math.round(recurringCount + dateCount / 4), 5);
  };

  const weeklyHours = estimateWeeklyHours();

  /* Selected date display info */
  const selectedDateObj = selectedDate
    ? (() => { const [y, m, d] = selectedDate.split("-").map(Number); return new Date(y, m - 1, d); })()
    : null;
  const selectedDateLabel = selectedDateObj
    ? `${DAY_FULL[DAY_NAMES[selectedDateObj.getDay()]]}, ${MONTH_NAMES[selectedDateObj.getMonth()]} ${selectedDateObj.getDate()}`
    : "";
  const selectedSlots = selectedDate ? (availability.dateSlots[selectedDate] || []) : [];
  const selectedRecurringSlots = selDayName ? (availability.recurringDays[selDayName] || []) : [];
  const displaySlots = selectedSlots.length > 0 ? selectedSlots : selectedRecurringSlots;

  /* Is date in the past? */
  const isPast = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  /* Recurring summary */
  const recurringDaysList = Object.keys(availability.recurringDays).filter(
    (d) => (availability.recurringDays[d] || []).length > 0
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          When are you available?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Select dates on the calendar and add your available times. You can update this anytime.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Calendar ── */}
        <SectionCard title="Your availability" subtitle="Tap a date to add your available hours.">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h4 className="text-sm font-semibold text-gray-900">
              {MONTH_NAMES[calMonth]} {calYear}
            </h4>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dk = dateKey(calYear, calMonth, day);
              const isSelected = selectedDate === dk;
              const has = hasSlots(dk);
              const past = isPast(day);
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              // Check if this day's name is in recurring
              const dayName = getDayName(calYear, calMonth, day);
              const isRecurringDay = (availability.recurringDays[dayName] || []).length > 0;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  onClick={() => setSelectedDate(isSelected ? null : dk)}
                  className={`relative h-11 rounded-lg text-sm font-medium transition-all ${
                    past
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary-600 text-white shadow-sm"
                      : has || isRecurringDay
                      ? "bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100"
                      : isToday
                      ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {day}
                  {(has || (isRecurringDay && !past)) && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Recurring days summary */}
          {recurringDaysList.length > 0 && !selectedDate && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Recurring availability:</p>
              <div className="flex flex-wrap gap-1.5">
                {recurringDaysList.map((d) => {
                  const slots = availability.recurringDays[d];
                  return (
                    <div key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs">
                      <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                      </svg>
                      <span className="font-medium text-primary-700">Every {DAY_FULL[d]}</span>
                      <span className="text-primary-500">{slots.map((s) => `${s.start} – ${s.end}`).join(", ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Selected date panel ── */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{selectedDateLabel}</h4>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Existing time slots */}
              {displaySlots.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {displaySlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-sm font-medium text-primary-800">{slot.start} &ndash; {slot.end}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(selectedDate, idx)}
                        className="w-6 h-6 rounded-full hover:bg-primary-100 flex items-center justify-center text-primary-400 hover:text-error-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3">No times added yet.</p>
              )}

              {/* Add time slot form */}
              {addingSlot ? (
                <div className="space-y-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Start time</label>
                      <OleraSelect value={newStart} onChange={setNewStart} options={TIMES} placeholder="Start..." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">End time</label>
                      <OleraSelect value={newEnd} onChange={setNewEnd} options={TIMES} placeholder="End..." />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addSlot}
                      className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
                    >
                      Add time
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingSlot(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingSlot(true)}
                  className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add a time slot
                </button>
              )}

              {/* Recurring toggle */}
              {selDayName && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Toggle
                    enabled={isRecurring}
                    onChange={toggleRecurring}
                    label={`Repeat every ${DAY_FULL[selDayName]}`}
                  />
                  {isRecurring && (
                    <p className="text-xs text-primary-500 mt-1.5 ml-14">
                      This time will automatically apply to all {DAY_FULL[selDayName]}s.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Visit preferences ── */}
        <SectionCard title="Visit preferences" subtitle="What types of visits work for you?">
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum visit length</label>
              <OleraSelect
                value={availability.minVisit}
                onChange={(v) => set("minVisit", v)}
                options={MIN_VISIT_OPTIONS}
                placeholder="Select minimum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum visit length</label>
              <OleraSelect
                value={availability.maxVisit}
                onChange={(v) => set("maxVisit", v)}
                options={MAX_VISIT_OPTIONS}
                placeholder="Select maximum"
              />
            </div>
          </div>

          <Toggle
            enabled={availability.overnightVisits}
            onChange={(v) => set("overnightVisits", v)}
            label="I'm comfortable with overnight visits"
          />
        </SectionCard>

        {/* ── Hourly rate ── */}
        <SectionCard title="Set your hourly rate" subtitle="Most Olera caregivers charge between $15 and $25 per hour. You can adjust this anytime.">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">$15</span>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900">${availability.hourlyRate}</span>
                <span className="text-sm text-gray-500">/hour</span>
              </div>
              <span className="text-xs text-gray-400">$30</span>
            </div>
            <input
              type="range"
              min={15}
              max={30}
              step={1}
              value={availability.hourlyRate}
              onChange={(e) => set("hourlyRate", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
            />
            <p className="text-xs text-gray-400 mt-3">
              Tip: Start at $20 and raise your rate after you&apos;ve built up reviews and visit count.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Toggle
              enabled={availability.showOvernightRate}
              onChange={(v) => set("showOvernightRate", v)}
              label="Charge a different rate for overnight visits"
            />
            {availability.showOvernightRate && (
              <div className="mt-4 ml-14">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">$20</span>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">${availability.overnightRate}</span>
                    <span className="text-sm text-gray-500">/hour overnight</span>
                  </div>
                  <span className="text-xs text-gray-400">$40</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={40}
                  step={1}
                  value={availability.overnightRate}
                  onChange={(e) => set("overnightRate", Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Travel and transportation ── */}
        <SectionCard title="Travel and transportation" subtitle="Helps us match you with nearby families.">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your home zip code</label>
            <input
              type="text"
              value={availability.zipCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                set("zipCode", v);
              }}
              placeholder="77001"
              className="w-full max-w-[200px] px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">How far are you willing to travel?</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={25}
                step={5}
                value={availability.travelDistance}
                onChange={(e) => set("travelDistance", Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              />
              <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                {availability.travelDistance === 25 ? "25+" : availability.travelDistance} miles
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">I&apos;m flexible &mdash; match me with families in my area.</p>
          </div>

          {/* Will you drive toggle */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Toggle
              enabled={availability.willDrive}
              onChange={(v) => set("willDrive", v)}
              label="I'll provide transportation for families (driving to appointments, errands, etc.)"
            />
          </div>
        </SectionCard>

        {/* ── Driver's license & insurance ── */}
        {showDriverSection && (
          <SectionCard title="Driver's license and insurance" subtitle="Required when you offer transportation services. Keeps families and you protected.">
            {/* License info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver&apos;s license number</label>
                <input
                  type="text"
                  value={availability.licenseNumber}
                  onChange={(e) => set("licenseNumber", e.target.value)}
                  placeholder="License number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <OleraSelect
                    value={availability.licenseState}
                    onChange={(v) => set("licenseState", v || "TX")}
                    options={["TX", "LA", "OK", "AR", "NM"]}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration</label>
                  <input
                    type="date"
                    value={availability.licenseExpiry}
                    onChange={(e) => set("licenseExpiry", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* License photo uploads */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload your driver&apos;s license</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Front */}
                <div>
                  <input ref={licenseFrontRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      set("licenseFrontFile", f); set("licenseFrontPreview", URL.createObjectURL(f));
                    }}
                  />
                  {availability.licenseFrontPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={availability.licenseFrontPreview} alt="License front" className="w-full h-28 object-contain" />
                      <button
                        type="button"
                        onClick={() => { set("licenseFrontFile", null); set("licenseFrontPreview", null); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => licenseFrontRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                      <p className="text-xs font-medium text-gray-600">Front of license</p>
                    </div>
                  )}
                </div>
                {/* Back */}
                <div>
                  <input ref={licenseBackRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      set("licenseBackFile", f); set("licenseBackPreview", URL.createObjectURL(f));
                    }}
                  />
                  {availability.licenseBackPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={availability.licenseBackPreview} alt="License back" className="w-full h-28 object-contain" />
                      <button
                        type="button"
                        onClick={() => { set("licenseBackFile", null); set("licenseBackPreview", null); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => licenseBackRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                      <p className="text-xs font-medium text-gray-600">Back of license</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auto insurance */}
            <div className="mb-5 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Auto insurance</h4>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance carrier</label>
                  <input
                    type="text"
                    value={availability.insuranceCarrier}
                    onChange={(e) => set("insuranceCarrier", e.target.value)}
                    placeholder="e.g. State Farm, GEICO"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy number</label>
                  <input
                    type="text"
                    value={availability.insurancePolicyNumber}
                    onChange={(e) => set("insurancePolicyNumber", e.target.value)}
                    placeholder="Policy number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
              {/* Insurance card upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance card photo</label>
                <input ref={insuranceCardRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    set("insuranceCardFile", f); set("insuranceCardPreview", URL.createObjectURL(f));
                  }}
                />
                {availability.insuranceCardPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-w-xs">
                    <img src={availability.insuranceCardPreview} alt="Insurance card" className="w-full h-28 object-contain" />
                    <button
                      type="button"
                      onClick={() => { set("insuranceCardFile", null); set("insuranceCardPreview", null); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => insuranceCardRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors max-w-xs"
                  >
                    <svg className="w-6 h-6 text-gray-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-xs font-medium text-gray-600">Upload insurance card</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle info */}
            <div className="mb-5 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle information</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Make</label>
                  <input
                    type="text"
                    value={availability.vehicleMake}
                    onChange={(e) => set("vehicleMake", e.target.value)}
                    placeholder="Toyota"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                  <input
                    type="text"
                    value={availability.vehicleModel}
                    onChange={(e) => set("vehicleModel", e.target.value)}
                    placeholder="Camry"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                  <input
                    type="text"
                    value={availability.vehicleYear}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); set("vehicleYear", v); }}
                    placeholder="2020"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="pt-5 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability.driveAcknowledgment}
                  onChange={(e) => set("driveAcknowledgment", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I have a valid driver&apos;s license and current auto insurance. I will maintain both while providing transportation services on Olera.
                </span>
              </label>
            </div>
          </SectionCard>
        )}

        {/* ── Earnings preview ── */}
        <div className="bg-gradient-to-br from-primary-50 to-vanilla-50 rounded-2xl border border-primary-100 p-5 sm:p-7">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Your earnings estimate</h3>
              <p className="text-xs text-gray-500 mt-0.5">Based on your availability and rate</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Casual (5 hrs)</p>
              <p className="text-lg font-bold text-gray-900">${5 * availability.hourlyRate}</p>
              <p className="text-[10px] text-gray-400">/week</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center ring-2 ring-primary-200">
              <p className="text-xs text-primary-600 font-medium mb-1">Your estimate</p>
              <p className="text-lg font-bold text-primary-700">${Math.round(weeklyHours * availability.hourlyRate)}</p>
              <p className="text-[10px] text-primary-500">~{weeklyHours} hrs/week</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Active (20 hrs)</p>
              <p className="text-lg font-bold text-gray-900">${20 * availability.hourlyRate}</p>
              <p className="text-[10px] text-gray-400">/week</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Most caregivers earn $200&ndash;$600/week working around their classes.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors order-2 sm:order-1"
        >
          Save and continue later
        </button>
        <button
          onClick={onContinue}
          className="order-1 sm:order-2 w-full sm:w-auto px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
        >
          Continue to review
        </button>
      </div>
    </div>
  );
}
