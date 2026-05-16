"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────── */

type Tab = "active" | "requests" | "archived";
type MessageType = "text" | "status";
type MessageSender = "maria" | "family";

interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
  type?: MessageType;
}

interface Conversation {
  id: string;
  familyName: string;
  familyInitials: string;
  recipientName: string;
  recipientAge: number;
  relationship: string;
  location: string;
  zipCode: string;
  careTypes: string[];
  schedule: string;
  rate: string;
  lastMessage: string;
  lastMessageTime: string;
  status: "active" | "request" | "archived";
  statusLabel: string;
  statusColor: string;
  unread?: boolean;
  messages: Message[];
  lastVisit?: {
    date: string;
    time: string;
    photos: number;
    notes: string[];
    activities: { name: string; done: boolean }[];
    mood: string;
  };
}

/* ─── Mock data ──────────────────────────────────────────── */

const MARIA = {
  firstName: "Maria",
  lastName: "S.",
  photo: "/images/maria-profile.jpg",
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    familyName: "Sarah Chen",
    familyInitials: "SC",
    recipientName: "Dorothy Chen",
    recipientAge: 78,
    relationship: "My mother",
    location: "Bellaire, Houston",
    zipCode: "77019",
    careTypes: ["Dementia Care", "Companionship"],
    schedule: "Mon/Wed/Fri, 9am\u201312pm, ongoing",
    rate: "$26/hr",
    lastMessage: "How was Dorothy's visit with Maria?",
    lastMessageTime: "6:00 PM",
    status: "active",
    statusLabel: "Visit completed",
    statusColor: "bg-primary-50 text-primary-700 border-primary-100",
    messages: [
      { id: "m1", sender: "family", text: "", time: "Apr 28, 11:00 AM", type: "status" },
      { id: "m2", sender: "family", text: "Hi Maria, I'd love to connect about care for my mother. Looking forward to hearing from you!", time: "Apr 28, 11:00 AM" },
      { id: "m3", sender: "family", text: "", time: "Apr 28, 11:45 AM", type: "status" },
      { id: "m4", sender: "maria", text: "Hi! Thank you so much for reaching out. I specialize in dementia care and would love to learn more about your mother. Could we do a video meet & greet this week?", time: "Apr 28, 12:30 PM" },
      { id: "m5", sender: "family", text: "That would be great! How about Wednesday at 2pm?", time: "Apr 29, 9:00 AM" },
      { id: "m6", sender: "family", text: "", time: "Apr 29", type: "status" },
      { id: "m7", sender: "maria", text: "Perfect! I'll send you the video link before the call. Looking forward to meeting you and hearing more about Dorothy.", time: "Apr 29, 10:15 AM" },
      { id: "m8", sender: "family", text: "", time: "May 7", type: "status" },
      { id: "m9", sender: "family", text: "", time: "May 8", type: "status" },
      { id: "m10", sender: "family", text: "", time: "Today, 9:02 AM", type: "status" },
      { id: "m11", sender: "family", text: "How was Dorothy's visit with Maria?", time: "6:00 PM" },
    ],
    lastVisit: {
      date: "Today",
      time: "9:00 AM \u2013 12:00 PM",
      photos: 3,
      notes: [
        "We just finished breakfast \u2014 she had her favorite oatmeal!",
        "Now we're doing the morning puzzle. She solved 6 today!",
      ],
      activities: [
        { name: "Breakfast assistance", done: true },
        { name: "Morning medication", done: true },
        { name: "Cognitive exercises", done: true },
        { name: "Light stretching", done: false },
        { name: "Lunch prep", done: false },
      ],
      mood: "Happy and engaged this morning",
    },
  },
  {
    id: "c2",
    familyName: "Aisha Johnson",
    familyInitials: "AJ",
    recipientName: "Margaret Johnson",
    recipientAge: 81,
    relationship: "My grandmother",
    location: "Montrose, Houston",
    zipCode: "77006",
    careTypes: ["Companionship", "Meal prep"],
    schedule: "Tue/Thu, 10am\u20131pm",
    rate: "$26/hr",
    lastMessage: "Looking forward to Wednesday! Same routine as usual.",
    lastMessageTime: "Yesterday",
    status: "active",
    statusLabel: "Booking confirmed",
    statusColor: "bg-primary-50 text-primary-700 border-primary-100",
    messages: [
      { id: "m1", sender: "family", text: "Hi Maria, my grandmother loves your visits! Can we add Wednesday this week?", time: "Mon, 3:00 PM" },
      { id: "m2", sender: "maria", text: "Of course! I'd love to see Margaret. Wednesday 10am\u20131pm works perfectly for me.", time: "Mon, 3:30 PM" },
      { id: "m3", sender: "family", text: "Looking forward to Wednesday! Same routine as usual.", time: "Yesterday" },
    ],
  },
  {
    id: "c3",
    familyName: "David Liu",
    familyInitials: "DL",
    recipientName: "Henry Liu",
    recipientAge: 85,
    relationship: "My father",
    location: "Sugar Land, TX",
    zipCode: "77479",
    careTypes: ["Dementia Care", "Mobility assistance"],
    schedule: "Mon\u2013Fri, 8am\u201312pm",
    rate: "$26/hr",
    lastMessage: "See you Saturday! I'll bring my ID and resume for the meet & greet.",
    lastMessageTime: "Yesterday",
    status: "active",
    statusLabel: "Meet & greet scheduled",
    statusColor: "bg-amber-50 text-amber-700 border-amber-100",
    messages: [
      { id: "m1", sender: "family", text: "Maria, we've heard great things about you. Would you be open to a meet & greet this Saturday?", time: "Tue, 2:00 PM" },
      { id: "m2", sender: "maria", text: "I'd love to! Saturday morning works well. How about 10am at a coffee shop near you?", time: "Tue, 2:45 PM" },
      { id: "m3", sender: "family", text: "River Oaks Coffee works. See you at 10am!", time: "Wed, 9:00 AM" },
      { id: "m4", sender: "maria", text: "See you Saturday! I'll bring my ID and resume for the meet & greet.", time: "Yesterday" },
    ],
  },
  {
    id: "c4",
    familyName: "Carlos Rodriguez",
    familyInitials: "CR",
    recipientName: "Rosa Rodriguez",
    recipientAge: 74,
    relationship: "My mother",
    location: "Heights, Houston",
    zipCode: "77008",
    careTypes: ["Companionship", "Light housekeeping"],
    schedule: "Flexible, 2\u20133 days/week",
    rate: "$26/hr",
    lastMessage: "That sounds great. What area are you located in?",
    lastMessageTime: "Mon",
    status: "active",
    statusLabel: "Chatting",
    statusColor: "bg-blue-50 text-blue-700 border-blue-100",
    messages: [
      { id: "m1", sender: "family", text: "Hi Maria! I saw your profile and love your experience. My mom speaks Spanish and English \u2014 that's important to us.", time: "Sun, 4:00 PM" },
      { id: "m2", sender: "maria", text: "\u00A1Hola Carlos! I'd love to help care for your mom. Being bilingual is one of my strengths. Can you tell me more about her daily routine?", time: "Mon, 8:00 AM" },
      { id: "m3", sender: "family", text: "That sounds great. What area are you located in?", time: "Mon, 10:00 AM" },
    ],
  },
  // Requests
  {
    id: "r1",
    familyName: "Sarah Chen",
    familyInitials: "SC",
    recipientName: "Dorothy Chen",
    recipientAge: 78,
    relationship: "My mother",
    location: "Bellaire, Houston",
    zipCode: "77019",
    careTypes: ["Companionship", "Meal prep"],
    schedule: "Mon/Wed/Fri, 9am\u201312pm",
    rate: "$540/week",
    lastMessage: "My mother loves gardening and old movies. She's independent but needs someone around for company...",
    lastMessageTime: "2h ago",
    status: "request",
    statusLabel: "New request",
    statusColor: "bg-warning-50 text-warning-700 border-warning-100",
    unread: true,
    messages: [],
  },
  {
    id: "r2",
    familyName: "Michael Torres",
    familyInitials: "MT",
    recipientName: "Robert Torres",
    recipientAge: 82,
    relationship: "My father",
    location: "Montrose, Houston",
    zipCode: "77006",
    careTypes: ["Mobility assistance", "Errands"],
    schedule: "Tue/Thu, 1pm\u20134pm",
    rate: "$360/week",
    lastMessage: "Dad had a hip replacement recently and needs help getting around the house...",
    lastMessageTime: "Yesterday",
    status: "request",
    statusLabel: "New request",
    statusColor: "bg-warning-50 text-warning-700 border-warning-100",
    unread: true,
    messages: [],
  },
  // Archived
  {
    id: "a1",
    familyName: "Priya Mehta",
    familyInitials: "PM",
    recipientName: "Lakshmi Mehta",
    recipientAge: 79,
    relationship: "My mother",
    location: "Katy, TX",
    zipCode: "77494",
    careTypes: ["Dementia Care"],
    schedule: "Mon\u2013Fri, 9am\u20131pm",
    rate: "$26/hr",
    lastMessage: "Thank you for the wonderful review! It was a pleasure caring for your mother.",
    lastMessageTime: "Apr 25",
    status: "archived",
    statusLabel: "Visit completed",
    statusColor: "bg-gray-50 text-gray-500 border-gray-200",
    messages: [
      { id: "m1", sender: "family", text: "Thank you for everything, Maria. Mom really enjoyed your visits.", time: "Apr 24" },
      { id: "m2", sender: "maria", text: "Thank you for the wonderful review! It was a pleasure caring for your mother.", time: "Apr 25" },
    ],
  },
];

