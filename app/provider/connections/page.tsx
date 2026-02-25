"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

interface LeadDetail extends Lead {
  email: string;
  phone: string;
  contactPreference: ContactMethod;
  careRecipient: string;
  careType: string[];
  careNeeds: string[];
  livingSituation: string;
  schedulePreference: string;
  careLocation: string;
  languagePreference: string;
}

// ── Mock data ──

const MOCK_LEADS: LeadDetail[] = [
  {
    id: "1", name: "Sarah Reynolds", initials: "SR", subtitle: "For her mother, 78",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "2h ago", isNew: true,
    email: "sarah.reynolds@gmail.com", phone: "(512) 555-0147", contactPreference: "phone",
    careRecipient: "Mother, 78", careType: ["In-home care", "Companionship"],
    careNeeds: ["Mobility assistance", "Medication management", "Meal preparation"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, daytime", careLocation: "Care recipient's home", languagePreference: "English",
  },
  {
    id: "2", name: "James Adeyemi", initials: "JA", subtitle: "For his father, 85",
    location: "Round Rock, TX", urgency: "within_1_month", status: "new", date: "5h ago", isNew: true,
    email: "james.adeyemi@outlook.com", phone: "(512) 555-0231", contactPreference: "email",
    careRecipient: "Father, 85", careType: ["In-home care", "Personal care"],
    careNeeds: ["Bathing assistance", "Transportation", "Light housekeeping"],
    livingSituation: "Lives with family", schedulePreference: "Flexible", careLocation: "Care recipient's home", languagePreference: "English, Yoruba",
  },
  {
    id: "3", name: "Diana Nguyen", initials: "DN", subtitle: "For her grandmother, 91",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "1d ago", isNew: true,
    email: "diana.nguyen@yahoo.com", phone: "(512) 555-0389", contactPreference: "either",
    careRecipient: "Grandmother, 91", careType: ["In-home care", "Memory care"],
    careNeeds: ["Dementia support", "24/7 supervision", "Medication management"],
    livingSituation: "Lives with family", schedulePreference: "Full-time, live-in preferred", careLocation: "Care recipient's home", languagePreference: "English, Vietnamese",
  },
  {
    id: "4", name: "Linda Washington", initials: "LW", subtitle: "For her husband, 72",
    location: "Austin, TX", urgency: "immediate", status: "replied", date: "2d ago", isNew: false,
    email: "linda.washington@gmail.com", phone: "(512) 555-0512", contactPreference: "phone",
    careRecipient: "Husband, 72", careType: ["In-home care", "Post-surgery care"],
    careNeeds: ["Physical therapy support", "Wound care", "Mobility assistance"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekdays, mornings", careLocation: "Care recipient's home", languagePreference: "English",
  },
  {
    id: "5", name: "Robert Park", initials: "RP", subtitle: "For his wife, 68",
    location: "Pflugerville, TX", urgency: "exploring", status: "replied", date: "3d ago", isNew: false,
    email: "robert.park@gmail.com", phone: "(512) 555-0678", contactPreference: "email",
    careRecipient: "Wife, 68", careType: ["Companionship", "Respite care"],
    careNeeds: ["Companionship", "Light housekeeping", "Meal preparation"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekends", careLocation: "Care recipient's home", languagePreference: "English, Korean",
  },
  {
    id: "6", name: "Maria Kowalski", initials: "MK", subtitle: "For her parents, both 80s",
    location: "Cedar Park, TX", urgency: "exploring", status: "no_reply", date: "5d ago", isNew: false,
    email: "maria.kowalski@hotmail.com", phone: "(512) 555-0845", contactPreference: "either",
    careRecipient: "Parents, both 80s", careType: ["In-home care", "Companionship"],
    careNeeds: ["Meal preparation", "Transportation", "Medication reminders"],
    livingSituation: "Live together, own home", schedulePreference: "Flexible, part-time", careLocation: "Care recipients' home", languagePreference: "English, Polish",
  },
  {
    id: "7", name: "Tomoko Chen", initials: "TC", subtitle: "For her father, 89",
    location: "Austin, TX", urgency: "within_1_month", status: "replied", date: "1w ago", isNew: false,
    email: "tomoko.chen@gmail.com", phone: "(512) 555-0923", contactPreference: "phone",
    careRecipient: "Father, 89", careType: ["In-home care", "Hospice support"],
    careNeeds: ["End-of-life care", "Pain management support", "Companionship"],
    livingSituation: "Lives with family", schedulePreference: "Full-time", careLocation: "Care recipient's home", languagePreference: "English, Mandarin",
  },
  {
    id: "8", name: "Angela Johnson", initials: "AJ", subtitle: "For herself, 66",
    location: "Georgetown, TX", urgency: "within_1_month", status: "no_reply", date: "1w ago", isNew: false,
    email: "angela.johnson@aol.com", phone: "(512) 555-0101", contactPreference: "phone",
    careRecipient: "Self, 66", careType: ["Companionship", "Personal care"],
    careNeeds: ["Companionship", "Grocery shopping", "Light exercise assistance"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, afternoons", careLocation: "Own home", languagePreference: "English",
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
          className={`w-4.5 h-4.5 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${
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
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!lead) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[600px] max-w-[calc(100vw-24px)] bg-white shadow-2xl flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Fixed header ── */}
        <div className="shrink-0 border-b border-gray-100">
          {/* Close button row */}
          <div className="flex items-center justify-end px-6 pt-5 pb-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lead identity */}
          <div className="px-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient(lead.name)} flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold text-gray-600/80">{lead.initials}</span>
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
            </div>
          </div>
        </div>

        {/* ── Scrollable middle ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact Information */}
          <CollapsibleSection title="Contact Information">
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between group/row">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-400 font-medium">Email</p>
                    <p className="text-[15px] text-gray-800 truncate">{lead.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(lead.email)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-150 opacity-0 group-hover/row:opacity-100"
                  title="Copy email"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between group/row">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-400 font-medium">Phone</p>
                    <p className="text-[15px] text-gray-800 truncate">{lead.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(lead.phone)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-150 opacity-0 group-hover/row:opacity-100"
                  title="Copy phone"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Care Preferences */}
          <CollapsibleSection title="Care Preferences">
            <div className="space-y-4">
              {/* Who needs care */}
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-1.5">Who needs care</p>
                <p className="text-[15px] text-gray-800">{lead.careRecipient}</p>
              </div>

              {/* Type of care */}
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-2">Type of care</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.careType.map((type) => (
                    <span
                      key={type}
                      className="inline-flex px-2.5 py-1 rounded-lg bg-primary-50/60 border border-primary-100/40 text-[13px] font-medium text-primary-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Care needs */}
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-2">Care needs</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.careNeeds.map((need) => (
                    <span
                      key={need}
                      className="inline-flex px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Living Situation */}
          <CollapsibleSection title="Living Situation">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-1">Living situation</p>
                <p className="text-[15px] text-gray-800">{lead.livingSituation}</p>
              </div>
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-1">Schedule preference</p>
                <p className="text-[15px] text-gray-800">{lead.schedulePreference}</p>
              </div>
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-1">Care location</p>
                <p className="text-[15px] text-gray-800">{lead.careLocation}</p>
              </div>
              <div>
                <p className="text-[13px] text-gray-400 font-medium mb-1">Language preference</p>
                <p className="text-[15px] text-gray-800">{lead.languagePreference}</p>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ── Fixed footer ── */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-[0.98]"
          >
            Archive
          </button>
          <button
            type="button"
            className="flex-1 px-5 py-3 rounded-xl bg-primary-600 text-[15px] font-semibold text-white shadow-sm hover:bg-primary-700 transition-all duration-150 active:scale-[0.98]"
          >
            Send Message
          </button>
        </div>
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
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Name</span>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Location</span>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Urgency</span>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Status</span>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Date</span>
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
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(lead.name)} flex items-center justify-center shrink-0`}>
                  <span className="text-xs font-bold text-gray-600/80">{lead.initials}</span>
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
              <span className="text-base text-gray-700">{lead.location}</span>

              {/* Urgency */}
              <span className="text-base text-gray-700">{URGENCY_LABELS[lead.urgency]}</span>

              {/* Status */}
              <span className="text-base text-gray-700">{STATUS_LABELS[lead.status]}</span>

              {/* Date */}
              <span className="text-base text-gray-700">{lead.date}</span>

              {/* Action */}
              <button
                type="button"
                onClick={() => openDrawer(lead)}
                className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-white hover:border-gray-300 hover:text-gray-900 hover:shadow-sm transition-all duration-150 active:scale-[0.97]"
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
