"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─── */
type ConversationStatus =
  | "request_sent"
  | "request_received"
  | "chatting"
  | "meet_greet_pending"
  | "meet_greet_scheduled"
  | "met_ready_to_book"
  | "booking_confirmed"
  | "visit_in_progress"
  | "visit_completed"
  | "archived";

type MeetingType = "video" | "in_person";

interface MeetingDetails {
  type: MeetingType;
  date: string;
  time: string;
  note?: string;
  location?: string;
}

interface Message {
  id: string;
  from: "me" | "them" | "system";
  type: "text" | "system" | "photo" | "schedule_invite" | "meet_greet_response" | "welcome_package" | "review_prompt";
  text: string;
  timestamp: string;
  read?: boolean;
  photoUrl?: string;
  inviteDate?: string;
  inviteTime?: string;
  meetingType?: MeetingType;
  responseType?: "accept" | "decline" | "counter";
  welcomePackageId?: string;
  counterDate?: string;
  counterTime?: string;
}

interface VisitActivity {
  label: string;
  completed: boolean;
}

interface VisitDetails {
  visitId: string;
  recipientName: string;
  date: string;
  timeRange: string;
  duration: string;
  checkInTime?: string;
  status: "in_progress" | "completed";
  photos: string[];
  notes: string[];
  activities: VisitActivity[];
  mood?: string;
  medicationReminders?: { medication: string; time: string; given: boolean }[];
  cost?: number;
}

interface RequestDetails {
  careTypes: string[];
  schedule: string;
  postalCode: string;
  careFor: string;
  sentAt: string;
}

interface ScheduleEntry {
  id: string;
  time: string;
  activity: string;
  category: string;
  notes: string;
}

interface CareRecipientProfile {
  id: string;
  name: string;
  age: string;
  relationship: string;
  photo: string;
  bio: string;
  condition: string;
  conditionOther: string;
  languages: string[];
  languagesOther: string;
  hobbies: string;
  personality: string;
  careNeeds: string[];
  zipCode: string;
  // Health (Step C)
  medications: string;
  allergies: string;
  mobility: string;
  dietary: string;
  // Daily routine (Step D)
  schedule: ScheduleEntry[];
  // Home (Step E)
  address: string;
  entryInstructions: string;
  parking: string;
  pets: string;
  // Emergency (Step F)
  emergencyName: string;
  emergencyPhone: string;
  doctorName: string;
  doctorPhone: string;
  hospitalPreference: string;
  houseRules: string;
}

interface BookingDetails {
  date: string;
  startTime: string;
  duration: string;
  recurring: boolean;
  recurringPattern?: string;
  careTypes: string[];
  welcomePackageId?: string;
  totalCost?: number;
}

const EMPTY_PROFILE: CareRecipientProfile = {
  id: "", name: "", age: "", relationship: "", photo: "", bio: "",
  condition: "", conditionOther: "", languages: [], languagesOther: "",
  hobbies: "", personality: "", careNeeds: [], zipCode: "",
  medications: "", allergies: "", mobility: "", dietary: "",
  schedule: [],
  address: "", entryInstructions: "", parking: "", pets: "",
  emergencyName: "", emergencyPhone: "", doctorName: "", doctorPhone: "",
  hospitalPreference: "", houseRules: "",
};

interface Conversation {
  id: string;
  name: string;
  photo: string;
  university: string;
  universityAbbr: string;
  contextLine: string;
  verified: boolean;
  rate: number;
  feedId: string;
  badges: string[];
  status: ConversationStatus;
  tab: "active" | "requests" | "archived";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: Message[];
  requestDetails?: RequestDetails;
  meetingDetails?: MeetingDetails;
  bookingDetails?: BookingDetails;
  sharedWelcomePackageId?: string;
  sharedWelcomePackage?: CareRecipientProfile;
  visitDetails?: VisitDetails;
}

/* ─── Status config ─── */
const STATUS_LABELS: Record<ConversationStatus, string> = {
  request_sent: "Request sent",
  request_received: "New request",
  chatting: "Chatting",
  meet_greet_pending: "Meet & greet pending",
  meet_greet_scheduled: "Meet & greet scheduled",
  met_ready_to_book: "Met — ready to book",
  booking_confirmed: "Booking confirmed",
  visit_in_progress: "Visit in progress",
  visit_completed: "Visit completed",
  archived: "Archived",
};

const STATUS_COLORS: Record<ConversationStatus, string> = {
  request_sent: "bg-warning-50 text-warning-700 border-warning-200",
  request_received: "bg-primary-50 text-primary-700 border-primary-200",
  chatting: "bg-primary-50 text-primary-700 border-primary-200",
  meet_greet_pending: "bg-warning-50 text-warning-700 border-warning-200",
  meet_greet_scheduled: "bg-success-50 text-success-700 border-success-200",
  met_ready_to_book: "bg-primary-50 text-primary-700 border-primary-200",
  booking_confirmed: "bg-success-50 text-success-700 border-success-200",
  visit_in_progress: "bg-success-50 text-success-700 border-success-200",
  visit_completed: "bg-gray-50 text-gray-600 border-gray-200",
  archived: "bg-gray-50 text-gray-500 border-gray-200",
};

/* ─── Mock data ─── */
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-maria",
    name: "Maria S.",
    photo: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "University of Houston",
    universityAbbr: "uh",
    contextLine: "3rd Year, Pre-Med",
    verified: true,
    rate: 20,
    feedId: "1",
    badges: ["Dementia Specialist", "Background Checked"],
    status: "visit_completed",
    tab: "active",
    lastMessage: "How was Dorothy's visit with Maria?",
    lastMessageTime: "6:00 PM",
    unread: 1,
    requestDetails: { careTypes: ["Dementia Care", "Companionship"], schedule: "Mon/Wed/Fri, 9am–12pm, ongoing", postalCode: "77019", careFor: "My mother", sentAt: "Apr 28" },
    bookingDetails: { date: "2026-05-11", startTime: "9:00 AM", duration: "3 hrs", recurring: true, recurringPattern: "Mon/Wed/Fri, 9am–12pm", careTypes: ["Dementia Care", "Companionship"], totalCost: 51 },
    visitDetails: {
      visitId: "visit-maria-0511",
      recipientName: "Dorothy",
      date: "Today",
      timeRange: "9:00 AM – 12:00 PM",
      duration: "3 hrs",
      checkInTime: "9:02 AM",
      status: "completed",
      photos: [
        "https://images.pexels.com/photos/3791664/pexels-photo-3791664.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
      notes: ["We just finished breakfast — she had her favorite oatmeal!", "Now we're doing the morning puzzle. She solved 6 today!"],
      activities: [
        { label: "Breakfast assistance", completed: true },
        { label: "Morning medication", completed: true },
        { label: "Cognitive exercises", completed: true },
        { label: "Light stretching", completed: false },
        { label: "Lunch prep", completed: false },
      ],
      mood: "Happy and engaged this morning",
      medicationReminders: [
        { medication: "Donepezil 10mg", time: "9:15 AM", given: true },
        { medication: "Vitamin D", time: "9:15 AM", given: true },
      ],
    },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection request sent", timestamp: "Apr 28, 11:00 AM" },
      { id: "m2", from: "me", type: "text", text: "Hi Maria, I'd love to connect about care for my family member. Looking forward to hearing from you!", timestamp: "Apr 28, 11:00 AM" },
      { id: "m3", from: "system", type: "system", text: "Connection accepted", timestamp: "Apr 28, 11:45 AM" },
      { id: "m4", from: "them", type: "text", text: "Hi! Thank you so much for reaching out. I specialize in dementia care and would love to learn more about your mother. Could we do a video meet & greet this week?", timestamp: "Apr 28, 12:30 PM" },
      { id: "m5", from: "me", type: "text", text: "That would be great! How about Wednesday at 2pm?", timestamp: "Apr 29, 9:00 AM" },
      { id: "m6", from: "system", type: "system", text: "Meet & greet confirmed for Wednesday, May 7 at 2:00 PM (Video call)", timestamp: "Apr 29" },
      { id: "m7", from: "them", type: "text", text: "Perfect! I'll send you the video link before the call. Looking forward to meeting you and hearing more about Dorothy.", timestamp: "Apr 29, 10:15 AM" },
      { id: "m8", from: "system", type: "system", text: "Meet & greet completed", timestamp: "May 7" },
      { id: "m9", from: "system", type: "system", text: "Booking confirmed: Mon/Wed/Fri 9:00 AM – 12:00 PM starting May 9", timestamp: "May 8" },
      { id: "m10", from: "system", type: "system", text: "Maria checked in for today's visit", timestamp: "Today, 9:02 AM" },
      { id: "m11", from: "them", type: "photo", text: "We just finished breakfast — she had her favorite oatmeal!", photoUrl: "https://images.pexels.com/photos/3791664/pexels-photo-3791664.jpeg?auto=compress&cs=tinysrgb&w=600", timestamp: "Today, 9:45 AM", read: false },
      { id: "m12", from: "them", type: "text", text: "Dorothy is in great spirits this morning! She remembered the puzzle we did last time and asked to do it again.", timestamp: "Today, 10:10 AM", read: false },
      { id: "m13", from: "them", type: "photo", text: "Now we're doing the morning puzzle. She solved 6 today!", photoUrl: "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=600", timestamp: "Today, 10:32 AM", read: false },
      { id: "m14", from: "them", type: "text", text: "All done for today! Dorothy had a wonderful morning. She ate all her lunch and was in great spirits. See you Wednesday!", timestamp: "Today, 12:05 PM" },
      { id: "m15", from: "system", type: "system", text: "Maria checked out — visit completed", timestamp: "Today, 12:05 PM" },
      { id: "m16", from: "system", type: "system", text: "Visit completed: Today, 9:00 AM – 12:00 PM", timestamp: "Today" },
      { id: "m17", from: "system", type: "review_prompt", text: "How was Dorothy's visit with Maria?", timestamp: "Today, 6:00 PM" },
      { id: "m18", from: "system", type: "system", text: "You sent Maria $60.00 for today's visit (3 hrs × $20/hr)", timestamp: "Today, 6:00 PM" },
    ],
  },
  {
    id: "conv-1",
    name: "Aisha J.",
    photo: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "Prairie View A&M",
    universityAbbr: "pvamu",
    contextLine: "2nd Year, Psychology",
    verified: true,
    rate: 17,
    feedId: "3",
    badges: ["Licensed CNA", "Background Checked"],
    status: "booking_confirmed",
    tab: "active",
    lastMessage: "Looking forward to Wednesday! Same routine works great.",
    lastMessageTime: "Yesterday",
    unread: 0,
    requestDetails: { careTypes: ["Dementia Care", "Companionship"], schedule: "Mon/Wed/Fri, 9am–12pm, ongoing", postalCode: "77494", careFor: "My mother", sentAt: "Apr 27" },
    bookingDetails: { date: "2026-05-14", startTime: "9:00 AM", duration: "3 hrs", recurring: true, recurringPattern: "Mon/Wed/Fri, 9am–12pm", careTypes: ["Dementia Care", "Companionship"], totalCost: 51 },
    visitDetails: {
      visitId: "visit-aisha-0509",
      recipientName: "Dorothy",
      date: "Friday, May 9",
      timeRange: "9:00 AM – 12:00 PM",
      duration: "3 hrs",
      checkInTime: "8:58 AM",
      status: "completed",
      photos: [
        "https://images.pexels.com/photos/7551664/pexels-photo-7551664.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/7551619/pexels-photo-7551619.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3831612/pexels-photo-3831612.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
      notes: ["Dorothy was wonderful today! We did puzzles, went for a short walk in the garden, and she told me stories about her childhood.", "She ate a full lunch and took her afternoon nap on schedule. Very good day overall."],
      activities: [
        { label: "Morning medication", completed: true },
        { label: "Cognitive exercises", completed: true },
        { label: "Garden walk", completed: true },
        { label: "Light stretching", completed: true },
        { label: "Lunch prep & assistance", completed: true },
      ],
      mood: "Cheerful and talkative",
      medicationReminders: [
        { medication: "Donepezil 10mg", time: "9:10 AM", given: true },
        { medication: "Vitamin D", time: "9:10 AM", given: true },
      ],
      cost: 51,
    },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection accepted", timestamp: "Apr 28" },
      { id: "m2", from: "me", type: "text", text: "Hi Aisha! Thanks for accepting. My mom has mild dementia and we're looking for someone 3 mornings a week. Would you be open to a quick meet and greet?", timestamp: "Apr 28, 10:15 AM" },
      { id: "m3", from: "them", type: "text", text: "Absolutely! I specialize in dementia care and I'd love to meet you and your mom. What days work best for you?", timestamp: "Apr 28, 11:02 AM" },
      { id: "m4", from: "system", type: "system", text: "Meet & greet completed", timestamp: "May 1" },
      { id: "m5", from: "system", type: "system", text: "Booking confirmed: Mon/Wed/Fri 9:00 AM – 12:00 PM starting May 5", timestamp: "May 2" },
      { id: "m6", from: "system", type: "system", text: "Aisha checked in for Friday's visit", timestamp: "May 9, 8:58 AM" },
      { id: "m7", from: "them", type: "photo", text: "Good morning! Dorothy and I are starting with some puzzles. She's already on her second one!", photoUrl: "https://images.pexels.com/photos/7551664/pexels-photo-7551664.jpeg?auto=compress&cs=tinysrgb&w=600", timestamp: "May 9, 9:30 AM" },
      { id: "m8", from: "them", type: "text", text: "She's doing great this morning — very sharp and engaged. We'll head to the garden next.", timestamp: "May 9, 10:15 AM" },
      { id: "m9", from: "them", type: "photo", text: "Garden time! She showed me all her favorite plants and told me about when she started the garden.", photoUrl: "https://images.pexels.com/photos/7551619/pexels-photo-7551619.jpeg?auto=compress&cs=tinysrgb&w=600", timestamp: "May 9, 10:45 AM" },
      { id: "m10", from: "them", type: "text", text: "All done! Dorothy had a wonderful morning. Full visit notes are in the visit summary. See you Monday!", timestamp: "May 9, 12:05 PM" },
      { id: "m11", from: "system", type: "system", text: "Visit completed: May 9, 9:00 AM – 12:00 PM", timestamp: "May 9" },
      { id: "m12", from: "me", type: "text", text: "These photos made my day! Thank you Aisha, mom looks so happy.", timestamp: "May 9, 1:30 PM" },
      { id: "m13", from: "them", type: "text", text: "Looking forward to Wednesday! Same routine works great.", timestamp: "Yesterday, 4:00 PM" },
    ],
  },
  {
    id: "conv-2",
    name: "David L.",
    photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "Texas A&M University",
    universityAbbr: "tamu",
    contextLine: "4th Year, Nursing",
    verified: true,
    rate: 18,
    feedId: "2",
    badges: ["First Aid", "Background Checked"],
    status: "meet_greet_scheduled",
    tab: "active",
    lastMessage: "See you Saturday! I'll bring my ID and references.",
    lastMessageTime: "Yesterday",
    unread: 0,
    requestDetails: { careTypes: ["Mobility Assistance", "Daily Activities"], schedule: "Sat/Sun, 10am–2pm, ongoing", postalCode: "77478", careFor: "My father", sentAt: "May 2" },
    meetingDetails: { type: "in_person", date: "Saturday, May 10", time: "10:00 AM" },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection accepted", timestamp: "May 3" },
      { id: "m2", from: "them", type: "text", text: "Hi! Thanks for reaching out. I'd love to learn more about the care needs for your family.", timestamp: "May 3, 9:00 AM" },
      { id: "m3", from: "me", type: "text", text: "Hi David! We need someone for my father on weekends. He had a stroke last year and needs help with mobility and daily activities.", timestamp: "May 3, 10:30 AM" },
      { id: "m4", from: "them", type: "text", text: "I have experience with stroke recovery patients. Could we do a meet and greet this Saturday morning?", timestamp: "May 3, 11:15 AM" },
      { id: "m5", from: "system", type: "system", text: "Meet & greet confirmed for Saturday, May 10 at 10:00 AM", timestamp: "May 3" },
      { id: "m6", from: "them", type: "text", text: "See you Saturday! I'll bring my ID and references.", timestamp: "Yesterday, 6:00 PM" },
    ],
  },
  {
    id: "conv-3",
    name: "Carlos R.",
    photo: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "University of Houston",
    universityAbbr: "uh",
    contextLine: "3rd Year, Pre-Med",
    verified: true,
    rate: 16,
    feedId: "4",
    badges: ["CPR/First Aid", "Background Checked"],
    status: "chatting",
    tab: "active",
    lastMessage: "That sounds great. What area are you located in?",
    lastMessageTime: "Mon",
    unread: 2,
    requestDetails: { careTypes: ["Companionship", "Light Housekeeping"], schedule: "Tue/Thu, 1pm–5pm, ongoing", postalCode: "77005", careFor: "My grandmother", sentAt: "May 3" },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection accepted", timestamp: "May 4" },
      { id: "m2", from: "me", type: "text", text: "Hi Carlos, I saw your profile and your experience with elder care looks perfect for our needs.", timestamp: "May 4, 2:00 PM" },
      { id: "m3", from: "them", type: "text", text: "Thank you! I really enjoy working with seniors. What kind of care are you looking for?", timestamp: "May 4, 2:45 PM" },
      { id: "m4", from: "me", type: "text", text: "Companion care for my grandmother, 2-3 afternoons a week. She's independent but gets lonely.", timestamp: "May 5, 9:00 AM" },
      { id: "m5", from: "them", type: "text", text: "That sounds great. What area are you located in?", timestamp: "Mon, 10:15 AM", read: false },
    ],
  },
  {
    id: "conv-4",
    name: "Priya M.",
    photo: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "Texas A&M University",
    universityAbbr: "tamu",
    contextLine: "Dementia Specialist",
    verified: true,
    rate: 22,
    feedId: "5",
    badges: ["Dementia Specialist", "Background Checked"],
    status: "visit_completed",
    tab: "active",
    lastMessage: "Thank you for the wonderful review! It was a pleasure caring for your aunt.",
    lastMessageTime: "Apr 25",
    unread: 0,
    requestDetails: { careTypes: ["Dementia Care", "Medication Reminders"], schedule: "One-time, Apr 24, 9am–1pm", postalCode: "77840", careFor: "My aunt", sentAt: "Apr 20" },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Visit completed: Apr 24, 9:00 AM – 1:00 PM", timestamp: "Apr 24" },
      { id: "m2", from: "system", type: "system", text: "Priya left a review", timestamp: "Apr 25" },
      { id: "m3", from: "them", type: "text", text: "Thank you for the wonderful review! It was a pleasure caring for your aunt.", timestamp: "Apr 25, 3:00 PM" },
    ],
  },
  {
    id: "conv-5",
    name: "Grace W.",
    photo: "https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "University of Houston",
    universityAbbr: "uh",
    contextLine: "1st Year, Nursing",
    verified: true,
    rate: 15,
    feedId: "6",
    badges: ["Companion Care", "Background Checked"],
    status: "request_sent",
    tab: "requests",
    lastMessage: "Connection request sent",
    lastMessageTime: "Today",
    unread: 0,
    requestDetails: { careTypes: ["Companionship", "Meal Prep"], schedule: "Tue/Thu, 9am–12pm, ongoing", postalCode: "77019", careFor: "My mother", sentAt: "Today" },
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection request sent", timestamp: "Today" },
      { id: "m2", from: "me", type: "text", text: "Hi Grace, I'd love to connect about care for my mother. She needs companion care on weekday mornings.", timestamp: "Today, 11:00 AM" },
    ],
  },
  {
    id: "conv-6",
    name: "Sophie T.",
    photo: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
    university: "University of Houston",
    universityAbbr: "uh",
    contextLine: "2nd Year, Social Work",
    verified: false,
    rate: 15,
    feedId: "8",
    badges: ["Background Checked"],
    status: "archived",
    tab: "archived",
    lastMessage: "No worries, good luck finding the right fit!",
    lastMessageTime: "Apr 10",
    unread: 0,
    messages: [
      { id: "m1", from: "system", type: "system", text: "Connection accepted", timestamp: "Apr 5" },
      { id: "m2", from: "me", type: "text", text: "Hi Sophie, thanks for connecting. Unfortunately we've found someone closer to our area.", timestamp: "Apr 10, 2:00 PM" },
      { id: "m3", from: "them", type: "text", text: "No worries, good luck finding the right fit!", timestamp: "Apr 10, 3:30 PM" },
    ],
  },
];

