"use client";

import { useState, useEffect, useCallback } from "react";
import { BENEFIT_CATEGORIES, CARE_PREFERENCES, INCOME_RANGES, MEDICAID_STATUSES, PRIMARY_NEEDS } from "@/lib/types/benefits";
import type { BenefitsIntakeAnswers, BenefitMatch, BenefitCategory, AreaAgency } from "@/lib/types/benefits";
import { getEstimatedSavings, getSavingsRange, getProgramEffort, EFFORT_CONFIG } from "@/lib/types/benefits";
import type { EffortLevel } from "@/lib/types/benefits";

interface BenefitsReportHeaderProps {
  programCount: number;
  answers: BenefitsIntakeAnswers;
  locationDisplay: string;
  matchedPrograms: BenefitMatch[];
  userName: string | null;
  onShare: () => void;
  shareLabel: "share" | "copied";
  onEditAnswers?: () => void;
  localAAA?: AreaAgency | null;
}

const TABS = [
  { id: "overview" as const, label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "programs" as const, label: "Programs", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "action-plan" as const, label: "Action Plan", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "spend-down" as const, label: "Spend-Down", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];


type TabId = typeof TABS[number]["id"];

export default function BenefitsReportHeader({
  programCount,
  answers,
  locationDisplay,
  matchedPrograms,
  userName,
  onShare,
  shareLabel,
  onEditAnswers,
  localAAA,
}: BenefitsReportHeaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedProgram, setSelectedProgram] = useState<BenefitMatch | null>(null);
  const [programFilter, setProgramFilter] = useState<BenefitCategory | "all">("all");
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [programsVisible, setProgramsVisible] = useState(5);
  const [showSpendDown, setShowSpendDown] = useState(false);

  // Listen for sidebar tab switch events
  const handleTabSwitch = useCallback((e: Event) => {
    const tab = (e as CustomEvent).detail as TabId;
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    window.addEventListener("benefits:switch-tab", handleTabSwitch);
    return () => window.removeEventListener("benefits:switch-tab", handleTabSwitch);
  }, [handleTabSwitch]);

  async function handleEmailPackage() {
    if (!email) return;
    setEmailError("");
    setEmailSending(true);
    try {
      const res = await fetch("/api/benefits/email-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          programName: "Benefits Package",
          programShortName: "package",
          stateName: locationDisplay,
          checked: [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setEmailSending(false);
    }
  }

  // Compute total estimated savings
  let totalMonthly = 0;
  for (const m of matchedPrograms) {
    const s = getEstimatedSavings(m.program.name);
    if (s) totalMonthly += s.monthly;
  }
  const totalAnnual = totalMonthly * 12;

  const spendDownCount = matchedPrograms.filter((m) => m.spendDown).length;

  const careSetting =
    answers.carePreference && answers.carePreference !== "unsure"
      ? CARE_PREFERENCES[answers.carePreference].displayTitle
      : null;

  const needsDisplay =
    answers.primaryNeeds.length > 0
      ? PRIMARY_NEEDS[answers.primaryNeeds[0]]?.displayTitle ?? null
      : null;

  const incomeDisplay = answers.incomeRange
    ? INCOME_RANGES[answers.incomeRange].displayTitle
    : null;

  const medicaidDisplay = answers.medicaidStatus
    ? MEDICAID_STATUSES[answers.medicaidStatus].shortTitle
    : null;

  // Programs tab data
  const presentCategories = Array.from(
    new Set(matchedPrograms.map((m) => m.program.category))
  );
  const filteredPrograms = programFilter === "all"
    ? matchedPrograms
    : matchedPrograms.filter((m) => m.program.category === programFilter);

  return (
    <div className="mb-8 print:mb-6">

      <div className="relative" style={{ perspective: "1200px" }}>
        {/* Drop shadow — larger, more realistic */}
        <div
          className="absolute -bottom-6 left-4 right-0 h-10 rounded-[50%] opacity-40"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        <div className="relative">
          {/* Right edge — stacked pages */}
          <div
            className="hidden md:block absolute top-[3px] -right-[20px] bottom-[3px] w-[20px]"
            style={{ zIndex: 1 }}
          >
            {/* Page stack — cream pages */}
            <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden rounded-r-[3px]" style={{ background: "#f5f3ef", boxShadow: "3px 2px 8px rgba(0,0,0,0.12)" }}>
              {/* Cream/off-white page surface */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #faf8f5 0%, #f5f2ec 30%, #efe9e2 60%, #e8e3db 100%)" }} />
              {/* Page edge lines */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="absolute top-[4px] bottom-[4px]" style={{
                  left: `${i * 0.9}px`,
                  width: "1px",
                  background: i % 4 === 0 ? "rgba(160,150,135,0.5)" : i % 2 === 0 ? "rgba(170,160,145,0.3)" : "rgba(180,170,155,0.15)",
                }} />
              ))}
              {/* Inner shadow for depth */}
              <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.08), transparent)" }} />
            </div>
          </div>

          {/* Bottom edge — stacked pages */}
          <div
            className="hidden md:block absolute -bottom-[18px] left-[3px] right-[3px] h-[18px]"
            style={{ zIndex: 1 }}
          >
            {/* Page stack — cream pages */}
            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-b-[3px]" style={{ background: "#f5f3ef", boxShadow: "0 4px 10px rgba(0,0,0,0.12)" }}>
              {/* Cream/off-white page surface */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #faf8f5 0%, #f5f2ec 30%, #efe9e2 60%, #e8e3db 100%)" }} />
              {/* Page edge lines */}
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="absolute left-[4px] right-[4px]" style={{
                  top: `${i * 1}px`,
                  height: "1px",
                  background: i % 4 === 0 ? "rgba(160,150,135,0.5)" : i % 2 === 0 ? "rgba(170,160,145,0.3)" : "rgba(180,170,155,0.15)",
                }} />
              ))}
              {/* Inner shadow for depth */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)" }} />
            </div>
          </div>

          {/* Corner piece — right pages meet bottom pages */}
          <div className="hidden md:block absolute -bottom-[18px] -right-[20px] w-[20px] h-[18px] rounded-br-[3px] overflow-hidden" style={{ zIndex: 1, background: "linear-gradient(135deg, #efe9e2 0%, #e8e3db 100%)", boxShadow: "3px 4px 10px rgba(0,0,0,0.1)" }} />

          {/* Main card */}
          <div
            className="relative overflow-hidden rounded-xl border border-gray-200/60"
            style={{ zIndex: 2, background: "linear-gradient(170deg, #ffffff 0%, #fdfcfb 40%, #faf9f7 100%)", boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-primary-800 text-white">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary-200">Olera Benefits Package</span>
              <div className="flex items-center gap-3 text-xs text-primary-300">
                <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <div className="flex items-center gap-1.5 print:hidden">
                  <button onClick={() => window.print()} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-primary-200 p-1" aria-label="Print">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 3.75H5.25" />
                    </svg>
                  </button>
                  <button onClick={onShare} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-primary-200 p-1" aria-label="Share">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div id="benefits-report-tabs" className="relative border-b border-gray-200 bg-gray-50/80 overflow-x-auto scrollbar-hide">
              <div className="flex min-w-max">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isSpendDown = tab.id === "spend-down";
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setSelectedProgram(null); setShowSpendDown(false); }}
                      className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium border-none cursor-pointer transition-all ${
                        isActive
                          ? isSpendDown
                            ? "bg-amber-50 text-amber-900 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
                            : "bg-white text-gray-900 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
                          : isSpendDown
                            ? "bg-transparent text-amber-500 hover:text-amber-700 hover:bg-amber-50/60"
                            : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/60"
                      }`}
                      style={isActive ? { borderRadius: "8px 8px 0 0", marginBottom: "-1px", borderBottom: isSpendDown ? "1px solid #FFFAEB" : "1px solid white", zIndex: 1 } : { borderRadius: "8px 8px 0 0" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                      </svg>
                      {tab.label}
                      {tab.id === "programs" && (
                        <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-700">
                          {programCount}
                        </span>
                      )}
                      {isActive && <span className={`absolute top-0 left-0 right-0 h-0.5 rounded-t ${isSpendDown ? "bg-amber-500" : "bg-primary-600"}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === "overview" && (
              <div className="px-6 md:px-8 py-8">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 leading-snug tracking-tight mb-3">
                  Your Olera Benefits Package
                </h2>
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl mb-8">
                  You&apos;ve unlocked access to benefits most families never find. We&apos;ve created a personalized roadmap to claim every dollar you deserve.
                </p>

                {/* Savings */}
                <div className="bg-success-50 border border-success-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-success-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="font-bold text-gray-900">Your savings at a glance</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {totalAnnual > 0 && (
                      <div className="bg-white rounded-xl p-4 text-center border border-success-100">
                        <p className="text-2xl font-bold text-primary-600">${totalAnnual.toLocaleString()}/yr</p>
                        <p className="text-base font-semibold text-gray-700 mt-1">${totalMonthly.toLocaleString()}/mo</p>
                        <p className="text-xs font-medium text-primary-500 mt-1">Est. savings</p>
                      </div>
                    )}
                    <button
                      onClick={() => setActiveTab("programs")}
                      className="group bg-white rounded-xl p-4 text-center border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg cursor-pointer transition-all w-full"
                    >
                      <p className="text-2xl font-bold text-gray-900">{programCount}</p>
                      <p className="text-xs text-gray-500 mt-1">Programs you qualify for</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                        View all
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </button>
                    {spendDownCount > 0 && (
                      <button
                        onClick={() => { setShowSpendDown(true); setActiveTab("programs"); }}
                        className="group bg-white rounded-xl p-4 text-center border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg cursor-pointer transition-all"
                      >
                        <p className="text-2xl font-bold text-amber-600">{spendDownCount}</p>
                        <p className="text-xs text-gray-500 mt-1">Possible with spend-down</p>
                        <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
                          View all
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Care Profile */}
                <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/60 to-white p-5 shadow-[0_2px_12px_rgba(25,144,135,0.08)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary-500 rounded-full" />
                      <p className="text-xs font-semibold text-primary-700 tracking-widest uppercase">Olera Care Profile</p>
                    </div>
                    {onEditAnswers && (
                      <button onClick={onEditAnswers} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-white hover:bg-primary-50 rounded-lg border border-primary-200 cursor-pointer transition-colors print:hidden">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit answers
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {locationDisplay && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Location</p><p className="text-sm font-semibold text-gray-900">{locationDisplay}</p></div>
                      </div>
                    )}
                    {answers.age && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Age</p><p className="text-sm font-semibold text-gray-900">{answers.age} years old</p></div>
                      </div>
                    )}
                    {careSetting && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Care Setting</p><p className="text-sm font-semibold text-gray-900">{careSetting}</p></div>
                      </div>
                    )}
                    {needsDisplay && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Needs</p><p className="text-sm font-semibold text-gray-900">{needsDisplay}</p></div>
                      </div>
                    )}
                    {incomeDisplay && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Income</p><p className="text-sm font-semibold text-gray-900">{incomeDisplay}</p></div>
                      </div>
                    )}
                    {medicaidDisplay && (
                      <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Medicaid</p><p className="text-sm font-semibold text-gray-900">{medicaidDisplay}</p></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email CTA */}
                <div className="mt-8 rounded-2xl overflow-hidden print:hidden bg-primary-50 border border-primary-100">
                  <div className="px-6 md:px-10 py-8 md:py-10 text-center">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-gray-900 mb-2">Get Your Full Benefits Package</h3>
                    <p className="text-base text-gray-700 mb-6 max-w-md mx-auto">Get your {totalAnnual > 0 && <span className="font-bold text-gray-900">${totalAnnual.toLocaleString()}</span>} benefits package emailed to you, including exactly how to apply for each program.</p>
                    {emailSent ? (
                      <div className="inline-flex items-center gap-2 bg-success-50 border border-success-200 rounded-full px-6 py-3">
                        <svg className="w-5 h-5 text-success-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <p className="text-sm font-medium text-success-700">Package sent! Check your inbox.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 max-w-md mx-auto">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-5 py-3.5 bg-white border border-primary-200 rounded-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" onKeyDown={(e) => e.key === "Enter" && handleEmailPackage()} />
                        <button onClick={handleEmailPackage} disabled={emailSending} className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-700 text-white text-sm font-semibold rounded-full hover:bg-primary-800 active:bg-primary-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0 border-none cursor-pointer shadow-md">
                          {emailSending ? "Sending..." : "Send"}
                          {!emailSending && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                        </button>
                      </div>
                    )}
                    {emailError && <p className="mt-3 text-sm text-error-600">{emailError}</p>}
                  </div>
                </div>

                {/* CTA to programs tab */}
                <div className="mt-8 flex justify-center print:hidden">
                  <button
                    onClick={() => setActiveTab("programs")}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white text-sm font-semibold rounded-xl border-none cursor-pointer transition-all min-h-[48px] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
                    style={{
                      boxShadow: "0 4px 0 0 var(--color-primary-900), 0 6px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    See your {programCount} matched programs
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>

                {/* Next page */}
                <div className="mt-6 flex justify-end print:hidden">
                  <button
                    onClick={() => setActiveTab("programs")}
                    className="group inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all hover:translate-x-0.5"
                  >
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Programs</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ SPEND-DOWN VIEW ═══ */}
            {activeTab === "programs" && showSpendDown && !selectedProgram && (
              <div className="px-6 md:px-8 py-8">
                <button
                  onClick={() => setShowSpendDown(false)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 bg-transparent border-none cursor-pointer mb-6 p-0 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back to all programs
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">Possible with Spend-Down</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className="text-sm text-gray-500">{spendDownCount} program{spendDownCount !== 1 ? "s" : ""} you may qualify for by spending down excess income.</p>
                  <a
                    href={`/benefits/spend-down-calculator${answers.stateCode ? `?state=${answers.stateCode}` : ""}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors no-underline shadow-sm shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                    Spend-down calculator
                  </a>
                </div>

                {/* What is spend-down explainer */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-bold text-amber-800 mb-1">What is spend-down?</h3>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    If your income is slightly above a program&apos;s limit, you may still qualify by &ldquo;spending down&rdquo; the excess on medical bills, prescriptions, or care costs. Once your remaining income falls below the threshold, you become eligible. A benefits counselor can help you determine if this applies to you.
                  </p>
                </div>

                {/* Spend-down program list */}
                <div className="flex flex-col gap-3">
                  {matchedPrograms
                    .filter((m) => m.spendDown)
                    .sort((a, b) => {
                      const aSavings = getSavingsRange(a.program.name)?.high ?? 0;
                      const bSavings = getSavingsRange(b.program.name)?.high ?? 0;
                      return bSavings - aSavings;
                    })
                    .map((m) => {
                      const savings = getSavingsRange(m.program.name);
                      const isState = !!m.program.state_code;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-4 bg-white rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all px-5 py-4 cursor-pointer"
                          onClick={() => { setSelectedProgram(m); }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-display text-sm font-bold text-gray-900 truncate">{m.program.name}</h3>
                              <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isState ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-primary-50 text-primary-700 border border-primary-100"}`}>
                                {isState ? "State" : "Federal"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{m.program.description}</p>
                            <div className="flex items-center gap-3">
                              {savings && (
                                <span className="text-xs font-semibold text-success-700">
                                  Save ${savings.low.toLocaleString()} – ${savings.high.toLocaleString()}/yr
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Spend-down eligible</span>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ═══ PROGRAMS TAB ═══ */}
            {activeTab === "programs" && !showSpendDown && !selectedProgram && (
              <div className="px-6 md:px-8 py-8">
                {(() => {
                  const categoryLabels: Record<string, { label: string; icon: string }> = {
                    income: { label: "Financial Help", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                    food: { label: "Food & Nutrition", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
                    healthcare: { label: "Health Coverage", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                    caregiver: { label: "Caregiver Support", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                    housing: { label: "Housing Assistance", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                    all: { label: "Available Programs", icon: "" },
                  };
                  const cat = categoryLabels[programFilter] || categoryLabels.all;
                  const count = filteredPrograms.length;
                  const totalSavings = filteredPrograms.reduce((acc, m) => {
                    const s = getSavingsRange(m.program.name);
                    return { low: acc.low + (s?.low ?? 0), high: acc.high + (s?.high ?? 0) };
                  }, { low: 0, high: 0 });
                  return (
                    <>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        {cat.icon && (
                          <svg className="w-8 h-8 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                          </svg>
                        )}
                        {cat.label}
                      </h2>
                      <p className="text-sm text-gray-500 mb-6">
                        {count} program{count !== 1 ? "s" : ""} matched
                        {totalSavings.high > 0 && (
                          <> · Estimated savings: <span className="font-semibold text-success-700">${totalSavings.low.toLocaleString()} – ${totalSavings.high.toLocaleString()}/year</span></>
                        )}
                      </p>
                    </>
                  );
                })()}

                {/* Category filter pills */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {([
                    { id: "income" as BenefitCategory, label: "Financial Help", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { id: "food" as BenefitCategory, label: "Food & Nutrition", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
                    { id: "healthcare" as BenefitCategory, label: "Health Coverage", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                    { id: "caregiver" as BenefitCategory, label: "Caregiver Support", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                  ]).filter((tab) => presentCategories.includes(tab.id)).map(({ id: cat, label, icon }) => {
                    const isActive = programFilter === cat;
                    const count = matchedPrograms.filter((m) => m.program.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setProgramFilter(isActive ? "all" : cat as BenefitCategory | "all")}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary-800 text-white border-primary-800 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <svg className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                        {label}
                        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Program cards — grouped by effort level */}
                {(() => {
                  // Sort by effort (easy first), then by savings within each group
                  const sorted = filteredPrograms.slice().sort((a, b) => {
                    const aEffort = EFFORT_CONFIG[getProgramEffort(a.program.name)].sortOrder;
                    const bEffort = EFFORT_CONFIG[getProgramEffort(b.program.name)].sortOrder;
                    if (aEffort !== bEffort) return aEffort - bEffort;
                    const aSavings = getSavingsRange(a.program.name)?.high ?? 0;
                    const bSavings = getSavingsRange(b.program.name)?.high ?? 0;
                    return bSavings - aSavings;
                  });

                  const groups: { level: EffortLevel; programs: typeof sorted }[] = [];
                  for (const level of ["quick", "plan"] as EffortLevel[]) {
                    const progs = sorted.filter((m) => getProgramEffort(m.program.name) === level);
                    if (progs.length > 0) groups.push({ level, programs: progs });
                  }

                  return groups.map(({ level, programs: progs }) => {
                    return (
                      <div key={level} className="mb-6">
                        <div className="flex flex-col gap-3">
                          {progs.map((m) => {
                            const savings = getSavingsRange(m.program.name);
                            const isState = !!m.program.state_code;
                            const effort = EFFORT_CONFIG[getProgramEffort(m.program.name)];
                            return (
                              <div
                                key={m.id}
                                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all px-5 py-4"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-display text-sm font-bold text-gray-900 truncate">
                                      {m.program.name}
                                    </h3>
                                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isState ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-primary-50 text-primary-700 border border-primary-100"}`}>
                                      {isState ? "State" : "Federal"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mb-1">{m.program.description}</p>
                                  <div className="flex items-center gap-2">
                                    {savings && (
                                      <span className="text-xs font-semibold text-success-700">
                                        Save ${savings.low.toLocaleString()} – ${savings.high.toLocaleString()}/yr
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${effort.bg} ${effort.color} ${effort.border} border`}>
                                      {effort.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <button
                                    onClick={() => setSelectedProgram(m)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-700 text-xs font-medium rounded-lg border border-gray-200 hover:border-primary-200 cursor-pointer transition-all"
                                  >
                                    Learn more
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Next page */}
                <div className="mt-8 flex justify-end print:hidden">
                  <button
                    onClick={() => setActiveTab("action-plan")}
                    className="group inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all hover:translate-x-0.5"
                  >
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Action Plan</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ PROGRAM DETAIL VIEW ═══ */}
            {activeTab === "programs" && selectedProgram && (
              <div className="px-6 md:px-8 py-8">
                {/* Back button */}
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 bg-transparent border-none cursor-pointer mb-6 p-0 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back to all programs
                </button>

                {/* Program header */}
                <div className="mb-8">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3 ${selectedProgram.program.state_code ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-primary-50 text-primary-700 border border-primary-100"}`}>
                    {selectedProgram.program.state_code ? "State" : "Federal"}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {selectedProgram.program.name}
                  </h2>
                  {(() => {
                    const savings = getSavingsRange(selectedProgram.program.name);
                    const waitTimes: Record<string, string> = {
                      "Medicaid": "30–45 days",
                      "Medicaid for Aged, Blind and Disabled": "30–90 days",
                      "Medicaid Home & Community-Based Services (HCBS)": "30–90 days (waitlist may apply)",
                      "Medicare Extra Help (Low Income Subsidy)": "14–30 days",
                      "Qualified Medicare Beneficiary (QMB) Program": "30–45 days",
                      "Specified Low-Income Medicare Beneficiary (SLMB)": "30–45 days",
                      "Qualifying Individual (QI) Program": "30–45 days",
                      "State Supplemental Security Income (SSI) Supplement": "30–60 days",
                      "VA Aid and Attendance Benefit": "90–180 days",
                      "VA Housebound Allowance": "90–180 days",
                      "Older Americans Act Nutrition Program (Meals on Wheels)": "1–2 weeks",
                      "Senior Transportation Assistance": "1–2 weeks",
                      "Benefits Enrollment Counseling": "1–2 weeks",
                      "State Health Insurance Assistance Program (SHIP)": "1–2 weeks",
                      "Program of All-Inclusive Care for the Elderly (PACE)": "30–60 days",
                      "Elderly Pharmaceutical Insurance Coverage (EPIC)": "14–30 days",
                    };
                    const waitTime = waitTimes[selectedProgram.program.name] || "30–45 days";
                    return (
                      <>
                        {savings && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                            </div>
                            <p className="text-sm font-semibold text-success-700">Save ${savings.low.toLocaleString()} – ${savings.high.toLocaleString()}/year</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <p className="text-xs font-semibold text-amber-600">Expected wait: {waitTime}</p>
                        </div>
                      </>
                    );
                  })()}

                  {/* Match score bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${selectedProgram.matchScore}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-primary-700">{selectedProgram.tierLabel} · {selectedProgram.matchScore}%</span>
                  </div>

                  <p className="text-base text-gray-600 leading-relaxed">{selectedProgram.program.description}</p>
                </div>

                {/* Eligibility — combined with check marks for met requirements */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Eligibility</h3>
                  <div className="space-y-3">
                    {(() => {
                      const reasonsLower = selectedProgram.matchReasons.map(r => r.toLowerCase());
                      const requirements: { label: string; met: boolean }[] = [];

                      if (selectedProgram.program.min_age != null) {
                        requirements.push({
                          label: `Age ${selectedProgram.program.min_age} or older`,
                          met: reasonsLower.some(r => r.includes("age")),
                        });
                      }
                      if (selectedProgram.program.max_income_single != null) {
                        requirements.push({
                          label: `Income below $${selectedProgram.program.max_income_single.toLocaleString()}/month`,
                          met: reasonsLower.some(r => r.includes("income")),
                        });
                      }
                      if (selectedProgram.program.requires_medicaid) {
                        requirements.push({
                          label: "Enrolled in Medicaid",
                          met: reasonsLower.some(r => r.includes("medicaid")),
                        });
                      }
                      if (selectedProgram.program.requires_medicare) {
                        requirements.push({
                          label: "Enrolled in Medicare",
                          met: reasonsLower.some(r => r.includes("medicare")),
                        });
                      }
                      if (selectedProgram.program.requires_disability) {
                        requirements.push({
                          label: "Meets disability requirements",
                          met: reasonsLower.some(r => r.includes("disab")),
                        });
                      }
                      if (selectedProgram.program.requires_veteran) {
                        requirements.push({
                          label: "Veteran status",
                          met: reasonsLower.some(r => r.includes("veteran")),
                        });
                      }

                      // Add any match reasons that aren't covered by the structured requirements
                      selectedProgram.matchReasons.forEach(reason => {
                        const covered = requirements.some(req => {
                          const rl = reason.toLowerCase();
                          return rl.includes("age") || rl.includes("income") || rl.includes("medicaid") || rl.includes("medicare") || rl.includes("disab") || rl.includes("veteran");
                        });
                        if (!covered) {
                          requirements.push({ label: reason, met: true });
                        }
                      });

                      return requirements.map((req) => (
                        <div key={req.label} className={`flex items-center gap-3 p-3 rounded-lg ${req.met ? "bg-success-50 border border-success-200" : "bg-gray-50 border border-gray-200"}`}>
                          {req.met ? (
                            <svg className="w-5 h-5 text-success-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${req.met ? "text-gray-900" : "text-gray-500"}`}>{req.label}</span>
                          {req.met && <span className="ml-auto text-xs font-semibold text-success-600">Meets requirement</span>}
                        </div>
                      ));
                    })()}
                  </div>
                  {selectedProgram.spendDown && (
                    <p className="mt-3 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg p-3">
                      You may qualify through spend-down even if your income is above the limit.
                    </p>
                  )}
                </div>

                {/* Spend-down CTA (replaces How to Apply for spend-down programs) */}
                {selectedProgram.spendDown && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H15.75v-.008zm0 2.25h.008v.008H15.75V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">You may qualify through spend-down</h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                          Your income is above the limit, but you could qualify by deducting medical and care expenses. Our calculator can show you exactly how much you&apos;d need to spend down.
                        </p>
                        <a
                          href={`/benefits/spend-down-calculator${answers.stateCode ? `?state=${answers.stateCode}` : ""}`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors no-underline shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H15.75v-.008zm0 2.25h.008v.008H15.75V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                          Try our spend-down calculator
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step-by-step: How to Apply (hidden for spend-down programs) */}
                {!selectedProgram.spendDown && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">How to Apply</h3>
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">1</div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Gather your documents</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Have your ID, Social Security card, proof of income, and proof of residence ready before applying.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">2</div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {selectedProgram.program.application_url ? "Apply online or by phone" : "Call to apply"}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {selectedProgram.program.application_url
                            ? "You can submit your application online or call the number below for assistance."
                            : "Call the number below to start your application. A representative will walk you through the process."
                          }
                        </p>
                        {selectedProgram.program.phone && (
                          <a href={`tel:${selectedProgram.program.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            {selectedProgram.program.phone}
                          </a>
                        )}
                        {selectedProgram.program.what_to_say && (
                          <div className="mt-3 bg-vanilla-50 border border-vanilla-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-900 mb-1">What to say when you call</p>
                            <p className="text-xs text-gray-600 leading-relaxed italic">&ldquo;{selectedProgram.program.what_to_say}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">3</div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Complete your interview</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Most programs require a phone or in-person interview. The representative will schedule this when you apply.</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">4</div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Receive your determination</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">You&apos;ll receive a letter with the decision, usually within 30–45 days. If denied, you have the right to appeal.</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {selectedProgram.program.application_url && (
                      <a
                        href={selectedProgram.program.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors no-underline"
                      >
                        Apply Online
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                    {selectedProgram.program.website && (
                      <a
                        href={selectedProgram.program.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-colors no-underline ${selectedProgram.program.application_url ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-primary-600 text-white hover:bg-primary-700"}`}
                      >
                        Visit Program Website
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                    <a
                      href="https://eldercare.acl.gov/resources"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-colors no-underline bg-vanilla-100 text-primary-700 border border-primary-200 hover:bg-vanilla-200"
                    >
                      Find your local Area Agency on Aging &rarr;
                    </a>
                  </div>
                </div>
                )}

                {/* Closest facility to you — only for AAA-relevant programs */}
                {localAAA && (() => {
                  const name = selectedProgram.program.name.toLowerCase();
                  const isAAARelevant = ["counseling", "meals", "nutrition", "transportation", "ombudsman", "ship", "senior companion", "respite", "legal services", "benefits check", "benefits enrollment"].some(k => name.includes(k));
                  return isAAARelevant;
                })() && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-primary-800 uppercase tracking-wider">Closest facility to you</p>
                        <h4 className="text-sm font-bold text-gray-900">{localAAA.name}</h4>
                        {localAAA.city && localAAA.state_code && (
                          <p className="text-xs text-gray-500">{localAAA.city}, {localAAA.state_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 ml-11">
                      {localAAA.phone && (
                        <a href={`tel:${localAAA.phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {localAAA.phone}
                        </a>
                      )}
                      {localAAA.website && (
                        <a href={localAAA.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          Visit website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ACTION PLAN TAB ═══ */}
            {activeTab === "action-plan" && (
              <div className="px-6 md:px-8 py-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your Action Plan</h2>
                <p className="text-sm text-gray-500 mb-8">Your personalized steps to claim every benefit you qualify for, organized by what to do first.</p>

                {(() => {
                  // Sort all programs by savings descending
                  const sorted = matchedPrograms
                    .slice()
                    .sort((a, b) => {
                      const aSavings = getSavingsRange(a.program.name)?.high ?? 0;
                      const bSavings = getSavingsRange(b.program.name)?.high ?? 0;
                      return bSavings - aSavings;
                    });

                  // Tier 1: Has application_url (easy online apply) — top 3
                  const applyFirst = sorted.filter((m) => m.program.application_url && m.matchScore >= 70).slice(0, 3);
                  // Tier 2: Phone-only, decent match — top 3
                  const applyNext = sorted.filter(
                    (m) => !m.program.application_url && m.matchScore >= 50 && !m.program.requires_disability
                  ).slice(0, 3);
                  // Tier 3: Everything else — top 3
                  const usedIds = new Set([...applyFirst.map(m => m.id), ...applyNext.map(m => m.id)]);
                  const exploreWithCounselor = sorted.filter((m) => !usedIds.has(m.id)).slice(0, 3);

                  const tiers = [
                    {
                      title: "Apply for these first",
                      subtitle: "Highest value, easiest to get",
                      color: "bg-success-50 border-success-200",
                      badgeColor: "bg-success-100 text-success-700",
                      iconColor: "text-success-600",
                      icon: "M13 10V3L4 14h7v7l9-11h-7z",
                      programs: applyFirst,
                    },
                    {
                      title: "Apply for these next",
                      subtitle: "Medium effort, worth pursuing",
                      color: "bg-amber-50 border-amber-200",
                      badgeColor: "bg-amber-100 text-amber-700",
                      iconColor: "text-amber-600",
                      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      programs: applyNext,
                    },
                    {
                      title: "Explore with a counselor",
                      subtitle: "Complex programs, a benefits counselor can help",
                      color: "bg-purple-50 border-purple-200",
                      badgeColor: "bg-purple-100 text-purple-700",
                      iconColor: "text-purple-600",
                      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                      programs: exploreWithCounselor,
                    },
                  ];

                  return (
                    <div className="space-y-8">
                      {tiers.map((tier) => {
                        if (tier.programs.length === 0) return null;
                        const tierSavings = tier.programs.reduce((acc, m) => {
                          const s = getSavingsRange(m.program.name);
                          return { low: acc.low + (s?.low ?? 0), high: acc.high + (s?.high ?? 0) };
                        }, { low: 0, high: 0 });
                        return (
                          <div key={tier.title}>
                            {/* Tier header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tier.badgeColor}`}>
                                <svg className={`w-4 h-4 ${tier.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d={tier.icon} />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">{tier.title}</h3>
                                <p className="text-xs text-gray-500">{tier.subtitle}</p>
                              </div>
                              {tierSavings.high > 0 && (
                                <span className="ml-auto text-xs font-semibold text-success-700 bg-success-50 border border-success-200 px-2.5 py-1 rounded-full">
                                  ${tierSavings.low.toLocaleString()} – ${tierSavings.high.toLocaleString()}/yr
                                </span>
                              )}
                            </div>

                            {/* Program rows */}
                            <div className={`rounded-xl border p-1 ${tier.color}`}>
                              <div className="space-y-1">
                                {tier.programs.map((m, idx) => {
                                  const savings = getSavingsRange(m.program.name);
                                  return (
                                    <div
                                      key={m.id}
                                      className="flex items-center gap-4 bg-white rounded-lg border border-transparent px-4 py-3.5 cursor-pointer hover:bg-primary-25 hover:border-primary-200 hover:shadow-sm transition-all group"
                                      onClick={() => { setSelectedProgram(m); setActiveTab("programs"); }}
                                    >
                                      <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">{idx + 1}</span>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-800 transition-colors truncate">{m.program.name}</h4>
                                        <div className="flex items-center gap-3 mt-0.5">
                                          {savings && (
                                            <span className="text-xs font-semibold text-success-700">
                                              ${savings.low.toLocaleString()} – ${savings.high.toLocaleString()}/yr
                                            </span>
                                          )}
                                          {m.program.application_url && (
                                            <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Online application</span>
                                          )}
                                        </div>
                                      </div>
                                      <span className="shrink-0 text-xs font-medium text-primary-600 mr-1">View</span>
                                      <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Counselor CTA */}
                <div className="mt-8 bg-vanilla-50 border border-vanilla-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Need help applying?</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">A free benefits counselor can walk you through the process, help with paperwork, and advocate on your behalf.</p>
                      <a
                        href="https://eldercare.acl.gov/resources"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Find a counselor near you &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                {/* Next page */}
                <div className="mt-8 flex justify-end print:hidden">
                  <button
                    onClick={() => setActiveTab("spend-down")}
                    className="group inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all hover:translate-x-0.5"
                  >
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Spend-Down</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ SPEND-DOWN TAB ═══ */}
            {activeTab === "spend-down" && (
              <div className="px-6 md:px-8 py-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">Possible with Spend-Down</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className="text-sm text-gray-500">{spendDownCount} program{spendDownCount !== 1 ? "s" : ""} you may qualify for by spending down excess income.</p>
                  <a
                    href={`/benefits/spend-down-calculator${answers.stateCode ? `?state=${answers.stateCode}` : ""}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors no-underline shadow-sm shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                    Spend-down calculator
                  </a>
                </div>

                {/* What is spend-down explainer */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-bold text-amber-800 mb-1">What is spend-down?</h3>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    If your income is slightly above a program&apos;s limit, you may still qualify by &ldquo;spending down&rdquo; the excess on medical bills, prescriptions, or care costs. Once your remaining income falls below the threshold, you become eligible. A benefits counselor can help you determine if this applies to you.
                  </p>
                </div>

                {/* Spend-down program list */}
                <div className="flex flex-col gap-3">
                  {matchedPrograms
                    .filter((m) => m.spendDown)
                    .sort((a, b) => {
                      const aSavings = getSavingsRange(a.program.name)?.high ?? 0;
                      const bSavings = getSavingsRange(b.program.name)?.high ?? 0;
                      return bSavings - aSavings;
                    })
                    .map((m) => {
                      const savings = getSavingsRange(m.program.name);
                      const isState = !!m.program.state_code;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-4 bg-white rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all px-5 py-4 cursor-pointer"
                          onClick={() => { setSelectedProgram(m); setActiveTab("programs"); }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-display text-sm font-bold text-gray-900 truncate">{m.program.name}</h3>
                              <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isState ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-primary-50 text-primary-700 border border-primary-100"}`}>
                                {isState ? "State" : "Federal"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{m.program.description}</p>
                            <div className="flex items-center gap-3">
                              {savings && (
                                <span className="text-xs font-semibold text-success-700">
                                  Save ${savings.low.toLocaleString()} – ${savings.high.toLocaleString()}/yr
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Spend-down eligible</span>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      );
                    })}
                </div>

                {/* Back to overview */}
                <div className="mt-8 flex justify-start print:hidden">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className="group inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all hover:-translate-x-0.5"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Overview</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
