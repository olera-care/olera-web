"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────── */

interface ScheduledMed {
  name: string;
  time: string;
  done: boolean;
  note: string;
  addedByCaregiver?: boolean;
}

interface ScheduledActivity {
  name: string;
  time: string;
  done: boolean;
  note: string;
  addedByCaregiver?: boolean;
}

/* ─── Mock data ──────────────────────────────────────────── */

const MARIA = {
  firstName: "Maria",
  lastName: "S.",
  photo: "/images/maria-profile.jpg",
  rating: 4.9,
  reviewCount: 47,
};

const VISITS = [
  {
    id: "v1",
    familyName: "Sarah Chen",
    familyInitials: "SC",
    recipientName: "Dorothy Chen",
    recipientAge: 78,
    recipientPhoto: "",
    recipientCondition: "Mild cognitive decline (early-stage dementia)",
    recipientRelationship: "My mother",
    careNeeds: ["Companionship", "Meal prep", "Cognitive exercises"],
    dailyRoutine: [
      { time: "9:00 AM", icon: "pill", label: "Morning medication" },
      { time: "12:00 PM", icon: "food", label: "Lunch" },
      { time: "2:00 PM", icon: "walk", label: "Afternoon walk" },
    ],
    homeAccess: { address: "4521 Bellaire Blvd, Houston, TX", entry: "Key under doormat", parking: "Driveway available", pets: "One cat — Mochi" },
    emergencyContact: { name: "Sarah Chen", phone: "(713) 555-0142" },
    location: "Bellaire, Houston",
    schedule: "Mon, Wed, Fri · 9:00 AM – 12:00 PM",
    rate: "$20/hr",
    visitDate: "Monday, May 13, 2026",
    visitTime: "9:00 AM – 12:00 PM",
    duration: "3 hrs",
    type: "In-home visit",
    total: "$65.10",
    medications: [
      { name: "Donepezil 10mg", time: "9:15 AM", done: false, note: "" },
      { name: "Vitamin D", time: "9:15 AM", done: false, note: "" },
    ] as ScheduledMed[],
    activities: [
      { name: "Breakfast assistance", time: "9:00 AM", done: false, note: "" },
      { name: "Morning medication", time: "9:15 AM", done: false, note: "" },
      { name: "Cognitive exercises", time: "10:00 AM", done: false, note: "" },
      { name: "Light stretching", time: "10:45 AM", done: false, note: "" },
      { name: "Lunch prep", time: "11:30 AM", done: false, note: "" },
    ] as ScheduledActivity[],
    existingNotes: [
      "We just finished breakfast — she had her favorite oatmeal!",
      "Now we're doing the morning puzzle. She solved 6 today!",
    ],
  },
  {
    id: "v2",
    familyName: "Aisha Johnson",
    familyInitials: "AJ",
    recipientName: "Margaret Johnson",
    recipientAge: 82,
    recipientPhoto: "",
    recipientCondition: "Type 2 diabetes, mild hypertension",
    recipientRelationship: "My mother",
    careNeeds: ["Mobility assistance", "Medication reminders", "Light housekeeping"],
    dailyRoutine: [
      { time: "1:30 PM", icon: "pill", label: "Afternoon medication" },
      { time: "2:00 PM", icon: "book", label: "Reading time" },
      { time: "3:30 PM", icon: "food", label: "Snack" },
    ],
    homeAccess: { address: "2100 River Oaks Blvd, Houston, TX", entry: "Doorbell, housekeeper answers", parking: "Street parking", pets: "None" },
    emergencyContact: { name: "Aisha Johnson", phone: "(713) 555-0298" },
    location: "River Oaks, Houston",
    schedule: "Tue, Thu · 1:00 PM – 4:00 PM",
    rate: "$22/hr",
    visitDate: "Tuesday, May 14, 2026",
    visitTime: "1:00 PM – 4:00 PM",
    duration: "3 hrs",
    type: "In-home visit",
    total: "$71.61",
    medications: [
      { name: "Metformin 500mg", time: "1:30 PM", done: false, note: "" },
      { name: "Lisinopril 10mg", time: "1:30 PM", done: false, note: "" },
      { name: "Calcium + D3", time: "3:00 PM", done: false, note: "" },
    ] as ScheduledMed[],
    activities: [
      { name: "Post-lunch walk", time: "1:00 PM", done: false, note: "" },
      { name: "Afternoon medication", time: "1:30 PM", done: false, note: "" },
      { name: "Reading time", time: "2:00 PM", done: false, note: "" },
      { name: "Light exercises", time: "2:45 PM", done: false, note: "" },
      { name: "Snack prep", time: "3:30 PM", done: false, note: "" },
    ] as ScheduledActivity[],
    existingNotes: [],
  },
];

