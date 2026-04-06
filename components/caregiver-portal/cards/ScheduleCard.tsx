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

export default function ScheduleCard({ meta, onEdit }: ScheduleCardProps) {
  const hasSchedule = !!meta.course_schedule_grid;
  const grid = parseSchedule(meta.course_schedule_grid);

  // Check if a slot has a class (busy = not available)
  const isBusy = (day: string, slot: string) => !!grid[`${day}-${slot}`];
  const isAvailable = (day: string, slot: string) => !isBusy(day, slot);

  // Calculate total available hours (assuming 2hr blocks)
  const totalAvailableSlots = DAYS.reduce((acc, day) => {
    return acc + SLOTS.filter((slot) => isAvailable(day, slot)).length;
  }, 0);
  const estimatedHours = totalAvailableSlots * 2;

  // Generate natural language summary
  const getAvailabilitySummary = () => {
    const availableDays = DAYS.filter((day) =>
      SLOTS.some((slot) => isAvailable(day, slot))
    );

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
          {/* Mini schedule grid — shows actual availability at a glance */}
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-0.5">
              <div />
              {DAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-gray-400">
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>
            {/* Time slots grid */}
            <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-0.5">
              {/* Time labels - simplified */}
              <div className="flex flex-col justify-between py-0.5">
                <span className="text-[9px] text-gray-300">AM</span>
                <span className="text-[9px] text-gray-300">PM</span>
              </div>
              {/* Grid cells for each day */}
              {DAYS.map((day) => (
                <div key={day} className="flex flex-col gap-0.5">
                  {SLOTS.map((slot) => {
                    const available = isAvailable(day, slot);
                    return (
                      <div
                        key={`${day}-${slot}`}
                        className={`h-2.5 rounded-sm ${
                          available
                            ? "bg-gray-100"
                            : "bg-gray-700"
                        }`}
                        title={`${day} ${slot}: ${available ? "Available" : "Class"}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-gray-100 border border-gray-200" />
                <span className="text-[10px] text-gray-400">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-gray-700" />
                <span className="text-[10px] text-gray-400">Class</span>
              </div>
            </div>
          </div>

          {/* Summary text */}
          <div className="pt-3 border-t border-gray-100 space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {getAvailabilitySummary()}
            </p>
            <p className="text-xs text-gray-400">
              ~{estimatedHours} hours/week
              {meta.course_schedule_semester && ` · ${meta.course_schedule_semester}`}
            </p>
          </div>
        </div>
      )}
    </CaregiverSectionCard>
  );
}
