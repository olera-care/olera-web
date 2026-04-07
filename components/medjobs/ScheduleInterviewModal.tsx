"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";

export interface ScheduleFormData {
  type: "video" | "in_person" | "phone";
  date: string;
  time: string;
  altDate?: string;
  altTime?: string;
  notes?: string;
}

interface ScheduleInterviewModalProps {
  /** Provider → Student: pass the student's profile ID */
  studentProfileId?: string;
  /** Student → Provider: pass the provider's profile ID */
  providerProfileId?: string;
  /** Name of the other party (shown in the modal header) */
  otherName: string;
  onClose: () => void;
  onScheduled: () => void;
  /** If true, user needs auth before submitting */
  requiresAuth?: boolean;
  /** Called when unauthenticated user tries to submit - saves form data and triggers auth */
  onAuthRequired?: (data: ScheduleFormData) => void;
  /** Pre-fill form with saved data (e.g., after returning from auth) */
  initialValues?: ScheduleFormData;
}

const INTERVIEW_TYPES = [
  {
    value: "video" as const,
    label: "Video",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    value: "phone" as const,
    label: "Phone",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
  {
    value: "in_person" as const,
    label: "In person",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
];

// Generate next 14 days for the day picker
function getNextDays(count: number): { date: Date; dateStr: string; dayName: string; dayNum: number; monthStr: string; isWeekend: boolean; isToday: boolean }[] {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay();
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthStr: d.toLocaleDateString("en-US", { month: "short" }),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: i === 0,
    });
  }
  return days;
}

// Time slots from 8 AM to 6 PM in 30-min increments
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

function formatTimeSlot(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12}${period}` : `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

export default function ScheduleInterviewModal({
  studentProfileId,
  providerProfileId,
  otherName,
  onClose,
  onScheduled,
  requiresAuth = false,
  onAuthRequired,
  initialValues,
}: ScheduleInterviewModalProps) {
  const [type, setType] = useState<"video" | "in_person" | "phone">(initialValues?.type ?? "video");
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [time, setTime] = useState(initialValues?.time ?? "");
  const [showAltTime, setShowAltTime] = useState(!!initialValues?.altDate);
  const [altDate, setAltDate] = useState(initialValues?.altDate ?? "");
  const [altTime, setAltTime] = useState(initialValues?.altTime ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isStudentInitiated = !!providerProfileId;
  const firstName = otherName.split(" ")[0];

  // Generate days for picker
  const days = useMemo(() => getNextDays(14), []);

  // Day picker scroll ref
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Scroll selected day into view on mount if there's an initial date
  useEffect(() => {
    if (initialValues?.date && dayScrollRef.current) {
      const selectedEl = dayScrollRef.current.querySelector(`[data-date="${initialValues.date}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [initialValues?.date]);

  const handleSubmit = async () => {
    if (!date || !time) { setError("Please select a date and time."); return; }
    setError("");

    // If user needs auth, save form data and trigger auth flow
    if (requiresAuth && onAuthRequired) {
      onAuthRequired({
        type,
        date,
        time,
        altDate: altDate || undefined,
        altTime: altTime || undefined,
        notes: notes.trim() || undefined,
      });
      return;
    }

    setSubmitting(true);

    const proposedTime = new Date(`${date}T${time}`).toISOString();
    const alternativeTime = altDate && altTime ? new Date(`${altDate}T${altTime}`).toISOString() : undefined;

    try {
      const res = await fetch("/api/medjobs/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(studentProfileId ? { studentProfileId } : { providerProfileId }),
          type,
          proposedTime,
          alternativeTime,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to schedule."); return; }
      onScheduled();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = date && time && !submitting;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isStudentInitiated ? "Request an interview" : "Schedule an interview"}
      size="lg"
      footer={
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl text-base font-semibold text-white transition-colors"
          >
            {submitting ? "Sending..." : isStudentInitiated ? `Request interview with ${firstName}` : `Invite ${firstName}`}
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-6">
        {/* Subtitle */}
        <p className="text-sm text-gray-500">
          {isStudentInitiated
            ? `Request a time to speak with ${firstName} about opportunities.`
            : `Invite ${firstName} to interview for a position.`}
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Interview type - horizontal cards */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Interview type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {INTERVIEW_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  type === opt.value
                    ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={type === opt.value ? "text-white" : "text-gray-400"}>
                  {opt.icon}
                </div>
                <span className={`text-sm font-medium ${
                  type === opt.value ? "text-white" : "text-gray-700"
                }`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Day Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pick a day
          </label>
          <div
            ref={dayScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {days.map((day) => (
              <button
                key={day.dateStr}
                type="button"
                data-date={day.dateStr}
                onClick={() => setDate(day.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center w-[72px] py-3 rounded-xl border-2 transition-all duration-200 ${
                  date === day.dateStr
                    ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                    : day.isWeekend
                      ? "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className={`text-xs font-medium ${
                  date === day.dateStr ? "text-gray-300" : day.isWeekend ? "text-gray-400" : "text-gray-500"
                }`}>
                  {day.dayName}
                </span>
                <span className={`text-lg font-semibold mt-0.5 ${
                  date === day.dateStr ? "text-white" : day.isWeekend ? "text-gray-400" : "text-gray-900"
                }`}>
                  {day.dayNum}
                </span>
                <span className={`text-xs ${
                  date === day.dateStr ? "text-gray-300" : "text-gray-400"
                }`}>
                  {day.monthStr}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pick a time
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  time === slot
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formatTimeSlot(slot)}
              </button>
            ))}
          </div>
        </div>

        {/* Alternative time - progressive disclosure */}
        {!showAltTime ? (
          <button
            type="button"
            onClick={() => setShowAltTime(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Offer another time
          </button>
        ) : (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Alternative time
              </label>
              <button
                type="button"
                onClick={() => { setShowAltTime(false); setAltDate(""); setAltTime(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Remove
              </button>
            </div>
            {/* Alt Day Picker */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {days.map((day) => (
                <button
                  key={`alt-${day.dateStr}`}
                  type="button"
                  onClick={() => setAltDate(day.dateStr)}
                  className={`flex-shrink-0 flex flex-col items-center w-[64px] py-2 rounded-lg border transition-all duration-200 ${
                    altDate === day.dateStr
                      ? "border-gray-900 bg-gray-900 text-white"
                      : day.isWeekend
                        ? "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className={`text-xs ${
                    altDate === day.dateStr ? "text-gray-300" : "text-gray-500"
                  }`}>
                    {day.dayName}
                  </span>
                  <span className={`text-base font-semibold ${
                    altDate === day.dateStr ? "text-white" : day.isWeekend ? "text-gray-400" : "text-gray-900"
                  }`}>
                    {day.dayNum}
                  </span>
                </button>
              ))}
            </div>
            {/* Alt Time Picker */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={`alt-${slot}`}
                  type="button"
                  onClick={() => setAltTime(slot)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    altTime === slot
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {formatTimeSlot(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Add a note <span className="font-normal normal-case text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isStudentInitiated
              ? "Introduce yourself briefly or mention what interests you about this role..."
              : "Share any details about the position or what you'd like to discuss..."}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 outline-none resize-none transition-colors bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
    </Modal>
  );
}