/* ─── Action bar helpers ─── */
function getActions(status: ConversationStatus, firstName: string) {
  switch (status) {
    case "request_sent": return [{ label: "Awaiting response", icon: "clock", disabled: true }];
    case "request_received": return [{ label: "Accept", icon: "check", disabled: false }, { label: "Decline", icon: "x", disabled: false }];
    case "chatting": return [{ label: "Schedule meet & greet", icon: "video", disabled: false }, { label: `Book ${firstName}`, icon: "calendar", disabled: false }];
    case "meet_greet_pending": return [{ label: `Waiting on ${firstName}`, icon: "clock", disabled: true }];
    case "meet_greet_scheduled": return [{ label: "Join meet & greet", icon: "video", disabled: false }, { label: "Reschedule", icon: "calendar", disabled: false }, { label: "Cancel meet & greet", icon: "x", disabled: false }];
    case "met_ready_to_book": return [{ label: `Book ${firstName}`, icon: "calendar", disabled: false }];
    case "booking_confirmed": return [{ label: "View visit details", icon: "briefcase", disabled: false }, { label: "Book another visit", icon: "calendar", disabled: false }, { label: "Cancel booking", icon: "x", disabled: false }];
    case "visit_in_progress": return [{ label: "Send a message", icon: "chat", disabled: false }];
    case "visit_completed": return [{ label: "Book another visit", icon: "calendar", disabled: false }, { label: "Leave a review", icon: "star", disabled: false }];
    default: return [];
  }
}

function ActionIcon({ icon }: { icon: string }) {
  const cls = "w-4 h-4";
  switch (icon) {
    case "calendar": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
    case "video": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;
    case "check": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
    case "x": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
    case "briefcase": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" /></svg>;
    case "eye": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
    case "star": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>;
    case "clock": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    case "chat": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>;
    default: return null;
  }
}

/* ─── Care type options ─── */
const CARE_TYPES = ["Companionship", "Meal Prep", "Dementia Care", "Mobility Assistance", "Daily Activities", "Medication Reminders", "Light Housekeeping", "Transportation", "Personal Care", "Respite Care"];

