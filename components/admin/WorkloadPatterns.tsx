"use client";

import { useEffect, useState } from "react";

interface WeeklyTotal {
  week_start: string;
  questions: number;
  providers: number;
}

interface DayOfWeek {
  day: string;
  day_index: number;
  total: number;
  avg: number;
}

interface WorkloadData {
  weekly_totals: WeeklyTotal[];
  day_of_week: DayOfWeek[];
}

/**
 * WorkloadPatterns - Compact section for bandwidth planning
 *
 * Shows:
 * 1. Weekly volume bar chart (last 12 weeks)
 * 2. Day-of-week breakdown with averages
 */
export default function WorkloadPatterns() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/questions/workload-patterns")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
        </svg>
        {expanded ? "Hide workload patterns" : "Show workload patterns"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-6">
          {loading ? (
            <div className="h-32 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
          ) : !data ? (
            <div className="text-sm text-gray-400">Failed to load workload data</div>
          ) : (
            <>
              <WeeklyVolumeChart weeks={data.weekly_totals} />
              <DayOfWeekBreakdown days={data.day_of_week} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Weekly Volume Bar Chart
 */
function WeeklyVolumeChart({ weeks }: { weeks: WeeklyTotal[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxQuestions = Math.max(...weeks.map((w) => w.questions), 1);

  // Format week label: "Jun 3" for the week starting that date
  const formatWeekLabel = (weekStart: string) => {
    const d = new Date(weekStart);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Weekly Volume</h3>
        <span className="text-xs text-gray-400">Last 12 weeks</span>
      </div>

      <div className="relative h-32">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {weeks.map((week, i) => {
            const height = (week.questions / maxQuestions) * 100;
            const isHovered = hoverIndex === i;

            return (
              <div
                key={week.week_start}
                className="relative flex-1 h-full flex flex-col justify-end items-center"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-gray-900 text-white rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                    <div className="text-xs font-medium">Week of {formatWeekLabel(week.week_start)}</div>
                    <div className="text-[11px] text-gray-300 mt-0.5">
                      {week.questions} questions from {week.providers} providers
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all cursor-pointer ${
                    isHovered ? "bg-teal-600" : "bg-teal-500"
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels (first and last week) */}
      {weeks.length > 0 && (
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>{formatWeekLabel(weeks[0].week_start)}</span>
          <span>{formatWeekLabel(weeks[weeks.length - 1].week_start)}</span>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {weeks.reduce((s, w) => s + w.questions, 0).toLocaleString()}
          </span>{" "}
          questions total
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {weeks.length > 0 ? Math.round(weeks.reduce((s, w) => s + w.questions, 0) / weeks.length) : 0}
          </span>{" "}
          avg/week
        </div>
      </div>
    </div>
  );
}

/**
 * Day-of-Week Breakdown with horizontal bars
 * Shows average questions received per day of week (e.g., "~84 questions/day on Tue")
 */
function DayOfWeekBreakdown({ days }: { days: DayOfWeek[] }) {
  const maxAvg = Math.max(...days.map((d) => d.avg), 1);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-700">Questions by Day of Week</h3>
        <span className="text-xs text-gray-400">avg per day</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        How many questions come in on each day (averaged over 12 weeks)
      </p>

      <div className="space-y-2">
        {days.map((day) => {
          const width = (day.avg / maxAvg) * 100;
          const roundedAvg = Math.round(day.avg);

          return (
            <div key={day.day} className="flex items-center gap-3">
              <div className="w-10 text-xs font-medium text-gray-600">{day.day}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                <div
                  className="h-full bg-blue-500 rounded transition-all"
                  style={{ width: `${width}%` }}
                />
                {/* Show count inside bar if there's room */}
                {width > 25 && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-white">
                    ~{roundedAvg}
                  </span>
                )}
              </div>
              <div className="w-20 text-right">
                <span className="text-xs font-medium text-gray-700">~{roundedAvg}</span>
                <span className="text-[10px] text-gray-400 ml-1">/day</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {days.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <BusiestDayInsight days={days} />
        </div>
      )}
    </div>
  );
}

/**
 * Generate insight about busiest vs quietest days
 */
function BusiestDayInsight({ days }: { days: DayOfWeek[] }) {
  const sorted = [...days].sort((a, b) => b.avg - a.avg);
  const busiest = sorted[0];
  const quietest = sorted[sorted.length - 1];

  if (!busiest || !quietest || busiest.avg === 0) {
    return <div className="text-xs text-gray-400">Not enough data for patterns</div>;
  }

  const pctMore = quietest.avg > 0 ? Math.round(((busiest.avg - quietest.avg) / quietest.avg) * 100) : 0;

  return (
    <div className="text-xs text-gray-500">
      <span className="font-medium text-gray-700">{busiest.day}</span> gets the most questions (~{Math.round(busiest.avg)}/day)
      {pctMore > 15 && (
        <span className="text-gray-400">
          {" "}— <span className="text-blue-600">{pctMore}% more</span> than {quietest.day} (~{Math.round(quietest.avg)}/day)
        </span>
      )}
    </div>
  );
}