/* ─── Helpers ────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const NOW = new Date();

/* ─── Care Log Page ──────────────────────────────────────── */

export default function CareLogPage() {
  // 0 = day dashboard + select recipient
  // 1 = QR check-in + overview
  // 2 = input form
  const [view, setView] = useState<0 | 1 | 2>(0);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const visit = VISITS.find((v) => v.id === selectedVisitId) || null;

  const handleSelectVisit = (id: string) => {
    setSelectedVisitId(id);
    setView(1);
  };

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
              <Link href="/caregiver/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">Dashboard</Link>
              <Link href="/care-shifts/inbox" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">Inbox</Link>
              <Link href="/caregiver/care-log" className="px-3 py-1.5 rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">Care log</Link>
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

        {/* ── View 0: Today's visits ── */}
        {view === 0 && (
          <>
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-6 sm:p-8 mb-6">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
              <div className="relative flex items-center gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/20 flex-shrink-0 overflow-hidden">
                  <Image src={MARIA.photo} alt={MARIA.firstName} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">{NOW.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">{getGreeting()}, {MARIA.firstName}</h1>
                  <p className="text-sm text-white/90">You have {VISITS.length} visits scheduled today</p>
                </div>
              </div>
            </div>

            {/* Two-column: Small calendar left, visits right */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">

              {/* ── Small calendar ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 h-fit">
                {(() => {
                  const today = new Date();
                  const mo = today.getMonth();
                  const yr = today.getFullYear();
                  const firstDay = new Date(yr, mo, 1).getDay();
                  const dim = new Date(yr, mo + 1, 0).getDate();
                  const todayDate = today.getDate();
                  const visitDays = [todayDate, todayDate + 2, todayDate + 5, todayDate + 8, todayDate + 11].filter(d => d <= dim);

                  // Mock stats per visit day
                  const dayStats: Record<number, { visits: number; hours: number; earnings: string }> = {
                    [todayDate]: { visits: 2, hours: 6, earnings: "$136.71" },
                    [todayDate + 2]: { visits: 1, hours: 3, earnings: "$65.10" },
                    [todayDate + 5]: { visits: 2, hours: 5, earnings: "$118.00" },
                    [todayDate + 8]: { visits: 1, hours: 4, earnings: "$88.00" },
                    [todayDate + 11]: { visits: 1, hours: 3, earnings: "$65.10" },
                  };
                  const activeDay = selectedCalDay ?? todayDate;
                  const stats = dayStats[activeDay] || { visits: 0, hours: 0, earnings: "$0.00" };
                  const activeDayDate = new Date(yr, mo, activeDay);
                  const dayLabel = activeDay === todayDate ? "Today" : activeDayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">{today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
                        <div className="flex items-center gap-1">
                          <button className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          <button className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-0">
                        {["S","M","T","W","T","F","S"].map((d, i) => (
                          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 pb-2">{d}</div>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`e-${i}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: dim }).map((_, i) => {
                          const day = i + 1;
                          const isToday = day === todayDate;
                          const hasVisit = visitDays.includes(day);
                          const isSelected = selectedCalDay === day;
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedCalDay(day === selectedCalDay ? null : day)}
                              className="flex flex-col items-center justify-center py-1 cursor-pointer"
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                                isSelected
                                  ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-300"
                                  : isToday
                                  ? "bg-primary-600 text-white shadow-sm"
                                  : hasVisit
                                  ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}>
                                {day}
                              </div>
                              {hasVisit && <div className="w-1 h-1 rounded-full bg-primary-400 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick stats — updates on day selection */}
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{dayLabel}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Visits</span>
                          <span className="text-xs font-bold text-gray-900">{stats.visits}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total hours</span>
                          <span className="text-xs font-bold text-gray-900">{stats.hours} hrs</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Earnings</span>
                          <span className="text-xs font-bold text-primary-700">{stats.earnings}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* ── Today's visit cards ── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">Today&apos;s visits</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-xs font-bold text-primary-700">{VISITS.length}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-4">
                  {VISITS.map((v, idx) => {
                    const isLater = idx > 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVisit(v.id)}
                        className={`w-full rounded-2xl border overflow-hidden hover:shadow-md transition-all text-left ${isLater ? "bg-sky-50/60 border-sky-200/60" : "bg-white border-gray-200"}`}
                      >
                        <div className={`px-6 pt-3 pb-0 ${isLater ? "bg-sky-50/40" : ""}`}>
                          <p className={`text-[10px] font-semibold uppercase tracking-widest ${isLater ? "text-sky-500" : "text-primary-600"}`}>{isLater ? "Later in the day" : "Coming up"}</p>
                        </div>
                        <div className={`bg-gradient-to-r ${isLater ? "from-sky-100/60 to-sky-50/40" : "from-emerald-50 to-emerald-50/60"} px-6 py-4 flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLater ? "bg-white/70" : "bg-white/50"}`}>
                              <span className={`text-sm font-bold ${isLater ? "text-sky-700" : "text-emerald-700"}`}>{v.familyInitials}</span>
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-800">{v.recipientName}</p>
                              <p className="text-xs text-gray-500">{v.type} &middot; {v.duration}</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${isLater ? "text-sky-700" : "text-emerald-700"}`}>{v.total}</p>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                              {v.visitTime}
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                              <span className="truncate">{v.homeAccess.address.split(",")[0]}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600">{v.medications.length} meds</span>
                              <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500">{v.activities.length} activities</span>
                            </div>
                            <span className="flex-shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                              Check in
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── View 1: QR Check-in + Overview ── */}
        {view === 1 && visit && (
          <CheckInView visit={visit} onBack={() => setView(0)} onCheckedIn={() => setView(2)} />
        )}

        {/* ── View 2: Input form ── */}
        {view === 2 && visit && (
          <InputFormView visit={visit} onBack={() => setView(1)} />
        )}

      </div>
    </div>
  );
}

/* ─── View 1: Check-in + Overview ─────────────────────────── */

function CheckInView({ visit, onBack, onCheckedIn }: { visit: typeof VISITS[0]; onBack: () => void; onCheckedIn: () => void }) {
  const [showQR, setShowQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showWelcomePkg, setShowWelcomePkg] = useState(false);
  const recipientFirst = visit.recipientName.split(" ")[0];

  const scheduleItems = [
    ...visit.medications.map((m) => ({ time: m.time, label: m.name, type: "med" as const })),
    ...visit.activities.map((a) => ({ time: a.time, label: a.name, type: "activity" as const })),
  ].sort((a, b) => {
    const toMin = (t: string) => { const [h, rest] = t.split(":"); const [min, ampm] = rest.split(" "); let hr = parseInt(h); if (ampm === "PM" && hr !== 12) hr += 12; if (ampm === "AM" && hr === 12) hr = 0; return hr * 60 + parseInt(min); };
    return toMin(a.time) - toMin(b.time);
  });

  const handleScanQR = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setShowQR(false);
      onCheckedIn();
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back
        </button>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{visit.recipientName}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{visit.visitDate} &middot; {visit.familyName}</p>
      </div>

      {/* Visit overview + recipient info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
        {/* Recipient bio */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          {visit.recipientPhoto ? (
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              <Image src={visit.recipientPhoto} alt={visit.recipientName} width={56} height={56} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-700">{visit.recipientName.split(" ").map(n => n[0]).join("")}</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900">{visit.recipientName}</p>
            <p className="text-sm text-gray-400">{visit.recipientRelationship}, {visit.recipientAge} &middot; {visit.location}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-medium text-amber-700">{visit.recipientCondition}</span>
            </div>
          </div>
        </div>

        {/* Visit details */}
        <div className="grid grid-cols-4 gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-0.5">Time</p>
            <p className="text-sm font-medium text-gray-900">{visit.visitTime}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-0.5">Duration</p>
            <p className="text-sm font-medium text-gray-900">{visit.duration}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-0.5">Type</p>
            <p className="text-sm font-medium text-gray-900">{visit.type}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-0.5">Total</p>
            <p className="text-sm font-medium text-gray-900">{visit.total}</p>
          </div>
        </div>

        {/* Care needs + meds */}
        <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Care needs</p>
            <div className="flex flex-wrap gap-1.5">
              {visit.careNeeds.map((need) => (
                <span key={need} className="px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-medium text-primary-700">{need}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Medications</p>
            <div className="flex flex-wrap gap-1.5">
              {visit.medications.map((m) => (
                <span key={m.name} className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700">{m.name} ({m.time.includes("AM") ? "morning" : "afternoon"})</span>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-900">Schedule</h4>
          <span className="text-xs text-gray-400">{visit.medications.length} meds &middot; {visit.activities.length} activities</span>
        </div>
        <div className="space-y-1.5 mb-5 pb-5 border-b border-gray-100">
          {scheduleItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-vanilla-50">
              <span className="text-xs font-mono text-gray-400 w-16 flex-shrink-0">{item.time}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${
                item.type === "med" ? "bg-amber-50 text-amber-600" : "bg-primary-50 text-primary-600"
              }`}>{item.type === "med" ? "Med" : "Activity"}</span>
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Home & access + emergency */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Home &amp; access</p>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>{visit.homeAccess.address}</p>
              <p>{visit.homeAccess.entry}</p>
              <p>Parking: {visit.homeAccess.parking}</p>
              <p>Pets: {visit.homeAccess.pets}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Emergency contact</p>
            <p className="text-sm text-gray-600">{visit.emergencyContact.name} &middot; {visit.emergencyContact.phone}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button onClick={() => setShowWelcomePkg(!showWelcomePkg)} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            {showWelcomePkg ? "Hide welcome package" : "View welcome package"}
            <svg className={`w-3.5 h-3.5 transition-transform ${showWelcomePkg ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showWelcomePkg && (
            <div className="mt-4 space-y-4 bg-vanilla-50 rounded-xl p-4 border border-primary-100">
              <div>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">About {recipientFirst}</p>
                <p className="text-sm text-gray-600">{visit.recipientCondition} &middot; Age {visit.recipientAge}</p>
                <p className="text-xs text-gray-400 mt-0.5">{visit.recipientRelationship}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Care needs</p>
                <div className="flex flex-wrap gap-1.5">
                  {visit.careNeeds.map((need) => (
                    <span key={need} className="px-2.5 py-1 rounded-full bg-white border border-primary-100 text-xs font-medium text-primary-700">{need}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Daily routine</p>
                <div className="space-y-1">
                  {visit.dailyRoutine.map((item, i) => (
                    <p key={i} className="text-xs text-gray-600">{item.time} &mdash; {item.label}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Home &amp; access</p>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>{visit.homeAccess.address}</p>
                  <p>Entry: {visit.homeAccess.entry}</p>
                  <p>Parking: {visit.homeAccess.parking}</p>
                  <p>Pets: {visit.homeAccess.pets}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide mb-1.5">Emergency contact</p>
                <p className="text-xs text-gray-600">{visit.emergencyContact.name} &middot; {visit.emergencyContact.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check in */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        {!showQR ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">Check in to start</h3>
            <p className="text-sm text-gray-500 mb-5">Scan the QR code at {recipientFirst}&apos;s door to begin logging.</p>
            <button onClick={() => setShowQR(true)} className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
                Scan QR code
              </span>
            </button>
            <div><button onClick={onCheckedIn} className="text-xs font-medium text-primary-600 hover:text-primary-700 mt-1">Check in manually</button></div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-56 h-56 rounded-2xl bg-gray-900 mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
              {scanning ? (
                <>
                  <div className="absolute left-4 right-4 h-0.5 bg-primary-400 animate-bounce" style={{ top: "40%" }} />
                  <div className="absolute inset-0 bg-primary-400/10 animate-pulse" />
                </>
              ) : (
                <div className="absolute left-4 right-4 h-0.5 bg-primary-400 animate-pulse" style={{ top: "50%" }} />
              )}
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z" /></svg>
            </div>
            {scanning ? (
              <div className="flex items-center justify-center gap-2 text-sm text-primary-600 font-medium mb-4">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Scanning...
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">Point your camera at the QR code</p>
            )}
            <button onClick={handleScanQR} disabled={scanning} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
              {scanning ? "Verifying..." : "Simulate successful scan"}
            </button>
            <div><button onClick={() => { setShowQR(false); setScanning(false); }} className="text-xs text-gray-400 hover:text-gray-600 mt-2">Cancel</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── View 2: Input Form ──────────────────────────────────── */

function InputFormView({ visit, onBack }: { visit: typeof VISITS[0]; onBack: () => void }) {
  const [medications, setMedications] = useState<ScheduledMed[]>(visit.medications);
  const [activities, setActivities] = useState<ScheduledActivity[]>(visit.activities);
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<{ text: string; time: string; sentToChat: boolean }[]>(
    visit.existingNotes.map((n) => ({ text: n, time: "9:30 AM", sentToChat: true }))
  );
  const [photos, setPhotos] = useState<{ id: number; caption: string; time: string; sentToChat: boolean }[]>([]);
  const [checkedOut, setCheckedOut] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Add medication form
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedTime, setNewMedTime] = useState("");

  // Add activity form
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityTime, setNewActivityTime] = useState("");

  // Welcome package toggle
  const [showWelcomePkg, setShowWelcomePkg] = useState(false);

  // Track saved note confirmations
  const [savedMedNotes, setSavedMedNotes] = useState<Record<number, boolean>>({});
  const [savedActivityNotes, setSavedActivityNotes] = useState<Record<number, boolean>>({});

  const showMedNoteSaved = (idx: number) => {
    setSavedMedNotes((s) => ({ ...s, [idx]: true }));
    setTimeout(() => setSavedMedNotes((s) => ({ ...s, [idx]: false })), 2000);
  };

  const showActivityNoteSaved = (idx: number) => {
    setSavedActivityNotes((s) => ({ ...s, [idx]: true }));
    setTimeout(() => setSavedActivityNotes((s) => ({ ...s, [idx]: false })), 2000);
  };

  const doneCount = activities.filter((a) => a.done).length;
  const medsDone = medications.filter((m) => m.done).length;
  const recipientFirst = visit.recipientName.split(" ")[0];

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setNotes([...notes, { text: noteInput.trim(), time: timeStr, sentToChat: true }]);
    setNoteInput("");
  };

  const handleAddPhoto = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setPhotos([...photos, { id: Date.now(), caption: "", time: timeStr, sentToChat: true }]);
  };

  const handleAddMed = () => {
    if (!newMedName.trim()) return;
    setMedications([...medications, { name: newMedName.trim(), time: newMedTime || "As needed", done: false, note: "", addedByCaregiver: true }]);
    setNewMedName("");
    setNewMedTime("");
    setShowAddMed(false);
  };

  const handleAddActivity = () => {
    if (!newActivityName.trim()) return;
    setActivities([...activities, { name: newActivityName.trim(), time: newActivityTime || "Flexible", done: false, note: "", addedByCaregiver: true }]);
    setNewActivityName("");
    setNewActivityTime("");
    setShowAddActivity(false);
  };

  return (
    <>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          {/* Hero — Visit progress */}
          {(() => {
            const totalItems = medications.length + activities.length;
            const completedItems = medsDone + doneCount;
            const pct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
            const allTasks = [
              ...medications.map((m) => ({ name: m.name, time: m.time, done: m.done })),
              ...activities.map((a) => ({ name: a.name, time: a.time, done: a.done })),
            ].sort((a, b) => a.time.localeCompare(b.time));
            const nextTask = allTasks.find((t) => !t.done);
            return (
              <div className="bg-sky-50/80 rounded-2xl px-6 py-5 border border-sky-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-sky-200 flex-shrink-0 bg-sky-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-sky-700">{visit.recipientName.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{recipientFirst}&apos;s visit</h2>
                      <p className="text-xs text-gray-500">Started at 9:00 AM &middot; {visit.visitDate}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Current time: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">In progress</span>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">{completedItems} of {totalItems} steps complete</span>
                    <span className="text-sm font-bold text-gray-900">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalItems }).map((_, i) => (
                      <div key={i} className={`flex-1 h-3 rounded-full transition-all duration-300 ${i < completedItems ? "bg-sky-500 shadow-sm shadow-sky-500/30" : "bg-sky-200/60"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>{medsDone}/{medications.length} meds</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>{doneCount}/{activities.length} activities</span>
                  </div>
                  {nextTask && (
                    <span className="text-[11px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">Up next: {nextTask.name} at {nextTask.time}</span>
                  )}
                </div>

                {/* Visit details */}
                <div className="border-t border-sky-200/60 pt-4">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-white/60 rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Time</p>
                      </div>
                      <p className="text-xs font-medium text-gray-700">{visit.visitTime}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Duration</p>
                      </div>
                      <p className="text-xs font-medium text-gray-700">{visit.duration}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                        <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Type</p>
                      </div>
                      <p className="text-xs font-medium text-gray-700">{visit.type}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Total</p>
                      </div>
                      <p className="text-xs font-bold text-primary-700">{visit.total}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowWelcomePkg(!showWelcomePkg)} className="flex items-center gap-2 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors w-full justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    {showWelcomePkg ? "Hide welcome package" : "View welcome package"}
                    <svg className={`w-3 h-3 transition-transform ${showWelcomePkg ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </button>
                  {showWelcomePkg && (
                    <div className="mt-3 space-y-3 bg-white/60 rounded-xl p-3 border border-sky-200/40">
                      <div>
                        <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1">About {recipientFirst}</p>
                        <p className="text-xs text-gray-600">{visit.recipientCondition} &middot; Age {visit.recipientAge}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{visit.recipientRelationship}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1">Care needs</p>
                        <div className="flex flex-wrap gap-1">
                          {visit.careNeeds.map((need) => (
                            <span key={need} className="px-2 py-0.5 rounded-full bg-white border border-sky-200 text-[10px] font-medium text-sky-700">{need}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1">Daily routine</p>
                        <div className="space-y-0.5">
                          {visit.dailyRoutine.map((item, i) => (
                            <p key={i} className="text-[10px] text-gray-600">{item.time} &mdash; {item.label}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1">Home &amp; access</p>
                        <div className="text-[10px] text-gray-600 space-y-0.5">
                          <p>{visit.homeAccess.address}</p>
                          <p>Entry: {visit.homeAccess.entry}</p>
                          <p>Parking: {visit.homeAccess.parking}</p>
                          <p>Pets: {visit.homeAccess.pets}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1">Emergency contact</p>
                        <p className="text-[10px] text-gray-600">{visit.emergencyContact.name} &middot; {visit.emergencyContact.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Medications */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Medications</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{medsDone} of {medications.length} given &middot; Scheduled by {visit.familyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600">{medications.length ? Math.round((medsDone / medications.length) * 100) : 0}%</span>
                <div className="w-16 h-2 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all" style={{ width: `${medications.length ? (medsDone / medications.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {medications.map((m, i) => (
                <div key={`${m.name}-${i}`} className={`rounded-xl border transition-all ${m.done ? "bg-emerald-50/50 border-emerald-200 shadow-sm" : "border-transparent hover:bg-vanilla-50"}`}>
                  <label className="flex items-center justify-between p-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={m.done} onChange={() => { const next = [...medications]; next[i] = { ...next[i], done: !next[i].done }; setMedications(next); }} className="w-5 h-5 rounded border-gray-300" style={{ accentColor: "#4d8a8a" }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${m.done ? "text-gray-900" : "text-gray-600"}`}>{m.name}</p>
                          {m.addedByCaregiver && <span className="text-[9px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Added by you</span>}
                        </div>
                        <p className="text-xs text-gray-400">Scheduled: {m.time}</p>
                      </div>
                    </div>
                    {m.done && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>Given</span>}
                  </label>
                  {m.done && (
                    <div className="px-3 pb-3 pl-11">
                      <div className="relative">
                        <input
                          type="text"
                          value={m.note}
                          onChange={(e) => { const next = [...medications]; next[i] = { ...next[i], note: e.target.value }; setMedications(next); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && m.note.trim()) showMedNoteSaved(i); }}
                          onBlur={() => { if (m.note.trim()) showMedNoteSaved(i); }}
                          placeholder="Add a note (e.g. taken with food)..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                        {savedMedNotes[i] && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 animate-pulse">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                            Saved
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Add medication */}
            {!showAddMed ? (
              <button onClick={() => setShowAddMed(true)} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add medication
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-xl border border-primary-200 bg-primary-50/30 space-y-2">
                <div className="flex gap-2">
                  <input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Medication name" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  <input value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} placeholder="Time (e.g. 2:00 PM)" className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => { setShowAddMed(false); setNewMedName(""); setNewMedTime(""); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  <button onClick={handleAddMed} disabled={!newMedName.trim()} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">Add</button>
                </div>
              </div>
            )}
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Activities</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{doneCount} of {activities.length} completed &middot; Scheduled by {visit.familyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary-600">{activities.length ? Math.round((doneCount / activities.length) * 100) : 0}%</span>
                <div className="w-16 h-2 rounded-full bg-primary-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all" style={{ width: `${activities.length ? (doneCount / activities.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {activities.map((a, i) => (
                <div key={`${a.name}-${i}`} className={`rounded-xl border transition-all ${a.done ? "bg-primary-50/40 border-primary-200 shadow-sm" : "border-transparent hover:bg-vanilla-50"}`}>
                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                    <input type="checkbox" checked={a.done} onChange={() => { const next = [...activities]; next[i] = { ...next[i], done: !next[i].done }; setActivities(next); }} className="w-5 h-5 rounded border-gray-300" style={{ accentColor: "#4d8a8a" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${a.done ? "text-gray-900 line-through decoration-primary-300" : "text-gray-600"}`}>{a.name}</span>
                        {a.addedByCaregiver && <span className="text-[9px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Added by you</span>}
                      </div>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                    {a.done && <span className="text-[10px] font-semibold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-full flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>Done</span>}
                  </label>
                  {a.done && (
                    <div className="px-3 pb-3 pl-11">
                      <div className="relative">
                        <input
                          type="text"
                          value={a.note}
                          onChange={(e) => { const next = [...activities]; next[i] = { ...next[i], note: e.target.value }; setActivities(next); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && a.note.trim()) showActivityNoteSaved(i); }}
                          onBlur={() => { if (a.note.trim()) showActivityNoteSaved(i); }}
                          placeholder="Add a note..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                        {savedActivityNotes[i] && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 animate-pulse">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                            Saved
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-primary-600 mt-3 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              Updates automatically sent to inbox
            </p>
            {/* Add activity */}
            {!showAddActivity ? (
              <button onClick={() => setShowAddActivity(true)} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add activity
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-xl border border-primary-200 bg-primary-50/30 space-y-2">
                <div className="flex gap-2">
                  <input value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)} placeholder="Activity name" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  <input value={newActivityTime} onChange={(e) => setNewActivityTime(e.target.value)} placeholder="Time (e.g. 2:00 PM)" className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => { setShowAddActivity(false); setNewActivityName(""); setNewActivityTime(""); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  <button onClick={handleAddActivity} disabled={!newActivityName.trim()} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">Add</button>
                </div>
              </div>
            )}
          </div>


          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 21h18a2.25 2.25 0 0 0 2.25-2.25V5.25A2.25 2.25 0 0 0 21 3H3a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 3 21Z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Photos</h3>
              </div>
              <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                Photo + caption sent to inbox
              </span>
            </div>
            {photos.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Share a moment from today</p>
                <p className="text-xs text-gray-400 mb-4">Families love seeing their loved one&apos;s day</p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {["During an activity", "With a meal", "Smiling together"].map((prompt) => (
                    <span key={prompt} className="px-2.5 py-1 rounded-full bg-primary-50 text-[11px] font-medium text-primary-600 border border-primary-100">{prompt}</span>
                  ))}
                </div>
                <button onClick={handleAddPhoto} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20 active:scale-[0.98]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
                  Add photo
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-3">
                  {photos.map((p, i) => (
                    <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-vanilla-50 border border-gray-100">
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 21h18a2.25 2.25 0 0 0 2.25-2.25V5.25A2.25 2.25 0 0 0 21 3H3a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 3 21Z" /></svg>
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={p.caption}
                          onChange={(e) => { const next = [...photos]; next[i] = { ...next[i], caption: e.target.value }; setPhotos(next); }}
                          placeholder="Add a caption..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors mb-1.5"
                        />
                        <p className="text-[10px] text-gray-400">{p.time} &middot; Sent to inbox</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddPhoto} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50/50 text-primary-400 hover:text-primary-600 transition-colors w-full justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span className="text-xs font-medium">Add another photo</span>
                </button>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Visit notes</h3>
              </div>
              <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                Sent to chat
              </span>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2 mb-3">
                {notes.map((n, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-vanilla-50">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{n.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.time}{n.sentToChat && " · Sent to chat"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
                placeholder="Add a note for the family..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <button onClick={handleAddNote} disabled={!noteInput.trim()} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors">Add note</button>
            </div>
          </div>
        </div>

        {/* Right column: earnings sidebar */}
        <div className="lg:sticky lg:top-6 space-y-5 self-start">
          {/* Earnings & checkout */}
          {!checkedOut ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                  <h4 className="text-sm font-bold text-gray-700">Earnings</h4>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2.5 text-sm mb-5">
                  <div className="flex justify-between py-1"><span className="text-gray-500">3 hrs @ $20/hr</span><span className="text-gray-900 font-medium">$60.00</span></div>
                  <div className="flex justify-between py-1"><span className="text-gray-500">Service fee (8.5%)</span><span className="text-gray-400">&minus;$5.10</span></div>
                  <div className="flex justify-between pt-3 border-t border-gray-100 mt-1"><span className="font-semibold text-gray-900">Your earnings</span><span className="text-xl font-bold text-gray-900">$54.90</span></div>
                </div>
                <button onClick={() => setShowReview(true)} className="w-full py-3.5 bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Check out &amp; submit
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-0.5">Visit complete</h4>
              <p className="text-xs text-gray-500">Summary sent to {visit.familyName}</p>
              <p className="text-sm font-bold text-primary-700 mt-2">$54.90 earned</p>
            </div>
          )}
        </div>
      </div>

      {/* Review & Checkout overlay */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReview(false)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 sm:rounded-t-2xl rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Review &amp; check out</h3>
                  <p className="text-xs text-primary-100 mt-0.5">{recipientFirst}&apos;s visit &middot; {visit.visitDate}</p>
                </div>
                <button onClick={() => setShowReview(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Progress summary */}
              {(() => {
                const totalItems = medications.length + activities.length;
                const completedItems = medsDone + doneCount;
                const pct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
                return (
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">Visit progress</span>
                      <span className="text-sm font-bold text-primary-700">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-primary-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">{completedItems} of {totalItems} items completed</p>
                  </div>
                );
              })()}

              {/* Medications */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Medications</h4>
                  <span className="text-xs text-gray-400 ml-auto">{medsDone}/{medications.length}</span>
                </div>
                <div className="space-y-1">
                  {medications.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                      {m.done ? (
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      )}
                      <span className={`text-sm ${m.done ? "text-gray-900" : "text-gray-400"}`}>{m.name}</span>
                      {m.note && <span className="text-[10px] text-gray-400 ml-auto truncate max-w-[120px]">&ldquo;{m.note}&rdquo;</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-primary-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Activities</h4>
                  <span className="text-xs text-gray-400 ml-auto">{doneCount}/{activities.length}</span>
                </div>
                <div className="space-y-1">
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                      {a.done ? (
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      )}
                      <span className={`text-sm ${a.done ? "text-gray-900" : "text-gray-400"}`}>{a.name}</span>
                      {a.note && <span className="text-[10px] text-gray-400 ml-auto truncate max-w-[120px]">&ldquo;{a.note}&rdquo;</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
                  <p className="text-xs text-gray-500">Photos shared</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                  <p className="text-xs text-gray-500">Notes sent</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Earnings summary</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">3 hrs @ $20/hr</span><span className="text-gray-900 font-medium">$60.00</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Service fee (8.5%)</span><span className="text-gray-400">&minus;$5.10</span></div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 mt-2"><span className="font-semibold text-gray-900">Your earnings</span><span className="text-xl font-black text-emerald-600">$54.90</span></div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => { setCheckedOut(true); setShowReview(false); }}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Submit &amp; check out
                </button>
                <button onClick={() => setShowReview(false)} className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Go back &amp; edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
