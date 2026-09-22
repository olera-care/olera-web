import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { parseSchedule } from "@/components/medjobs/ScheduleBuilder";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const FULL_DAYS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  if (h === 0 && m === "00") return "12am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "pm" : "am";
  return m === "00" ? `${hour}${ampm}` : `${hour}:${m}${ampm}`;
}

function slotHours(slot: { start: string; end: string }): number {
  const [sh, sm] = slot.start.split(":").map(Number);
  let [eh, em] = slot.end.split(":").map(Number);
  if (eh === 0 && em === 0) { eh = 24; em = 0; }
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
}

interface ScheduleCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

export default function ScheduleCard({ meta, onEdit }: ScheduleCardProps) {
  // Use new field first, fall back to old grid
  const schedule = meta.availability_schedule || parseSchedule(meta.course_schedule_grid);
  const hasSchedule = Object.values(schedule).some((slots) => Array.isArray(slots) && slots.length > 0);

  // Calculate total hours
  let totalHours = 0;
  for (const slots of Object.values(schedule)) {
    if (!Array.isArray(slots)) continue;
    for (const slot of slots) totalHours += slotHours(slot);
  }
  totalHours = Math.round(totalHours * 10) / 10;

  // Get days with availability
  const activeDays = DAYS.filter((day) => {
    const slots = schedule[day];
    return Array.isArray(slots) && slots.length > 0;
  });

  return (
    <CaregiverSectionCard
      title="Availability"
      isComplete={hasSchedule}
      id="schedule"
      onEdit={onEdit}
    >
      {!hasSchedule ? (
        <EmptyState
          message="No availability set"
          subMessage="Add the times you're available each week."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
      ) : (
        <div>
          {/* Clean list of active days */}
          <div className="divide-y divide-gray-100">
            {activeDays.map((day) => {
              const slots = (schedule[day] || []) as Array<{ start: string; end: string }>;
              return (
                <div key={day} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-gray-900">
                      {FULL_DAYS[day]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {slots.map((slot) => `${formatTime(slot.start)}–${formatTime(slot.end)}`).join(", ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total hours */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{totalHours} hours</span> per week
            </p>
          </div>
        </div>
      )}
    </CaregiverSectionCard>
  );
}
