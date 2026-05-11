"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Helpers ─── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

/* ─── Types ─── */
type EventType = "visit" | "video_call" | "meet_greet";
type EventStatus = "confirmed" | "pending" | "in_progress";
type CaregiverStatus = "active" | "paused" | "ended";

interface ScheduleEvent {
  id: string;
  caregiverName: string;
  caregiverPhoto: string;
  caregiverSchool: string;
  recipientName: string;
  recipientId: string;
  time: string;
  duration: string;
  type: EventType;
  status: EventStatus;
  date: "today" | "tomorrow" | "this_week";
  calendarDate: string; // ISO date string e.g. "2026-05-11"
  dayLabel?: string;
  photoUpdates?: string[];
  checkInTime?: string;
}

interface CareRecipient {
  id: string;
  name: string;
  photo: string;
  age: number;
  relationship: string;
  welcomePackageStatus: "complete" | "in_progress" | "not_started";
  caregiverCount: number;
  visitsThisMonth: number;
  conditions: string[];
  medications: string[];
  allergies: string[];
  mobility: string;
  dietary: string[];
  emergencyContact: string;
  emergencyPhone: string;
  doctorName: string;
  address: string;
  notes: string;
}

interface ActiveCaregiver {
  id: string;
  name: string;
  photo: string;
  school: string;
  rate: number;
  recipientName: string;
  recipientId: string;
  schedule: string;
  lastVisit: string;
  totalVisits: number;
  status: CaregiverStatus;
}

interface PastVisit {
  id: string;
  caregiverName: string;
  caregiverPhoto: string;
  recipientName: string;
  recipientId: string;
  date: string;
  time: string;
  duration: string;
  type: "visit" | "video_call";
  review?: {
    rating: number;
    tags: string[];
    comment: string;
    submittedAt: string;
  };
}

/* ─── Mock Data ─── */
const USER_NAME = "Sarah";

const MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: "e1",
    caregiverName: "Maria S.",
    caregiverPhoto: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "University of Houston",
    recipientName: "Mom",
    recipientId: "r1",
    time: "9:00 AM - 12:00 PM",
    duration: "3 hrs",
    type: "visit",
    status: "in_progress",
    date: "today",
    calendarDate: "2026-05-11",
    checkInTime: "9:02 AM",
    photoUpdates: ["https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg?auto=compress&cs=tinysrgb&w=300"],
  },
  {
    id: "e2",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "Rice University",
    recipientName: "Dad",
    recipientId: "r2",
    time: "2:00 PM - 2:30 PM",
    duration: "30 min",
    type: "video_call",
    status: "confirmed",
    date: "this_week",
    calendarDate: "2026-05-13",
    dayLabel: "Wednesday",
  },
  {
    id: "e3",
    caregiverName: "Maria S.",
    caregiverPhoto: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "University of Houston",
    recipientName: "Mom",
    recipientId: "r1",
    time: "9:00 AM - 12:00 PM",
    duration: "3 hrs",
    type: "visit",
    status: "confirmed",
    date: "tomorrow",
    calendarDate: "2026-05-12",
  },
  {
    id: "e4",
    caregiverName: "David L.",
    caregiverPhoto: "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "Texas A&M",
    recipientName: "Mom",
    recipientId: "r1",
    time: "10:00 AM - 10:30 AM",
    duration: "30 min",
    type: "meet_greet",
    status: "pending",
    date: "this_week",
    calendarDate: "2026-05-15",
    dayLabel: "Thursday",
  },
  {
    id: "e5",
    caregiverName: "Maria S.",
    caregiverPhoto: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "University of Houston",
    recipientName: "Mom",
    recipientId: "r1",
    time: "9:00 AM - 12:00 PM",
    duration: "3 hrs",
    type: "visit",
    status: "confirmed",
    date: "this_week",
    calendarDate: "2026-05-16",
    dayLabel: "Friday",
  },
  {
    id: "e6",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "Rice University",
    recipientName: "Dad",
    recipientId: "r2",
    time: "2:00 PM - 5:00 PM",
    duration: "3 hrs",
    type: "visit",
    status: "confirmed",
    date: "this_week",
    calendarDate: "2026-05-14",
    dayLabel: "Thursday",
  },
  {
    id: "e7",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    caregiverSchool: "Rice University",
    recipientName: "Dad",
    recipientId: "r2",
    time: "2:00 PM - 5:00 PM",
    duration: "3 hrs",
    type: "visit",
    status: "confirmed",
    date: "this_week",
    calendarDate: "2026-05-15",
    dayLabel: "Thursday",
  },
];

const MOCK_RECIPIENTS: CareRecipient[] = [
  {
    id: "r1",
    name: "Dorothy (Mom)",
    photo: "https://images.pexels.com/photos/2050994/pexels-photo-2050994.jpeg?auto=compress&cs=tinysrgb&w=600",
    age: 78,
    relationship: "Mother",
    welcomePackageStatus: "complete",
    caregiverCount: 2,
    visitsThisMonth: 8,
    conditions: ["Early-stage dementia", "Hypertension", "Arthritis"],
    medications: ["Donepezil 10mg", "Lisinopril 20mg", "Ibuprofen 200mg"],
    allergies: ["Penicillin", "Shellfish"],
    mobility: "Uses walker, needs help with stairs",
    dietary: ["Low sodium", "No shellfish"],
    emergencyContact: "Sarah Johnson",
    emergencyPhone: "(713) 555-0142",
    doctorName: "Dr. Patricia Chen",
    address: "4521 Elm Street, Houston, TX 77019",
    notes: "Best in the mornings, gets confused in the afternoons. Loves puzzles and gardening. Needs reminders for medications.",
  },
  {
    id: "r2",
    name: "Robert (Dad)",
    photo: "https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=600",
    age: 81,
    relationship: "Father",
    welcomePackageStatus: "in_progress",
    caregiverCount: 1,
    visitsThisMonth: 3,
    conditions: ["Type 2 Diabetes", "Mild hearing loss"],
    medications: ["Metformin 500mg", "Aspirin 81mg"],
    allergies: ["Sulfa drugs"],
    mobility: "Independent, uses cane outdoors",
    dietary: ["Diabetic-friendly", "Low sugar"],
    emergencyContact: "Sarah Johnson",
    emergencyPhone: "(713) 555-0142",
    doctorName: "Dr. James Rivera",
    address: "4521 Elm Street, Houston, TX 77019",
    notes: "Very independent, prefers minimal assistance. Enjoys reading and watching baseball. Hard of hearing on the left side.",
  },
];

