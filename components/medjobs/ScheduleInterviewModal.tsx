"use client";

import { useState } from "react";

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
  const [altDate, setAltDate] = useState("");
  const [altTime, setAltTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isStudentInitiated = !!providerProfileId;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {isStudentInitiated ? "Request Interview" : "Schedule Interview"}
        </h2>
        <p className="text-sm text-gray-500 mb-5">with {otherName}</p>

        {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Type selection */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Interview type</label>
          <div className="flex gap-2">
            {([
              { value: "video" as const, label: "Video" },
              { value: "phone" as const, label: "Phone" },
              { value: "in_person" as const, label: "In-Person" },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === opt.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proposed time */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Proposed time *</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
          </div>
        </div>

        {/* Alternative time */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Alternative time (optional)</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={altDate} onChange={(e) => setAltDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
            <input type="time" value={altTime} onChange={(e) => setAltTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={isStudentInitiated ? "Introduce yourself briefly..." : "Any details for the candidate..."}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !date || !time}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
            {submitting ? "Sending..." : isStudentInitiated ? "Send Request" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
