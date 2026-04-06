"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

interface ScheduleInterviewModalProps {
  /** Provider → Student: pass the student's profile ID */
  studentProfileId?: string;
  /** Student → Provider: pass the provider's profile ID */
  providerProfileId?: string;
  /** Name of the other party (shown in the modal header) */
  otherName: string;
  onClose: () => void;
  onScheduled: () => void;
}

const INTERVIEW_TYPES = [
  {
    value: "video" as const,
    label: "Video call",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    value: "phone" as const,
    label: "Phone call",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
  {
    value: "in_person" as const,
    label: "In person",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
];

export default function ScheduleInterviewModal({
  studentProfileId,
  providerProfileId,
  otherName,
  onClose,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const [type, setType] = useState<"video" | "in_person" | "phone">("video");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [showAltTime, setShowAltTime] = useState(false);
  const [altDate, setAltDate] = useState("");
  const [altTime, setAltTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isStudentInitiated = !!providerProfileId;
  const firstName = otherName.split(" ")[0];

  const handleSubmit = async () => {
    if (!date || !time) { setError("Please select a date and time."); return; }
    setError("");
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
      size="md"
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
          <label className="block text-sm font-medium text-gray-900 mb-3">
            How would you like to meet?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INTERVIEW_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  type === opt.value
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div className={type === opt.value ? "text-gray-900" : "text-gray-400"}>
                  {opt.icon}
                </div>
                <span className={`text-xs font-medium ${
                  type === opt.value ? "text-gray-900" : "text-gray-600"
                }`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Proposed time */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            When works for you?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
              />
            </div>
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
            Add alternative time
          </button>
        ) : (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={altDate}
                  onChange={(e) => setAltDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Time</label>
                <input
                  type="time"
                  value={altTime}
                  onChange={(e) => setAltTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Add a note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isStudentInitiated
              ? "Introduce yourself briefly or mention what interests you about this role..."
              : "Share any details about the position or what you'd like to discuss..."}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 outline-none resize-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  );
}
