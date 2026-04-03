"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Interview, InterviewStatus } from "@/lib/types";

/* ── Types ── */

type InterviewWithProfiles = Interview & {
  provider?: {
    id: string;
    display_name: string;
    image_url?: string;
    city?: string;
    state?: string;
    email?: string;
    phone?: string;
  };
  student?: {
    id: string;
    slug?: string;
    display_name: string;
    image_url?: string;
    email?: string;
    metadata?: Record<string, unknown>;
  };
};

/** "provider" = org viewing candidates, "student" = caregiver viewing orgs */
type Perspective = "provider" | "student";

interface InterviewCalendarProps {
  interviews: InterviewWithProfiles[];
  perspective: Perspective;
  loading: boolean;
  onUpdateStatus: (interviewId: string, status: string) => Promise<void>;
  actionLoading: string | null;
}

/* ── Helpers ── */

const STATUS_COLORS: Record<string, string> = {
  proposed: "bg-amber-400",
  confirmed: "bg-emerald-400",
  completed: "bg-gray-300",
  cancelled: "bg-red-300",
  no_show: "bg-red-300",
  rescheduled: "bg-blue-300",
};

const STATUS_BADGE: Record<string, string> = {
  proposed: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-red-100 text-red-600",
  rescheduled: "bg-blue-100 text-blue-600",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function typeLabel(type: string) {
  return type === "video" ? "Video" : type === "in_person" ? "In-Person" : "Phone";
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Main Calendar Component ── */

export default function InterviewCalendar({
  interviews,
  perspective,
  loading,
  onUpdateStatus,
  actionLoading,
}: InterviewCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<InterviewWithProfiles | null>(null);

  // Group interviews by date string "YYYY-MM-DD"
  const byDate = useMemo(() => {
    const map = new Map<string, InterviewWithProfiles[]>();
    for (const iv of interviews) {
      const d = new Date(iv.confirmed_time || iv.proposed_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(iv);
    }
    return map;
  }, [interviews]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-300 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /> Past / Cancelled</span>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            type="button"
            onClick={goToday}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Previous month">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Next month">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Leading blanks */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 bg-gray-50/30" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayInterviews = byDate.get(key) || [];
            const today = isToday(dateObj);

            return (
              <div
                key={day}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 p-1 sm:p-1.5 ${today ? "bg-primary-50/40" : ""}`}
              >
                <div className={`text-xs font-medium mb-1 ${today ? "text-primary-600" : "text-gray-400"}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayInterviews.slice(0, 3).map((iv) => {
                    const name = perspective === "provider"
                      ? iv.student?.display_name || "Unknown"
                      : iv.provider?.display_name || "Unknown";
                    const shortName = name.length > 14 ? name.slice(0, 12) + "…" : name;
                    const statusColor = STATUS_COLORS[iv.status] || "bg-gray-300";

                    return (
                      <button
                        key={iv.id}
                        type="button"
                        onClick={() => setSelected(iv)}
                        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left hover:bg-gray-50 transition-colors group"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
                        <span className="text-[10px] sm:text-xs text-gray-700 truncate group-hover:text-gray-900">
                          {shortName}
                        </span>
                      </button>
                    );
                  })}
                  {dayInterviews.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setSelected(dayInterviews[3])}
                      className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                    >
                      +{dayInterviews.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Trailing blanks to fill the last row */}
          {(() => {
            const totalCells = firstDay + daysInMonth;
            const remainder = totalCells % 7;
            if (remainder === 0) return null;
            return Array.from({ length: 7 - remainder }).map((_, i) => (
              <div key={`trail-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 bg-gray-50/30" />
            ));
          })()}
        </div>
      </div>

      {/* Empty state */}
      {interviews.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-2">No interviews yet</p>
          <p className="text-sm text-gray-400 mb-5">
            {perspective === "provider"
              ? "Browse caregivers and schedule interviews to start building your team."
              : "Complete your profile and apply to providers to start getting interview requests."}
          </p>
          <Link
            href={perspective === "provider" ? "/provider/medjobs/candidates" : "/portal/medjobs/jobs"}
            className="inline-flex px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {perspective === "provider" ? "Browse caregivers" : "Browse open jobs"}
          </Link>
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <InterviewDetailPopup
          interview={selected}
          perspective={perspective}
          onClose={() => setSelected(null)}
          onUpdateStatus={onUpdateStatus}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

/* ── Detail Popup ── */

function InterviewDetailPopup({
  interview,
  perspective,
  onClose,
  onUpdateStatus,
  actionLoading,
}: {
  interview: InterviewWithProfiles;
  perspective: Perspective;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  actionLoading: string | null;
}) {
  const time = new Date(interview.confirmed_time || interview.proposed_time);
  const tLabel = typeLabel(interview.type);
  const isLoading = actionLoading === interview.id;

  // Who the "other person" is depends on perspective
  const other = perspective === "provider" ? interview.student : interview.provider;
  const otherName = other?.display_name || "Unknown";
  const otherImage = other?.image_url;

  // Link to the other person's profile
  const profileHref = perspective === "provider" && interview.student?.slug
    ? `/provider/medjobs/candidates/${interview.student.slug}`
    : null;

  // Provider contact info for caregivers to reschedule
  const providerEmail = interview.provider?.email;
  const providerPhone = interview.provider?.phone;

  const handleAction = async (status: string) => {
    await onUpdateStatus(interview.id, status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        {/* Header with avatar */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {otherImage ? (
              <Image src={otherImage} alt={otherName} width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400">
                {otherName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {profileHref ? (
              <Link href={profileHref} className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors" onClick={onClose}>
                {otherName}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900">{otherName}</p>
            )}
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[interview.status] || "bg-gray-100 text-gray-500"}`}>
              {interview.status}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          <DetailRow icon="calendar" label="Date" value={time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
          <DetailRow icon="clock" label="Time" value={formatTime(interview.confirmed_time || interview.proposed_time)} />
          <DetailRow icon="type" label="Type" value={tLabel} />
          {interview.duration_minutes && (
            <DetailRow icon="duration" label="Duration" value={`${interview.duration_minutes} minutes`} />
          )}
          {interview.location && (
            <DetailRow icon="location" label="Location" value={interview.location} />
          )}
          {interview.alternative_time && interview.status === "proposed" && (
            <DetailRow icon="alt" label="Alt. time" value={formatTime(interview.alternative_time)} />
          )}
          {interview.notes && (
            <DetailRow icon="notes" label="Notes" value={interview.notes} />
          )}
        </div>

        {/* Provider contact info (for caregivers receiving proposals — so they can call to reschedule) */}
        {perspective === "student" && interview.status === "proposed" && interview.proposed_by === interview.provider_profile_id && (providerEmail || providerPhone) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Can&apos;t make this time? Contact {interview.provider?.display_name} to suggest an alternative:</p>
            <div className="space-y-1">
              {providerEmail && (
                <a href={`mailto:${providerEmail}`} className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {providerEmail}
                </a>
              )}
              {providerPhone && (
                <a href={`tel:${providerPhone}`} className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {providerPhone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Actions — based on who proposed, not just perspective */}
        <div className="flex gap-2">
          {(() => {
            // Determine if "I" am the proposer based on perspective + proposed_by
            const myProfileId = perspective === "provider"
              ? interview.provider_profile_id
              : interview.student_profile_id;
            const iProposed = interview.proposed_by === myProfileId;

            if (interview.status === "proposed") {
              if (iProposed) {
                // I proposed → I can only withdraw
                return (
                  <button type="button" onClick={() => handleAction("cancelled")} disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                    {isLoading ? "..." : "Withdraw Request"}
                  </button>
                );
              }
              // They proposed → I can confirm or decline
              return (
                <>
                  <button type="button" onClick={() => handleAction("confirmed")} disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
                    {isLoading ? "..." : "Confirm"}
                  </button>
                  <button type="button" onClick={() => handleAction("cancelled")} disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                    Decline
                  </button>
                </>
              );
            }

            if (interview.status === "confirmed") {
              return (
                <button type="button" onClick={() => handleAction("cancelled")} disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                  {isLoading ? "..." : "Cancel Interview"}
                </button>
              );
            }

            return null;
          })()}

          {/* No actions for past/cancelled */}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Row ── */

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const icons: Record<string, string> = {
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    type: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
    duration: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    location: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
    alt: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    notes: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  };

  return (
    <div className="flex items-start gap-2.5">
      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon] || icons.notes} />
      </svg>
      <div>
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{label}</span>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}
