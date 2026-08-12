"use client";

import { useEffect, useRef, useState } from "react";

export type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "90d" | "12w" | "6m" | "1y";

export interface DateRangeValue {
  preset: DatePreset | "custom";
  customFrom: string;
  customTo: string;
}

export interface ResolvedRange {
  from: string | null;
  to: string | null;
}

/** All admin reporting windows use Olera's Texas business timezone. */
export const ADMIN_REPORTING_TIME_ZONE = "America/Chicago";

export interface DateRangePresetOption {
  label: string;
  value: DatePreset;
}

const PRESETS: DateRangePresetOption[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "1y" },
];

type CalendarDate = { year: number; month: number; day: number };

function calendarDateInTimeZone(date: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function parseCalendarDate(value: string): CalendarDate {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { year, month, day } = parseCalendarDate(value);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

/** Convert midnight in an IANA timezone to its exact UTC instant.
 *
 * Intl exposes timezone-aware formatting but not construction. Iterating the
 * observed offset handles both CST/CDT and date ranges that cross a DST change.
 */
function startOfDayInTimeZone(date: CalendarDate, timeZone: string): Date {
  const wallClockUtc = Date.UTC(date.year, date.month - 1, date.day);
  let candidate = wallClockUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(new Date(candidate));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value);
    const representedAsUtc = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second")
    );
    const next = wallClockUtc - (representedAsUtc - candidate);
    if (next === candidate) break;
    candidate = next;
  }

  return new Date(candidate);
}

export function resolveRange(
  value: DateRangeValue,
  timeZone = ADMIN_REPORTING_TIME_ZONE
): ResolvedRange {
  if (value.preset === "custom" && value.customFrom) {
    const startDate = parseCalendarDate(value.customFrom);
    const endBase = value.customTo || value.customFrom;
    const endDate = addCalendarDays(parseCalendarDate(endBase), 1);
    const start = startOfDayInTimeZone(startDate, timeZone);
    const end = startOfDayInTimeZone(endDate, timeZone);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (value.preset === "all") return { from: null, to: null };

  const now = new Date();
  const today = calendarDateInTimeZone(now, timeZone);

  if (value.preset === "today") {
    return {
      from: startOfDayInTimeZone(today, timeZone).toISOString(),
      to: now.toISOString(),
    };
  }
  if (value.preset === "yesterday") {
    const yesterday = addCalendarDays(today, -1);
    return {
      from: startOfDayInTimeZone(yesterday, timeZone).toISOString(),
      to: startOfDayInTimeZone(today, timeZone).toISOString(),
    };
  }
  const days = value.preset === "7d"
    ? 7
    : value.preset === "30d"
      ? 30
      : value.preset === "90d"
        ? 90
        : value.preset === "12w"
          ? 84
          : value.preset === "6m"
            ? 183
            : 365;
  // Calendar windows include today, so "Last 30 days" starts 29 dates ago.
  const start = addCalendarDays(today, -(days - 1));
  return {
    from: startOfDayInTimeZone(start, timeZone).toISOString(),
    to: now.toISOString(),
  };
}

export function dateRangeSearchParams(value: DateRangeValue): URLSearchParams {
  const params = new URLSearchParams({ range: value.preset });
  if (value.preset === "custom") {
    if (value.customFrom) params.set("from", value.customFrom);
    if (value.customTo) params.set("to", value.customTo);
  }
  return params;
}

export function dateRangeFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  fallback: DateRangeValue,
  presets: DateRangePresetOption[] = PRESETS,
): DateRangeValue {
  const preset = searchParams.get("range");
  if (!preset) return fallback;
  if (preset === "custom") {
    const customFrom = searchParams.get("from") ?? "";
    const customTo = searchParams.get("to") ?? "";
    const validFrom = isValidCalendarDate(customFrom);
    const validTo = !customTo || isValidCalendarDate(customTo);
    const ordered = !customTo || customTo >= customFrom;
    return validFrom && validTo && ordered ? { preset, customFrom, customTo } : fallback;
  }
  if (presets.some((option) => option.value === preset)) {
    return { preset: preset as DatePreset, customFrom: "", customTo: "" };
  }
  return fallback;
}

export function rangeLabel(value: DateRangeValue, presets: DateRangePresetOption[] = PRESETS): string {
  if (value.preset === "custom") {
    if (!value.customFrom) return "Custom range";
    const fmt = (s: string) => {
      const d = new Date(s + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    if (!value.customTo || value.customTo === value.customFrom) return fmt(value.customFrom);
    return `${fmt(value.customFrom)} – ${fmt(value.customTo)}`;
  }
  return presets.find((p) => p.value === value.preset)?.label ?? "All time";
}

export default function DateRangePopover({
  value,
  onChange,
  presets = PRESETS,
  ariaLabel = "Date range",
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  presets?: DateRangePresetOption[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.customFrom);
  const [draftTo, setDraftTo] = useState(value.customTo);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setDraftFrom(value.customFrom);
      setDraftTo(value.customTo);
    }
  }, [open, value.customFrom, value.customTo]);

  const pickPreset = (preset: DatePreset) => {
    onChange({ preset, customFrom: "", customTo: "" });
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftFrom || (draftTo && draftTo < draftFrom)) return;
    onChange({ preset: "custom", customFrom: draftFrom, customTo: draftTo });
    setOpen(false);
  };

  const customRangeInvalid = !draftFrom || (!!draftTo && draftTo < draftFrom);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-9 px-3.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/10 focus-visible:ring-offset-2"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        {rangeLabel(value, presets)}
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
          role="dialog"
          aria-label={ariaLabel}
        >
          <div className="py-1.5">
            {presets.map((p) => {
              const isActive = value.preset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => pickPreset(p.value)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                    isActive ? "text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{p.label}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2.5">Custom range</p>
            <div className="space-y-2">
              <label className="block">
                <span className="block text-[11px] text-gray-500 mb-1">From</span>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-gray-500 mb-1">To</span>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={applyCustom}
                disabled={customRangeInvalid}
                className="px-3.5 h-8 text-xs font-medium text-white bg-gray-900 rounded-full hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
