"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = [
  { key: "8am", label: "8–10am" },
  { key: "10am", label: "10am–12pm" },
  { key: "12pm", label: "12–2pm" },
  { key: "2pm", label: "2–4pm" },
  { key: "4pm", label: "4–6pm" },
  { key: "6pm", label: "6–8pm" },
  { key: "8pm", label: "8pm+" },
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
        <p className="text-xs text-gray-400 mb-4 text-center">Tap to mark your class times. Everything else = you&apos;re available.</p>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[460px]">
          {/* Header row */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-0.5 mb-0.5">
            <div />
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-medium text-gray-500 py-1">{day}</div>
            ))}
          </div>
          {/* Time slots */}
          {SLOTS.map((slot) => (
            <div key={slot.key} className="grid grid-cols-[80px_repeat(5,1fr)] gap-0.5 mb-0.5">
              <div className="flex items-center justify-end pr-2">
                <span className="text-[11px] text-gray-500 whitespace-nowrap">{slot.label}</span>
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
                    className={`h-8 rounded transition-all text-[10px] font-medium ${
                      isClass
                        ? "bg-gray-800 text-white"
                        : readOnly
                        ? "bg-gray-100 text-gray-500"
                        : "bg-gray-100 hover:bg-gray-200 text-transparent hover:text-gray-400"
                    } ${readOnly ? "" : "cursor-pointer"}`}
                  >
                    {isClass ? "Class" : readOnly ? "" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {hasAnyClass && !readOnly && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Dark = class time. Light = available for shifts.
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
