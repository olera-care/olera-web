"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import Pagination from "@/components/ui/Pagination";
import BrowseCard from "@/components/browse/BrowseCard";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import type { FamilyCard } from "@/app/api/medjobs/families/route";

const BrowseMap = dynamic(() => import("@/components/browse/BrowseMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map...</span>
    </div>
  ),
});

const PAGE_SIZE = 12;

const CARE_OPTIONS = [
  { label: "All care types", kw: "" },
  { label: "Memory Care", kw: "memory" },
  { label: "Home Care", kw: "home care" },
  { label: "Assisted Living", kw: "assisted" },
  { label: "Skilled Nursing", kw: "nursing" },
  { label: "Home Health Care", kw: "home health" },
];

function cardMatches(c: FamilyCard, kw: string): boolean {
  if (!kw) return true;
  const hay = `${c.primaryCategory} ${c.providerCategory ?? ""} ${(c.careTypes || []).join(" ")}`.toLowerCase();
  return hay.includes(kw);
}

function timeAgo(dateStr?: string | null, providerId?: string): string {
  // Use real date if available
  if (dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(1, mins)} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }
  // Deterministic variation when no date — each provider gets a different "posted" time
  const hash = simpleHash(providerId || "x");
  const options = [
    "3 hours ago", "7 hours ago", "12 hours ago",
    "1 day ago", "2 days ago", "3 days ago", "4 days ago",
    "5 days ago", "6 days ago", "1 week ago",
  ];
  return options[hash % options.length];
}

function evidenceScore(c: FamilyCard): number {
  return (c.rating || 0) * Math.log((c.reviewCount || 0) + 1);
}

interface StudentInfo {
  profileId: string | null;
  isLive: boolean;
  campus: string;
}

/** Job posting categories from the provider-side builder */
const JOB_CATEGORIES = [
  "Memory care support",
  "Activities and engagement",
  "Dining and mealtime support",
  "Resident companionship",
  "Wellness and check-in support",
  "Mobility and transport support",
  "Recreation and outings",
  "Recovery and rehab support",
  "Evening and overnight presence",
  "New resident welcome",
];

/** Deterministic hash to pick stable categories per provider */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Assign 2-3 job categories based on provider data */
function getJobCategories(provider: FamilyCard): string[] {
  const cat = (provider.primaryCategory || "").toLowerCase();
  const careTypes = (provider.careTypes || []).map((c) => c.toLowerCase());
  const allContext = [cat, ...careTypes].join(" ");

  // Try to match relevant categories based on provider type
  const matched: string[] = [];
  if (allContext.includes("memory") || allContext.includes("dementia") || allContext.includes("alzheimer"))
    matched.push("Memory care support");
  if (allContext.includes("home care") || allContext.includes("home health") || allContext.includes("non-medical"))
    matched.push("Wellness and check-in support");
  if (allContext.includes("assisted"))
    matched.push("Resident companionship");
  if (allContext.includes("hospice") || allContext.includes("palliative"))
    matched.push("Evening and overnight presence");
  if (allContext.includes("rehab") || allContext.includes("recovery"))
    matched.push("Recovery and rehab support");
  if (allContext.includes("nursing"))
    matched.push("Mobility and transport support");

  // Always add 1-2 more from the list using a stable hash
  const hash = simpleHash(provider.id || provider.name);
  const remaining = JOB_CATEGORIES.filter((c) => !matched.includes(c));
  const pick1 = remaining[hash % remaining.length];
  if (pick1 && !matched.includes(pick1)) matched.push(pick1);
  const remaining2 = remaining.filter((c) => c !== pick1);
  const pick2 = remaining2[(hash >> 4) % remaining2.length];
  if (pick2 && !matched.includes(pick2) && matched.length < 3) matched.push(pick2);

  return matched.slice(0, 3);
}