/* ─── Status messages for conversation thread ─────────────── */

function getStatusText(msg: Message, conv: Conversation): string {
  const map: Record<string, string> = {
    m1: `Connection request sent \u00B7 Apr 28, 11:00 AM`,
    m3: `Connection accepted \u00B7 Apr 28, 11:45 AM`,
    m6: `Meet & greet confirmed for Wednesday, May 7 at 2:00 PM (Video call) \u00B7 Apr 29`,
    m8: `Meet & greet completed \u00B7 May 7`,
    m9: `Booking confirmed: Mon/Wed/Fri 9:00 AM \u2013 12:00 PM starting May 9 \u00B7 May 8`,
    m10: `Maria checked in for today's visit \u00B7 Today, 9:02 AM`,
  };
  return map[msg.id] || `Status update \u00B7 ${msg.time}`;
}

/* ─── Conversation list item ─────────────────────────────── */

function ConvoItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${selected ? "bg-primary-50" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
          <span className="text-sm font-bold text-gray-600">{conv.familyInitials}</span>
          {conv.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-sm font-semibold text-gray-900 truncate ${conv.unread ? "" : ""}`}>{conv.familyName}</p>
            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
          </div>
          <p className="text-xs text-gray-400 truncate mb-1">{conv.recipientName} &middot; {conv.rate}</p>
          <p className={`text-xs truncate ${conv.unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>{conv.lastMessage}</p>
          <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${conv.statusColor}`}>{conv.statusLabel}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Request detail (center panel for pending requests) ── */

function RequestDetail({ conv, onAccept, onDecline }: { conv: Conversation; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      {/* Connection request card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connection Request</h2>
              <p className="text-xs text-gray-400">from {conv.familyName} &middot; {conv.lastMessageTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Care needed</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {conv.careTypes.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100 text-[11px] font-medium text-primary-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Schedule</p>
                <p className="text-sm text-gray-900 mt-0.5">{conv.schedule}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Location</p>
                <p className="text-sm text-gray-900 mt-0.5">{conv.zipCode}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Care for</p>
                <p className="text-sm text-gray-900 mt-0.5">{conv.relationship}</p>
              </div>
            </div>
          </div>

          <div className="bg-vanilla-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{conv.lastMessage}&rdquo;</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <p className="text-gray-500">Estimated earnings:</p>
            <p className="font-bold text-primary-700">{conv.rate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onAccept} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20">
            Accept &amp; connect
          </button>
          <button onClick={onDecline} className="flex-1 py-3 border border-gray-200 hover:border-gray-300 text-sm font-semibold text-gray-600 rounded-xl transition-colors">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Conversation thread (center panel for active) ──────── */

function ConvoThread({ conv }: { conv: Conversation }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.id]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {conv.messages.map((msg) => {
          if (msg.type === "status") {
            const statusText = conv.id === "c1" ? getStatusText(msg, conv) : `Status update \u00B7 ${msg.time}`;
            const isAccept = statusText.includes("accepted") || statusText.includes("confirmed") || statusText.includes("completed") || statusText.includes("checked in");
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium ${isAccept ? "bg-primary-50 text-primary-700 border border-primary-100" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
                  {isAccept && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  {!isAccept && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                  {statusText}
                </span>
              </div>
            );
          }

          const isMaria = msg.sender === "maria";
          return (
            <div key={msg.id} className={`flex ${isMaria ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[70%] ${isMaria ? "" : ""}`}>
                {isMaria && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image src={MARIA.photo} alt="Maria" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMaria ? "bg-white border border-gray-200 text-gray-700" : "bg-primary-600 text-white"}`}>
                  {msg.text}
                </div>
                {!isMaria && <p className="text-[10px] text-gray-400 text-right mt-0.5">{msg.time}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 sm:px-6 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
            />
          </div>
          <button disabled={!input.trim()} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Right detail panel (family/recipient details) ──────── */

function FamilyDetailPanel({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  return (
    <div className="w-[360px] h-full border-l border-gray-100 bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Family details</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Family info */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <span className="text-xl font-bold text-gray-500">{conv.familyInitials}</span>
          </div>
          <p className="text-base font-bold text-gray-900">{conv.familyName}</p>
          <p className="text-xs text-gray-400">{conv.location}</p>
        </div>

        {/* Recipient */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Care recipient</p>
          <div className="bg-vanilla-50 rounded-xl p-3">
            <p className="text-sm font-semibold text-gray-900">{conv.recipientName}</p>
            <p className="text-xs text-gray-500">Age {conv.recipientAge} &middot; {conv.relationship}</p>
          </div>
        </div>

        {/* Care details */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Care details</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              <span className="text-gray-700">{conv.schedule}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {conv.careTypes.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100 text-[10px] font-medium text-primary-700">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Last visit */}
        {conv.lastVisit && (
          <>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Last visit</p>
              <div className="bg-vanilla-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">Maria with {conv.recipientName.split(" ")[0]}</p>
                <p className="text-xs text-gray-500">{conv.lastVisit.date} &middot; {conv.lastVisit.time}</p>
              </div>
            </div>

            {conv.lastVisit.photos > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">{conv.lastVisit.photos} photos</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: conv.lastVisit.photos }).map((_, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 21h18a2.25 2.25 0 0 0 2.25-2.25V5.25A2.25 2.25 0 0 0 21 3H3a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 3 21Z" /></svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Visit notes</p>
              {conv.lastVisit.notes.map((note, i) => (
                <p key={i} className="text-xs text-gray-600 leading-relaxed mb-1">&ldquo;{note}&rdquo;</p>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Activities</p>
              <div className="space-y-1">
                {conv.lastVisit.activities.map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    {a.done ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                    )}
                    <span className={`text-xs ${a.done ? "text-gray-700" : "text-gray-400"}`}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Mood</p>
              <p className="text-xs text-gray-600">{conv.lastVisit.mood}</p>
            </div>

            <button className="w-full py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              View full visit details
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Care Log Panel ─────────────────────────────────────── */

interface TimelineEntry {
  id: string;
  time: string;
  type: "checkin" | "medication" | "activity" | "photo" | "note" | "checkout";
  label: string;
  text: string;
  color: string;
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function CaregiverInboxPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [selectedId, setSelectedId] = useState<string | null>("c1");
  const [detailOpen, setDetailOpen] = useState(true);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);

  const filtered = conversations.filter((c) => {
    if (tab === "active") return c.status === "active";
    if (tab === "requests") return c.status === "request";
    return c.status === "archived";
  });

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const isRequest = selected?.status === "request";
  const requestCount = conversations.filter((c) => c.status === "request").length;

  const handleAccept = () => {
    if (!selected) return;
    const acceptedId = selected.id;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === acceptedId
          ? {
              ...c,
              status: "active" as const,
              statusLabel: "Connected",
              statusColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
              unread: false,
              lastMessage: "Connection accepted — say hello!",
              lastMessageTime: "Just now",
              messages: [
                { id: "status-accepted", sender: "maria" as const, text: "Connection accepted", time: "Just now", type: "status" as const },
                { id: "auto-intro", sender: "maria" as const, text: `Hi ${c.familyName.split(" ")[0]}! I'd love to help care for ${c.recipientName.split(" ")[0]}. When would be a good time to chat about the details?`, time: "Just now" },
              ],
            }
          : c,
      ),
    );
    setTab("active");
    setSelectedId(acceptedId);
  };

  const handleDecline = () => {
    if (!selected) return;
    const declinedId = selected.id;
    setConversations((prev) => prev.filter((c) => c.id !== declinedId));
    setSelectedId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* ── Nav ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/care-shifts/students" className="flex items-center gap-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
              <span className="text-lg font-semibold text-gray-900">Olera</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/caregiver/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">Dashboard</Link>
              <Link href="/care-shifts/inbox" className="px-3 py-1.5 rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">Inbox</Link>
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
              <button onClick={() => setNavMenuOpen(!navMenuOpen)} className="flex items-center gap-1.5 rounded-full border border-gray-200 hover:border-gray-300 pl-1 pr-2.5 py-1 transition-colors">
                <div className="w-7 h-7 rounded-full overflow-hidden">
                  <Image src={MARIA.photo} alt={MARIA.firstName} width={28} height={28} className="w-full h-full object-cover" />
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {navMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNavMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{MARIA.firstName} {MARIA.lastName}</p>
                      <p className="text-xs text-gray-400">maria.s@olera.com</p>
                    </div>
                    <Link href="/care-shifts/inbox" onClick={() => setNavMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                      Inbox
                    </Link>
                    <Link href="/caregiver/apply" onClick={() => setNavMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                      Profile
                    </Link>
                    <Link href="#" onClick={() => setNavMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: conversation list */}
        <div className={`w-full lg:w-[320px] lg:shrink-0 flex flex-col border-r border-gray-100 ${selectedId ? "hidden lg:flex" : "flex"}`}>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2.5 border-b border-gray-100">
            {(["active", "requests", "archived"] as Tab[]).map((t) => {
              const count = t === "requests" ? requestCount : t === "active" ? conversations.filter((c) => c.status === "active").length : conversations.filter((c) => c.status === "archived").length;
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelectedId(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${isActive ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {count > 0 && (
                    <span className={`ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${isActive ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">No {tab} conversations</p>
              </div>
            ) : (
              filtered.map((c) => (
                <ConvoItem key={c.id} conv={c} selected={selectedId === c.id} onClick={() => setSelectedId(c.id)} />
              ))
            )}
          </div>
        </div>

        {/* Center: conversation or request detail */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${selectedId ? "flex" : "hidden lg:flex"}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                </div>
                <p className="text-sm text-gray-500">Select a conversation</p>
                <p className="text-xs text-gray-400 mt-0.5">Choose from your {tab} conversations on the left</p>
              </div>
            </div>
          ) : (
            <>
              {/* Convo header */}
              <div className="bg-white border-b border-gray-100">
                <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedId(null)} className="lg:hidden w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">{selected.familyInitials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selected.familyName}</p>
                      <p className="text-xs text-gray-400">{selected.recipientName}, age {selected.recipientAge} &middot; {selected.location}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetailOpen(!detailOpen)} className="hidden lg:flex w-8 h-8 rounded-full hover:bg-gray-100 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                  </button>
                </div>
                {/* Messages header */}
              </div>

              {isRequest ? (
                <RequestDetail conv={selected} onAccept={handleAccept} onDecline={handleDecline} />
              ) : (
                <ConvoThread conv={selected} />
              )}
            </>
          )}
        </div>

        {/* Right: family detail panel */}
        {selected && detailOpen && !isRequest && (
          <div className="hidden lg:flex">
            <FamilyDetailPanel conv={selected} onClose={() => setDetailOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
