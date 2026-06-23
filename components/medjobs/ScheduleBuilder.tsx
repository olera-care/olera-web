"use client";

import { useState, useCallback } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "14:00"
}

export type AvailabilitySchedule = Record<string, TimeSlot[]>;

// Time options in 30-min increments
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}
TIME_OPTIONS.push("00:00"); // midnight

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  if (h === 0 && m === "00") return "12am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "pm" : "am";
  return m === "00" ? `${hour}${ampm}` : `${hour}:${m}${ampm}`;
}

function slotHours(slot: TimeSlot): number {
  const [sh, sm] = slot.start.split(":").map(Number);
  let [eh, em] = slot.end.split(":").map(Number);
  if (eh === 0 && em === 0) { eh = 24; em = 0; }
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return Math.max(0, (endMin - startMin) / 60);
}

function totalWeeklyHours(schedule: AvailabilitySchedule): number {
  let total = 0;
  for (const slots of Object.values(schedule)) {
    for (const slot of slots) {
      total += slotHours(slot);
    }
  }
  return Math.round(total * 10) / 10;
}

interface ScheduleBuilderProps {
  value: AvailabilitySchedule;
  onChange: (schedule: AvailabilitySchedule) => void;
  readOnly?: boolean;
}

export function ScheduleBuilder({ value, onChange, readOnly }: ScheduleBuilderProps) {
  const [addingDay, setAddingDay] = useState<Day | null>(null);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  const addSlot = useCallback((day: Day) => {
    const existing = value[day] || [];
    const updated = [...existing, { start: newStart, end: newEnd }]
      .sort((a, b) => a.start.localeCompare(b.start));
    onChange({ ...value, [day]: updated });
    setAddingDay(null);
    setNewStart("09:00");
    setNewEnd("17:00");
  }, [value, onChange, newStart, newEnd]);

  const removeSlot = useCallback((day: string, index: number) => {
    const existing = [...(value[day] || [])];
    existing.splice(index, 1);
    onChange({ ...value, [day]: existing });
  }, [value, onChange]);

  const hours = totalWeeklyHours(value);
  const hasAnySlots = Object.values(value).some((slots) => slots.length > 0);

  return (
    <div>
      {/* Vertical columns calendar */}
      <div className="grid grid-cols-7 gap-0 rounded-2xl border border-gray-200 overflow-hidden bg-white">
        {DAYS.map((day, dayIdx) => {
          const slots = value[day] || [];
          const dayHours = slots.reduce((sum, s) => sum + slotHours(s), 0);
          const isAdding = addingDay === day;
          const isLast = dayIdx === DAYS.length - 1;

          return (
            <div
              key={day}
              className={`flex flex-col ${!isLast ? "border-r border-gray-100" : ""}`}
            >
              {/* Day header */}
              <div className={`px-1.5 py-2.5 text-center border-b ${
                slots.length > 0 ? "border-primary-100 bg-primary-50/40" : "border-gray-100 bg-gray-50"
              }`}>
                <span className={`text-xs font-semibold ${
                  slots.length > 0 ? "text-primary-700" : "text-gray-500"
                }`}>
                  {day}
                </span>
                {dayHours > 0 && (
                  <p className="text-[10px] text-primary-500 mt-0.5">{dayHours}h</p>
                )}
              </div>

              {/* Time slots stacked vertically */}
              <div className="flex-1 flex flex-col gap-1 p-1.5 min-h-[120px]">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="group relative bg-primary-50 border border-primary-100 rounded-lg px-1.5 py-1.5 text-center"
                  >
                    <p className="text-[11px] font-medium text-primary-700 leading-tight">
                      {formatTime(slot.start)}
                    </p>
                    <p className="text-[9px] text-primary-400 leading-tight">to</p>
                    <p className="text-[11px] font-medium text-primary-700 leading-tight">
                      {formatTime(slot.end)}
                    </p>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeSlot(day, i)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:border-red-200"
                        aria-label="Remove"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {slots.length === 0 && !isAdding && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[10px] text-gray-300">—</span>
                  </div>
                )}

                {/* Add button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setAddingDay(isAdding ? null : day)}
                    className={`mt-auto mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isAdding
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-gray-300 hover:text-primary-600 hover:bg-primary-50"
                    }`}
                    aria-label={`Add time for ${day}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add time form — appears below the calendar */}
      {addingDay && !readOnly && (
        <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Add time for <span className="font-semibold text-gray-900">{addingDay}</span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={`s-${t}`} value={t}>{formatTime(t)}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 font-medium">to</span>
            <select
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              {TIME_OPTIONS.filter((t) => t > newStart || t === "00:00").map((t) => (
                <option key={`e-${t}`} value={t}>{formatTime(t)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addSlot(addingDay)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAddingDay(null)}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Total hours footer */}
      {hasAnySlots && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <span className="text-sm font-semibold text-gray-900">{hours} hours/week</span>
          <span className="text-xs text-gray-400">available</span>
        </div>
      )}
    </div>
  );
}

/** Serialize AvailabilitySchedule to JSON string for metadata storage */
export function serializeSchedule(schedule: AvailabilitySchedule): string {
  return JSON.stringify(schedule);
}

/** Parse a stored schedule string back. Handles both old grid format and new format. */
export function parseSchedule(stored: string | undefined): AvailabilitySchedule {
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    // Detect old grid format (keys like "Mon-8am": true)
    const keys = Object.keys(parsed);
    if (keys.length > 0 && keys[0].includes("-") && typeof parsed[keys[0]] === "boolean") {
      return convertGridToSchedule(parsed);
    }
    return parsed as AvailabilitySchedule;
  } catch {
    return {};
  }
}

/** Convert old grid format {"Mon-8am": true, ...} to new schedule format */
function convertGridToSchedule(grid: Record<string, boolean>): AvailabilitySchedule {
  const SLOT_HOURS: Record<string, [number, number]> = {
    "8am": [8, 10],
    "10am": [10, 12],
    "12pm": [12, 14],
    "2pm": [14, 16],
    "4pm": [16, 18],
    "6pm": [18, 20],
    "8pm": [20, 22],
  };

  const schedule: AvailabilitySchedule = {};
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const day of days) {
    const activeSlots = Object.entries(SLOT_HOURS)
      .filter(([key]) => grid[`${day}-${key}`])
      .map(([, [start, end]]) => ({ start, end }))
      .sort((a, b) => a.start - b.start);

    if (activeSlots.length === 0) continue;

    // Merge contiguous slots
    const merged: TimeSlot[] = [];
    let current = { start: `${String(activeSlots[0].start).padStart(2, "0")}:00`, end: `${String(activeSlots[0].end).padStart(2, "0")}:00` };

    for (let i = 1; i < activeSlots.length; i++) {
      const nextStart = `${String(activeSlots[i].start).padStart(2, "0")}:00`;
      if (current.end === nextStart) {
        current.end = `${String(activeSlots[i].end).padStart(2, "0")}:00`;
      } else {
        merged.push(current);
        current = { start: nextStart, end: `${String(activeSlots[i].end).padStart(2, "0")}:00` };
      }
    }
    merged.push(current);
    schedule[day] = merged;
  }

  return schedule;
}