/** Generate a specific, job-board-style title from provider data */
function generateJobTitle(provider: FamilyCard): string {
  const cat = (provider.primaryCategory || "").toLowerCase();
  const careTypes = (provider.careTypes || []).map((c) => c.toLowerCase());
  const allContext = [cat, ...careTypes].join(" ");
  const name = provider.name;

  // Build a specific title like a real job posting
  if (allContext.includes("memory") || allContext.includes("dementia") || allContext.includes("alzheimer"))
    return `Memory Care & Activities Assistant at ${name}`;
  if (allContext.includes("home health"))
    return `Home Health Aide Needed - ${name}`;
  if (allContext.includes("home care") || allContext.includes("non-medical"))
    return `In-Home Caregiver for Senior Clients - ${name}`;
  if (allContext.includes("assisted living"))
    return `Assisted Living Support & Companionship - ${name}`;
  if (allContext.includes("skilled nursing"))
    return `Nursing Facility Support Aide - ${name}`;
  if (allContext.includes("hospice") || allContext.includes("palliative"))
    return `Hospice Companion & Support Aide - ${name}`;
  if (allContext.includes("rehab") || allContext.includes("recovery"))
    return `Rehab & Recovery Support Assistant - ${name}`;
  if (allContext.includes("personal care"))
    return `Personal Care Attendant Needed - ${name}`;
  if (allContext.includes("senior") || allContext.includes("elder"))
    return `Senior Caregiver & Companion - ${name}`;
  return `Student Caregiver Needed - ${name}`;
}


/** Certifications list (same as JobPostingBuilder) */
const CERTIFICATIONS = [
  "CPR certified",
  "First Aid certified",
  "CNA (Certified Nursing Assistant)",
  "HHA (Home Health Aide)",
  "BLS certified",
  "Dementia care training",
  "CPI / de-escalation training",
  "Fall prevention training",
];

/** Skills list (same as lib/medjobs/skills) */
const PANEL_SKILLS = [
  "Vital signs monitoring",
  "Nutrition and diet awareness",
  "Mobility and transfer assistance",
  "Fall risk management",
  "ADL support",
  "Dementia and memory care",
  "Care documentation",
  "HIPAA awareness",
];

/** Derive certifications for a provider (deterministic) */
function getJobCertifications(provider: FamilyCard): string[] {
  const hash = simpleHash(provider.id || provider.name);
  const count = 2 + (hash % 3); // 2-4 certs
  const result: string[] = [];
  for (let i = 0; i < count && i < CERTIFICATIONS.length; i++) {
    result.push(CERTIFICATIONS[(hash + i * 3) % CERTIFICATIONS.length]);
  }
  return [...new Set(result)];
}

/** Derive skills for a provider (deterministic) */
function getJobSkills(provider: FamilyCard): string[] {
  const hash = simpleHash(provider.id || provider.name);
  const count = 2 + (hash % 3); // 2-4 skills
  const result: string[] = [];
  for (let i = 0; i < count && i < PANEL_SKILLS.length; i++) {
    result.push(PANEL_SKILLS[(hash + i * 5) % PANEL_SKILLS.length]);
  }
  return [...new Set(result)];
}

/** Derive commitment label */
function getCommitment(provider: FamilyCard): string {
  const hash = simpleHash(provider.id || provider.name);
  return hash % 3 === 0 ? "Multiple terms" : "One term";
}

/** Derive hours/week */
function getHoursPerWeek(provider: FamilyCard): string {
  const hash = simpleHash(provider.id || provider.name);
  const options = ["5–10", "10–15", "10–20", "15–20", "15–25", "20–30"];
  return options[hash % options.length];
}

