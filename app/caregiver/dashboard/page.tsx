"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Helpers ─────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return hrs < 48 ? "Yesterday" : `${Math.round(hrs / 24)}d ago`;
}

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
const TOMORROW = new Date(TODAY.getTime() + 86400000);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* ─── Types ───────────────────────────────────────────────── */

interface ScheduleEvent {
  id: string;
  family: string;
  recipient: string;
  time: string;
  endTime: string;
  type: "visit" | "video-call" | "meet-greet";
  location?: string;
  directionsUrl?: string;
  earnings: number;
  status: "confirmed" | "upcoming" | "in-progress";
  checkinTime?: string;
  date: Date;
  meds?: number;
  activities?: number;
}

interface CareRequest {
  id: string;
  familyName: string;
  recipientName: string;
  recipientAge: number;
  careTypes: string[];
  schedule: string;
  location: string;
  distance: number;
  note: string;
  earningsEstimate: string;
  receivedAt: string;
}

/* ─── Maria's profile data ────────────────────────────────── */

const MARIA = {
  firstName: "Maria",
  lastName: "S.",
  photo: "/images/maria-profile.jpg",
  tagline: "Specializes in dementia care with 6+ years of hands-on experience",
  rating: 4.9,
  reviewCount: 47,
  hourlyRate: 26,
  completedVisits: 142,
  avgResponseTime: "1 hr",
  repeatClients: "98%",
  about: "I've dedicated the last 6 years of my life to caring for seniors with memory-related conditions. After watching my grandmother navigate Alzheimer's, I knew this was my calling. I believe in creating a calm, structured environment where clients feel safe, respected, and loved.",
  school: "Houston Community College",
  degree: "Associate of Applied Science, Nursing",
  certifications: ["CNA", "CPR/First Aid", "Dementia Care Specialist (NCCDP)", "Medication Administration"],
  specialties: ["Alzheimer's", "Dementia", "Parkinson's", "Sundowning", "Mild Cognitive Impairment"],
  languages: ["English", "Spanish"],
  hobbies: ["Gardening", "Cooking", "Puzzle games", "Walking"],
  badges: ["Background Checked", "Verified Identity", "CPR Certified"],
  profileComplete: 100,
};

/* ─── Mock schedule data ──────────────────────────────────── */

const WED = new Date(TODAY.getTime() + 2 * 86400000);
const THU = new Date(TODAY.getTime() + 3 * 86400000);
const FRI = new Date(TODAY.getTime() + 4 * 86400000);

const EVENTS: ScheduleEvent[] = [
  { id: "e1", family: "Chen family", recipient: "Dorothy Chen", time: "09:00", endTime: "12:00", type: "visit", location: "4521 Bellaire Blvd, Houston", directionsUrl: "#", earnings: 65.10, status: "confirmed", date: TODAY, meds: 2, activities: 5 },
  { id: "e2", family: "Johnson family", recipient: "Margaret Johnson", time: "13:00", endTime: "16:00", type: "visit", location: "2100 River Oaks Blvd, Houston", directionsUrl: "#", earnings: 71.61, status: "confirmed", date: TODAY, meds: 3, activities: 5 },
  { id: "e4", family: "Ramirez family", recipient: "Elena Ramirez", time: "10:00", endTime: "12:30", type: "visit", location: "1200 Westheimer Rd, Houston", directionsUrl: "#", earnings: 65, status: "confirmed", date: TOMORROW, meds: 2, activities: 3 },
  { id: "e9", family: "Nguyen family", recipient: "Paul Nguyen", time: "14:00", endTime: "15:00", type: "video-call", earnings: 0, status: "upcoming", date: TOMORROW },
  { id: "e5", family: "Chen family", recipient: "Dorothy Chen", time: "09:00", endTime: "11:00", type: "visit", location: "4521 Bellaire Blvd, Houston", directionsUrl: "#", earnings: 52, status: "confirmed", date: WED, meds: 2, activities: 5 },
  { id: "e10", family: "Adams family", recipient: "Betty Adams", time: "13:00", endTime: "14:00", type: "meet-greet", location: "550 Kirby Dr, Houston", directionsUrl: "#", earnings: 0, status: "upcoming", date: WED },
  { id: "e6", family: "Williams family", recipient: "Grace Williams", time: "13:00", endTime: "15:00", type: "visit", location: "3400 Montrose Blvd, Houston", directionsUrl: "#", earnings: 52, status: "confirmed", date: THU, meds: 1, activities: 4 },
  { id: "e7", family: "Nguyen family", recipient: "Paul Nguyen", time: "10:00", endTime: "11:00", type: "video-call", earnings: 0, status: "upcoming", date: FRI },
  { id: "e8", family: "Adams family", recipient: "Betty Adams", time: "14:00", endTime: "15:00", type: "meet-greet", location: "550 Kirby Dr, Houston", directionsUrl: "#", earnings: 0, status: "upcoming", date: THU },
];

