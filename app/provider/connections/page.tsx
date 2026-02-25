"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Types ──

type TimelineFilter = "all" | "immediate" | "within_1_month" | "exploring" | "archived";
type SortOption = "best_match" | "most_recent" | "most_urgent";
type LeadStatus = "new" | "replied" | "no_reply" | "archived";
type Urgency = "immediate" | "within_1_month" | "exploring";

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

// ── Mock data ──

const MOCK_LEADS: Lead[] = [
  { id: "1", name: "Sarah Reynolds",    initials: "SR", subtitle: "For her mother, 78",       location: "Austin, TX",        urgency: "immediate",      status: "new",      date: "2h ago",  isNew: true },
  { id: "2", name: "James Adeyemi",     initials: "JA", subtitle: "For his father, 85",       location: "Round Rock, TX",    urgency: "within_1_month",  status: "new",      date: "5h ago",  isNew: true },
  { id: "3", name: "Diana Nguyen",      initials: "DN", subtitle: "For her grandmother, 91",  location: "Austin, TX",        urgency: "immediate",      status: "new",      date: "1d ago",  isNew: true },
  { id: "4", name: "Linda Washington",  initials: "LW", subtitle: "For her husband, 72",      location: "Austin, TX",        urgency: "immediate",      status: "replied",  date: "2d ago",  isNew: false },
  { id: "5", name: "Robert Park",       initials: "RP", subtitle: "For his wife, 68",         location: "Pflugerville, TX",  urgency: "exploring",      status: "replied",  date: "3d ago",  isNew: false },
  { id: "6", name: "Maria Kowalski",    initials: "MK", subtitle: "For her parents, both 80s",location: "Cedar Park, TX",    urgency: "exploring",      status: "no_reply", date: "5d ago",  isNew: false },
  { id: "7", name: "Tomoko Chen",       initials: "TC", subtitle: "For her father, 89",       location: "Austin, TX",        urgency: "within_1_month",  status: "replied",  date: "1w ago",  isNew: false },
  { id: "8", name: "Angela Johnson",    initials: "AJ", subtitle: "For herself, 66",          location: "Georgetown, TX",    urgency: "within_1_month",  status: "no_reply", date: "1w ago",  isNew: false },
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

// ── Page ──

export default function ProviderLeadsPage() {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");

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
          <div className="grid grid-cols-[1fr_140px_140px_100px_90px_80px] gap-4 px-7 py-4 border-b border-gray-100 bg-gray-50/40">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Name</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Urgency</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Date</span>
            <span />
          </div>

          {/* Table rows */}
          {filteredLeads.map((lead, idx) => (
            <div
              key={lead.id}
              className={[
                "grid grid-cols-[1fr_140px_140px_100px_90px_80px] gap-4 items-center px-7 py-5 transition-colors hover:bg-gray-50/40",
                idx < filteredLeads.length - 1 ? "border-b border-gray-100" : "",
              ].join(" ")}
            >
              {/* Name */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gray-500">{lead.initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">{lead.name}</p>
                    {lead.isNew && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-600 border border-primary-100/60 shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500 truncate mt-0.5">{lead.subtitle}</p>
                </div>
              </div>

              {/* Location */}
              <span className="text-[13px] text-gray-600">{lead.location}</span>

              {/* Urgency */}
              <span className="text-[13px] text-gray-700 font-medium">{URGENCY_LABELS[lead.urgency]}</span>

              {/* Status */}
              <span className="text-[13px] text-gray-600">{STATUS_LABELS[lead.status]}</span>

              {/* Date */}
              <span className="text-[13px] text-gray-400">{lead.date}</span>

              {/* Action */}
              <button
                type="button"
                className="text-[13px] font-semibold text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
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
    </div>
  );
}
