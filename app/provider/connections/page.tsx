"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

// ── Types ──

type TimelineFilter = "all" | "immediate" | "within_1_month" | "exploring" | "archived";
type SortOption = "best_match" | "most_recent" | "most_urgent";
type LeadStatus = "new" | "replied" | "no_reply" | "archived";
type Urgency = "immediate" | "within_1_month" | "exploring";
type ContactMethod = "phone" | "email" | "either";

interface Lead {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
  location: string;
  urgency: Urgency;
  status: LeadStatus;
  date: string;
  isNew: boolean;
}

interface ActivityEvent {
  label: string;
  date: string;
}

interface LeadDetail extends Lead {
  email?: string;
  phone?: string;
  contactPreference?: ContactMethod;
  careRecipient?: string;
  careRecipientName?: string;
  careType?: string[];
  careNeeds?: string[];
  livingSituation?: string;
  schedulePreference?: string;
  careLocation?: string;
  languagePreference?: string;
  insuranceType?: string;
  benefits?: string[];
  additionalNotes?: string;
  activity?: ActivityEvent[];
}

// ── Mock data ──

const MOCK_LEADS: LeadDetail[] = [
  {
    id: "1", name: "Sarah Reynolds", initials: "SR", subtitle: "For her mother, 78",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "2h ago", isNew: true,
    email: "sarah.reynolds@gmail.com", phone: "(512) 555-0147", contactPreference: "phone",
    careRecipient: "Mother, 78", careRecipientName: "Margaret", careType: ["In-home care", "Companionship"],
    careNeeds: ["Mobility assistance", "Medication management", "Meal preparation"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, daytime", careLocation: "Care recipient's home", languagePreference: "English",
    insuranceType: "Medicare Advantage", benefits: ["Long-term care insurance", "VA benefits"],
    additionalNotes: "Mom recently had a fall and needs someone who can help with daily activities. She\u2019s very independent and would prefer someone patient and friendly. We\u2019re hoping to start as soon as possible.",
    activity: [
      { label: "Lead received", date: "2h ago \u00b7 Via Olera search" },
      { label: "Profile viewed by you", date: "Just now" },
    ],
  },
  {
    id: "2", name: "James Adeyemi", initials: "JA", subtitle: "For his father, 85",
    location: "Round Rock, TX", urgency: "within_1_month", status: "new", date: "5h ago", isNew: true,
    email: "james.adeyemi@outlook.com", phone: "(512) 555-0231", contactPreference: "email",
    careRecipient: "Father, 85", careRecipientName: "Emmanuel", careType: ["In-home care", "Personal care"],
    careNeeds: ["Bathing assistance", "Transportation", "Light housekeeping"],
    livingSituation: "Lives with family", schedulePreference: "Flexible", careLocation: "Care recipient's home", languagePreference: "English, Yoruba",
    insuranceType: "Medicaid", benefits: ["Medicaid waiver program"],
    additionalNotes: "My father speaks both English and Yoruba. A caregiver who understands Nigerian culture would be a huge plus. He needs help a few hours each day while I\u2019m at work.",
    activity: [
      { label: "Lead received", date: "5h ago \u00b7 Via provider profile" },
      { label: "Profile viewed by you", date: "Just now" },
    ],
  },
  {
    id: "3", name: "Diana Nguyen", initials: "DN", subtitle: "For her grandmother, 91",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "1d ago", isNew: true,
    email: "diana.nguyen@yahoo.com", phone: "(512) 555-0389", contactPreference: "either",
    careRecipient: "Grandmother, 91", careRecipientName: "Mei", careType: ["In-home care", "Memory care"],
    careNeeds: ["Dementia support", "24/7 supervision", "Medication management"],
    livingSituation: "Lives with family", schedulePreference: "Full-time, live-in preferred", careLocation: "Care recipient's home", languagePreference: "English, Vietnamese",
    insuranceType: "Medicare", benefits: ["Long-term care insurance"],
    additionalNotes: "Grandmother has moderate dementia and needs constant supervision. She sometimes wanders and gets confused at night. Vietnamese-speaking caregiver strongly preferred.",
    activity: [
      { label: "Lead received", date: "1d ago \u00b7 Via Olera search" },
    ],
  },
  {
    id: "4", name: "Linda Washington", initials: "LW", subtitle: "For her husband, 72",
    location: "Austin, TX", urgency: "immediate", status: "replied", date: "2d ago", isNew: false,
    email: "linda.washington@gmail.com", phone: "(512) 555-0512", contactPreference: "phone",
    careRecipient: "Husband, 72", careRecipientName: "David", careType: ["In-home care", "Post-surgery care"],
    careNeeds: ["Physical therapy support", "Wound care", "Mobility assistance"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekdays, mornings", careLocation: "Care recipient's home", languagePreference: "English",
    insuranceType: "Private insurance", benefits: ["Short-term disability"],
    additionalNotes: "My husband just had hip replacement surgery. We need someone experienced with post-op recovery. He\u2019ll need help for about 6\u20138 weeks.",
    activity: [
      { label: "Lead received", date: "2d ago \u00b7 Via Olera search" },
      { label: "You sent a message", date: "1d ago" },
      { label: "Profile viewed by you", date: "1d ago" },
    ],
  },
  {
    id: "5", name: "Robert Park", initials: "RP", subtitle: "For his wife, 68",
    location: "Pflugerville, TX", urgency: "exploring", status: "replied", date: "3d ago", isNew: false,
    email: "robert.park@gmail.com", phone: "(512) 555-0678", contactPreference: "email",
    careRecipient: "Wife, 68", careRecipientName: "Soo-jin", careType: ["Companionship", "Respite care"],
    careNeeds: ["Companionship", "Light housekeeping", "Meal preparation"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekends", careLocation: "Care recipient's home", languagePreference: "English, Korean",
    insuranceType: "Medicare Advantage", benefits: [],
    additionalNotes: "I\u2019m the primary caregiver for my wife and I just need someone to give me a break on weekends. She\u2019s mostly independent but enjoys company.",
    activity: [
      { label: "Lead received", date: "3d ago \u00b7 Via provider profile" },
      { label: "You replied", date: "2d ago" },
    ],
  },
  {
    id: "6", name: "Maria Kowalski", initials: "MK", subtitle: "For her parents, both 80s",
    location: "Cedar Park, TX", urgency: "exploring", status: "no_reply", date: "5d ago", isNew: false,
    email: "maria.kowalski@hotmail.com", phone: "(512) 555-0845", contactPreference: "either",
    careRecipient: "Parents, both 80s", careRecipientName: "her parents", careType: ["In-home care", "Companionship"],
    careNeeds: ["Meal preparation", "Transportation", "Medication reminders"],
    livingSituation: "Live together, own home", schedulePreference: "Flexible, part-time", careLocation: "Care recipients' home", languagePreference: "English, Polish",
    insuranceType: "Medicare", benefits: ["Long-term care insurance", "VA benefits"],
    additionalNotes: "Both parents need light help throughout the week. They\u2019re still fairly active but need reminders for medications and someone to drive them to appointments.",
    activity: [
      { label: "Lead received", date: "5d ago \u00b7 Via Olera search" },
    ],
  },
  {
    id: "7", name: "Tomoko Chen", initials: "TC", subtitle: "For her father, 89",
    location: "Austin, TX", urgency: "within_1_month", status: "replied", date: "1w ago", isNew: false,
    email: "tomoko.chen@gmail.com", phone: "(512) 555-0923", contactPreference: "phone",
    careRecipient: "Father, 89", careRecipientName: "Wei", careType: ["In-home care", "Hospice support"],
    careNeeds: ["End-of-life care", "Pain management support", "Companionship"],
    livingSituation: "Lives with family", schedulePreference: "Full-time", careLocation: "Care recipient's home", languagePreference: "English, Mandarin",
    insuranceType: "Medicare", benefits: ["Hospice benefit"],
    additionalNotes: "Dad is in hospice and we want to make sure he\u2019s comfortable at home. Looking for someone compassionate who can be with him during the day while we work.",
    activity: [
      { label: "Lead received", date: "1w ago \u00b7 Via Olera search" },
      { label: "You replied", date: "5d ago" },
      { label: "Family responded", date: "4d ago" },
      { label: "You sent a message", date: "3d ago" },
      { label: "Lead archived", date: "2d ago" },
    ],
  },
  {
    id: "8", name: "Angela Johnson", initials: "AJ", subtitle: "For herself, 66",
    location: "Georgetown, TX", urgency: "within_1_month", status: "no_reply", date: "1w ago", isNew: false,
    email: "angela.johnson@aol.com", phone: "(512) 555-0101", contactPreference: "phone",
    careRecipient: "Self, 66", careRecipientName: "Angela", careType: ["Companionship", "Personal care"],
    careNeeds: ["Companionship", "Grocery shopping", "Light exercise assistance"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, afternoons", careLocation: "Own home", languagePreference: "English",
    insuranceType: "Private insurance", benefits: [],
    additionalNotes: "I\u2019m looking for a companion who can help me stay active. I enjoy walks and would love someone to chat with and help with errands a few afternoons a week.",
    activity: [
      { label: "Lead received", date: "1w ago \u00b7 Via provider profile" },
    ],
  },
];

// ── Config ──

const FILTER_TABS: { id: TimelineFilter; label: string }[] = [
  { id: "all", label: "All leads" },
  { id: "immediate", label: "Immediate" },
  { id: "within_1_month", label: "Within 1 month" },
  { id: "exploring", label: "Exploring" },
  { id: "archived", label: "Archived" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "best_match", label: "Best match" },
  { id: "most_recent", label: "Most recent" },
  { id: "most_urgent", label: "Most urgent" },
];

const URGENCY_LABELS: Record<Urgency, string> = {
  immediate: "Immediate",
  within_1_month: "Within 1 month",
  exploring: "Exploring",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  replied: "Replied",
  no_reply: "No reply",
  archived: "Archived",
};

const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: "Prefers phone",
  email: "Prefers email",
  either: "Phone or email",
};

// ── Avatar gradients (deterministic by name) ──

const AVATAR_GRADIENTS = [
  "from-rose-100 to-pink-50",
  "from-sky-100 to-blue-50",
  "from-amber-100 to-yellow-50",
  "from-emerald-100 to-green-50",
  "from-violet-100 to-purple-50",
  "from-orange-100 to-amber-50",
  "from-teal-100 to-cyan-50",
  "from-fuchsia-100 to-pink-50",
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ── Collapsible section ──

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors duration-150"
      >
        <span className="text-[15px] font-semibold text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className={`px-6 pb-5 transition-[opacity,transform] ${
              isOpen
                ? "duration-300 delay-100 opacity-100 translate-y-0"
                : "duration-200 opacity-0 translate-y-1"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lead detail drawer ──

function LeadDetailDrawer({
  lead,
  isOpen,
  onClose,
}: {
  lead: LeadDetail | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [showComposer, setShowComposer] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveReason, setArchiveReason] = useState<string | null>(null);
  const [archiveOtherText, setArchiveOtherText] = useState("");
  const [archived, setArchived] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate pre-filled template from lead data
  const firstName = lead?.name.split(" ")[0] ?? "";
  const recipientName = lead?.careRecipientName ?? "";
  const defaultTemplate = `Hi ${firstName},\n\nThank you for reaching out about care for ${recipientName}. I'd love to learn more about her needs and discuss how we can help.\n\nWould you be available for a brief call this week to talk through the details?\n\nWarm regards`;
  const [messageText, setMessageText] = useState(defaultTemplate);

  // Reset composer state when drawer closes or lead changes
  useEffect(() => {
    if (!isOpen) {
      setShowComposer(false);
      setMessageSent(false);
      setShowArchive(false);
      setArchiveReason(null);
      setArchiveOtherText("");
      setArchived(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      const fn = lead.name.split(" ")[0];
      const rn = lead.careRecipientName;
      setMessageText(`Hi ${fn},\n\nThank you for reaching out about care for ${rn}. I'd love to learn more about her needs and discuss how we can help.\n\nWould you be available for a brief call this week to talk through the details?\n\nWarm regards`);
      setShowComposer(false);
      setMessageSent(false);
      setShowArchive(false);
      setArchiveReason(null);
      setArchiveOtherText("");
      setArchived(false);
    }
  }, [lead]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showComposer) {
          setShowComposer(false);
        } else if (showArchive) {
          setShowArchive(false);
          setArchiveReason(null);
          setArchiveOtherText("");
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, showComposer, showArchive]);

  const handleSendMessage = () => {
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowComposer(false);
    }, 2000);
  };

  const handleArchive = () => {
    setArchived(true);
    setTimeout(() => {
      setArchived(false);
      setShowArchive(false);
      setArchiveReason(null);
      setArchiveOtherText("");
      onClose();
    }, 1500);
  };

  const ARCHIVE_REASONS = [
    { value: "already_connected", label: "Already connected", description: "We\u2019ve been in touch outside Olera" },
    { value: "not_a_fit", label: "Not a good fit", description: "Care needs, location, or budget don\u2019t match" },
    { value: "not_accepting", label: "Not accepting new clients", description: "We\u2019re at capacity right now" },
    { value: "unable_to_reach", label: "Unable to reach", description: "Tried contacting but no response" },
    { value: "other", label: "Other" },
  ];

  if (!lead) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 top-16 z-30 bg-black/50 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-16 right-0 z-40 h-[calc(100vh-64px)] w-[640px] max-w-[calc(100vw-24px)] bg-white shadow-2xl flex flex-col will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Fixed header ── */}
        <div className="shrink-0 border-b border-gray-100">
          {/* Lead identity + close button */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Close button — top right */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold text-gray-500">{lead.initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-display font-bold text-gray-900 tracking-tight truncate">
                    {lead.name}
                  </h2>
                  {lead.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-primary-50 text-primary-600 border border-primary-100/50 shrink-0">
                      New
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-gray-500 mt-0.5">{lead.subtitle}</p>
              </div>
            </div>

            {/* Context pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Urgency */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  lead.urgency === "immediate" ? "bg-red-400" : lead.urgency === "within_1_month" ? "bg-amber-400" : "bg-blue-400"
                }`} />
                {URGENCY_LABELS[lead.urgency]}
              </span>
              {/* Location */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {lead.location}
              </span>
              {/* Date */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {lead.date}
              </span>
              {/* Contact preference */}
              {lead.contactPreference && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {lead.contactPreference === "phone" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    )}
                  </svg>
                  {CONTACT_METHOD_LABELS[lead.contactPreference]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable middle ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">

          {/* ── Inline message composer ── */}
          {showComposer && (
            <div className="px-6 pt-5 pb-2">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {messageSent ? (
                  /* ── Confirmation state ── */
                  <div className="px-6 py-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-[15px] font-semibold text-gray-900">Message sent</p>
                    <p className="text-[13px] text-gray-500">Your message has been sent to {firstName}</p>
                  </div>
                ) : (
                  /* ── Composer form ── */
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between px-5 pt-4 pb-3">
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-900">Message {firstName}</h3>
                        <p className="text-[13px] text-gray-400 mt-0.5">
                          {lead.contactPreference ? `${CONTACT_METHOD_LABELS[lead.contactPreference]} \u00b7 ` : ""}Pre-filled template
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowComposer(false)}
                        className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150 pt-0.5"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Textarea */}
                    <div className="px-5 pb-4">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-primary-200 bg-primary-50/20 px-4 py-3.5 text-[15px] text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-150"
                      />
                    </div>

                    {/* Send button */}
                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-[15px] font-semibold text-white shadow-sm hover:bg-primary-700 transition-all duration-150 active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                        Send Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. Contact Information — 2-column with copy buttons */}
          {(lead.email || lead.phone) ? (
            <CollapsibleSection title="Contact Information">
              <div className="grid grid-cols-2 gap-x-8">
                {/* Email */}
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Email</p>
                  {lead.email ? (
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] text-gray-800 truncate">{lead.email}</p>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(lead.email!)}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-150 shrink-0"
                        title="Copy email"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[15px] text-gray-400 italic">Not provided</p>
                  )}
                </div>
                {/* Phone */}
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Phone</p>
                  {lead.phone ? (
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] text-gray-800 truncate">{lead.phone}</p>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(lead.phone!)}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-150 shrink-0"
                        title="Copy phone"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[15px] text-gray-400 italic">Not provided</p>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          ) : (
            <CollapsibleSection title="Contact Information">
              <p className="text-[15px] text-gray-400 italic">No contact information provided yet</p>
            </CollapsibleSection>
          )}

          {/* 2. Care Preferences — who needs care, type tags, needs tags */}
          <CollapsibleSection title="Care Preferences">
            {(lead.careRecipient || (lead.careType && lead.careType.length > 0) || (lead.careNeeds && lead.careNeeds.length > 0)) ? (
              <div className="space-y-5">
                {lead.careRecipient && (
                  <div>
                    <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Who needs care</p>
                    <p className="text-[15px] text-gray-800">{lead.careRecipient}</p>
                  </div>
                )}
                {lead.careType && lead.careType.length > 0 && (
                  <div>
                    <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2.5">Type of care</p>
                    <div className="flex flex-wrap gap-2">
                      {lead.careType.map((type) => (
                        <span key={type} className="inline-flex px-3.5 py-1.5 rounded-full bg-primary-50/60 border border-primary-100/40 text-[13px] font-medium text-primary-700">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {lead.careNeeds && lead.careNeeds.length > 0 && (
                  <div>
                    <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2.5">Care needs</p>
                    <div className="flex flex-wrap gap-2">
                      {lead.careNeeds.map((need) => (
                        <span key={need} className="inline-flex px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600">
                          {need}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 italic">No care preferences specified yet</p>
            )}
          </CollapsibleSection>

          {/* 3. Living Situation — 2-column grid */}
          <CollapsibleSection title="Living Situation">
            {(lead.livingSituation || lead.schedulePreference || lead.careLocation || lead.languagePreference) ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Living situation</p>
                  <p className="text-[15px] text-gray-800">{lead.livingSituation || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Schedule preference</p>
                  <p className="text-[15px] text-gray-800">{lead.schedulePreference || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Care location</p>
                  <p className="text-[15px] text-gray-800">{lead.careLocation || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Language preference</p>
                  <p className="text-[15px] text-gray-800">{lead.languagePreference || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 italic">No living situation details provided yet</p>
            )}
          </CollapsibleSection>

          {/* 4. Payment & Benefits — insurance type + benefit cards */}
          <CollapsibleSection title="Payment & Benefits">
            {(lead.insuranceType || (lead.benefits && lead.benefits.length > 0)) ? (
              <div className="space-y-5">
                <div>
                  <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Insurance</p>
                  <p className="text-[15px] text-gray-800">{lead.insuranceType || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                {lead.benefits && lead.benefits.length > 0 && (
                  <div>
                    <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-2.5">Saved benefits</p>
                    <div className="space-y-2">
                      {lead.benefits.map((benefit) => (
                        <div key={benefit} className="px-4 py-3 rounded-xl bg-gray-50/80 border border-gray-100">
                          <span className="text-[15px] text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 italic">No payment or benefits information yet</p>
            )}
          </CollapsibleSection>

          {/* 5. Additional Notes — blockquote style */}
          <CollapsibleSection title="Additional Notes">
            {lead.additionalNotes ? (
              <div className="border-l-[3px] border-primary-300 bg-primary-50/40 rounded-r-xl rounded-l-sm px-5 py-4">
                <p className="text-[15px] text-gray-700 leading-relaxed">
                  {lead.additionalNotes}
                </p>
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 italic">No additional notes</p>
            )}
          </CollapsibleSection>

          {/* 6. Activity — vertical timeline, collapsed by default */}
          <CollapsibleSection title="Activity" defaultOpen={false}>
            {lead.activity && lead.activity.length > 0 ? (
              <div className="relative pl-5">
                {/* Timeline line */}
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gray-200" />

                <div className="space-y-5">
                  {lead.activity.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-5 top-1.5 w-[9px] h-[9px] rounded-full bg-gray-300" />
                      <div>
                        <p className="text-[15px] font-medium text-gray-800">{event.label}</p>
                        <p className="text-[13px] text-gray-400 mt-0.5">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 italic">No activity yet</p>
            )}
          </CollapsibleSection>
        </div>

        {/* ── Fixed footer ── */}
        {showComposer ? null : showArchive ? (
          /* Archive reason selector */
          <div className="shrink-0 border-t border-gray-100">
            {archived ? (
              /* Archived confirmation */
              <div className="px-6 py-8 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-gray-900">Lead archived</p>
              </div>
            ) : (
              <div className="px-6 py-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-gray-900">Why are you archiving?</h3>
                  <button
                    type="button"
                    onClick={() => { setShowArchive(false); setArchiveReason(null); setArchiveOtherText(""); }}
                    className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>

                {/* Reason options */}
                <div className="space-y-2.5">
                  {ARCHIVE_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setArchiveReason(reason.value)}
                      className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 ${
                        archiveReason === reason.value
                          ? "border-primary-200 bg-primary-50/30"
                          : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                      }`}
                    >
                      {/* Radio circle */}
                      <div className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-150 ${
                        archiveReason === reason.value ? "border-primary-500" : "border-gray-300"
                      }`}>
                        {archiveReason === reason.value && (
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-gray-800">{reason.label}</p>
                        {reason.description && (
                          <p className="text-[13px] text-gray-400 mt-0.5">{reason.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Other text field */}
                {archiveReason === "other" && (
                  <textarea
                    value={archiveOtherText}
                    onChange={(e) => setArchiveOtherText(e.target.value)}
                    placeholder="Tell us more (optional)"
                    rows={2}
                    className="w-full mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-150"
                  />
                )}

                {/* Archive confirmation button — appears after selecting a reason */}
                {archiveReason && (
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-[15px] font-semibold text-white shadow-sm hover:bg-gray-800 transition-all duration-150 active:scale-[0.98]"
                  >
                    Archive Lead
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Default footer buttons */
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowArchive(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              Archive
            </button>
            <button
              type="button"
              onClick={() => { setShowComposer(true); scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-[15px] font-semibold text-white shadow-sm hover:bg-primary-700 transition-all duration-150 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              Send Message
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──

export default function ProviderLeadsPage() {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback((lead: LeadDetail) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const filteredLeads = useMemo(() => {
    let leads = MOCK_LEADS;

    if (activeFilter === "archived") {
      leads = leads.filter((l) => l.status === "archived");
    } else if (activeFilter !== "all") {
      leads = leads.filter((l) => l.urgency === activeFilter && l.status !== "archived");
    } else {
      leads = leads.filter((l) => l.status !== "archived");
    }

    return leads;
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-[28px] font-display font-bold text-gray-900 tracking-tight">
          Leads
        </h1>
        <p className="text-[15px] text-gray-500 mt-1.5 leading-relaxed">
          Families who found you and connected.
        </p>
      </div>

      {/* ── Filter tabs + Sort ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={[
                "px-5 py-2.5 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all duration-150",
                activeFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 flex items-center">
          <span className="text-sm text-gray-400 mr-2">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort leads"
              className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Leads table ── */}
      {filteredLeads.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5fr_1.2fr_1.2fr_1fr_0.8fr_0.7fr] gap-6 px-8 py-4 border-b border-gray-100">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Name</span>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Location</span>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Urgency</span>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Status</span>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Date</span>
            <span />
          </div>

          {/* Table rows */}
          {filteredLeads.map((lead, idx) => (
            <div
              key={lead.id}
              className={[
                "group grid grid-cols-[2.5fr_1.2fr_1.2fr_1fr_0.8fr_0.7fr] gap-6 items-center px-8 py-4 transition-colors duration-100 hover:bg-vanilla-50/40 cursor-pointer",
                idx < filteredLeads.length - 1 ? "border-b border-gray-100/80" : "",
              ].join(" ")}
            >
              {/* Name */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0`}>
                  <span className="text-xs font-bold text-gray-500">{lead.initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-base font-semibold text-gray-900 truncate">{lead.name}</p>
                    {lead.isNew && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-primary-50 text-primary-600 border border-primary-100/50 shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{lead.subtitle}</p>
                </div>
              </div>

              {/* Location */}
              <span className="text-[14px] font-medium text-gray-500">{lead.location}</span>

              {/* Urgency */}
              <span className="text-[14px] font-medium text-gray-500">{URGENCY_LABELS[lead.urgency]}</span>

              {/* Status */}
              <span className="text-[14px] font-medium text-gray-500">{STATUS_LABELS[lead.status]}</span>

              {/* Date */}
              <span className="text-[14px] font-medium text-gray-500">{lead.date}</span>

              {/* Action */}
              <button
                type="button"
                onClick={() => openDrawer(lead)}
                className="text-sm font-semibold text-primary-600 border border-primary-200 rounded-lg px-4 py-2.5 hover:bg-primary-50 hover:border-primary-300 hover:shadow-sm transition-all duration-150 active:scale-[0.97]"
              >
                View
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center text-center py-24 px-8">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warm-50 to-vanilla-100 border border-warm-100/60 flex items-center justify-center shadow-sm">
                <svg className="w-10 h-10 text-warm-300" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              </div>
            </div>

            <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">
              {activeFilter === "archived" ? "No archived leads" : "No leads yet"}
            </h3>
            <p className="text-[15px] text-gray-500 mt-2.5 leading-relaxed max-w-md">
              {activeFilter === "archived"
                ? "Leads you archive will appear here."
                : "When families find your profile and reach out, they\u2019ll appear here. Start connecting to get the conversation going."}
            </p>

            {activeFilter !== "archived" && (
              <Link
                href="/provider/matches"
                className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
              >
                Reach out to families looking for care
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>

      {/* ── Lead detail drawer ── */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}