const MOCK_CAREGIVERS: ActiveCaregiver[] = [
  {
    id: "cg1",
    name: "Maria S.",
    photo: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    school: "University of Houston",
    rate: 20,
    recipientName: "Mom",
    recipientId: "r1",
    schedule: "Mon / Wed / Fri, 9am - 12pm",
    lastVisit: "May 6",
    totalVisits: 12,
    status: "active",
  },
  {
    id: "cg2",
    name: "Aisha J.",
    photo: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    school: "Rice University",
    rate: 22,
    recipientName: "Dad",
    recipientId: "r2",
    schedule: "Tue / Thu, 2pm - 5pm",
    lastVisit: "May 5",
    totalVisits: 6,
    status: "active",
  },
];

interface SpendingEntry {
  date: string;
  caregiver: string;
  recipient: string;
  recipientId: string;
  hours: number;
  rate: number;
  total: number;
}

const OLERA_FEE_RATE = 0.10; // 10% platform fee

const MOCK_SPENDING: SpendingEntry[] = [
  { date: "May 2", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 4", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 5", caregiver: "Aisha J.", recipient: "Dad", recipientId: "r2", hours: 3, rate: 22, total: 66 },
  { date: "May 6", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 7", caregiver: "Aisha J.", recipient: "Dad", recipientId: "r2", hours: 3, rate: 22, total: 66 },
  { date: "May 8", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 9", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 9", caregiver: "Aisha J.", recipient: "Dad", recipientId: "r2", hours: 3, rate: 22, total: 66 },
  { date: "May 11", caregiver: "Maria S.", recipient: "Mom", recipientId: "r1", hours: 3, rate: 20, total: 60 },
  { date: "May 11", caregiver: "Aisha J.", recipient: "Dad", recipientId: "r2", hours: 3, rate: 22, total: 66 },
];
// Subtotals: Mom = 6x60 = $360, Dad = 4x66 = $264, Combined = $624
// + 10% Olera fee: Mom = $396, Dad = $290.40, Combined = $686.40

const REVIEW_TAGS = ["Punctual", "Great with my loved one", "Clear communicator", "Patient", "Caring", "Reliable", "Goes above and beyond"];
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

const INITIAL_PAST_VISITS: PastVisit[] = [
  {
    id: "visit-maria-0511",
    caregiverName: "Maria S.",
    caregiverPhoto: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Mom",
    recipientId: "r1",
    date: "May 9, 2026",
    time: "9:00 AM - 12:00 PM",
    duration: "3 hrs",
    type: "visit",
  },
  {
    id: "visit-aisha-0509",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Dad",
    recipientId: "r2",
    date: "May 9, 2026",
    time: "2:00 PM - 5:00 PM",
    duration: "3 hrs",
    type: "visit",
  },
  {
    id: "visit-aisha-0508",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Mom",
    recipientId: "r1",
    date: "May 8, 2026",
    time: "1:00 PM - 4:00 PM",
    duration: "3 hrs",
    type: "visit",
  },
  {
    id: "visit-aisha-0507",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Dad",
    recipientId: "r2",
    date: "May 7, 2026",
    time: "2:00 PM - 5:00 PM",
    duration: "3 hrs",
    type: "visit",
  },
];

/* ─── Sub-components ─── */

function EventTypeIcon({ type, className = "w-4 h-4" }: { type: EventType; className?: string }) {
  switch (type) {
    case "visit":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    case "video_call":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
        </svg>
      );
    case "meet_greet":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z" />
        </svg>
      );
  }
}