// ── Persisted-opportunity overrides ──────────────────────────────────────
// When a claimed provider has filled in "Your ideal caregiver", prefer those
// real values over the deterministic synthesis above. Anything left blank
// keeps the synthesized fallback so cards never look empty.
const OPP_HOURS_LABEL: Record<string, string> = {
  "0_10": "Up to 10",
  "10_20": "10–20",
  "20_30": "20–30",
  "30_plus": "30+",
};
function resolvePay(provider: FamilyCard): string {
  const o = provider.opportunity;
  if (o?.pay_min && o?.pay_max) return `$${o.pay_min}–$${o.pay_max}/hr`;
  return provider.priceRange && provider.priceRange !== "Contact for pricing"
    ? provider.priceRange
    : "$14–$22/hr";
}
function resolveHours(provider: FamilyCard): string {
  const h = provider.opportunity?.hours_per_week;
  return h ? OPP_HOURS_LABEL[h] ?? getHoursPerWeek(provider) : getHoursPerWeek(provider);
}
function resolveCerts(provider: FamilyCard): string[] {
  const c = provider.opportunity?.certifications;
  return c && c.length ? c : getJobCertifications(provider);
}
function resolveSkills(provider: FamilyCard): string[] {
  const s = provider.opportunity?.skills;
  return s && s.length ? s : getJobSkills(provider);
}
function resolveCommitment(provider: FamilyCard): string {
  const c = provider.opportunity?.commitment;
  if (c) return c === "multiple_terms" ? "Multiple terms" : "One term";
  return getCommitment(provider);
}

/** Derive positions needed */
function getPositionsNeeded(provider: FamilyCard): number {
  const hash = simpleHash(provider.id || provider.name);
  return 1 + (hash % 4); // 1-4
}

/** Generate a natural-sounding role blurb from provider context */
function generateRoleBlurb(
  provider: FamilyCard,
  categories: string[],
  commitment: string,
  hours: string,
  pay: string,
): string {
  const name = provider.name;
  const location = provider.address || "";
  const cat = (provider.primaryCategory || "").toLowerCase();

  // Pick a natural opener based on care type
  let intro: string;
  if (cat.includes("memory") || cat.includes("dementia"))
    intro = `We're looking for a caring, dependable student to join our memory care team at ${name}.`;
  else if (cat.includes("home care") || cat.includes("home health"))
    intro = `${name} is hiring a student caregiver to support our clients in their homes across ${location}.`;
  else if (cat.includes("assisted"))
    intro = `Our team at ${name} is growing and we need a student caregiver who genuinely enjoys spending time with seniors.`;
  else if (cat.includes("hospice"))
    intro = `${name} is looking for a compassionate student to provide comfort and companionship to our residents.`;
  else if (cat.includes("nursing"))
    intro = `We're hiring student caregivers at ${name} to work alongside our nursing staff and support residents day-to-day.`;
  else
    intro = `${name} in ${location} is looking for a student caregiver to join our care team.`;

  // Role details
  const categoryList = categories.slice(0, 2).map((c) => c.toLowerCase()).join(" and ");
  const details = ` You'll help with ${categoryList}, working around ${hours} hours per week at ${pay}.`;
  const close = commitment === "Multiple terms"
    ? " This is a multi-term opportunity — we'd love someone who can grow with us."
    : " This is a one-term position, perfect if you want to get hands-on care experience alongside your coursework.";

  return intro + details + close;
}


/* ════════════════════════════════════════════════════════
   Main Board
   ════════════════════════════════════════════════════════ */
