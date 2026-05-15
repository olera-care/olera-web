"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

/* ─── Mock visit data (keyed by visitId) ─── */
interface VisitActivity {
  label: string;
  completed: boolean;
}
interface TimelineEntry {
  time: string;
  type: "check_in" | "note" | "photo" | "medication" | "activity" | "check_out";
  text: string;
  photoUrl?: string;
}
interface FullVisitData {
  visitId: string;
  caregiverName: string;
  caregiverPhoto: string;
  recipientName: string;
  date: string;
  timeRange: string;
  duration: string;
  visitType: string;
  status: "in_progress" | "completed";
  cost: number;
  oleraFee: number;
  totalCost: number;
  hourlyRate: number;
  photos: string[];
  activities: VisitActivity[];
  mood: string;
  timeline: TimelineEntry[];
  medicationReminders: { medication: string; time: string; given: boolean }[];
  reviewStatus: "none" | "submitted";
}

const VISITS: Record<string, FullVisitData> = {
  "visit-maria-0511": {
    visitId: "visit-maria-0511",
    caregiverName: "Maria S.",
    caregiverPhoto: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Dorothy",
    date: "Monday, May 11, 2026",
    timeRange: "9:00 AM – 12:00 PM",
    duration: "3 hrs",
    visitType: "In-home visit",
    status: "in_progress",
    cost: 60.00,
    oleraFee: 5.10,
    totalCost: 65.10,
    hourlyRate: 20,
    photos: [
      "https://images.pexels.com/photos/3791664/pexels-photo-3791664.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    activities: [
      { label: "Breakfast assistance", completed: true },
      { label: "Morning medication", completed: true },
      { label: "Cognitive exercises (puzzles)", completed: true },
      { label: "Light stretching", completed: false },
      { label: "Lunch prep", completed: false },
    ],
    mood: "Happy and engaged this morning",
    timeline: [
      { time: "9:02 AM", type: "check_in", text: "Maria checked in for today's visit" },
      { time: "9:15 AM", type: "medication", text: "Administered Donepezil 10mg and Vitamin D" },
      { time: "9:20 AM", type: "activity", text: "Started breakfast — oatmeal with berries" },
      { time: "9:45 AM", type: "photo", text: "We just finished breakfast — she had her favorite oatmeal!", photoUrl: "https://images.pexels.com/photos/3791664/pexels-photo-3791664.jpeg?auto=compress&cs=tinysrgb&w=600" },
      { time: "10:00 AM", type: "activity", text: "Began cognitive exercises — crossword puzzles" },
      { time: "10:10 AM", type: "note", text: "Dorothy is in great spirits this morning! She remembered the puzzle we did last time and asked to do it again." },
      { time: "10:32 AM", type: "photo", text: "Now we're doing the morning puzzle. She solved 6 today!", photoUrl: "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=600" },
    ],
    medicationReminders: [
      { medication: "Donepezil 10mg", time: "9:15 AM", given: true },
      { medication: "Vitamin D", time: "9:15 AM", given: true },
    ],
    reviewStatus: "none",
  },
  "visit-aisha-0509": {
    visitId: "visit-aisha-0509",
    caregiverName: "Aisha J.",
    caregiverPhoto: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=600",
    recipientName: "Dorothy",
    date: "Friday, May 9, 2026",
    timeRange: "9:00 AM – 12:00 PM",
    duration: "3 hrs",
    visitType: "In-home visit",
    status: "completed",
    cost: 51.00,
    oleraFee: 4.34,
    totalCost: 55.34,
    hourlyRate: 17,
    photos: [
      "https://images.pexels.com/photos/7551664/pexels-photo-7551664.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/7551619/pexels-photo-7551619.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    activities: [
      { label: "Morning medication", completed: true },
      { label: "Cognitive exercises", completed: true },
      { label: "Garden walk", completed: true },
      { label: "Light stretching", completed: true },
      { label: "Lunch prep & assistance", completed: true },
    ],
    mood: "Cheerful and talkative",
    timeline: [
      { time: "8:58 AM", type: "check_in", text: "Aisha checked in for Friday's visit" },
      { time: "9:10 AM", type: "medication", text: "Administered Donepezil 10mg and Vitamin D" },
      { time: "9:15 AM", type: "activity", text: "Started morning puzzles — crossword and word search" },
      { time: "9:30 AM", type: "photo", text: "Good morning! Dorothy and I are starting with some puzzles. She's already on her second one!", photoUrl: "https://images.pexels.com/photos/7551664/pexels-photo-7551664.jpeg?auto=compress&cs=tinysrgb&w=600" },
      { time: "10:00 AM", type: "activity", text: "Completed cognitive exercises" },
      { time: "10:15 AM", type: "note", text: "She's doing great this morning — very sharp and engaged. We'll head to the garden next." },
      { time: "10:30 AM", type: "activity", text: "Garden walk — toured her flower beds and vegetable patch" },
      { time: "10:45 AM", type: "photo", text: "Garden time! She showed me all her favorite plants and told me about when she started the garden.", photoUrl: "https://images.pexels.com/photos/7551619/pexels-photo-7551619.jpeg?auto=compress&cs=tinysrgb&w=600" },
      { time: "11:00 AM", type: "activity", text: "Light stretching in the living room" },
      { time: "11:30 AM", type: "activity", text: "Lunch prep — grilled cheese and tomato soup" },
      { time: "11:50 AM", type: "note", text: "Dorothy ate a full lunch and took her afternoon nap on schedule. Very good day overall." },
      { time: "12:05 PM", type: "check_out", text: "Aisha checked out — visit completed" },
    ],
    medicationReminders: [
      { medication: "Donepezil 10mg", time: "9:10 AM", given: true },
      { medication: "Vitamin D", time: "9:10 AM", given: true },
    ],
    reviewStatus: "none",
  },
};