const DURATIONS = ["1 hour", "2 hours", "3 hours", "4 hours", "Half day (5 hrs)", "Full day (8 hrs)"];
const DURATION_HOURS: Record<string, number> = { "1 hour": 1, "2 hours": 2, "3 hours": 3, "4 hours": 4, "Half day (5 hrs)": 5, "Full day (8 hrs)": 8 };

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  if (h > 18) return null;
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m} ${period}`;
}).filter(Boolean) as string[];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WP_CONDITIONS = ["Early-stage dementia", "Mid-stage dementia", "Late-stage dementia", "Alzheimer's disease", "Post-stroke recovery", "Parkinson's disease", "Limited mobility", "Post-surgery recovery", "General aging", "Chronic illness", "Independent but needs companionship", "Other"];
const SCHEDULE_CATEGORIES = ["Medication", "Meal", "Activity", "Appointment", "Rest", "Personal care", "Other"];
const ScheduleIcon = ({ cat, className = "w-4 h-4" }: { cat: string; className?: string }) => {
  switch (cat) {
    case "Medication": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
    case "Meal": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m18-12-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0L3 4.5" /></svg>;
    case "Activity": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>;
    case "Appointment": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
    case "Rest": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>;
    case "Personal care": return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
    default: return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
  }
};
const WP_LANGUAGES = ["English", "Spanish", "Mandarin", "Cantonese", "Vietnamese", "Korean", "Tagalog", "Hindi", "Arabic", "French"];

/* ─── Book Visit Modal ─── */
function BookVisitModal({
  open, onClose, caregiverName, rate, caregiverPhoto, requestDetails, savedPackages, onConfirm, onSavePackage,
}: {
  open: boolean;
  onClose: () => void;
  caregiverName: string;
  rate: number;
  caregiverPhoto: string;
  requestDetails?: RequestDetails;
  savedPackages: CareRecipientProfile[];
  onConfirm: (booking: BookingDetails, wp: CareRecipientProfile) => void;
  onSavePackage: (wp: CareRecipientProfile) => void;
}) {
  const firstName = caregiverName.split(" ")[0];

  // Step 1: Visit details
  const [bookingStep, setBookingStep] = useState(1);
  const [frequency, setFrequency] = useState<"one-time" | "recurring">("one-time");
  const [bookDate, setBookDate] = useState("");
  const [bookDays, setBookDays] = useState<string[]>([]);
  const [bookStartTime, setBookStartTime] = useState("");
  const [bookEndTime, setBookEndTime] = useState("");
  const [recurringStart, setRecurringStart] = useState("");
  const [dpMonth, setDpMonth] = useState(new Date().getMonth());
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef<HTMLDivElement>(null);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [relationshipIsOther, setRelationshipIsOther] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [scheduleTimeOpenId, setScheduleTimeOpenId] = useState<string | null>(null);
  const relationshipRef = useRef<HTMLDivElement>(null);
  const conditionRef = useRef<HTMLDivElement>(null);
  const scheduleTimeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (startTimeRef.current && !startTimeRef.current.contains(e.target as Node)) setStartTimeOpen(false);
      if (endTimeRef.current && !endTimeRef.current.contains(e.target as Node)) setEndTimeOpen(false);
      if (relationshipRef.current && !relationshipRef.current.contains(e.target as Node)) setRelationshipOpen(false);
      if (conditionRef.current && !conditionRef.current.contains(e.target as Node)) setConditionOpen(false);
      if (scheduleTimeOpenId) {
        const ref = scheduleTimeRefs.current[scheduleTimeOpenId];
        if (ref && !ref.contains(e.target as Node)) setScheduleTimeOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Step 2: Welcome package
  const [wpMode, setWpMode] = useState<"select" | "create" | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [wpStep, setWpStep] = useState(1); // 1-6 sub-steps for creating
  const [wpDraft, setWpDraft] = useState<CareRecipientProfile>({ ...EMPTY_PROFILE, id: `wp-${Date.now()}`, careNeeds: requestDetails?.careTypes || [], zipCode: requestDetails?.postalCode || "" });

  // Step 3: Review
  const [confirmed, setConfirmed] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [savedCards] = useState([{ id: "visa-4242", label: "Visa ending in 4242", brand: "Visa", last4: "4242" }]);

  const totalSteps = 4;

  const parseTimeToMin = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };
  const startMin = bookStartTime ? parseTimeToMin(bookStartTime) : 0;
  const endMin = bookEndTime ? parseTimeToMin(bookEndTime) : 0;
  const durationHours = bookStartTime && bookEndTime && endMin > startMin ? (endMin - startMin) / 60 : 0;
  const costPerVisit = Math.round(durationHours * rate);
  const durationLabel = durationHours > 0 ? (durationHours % 1 === 0 ? `${durationHours} hr${durationHours > 1 ? "s" : ""}` : `${durationHours.toFixed(1)} hrs`) : "";

  // Generate valid end times (after start time, 30-min increments)
  const validEndTimes = bookStartTime ? TIME_SLOTS.filter((t) => parseTimeToMin(t) > startMin) : [];

  const selectedPackage = savedPackages.find((p) => p.id === selectedPackageId) || null;
  const wpToUse = wpMode === "select" ? selectedPackage : wpMode === "create" ? wpDraft : null;

  const canProceedStep1 = frequency === "one-time"
    ? !!bookDate && !!bookStartTime && !!bookEndTime
    : bookDays.length > 0 && !!bookStartTime && !!bookEndTime;
  const canProceedStep2 = wpToUse !== null && wpToUse.name.trim().length > 0;

  const handleReset = () => {
    setBookingStep(1);
    setFrequency("one-time");
    setBookDate("");
    setBookDays([]);
    setBookStartTime("");
    setBookEndTime("");
    setBookCareTypes(requestDetails?.careTypes || []);
    setRecurringStart("");
    setWpMode(null);
    setSelectedPackageId(null);
    setWpStep(1);
    setWpDraft({ ...EMPTY_PROFILE, id: `wp-${Date.now()}`, careNeeds: requestDetails?.careTypes || [], zipCode: requestDetails?.postalCode || "" });
    setConfirmed(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!wpToUse) return;
    const dateLabel = frequency === "one-time"
      ? new Date(bookDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : `every ${bookDays.join(", ")} starting ${recurringStart ? new Date(recurringStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "next week"}`;
    const booking: BookingDetails = {
      date: frequency === "one-time" ? bookDate : dateLabel,
      startTime: bookStartTime,
      duration: durationLabel,
      recurring: frequency === "recurring",
      recurringPattern: frequency === "recurring" ? `Every ${bookDays.join(", ")}` : undefined,
      careTypes: requestDetails?.careTypes || [],
      welcomePackageId: wpToUse.id,
      totalCost: costPerVisit,
    };
    if (wpMode === "create") {
      onSavePackage(wpDraft);
    }
    onConfirm(booking, wpToUse);
    setConfirmed(true);
  };

  if (!open) return null;

  // Date picker helper
  const renderDatePicker = (selectedDate: string, onSelect: (d: string) => void) => {
    const daysInMonth = new Date(dpYear, dpMonth + 1, 0).getDate();
    const firstDay = new Date(dpYear, dpMonth, 1).getDay();
    const monthName = new Date(dpYear, dpMonth).toLocaleString("default", { month: "long" });
    const today = new Date();
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-primary-600 px-3 py-2 flex items-center justify-between">
          <button onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear(dpYear - 1); } else setDpMonth(dpMonth - 1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary-500 transition-colors">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>
          <span className="text-text-sm font-bold text-white">{monthName} {dpYear}</span>
          <button onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear(dpYear + 1); } else setDpMonth(dpMonth + 1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary-500 transition-colors">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-0.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${dpYear}-${String(dpMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = selectedDate === dateStr;
              const isToday = d === today.getDate() && dpMonth === today.getMonth() && dpYear === today.getFullYear();
              const isPast = new Date(dpYear, dpMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button key={d} disabled={isPast} onClick={() => onSelect(dateStr)} className={`text-center rounded-md py-1.5 text-text-xs font-medium transition-all ${isSelected ? "bg-primary-600 text-white shadow-sm" : isPast ? "text-gray-300 cursor-not-allowed" : isToday ? "bg-primary-100 text-primary-700 hover:bg-primary-200 cursor-pointer font-semibold" : "text-gray-700 hover:bg-primary-50 cursor-pointer"}`}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onPointerDown={onClose} />
      <div onClick={(e) => e.stopPropagation()} className="relative z-10 bg-gradient-to-b from-primary-25 to-white rounded-2xl shadow-2xl w-[720px] border border-primary-100 max-h-[90vh] flex flex-col animate-fadeIn">

        {confirmed ? (
          /* ── Success screen ── */
          <div className="px-8 py-14 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success-100 to-success-50 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-success-100/50">
              <svg className="w-10 h-10 text-success-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </div>
            <h3 className="text-display-sm font-bold text-gray-900 mb-2">Visit booked!</h3>
            <p className="text-text-md text-gray-500 mb-1">Your welcome package has been shared with {firstName}.</p>
            <p className="text-text-sm text-gray-400 mb-8">{firstName} will be notified and can review your care details.</p>
            <button onClick={() => { onClose(); setTimeout(() => setConfirmed(false), 300); }} className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-text-sm">
              Back to conversation
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-display-xs font-semibold text-gray-900">Book a visit with {caregiverName}</h3>
                <p className="text-text-sm text-gray-400 mt-0.5">Step {bookingStep} of {totalSteps}</p>
              </div>
              <button type="button" onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="relative z-50 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Progress */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(bookingStep / totalSteps) * 100}%` }} />
            </div>

            <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">

              {/* ══════ STEP 1: Visit Details ══════ */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-text-xl font-semibold text-gray-900 mb-1">Visit details</h4>
                    <p className="text-text-md text-gray-400">Set up the schedule for your visit with {firstName}</p>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="text-text-sm font-semibold text-gray-700 mb-2 block">How often?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["one-time", "recurring"] as const).map((f) => (
                        <button key={f} onClick={() => setFrequency(f)} className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-text-md font-medium transition-all ${frequency === f ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            {f === "one-time" ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                            )}
                          </svg>
                          {f === "one-time" ? "One-time visit" : "Recurring weekly"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  {frequency === "one-time" ? (
                    <div>
                      <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Date</label>
                      {renderDatePicker(bookDate, setBookDate)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Which days?</label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => {
                            const active = bookDays.includes(day);
                            return (
                              <button key={day} onClick={() => setBookDays((p) => active ? p.filter((d) => d !== day) : [...p, day])} className={`px-4 py-2 rounded-xl text-text-sm font-medium border-2 transition-all ${active ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Starting from</label>
                        {renderDatePicker(recurringStart, setRecurringStart)}
                      </div>
                    </div>
                  )}

                  {/* Time + Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative" ref={startTimeRef}>
                      <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Start time</label>
                      <button
                        onClick={() => { setStartTimeOpen(!startTimeOpen); setEndTimeOpen(false); }}
                        className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 text-text-md font-medium transition-all ${
                          startTimeOpen ? "border-primary-400 ring-1 ring-primary-200 bg-white text-gray-800" : "border-primary-200 bg-white text-gray-800 hover:border-primary-300"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                          {bookStartTime || <span className="text-primary-300">Select...</span>}
                        </span>
                        <svg className={`w-3.5 h-3.5 text-primary-400 transition-transform ${startTimeOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      {startTimeOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-primary-100 shadow-xl z-50 max-h-56 overflow-y-auto">
                          {TIME_SLOTS.map((t) => (
                            <button key={t} onClick={() => { setBookStartTime(t); setBookEndTime(""); setStartTimeOpen(false); }} className={`w-full text-left px-3.5 py-2.5 text-text-sm transition-colors ${bookStartTime === t ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative" ref={endTimeRef}>
                      <label className="text-text-sm font-semibold text-gray-700 mb-2 block">End time</label>
                      <button
                        onClick={() => { if (bookStartTime) { setEndTimeOpen(!endTimeOpen); setStartTimeOpen(false); } }}
                        disabled={!bookStartTime}
                        className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 text-text-md font-medium transition-all ${
                          !bookStartTime ? "border-gray-100 bg-gray-50 text-gray-300 cursor-default"
                          : endTimeOpen ? "border-primary-400 ring-1 ring-primary-200 bg-white text-gray-800" : "border-primary-200 bg-white text-gray-800 hover:border-primary-300"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                          {bookEndTime || <span className="text-primary-300">Select...</span>}
                        </span>
                        <svg className={`w-3.5 h-3.5 text-primary-400 transition-transform ${endTimeOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      {endTimeOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-primary-100 shadow-xl z-50 max-h-56 overflow-y-auto">
                          {validEndTimes.map((t) => (
                            <button key={t} onClick={() => { setBookEndTime(t); setEndTimeOpen(false); }} className={`w-full text-left px-3.5 py-2.5 text-text-sm transition-colors ${bookEndTime === t ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {durationLabel && (
                    <div className="flex items-center gap-2 -mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-text-sm font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        {durationLabel}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-warm-50 text-warm-700 text-text-sm font-medium">
                        Est. ${costPerVisit}/visit
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ══════ STEP 2: Welcome Package ══════ */}
              {bookingStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-text-xl font-semibold text-gray-900 mb-1">Welcome package</h4>
                    <p className="text-text-md text-gray-400">Share details about your loved one and your home so {firstName} can prepare</p>
                  </div>

                  {!wpMode && (
                    <div className="space-y-3">
                      {savedPackages.length > 0 && (
                        <button onClick={() => setWpMode("select")} className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-all text-left group">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg>
                          </div>
                          <div>
                            <p className="text-text-md font-semibold text-gray-900">Use an existing welcome package</p>
                            <p className="text-text-sm text-gray-500">{savedPackages.length} saved {savedPackages.length === 1 ? "package" : "packages"}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                      )}
                      <button onClick={() => { setWpMode("create"); setWpStep(1); }} className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-all text-left group">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </div>
                        <div>
                          <p className="text-text-md font-semibold text-gray-900">Create a new welcome package</p>
                          <p className="text-text-sm text-gray-500">A few quick steps about your loved one and your home</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}

                  {/* Select existing */}
                  {wpMode === "select" && (
                    <div className="space-y-3">
                      <button onClick={() => setWpMode(null)} className="text-text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                        Back
                      </button>
                      {savedPackages.map((pkg) => (
                        <button key={pkg.id} onClick={() => setSelectedPackageId(pkg.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedPackageId === pkg.id ? "border-primary-500 bg-primary-25" : "border-gray-200 hover:border-gray-300"}`}>
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-text-md font-bold text-primary-700">{pkg.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-text-sm font-semibold text-gray-900">{pkg.name}</p>
                            <p className="text-text-xs text-gray-500">{pkg.relationship}{pkg.age ? `, ${pkg.age}` : ""}{pkg.condition ? ` · ${pkg.condition}` : ""}</p>
                          </div>
                          {selectedPackageId === pkg.id && (
                            <svg className="w-5 h-5 text-primary-600 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Create new — 5 sub-steps */}
                  {wpMode === "create" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button onClick={() => { if (wpStep > 1) setWpStep(wpStep - 1); else setWpMode(null); }} className="text-text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                          Back
                        </button>
                        <span className="text-[11px] text-gray-400 font-medium">Step {wpStep} of 6</span>
                      </div>

                      {/* WP Step 1: Who */}
                      {wpStep === 1 && (
                        <div className="space-y-4">
                          <h5 className="text-text-lg font-semibold text-gray-900">Who is the care for?</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Name *</label>
                              <input type="text" value={wpDraft.name} onChange={(e) => setWpDraft((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Dorothy" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Age</label>
                              <input type="text" value={wpDraft.age} onChange={(e) => setWpDraft((p) => ({ ...p, age: e.target.value }))} placeholder="e.g. 78" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                          </div>
                          <div className="relative" ref={relationshipRef}>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Relationship *</label>
                            <button
                              onClick={() => { setRelationshipOpen(!relationshipOpen); setConditionOpen(false); }}
                              className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-text-sm font-medium transition-all ${
                                relationshipOpen ? "border-primary-400 ring-1 ring-primary-200 bg-white text-gray-800" : "border-primary-200 bg-white text-gray-800 hover:border-primary-300"
                              }`}
                            >
                              <span>{wpDraft.relationship || <span className="text-primary-300">Select...</span>}</span>
                              <svg className={`w-3.5 h-3.5 text-primary-400 transition-transform ${relationshipOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                            </button>
                            {relationshipOpen && (
                              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-primary-100 shadow-xl z-50 max-h-56 overflow-y-auto">
                                {["Mother", "Father", "Grandmother", "Grandfather", "Spouse", "Aunt", "Uncle", "Other"].map((r) => (
                                  <button key={r} onClick={() => {
                                    if (r === "Other") { setRelationshipIsOther(true); setWpDraft((p) => ({ ...p, relationship: "" })); }
                                    else { setRelationshipIsOther(false); setWpDraft((p) => ({ ...p, relationship: r })); }
                                    setRelationshipOpen(false);
                                  }} className={`w-full text-left px-3.5 py-2.5 text-text-sm transition-colors ${wpDraft.relationship === r ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                                    {r}
                                  </button>
                                ))}
                              </div>
                            )}
                            {relationshipIsOther && (
                              <input autoFocus type="text" value={wpDraft.relationship} onChange={(e) => setWpDraft((p) => ({ ...p, relationship: e.target.value }))} placeholder="e.g. Neighbor, Friend..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 mt-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            )}
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Photo (optional)</label>
                            <div className="border border-dashed border-gray-200 rounded-lg px-3 py-3 flex items-center gap-2 hover:border-primary-300 transition-colors cursor-pointer">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                              <span className="text-text-xs text-gray-400">Upload a photo</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WP Step 2: Daily Life */}
                      {wpStep === 2 && (
                        <div className="space-y-4">
                          <h5 className="text-text-lg font-semibold text-gray-900">Daily life &amp; personality</h5>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Short bio</label>
                            <textarea value={wpDraft.bio} onChange={(e) => setWpDraft((p) => ({ ...p, bio: e.target.value }))} placeholder="A few sentences about your loved one..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 resize-none" />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Hobbies &amp; interests</label>
                            <input type="text" placeholder="Type and press Enter" onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (!val) return; setWpDraft((p) => ({ ...p, hobbies: p.hobbies ? `${p.hobbies}, ${val}` : val })); (e.target as HTMLInputElement).value = ""; }
                            }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            {wpDraft.hobbies && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {wpDraft.hobbies.split(", ").filter(Boolean).map((h) => (
                                  <span key={h} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                    {h}
                                    <button onClick={() => setWpDraft((p) => ({ ...p, hobbies: p.hobbies.split(", ").filter((x) => x !== h).join(", ") }))} className="hover:text-primary-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Languages spoken</label>
                            <div className="flex flex-wrap gap-1.5">
                              {WP_LANGUAGES.map((lang) => {
                                const active = wpDraft.languages.includes(lang);
                                return (
                                  <button key={lang} type="button" onClick={() => setWpDraft((p) => ({ ...p, languages: active ? p.languages.filter((l) => l !== lang) : [...p.languages, lang] }))} className={`px-2.5 py-1 rounded-lg text-text-xs font-medium border transition-colors ${active ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-500 border-gray-200 hover:border-primary-300"}`}>
                                    {active ? "✓ " : "+ "}{lang}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WP Step 3: Health */}
                      {wpStep === 3 && (
                        <div className="space-y-4">
                          <h5 className="text-text-lg font-semibold text-gray-900">Health &amp; care needs</h5>
                          <div className="relative" ref={conditionRef}>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Conditions</label>
                            <button
                              onClick={() => { setConditionOpen(!conditionOpen); setRelationshipOpen(false); }}
                              className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-text-sm font-medium transition-all ${
                                conditionOpen ? "border-primary-400 ring-1 ring-primary-200 bg-white text-gray-800" : "border-primary-200 bg-white text-gray-800 hover:border-primary-300"
                              }`}
                            >
                              <span>{wpDraft.condition ? `${wpDraft.condition.split(", ").length} selected` : <span className="text-primary-300">Select conditions...</span>}</span>
                              <svg className={`w-3.5 h-3.5 text-primary-400 transition-transform ${conditionOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                            </button>
                            {conditionOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-primary-100 shadow-xl z-50 max-h-56 overflow-y-auto">
                                {WP_CONDITIONS.map((c) => {
                                  const selected = wpDraft.condition.split(", ").filter(Boolean).includes(c);
                                  return (
                                    <button key={c} onClick={() => {
                                      setWpDraft((p) => {
                                        const current = p.condition.split(", ").filter(Boolean);
                                        const updated = selected ? current.filter((x) => x !== c) : [...current, c];
                                        return { ...p, condition: updated.join(", ") };
                                      });
                                    }} className={`w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-text-sm transition-colors ${selected ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                                      {selected && <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                                      <span>{c}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {wpDraft.condition && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {wpDraft.condition.split(", ").filter(Boolean).map((c) => (
                                  <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                    {c}
                                    <button onClick={() => setWpDraft((p) => ({ ...p, condition: p.condition.split(", ").filter((x) => x !== c).join(", ") }))} className="hover:text-primary-900">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            {wpDraft.condition.split(", ").includes("Other") && (
                              <input type="text" value={wpDraft.conditionOther} onChange={(e) => setWpDraft((p) => ({ ...p, conditionOther: e.target.value }))} placeholder="Describe other condition..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 mt-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            )}
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Care needs</label>
                            <div className="flex flex-wrap gap-1.5">
                              {CARE_TYPES.map((t) => {
                                const active = wpDraft.careNeeds.includes(t);
                                return (
                                  <button key={t} type="button" onClick={() => setWpDraft((p) => ({ ...p, careNeeds: active ? p.careNeeds.filter((c) => c !== t) : [...p.careNeeds, t] }))} className={`px-2.5 py-1 rounded-lg text-text-xs font-medium border transition-colors ${active ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-500 border-gray-200 hover:border-primary-300"}`}>
                                    {active ? "✓ " : "+ "}{t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Medications</label>
                            <input type="text" placeholder="Type a medication and press Enter" onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (!val) return;
                                setWpDraft((p) => ({ ...p, medications: p.medications ? `${p.medications}, ${val}` : val }));
                                (e.target as HTMLInputElement).value = "";
                              }
                            }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            {wpDraft.medications && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {wpDraft.medications.split(", ").filter(Boolean).map((m) => (
                                  <span key={m} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                    {m}
                                    <button onClick={() => setWpDraft((p) => ({ ...p, medications: p.medications.split(", ").filter((x) => x !== m).join(", ") }))} className="hover:text-primary-900">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Allergies</label>
                              <input type="text" placeholder="Type and press Enter" onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (!val) return; setWpDraft((p) => ({ ...p, allergies: p.allergies ? `${p.allergies}, ${val}` : val })); (e.target as HTMLInputElement).value = ""; }
                              }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                              {wpDraft.allergies && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {wpDraft.allergies.split(", ").filter(Boolean).map((a) => (
                                    <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                      {a}
                                      <button onClick={() => setWpDraft((p) => ({ ...p, allergies: p.allergies.split(", ").filter((x) => x !== a).join(", ") }))} className="hover:text-primary-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Mobility</label>
                              <input type="text" placeholder="Type and press Enter" onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (!val) return; setWpDraft((p) => ({ ...p, mobility: p.mobility ? `${p.mobility}, ${val}` : val })); (e.target as HTMLInputElement).value = ""; }
                              }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                              {wpDraft.mobility && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {wpDraft.mobility.split(", ").filter(Boolean).map((m) => (
                                    <span key={m} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                      {m}
                                      <button onClick={() => setWpDraft((p) => ({ ...p, mobility: p.mobility.split(", ").filter((x) => x !== m).join(", ") }))} className="hover:text-primary-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Dietary needs</label>
                            <input type="text" placeholder="Type and press Enter" onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (!val) return; setWpDraft((p) => ({ ...p, dietary: p.dietary ? `${p.dietary}, ${val}` : val })); (e.target as HTMLInputElement).value = ""; }
                            }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            {wpDraft.dietary && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {wpDraft.dietary.split(", ").filter(Boolean).map((d) => (
                                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">
                                    {d}
                                    <button onClick={() => setWpDraft((p) => ({ ...p, dietary: p.dietary.split(", ").filter((x) => x !== d).join(", ") }))} className="hover:text-primary-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* WP Step 4: Daily Routine & Schedule */}
                      {wpStep === 4 && (() => {
                        // Generate time slots matching the booked start/end time at 30-min intervals
                        const visitSlots: string[] = [];
                        if (bookStartTime && bookEndTime) {
                          const sMin = parseTimeToMin(bookStartTime);
                          const eMin = parseTimeToMin(bookEndTime);
                          for (let m = sMin; m < eMin; m += 30) {
                            const h = Math.floor(m / 60);
                            const mn = m % 60;
                            const ampm = h >= 12 ? "PM" : "AM";
                            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            visitSlots.push(`${h12}:${mn.toString().padStart(2, "0")} ${ampm}`);
                          }
                        }
                        // Ensure each slot has an entry in schedule
                        const existingTimes = wpDraft.schedule.map((s) => s.time);
                        const missingSlots = visitSlots.filter((t) => !existingTimes.includes(t));
                        if (missingSlots.length > 0) {
                          const newEntries = missingSlots.map((t) => ({ id: `se-${Date.now()}-${t.replace(/[\s:]/g, "")}`, time: t, activity: "", category: "", notes: "" }));
                          setTimeout(() => setWpDraft((p) => {
                            const eTimes = p.schedule.map((s) => s.time);
                            const toAdd = newEntries.filter((e) => !eTimes.includes(e.time));
                            if (toAdd.length === 0) return p;
                            return { ...p, schedule: [...p.schedule, ...toAdd] };
                          }), 0);
                        }
                        const sortedSchedule = [...wpDraft.schedule]
                          .filter((s) => visitSlots.includes(s.time))
                          .sort((a, b) => parseTimeToMin(a.time) - parseTimeToMin(b.time));
                        return (
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-text-lg font-semibold text-gray-900">Daily routine &amp; schedule</h5>
                            <p className="text-text-xs text-gray-400 mt-0.5">Walk {firstName} through a typical visit ({bookStartTime} – {bookEndTime})</p>
                          </div>

                          {/* Timeline */}
                          <div className="space-y-0">
                            {sortedSchedule.map((entry, idx) => {
                              const hasContent = !!entry.category || !!entry.activity;
                              return (
                              <div key={entry.id} className="flex gap-3 items-start">
                                {/* Time label + line */}
                                <div className="flex flex-col items-center w-[76px] flex-shrink-0">
                                  <span className={`text-text-xs font-semibold px-2.5 py-1 rounded-md ${hasContent ? "text-primary-700 bg-primary-50" : "text-gray-400 bg-gray-50"}`}>{entry.time}</span>
                                  {idx < sortedSchedule.length - 1 && (
                                    <div className={`w-px flex-1 min-h-[48px] ${hasContent ? "bg-primary-200" : "bg-gray-100"}`} />
                                  )}
                                </div>
                                {/* Category chips + description */}
                                <div className="flex-1 pb-3">
                                  {/* Category chips row */}
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {SCHEDULE_CATEGORIES.map((cat) => {
                                      const isActive = entry.category === cat;
                                      return (
                                        <button key={cat} onClick={() => setWpDraft((p) => ({ ...p, schedule: p.schedule.map((s) => s.id === entry.id ? { ...s, category: isActive ? "" : cat } : s) }))}
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                                            isActive ? "bg-primary-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                          }`}
                                        >
                                          <ScheduleIcon cat={cat} className="w-3 h-3" />
                                          {cat}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {/* Description input — always visible */}
                                  <input
                                    type="text"
                                    value={entry.activity}
                                    onChange={(e) => setWpDraft((p) => ({ ...p, schedule: p.schedule.map((s) => s.id === entry.id ? { ...s, activity: e.target.value } : s) }))}
                                    placeholder={entry.category ? `e.g. ${entry.category === "Medication" ? "2 Advils with water" : entry.category === "Meal" ? "Lunch — soup and sandwich" : entry.category === "Activity" ? "Take him on a walk around the block" : entry.category === "Rest" ? "Nap time, keep it quiet" : "Describe..."}` : `What happens at ${entry.time}?`}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                                  />
                                </div>
                              </div>
                              );
                            })}
                          </div>

                          <p className="text-text-xs text-gray-400 text-center">Fill in as many or as few time slots as you&apos;d like. Empty slots will be left flexible for {firstName}.</p>
                        </div>
                        );
                      })()}

                      {/* WP Step 5: Home */}
                      {wpStep === 5 && (
                        <div className="space-y-4">
                          <h5 className="text-text-lg font-semibold text-gray-900">Home &amp; access</h5>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Address</label>
                            <input type="text" value={wpDraft.address} onChange={(e) => setWpDraft((p) => ({ ...p, address: e.target.value }))} placeholder="Street address" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Entry instructions</label>
                            <input type="text" value={wpDraft.entryInstructions} onChange={(e) => setWpDraft((p) => ({ ...p, entryInstructions: e.target.value }))} placeholder="e.g. Ring doorbell, use side gate" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Parking</label>
                              <input type="text" value={wpDraft.parking} onChange={(e) => setWpDraft((p) => ({ ...p, parking: e.target.value }))} placeholder="e.g. Driveway, street" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Pets</label>
                              <input type="text" value={wpDraft.pets} onChange={(e) => setWpDraft((p) => ({ ...p, pets: e.target.value }))} placeholder="e.g. Friendly dog (Max)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Zip code</label>
                            <input type="text" value={wpDraft.zipCode} onChange={(e) => setWpDraft((p) => ({ ...p, zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))} placeholder="e.g. 77019" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" inputMode="numeric" />
                          </div>
                        </div>
                      )}

                      {/* WP Step 6: Emergency */}
                      {wpStep === 6 && (
                        <div className="space-y-4">
                          <h5 className="text-text-lg font-semibold text-gray-900">Emergency contacts &amp; notes</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Emergency contact name</label>
                              <input type="text" value={wpDraft.emergencyName} onChange={(e) => setWpDraft((p) => ({ ...p, emergencyName: e.target.value }))} placeholder="Name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Emergency phone</label>
                              <input type="tel" value={wpDraft.emergencyPhone} onChange={(e) => setWpDraft((p) => ({ ...p, emergencyPhone: e.target.value }))} placeholder="(555) 123-4567" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">House rules or special notes</label>
                            <textarea value={wpDraft.houseRules} onChange={(e) => setWpDraft((p) => ({ ...p, houseRules: e.target.value }))} placeholder="e.g. No shoes inside, TV remote on coffee table" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 resize-none" />
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* ══════ STEP 3: Review ══════ */}
              {bookingStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-text-xl font-semibold text-gray-900 mb-1">Review your booking</h4>
                    <p className="text-text-md text-gray-400">Double-check everything before continuing</p>
                  </div>

                  {/* Visit summary */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-text-sm font-semibold text-gray-800">Visit details</span>
                      <button onClick={() => setBookingStep(1)} className="text-text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                    </div>
                    <div className="px-5 py-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                        <span className="text-text-sm text-gray-700">
                          {frequency === "one-time"
                            ? bookDate ? new Date(bookDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "—"
                            : `Every ${bookDays.join(", ")}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="text-text-sm text-gray-700">{bookStartTime} – {bookEndTime}{durationLabel ? ` (${durationLabel})` : ""}</span>
                      </div>
                      {frequency === "recurring" && bookDays.length > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" /></svg>
                          <span className="text-text-sm text-gray-700">Every {bookDays.join(", ")}{recurringStart ? `, starting ${new Date(recurringStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Welcome package summary */}
                  {wpToUse && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-text-sm font-semibold text-gray-800">Welcome package</span>
                        <button onClick={() => setBookingStep(2)} className="text-text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                      </div>
                      <div className="px-5 py-4 space-y-4">
                        {/* Recipient */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-text-md font-bold text-primary-700">{wpToUse.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-text-sm font-semibold text-gray-900">{wpToUse.name}</p>
                            <p className="text-text-xs text-gray-500">{wpToUse.relationship}{wpToUse.age ? `, ${wpToUse.age}` : ""}</p>
                          </div>
                        </div>

                        {/* Conditions */}
                        {wpToUse.condition && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Conditions</p>
                            <div className="flex flex-wrap gap-1.5">
                              {wpToUse.condition.split(", ").filter(Boolean).map((c) => (
                                <span key={c} className="px-2.5 py-1 rounded-full bg-warm-50 text-warm-700 text-text-xs font-medium">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Care needs */}
                        {wpToUse.careNeeds.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Care needs</p>
                            <div className="flex flex-wrap gap-1.5">
                              {wpToUse.careNeeds.map((n) => (
                                <span key={n} className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-text-xs font-medium">{n}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medications */}
                        {wpToUse.medications && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Medications</p>
                            <div className="flex flex-wrap gap-1.5">
                              {wpToUse.medications.split(", ").filter(Boolean).map((m) => (
                                <span key={m} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-text-xs font-medium">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schedule preview */}
                        {wpToUse.schedule.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Daily routine ({wpToUse.schedule.length} {wpToUse.schedule.length === 1 ? "entry" : "entries"})</p>
                            <div className="space-y-1.5">
                              {[...wpToUse.schedule].sort((a, b) => {
                                const toMin = (t: string) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = parseInt(m[1]); const mn = parseInt(m[2]); if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h * 60 + mn; };
                                return toMin(a.time) - toMin(b.time);
                              }).map((entry) => (
                                <div key={entry.id} className="flex items-center gap-2 text-text-xs">
                                  <span className="text-gray-400 font-medium w-[70px] flex-shrink-0">{entry.time}</span>
                                  <ScheduleIcon cat={entry.category} className="w-3.5 h-3.5 text-primary-500" />
                                  <span className="text-gray-700">{entry.activity || entry.category}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Home & access */}
                        {(wpToUse.address || wpToUse.entryInstructions || wpToUse.parking || wpToUse.pets) && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Home &amp; access</p>
                            <div className="text-text-xs text-gray-600 space-y-0.5">
                              {wpToUse.address && <p>{wpToUse.address}</p>}
                              {wpToUse.entryInstructions && <p className="text-gray-500">{wpToUse.entryInstructions}</p>}
                              {wpToUse.parking && <p className="text-gray-500">Parking: {wpToUse.parking}</p>}
                              {wpToUse.pets && <p className="text-gray-500">Pets: {wpToUse.pets}</p>}
                            </div>
                          </div>
                        )}

                        {/* Emergency */}
                        {wpToUse.emergencyName && (
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Emergency contact</p>
                            <p className="text-text-xs text-gray-700">{wpToUse.emergencyName}{wpToUse.emergencyPhone ? ` · ${wpToUse.emergencyPhone}` : ""}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════ STEP 4: Bill & Payment ══════ */}
              {bookingStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-text-xl font-semibold text-gray-900 mb-1">Bill &amp; payment</h4>
                    <p className="text-text-md text-gray-400">Review your cost breakdown</p>
                  </div>

                  {/* Cost breakdown */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-text-sm font-semibold text-gray-800">Cost breakdown</span>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between text-text-sm">
                        <span className="text-gray-600">Hourly rate</span>
                        <span className="font-medium text-gray-900">${rate}/hr</span>
                      </div>
                      <div className="flex items-center justify-between text-text-sm">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium text-gray-900">{durationLabel}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-text-sm">
                        <span className="font-semibold text-gray-800">Per visit</span>
                        <span className="font-bold text-gray-900 text-text-md">${costPerVisit}</span>
                      </div>
                      <div className="flex items-center justify-between text-text-sm">
                        <span className="text-gray-600">Olera service fee</span>
                        <span className="font-medium text-gray-900">$5.99</span>
                      </div>
                      {frequency === "recurring" && bookDays.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-text-sm">
                            <span className="text-gray-600">Weekly ({bookDays.length}x/week)</span>
                            <span className="font-semibold text-gray-900">${(costPerVisit + 5.99) * bookDays.length}/week</span>
                          </div>
                          <div className="flex items-center justify-between text-text-sm">
                            <span className="text-gray-600">Monthly estimate</span>
                            <span className="font-bold text-gray-900 text-text-md">~${Math.round((costPerVisit + 5.99) * bookDays.length * 4.33)}/mo</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="rounded-xl bg-primary-50 border border-primary-100 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-md font-semibold text-primary-900">Total due per visit</span>
                      <span className="text-display-xs font-bold text-primary-900">${(costPerVisit + 5.99).toFixed(2)}</span>
                    </div>
                    {frequency === "recurring" && bookDays.length > 0 && (
                      <p className="text-text-xs text-primary-600 mt-1">Billed after each visit · ~${Math.round((costPerVisit + 5.99) * bookDays.length * 4.33)}/month</p>
                    )}
                  </div>

                  {/* Pending notice */}
                  <div className="rounded-xl bg-warning-50 border border-warning-200 px-5 py-3 flex items-center gap-3">
                    <svg className="w-5 h-5 text-warning-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    <p className="text-text-sm text-warning-800">Your card will show a <span className="font-semibold">pending</span> charge. You won&apos;t be billed until after the visit is completed.</p>
                  </div>

                  {/* Payment method */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-text-sm font-semibold text-gray-800">Payment method</span>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {/* Saved cards */}
                      {savedCards.map((card) => (
                        <button key={card.id} onClick={() => { setSelectedPayment(card.id); setShowAddCard(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${selectedPayment === card.id ? "border-primary-500 bg-primary-25" : "border-gray-200 hover:border-gray-300"}`}>
                          <div className="w-10 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-text-sm font-medium text-gray-800">{card.brand} ending in {card.last4}</p>
                            <p className="text-text-xs text-gray-400">Card on file</p>
                          </div>
                          {selectedPayment === card.id && (
                            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                          )}
                        </button>
                      ))}

                      {/* Add new card */}
                      {!showAddCard ? (
                        <button onClick={() => { setShowAddCard(true); setSelectedPayment(null); }} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 transition-all text-left">
                          <div className="w-10 h-7 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          </div>
                          <div>
                            <p className="text-text-sm font-medium text-gray-700">Add a new card</p>
                            <p className="text-text-xs text-gray-400">Credit or debit card</p>
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-xl border-2 border-primary-200 bg-primary-25 p-4 space-y-3">
                          <p className="text-text-sm font-semibold text-gray-800">Add a new card</p>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium mb-1 block">Card number</label>
                            <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))} placeholder="1234 5678 9012 3456" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">Expiry</label>
                              <input type="text" value={cardExpiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setCardExpiry(v); }} placeholder="MM/YY" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium mb-1 block">CVC</label>
                              <input type="text" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedPayment("new-card"); setShowAddCard(false); }} disabled={cardNumber.replace(/\s/g, "").length < 16 || cardExpiry.length < 5 || cardCvc.length < 3} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                              Save card
                            </button>
                            <button onClick={() => setShowAddCard(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms note */}
                  <p className="text-text-xs text-gray-400 text-center leading-relaxed">By booking, you agree to Olera&apos;s Terms of Service.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 pt-4 flex items-center gap-3 border-t border-gray-100">
              {bookingStep > 1 && (
                <button onClick={() => setBookingStep(bookingStep - 1)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (bookingStep === 2 && wpMode === "create" && wpStep < 6) {
                    setWpStep(wpStep + 1);
                    return;
                  }
                  if (bookingStep < 4) {
                    setBookingStep(bookingStep + 1);
                  } else {
                    handleConfirm();
                  }
                }}
                disabled={bookingStep === 1 ? !canProceedStep1 : bookingStep === 2 ? !canProceedStep2 : false}
                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-text-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bookingStep === 4 ? `Book visit and share welcome package with ${firstName}` : bookingStep === 2 && wpMode === "create" && wpStep < 6 ? "Next" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main inbox ─── */
function InboxContent() {
  const params = useSearchParams();
  const newCaregiver = params.get("caregiver");
  const noteParam = params.get("note");

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (newCaregiver) {
      const exists = MOCK_CONVERSATIONS.some((c) => c.name === newCaregiver && c.tab === "requests");
      if (!exists) {
        const newConv: Conversation = {
          id: `conv-new-${Date.now()}`,
          name: newCaregiver,
          photo: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
          university: "University of Houston",
          universityAbbr: "uh",
          contextLine: "3rd Year, Pre-Med",
          verified: true,
          rate: 20,
          feedId: "1",
          badges: ["Dementia Specialist", "Background Checked"],
          status: "chatting",
          tab: "active",
          lastMessage: "That would be great! I'd love to meet you and your family. I'm flexible with times — just let me know what works best for you.",
          lastMessageTime: "Just now",
          unread: 1,
          requestDetails: { careTypes: ["Companionship", "Meal Prep"], schedule: "Tue/Thu, 9am–12pm, ongoing", postalCode: "77019", careFor: "My mother", sentAt: "Today" },
          messages: [
            { id: "m1", from: "system", type: "system", text: "Connection request sent", timestamp: "Today, 11:00 AM" },
            { id: "m2", from: "me", type: "text", text: noteParam || `Hi ${newCaregiver.split(" ")[0]}, I'd love to connect about care for my family member. Looking forward to hearing from you!`, timestamp: "Today, 11:00 AM" },
            { id: "m3", from: "system", type: "system", text: "Connection accepted", timestamp: "Today, 11:45 AM" },
            { id: "m4", from: "them", type: "text", text: "That would be great! I'd love to meet you and your family. I'm flexible with times — just let me know what works best for you.", timestamp: "Just now", read: false },
          ],
        };
        return [newConv, ...MOCK_CONVERSATIONS];
      }
    }
    return MOCK_CONVERSATIONS;
  });

  const [activeTab, setActiveTab] = useState<"active" | "requests" | "archived">("active");
  const [selectedId, setSelectedId] = useState<string | null>(
    newCaregiver
      ? conversations.find((c) => c.name === newCaregiver)?.id ?? conversations[0]?.id ?? null
      : conversations.find((c) => c.tab === "active")?.id ?? null
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const [showCallTip, setShowCallTip] = useState(false);
  const [callStep, setCallStep] = useState<"type" | "pick">("type");
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [callDate, setCallDate] = useState<Date | null>(null);
  const [callTime, setCallTime] = useState("");
  const [meetNote, setMeetNote] = useState("");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(false);
  const [editFields, setEditFields] = useState({ schedule: "", postalCode: "", careFor: "", careTypes: [] as string[] });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [savedWelcomePackages, setSavedWelcomePackages] = useState<CareRecipientProfile[]>([
    { id: "wp-dad", name: "Dad", age: "78", relationship: "Father", photo: "", bio: "Retired engineer, loves crossword puzzles and jazz music.", condition: "Mild cognitive decline", conditionOther: "", languages: ["English"], languagesOther: "", hobbies: "Crossword puzzles, jazz, gardening", personality: "Quiet and gentle, enjoys routine", careNeeds: ["Companionship", "Meal prep", "Light housekeeping"], zipCode: "10001", medications: "Donepezil 10mg (morning)", allergies: "None", mobility: "Uses a cane for longer walks", dietary: "Low sodium", schedule: [{ id: "s1", time: "9:00 AM", activity: "Morning medication", category: "Medication reminder", notes: "Donepezil 10mg with breakfast" }, { id: "s2", time: "12:00 PM", activity: "Lunch", category: "Meal", notes: "Low sodium, likes soup and sandwiches" }, { id: "s3", time: "2:00 PM", activity: "Afternoon walk", category: "Activity", notes: "15-20 min around the block, uses cane" }], address: "42 Maple Drive, Brooklyn, NY", entryInstructions: "Key under mat", parking: "Driveway available", pets: "One cat — Whiskers", emergencyName: "Sarah Thompson", emergencyPhone: "(555) 234-5678", doctorName: "Dr. Patel", doctorPhone: "(555) 876-5432", hospitalPreference: "NYU Langone", houseRules: "Shoes off at the door" },
  ]);
  const [showCloseRequestConfirm, setShowCloseRequestConfirm] = useState(false);
  const [showKeepExploringOptions, setShowKeepExploringOptions] = useState(false);
  const [declineMessage, setDeclineMessage] = useState("");
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewToast, setReviewToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = conversations.filter((c) => c.tab === activeTab);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const unreadCounts = {
    active: conversations.filter((c) => c.tab === "active" && c.unread > 0).length,
    requests: conversations.filter((c) => c.tab === "requests").length,
    archived: 0,
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, conversations]);

  const handleSend = useCallback(() => {
    if (!draftMessage.trim() || !selectedId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, { id: `m-${Date.now()}`, from: "me" as const, type: "text" as const, text: draftMessage.trim(), timestamp: "Just now" }], lastMessage: draftMessage.trim(), lastMessageTime: "Just now" }
          : c
      )
    );
    setDraftMessage("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [draftMessage, selectedId]);

  const handleBookingConfirm = useCallback((booking: BookingDetails, wp: CareRecipientProfile) => {
    if (!selectedId || !selected) return;
    const firstName = selected.name.split(" ")[0];
    const dateLabel = booking.recurring
      ? `Recurring care booked: ${booking.recurringPattern} starting ${booking.date.includes("starting") ? booking.date.split("starting ")[1] : "next week"}. Welcome package shared.`
      : `Visit booked for ${new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${booking.startTime}. Welcome package shared.`;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              status: "booking_confirmed" as ConversationStatus,
              bookingDetails: booking,
              sharedWelcomePackageId: wp.id,
              sharedWelcomePackage: wp,
              messages: [
                ...c.messages,
                { id: `m-${Date.now()}`, from: "system" as const, type: "system" as const, text: dateLabel, timestamp: "Just now" },
                { id: `m-${Date.now() + 1}`, from: "me" as const, type: "welcome_package" as const, text: `${wp.name}'s welcome package`, timestamp: "Just now", welcomePackageId: wp.id },
                { id: `m-${Date.now() + 2}`, from: "them" as const, type: "text" as const, text: `Thank you for sharing ${wp.name}'s welcome package! I've reviewed everything and I'm looking forward to our first visit. See you soon!`, timestamp: "Just now", read: false },
              ],
              lastMessage: `Thank you for sharing ${wp.name}'s welcome package!`,
              lastMessageTime: "Just now",
              unread: c.unread + 1,
            }
          : c
      )
    );
  }, [selectedId, selected]);

  return (
    <div className="h-screen flex flex-col bg-primary-50">
      {/* Booking modal */}
      {selected && showBookingModal && (
        <BookVisitModal
          open={true}
          onClose={() => setShowBookingModal(false)}
          caregiverName={selected.name}
          rate={selected.rate}
          caregiverPhoto={selected.photo}
          requestDetails={selected.requestDetails}
          savedPackages={savedWelcomePackages}
          onConfirm={(booking, wp) => {
            handleBookingConfirm(booking, wp);
          }}
          onSavePackage={(wp) => {
            setSavedWelcomePackages((prev) => [...prev, wp]);
          }}
        />
      )}

      {/* ── Icon rail + Three-pane layout ── */}
      <div className="flex-1 flex min-h-0">

        {/* ═══ LEFT: Conversation list ═══ */}
        <div className="w-[340px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
          {/* Header */}
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-display-xs font-semibold text-gray-900">Inbox</h1>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                </button>
                <Link href="/care-shifts" className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(["active", "requests", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); const first = conversations.find((c) => c.tab === tab); if (first) setSelectedId(first.id); }}
                  className={`px-4 py-2 rounded-full text-text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  {unreadCounts[tab] > 0 && (
                    <span className={`ml-1.5 inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab ? "bg-white text-gray-900" : "bg-primary-600 text-white"
                    }`}>
                      {unreadCounts[tab]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto pt-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                </div>
                <p className="text-text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                    selectedId === conv.id ? "bg-gray-50" : "hover:bg-gray-50/50"
                  }`}
                >
                  {/* Photo */}
                  <div className="relative flex-shrink-0">
                    <img src={conv.photo} alt={conv.name} className="w-14 h-14 rounded-xl object-cover" />
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`text-text-sm truncate ${conv.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                          {conv.name}
                        </span>
                        {conv.verified && (
                          <svg className="w-4 h-4 text-primary-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1 truncate">{conv.contextLine} &middot; ${conv.rate}/hr</p>
                    <p className={`text-text-xs truncate ${conv.unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {conv.lastMessage}
                    </p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[conv.status]}`}>
                      {STATUS_LABELS[conv.status]}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ═══ CENTER: Conversation thread ═══ */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selected ? (
            <>
              {/* Conversation header */}
              <div className="flex-shrink-0 border-b border-gray-200 px-6 py-3.5 flex items-center gap-3 bg-white">
                <img src={selected.photo} alt={selected.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-text-md font-semibold text-gray-900">{selected.name}</h2>
                    {selected.verified && (
                      <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    )}
                    <Link href={`/care-shifts?profile=${selected.feedId}`} className="text-text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">View profile</Link>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-text-xs text-gray-500">{selected.contextLine} &middot; {selected.university}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[selected.status]}`}>
                      {selected.status === "visit_in_progress" ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                        </span>
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selected.status === "booking_confirmed" || selected.status === "meet_greet_scheduled" ? "bg-success-500" :
                          selected.status === "chatting" || selected.status === "met_ready_to_book" ? "bg-primary-500" :
                          selected.status === "request_sent" || selected.status === "meet_greet_pending" ? "bg-warning-500" : "bg-gray-400"
                        }`} />
                      )}
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                </div>
                {/* Schedule a meet and greet */}
                <div className="relative">
                  <button
                    onClick={() => setShowCallTip(!showCallTip)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 text-text-xs font-medium shadow-sm"
                  >
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    Schedule a meet &amp; greet
                  </button>
                  {showCallTip && (
                    <div className="absolute right-0 top-full mt-2 w-[400px] rounded-2xl bg-white border border-gray-200 shadow-lg shadow-gray-200/60 overflow-hidden z-50 max-h-[80vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px -4px rgba(16,24,40,0.10), 0 2px 8px -2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)" }}>
                      {callStep === "type" ? (
                        <>
                          {/* Step 1: Meeting type */}
                          <div className="px-5 py-3.5 bg-gradient-to-r from-primary-50 to-primary-25 border-b border-primary-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                              </div>
                              <span className="text-text-sm font-semibold text-gray-800">Schedule a Meet &amp; Greet</span>
                            </div>
                            <button onClick={() => { setShowCallTip(false); setMeetingType(null); }} className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">Close</button>
                          </div>
                          <div className="px-5 py-4 space-y-3">
                            <p className="text-text-xs text-gray-500">How would you like to meet {selected.name.split(" ")[0]}?</p>
                            <button
                              onClick={() => { setMeetingType("video"); setCallStep("pick"); }}
                              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${meetingType === "video" ? "border-primary-500 bg-primary-25" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                              </div>
                              <div>
                                <p className="text-text-sm font-semibold text-gray-900">Video call</p>
                                <p className="text-text-xs text-gray-500">Free &middot; Meet through Olera</p>
                              </div>
                            </button>
                            <button
                              onClick={() => { setMeetingType("in_person"); setCallStep("pick"); }}
                              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${meetingType === "in_person" ? "border-primary-500 bg-primary-25" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                              </div>
                              <div>
                                <p className="text-text-sm font-semibold text-gray-900">In person</p>
                                <p className="text-text-xs text-gray-500">Meet at a coffee shop or public place</p>
                              </div>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Step 2: Pick date, time, note */}
                          <div className="px-5 py-3.5 bg-gradient-to-r from-primary-50 to-primary-25 border-b border-primary-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                                {meetingType === "video" ? (
                                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                ) : (
                                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                )}
                              </div>
                              <span className="text-text-sm font-semibold text-gray-800">{meetingType === "video" ? "Video call" : "In-person"} &middot; Pick a time</span>
                            </div>
                            <button onClick={() => setCallStep("type")} className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">Back</button>
                          </div>

                          {/* Calendar */}
                          <div className="px-5 pt-4 pb-2">
                            {(() => {
                              const { year, month } = calMonth;
                              const firstDay = new Date(year, month, 1).getDay();
                              const daysInMonth = new Date(year, month + 1, 0).getDate();
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                              const days: (number | null)[] = [];
                              for (let i = 0; i < firstDay; i++) days.push(null);
                              for (let i = 1; i <= daysInMonth; i++) days.push(i);
                              const weeks: (number | null)[][] = [];
                              for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
                              if (weeks.length > 0) while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

                              return (
                                <div>
                                  <div className="rounded-xl bg-primary-600 text-white flex items-center justify-between px-4 py-2.5 mb-2">
                                    <button onClick={() => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })} className="w-7 h-7 rounded-full hover:bg-primary-500 flex items-center justify-center transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <span className="text-text-sm font-semibold">{monthName}</span>
                                    <button onClick={() => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })} className="w-7 h-7 rounded-full hover:bg-primary-500 flex items-center justify-center transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-7 text-center mb-1">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                      <span key={d} className="text-[11px] text-gray-400 font-medium py-1.5">{d}</span>
                                    ))}
                                  </div>
                                  {weeks.map((week, wi) => (
                                    <div key={wi} className="grid grid-cols-7 text-center">
                                      {week.map((day, di) => {
                                        if (day === null) return <span key={di} />;
                                        const dateObj = new Date(year, month, day);
                                        const isPast = dateObj < today;
                                        const isToday = dateObj.getTime() === today.getTime();
                                        const isSelected = callDate && callDate.getTime() === dateObj.getTime();
                                        return (
                                          <button key={di} disabled={isPast} onClick={() => setCallDate(dateObj)}
                                            className={`py-2 text-text-xs rounded-lg transition-colors ${isSelected ? "bg-primary-600 text-white font-semibold" : isToday ? "bg-primary-50 text-primary-700 font-semibold" : isPast ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                                          >{day}</button>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Time picker */}
                          <div className="px-5 pb-3">
                            <p className="text-text-xs font-semibold text-gray-700 mb-2">Select time</p>
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[120px] overflow-y-auto">
                              {(() => {
                                const times: string[] = [];
                                for (let h = 8; h <= 20; h++) { times.push(`${h}:00`); times.push(`${h}:30`); }
                                return times.map((t) => {
                                  const [hh, mm] = t.split(":").map(Number);
                                  const label = new Date(2000, 0, 1, hh, mm).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                                  return (
                                    <button key={t} onClick={() => setCallTime(t)}
                                      className={`w-full text-left px-4 py-2 text-text-xs transition-colors ${callTime === t ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                    >{label}</button>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* Optional note */}
                          <div className="px-5 pb-3">
                            <input
                              type="text"
                              value={meetNote}
                              onChange={(e) => setMeetNote(e.target.value)}
                              placeholder={`Add a note for ${selected.name.split(" ")[0]} (optional)`}
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                            />
                          </div>

                          {/* Send button */}
                          <div className="px-5 pb-4">
                            <button
                              disabled={!callDate || !callTime}
                              onClick={() => {
                                const [hh, mm] = callTime.split(":").map(Number);
                                const dateObj = new Date(callDate!);
                                dateObj.setHours(hh, mm);
                                const formatted = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                                const timeFormatted = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                                const typeLabel = meetingType === "video" ? "Video" : "In-person";
                                const inviteMsg: Message = {
                                  id: `m-${Date.now()}`,
                                  from: "me",
                                  type: "schedule_invite",
                                  text: meetNote.trim() || `I'd love to schedule a meet & greet! Are you available?`,
                                  timestamp: "Just now",
                                  inviteDate: formatted,
                                  inviteTime: timeFormatted,
                                  meetingType: meetingType!,
                                };
                                const systemMsg: Message = {
                                  id: `m-${Date.now() + 1}`,
                                  from: "system",
                                  type: "system",
                                  text: `${typeLabel} meet & greet requested for ${formatted} at ${timeFormatted}`,
                                  timestamp: "Just now",
                                };
                                setConversations((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedId
                                      ? {
                                          ...c,
                                          messages: [...c.messages, inviteMsg, systemMsg],
                                          lastMessage: `Meet & greet invite: ${formatted} at ${timeFormatted}`,
                                          lastMessageTime: "Just now",
                                          status: "meet_greet_pending" as ConversationStatus,
                                          meetingDetails: { type: meetingType!, date: formatted, time: timeFormatted, note: meetNote.trim() || undefined },
                                        }
                                      : c
                                  )
                                );
                                setShowCallTip(false);
                                setCallStep("type");
                                setMeetingType(null);
                                setCallDate(null);
                                setCallTime("");
                                setMeetNote("");
                                // Simulate caregiver accepting after 3 seconds
                                setTimeout(() => {
                                  setConversations((prev) =>
                                    prev.map((c) =>
                                      c.id === selectedId && c.status === "meet_greet_pending"
                                        ? {
                                            ...c,
                                            status: "meet_greet_scheduled" as ConversationStatus,
                                            messages: [
                                              ...c.messages,
                                              { id: `m-${Date.now()}`, from: "system" as const, type: "system" as const, text: `Meet & greet confirmed for ${formatted} at ${timeFormatted}`, timestamp: "Just now" },
                                              { id: `m-${Date.now() + 1}`, from: "them" as const, type: "text" as const, text: `Sounds great! I'll see you then. Looking forward to it!`, timestamp: "Just now", read: false },
                                            ],
                                            lastMessage: "Sounds great! I'll see you then. Looking forward to it!",
                                            lastMessageTime: "Just now",
                                            unread: c.unread + 1,
                                          }
                                        : c
                                    )
                                  );
                                  // Simulate meet & greet completing after 20 seconds
                                  setTimeout(() => {
                                    setConversations((prev) =>
                                      prev.map((c) =>
                                        c.id === selectedId && c.status === "meet_greet_scheduled"
                                          ? {
                                              ...c,
                                              status: "met_ready_to_book" as ConversationStatus,
                                              messages: [
                                                ...c.messages,
                                                { id: `m-${Date.now()}`, from: "system" as const, type: "system" as const, text: "Meet & greet completed", timestamp: "Just now" },
                                                { id: `m-${Date.now() + 1}`, from: "them" as const, type: "text" as const, text: `It was so lovely meeting you! I'd be happy to start whenever you're ready.`, timestamp: "Just now", read: false },
                                              ],
                                              lastMessage: "It was so lovely meeting you! I'd be happy to start whenever you're ready.",
                                              lastMessageTime: "Just now",
                                              unread: c.unread + 1,
                                            }
                                          : c
                                      )
                                    );
                                  }, 20000);
                                }, 3000);
                              }}
                              className={`w-full py-3 rounded-xl text-text-sm font-medium transition-colors ${callDate && callTime ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                            >
                              Send meet &amp; greet request to {selected.name.split(" ")[0]}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/30">
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Structured request card — 3D elevated, editable */}
                  {selected.requestDetails && (
                    <div className="mb-6 rounded-2xl bg-white border border-gray-200 shadow-lg shadow-gray-200/60 overflow-hidden" style={{ transform: "translateY(0)", boxShadow: "0 4px 24px -4px rgba(16,24,40,0.10), 0 2px 8px -2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)" }}>
                      {/* Header */}
                      <div className="px-5 py-3.5 bg-gradient-to-r from-primary-50 to-primary-25 border-b border-primary-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                          </div>
                          <span className="text-text-sm font-semibold text-gray-800">Connection Request</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">Sent {selected.requestDetails.sentAt}</span>
                          {editingRequest ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setEditingRequest(false)}
                                className="text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  setConversations((prev) =>
                                    prev.map((c) =>
                                      c.id === selectedId && c.requestDetails
                                        ? { ...c, requestDetails: { ...c.requestDetails, schedule: editFields.schedule, postalCode: editFields.postalCode, careFor: editFields.careFor, careTypes: editFields.careTypes } }
                                        : c
                                    )
                                  );
                                  setEditingRequest(false);
                                }}
                                className="text-[11px] font-medium text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1 rounded-md transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingRequest(true); setEditFields({ schedule: selected.requestDetails!.schedule, postalCode: selected.requestDetails!.postalCode, careFor: selected.requestDetails!.careFor, careTypes: [...selected.requestDetails!.careTypes] }); }}
                              className="text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Details rows */}
                      <div className="px-5 py-4 space-y-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-gray-400 mb-1">Care needed</p>
                            {editingRequest ? (
                              <div className="flex flex-wrap gap-1.5">
                                {["Companionship", "Meal Prep", "Dementia Care", "Mobility Assistance", "Daily Activities", "Medication Reminders", "Light Housekeeping", "Transportation", "Personal Care", "Respite Care"].map((t) => {
                                  const active = editFields.careTypes.includes(t);
                                  return (
                                    <button
                                      key={t}
                                      onClick={() => setEditFields((f) => ({
                                        ...f,
                                        careTypes: active ? f.careTypes.filter((c) => c !== t) : [...f.careTypes, t],
                                      }))}
                                      className={`px-2.5 py-1 rounded-lg text-text-xs font-medium border transition-colors ${
                                        active
                                          ? "bg-primary-600 text-white border-primary-600"
                                          : "bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600"
                                      }`}
                                    >
                                      {active ? "✓ " : "+ "}{t}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {selected.requestDetails.careTypes.map((t) => (
                                  <span key={t} className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-text-xs font-medium border border-primary-100">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-gray-400 mb-0.5">Schedule</p>
                            {editingRequest ? (
                              <input
                                type="text"
                                value={editFields.schedule}
                                onChange={(e) => setEditFields((f) => ({ ...f, schedule: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                              />
                            ) : (
                              <p className="text-text-sm text-gray-800 font-medium">{selected.requestDetails.schedule}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] text-gray-400 mb-0.5">Location</p>
                              {editingRequest ? (
                                <input
                                  type="text"
                                  value={editFields.postalCode}
                                  onChange={(e) => setEditFields((f) => ({ ...f, postalCode: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                                />
                              ) : (
                                <p className="text-text-sm text-gray-800 font-medium">{selected.requestDetails.postalCode}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] text-gray-400 mb-0.5">Care for</p>
                              {editingRequest ? (
                                <input
                                  type="text"
                                  value={editFields.careFor}
                                  onChange={(e) => setEditFields((f) => ({ ...f, careFor: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                                />
                              ) : (
                                <p className="text-text-sm text-gray-800 font-medium">{selected.requestDetails.careFor}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {selected.messages.map((msg) => {
                    const msgLower = msg.type === "system" ? msg.text.toLowerCase() : "";
                    const isConnectionAccepted = msg.type === "system" && msgLower.includes("connection accepted");
                    const wpMsg = msg.type === "welcome_package" ? (savedWelcomePackages.find((p) => p.id === msg.welcomePackageId) || selected.sharedWelcomePackage || null) : null;
                    const isPayment = msg.type === "system" && msgLower.includes("you sent");
                    const isCheckedIn = msg.type === "system" && msgLower.includes("checked in");
                    const isCheckedOut = msg.type === "system" && msgLower.includes("checked out");
                    const isConfirmed = msg.type === "system" && !isCheckedIn && !isPayment && (msgLower.includes("confirmed") || msgLower.includes("completed") || msgLower.includes("booking"));
                    const isCancelled = msg.type === "system" && msgLower.includes("cancelled");
                    const isPending = msg.type === "system" && (msgLower.includes("requested") || msgLower.includes("pending") || msgLower.includes("request sent"));
                    const firstName = selected.name.split(" ")[0];

                    return (
                      <div key={msg.id}>
                        {msg.type === "schedule_invite" ? (
                          <div className="flex justify-end">
                            <div className="max-w-[75%]">
                              <div className="rounded-2xl rounded-br-md border border-primary-200 overflow-hidden bg-white" style={{ boxShadow: "0 2px 12px -2px rgba(16,24,40,0.08)" }}>
                                <div className="px-4 py-2.5 bg-gradient-to-r from-primary-50 to-primary-25 border-b border-primary-100 flex items-center gap-2">
                                  {msg.meetingType === "in_person" ? (
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                  )}
                                  <span className="text-text-xs font-semibold text-primary-700">{msg.meetingType === "in_person" ? "In-Person" : "Video"} Meet &amp; Greet</span>
                                </div>
                                <div className="px-4 py-3">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                    </div>
                                    <div>
                                      <p className="text-text-sm font-semibold text-gray-900">{msg.inviteDate}</p>
                                      <p className="text-text-xs text-gray-500">{msg.inviteTime}</p>
                                    </div>
                                  </div>
                                  <p className="text-text-xs text-gray-500 leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.timestamp}</p>
                            </div>
                          </div>
                        ) : msg.type === "review_prompt" ? (
                          /* ── Review prompt card ── */
                          <div className="my-3 rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden" style={{ boxShadow: "0 4px 24px -4px rgba(16,24,40,0.10), 0 2px 8px -2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)" }}>
                            <div className="px-5 py-3.5 bg-gradient-to-r from-warm-50 to-warm-25 border-b border-warm-100 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-warm-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-warm-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                              </div>
                              <span className="text-text-sm font-semibold text-gray-800">{msg.text}</span>
                            </div>
                            <div className="px-5 py-4">
                              <p className="text-text-xs text-gray-500 leading-relaxed mb-4">Your feedback helps {firstName} improve and helps other families find great caregivers.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setReviewRating(0); setReviewHover(0); setReviewTags([]); setReviewComment(""); setReviewModal(true); }}
                                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-text-xs font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                                  Leave a review
                                </button>
                                <button
                                  onClick={() => setShowBookingModal(true)}
                                  className="flex-1 py-2.5 bg-white text-gray-700 rounded-xl text-text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                  Rebook {firstName}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : msg.type === "system" ? (
                          <div className="flex justify-center py-1">
                            {isPayment ? (
                              <span className="text-[11px] text-success-700 bg-success-50 px-3 py-1.5 rounded-full border border-success-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : isCheckedOut ? (
                              <span className="text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : isCheckedIn ? (
                              <span className="text-[11px] text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : isConnectionAccepted || isConfirmed ? (
                              <span className="text-[11px] text-success-700 bg-success-50 px-3 py-1.5 rounded-full border border-success-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : isCancelled ? (
                              <span className="text-[11px] text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : isPending ? (
                              <span className="text-[11px] text-warning-700 bg-warning-50 px-3 py-1.5 rounded-full border border-warning-200 flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            ) : (
                              <span className="text-[11px] text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 font-medium">
                                {msg.text} &middot; {msg.timestamp}
                              </span>
                            )}
                          </div>
                        ) : msg.type === "welcome_package" && wpMsg ? (
                          <div className="flex justify-end">
                            <div className="max-w-[80%]">
                              <div className="rounded-2xl rounded-br-md border border-primary-200 bg-gradient-to-b from-primary-25 to-white overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-primary-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                                    <span className="text-text-xs font-semibold text-primary-700">Welcome package</span>
                                  </div>
                                  <button onClick={() => setShowBookingModal(true)} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                </div>
                                <div className="px-4 py-3 space-y-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-text-sm font-bold text-primary-700">{wpMsg.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                      <p className="text-text-sm font-semibold text-gray-900">{wpMsg.name}</p>
                                      <p className="text-[11px] text-gray-500">{wpMsg.relationship}{wpMsg.age ? `, ${wpMsg.age}` : ""}</p>
                                    </div>
                                  </div>
                                  {wpMsg.condition && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Conditions</p>
                                      <div className="flex flex-wrap gap-1">
                                        {wpMsg.condition.split(", ").filter(Boolean).map((c) => (
                                          <span key={c} className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-700 text-[11px] font-medium">{c}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {wpMsg.careNeeds.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Care needs</p>
                                      <div className="flex flex-wrap gap-1">
                                        {wpMsg.careNeeds.map((n) => (
                                          <span key={n} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-medium">{n}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {wpMsg.medications && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Medications</p>
                                      <div className="flex flex-wrap gap-1">
                                        {wpMsg.medications.split(", ").filter(Boolean).map((m) => (
                                          <span key={m} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">{m}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {wpMsg.schedule.filter((s) => s.activity).length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Daily routine</p>
                                      <div className="space-y-0.5">
                                        {[...wpMsg.schedule].filter((s) => s.activity).sort((a, b) => {
                                          const toMin = (t: string) => { const mt = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!mt) return 0; let h = parseInt(mt[1]); const mn = parseInt(mt[2]); if (mt[3].toUpperCase() === "PM" && h !== 12) h += 12; if (mt[3].toUpperCase() === "AM" && h === 12) h = 0; return h * 60 + mn; };
                                          return toMin(a.time) - toMin(b.time);
                                        }).map((entry) => (
                                          <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                                            <span className="text-gray-400 font-medium w-[58px] flex-shrink-0">{entry.time}</span>
                                            {entry.category && <ScheduleIcon cat={entry.category} className="w-3 h-3 text-primary-500" />}
                                            <span className="text-gray-700">{entry.activity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {wpMsg.address && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Home</p>
                                      <p className="text-[11px] text-gray-600">{wpMsg.address}</p>
                                    </div>
                                  )}
                                  {wpMsg.emergencyName && (
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">Emergency contact</p>
                                      <p className="text-[11px] text-gray-700">{wpMsg.emergencyName}{wpMsg.emergencyPhone ? ` · ${wpMsg.emergencyPhone}` : ""}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.timestamp}</p>
                            </div>
                          </div>
                        ) : msg.type === "photo" ? (
                          /* ── Layer 1: Photo message with inline image ── */
                          <div className="flex items-end gap-2">
                            <img src={selected.photo} alt={selected.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            <div className="max-w-[70%]">
                              <div className="bg-white rounded-2xl rounded-bl-md border border-gray-100 overflow-hidden">
                                <div className="px-3 py-1.5 bg-primary-25 border-b border-gray-100 flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                                  <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">Visit update</span>
                                </div>
                                {msg.photoUrl && (
                                  <img src={msg.photoUrl} alt="Visit photo" className="w-full aspect-[4/3] object-cover" />
                                )}
                                <div className="px-4 py-3">
                                  <p className="text-text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{msg.timestamp}</p>
                            </div>
                          </div>
                        ) : msg.from === "me" ? (
                          <div className="flex justify-end">
                            <div className="max-w-[65%]">
                              <div className="bg-primary-600 text-white px-4 py-3 rounded-2xl rounded-br-md">
                                <p className="text-text-sm leading-relaxed">{msg.text}</p>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.timestamp}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-end gap-2">
                            <img src={selected.photo} alt={selected.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            <div className="max-w-[65%]">
                              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100">
                                <p className="text-text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{msg.timestamp}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                  {/* Post meet & greet prompt */}
                  {selected.status === "met_ready_to_book" && (
                    <div className="my-4 rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden" style={{ boxShadow: "0 4px 24px -4px rgba(16,24,40,0.10), 0 2px 8px -2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)" }}>
                      <div className="px-5 py-3.5 bg-gradient-to-r from-primary-50 to-primary-25 border-b border-primary-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                        </div>
                        <span className="text-text-sm font-semibold text-gray-800">How did your call go with {selected.name.split(" ")[0]}?</span>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-text-xs text-gray-500 leading-relaxed mb-4">You can either book {selected.name.split(" ")[0]} or keep exploring other caregivers.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowBookingModal(true)}
                            className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-text-xs font-medium hover:bg-primary-700 transition-colors"
                          >
                            Book {selected.name.split(" ")[0]}
                          </button>
                          <button
                            onClick={() => setShowKeepExploringOptions(!showKeepExploringOptions)}
                            className="flex-1 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            Keep exploring
                          </button>
                        </div>

                        {/* Keep exploring sub-options */}
                        {showKeepExploringOptions && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fadeIn">
                            <button
                              onClick={() => {
                                setConversations((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedId
                                      ? {
                                          ...c,
                                          messages: [
                                            ...c.messages,
                                            { id: `m-${Date.now()}`, from: "me" as const, type: "text" as const, text: `Still thinking things over — I'll let you know soon!`, timestamp: "Just now" },
                                          ],
                                          lastMessage: "Still thinking things over",
                                          lastMessageTime: "Just now",
                                        }
                                      : c
                                  )
                                );
                                setShowKeepExploringOptions(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                              </div>
                              <div>
                                <p className="text-text-sm font-medium text-gray-800">Still thinking</p>
                                <p className="text-text-xs text-gray-400">Let {selected.name.split(" ")[0]} know you need more time</p>
                              </div>
                            </button>

                            <div>
                              <button
                                onClick={() => setDeclineMessage(declineMessage ? "" : `Hi ${selected.name.split(" ")[0]}, thank you so much for the great conversation. I've decided to go in a different direction, but I really appreciate your time!`)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-warm-50 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-warm-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                </div>
                                <div>
                                  <p className="text-text-sm font-medium text-gray-800">Decline with a message</p>
                                  <p className="text-text-xs text-gray-400">Send {selected.name.split(" ")[0]} a polite note and close the chat</p>
                                </div>
                              </button>

                              {declineMessage && (
                                <div className="mt-2 animate-fadeIn">
                                  <textarea
                                    value={declineMessage}
                                    onChange={(e) => setDeclineMessage(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 resize-none transition-colors"
                                  />
                                  <button
                                    onClick={() => {
                                      const now = Date.now();
                                      setConversations((prev) =>
                                        prev.map((c) =>
                                          c.id === selectedId
                                            ? {
                                                ...c,
                                                status: "archived" as ConversationStatus,
                                                tab: "archived" as const,
                                                messages: [
                                                  ...c.messages,
                                                  { id: `m-${now}`, from: "me" as const, type: "text" as const, text: declineMessage.trim(), timestamp: "Just now" },
                                                  { id: `m-${now + 1}`, from: "system" as const, type: "system" as const, text: "Chat closed", timestamp: "Just now" },
                                                ],
                                                lastMessage: "Chat closed",
                                                lastMessageTime: "Just now",
                                              }
                                            : c
                                        )
                                      );
                                      setDeclineMessage("");
                                      setShowKeepExploringOptions(false);
                                    }}
                                    className="mt-2 w-full py-2.5 bg-gray-900 text-white rounded-xl text-text-xs font-medium hover:bg-gray-800 transition-colors"
                                  >
                                    Send and close chat
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Close request confirmation */}
                  {showCloseRequestConfirm && selected.status === "met_ready_to_book" && (
                    <div className="my-4 rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden" style={{ boxShadow: "0 4px 24px -4px rgba(16,24,40,0.10), 0 2px 8px -2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)" }}>
                      <div className="px-5 py-3.5 bg-gradient-to-r from-warning-50 to-warning-25 border-b border-warning-200 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-warning-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                        </div>
                        <span className="text-text-sm font-semibold text-gray-800">Do you want to close your request with {selected.name.split(" ")[0]}?</span>
                      </div>
                      <div className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConversations((prev) =>
                                prev.map((c) =>
                                  c.id === selectedId
                                    ? {
                                        ...c,
                                        status: "archived" as ConversationStatus,
                                        tab: "archived" as const,
                                        messages: [
                                          ...c.messages,
                                          { id: `m-${Date.now()}`, from: "system" as const, type: "system" as const, text: "Connection request closed", timestamp: "Just now" },
                                          { id: `m-${Date.now() + 1}`, from: "me" as const, type: "text" as const, text: `Hi ${selected.name.split(" ")[0]}, unfortunately the care recipient is moving forward with another candidate. Thank you so much for your time and the wonderful meet & greet!`, timestamp: "Just now" },
                                        ],
                                        lastMessage: "Connection request closed",
                                        lastMessageTime: "Just now",
                                      }
                                    : c
                                )
                              );
                              setShowCloseRequestConfirm(false);
                              window.location.href = "/care-shifts";
                            }}
                            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-text-xs font-medium hover:bg-gray-800 transition-colors"
                          >
                            Yes, let {selected.name.split(" ")[0]} know
                          </button>
                          <button
                            onClick={() => {
                              setShowCloseRequestConfirm(false);
                              window.location.href = "/care-shifts";
                            }}
                            className="flex-1 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            Still thinking
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response time inline */}
                  {selected.status === "request_sent" && (
                    <div className="flex justify-center mt-4">
                      <div className="bg-primary-50 px-5 py-2.5 rounded-2xl flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <p className="text-text-xs text-gray-600">{selected.name.split(" ")[0]} usually responds in an hour</p>
                      </div>
                    </div>
                  )}
                  {/* Composer inline */}
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-300 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Write a message..."
                      className="w-full bg-transparent px-4 pt-3 pb-2 text-text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors" title="Send photo">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                        </button>
                        <button onClick={() => setShowCallTip(!showCallTip)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Schedule a meet & greet">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                          <span className="text-text-xs text-gray-500 font-medium">Meet &amp; greet</span>
                        </button>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!draftMessage.trim()}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          draftMessage.trim() ? "bg-gray-900 hover:bg-gray-800 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
                      </button>
                    </div>
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                </div>
                <p className="text-text-md font-medium text-gray-600">Select a conversation</p>
                <p className="text-text-sm text-gray-400 mt-1">Choose from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Details panel (Airbnb-style) ═══ */}
        {selected && showDetails && (
          <div className="w-[300px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            {/* Close */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-text-md font-semibold text-gray-900">Details</h3>
              <button onClick={() => setShowDetails(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Caregiver card */}
            <div className="px-5 pb-5">
              <div className="rounded-xl overflow-hidden border border-gray-200 mb-5">
                <img src={selected.photo} alt={selected.name} className="w-full aspect-[4/3] object-cover" />
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-text-md font-semibold text-gray-900">{selected.name}</h4>
                    {selected.verified && (
                      <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                  <p className="text-text-xs text-gray-500 mb-1">{selected.contextLine}</p>
                  <div className="flex items-center gap-1.5 text-text-xs text-gray-500">
                    <img src={`/images/universities/${selected.universityAbbr}.png`} alt={selected.university} className="w-4 h-4 object-contain" />
                    <span>{selected.university}</span>
                  </div>
                  <p className="text-text-md font-bold text-gray-900 mt-2">${selected.rate}/hr</p>
                </div>
              </div>

              {/* Meeting card — when scheduled */}
              {(selected.status === "meet_greet_scheduled" || selected.status === "meet_greet_pending") && selected.meetingDetails && (
                <div className="mb-5 rounded-xl border border-primary-200 bg-gradient-to-b from-primary-25 to-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-primary-100 flex items-center gap-2">
                    {selected.meetingDetails.type === "video" ? (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    )}
                    <span className="text-text-xs font-semibold text-primary-700">
                      {selected.status === "meet_greet_pending" ? "Pending" : "Confirmed"} &middot; {selected.meetingDetails.type === "video" ? "Video call" : "In person"}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                      <span className="text-text-sm font-medium text-gray-800">{selected.meetingDetails.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      <span className="text-text-sm text-gray-600">{selected.meetingDetails.time} &middot; 30 min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking card — when confirmed */}
              {selected.status === "booking_confirmed" && selected.bookingDetails && (
                <div className="mb-5 rounded-xl border border-success-200 bg-gradient-to-b from-success-25 to-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-success-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    <span className="text-text-xs font-semibold text-success-700">Booking confirmed</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                      <span className="text-text-sm font-medium text-gray-800">
                        {selected.bookingDetails.recurring ? selected.bookingDetails.recurringPattern : (() => { try { return new Date(selected.bookingDetails.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); } catch { return selected.bookingDetails.date; } })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      <span className="text-text-sm text-gray-600">{selected.bookingDetails.startTime} · {selected.bookingDetails.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selected.bookingDetails.careTypes.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-primary-50 text-[10px] text-primary-700 font-medium border border-primary-100">{t}</span>
                      ))}
                    </div>
                    {selected.bookingDetails.totalCost !== undefined && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-text-xs text-gray-500">Per visit</span>
                        <span className="text-text-sm font-bold text-gray-900">${selected.bookingDetails.totalCost}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Layer 2: Current visit / Last visit section ── */}
              {selected.visitDetails && (() => {
                const vd = selected.visitDetails;
                const isLive = vd.status === "in_progress";
                return (
                  <div className={`mb-5 rounded-xl border overflow-hidden ${isLive ? "border-success-200 bg-gradient-to-b from-success-25 to-white" : "border-gray-200 bg-white"}`}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b flex items-center gap-2 ${isLive ? "border-success-100" : "border-gray-100"}`}>
                      {isLive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                        </span>
                      )}
                      <span className={`text-text-xs font-semibold ${isLive ? "text-success-700" : "text-gray-700"}`}>
                        {isLive ? "Visit in progress" : "Last visit"}
                      </span>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {/* Who & when */}
                      <div>
                        <p className="text-text-sm font-semibold text-gray-900">
                          {selected.name.split(" ")[0]} with {vd.recipientName}
                        </p>
                        <p className="text-text-xs text-gray-500">
                          {isLive ? `Checked in at ${vd.checkInTime}` : vd.date} &middot; {vd.timeRange}
                        </p>
                      </div>

                      {/* Photo thumbnails */}
                      {vd.photos.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1.5">{isLive ? "Latest updates" : `${vd.photos.length} photos`}</p>
                          <div className="flex gap-1.5">
                            {vd.photos.slice(0, isLive ? 3 : 5).map((photo, i) => (
                              <img key={i} src={photo} alt={`Visit photo ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
                            ))}
                            {!isLive && vd.photos.length > 5 && (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                                <span className="text-text-xs font-medium text-gray-500">+{vd.photos.length - 5}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Latest note */}
                      {vd.notes.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">{isLive ? "Latest note" : "Visit notes"}</p>
                          {isLive ? (
                            <p className="text-[11px] text-gray-700 leading-relaxed">&ldquo;{vd.notes[vd.notes.length - 1]}&rdquo;</p>
                          ) : (
                            <div className="space-y-1.5">
                              {vd.notes.map((note, i) => (
                                <p key={i} className="text-[11px] text-gray-700 leading-relaxed">&ldquo;{note}&rdquo;</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Activities checklist (completed visits only) */}
                      {!isLive && vd.activities.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1.5">Activities</p>
                          <div className="space-y-1">
                            {vd.activities.map((a, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {a.completed ? (
                                  <svg className="w-3.5 h-3.5 text-success-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
                                )}
                                <span className={`text-[11px] ${a.completed ? "text-gray-700" : "text-gray-400"}`}>{a.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mood (completed visits) */}
                      {!isLive && vd.mood && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Mood</p>
                          <p className="text-[11px] text-gray-700">{vd.mood}</p>
                        </div>
                      )}

                      {/* Medications (live visits) */}
                      {isLive && vd.medicationReminders && vd.medicationReminders.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Medications given</p>
                          <div className="space-y-0.5">
                            {vd.medicationReminders.filter((m) => m.given).map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px]">
                                <svg className="w-3 h-3 text-success-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                <span className="text-gray-700">{m.medication}</span>
                                <span className="text-gray-400">{m.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cost (completed visits) */}
                      {!isLive && vd.cost !== undefined && (
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-text-xs text-gray-500">Visit cost</span>
                          <span className="text-text-sm font-bold text-gray-900">${vd.cost}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
                      <Link
                        href={`/care-shifts/visits/${vd.visitId}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        View full visit details
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Welcome package card — when shared */}
              {selected.status === "booking_confirmed" && selected.sharedWelcomePackageId && (() => {
                const wp = savedWelcomePackages.find((p) => p.id === selected.sharedWelcomePackageId) || selected.sharedWelcomePackage;
                if (!wp) return null;
                return (
                  <div className="mb-5 rounded-xl border border-primary-200 bg-gradient-to-b from-primary-25 to-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-primary-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                        <span className="text-text-xs font-semibold text-primary-700">Welcome package shared</span>
                      </div>
                      <button onClick={() => { setShowBookingModal(true); }} className="text-text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      {/* Recipient */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-text-sm font-bold text-primary-700">{wp.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-text-sm font-semibold text-gray-900">{wp.name}</p>
                          <p className="text-[11px] text-gray-500">{wp.relationship}{wp.age ? `, ${wp.age}` : ""}</p>
                        </div>
                      </div>
                      {/* Conditions */}
                      {wp.condition && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Conditions</p>
                          <div className="flex flex-wrap gap-1">
                            {wp.condition.split(", ").filter(Boolean).map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-700 text-[11px] font-medium">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Care needs */}
                      {wp.careNeeds.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Care needs</p>
                          <div className="flex flex-wrap gap-1">
                            {wp.careNeeds.map((n) => (
                              <span key={n} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-medium">{n}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Medications */}
                      {wp.medications && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Medications</p>
                          <div className="flex flex-wrap gap-1">
                            {wp.medications.split(", ").filter(Boolean).map((m) => (
                              <span key={m} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Schedule */}
                      {wp.schedule.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Daily routine</p>
                          <div className="space-y-1">
                            {[...wp.schedule].filter((s) => s.activity).sort((a, b) => {
                              const toMin = (t: string) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = parseInt(m[1]); const mn = parseInt(m[2]); if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h * 60 + mn; };
                              return toMin(a.time) - toMin(b.time);
                            }).map((entry) => (
                              <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                                <span className="text-gray-400 font-medium w-[60px] flex-shrink-0">{entry.time}</span>
                                {entry.category && <ScheduleIcon cat={entry.category} className="w-3 h-3 text-primary-500" />}
                                <span className="text-gray-700">{entry.activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Home */}
                      {wp.address && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Home</p>
                          <p className="text-[11px] text-gray-600">{wp.address}</p>
                          {wp.entryInstructions && <p className="text-[11px] text-gray-500">{wp.entryInstructions}</p>}
                        </div>
                      )}
                      {/* Emergency */}
                      {wp.emergencyName && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium mb-1">Emergency contact</p>
                          <p className="text-[11px] text-gray-700">{wp.emergencyName}{wp.emergencyPhone ? ` · ${wp.emergencyPhone}` : ""}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="space-y-2 mb-5">
                {getActions(selected.status, selected.name.split(" ")[0]).map((action) => (
                  <button
                    key={action.label}
                    disabled={action.disabled}
                    onClick={() => {
                      if (action.label === "Schedule meet & greet") {
                        setShowCallTip(true);
                        setCallStep("type");
                      } else if (action.label === "Join meet & greet") {
                        alert("Video call would launch here. Real video integration (Daily, Twilio, or Whereby) will be added in a future phase.");
                      } else if (action.label === "Reschedule") {
                        setShowCallTip(true);
                        setCallStep("pick");
                        setMeetingType(selected.meetingDetails?.type ?? "video");
                      } else if (action.label === "Cancel meet & greet") {
                        setShowCancelConfirm(true);
                      } else if (action.label === "Leave a review") {
                        setReviewRating(0); setReviewHover(0); setReviewTags([]); setReviewComment(""); setReviewModal(true);
                      } else if (action.label === "Book a visit" || action.label.startsWith("Book ")) {
                        setShowBookingModal(true);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-text-sm font-medium transition-colors ${
                      action.disabled
                        ? "bg-primary-50 text-gray-400 cursor-not-allowed border border-primary-100"
                        : action.label === "Accept" || action.label === "Join meet & greet" || action.label === "Book a visit" || action.label.startsWith("Book ")
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : action.label.startsWith("Cancel")
                        ? "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                        : "bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100"
                    }`}
                  >
                    <ActionIcon icon={action.icon} />
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Cancel confirmation modal */}
              {showCancelConfirm && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-text-sm font-semibold text-gray-900 mb-1">Cancel meet &amp; greet?</p>
                  <p className="text-text-xs text-gray-500 mb-3">{selected.name.split(" ")[0]} will be notified.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-text-xs font-medium text-gray-600 hover:bg-white transition-colors">
                      Keep it
                    </button>
                    <button
                      onClick={() => {
                        const cancelMsg: Message = { id: `m-${Date.now()}`, from: "system", type: "system", text: "Meet & greet cancelled", timestamp: "Just now" };
                        setConversations((prev) =>
                          prev.map((c) =>
                            c.id === selectedId
                              ? { ...c, status: "chatting" as ConversationStatus, meetingDetails: undefined, messages: [...c.messages, cancelMsg], lastMessage: "Meet & greet cancelled", lastMessageTime: "Just now" }
                              : c
                          )
                        );
                        setShowCancelConfirm(false);
                      }}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white text-text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel it
                    </button>
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="border-t border-gray-100 pt-4 space-y-1">
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                  Report a concern
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                  Archive conversation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {reviewModal && selected && (() => {
        const activeRating = reviewHover || reviewRating;
        const REVIEW_TAGS = ["Punctual", "Great with my loved one", "Clear communicator", "Patient", "Caring", "Reliable", "Goes above and beyond"];
        const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
        const caregiverFirstName = selected.name.split(" ")[0];
        const recipientName = selected.visitDetails?.recipientName || "your loved one";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-fadeIn">
              <button onClick={() => setReviewModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <img src={selected.photo} alt={selected.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
                <p className="text-text-md font-semibold text-gray-900">How was your visit with {selected.name}?</p>
                <p className="text-text-xs text-gray-400 mt-1">{selected.visitDetails?.date || "Today"} &middot; {selected.visitDetails?.duration || "3 hrs"} with {recipientName}</p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setReviewHover(star)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <svg className={`w-9 h-9 transition-colors ${star <= activeRating ? "text-warning-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-center text-text-sm font-medium text-gray-500 mb-6 h-5">
                {activeRating > 0 ? RATING_LABELS[activeRating] : ""}
              </p>

              <div className="mb-5">
                <p className="text-text-xs font-medium text-gray-500 mb-2.5">What stood out? <span className="text-gray-400">(Optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map((tag) => {
                    const sel = reviewTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setReviewTags((prev) => sel ? prev.filter((t) => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1.5 rounded-full text-text-xs font-medium border transition-colors ${
                          sel
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

              <div className="flex items-center justify-between">
                <button onClick={() => setReviewModal(false)} className="text-text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Maybe later
                </button>
                <button
                  disabled={reviewRating === 0}
                  onClick={() => {
                    setReviewToast(`Thanks for reviewing ${selected.name}! Your review will be published once both sides have shared feedback.`);
                    setReviewModal(false);
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

      {/* ── Review Toast ── */}
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

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white" />}>
      <InboxContent />
    </Suspense>
  );
}
