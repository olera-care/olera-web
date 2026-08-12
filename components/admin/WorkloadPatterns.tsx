"use client";

import { useEffect, useState, useCallback } from "react";

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

// Preset date ranges
type DatePreset = "12w" | "6m" | "1y" | "custom";

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Last 12 weeks", value: "12w" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last year", value: "1y" },
  { label: "Custom", value: "custom" },
];

function getPresetDates(preset: DatePreset): { start: Date; end: Date } {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date();

  switch (preset) {
    case "12w":
      start.setDate(start.getDate() - 84);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 84);
  }

  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * WorkloadPatterns - Compact section for bandwidth planning
 *
 * Shows:
 * 1. Weekly volume bar chart with date range picker
 * 2. Day-of-week breakdown with averages
 * 3. Export to CSV functionality
 */
export default function WorkloadPatterns() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Date range state
  const [preset, setPreset] = useState<DatePreset>("12w");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const fetchData = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      const res = await fetch(`/api/admin/questions/workload-patterns?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when preset changes or custom dates are applied
  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      fetchData(start, end);
    }
  }, [preset, fetchData]);

  // Initialize custom dates when switching to custom
  useEffect(() => {
    if (preset === "custom" && !customStart && !customEnd) {
      const { start, end } = getPresetDates("12w");
      setCustomStart(formatDateForInput(start));
      setCustomEnd(formatDateForInput(end));
    }
  }, [preset, customStart, customEnd]);

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      // Validate date range
      if (start > end) {
        alert("Start date must be before end date");
        return;
      }
      fetchData(start, end);
    }
  };

  // Get current date range label for display
  const getDateRangeLabel = (): string => {
    if (preset === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return DATE_PRESETS.find(p => p.value === preset)?.label || "Last 12 weeks";
  };

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
          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    preset === p.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || formatDateForInput(new Date())}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={formatDateForInput(new Date())}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStart || !customEnd}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-32 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
          ) : !data ? (
            <div className="text-sm text-gray-400">Failed to load workload data</div>
          ) : (
            <>
              <WeeklyVolumeChart weeks={data.weekly_totals} dateRangeLabel={getDateRangeLabel()} />
              <DayOfWeekBreakdown days={data.day_of_week} numWeeks={data.weekly_totals.length} />
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
function WeeklyVolumeChart({ weeks, dateRangeLabel }: { weeks: WeeklyTotal[]; dateRangeLabel: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxQuestions = Math.max(...weeks.map((w) => w.questions), 1);

  // Format week label: "Jun 3" for the week starting that date
  const formatWeekLabel = (weekStart: string) => {
    const d = new Date(weekStart);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Week Starting", "Questions", "Unique Providers"];
    const rows = weeks.map((w) => [
      w.week_start,
      w.questions.toString(),
      w.providers.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekly-volume-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Weekly Volume</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{dateRangeLabel}</span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Export to CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        </div>
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
function DayOfWeekBreakdown({ days, numWeeks }: { days: DayOfWeek[]; numWeeks: number }) {
  const maxAvg = Math.max(...days.map((d) => d.avg), 1);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-700">Questions by Day of Week</h3>
        <span className="text-xs text-gray-400">avg per day</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        How many questions come in on each day (averaged over {numWeeks} week{numWeeks !== 1 ? "s" : ""})
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
