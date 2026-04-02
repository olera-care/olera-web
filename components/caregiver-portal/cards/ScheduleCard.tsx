import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { parseSchedule } from "@/components/medjobs/ScheduleBuilder";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = ["8am", "10am", "12pm", "2pm", "4pm", "6pm"] as const;

interface ScheduleCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

export default function ScheduleCard({ meta, onEdit }: ScheduleCardProps) {
  const hasSchedule = !!meta.course_schedule_grid;
  const grid = parseSchedule(meta.course_schedule_grid);

  // Count busy slots (class times)
  const busySlots = Object.values(grid).filter(Boolean).length;
  const totalSlots = DAYS.length * SLOTS.length;
  const availableSlots = totalSlots - busySlots;

  // Check if a slot has a class
  const isBusy = (day: string, slot: string) => !!grid[`${day}-${slot}`];

  return (
    <CaregiverSectionCard
      title="Semester Schedule"
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
        <div className="space-y-3">
          {/* Mini schedule visualization */}
          <div className="grid grid-cols-5 gap-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center">
                <span className="text-[10px] font-medium text-gray-400 uppercase">{day.slice(0, 1)}</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  {SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className={`h-1.5 rounded-sm ${
                        isBusy(day, slot) ? "bg-gray-300" : "bg-emerald-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-500">Available time blocks</span>
            <span className="font-medium text-gray-900">{availableSlots} / {totalSlots}</span>
          </div>

          {meta.course_schedule_semester && (
            <p className="text-xs text-gray-400">
              Schedule for {meta.course_schedule_semester}
            </p>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