/* ─── Timeline icon ─── */
function TimelineIcon({ type }: { type: TimelineEntry["type"] }) {
  const base = "w-4 h-4 flex-shrink-0";
  switch (type) {
    case "check_in":
      return <svg className={`${base} text-success-500`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
    case "check_out":
      return <svg className={`${base} text-gray-400`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>;
    case "photo":
      return <svg className={`${base} text-primary-500`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>;
    case "medication":
      return <svg className={`${base} text-warning-500`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
    case "note":
      return <svg className={`${base} text-secondary-400`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>;
    case "activity":
      return <svg className={`${base} text-primary-400`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" /></svg>;
    default:
      return <div className={`${base} rounded-full bg-gray-200`} />;
  }
}

/* ─── Page ─── */
export default function VisitDetailsPage() {
  const params = useParams();
  const visitId = params.visitId as string;
  const visit = VISITS[visitId];
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!visit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-lg font-semibold text-gray-900 mb-2">Visit not found</p>
          <Link href="/care-shifts/inbox" className="text-text-sm text-primary-600 hover:text-primary-700">Back to inbox</Link>
        </div>
      </div>
    );
  }

  const isLive = visit.status === "in_progress";
  const completedCount = visit.activities.filter((a) => a.completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-size photo overlay */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setExpandedPhoto(null)}>
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" onClick={() => setExpandedPhoto(null)}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
          <img src={expandedPhoto} alt="Visit photo" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/care-shifts/inbox" className="inline-flex items-center gap-1.5 text-text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Back to conversation
        </Link>

        {/* ── Header card ── */}
        <div className={`rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden mb-6 ${isLive ? "bg-gradient-to-b from-success-25 to-white border border-success-100" : "bg-white"}`}>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={visit.caregiverPhoto} alt={visit.caregiverName} className="w-14 h-14 rounded-xl object-cover" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isLive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLive ? "text-success-600" : "text-gray-400"}`}>
                      {isLive ? "Visit in progress" : "Completed visit"}
                    </span>
                  </div>
                  <h1 className="text-text-lg font-bold text-gray-900">{visit.caregiverName} with {visit.recipientName}</h1>
                  <p className="text-text-sm text-gray-500">{visit.date}</p>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-6 mt-4 -mx-6 -mb-5 px-6 py-4 bg-primary-25 border-t border-primary-100">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <div>
                  <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">Time</p>
                  <p className="text-text-sm font-semibold text-primary-900">{visit.timeRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                <div>
                  <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">Duration</p>
                  <p className="text-text-sm font-semibold text-primary-900">{visit.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                <div>
                  <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">Type</p>
                  <p className="text-text-sm font-semibold text-primary-900">{visit.visitType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                <div>
                  <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">Total</p>
                  <p className="text-text-sm font-bold text-primary-900">${visit.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timeline (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo gallery */}
            {visit.photos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-text-sm font-semibold text-gray-900 mb-3">Photos ({visit.photos.length})</h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visit.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Visit photo ${i + 1}`}
                      className="w-32 h-24 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                      onClick={() => setExpandedPhoto(photo)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Visit timeline */}
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
              <h2 className="text-text-sm font-semibold text-gray-900 mb-4">Visit timeline</h2>
              <div className="space-y-0">
                {visit.timeline.map((entry, i) => (
                  <div key={i} className="flex gap-3 group">
                    {/* Vertical line + icon */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <TimelineIcon type={entry.type} />
                      </div>
                      {i < visit.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-text-xs font-semibold text-gray-900">{entry.time}</span>
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${
                          entry.type === "check_in" ? "text-success-600" :
                          entry.type === "check_out" ? "text-gray-400" :
                          entry.type === "photo" ? "text-primary-500" :
                          entry.type === "medication" ? "text-warning-600" :
                          "text-gray-400"
                        }`}>
                          {entry.type === "check_in" ? "Check-in" :
                           entry.type === "check_out" ? "Check-out" :
                           entry.type === "photo" ? "Photo update" :
                           entry.type === "medication" ? "Medication" :
                           entry.type === "note" ? "Note" :
                           "Activity"}
                        </span>
                      </div>
                      <p className="text-text-sm text-gray-600 leading-relaxed">{entry.text}</p>
                      {entry.photoUrl && (
                        <img
                          src={entry.photoUrl}
                          alt="Visit photo"
                          className="mt-2 w-48 h-36 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setExpandedPhoto(entry.photoUrl!)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Activities */}
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-text-sm font-semibold text-gray-900">Activities</h2>
                <span className="text-text-xs text-gray-400">{completedCount}/{visit.activities.length}</span>
              </div>
              <div className="space-y-2">
                {visit.activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {a.completed ? (
                      <svg className="w-4 h-4 text-success-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <span className={`text-text-sm ${a.completed ? "text-gray-700" : "text-gray-400"}`}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood */}
            {visit.mood && (
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                  <h2 className="text-text-sm font-semibold text-gray-900">Mood & wellbeing</h2>
                </div>
                <p className="text-text-sm text-gray-600">{visit.mood}</p>
              </div>
            )}

            {/* Medications */}
            {visit.medicationReminders.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-text-sm font-semibold text-gray-900 mb-3">Medications</h2>
                <div className="space-y-2">
                  {visit.medicationReminders.map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {m.given ? (
                        <svg className="w-4 h-4 text-success-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-warning-300 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-text-sm text-gray-700">{m.medication}</p>
                        <p className="text-text-xs text-gray-400">{m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
              <h2 className="text-text-sm font-semibold text-gray-900 mb-3">Cost breakdown</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-sm text-gray-500">{visit.duration} @ ${visit.hourlyRate}/hr</span>
                  <span className="text-text-sm text-gray-700">${visit.cost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-sm text-gray-500">Olera service fee (8.5%)</span>
                  <span className="text-text-sm text-gray-700">${visit.oleraFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-text-sm font-bold text-gray-900">${visit.totalCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowReceipt(!showReceipt)}
                className="w-full mt-3 py-2 rounded-lg text-text-xs font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                {showReceipt ? "Hide receipt" : "View receipt"}
              </button>

              {showReceipt && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Receipt</span>
                      <span className="text-[10px] text-gray-400">#{visit.visitId.toUpperCase()}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Caregiver</span>
                        <span className="text-gray-700 font-medium">{visit.caregiverName}</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Recipient</span>
                        <span className="text-gray-700 font-medium">{visit.recipientName}</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-700 font-medium">{visit.date}</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Time</span>
                        <span className="text-gray-700 font-medium">{visit.timeRange}</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-gray-700 font-medium">{visit.duration}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2 space-y-1.5">
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Hourly rate</span>
                        <span className="text-gray-700">${visit.hourlyRate.toFixed(2)}/hr</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Subtotal ({visit.duration})</span>
                        <span className="text-gray-700">${visit.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Olera service fee (8.5%)</span>
                        <span className="text-gray-700">${visit.oleraFee.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-text-sm font-semibold text-gray-900">Amount charged</span>
                      <span className="text-text-sm font-bold text-gray-900">${visit.totalCost.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-200 pt-2 space-y-1">
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Payment method</span>
                        <span className="text-gray-700">Visa ending 4242</span>
                      </div>
                      <div className="flex justify-between text-text-xs">
                        <span className="text-gray-500">Payment status</span>
                        <span className="text-success-600 font-medium">{isLive ? "Pending" : "Paid"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                  Dispute or report a problem
                </button>
              </div>
            </div>

            {/* Review */}
            {!isLive && (
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-text-sm font-semibold text-gray-900 mb-2">Review</h2>
                {visit.reviewStatus === "none" ? (
                  <>
                    <p className="text-text-xs text-gray-500 mb-3">Share your experience to help other families.</p>
                    <Link
                      href="/care-shifts/inbox"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                      Leave a review
                    </Link>
                  </>
                ) : (
                  <p className="text-text-xs text-success-600 font-medium">Review submitted</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
