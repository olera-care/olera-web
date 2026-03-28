"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
  formatAvailability,
  formatHoursPerWeek,
  formatDuration,
  hasVideo,
} from "@/lib/medjobs-helpers";

interface Candidate {
  id: string;
  slug: string;
  display_name: string;
  email?: string;
  phone?: string;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[];
  image_url: string | null;
  metadata: StudentMetadata;
  created_at: string;
}

const PAGE_SIZE = 12;

// ── Filter Dropdown ──

function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchable = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white shadow-sm rounded-xl text-sm outline-none hover:shadow-md transition-shadow cursor-pointer"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-lg max-h-72 overflow-hidden"
          style={{ animation: "card-enter 0.15s ease-out both" }}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full px-3 py-2 text-sm outline-none bg-gray-50 rounded-lg"
              />
            </div>
          )}
          <div className="overflow-y-auto max-h-60">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  value === opt.value
                    ? "font-medium text-gray-900 bg-gray-50"
                    : "text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" }, { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" }, { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" }, { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const GRADIENTS = [
  "from-primary-400 to-teal-500",
  "from-teal-400 to-emerald-500",
  "from-primary-500 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-primary-500",
  "from-teal-500 to-primary-400",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// ── Student Card ──

function StudentCard({
  candidate,
  isProvider,
  delay = 0,
}: {
  candidate: Candidate;
  isProvider: boolean;
  delay?: number;
}) {
  const meta = candidate.metadata;
  const trackLabel = getTrackLabel(meta);
  const availLabel = formatAvailability(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const certs = meta.certifications || [];
  const videoAvailable = hasVideo(meta);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group flex flex-col"
      style={{
        animation: "card-enter 0.3s ease-out both",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden">
        {candidate.image_url ? (
          <Image
            src={candidate.image_url}
            alt={candidate.display_name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient(candidate.id)} flex items-center justify-center`}
          >
            <span className="text-6xl font-bold text-white/80">
              {candidate.display_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        {videoAvailable && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
            <span className="text-xs font-medium text-gray-700">Video</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-display font-bold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
          {candidate.display_name}
        </h3>
        <p className="text-sm text-gray-400 truncate mt-0.5">
          {meta.university || "University not specified"}
        </p>

        {/* Structured info */}
        <div className="mt-3 space-y-2 flex-1">
          {trackLabel && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">School</span>
              <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                {trackLabel}
              </span>
            </div>
          )}

          {(candidate.city || candidate.state) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">Location</span>
              <span className="text-xs text-gray-600">
                {[candidate.city, candidate.state].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {availLabel && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">Avail.</span>
              <span className="text-xs text-gray-600">
                {availLabel}
                {hoursLabel ? ` / ${hoursLabel}` : ""}
              </span>
            </div>
          )}

          {durationLabel && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">Commit</span>
              <span className="text-xs text-gray-600">{durationLabel}</span>
            </div>
          )}

          {certs.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">Certs</span>
              <div className="flex flex-wrap gap-1">
                {certs.slice(0, 3).map((cert) => (
                  <span
                    key={cert}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {cert.split(" (")[0]}
                  </span>
                ))}
                {certs.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                    +{certs.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {(meta.total_verified_hours ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">Hours</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {meta.total_verified_hours} verified
              </span>
            </div>
          )}
        </div>

        {/* Provider contact info */}
        {isProvider && (candidate.email || candidate.phone) && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            {candidate.email && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg
                  className="w-3.5 h-3.5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <a
                  href={`mailto:${candidate.email}`}
                  className="hover:text-gray-900 truncate transition-colors"
                >
                  {candidate.email}
                </a>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg
                  className="w-3.5 h-3.5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                <a
                  href={`tel:${candidate.phone}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {candidate.phone}
                </a>
              </div>
            )}
          </div>
        )}

        <Link
          href={`/provider/medjobs/candidates/${candidate.slug}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          View Profile
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ── Empty State: Aspirational showcase ──

function EmptyState({
  city,
  providerEmail,
}: {
  city: string;
  providerEmail?: string | null;
}) {
  const [email, setEmail] = useState(providerEmail || "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showcaseCandidates, setShowcaseCandidates] = useState<Candidate[]>([]);
  const [loadingShowcase, setLoadingShowcase] = useState(true);

  // Fetch global students as showcase
  useEffect(() => {
    async function fetchShowcase() {
      try {
        const res = await fetch(`/api/medjobs/candidates?page=0&pageSize=6&sort=newest`);
        const data = await res.json();
        setShowcaseCandidates(data.candidates || []);
      } catch {
        // Graceful — showcase is optional
      } finally {
        setLoadingShowcase(false);
      }
    }
    fetchShowcase();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/medjobs/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), city }),
      });
      setSubmitted(true);
    } catch {
      // Still show success — we don't want to block on this
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Aspirational header */}
      <div
        className="max-w-lg mx-auto text-center mb-12"
        style={{ animation: "card-enter 0.3s ease-out both", animationDelay: "100ms" }}
      >
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          MedJobs is coming to {city}
        </h2>
        <p className="text-gray-400 leading-relaxed mb-6">
          We&apos;re building a network of pre-screened healthcare students in your area.
          Get notified when candidates are available.
        </p>

        {submitted ? (
          <div
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium"
            style={{ animation: "card-enter 0.2s ease-out both" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            We&apos;ll notify you when students are available in {city}
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !email.trim()}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {submitting ? "..." : "Notify me"}
            </button>
          </div>
        )}
      </div>

      {/* Showcase divider */}
      <div
        className="flex items-center gap-4 mb-6"
        style={{ animation: "card-enter 0.3s ease-out both", animationDelay: "200ms" }}
      >
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-sm font-medium text-gray-400">
          Meet some of our students
        </span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* Real student showcase grid */}
      {loadingShowcase ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-100" />
              <div className="p-5">
                <div className="h-5 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-50 rounded w-1/2 mt-2" />
                <div className="mt-4 h-3 bg-gray-50 rounded w-full" />
                <div className="mt-5 h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : showcaseCandidates.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {showcaseCandidates.map((candidate, i) => (
            <StudentCard
              key={candidate.id}
              candidate={candidate}
              isProvider={true}
              delay={250 + i * 60}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Main Page ──

export default function ProviderCandidateBrowsePage() {
  const { activeProfile, isLoading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isProvider, setIsProvider] = useState(false);
  const hasFetchedOnce = useRef(false);

  // Provider's location — stabilize to avoid title flicker
  const providerCity = activeProfile?.city || "";
  const providerState = activeProfile?.state || "";
  const resolvedCityLabel = useRef("your area");
  if (providerCity) resolvedCityLabel.current = providerCity;

  // Filters — user-controlled
  const [stateFilter, setStateFilter] = useState("");
  const [userChangedState, setUserChangedState] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce search — 300ms after user stops typing
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0);
    }, 300);
  }, []);

  // The effective state filter: provider's state on initial load, user's choice after interaction
  const effectiveState = userChangedState ? stateFilter : (providerState || stateFilter);

  const fetchCandidates = useCallback(async () => {
    // Wait for auth to resolve so we know the provider's state
    if (authLoading) return;

    setFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
      });
      if (effectiveState) params.set("state", effectiveState);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/medjobs/candidates?${params}`);
      const data = await res.json();

      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setIsProvider(data.isProvider || false);
    } catch (err) {
      console.error("[provider/medjobs/candidates] fetch error:", err);
    } finally {
      setFetching(false);
      if (!hasFetchedOnce.current) {
        hasFetchedOnce.current = true;
        setInitialLoading(false);
      }
    }
  }, [page, effectiveState, searchQuery, sort, authLoading]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Show skeleton only on initial load, not on filter changes
  const loading = initialLoading;

  // Whether this is the "no local students" empty state (only on initial auto-filter, not user-driven)
  const showEmptyState = !loading && candidates.length === 0 && !userChangedState && !searchQuery.trim();
  const hasLocalStudents = total > 0;
  const cityLabel = resolvedCityLabel.current;

  return (
    <main className="min-h-screen bg-[#faf9f7] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className="mb-8"
          style={{ animation: "card-enter 0.3s ease-out both" }}
        >
          <Link
            href="/provider"
            className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-gray-900">
            {hasLocalStudents || loading
              ? `Students near ${cityLabel}`
              : "Student Candidates"}
          </h1>
          {(hasLocalStudents || loading) && (
            <p className="mt-1 text-gray-400">
              {loading ? "" : `${total} student${total !== 1 ? "s" : ""} available`}
            </p>
          )}
        </div>

        {/* Filters — borderless, always visible */}
        {!showEmptyState && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-0 shadow-sm rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
              />
            </div>
            <div className="w-48">
              <FilterDropdown
                options={[{ value: "", label: "All States" }, ...US_STATES]}
                value={userChangedState ? stateFilter : effectiveState}
                onChange={(v) => {
                  setStateFilter(v);
                  setUserChangedState(true);
                  setPage(0);
                }}
                placeholder="All States"
                searchable
              />
            </div>
            <div className="w-40">
              <FilterDropdown
                options={[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                ]}
                value={sort}
                onChange={(v) => { setSort(v); setPage(0); }}
                placeholder="Sort by"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-100" />
                <div className="p-5">
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-50 rounded w-1/2 mt-2" />
                  <div className="mt-4 h-3 bg-gray-50 rounded w-full" />
                  <div className="mt-2 h-3 bg-gray-50 rounded w-3/4" />
                  <div className="mt-5 h-10 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : showEmptyState ? (
          <EmptyState
            city={providerCity || `${providerState || "your area"}`}
            providerEmail={activeProfile?.email}
          />
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No candidates found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-150 ${fetching ? "opacity-60" : "opacity-100"}`}>
              {candidates.map((candidate, i) => (
                <StudentCard
                  key={candidate.id}
                  candidate={candidate}
                  isProvider={isProvider}
                  delay={initialLoading ? 0 : 100 + i * 50}
                />
              ))}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white shadow-sm rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white shadow-sm rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