export default function JobsBoard() {
  const router = useRouter();
  const { profiles, isLoading: authLoading } = useAuth();

  const [student, setStudent] = useState<StudentInfo>({ profileId: null, isLive: false, campus: "" });
  const [campus, setCampus] = useState<string>("");
  const [careFilter, setCareFilter] = useState<string>("");
  const [cards, setCards] = useState<FamilyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const campusName = PARTNER_UNIVERSITIES.find((u) => u.slug === campus)?.name ?? null;

  // Resolve the signed-in student's profile, live status, and home campus.
  useEffect(() => {
    if (authLoading) return;
    const sp = profiles?.find((p) => p.type === "student");
    if (!sp) {
      setStudent({ profileId: null, isLive: false, campus: "" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sb = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await sb
          .from("business_profiles")
          .select("is_active, metadata")
          .eq("id", sp.id)
          .single();
        if (cancelled) return;
        const meta = (data?.metadata || {}) as Record<string, unknown>;
        const homeCampus = typeof meta.campus === "string" ? meta.campus : "";
        setStudent({ profileId: sp.id, isLive: !!data?.is_active, campus: homeCampus });
        setCampus((c) => c || homeCampus);
      } catch {
        if (!cancelled) setStudent({ profileId: sp.id, isLive: false, campus: "" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, profiles]);

  // Existing interview requests -> mark those cards as already requested.
  useEffect(() => {
    if (!student.profileId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/medjobs/interviews");
        if (!res.ok) return;
        const data = await res.json();
        const ids = new Set<string>();
        const active = ["proposed", "confirmed", "rescheduled", "completed"];
        for (const iv of data.interviews || []) {
          if (iv.proposed_by === iv.student_profile_id && active.includes(iv.status)) {
            ids.add(iv.provider_profile_id);
          }
        }
        if (!cancelled) setRequested(ids);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student.profileId]);

  const fetchJobs = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ sort: "newest" });
      if (slug) qs.set("campus", slug);
      const res = await fetch(`/api/medjobs/families?${qs.toString()}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchJobs(campus);
  }, [campus, fetchJobs]);

  // Care-filter + Top-sort (program/claimed agencies first, then evidence density).
  const visible = cards.filter((c) => cardMatches(c, careFilter));
  const sorted = [...visible].sort((a, b) => {
    if (!!a.isProgram !== !!b.isProgram) return a.isProgram ? -1 : 1;
    return evidenceScore(b) - evidenceScore(a);
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageCards = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const mapCards = sorted.filter((c) => c.lat != null && c.lon != null);

  // Clicking a job card opens the student-rendered provider page in a new tab —
  // its "About this opportunity" section + Request-interview CTA replace the old
  // in-board detail panel / Gen-2 apply modal. The page itself gates on profile
  // completeness (Chunk 4), so anon/incomplete students are handled there.
  const openOpportunity = (f: FamilyCard) => {
    if (!student.profileId) {
      router.push("/medjobs/families?screener=1");
      return;
    }
    window.open(`/provider/${f.slug}?ctx=medjobs-student`, "_blank", "noopener,noreferrer");
  };

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Recommended for you
        </h1>
        <p className="text-gray-500 mt-1">
          Based on your profile, these are the best matches near {campusName || "you"}.
        </p>
      </div>

      {/* Reminder banner -- above the filters, shown only while not live */}
      {student.profileId && !student.isLive && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Image
              src="/images/for-providers/team/logan.jpg"
              alt="Dr. Logan DuBose"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Complete your profile to apply</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Then share it and get hired for caregiver jobs near {campusName || "you"}.
              </p>
            </div>
          </div>
          <Link
            href="/portal/medjobs"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Complete profile to apply
          </Link>
        </div>
      )}

      {/* Filters -- campus + care type on one row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select value={campus} onChange={(e) => setCampus(e.target.value)} className={selectClass}>
          <option value="">All campuses</option>
          {PARTNER_UNIVERSITIES.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
        <select value={careFilter} onChange={(e) => setCareFilter(e.target.value)} className={selectClass}>
          {CARE_OPTIONS.map((o) => (
            <option key={o.label} value={o.kw}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {sorted.length} job{sorted.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Two-column: cards left, sticky map right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <p className="text-gray-500">
                No {CARE_OPTIONS.find((o) => o.kw === careFilter)?.label.toLowerCase() ?? "matching"} jobs
                near {campusName || "you"} yet.
              </p>
              {careFilter && (
                <button
                  type="button"
                  onClick={() => setCareFilter("")}
                  className="mt-3 text-sm font-semibold text-primary-700 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pageCards.map((f) => (
                  <BrowseCard
                    key={f.id}
                    provider={f}
                    variant="student"
                    campus={campus || undefined}
                    isRequested={requested.has(f.id)}
                    canRequest={!!student.profileId}
                    requestLabel={student.isLive ? "Request interview" : "Complete profile to apply →"}
                    onRequestInterview={() => openOpportunity(f)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={sorted.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="jobs"
                  className="mt-6"
                />
              )}
            </>
          )}
        </div>

        {/* Sticky map (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
              <BrowseMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