function StatusBadge({ status }: { status: EventStatus | CaregiverStatus }) {
  const config = {
    confirmed: { label: "Confirmed", bg: "bg-success-50", text: "text-success-700", dot: "bg-success-500" },
    pending: { label: "Pending", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
    in_progress: { label: "In progress", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
    active: { label: "Active", bg: "bg-success-50", text: "text-success-700", dot: "bg-success-500" },
    paused: { label: "Paused", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
    ended: { label: "Ended", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function EventTypeLabel({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = { visit: "Visit", video_call: "Video call", meet_greet: "Meet & greet" };
  return <span className="text-gray-500 text-text-xs">{labels[type]}</span>;
}

function WelcomePackageBadge({ status }: { status: CareRecipient["welcomePackageStatus"] }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        Complete
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-700 bg-warning-50 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      Not started
    </span>
  );
}

/* ─── Calendar helpers ─── */
function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EVENT_COLORS: Record<EventType, { bg: string; border: string; text: string; dot: string }> = {
  visit: { bg: "bg-primary-50", border: "border-primary-200", text: "text-primary-700", dot: "bg-primary-500" },
  video_call: { bg: "bg-warm-50", border: "border-warm-200", text: "text-warm-700", dot: "bg-warm-500" },
  meet_greet: { bg: "bg-secondary-50", border: "border-secondary-200", text: "text-secondary-700", dot: "bg-secondary-500" },
};


/* ─── Event Card ─── */
function EventCard({ event }: { event: ScheduleEvent }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
      <div className="flex items-start gap-3">
        {/* Caregiver photo */}
        <Image
          src={event.caregiverPhoto}
          alt={event.caregiverName}
          width={44}
          height={44}
          className="w-11 h-11 rounded-full object-cover shrink-0"
        />

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-text-sm font-semibold text-gray-900 truncate">{event.caregiverName}</span>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-text-xs text-gray-500 mb-1.5">for {event.recipientName}</p>

          <div className="flex items-center gap-3 text-text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <EventTypeIcon type={event.type} className="w-3.5 h-3.5 text-gray-400" />
              <EventTypeLabel type={event.type} />
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {event.time}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{event.duration}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {event.type === "video_call" && event.status === "confirmed" && (
            <button className="px-3 py-1.5 bg-primary-600 text-white text-text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Join call
            </button>
          )}
          <Link
            href="/care-shifts/inbox"
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Message
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Editable Profile Field ─── */
function ProfileField({
  label,
  value,
  isEditing,
  onSave,
  renderView,
  multiline,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onSave: (val: string) => void;
  renderView?: React.ReactNode;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  // Sync draft when switching out of edit mode
  const handleBlur = () => {
    if (draft !== value) onSave(draft);
  };

  if (isEditing) {
    return (
      <div>
        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {renderView || <p className="text-text-sm text-gray-700">{value}</p>}
    </div>
  );
}

/* ─── Dashboard Hero ─── */
type HeroScenario =
  | { type: "in_progress"; event: ScheduleEvent }
  | { type: "soon"; event: ScheduleEvent; minutesAway: number }
  | { type: "later_today"; event: ScheduleEvent }
  | { type: "next_within_week"; event: ScheduleEvent }
  | { type: "next_beyond_week"; event: ScheduleEvent }
  | { type: "no_visits" }
  | { type: "awaiting_review"; visit: PastVisit };

function getHeroScenario(events: ScheduleEvent[], pastVisits: PastVisit[]): HeroScenario {
  // 1. In progress
  const inProgress = events.find((e) => e.status === "in_progress");
  if (inProgress) return { type: "in_progress", event: inProgress };

  // 2. Today events
  const todayEvents = events.filter((e) => e.date === "today" && e.status === "confirmed");
  if (todayEvents.length > 0) {
    // Check if any is "soon" (within 2 hours — for demo, treat all today events as scenario 2/3)
    const first = todayEvents[0];
    // Simple heuristic: parse start hour from time
    const startStr = first.time.split(" - ")[0];
    const now = new Date();
    const [timePart, ampm] = startStr.split(" ");
    const [hStr, mStr] = timePart.split(":");
    let startHour = parseInt(hStr);
    if (ampm === "PM" && startHour !== 12) startHour += 12;
    if (ampm === "AM" && startHour === 12) startHour = 0;
    const startMin = parseInt(mStr);
    const minutesAway = (startHour * 60 + startMin) - (now.getHours() * 60 + now.getMinutes());

    if (minutesAway > 0 && minutesAway <= 120) {
      return { type: "soon", event: first, minutesAway };
    }
    return { type: "later_today", event: first };
  }

  // 3. Check for pending review on recent past visit
  const unreviewedVisit = pastVisits.find((v) => !v.review);
  if (unreviewedVisit) return { type: "awaiting_review", visit: unreviewedVisit };

  // 4. Future events
  const futureEvents = events.filter((e) => e.date !== "today");
  if (futureEvents.length > 0) {
    return { type: "next_within_week", event: futureEvents[0] };
  }

  return { type: "no_visits" };
}

function DashboardHero({
  scenario,
  onReview,
}: {
  scenario: HeroScenario;
  onReview?: (visitId: string) => void;
}) {
  const greeting = `${getGreeting()}, ${USER_NAME}`;
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const renderContent = () => {
    switch (scenario.type) {
      case "in_progress": {
        const e = scenario.event;
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-success-600">Live now</span>
            </div>
            <p className="text-text-md text-gray-600 mb-1">{e.caregiverName} is with {e.recipientName} right now</p>
            <p className="text-text-sm text-gray-400">Checked in at {e.checkInTime || "9:00 AM"} &middot; {e.duration} visit</p>
          </div>
        );
      }

      case "soon": {
        const e = scenario.event;
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-sm font-medium text-primary-400 uppercase tracking-wider mb-1">On today&apos;s schedule</p>
            <p className="text-text-md text-gray-600 mb-1">{e.caregiverName.split(" ")[0]} arrives at {e.time.split(" - ")[0]}</p>
            <p className="text-text-sm text-gray-400">In {scenario.minutesAway} minutes &mdash; for {e.recipientName}&apos;s {e.type === "video_call" ? "video call" : "morning visit"}</p>
          </div>
        );
      }

      case "later_today": {
        const e = scenario.event;
        const typeLabel = e.type === "video_call" ? "video call" : "visit";
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-sm font-medium text-primary-400 uppercase tracking-wider mb-1">On today&apos;s schedule</p>
            <p className="text-text-md text-gray-600 mb-1">{e.caregiverName.split(" ")[0]} {typeLabel} {e.recipientName} at {e.time.split(" - ")[0]}</p>
            <p className="text-text-sm text-gray-400">{e.duration} {e.type === "video_call" ? "call to check in" : "visit"}</p>
          </div>
        );
      }

      case "next_within_week": {
        const e = scenario.event;
        const dayLabel = e.dayLabel || "soon";
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-sm font-medium text-primary-400 uppercase tracking-wider mb-1">Next up</p>
            <p className="text-text-md text-gray-600 mb-1">Quiet day ahead</p>
            <p className="text-text-sm text-gray-400">Next visit {dayLabel} at {e.time.split(" - ")[0]} with {e.caregiverName} for {e.recipientName}</p>
          </div>
        );
      }

      case "next_beyond_week":
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-md text-gray-600 mb-1">A quieter stretch</p>
            <p className="text-text-sm text-gray-400">Dorothy has had 8 visits this month &mdash; her most active month yet.</p>
          </div>
        );

      case "no_visits":
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-md text-gray-600 mb-1">Ready to book your next visit?</p>
            <p className="text-text-sm text-gray-400">Your care team is ready when you are. Book Maria, Aisha, or David for an upcoming day.</p>
          </div>
        );

      case "awaiting_review": {
        const v = scenario.visit;
        return (
          <div>
            <p className="text-text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{dateStr}</p>
            <h1 className="text-display-sm font-bold text-gray-900 mb-3">{greeting}</h1>
            <p className="text-text-md text-gray-600 mb-1">How was {v.recipientName}&apos;s visit with {v.caregiverName}?</p>
            <p className="text-text-sm text-gray-400">{v.caregiverName.split(" ")[0]} wrapped up on {v.date}. Leave a review when you have a moment.</p>
          </div>
        );
      }
    }
  };

  // Check for pending reviews as secondary chips (scenario 8)
  const pendingReviewChip = scenario.type === "in_progress" ? (
    <div className="mt-3 flex items-center gap-2">
      <span className="px-3 py-1.5 bg-warning-50 text-warning-700 text-text-xs font-medium rounded-full">
        1 review pending for Aisha&apos;s visit yesterday
      </span>
      <button onClick={() => { if (onReview) onReview("visit-aisha-0509"); }} className="text-text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer">Leave review &rarr;</button>
    </div>
  ) : null;

  return (
    <div className="bg-gradient-to-br from-white via-white to-primary-25 border-b border-gray-100 px-8 py-6">
      <div className="max-w-4xl mx-auto">
        {renderContent()}
        {pendingReviewChip}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>(MOCK_RECIPIENTS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [expandedStat, setExpandedStat] = useState<"spent" | "visits" | "meet_greets" | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>(MOCK_EVENTS);
  const [cancelModal, setCancelModal] = useState<string | null>(null); // event id
  const [rescheduleModal, setRescheduleModal] = useState<string | null>(null); // event id
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);
  const [rescheduledMessage, setRescheduledMessage] = useState<string | null>(null);
  // Past visits + review
  const [pastVisits, setPastVisits] = useState<PastVisit[]>(INITIAL_PAST_VISITS);
  const [reviewModal, setReviewModal] = useState<string | null>(null); // past visit id
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Filter events and caregivers by recipient
  const filteredEvents = recipientFilter === "all"
    ? events
    : events.filter((e) => e.recipientId === recipientFilter);


  // Stats
  const upcomingCount = filteredEvents.length;
  const nextEventTime = filteredEvents.length > 0 ? filteredEvents[0].time.split(" - ")[0] : null;
  const filteredSpending = recipientFilter === "all"
    ? MOCK_SPENDING
    : MOCK_SPENDING.filter((s) => s.recipientId === recipientFilter);
  const spendingSubtotal = filteredSpending.reduce((sum, s) => sum + s.total, 0);
  const oleraFee = Math.round(spendingSubtotal * OLERA_FEE_RATE * 100) / 100;
  const spentThisMonth = spendingSubtotal + oleraFee;
  const recipientCount = MOCK_RECIPIENTS.length;

  // Urgent banner: video call within 15 minutes
  const urgentCall = filteredEvents.find((e) => e.date === "today" && e.type === "video_call" && e.status === "confirmed");

  // Dynamic header scenario
  const heroScenario = getHeroScenario(filteredEvents, pastVisits);

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="flex-1 min-w-0">
          {/* ── Dynamic Hero Header ── */}
          <DashboardHero
            scenario={heroScenario}
            onReview={(visitId) => {
              setReviewModal(visitId);
              setReviewRating(0);
              setReviewHover(0);
              setReviewTags([]);
              setReviewComment("");
            }}
          />

          <div className="max-w-4xl mx-auto px-8 py-6">

            {/* ── Multi-recipient filter ── */}
            {MOCK_RECIPIENTS.length > 1 && (
              <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
                <button
                  onClick={() => setRecipientFilter("all")}
                  className={`px-4 py-2 rounded-lg text-text-sm font-medium transition-colors ${
                    recipientFilter === "all"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                {MOCK_RECIPIENTS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRecipientFilter(r.id)}
                    className={`px-4 py-2 rounded-lg text-text-sm font-medium transition-colors ${
                      recipientFilter === r.id
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {r.name.split(" (")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════
                1. Care Recipients (Profile Cards)
               ════════════════════════════════════════════════ */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-display-xs font-semibold text-gray-900">Care recipients</h2>
                <button className="flex items-center gap-1.5 text-text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add new profile
                </button>
              </div>

              <div className="space-y-4">
                {recipients
                  .filter((r) => recipientFilter === "all" || r.id === recipientFilter)
                  .map((r) => {
                  const isExpanded = expandedRecipient === r.id;
                  const isEditing = editingRecipient === r.id;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
                      {/* Card header — always visible, enriched with medical preview */}
                      <button
                        type="button"
                        onClick={() => setExpandedRecipient(isExpanded ? null : r.id)}
                        className="w-full p-5 text-left"
                      >
                        <div className="flex items-start gap-4">
                          <Image
                            src={r.photo}
                            alt={r.name}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-2xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-text-sm font-semibold text-gray-900">{r.name}</h3>
                              <WelcomePackageBadge status={r.welcomePackageStatus} />
                            </div>
                            <p className="text-text-xs text-gray-500 mb-2">Age {r.age} &middot; {r.relationship} &middot; {r.address.split(",").slice(-2).join(",").trim()}</p>

                            {/* Description preview */}
                            <p className="text-text-xs text-gray-600 mb-2.5 line-clamp-1">{r.notes}</p>

                            {/* Inline medical preview */}
                            <div className="flex flex-wrap gap-1.5">
                              {r.conditions.slice(0, 3).map((c) => (
                                <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full">{c}</span>
                              ))}
                              {r.allergies.length > 0 && (
                                <span className="px-2 py-0.5 bg-error-50 text-error-600 text-[11px] rounded-full flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                  {r.allergies.join(", ")}
                                </span>
                              )}
                              {r.medications.length > 0 && (
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[11px] rounded-full">
                                  {r.medications.length} medications
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats inline */}
                          <div className="hidden sm:flex items-center gap-6 mr-2 shrink-0 pt-1">
                            <div className="text-center">
                              <p className="text-text-sm font-semibold text-gray-900">{r.caregiverCount}</p>
                              <p className="text-[10px] text-gray-400">Caregivers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-text-sm font-semibold text-gray-900">{r.visitsThisMonth}</p>
                              <p className="text-[10px] text-gray-400">Visits/mo</p>
                            </div>
                          </div>

                          <svg className={`w-5 h-5 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded profile details */}
                      {isExpanded && (
                        <div className="border-t border-gray-50 px-5 pb-5">
                          {/* Edit toggle */}
                          <div className="flex items-center justify-end pt-3 mb-4">
                            <button
                              onClick={() => setEditingRecipient(isEditing ? null : r.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-xs font-medium transition-colors ${
                                isEditing ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                              {isEditing ? "Done editing" : "Edit profile"}
                            </button>
                          </div>

                          {/* Profile grid */}
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <ProfileField
                              label="Conditions"
                              isEditing={isEditing}
                              value={r.conditions.join(", ")}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, conditions: val.split(",").map((s) => s.trim()).filter(Boolean) } : p))}
                              renderView={<div className="flex flex-wrap gap-1.5">{r.conditions.map((c) => <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-text-xs rounded-full">{c}</span>)}</div>}
                            />
                            <ProfileField
                              label="Medications"
                              isEditing={isEditing}
                              value={r.medications.join(", ")}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, medications: val.split(",").map((s) => s.trim()).filter(Boolean) } : p))}
                              renderView={<div className="flex flex-wrap gap-1.5">{r.medications.map((m) => <span key={m} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-text-xs rounded-full">{m}</span>)}</div>}
                            />
                            <ProfileField
                              label="Allergies"
                              isEditing={isEditing}
                              value={r.allergies.join(", ")}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, allergies: val.split(",").map((s) => s.trim()).filter(Boolean) } : p))}
                              renderView={<div className="flex flex-wrap gap-1.5">{r.allergies.map((a) => <span key={a} className="px-2 py-0.5 bg-error-50 text-error-700 text-text-xs rounded-full">{a}</span>)}</div>}
                            />
                            <ProfileField
                              label="Mobility"
                              isEditing={isEditing}
                              value={r.mobility}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, mobility: val } : p))}
                            />
                            <ProfileField
                              label="Dietary needs"
                              isEditing={isEditing}
                              value={r.dietary.join(", ")}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, dietary: val.split(",").map((s) => s.trim()).filter(Boolean) } : p))}
                              renderView={<div className="flex flex-wrap gap-1.5">{r.dietary.map((d) => <span key={d} className="px-2 py-0.5 bg-warning-50 text-warning-700 text-text-xs rounded-full">{d}</span>)}</div>}
                            />
                            <ProfileField
                              label="Address"
                              isEditing={isEditing}
                              value={r.address}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, address: val } : p))}
                            />
                            <ProfileField
                              label="Primary doctor"
                              isEditing={isEditing}
                              value={r.doctorName}
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, doctorName: val } : p))}
                            />
                            <ProfileField
                              label="Emergency contact"
                              isEditing={isEditing}
                              value={`${r.emergencyContact} - ${r.emergencyPhone}`}
                              onSave={(val) => { const parts = val.split(" - "); setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, emergencyContact: parts[0] || val, emergencyPhone: parts[1] || "" } : p)); }}
                            />
                          </div>

                          {/* Notes — full width */}
                          <div className="mt-4">
                            <ProfileField
                              label="Notes for caregivers"
                              isEditing={isEditing}
                              value={r.notes}
                              multiline
                              onSave={(val) => setRecipients((prev) => prev.map((p) => p.id === r.id ? { ...p, notes: val } : p))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 2. Stat cards (horizontal) ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setExpandedStat(expandedStat === "spent" ? null : "spent")}
                className={`bg-white rounded-2xl px-5 py-5 text-left transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
                  expandedStat === "spent" ? "ring-2 ring-warm-200" : ""
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Spent this month</span>
                <p className="text-display-sm font-bold text-gray-900 mt-1 mb-1">{formatCurrency(spentThisMonth)}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-xs text-gray-400">May 2026</span>
                  <span className="flex items-center gap-0.5 text-text-xs font-medium text-success-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    $80 vs. last month
                  </span>
                </div>
              </button>

              <button
                onClick={() => setExpandedStat(expandedStat === "visits" ? null : "visits")}
                className={`bg-white rounded-2xl px-5 py-5 text-left transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
                  expandedStat === "visits" ? "ring-2 ring-primary-200" : ""
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Visits this week</span>
                <p className="text-display-sm font-bold text-gray-900 mt-1 mb-1">{filteredEvents.filter((e) => e.type === "visit" || e.type === "video_call").length}</p>
                <p className="text-text-xs text-primary-500">
                  {filteredEvents.filter((e) => (e.type === "visit" || e.type === "video_call") && e.date === "today").length > 0
                    ? `Next: Today at ${filteredEvents.find((e) => (e.type === "visit" || e.type === "video_call") && e.date === "today")?.time.split(" - ")[0]}`
                    : `${filteredEvents.filter((e) => e.type === "visit" || e.type === "video_call").length} scheduled`}
                </p>
              </button>

              <button
                onClick={() => setExpandedStat(expandedStat === "meet_greets" ? null : "meet_greets")}
                className={`bg-white rounded-2xl px-5 py-5 text-left transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
                  expandedStat === "meet_greets" ? "ring-2 ring-secondary-200" : ""
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Meet &amp; greets</span>
                {(() => {
                  const meetGreets = filteredEvents.filter((e) => e.type === "meet_greet");
                  const pendingCount = meetGreets.filter((e) => e.status === "pending").length;
                  const nextMG = meetGreets[0];
                  const dayName = nextMG?.dayLabel || (nextMG?.date === "today" ? "Today" : nextMG?.date === "tomorrow" ? "Tomorrow" : "");
                  return (
                    <>
                      <p className="text-display-sm font-bold text-gray-900 mt-1 mb-1">{meetGreets.length}</p>
                      <p className="text-text-xs text-warning-500">
                        {pendingCount} pending{nextMG ? ` · ${dayName} with ${nextMG.caregiverName}` : ""}
                      </p>
                    </>
                  );
                })()}
              </button>
            </div>

            {/* ── Expanded stat panels ── */}
            {expandedStat === "spent" && (() => {
              const totalHours = filteredSpending.reduce((sum, s) => sum + s.hours, 0);
              return (
                <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 mb-8 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-text-md font-semibold text-gray-900">Monthly breakdown</h3>
                      <p className="text-text-xs text-gray-500">May 2026 &middot; {totalHours} hours &middot; {formatCurrency(spentThisMonth)} total</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-warm-50 border border-warm-200 text-warm-700 text-text-xs font-semibold rounded-xl hover:bg-warm-100 transition-colors flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Request invoice
                      </button>
                      <button
                        onClick={() => setExpandedStat(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Caregiver</th>
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">For</th>
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">Hours</th>
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">Rate</th>
                          <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredSpending.map((s, i) => (
                          <tr key={i} className="hover:bg-gray-25 transition-colors">
                            <td className="px-4 py-3 text-text-sm text-gray-700">{s.date}</td>
                            <td className="px-4 py-3 text-text-sm text-gray-900 font-medium">{s.caregiver}</td>
                            <td className="px-4 py-3 text-text-sm text-gray-500">{s.recipient}</td>
                            <td className="px-4 py-3 text-text-sm text-gray-700 text-right">{s.hours}</td>
                            <td className="px-4 py-3 text-text-sm text-gray-500 text-right">${s.rate}/hr</td>
                            <td className="px-4 py-3 text-text-sm text-gray-900 font-semibold text-right">{formatCurrency(s.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2.5 text-text-sm text-gray-500" colSpan={3}>Subtotal</td>
                          <td className="px-4 py-2.5 text-text-sm text-gray-700 text-right">{totalHours}</td>
                          <td className="px-4 py-2.5 text-text-sm text-gray-500 text-right"></td>
                          <td className="px-4 py-2.5 text-text-sm text-gray-700 text-right">{formatCurrency(spendingSubtotal)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-text-sm text-gray-500" colSpan={5}>Olera platform fee (10%)</td>
                          <td className="px-4 py-2.5 text-text-sm text-gray-700 text-right">{formatCurrency(oleraFee)}</td>
                        </tr>
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-3 text-text-sm text-gray-900" colSpan={5}>Total</td>
                          <td className="px-4 py-3 text-text-sm text-gray-900 text-right">{formatCurrency(spentThisMonth)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}

            {expandedStat === "visits" && (() => {
              const visits = filteredEvents.filter((e) => e.type === "visit" || e.type === "video_call");
              return (
                <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 mb-8 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-text-md font-semibold text-gray-900">Upcoming visits</h3>
                      <p className="text-text-xs text-gray-500">{visits.length} scheduled this week</p>
                    </div>
                    <button
                      onClick={() => setExpandedStat(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {visits.length === 0 ? (
                    <p className="text-text-sm text-gray-500 py-4 text-center">No visits scheduled this week.</p>
                  ) : (
                    <div className="space-y-3">
                      {visits.map((event) => (
                        <div key={event.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-25 transition-colors">
                          <div className="flex items-start gap-3">
                            <Image
                              src={event.caregiverPhoto}
                              alt={event.caregiverName}
                              width={44}
                              height={44}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-text-sm font-semibold text-gray-900">{event.caregiverName}</span>
                                <StatusBadge status={event.status} />
                              </div>
                              <p className="text-text-xs text-gray-500 mb-1.5">for {event.recipientName}</p>
                              <div className="flex items-center gap-3 text-text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <EventTypeIcon type={event.type} className="w-3.5 h-3.5 text-gray-400" />
                                  {event.type === "video_call" ? "Video call" : "In-person visit"}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {event.time}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span>{event.duration}</span>
                                {event.dayLabel && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span>{event.dayLabel}</span>
                                  </>
                                )}
                                {event.date === "today" && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-success-600 font-medium">Today</span>
                                  </>
                                )}
                                {event.date === "tomorrow" && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-primary-600 font-medium">Tomorrow</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => { setRescheduleModal(event.id); setRescheduleDate(""); setRescheduleTime(""); }} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                Reschedule
                              </button>
                              <button onClick={() => setCancelModal(event.id)} className="px-3 py-1.5 bg-white border border-error-200 text-error-600 text-text-xs font-medium rounded-lg hover:bg-error-50 transition-colors">
                                Cancel
                              </button>
                              {event.type === "video_call" && event.status === "confirmed" && (
                                <button className="px-3 py-1.5 bg-primary-600 text-white text-text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
                                  Join call
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {expandedStat === "meet_greets" && (() => {
              const meetGreets = filteredEvents.filter((e) => e.type === "meet_greet");
              return (
                <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 mb-8 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-text-md font-semibold text-gray-900">Upcoming meet &amp; greets</h3>
                      <p className="text-text-xs text-gray-500">{meetGreets.length} scheduled this week</p>
                    </div>
                    <button
                      onClick={() => setExpandedStat(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {meetGreets.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-text-sm text-gray-500 mb-3">No meet &amp; greets scheduled.</p>
                      <Link href="/care-shifts" className="inline-block px-4 py-2 bg-primary-600 text-white text-text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Find a caregiver
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetGreets.map((event) => (
                        <div key={event.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-25 transition-colors">
                          <div className="flex items-start gap-3">
                            <Image
                              src={event.caregiverPhoto}
                              alt={event.caregiverName}
                              width={44}
                              height={44}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-text-sm font-semibold text-gray-900">{event.caregiverName}</span>
                                <StatusBadge status={event.status} />
                              </div>
                              <p className="text-text-xs text-gray-500 mb-1.5">{event.caregiverSchool} &middot; for {event.recipientName}</p>
                              <div className="flex items-center gap-3 text-text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {event.time}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span>{event.duration}</span>
                                {event.dayLabel && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span>{event.dayLabel}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => { setRescheduleModal(event.id); setRescheduleDate(""); setRescheduleTime(""); }} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                Reschedule
                              </button>
                              <button onClick={() => setCancelModal(event.id)} className="px-3 py-1.5 bg-white border border-error-200 text-error-600 text-text-xs font-medium rounded-lg hover:bg-error-50 transition-colors">
                                Cancel
                              </button>
                              <Link
                                href="/care-shifts/inbox"
                                className="px-3 py-1.5 bg-gray-900 text-white text-text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                Message
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 3. Savings insight ── */}
            <div className="bg-gradient-to-r from-success-50 to-primary-50 rounded-2xl px-5 py-4 mb-8 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-text-sm font-semibold text-gray-900">You&apos;ve saved $480 this month vs. traditional agencies</p>
                <p className="text-text-xs text-gray-500">Dorothy has had 8 visits this month &mdash; her most active month yet.</p>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                4. CALENDAR: Visits & Meet & Greets
               ════════════════════════════════════════════════ */}
            {(() => {
              const weekDates = getWeekDates(weekOffset);
              const todayISO = toISO(new Date());
              const weekStart = weekDates[0];
              const weekEnd = weekDates[6];
              const monthLabel = weekStart.getMonth() === weekEnd.getMonth()
                ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
                : `${MONTH_NAMES[weekStart.getMonth()]} - ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

              const expandedEvent = selectedEvent ? filteredEvents.find((e) => e.id === selectedEvent) : null;

              return (
                <section className="mb-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-display-xs font-semibold text-gray-900">Schedule</h2>
                      <span className="text-text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                        {filteredEvents.length} this week
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {weekOffset !== 0 && (
                        <button
                          onClick={() => setWeekOffset(0)}
                          className="px-3 py-1.5 text-text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          Today
                        </button>
                      )}
                      <button
                        onClick={() => { setWeekOffset((o) => o - 1); setSelectedEvent(null); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <span className="text-text-sm font-medium text-gray-700 min-w-[120px] text-center">{monthLabel}</span>
                      <button
                        onClick={() => { setWeekOffset((o) => o + 1); setSelectedEvent(null); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      <span className="text-text-xs text-gray-500">Visit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-warm-500" />
                      <span className="text-text-xs text-gray-500">Video call</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary-500" />
                      <span className="text-text-xs text-gray-500">Meet &amp; greet</span>
                    </div>
                  </div>

                  {/* Calendar grid */}
                  <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-50">
                      {weekDates.map((d, i) => {
                        const iso = toISO(d);
                        const isToday = iso === todayISO;
                        return (
                          <div key={i} className={`py-3 text-center border-r border-gray-50 last:border-r-0 ${isToday ? "bg-primary-25" : ""}`}>
                            <p className={`text-[11px] font-medium uppercase tracking-wider ${isToday ? "text-primary-600" : "text-gray-400"}`}>
                              {DAY_NAMES[i]}
                            </p>
                            <p className={`text-display-xs font-bold mt-0.5 ${isToday ? "text-primary-700" : "text-gray-900"}`}>
                              {d.getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Event cells */}
                    <div className="grid grid-cols-7 min-h-[100px]">
                      {weekDates.map((d, i) => {
                        const iso = toISO(d);
                        const isToday = iso === todayISO;
                        const dayEvents = filteredEvents.filter((e) => e.calendarDate === iso);

                        return (
                          <div
                            key={i}
                            className={`p-2 border-r border-gray-50 last:border-r-0 ${isToday ? "bg-primary-25/50" : ""}`}
                          >
                            <div className="space-y-1.5">
                              {dayEvents.length === 0 && (
                                <p className="text-[10px] text-gray-300 text-center pt-4">Free</p>
                              )}
                              {dayEvents.map((event) => {
                                const color = EVENT_COLORS[event.type];
                                const isSelected = selectedEvent === event.id;
                                return (
                                  <button
                                    key={event.id}
                                    onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-all ${color.bg} ${
                                      isSelected ? "ring-2 ring-offset-1 ring-gray-900 shadow-md" : "hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`} />
                                      <span className={`text-[10px] font-semibold truncate ${color.text}`}>
                                        {event.type === "meet_greet" ? "Meet & greet" : event.type === "video_call" ? "Video call" : "Visit"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">{event.time.split(" - ")[0]}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{event.caregiverName}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded event detail */}
                  {expandedEvent && (
                    <div className={`mt-4 rounded-2xl p-5 animate-fadeIn shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${EVENT_COLORS[expandedEvent.type].bg}`}>
                      <div className="flex items-start gap-4">
                        <Image
                          src={expandedEvent.caregiverPhoto}
                          alt={expandedEvent.caregiverName}
                          width={52}
                          height={52}
                          className="w-13 h-13 rounded-2xl object-cover shrink-0"
                          style={{ width: 52, height: 52 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-text-md font-semibold text-gray-900">{expandedEvent.caregiverName}</h3>
                            <StatusBadge status={expandedEvent.status} />
                          </div>
                          <p className="text-text-xs text-gray-500 mb-3">{expandedEvent.caregiverSchool}</p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Type</p>
                              <div className="flex items-center gap-1.5">
                                <EventTypeIcon type={expandedEvent.type} className="w-4 h-4 text-gray-600" />
                                <span className="text-text-sm font-medium text-gray-900">
                                  {expandedEvent.type === "meet_greet" ? "Meet & greet" : expandedEvent.type === "video_call" ? "Video call" : "Visit"}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Time</p>
                              <p className="text-text-sm font-medium text-gray-900">{expandedEvent.time}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                              <p className="text-text-sm font-medium text-gray-900">{expandedEvent.duration}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">For</p>
                              <p className="text-text-sm font-medium text-gray-900">{expandedEvent.recipientName}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions — all inline */}
                        <div className="flex items-center gap-2 shrink-0">
                          {expandedEvent.type === "video_call" && expandedEvent.status === "confirmed" && (
                            <button className="px-4 py-2 bg-primary-600 text-white text-text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                              Join call
                            </button>
                          )}
                          <Link
                            href="/care-shifts/inbox"
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            Message
                          </Link>
                          <button onClick={() => { setRescheduleModal(expandedEvent.id); setRescheduleDate(""); setRescheduleTime(""); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors">
                            Reschedule
                          </button>
                          <button onClick={() => setCancelModal(expandedEvent.id)} className="px-4 py-2 bg-white border border-error-200 text-error-600 text-text-xs font-medium rounded-xl hover:bg-error-50 transition-colors">
                            Cancel
                          </button>
                          <button
                            onClick={() => setSelectedEvent(null)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* ════════════════════════════════════════════════
                PAST VISITS
               ════════════════════════════════════════════════ */}
            <section className="mb-10">
              <h2 className="text-display-xs font-semibold text-gray-900 mb-4">Past visits</h2>
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] divide-y divide-gray-50">
                {(() => {
                  const filtered = recipientFilter === "all" ? pastVisits : pastVisits.filter((v) => v.recipientId === recipientFilter);
                  // Track which caregivers already have a review (from any visit)
                  const reviewedCaregivers = new Set<string>();
                  const shownReviewForCaregiver = new Set<string>();
                  filtered.forEach((v) => { if (v.review) reviewedCaregivers.add(v.caregiverName); });

                  return filtered.map((visit) => {
                    const hasReview = reviewedCaregivers.has(visit.caregiverName);
                    // Only show review badge/preview on the first (most recent) visit for this caregiver
                    const showReviewHere = hasReview && !shownReviewForCaregiver.has(visit.caregiverName);
                    if (showReviewHere) shownReviewForCaregiver.add(visit.caregiverName);
                    // Find the actual review data for this caregiver
                    const caregiverReview = showReviewHere ? filtered.find((v) => v.caregiverName === visit.caregiverName && v.review)?.review : null;

                    return (
                      <div key={visit.id} className="px-5 py-4 hover:bg-gray-25 transition-colors">
                        <div className="flex items-center gap-4">
                          <Image
                            src={visit.caregiverPhoto}
                            alt={visit.caregiverName}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-text-md font-semibold text-gray-900">{visit.caregiverName}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                visit.type === "video_call" ? "bg-warm-50 text-warm-600" : "bg-primary-50 text-primary-600"
                              }`}>
                                {visit.type === "video_call" ? "Video call" : "Visit"}
                              </span>
                              <span className="text-text-xs text-gray-400">{visit.recipientName}</span>
                            </div>
                            <p className="text-text-xs text-gray-400">{visit.date} &middot; {visit.time} &middot; {visit.duration}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/care-shifts/visits/${visit.id}`}
                              className="px-3 py-1.5 text-text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              View visit details
                            </Link>
                            {showReviewHere && caregiverReview ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <svg key={i} className={`w-3.5 h-3.5 ${i < caregiverReview.rating ? "text-warning-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-[11px] text-gray-500 font-medium">Reviewed</span>
                              </div>
                            ) : !hasReview && !shownReviewForCaregiver.has(visit.caregiverName + "_btn") ? (() => {
                              shownReviewForCaregiver.add(visit.caregiverName + "_btn");
                              return (
                                <button
                                  onClick={() => {
                                    setReviewModal(visit.id);
                                    setReviewRating(0);
                                    setReviewHover(0);
                                    setReviewTags([]);
                                    setReviewComment("");
                                  }}
                                  className="px-4 py-2 bg-primary-600 text-white text-text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                  Leave a review
                                </button>
                              );
                            })() : null}
                          </div>
                        </div>
                        {/* Show review preview on the first visit row for this caregiver */}
                        {showReviewHere && caregiverReview?.comment && (
                          <div className="mt-2 ml-13 pl-0.5">
                            <p className="text-text-xs text-gray-500 italic">&ldquo;{caregiverReview.comment}&rdquo;</p>
                            {caregiverReview.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {caregiverReview.tags.map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-medium rounded-full">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="px-4 py-3">
                <Link href="/care-shifts/visits" className="text-text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
                  View all past visits
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </section>

          </div>
        </div>

      {/* ── Cancel confirmation modal ── */}
      {cancelModal && (() => {
        const event = events.find((e) => e.id === cancelModal);
        if (!event) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-error-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-text-md font-semibold text-gray-900">Cancel appointment?</h3>
                  <p className="text-text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  <Image src={event.caregiverPhoto} alt={event.caregiverName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-text-sm font-medium text-gray-900">{event.caregiverName}</p>
                    <p className="text-text-xs text-gray-500">
                      {event.type === "meet_greet" ? "Meet & greet" : event.type === "video_call" ? "Video call" : "Visit"} &middot; {event.time} &middot; for {event.recipientName}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-text-sm text-gray-600 mb-5">
                Are you sure you want to cancel this {event.type === "meet_greet" ? "meet & greet" : event.type === "video_call" ? "video call" : "visit"} with {event.caregiverName}? A notification will be sent to the caregiver.
              </p>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setCancelModal(null)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Keep appointment
                </button>
                <button
                  onClick={() => {
                    setEvents((prev) => prev.filter((e) => e.id !== cancelModal));
                    setSelectedEvent(null);
                    setCancelledMessage(`Your ${event.type === "meet_greet" ? "meet & greet" : event.type === "video_call" ? "video call" : "visit"} with ${event.caregiverName} has been cancelled.`);
                    setCancelModal(null);
                    setTimeout(() => setCancelledMessage(null), 4000);
                  }}
                  className="px-5 py-2.5 bg-error-600 text-white text-text-sm font-semibold rounded-xl hover:bg-error-700 transition-colors"
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Reschedule modal ── */}
      {rescheduleModal && (() => {
        const event = events.find((e) => e.id === rescheduleModal);
        if (!event) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRescheduleModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-text-lg font-semibold text-gray-900">Reschedule appointment</h3>
                <button onClick={() => setRescheduleModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current appointment */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Current appointment</p>
                <div className="flex items-center gap-3">
                  <Image src={event.caregiverPhoto} alt={event.caregiverName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-text-sm font-medium text-gray-900">{event.caregiverName}</p>
                    <p className="text-text-xs text-gray-500">
                      {event.type === "meet_greet" ? "Meet & greet" : event.type === "video_call" ? "Video call" : "Visit"} &middot; {event.time} &middot; for {event.recipientName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Time — side by side */}
              <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-text-sm font-medium text-gray-700 mb-2">Date</label>
                {/* Selected date display */}
                <div className="flex items-center justify-between px-4 py-3 border-2 border-primary-300 rounded-xl mb-3">
                  <span className={`text-text-sm ${rescheduleDate ? "text-gray-900" : "text-gray-400"}`}>
                    {rescheduleDate
                      ? (() => { const d = new Date(rescheduleDate + "T12:00:00"); return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); })()
                      : "Select a date..."}
                  </span>
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                {(() => {
                  const { year, month } = calendarMonth;
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const todayStr = toISO(new Date());
                  const prevMonth = () => setCalendarMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
                  const nextMonth = () => setCalendarMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
                  const cells: (number | null)[] = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
                  while (cells.length % 7 !== 0) cells.push(null);

                  return (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      {/* Month nav — teal header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-primary-500">
                        <button onClick={prevMonth} className="p-1 rounded-md text-white/80 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        </button>
                        <span className="text-text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
                        <button onClick={nextMonth} className="p-1 rounded-md text-white/80 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </button>
                      </div>
                      {/* Day headers */}
                      <div className="grid grid-cols-7 bg-white">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-400 tracking-wide">{d}</div>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7 bg-white px-1 pb-1">
                        {cells.map((day, i) => {
                          if (day === null) return <div key={i} />;
                          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const isToday = iso === todayStr;
                          const isPast = iso < todayStr;
                          const isSelected = iso === rescheduleDate;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => setRescheduleDate(iso)}
                              className={`w-full aspect-square flex items-center justify-center rounded-full text-text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary-500 text-white font-semibold"
                                  : isToday
                                  ? "bg-primary-100 text-primary-700 font-semibold"
                                  : isPast
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-primary-50"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {/* Footer: Clear / Today */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white">
                        <button onClick={() => setRescheduleDate("")} className="text-text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
                        <button onClick={() => { setRescheduleDate(todayStr); setCalendarMonth({ year: new Date().getFullYear(), month: new Date().getMonth() }); }} className="text-text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">Today</button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Time picker — scrollable list */}
              <div>
                <label className="block text-text-sm font-medium text-gray-700 mb-2">Time</label>
                <div className="relative border-2 border-primary-300 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3 bg-white">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-text-sm ${rescheduleTime ? "text-gray-900" : "text-gray-400"}`}>
                    {rescheduleTime || "Select a time..."}
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                  {["6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setRescheduleTime(t)}
                      className={`w-full text-left px-4 py-2 text-text-sm transition-colors ${
                        rescheduleTime === t
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setRescheduleModal(null)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!rescheduleDate || !rescheduleTime}
                  onClick={() => {
                    const newDate = new Date(rescheduleDate + "T12:00:00");
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const dateLabel = `${dayNames[newDate.getDay()]}, ${MONTH_NAMES[newDate.getMonth()]} ${newDate.getDate()}`;

                    setEvents((prev) => prev.map((e) =>
                      e.id === rescheduleModal
                        ? { ...e, calendarDate: rescheduleDate, time: rescheduleTime, date: "this_week" as const, dayLabel: dateLabel }
                        : e
                    ));
                    setSelectedEvent(null);
                    setRescheduledMessage(`Your appointment with ${event.caregiverName} has been rescheduled to ${dateLabel} at ${rescheduleTime}. A message has been sent to your inbox.`);
                    setRescheduleModal(null);
                    setTimeout(() => setRescheduledMessage(null), 5000);
                  }}
                  className={`px-5 py-2.5 text-text-sm font-semibold rounded-xl transition-colors ${
                    rescheduleDate && rescheduleTime
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirm reschedule
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Review modal ── */}
      {reviewModal && (() => {
        const visit = pastVisits.find((v) => v.id === reviewModal);
        if (!visit) return null;
        const activeRating = reviewHover || reviewRating;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-fadeIn">
              {/* Close */}
              <button onClick={() => setReviewModal(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Caregiver info */}
              <div className="text-center mb-6">
                <Image
                  src={visit.caregiverPhoto}
                  alt={visit.caregiverName}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                />
                <p className="text-text-md font-semibold text-gray-900">How was your visit with {visit.caregiverName}?</p>
                <p className="text-text-xs text-gray-400 mt-1">{visit.date} &middot; {visit.duration} with {visit.recipientName}</p>
              </div>

              {/* Step 1: Star rating */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setReviewHover(star)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${star <= activeRating ? "text-warning-400" : "text-gray-200"}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-center text-text-sm font-medium text-gray-500 mb-6 h-5">
                {activeRating > 0 ? RATING_LABELS[activeRating] : ""}
              </p>

              {/* Step 2: Tags */}
              <div className="mb-5">
                <p className="text-text-xs font-medium text-gray-500 mb-2.5">What stood out? <span className="text-gray-400">(Optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map((tag) => {
                    const selected = reviewTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setReviewTags((prev) => selected ? prev.filter((t) => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1.5 rounded-full text-text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-primary-50 text-primary-700 border-primary-300"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:bg-primary-25"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Written review */}
              <div className="mb-6">
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Share a bit about your visit. What stood out? Anything other families should know? (Optional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 resize-none transition-colors"
                />
                <p className="text-right text-[11px] text-gray-300 mt-1">{reviewComment.length}/500</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setReviewModal(null)}
                  className="text-text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Maybe later
                </button>
                <button
                  disabled={reviewRating === 0}
                  onClick={() => {
                    setPastVisits((prev) => prev.map((v) =>
                      v.id === reviewModal
                        ? { ...v, review: { rating: reviewRating, tags: reviewTags, comment: reviewComment, submittedAt: new Date().toISOString() } }
                        : v
                    ));
                    setReviewToast(`Thanks for reviewing ${visit.caregiverName}! Your review will be published once both sides have shared feedback.`);
                    setReviewModal(null);
                    setTimeout(() => setReviewToast(null), 5000);
                  }}
                  className={`px-6 py-2.5 text-text-sm font-semibold rounded-xl transition-colors ${
                    reviewRating > 0
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Share review
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Toast notifications ── */}
      {cancelledMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
            <svg className="w-5 h-5 text-error-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-sm">{cancelledMessage}</p>
          </div>
        </div>
      )}

      {rescheduledMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-lg">
            <svg className="w-5 h-5 text-success-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-sm">{rescheduledMessage}</p>
          </div>
        </div>
      )}

      {reviewToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-lg">
            <svg className="w-5 h-5 text-warning-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <p className="text-text-sm">{reviewToast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
