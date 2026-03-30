"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = [
  { key: "morning", label: "Morning", time: "8am–12pm" },
  { key: "afternoon", label: "Afternoon", time: "12–4pm" },
  { key: "evening", label: "Evening", time: "4–8pm" },
  { key: "night", label: "Night", time: "8pm+" },
] as const;

type DayKey = (typeof DAYS)[number];
type SlotKey = (typeof SLOTS)[number]["key"];
type ScheduleGrid = Record<string, boolean>; // "Mon-morning" => true means class at that time

interface ScheduleBuilderProps {
  value: ScheduleGrid;
  onChange: (grid: ScheduleGrid) => void;
  readOnly?: boolean;
}

export function ScheduleBuilder({ value, onChange, readOnly }: ScheduleBuilderProps) {
  const toggle = (day: DayKey, slot: SlotKey) => {
    if (readOnly) return;
    const key = `${day}-${slot}`;
    onChange({ ...value, [key]: !value[key] });
  };

  const hasAnyClass = Object.values(value).some(Boolean);

  return (
    <div>
      {!readOnly && (
        <p className="text-xs text-gray-400 mb-3">Tap to mark your class times. Everything else = you&apos;re available.</p>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-1 mb-1">
            <div />
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
            ))}
          </div>
          {/* Time slots */}
          {SLOTS.map((slot) => (
            <div key={slot.key} className="grid grid-cols-6 gap-1 mb-1">
              <div className="flex flex-col justify-center pr-2 text-right">
                <span className="text-xs font-medium text-gray-600 leading-tight">{slot.label}</span>
                <span className="text-[10px] text-gray-400 leading-tight">{slot.time}</span>
              </div>
              {DAYS.map((day) => {
                const key = `${day}-${slot.key}`;
                const isClass = !!value[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(day, slot.key)}
                    disabled={readOnly}
                    className={`h-10 rounded-md transition-all text-xs font-medium ${
                      isClass
                        ? "bg-gray-800 text-white"
                        : readOnly
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    } ${readOnly ? "" : "cursor-pointer"}`}
                  >
                    {isClass ? "Class" : readOnly ? "Free" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {hasAnyClass && !readOnly && (
        <p className="text-xs text-gray-400 mt-2">
          Dark = class time. Green = available for shifts.
        </p>
      )}
    </div>
  );
}

/** Convert a ScheduleGrid to a JSON-safe string for metadata storage */
export function serializeSchedule(grid: ScheduleGrid): string {
  return JSON.stringify(grid);
}

/** Parse a stored schedule string back to a ScheduleGrid */
export function parseSchedule(stored: string | undefined): ScheduleGrid {
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}
