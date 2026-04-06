import { useState } from "react";
import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { parseSchedule } from "@/components/medjobs/ScheduleBuilder";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = ["8am", "10am", "12pm", "2pm", "4pm", "6pm"] as const;

// Time periods for summary
const MORNING_SLOTS = ["8am", "10am"];
const AFTERNOON_SLOTS = ["12pm", "2pm"];
const EVENING_SLOTS = ["4pm", "6pm"];

interface ScheduleCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

type DayAvailability = "full" | "partial" | "none";

export default function ScheduleCard({ meta, onEdit }: ScheduleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasSchedule = !!meta.course_schedule_grid;
  const grid = parseSchedule(meta.course_schedule_grid);

  // Check if a slot has a class (busy = not available)
  const isBusy = (day: string, slot: string) => !!grid[`${day}-${slot}`];
  const isAvailable = (day: string, slot: string) => !isBusy(day, slot);

  // Calculate availability per day
  const getDayAvailability = (day: string): DayAvailability => {
    const availableCount = SLOTS.filter((slot) => isAvailable(day, slot)).length;
    if (availableCount === SLOTS.length) return "full";
    if (availableCount === 0) return "none";
    return "partial";
  };

  // Calculate total available hours (assuming 2hr blocks)
  const totalAvailableSlots = DAYS.reduce((acc, day) => {
    return acc + SLOTS.filter((slot) => isAvailable(day, slot)).length;
  }, 0);
  const estimatedHours = totalAvailableSlots * 2;

  // Generate natural language summary
  const getAvailabilitySummary = () => {
    const availableDays = DAYS.filter((day) => getDayAvailability(day) !== "none");

    if (availableDays.length === 0) return "Not available";
    if (availableDays.length === 5) {
      // Check time patterns
      const hasMornings = DAYS.some((day) =>
        MORNING_SLOTS.some((slot) => isAvailable(day, slot))
      );
      const hasAfternoons = DAYS.some((day) =>
        AFTERNOON_SLOTS.some((slot) => isAvailable(day, slot))
      );
      const hasEvenings = DAYS.some((day) =>
        EVENING_SLOTS.some((slot) => isAvailable(day, slot))
      );

      const times = [];
      if (hasMornings) times.push("mornings");
      if (hasAfternoons) times.push("afternoons");
      if (hasEvenings) times.push("evenings");

      if (times.length === 3) return "Weekdays, flexible hours";
      if (times.length > 0) return `Weekdays, ${times.join(" & ")}`;
      return "Weekdays";
    }

    // Format day ranges
    if (availableDays.length === 1) return availableDays[0];
    if (availableDays.length === 2) return availableDays.join(" & ");
    return `${availableDays.slice(0, -1).join(", ")} & ${availableDays[availableDays.length - 1]}`;
  };

  return (
    <CaregiverSectionCard
      title="Availability"
      isComplete={hasSchedule}
      id="schedule"
      onEdit={onEdit}
    >
      {!hasSchedule ? (
        <EmptyState
          message="No schedule set"
          subMessage="Add your class schedule so providers know your availability."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Day availability dots */}
          <div className="flex justify-between items-start px-2">
            {DAYS.map((day) => {
              const availability = getDayAvailability(day);
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">{day.slice(0, 1)}</span>
                  <div className="relative">
                    {availability === "full" && (
                      <div className="w-5 h-5 rounded-full bg-emerald-400" />
                    )}
                    {availability === "partial" && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 from-50% to-gray-200 to-50%" />
                    )}
                    {availability === "none" && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary text */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {getAvailabilitySummary()}
            </p>
            <p className="text-xs text-gray-400">
              ~{estimatedHours} hours/week
              {meta.course_schedule_semester && ` · ${meta.course_schedule_semester}`}
            </p>
          </div>

          {/* Expandable details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {showDetails ? "Hide details" : "See full schedule"}
          </button>

          {showDetails && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {DAYS.map((day) => {
                const availableSlots = SLOTS.filter((slot) => isAvailable(day, slot));
                if (availableSlots.length === 0) return null;

                return (
                  <div key={day} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-medium text-gray-500">{day}</span>
                    <div className="flex flex-wrap gap-1">
                      {availableSlots.map((slot) => (
                        <span
                          key={slot}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