const REQUESTS: CareRequest[] = [
  { id: "r1", familyName: "Sarah Chen", recipientName: "Dorothy Chen", recipientAge: 78, careTypes: ["Companionship", "Meal prep"], schedule: "Mon, Wed, Fri — 9 AM to 12 PM", location: "Bellaire, Houston", distance: 4, note: "My mother loves gardening and old movies. She's independent but needs someone around for company and light meal prep. Would love someone warm and patient.", earningsEstimate: "$540/week", receivedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "r2", familyName: "Michael Torres", recipientName: "Robert Torres", recipientAge: 82, careTypes: ["Mobility assistance", "Errands"], schedule: "Tue, Thu — 1 PM to 4 PM", location: "Montrose, Houston", distance: 7, note: "Dad had a hip replacement recently and needs help getting around the house and running errands. He's a retired engineer and loves to talk about space.", earningsEstimate: "$360/week", receivedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
];

const EARNINGS = { today: 52, week: 468, month: 2184, lastMonth: 1820, lifetime: 8640 };

/* ─── Tiny components ─────────────────────────────────────── */

const TYPE_CFG: Record<string, { label: string; pill: string }> = {
  visit:       { label: "Visit",       pill: "bg-primary-50 text-primary-700 border-primary-100" },
  "video-call": { label: "Video call", pill: "bg-blue-50 text-blue-700 border-blue-100" },
  "meet-greet": { label: "Meet & greet", pill: "bg-amber-50 text-amber-700 border-amber-100" },
};

/* ─── Visit Card (simple) ────────────────────────────────── */

const CARD_COLORS: Record<string, { bg: string; initials: string; earnings: string }> = {
  visit:       { bg: "from-emerald-50 to-emerald-50/60", initials: "text-emerald-700", earnings: "text-emerald-700" },
  "video-call": { bg: "from-violet-50 to-violet-50/60", initials: "text-violet-700", earnings: "text-violet-700" },
  "meet-greet": { bg: "from-amber-50 to-amber-50/60", initials: "text-amber-700", earnings: "text-amber-700" },
};

function VisitCard({ ev, initials, durationHrs, later = false }: { ev: ScheduleEvent; initials: string; durationHrs: number; later?: boolean }) {
  const colors = CARD_COLORS[ev.type] || CARD_COLORS.visit;

  return (
    <div className={`rounded-2xl border overflow-hidden hover:shadow-md transition-all ${later ? "bg-sky-50/60 border-sky-200/60" : "bg-white border-gray-200"}`}>
      {/* Coming up / Later label */}
      <div className={`px-5 pt-2 pb-0 ${later ? "bg-sky-50/40" : ""}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${later ? "text-sky-500" : "text-primary-600"}`}>{later ? "Later in the day" : "Coming up"}</p>
      </div>
      <div className={`bg-gradient-to-r ${later ? "from-sky-100/60 to-sky-50/40" : colors.bg} px-5 py-3.5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${later ? "bg-white/70" : "bg-white/50"}`}>
            <span className={`text-xs font-bold ${later ? "text-sky-700" : colors.initials}`}>{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{ev.recipient}</p>
            <p className="text-xs text-gray-500">{TYPE_CFG[ev.type]?.label} &middot; {ev.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <p className={`text-base font-bold ${later ? "text-sky-700" : colors.earnings}`}>${ev.earnings.toFixed(2)}</p>
      </div>
      <div className="px-5 py-3 space-y-2.5">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {fmt12(ev.time)} &ndash; {fmt12(ev.endTime)}
          </div>
          {ev.location && (
            <div className="flex items-center gap-1 truncate">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              <span className="truncate">{ev.location.split(",")[0]}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {ev.meds && ev.meds > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-[10px] font-medium text-red-600">{ev.meds} meds</span>
            )}
            {ev.activities && ev.activities > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-medium text-gray-500">{ev.activities} activities</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-medium text-gray-500">{durationHrs} hrs</span>
          </div>
          <Link href="/caregiver/care-log" className="flex-shrink-0 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
            Check in
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Week Overview Calendar ─────────────────────────────── */

function WeekOverview({ events, onSelectEvent }: { events: ScheduleEvent[]; onSelectEvent: (ev: ScheduleEvent) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const dayOfWeek = NOW.getDay();
  const sunday = new Date(TODAY.getTime() - dayOfWeek * 86400000);
  const weekStart = new Date(sunday.getTime() + weekOffset * 7 * 86400000);
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000));

  const weekLabel = (() => {
    const s = days[0]; const e = days[6];
    if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    return `${s.toLocaleDateString("en-US", { month: "short" })} ${s.getDate()} – ${e.toLocaleDateString("en-US", { month: "short" })} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  const eventsForDay = (d: Date) => events.filter((ev) => sameDay(ev.date, d));

  const EVENT_COLORS: Record<string, string> = {
    visit: "bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200",
    "video-call": "bg-violet-100 border-violet-300 text-violet-900 hover:bg-violet-200",
    "meet-greet": "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200",
  };

  return (
    <div className="bg-sky-50/80 rounded-2xl border border-sky-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-sky-100">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="text-center">
            <h2 className="font-serif text-lg font-bold text-gray-800">{weekOffset === 0 ? "This week" : weekLabel}</h2>
            <p className="text-[11px] text-gray-400">{weekLabel}</p>
          </div>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-sky-400" />Visit</span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-violet-400" />Video call</span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400" />Meet &amp; greet</span>
        </div>
      </div>

      {/* Day header row */}
      <div className="grid grid-cols-7 bg-sky-100/50 border-b border-sky-200/60">
        {days.map((d) => {
          const isToday = sameDay(d, TODAY);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
          return (
            <div key={d.toISOString() + "-hdr"} className={`text-center py-2 border-r border-sky-200/40 last:border-r-0 ${isToday ? "bg-sky-200/40" : ""}`}>
              <p className={`text-[10px] font-bold tracking-wider ${isToday ? "text-primary-700" : "text-gray-500"}`}>{dayName}</p>
            </div>
          );
        })}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const today = sameDay(d, TODAY);
          const dayEvs = eventsForDay(d);
          const dateNum = d.getDate();
          const monthShort = d.toLocaleDateString("en-US", { month: "short" });

          return (
            <div
              key={d.toISOString()}
              className={`min-h-[280px] sm:min-h-[340px] border-r border-sky-200/40 last:border-r-0 ${today ? "bg-sky-100/30" : ""} p-2 sm:p-3 transition-colors`}
            >
              <div className="text-center mb-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${today ? "bg-primary-600 text-white shadow-sm" : "text-gray-700"}`}>
                  {dateNum}
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">{monthShort}</p>
              </div>

              <div className="space-y-1.5">
                {dayEvs.map((ev) => {
                  const firstName = ev.recipient.split(" ")[0];
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className={`w-full text-left px-2 py-2 rounded-lg border text-[11px] font-medium cursor-pointer transition-all hover:shadow-sm ${EVENT_COLORS[ev.type] || EVENT_COLORS.visit}`}
                    >
                      <p className="font-bold truncate">{firstName}</p>
                      <p className="text-[10px] opacity-70">{fmt12(ev.time)}</p>
                      {ev.location && <p className="text-[9px] opacity-50 truncate mt-0.5">{ev.location.split(",")[0]}</p>}
                    </button>
                  );
                })}
                {dayEvs.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center mt-2">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Edit Profile Modal ─────────────────────────────────── */

function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    tagline: MARIA.tagline,
    about: MARIA.about,
    hourlyRate: MARIA.hourlyRate,
    school: MARIA.school,
    degree: MARIA.degree,
    languages: MARIA.languages.join(", "),
    specialties: MARIA.specialties.join(", "),
    certifications: MARIA.certifications.join(", "),
    hobbies: MARIA.hobbies.join(", "),
    availability: "Mon, Wed, Fri: 7 AM – 3 PM\nTue, Thu: 9 AM – 5 PM\nSat: 10 AM – 2 PM",
    workExperience: "Memory Care Aide – Sunrise Senior Living (2021–Present)\nHome Health Aide – Comfort Keepers (2018–2021)\nCNA – Brookdale Senior Living (2016–2018)",
  });
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const field = (key: keyof typeof form, label: string, multiline = false) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
        />
      ) : (
        <input
          type={key === "hourlyRate" ? "number" : "text"}
          value={form[key]}
          onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      )}
    </div>
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-serif text-lg font-bold text-gray-900">Edit profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={MARIA.photo} alt={MARIA.firstName} width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{MARIA.firstName} {MARIA.lastName}</p>
              <button className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-0.5">Change photo</button>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-1">Basic info</p>
          {field("tagline", "Tagline")}
          {field("about", "About", true)}
          <div className="grid grid-cols-2 gap-3">
            {field("hourlyRate", "Hourly rate ($)")}
            {field("languages", "Languages (comma-separated)")}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">Education</p>
          <div className="grid grid-cols-2 gap-3">
            {field("school", "School")}
            {field("degree", "Degree")}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">Experience &amp; credentials</p>
          {field("workExperience", "Work experience (one per line)", true)}
          {field("certifications", "Certifications (comma-separated)")}
          {field("specialties", "Specialties (comma-separated)")}
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">Availability</p>
          {field("availability", "Weekly availability (one per line)", true)}
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">Personal</p>
          {field("hobbies", "Hobbies & interests (comma-separated)")}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-primary-600/20">
            {saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────── */

function DashboardContent() {
  const params = useSearchParams();
  const firstName = MARIA.firstName;
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const todayEvents = EVENTS.filter((e) => sameDay(e.date, TODAY));
  const todayEarnings = todayEvents.reduce((s, e) => s + e.earnings, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-vanilla-50/50 to-white">

      {/* ── Nav ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/care-shifts/students" className="flex items-center gap-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
              <span className="text-lg font-semibold text-gray-900">Olera</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/caregiver/dashboard" className="px-3 py-1.5 rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">Dashboard</Link>
              <Link href="/care-shifts/inbox" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">Inbox</Link>
              <Link href="/caregiver/care-log" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">Care log</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setBellOpen(!bellOpen)} className="relative w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">2 new</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      <div className="px-4 py-3 hover:bg-vanilla-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">$506 sent to your account</p>
                            <p className="text-xs text-gray-500 mt-0.5">Payment from your visit with Cathy</p>
                            <p className="text-[10px] text-gray-400 mt-1">2 hours ago</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-vanilla-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">New request from Linda</p>
                            <p className="text-xs text-gray-500 mt-0.5">Review and respond in your inbox</p>
                            <p className="text-[10px] text-gray-400 mt-1">5 hours ago</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1.5 rounded-full border border-gray-200 hover:border-gray-300 pl-1 pr-2.5 py-1 transition-colors">
                <div className="w-7 h-7 rounded-full overflow-hidden">
                  <Image src={MARIA.photo} alt={MARIA.firstName} width={28} height={28} className="w-full h-full object-cover" />
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{MARIA.firstName} {MARIA.lastName}</p>
                      <p className="text-xs text-gray-400">maria.s@olera.com</p>
                    </div>
                    <Link href="/care-shifts/inbox" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                      Inbox
                    </Link>
                    <Link href="/caregiver/apply" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                      Profile
                    </Link>
                    <Link href="#" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      Account Settings
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-6 sm:p-8 mb-6">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/20 flex-shrink-0 overflow-hidden">
              <Image src={MARIA.photo} alt={MARIA.firstName} width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">{NOW.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">{getGreeting()}, {firstName}</h1>
              <p className="text-sm text-white/90 mb-2">You have {todayEvents.length} visits scheduled today</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-medium text-white">
                  <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Verified Identity
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-medium text-white">
                  <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Background Checked
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-medium text-white">
                  <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Profile {MARIA.profileComplete}% complete
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => setEditOpen(true)} className="px-5 py-2 rounded-lg bg-white text-primary-700 text-xs font-bold transition-colors text-center shadow-sm hover:shadow-md">Edit profile</button>
              <Link href="/caregiver/apply" className="px-5 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-xs font-semibold text-white transition-colors text-center">View public profile</Link>
            </div>
          </div>
        </div>

        {/* ── REQUESTS BANNER ── */}
        <Link href="/care-shifts/inbox" className="flex items-center gap-3 bg-warning-50 rounded-xl border border-warning-200 px-4 py-2.5 mb-4 hover:shadow-sm transition-shadow group">
          <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">You have {REQUESTS.length} new requests</p>
            <p className="text-xs text-gray-500">Check your inbox to review and respond</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </Link>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Link href="/caregiver/care-log" className="group block bg-white rounded-2xl p-5 transition-all text-center shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Visits</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{MARIA.completedVisits}</p>
            </div>
            <p className="text-xs text-primary-600/70 mt-1.5 group-hover:text-primary-700 transition-colors">View care log &rarr;</p>
          </Link>

          <Link href="/caregiver/reviews" className="group block bg-white rounded-2xl p-5 transition-all text-center shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Rating</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{MARIA.rating}</p>
                <span className="text-sm text-gray-300">/5</span>
              </div>
            </div>
            <p className="text-xs text-amber-600/70 mt-1.5 group-hover:text-amber-700 transition-colors">{MARIA.reviewCount} reviews &rarr;</p>
          </Link>

          <button onClick={() => setShowEarnings(!showEarnings)} className="group block bg-white rounded-2xl p-5 transition-all cursor-pointer text-center shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">This month</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">${EARNINGS.month.toLocaleString()}</p>
            </div>
            <p className={`text-xs mt-1.5 transition-colors ${showEarnings ? "text-emerald-700" : "text-emerald-600/70 group-hover:text-emerald-700"}`}>{showEarnings ? "Hide breakdown" : "View breakdown"} &rarr;</p>
          </button>
        </div>

        {/* ── EARNINGS BREAKDOWN ── */}
        {showEarnings && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-gray-900">Earnings breakdown</h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download invoice
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Visit earnings</p>
                  <p className="text-xs text-gray-400">84 hours &times; ${MARIA.hourlyRate}/hr</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">${(84 * MARIA.hourlyRate).toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Platform fee</p>
                  <p className="text-xs text-gray-400">Olera service fee (5%)</p>
                </div>
                <p className="text-sm font-semibold text-red-500">-${Math.round(84 * MARIA.hourlyRate * 0.05)}</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-bold text-gray-900">Net earnings</p>
                <p className="text-sm font-bold text-primary-700">${EARNINGS.month.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">${EARNINGS.today}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Today</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">${EARNINGS.week}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">This week</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">${EARNINGS.lastMonth.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last month</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TODAY'S VISITS ── */}
        {todayEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">Today&apos;s visits</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-xs font-bold text-primary-700">{todayEvents.length}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todayEvents.map((ev, idx) => {
                const initials = ev.family.split(" ")[0].slice(0, 2).toUpperCase();
                const durationHrs = (() => {
                  const [sh, sm] = ev.time.split(":").map(Number);
                  const [eh, em] = ev.endTime.split(":").map(Number);
                  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
                })();
                const isLater = idx > 0;

                return <VisitCard key={ev.id} ev={ev} initials={initials} durationHrs={durationHrs} later={isLater} />;
              })}
            </div>
          </div>
        )}

        {/* ── FULL-WIDTH CALENDAR ── */}
        <WeekOverview events={EVENTS} onSelectEvent={setSelectedEvent} />

        {/* ── SELECTED EVENT DETAIL ── */}
        {selectedEvent && (() => {
          const selColors = CARD_COLORS[selectedEvent.type] || CARD_COLORS.visit;
          const selInitials = selectedEvent.family.split(" ")[0].slice(0, 2).toUpperCase();
          const selDuration = (() => {
            const [sh, sm] = selectedEvent.time.split(":").map(Number);
            const [eh, em] = selectedEvent.endTime.split(":").map(Number);
            return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
          })();
          return (
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${selColors.bg} px-5 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                    <span className={`text-sm font-bold ${selColors.initials}`}>{selInitials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{selectedEvent.recipient}</p>
                    <p className="text-xs text-gray-500">{TYPE_CFG[selectedEvent.type]?.label} &middot; {selectedEvent.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedEvent.earnings > 0 && <p className={`text-lg font-bold ${selColors.earnings}`}>${selectedEvent.earnings.toFixed(2)}</p>}
                  <button onClick={() => setSelectedEvent(null)} className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-gray-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 flex items-center flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  {fmt12(selectedEvent.time)} &ndash; {fmt12(selectedEvent.endTime)}
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    {selectedEvent.location}
                  </div>
                )}
                {selectedEvent.meds && selectedEvent.meds > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600">{selectedEvent.meds} meds</span>
                )}
                {selectedEvent.activities && selectedEvent.activities > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500">{selectedEvent.activities} activities</span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500">{selDuration} hrs</span>
              </div>

              <div className="px-5 pb-4 pt-1 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="bg-vanilla-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                    <p className="text-sm font-bold text-gray-900">{selDuration} hours</p>
                  </div>
                  <div className="bg-vanilla-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Rate</p>
                    <p className="text-sm font-bold text-gray-900">${MARIA.hourlyRate}/hr</p>
                  </div>
                  <div className="bg-vanilla-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Medications</p>
                    <p className="text-sm font-bold text-gray-900">{selectedEvent.meds || 0}</p>
                  </div>
                  <div className="bg-vanilla-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Activities</p>
                    <p className="text-sm font-bold text-gray-900">{selectedEvent.activities || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href="/caregiver/care-log" className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    Check in
                  </Link>
                  {selectedEvent.directionsUrl && (
                    <a href={selectedEvent.directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m0 0 3-3m-3 3-3-3m12-3.75V15m0 0 3-3m-3 3-3-3" /></svg>
                      Directions
                    </a>
                  )}
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                    Message family
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:border-red-300 hover:bg-red-50 text-sm font-medium text-red-600 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18 18 6M6 6l12 12" /></svg>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function CaregiverDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-vanilla-50" />}>
      <DashboardContent />
    </Suspense>
  );
}
