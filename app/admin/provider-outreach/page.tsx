"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { US_STATES } from "@/lib/us-states";
import PulseHeader from "@/components/admin/PulseHeader";
import { type DateRangeValue } from "@/components/admin/DateRangePopover";
import EmailVerificationBadge, { type VerificationStatus } from "@/components/admin/EmailVerificationBadge";
import TrustScoreBadge, { type TrustScoreStatus } from "@/components/admin/TrustScoreBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const OUTREACH_STAGES = [
  "not_contacted",
  "in_sequence",
  "needs_call",
  "called",
  "claimed",
  "archived",
  "hidden",
] as const;

type OutreachStage = (typeof OUTREACH_STAGES)[number];

const STAGE_LABELS: Record<OutreachStage, string> = {
  not_contacted: "Not Contacted",
  in_sequence: "In Sequence",
  needs_call: "Needs Call",
  called: "Called",
  claimed: "Claimed",
  archived: "Archived",
  hidden: "Hidden",
};

// Called is terminal for our outreach effort (ball is in provider's court)
// Claimed and Archived are also terminal
const TERMINAL_STAGES: OutreachStage[] = ["called", "claimed", "archived"];

interface CityStats {
  city: string;
  total: number;
  has_email: number;
  needs_email: number;
}

// Funnel stat component for metrics display
function FunnelStat({
  label,
  value,
  format,
  highlight,
  subtitle,
}: {
  label: string;
  value: number;
  format?: "number" | "percent";
  highlight?: boolean;
  subtitle?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        highlight ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-white"
      }`}
    >
      <div className={`text-xl font-semibold tabular-nums ${highlight ? "text-emerald-600" : "text-gray-900"}`}>
        {format === "percent" ? `${value}%` : value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
      {subtitle && (
        <div className="mt-0.5 text-[10px] text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

// Helper to compute city stats from providers (for non-not_contacted stages)
function computeCityStatsFromProviders(providers: OutreachProvider[]): CityStats[] {
  const cityMap = new Map<string, { total: number; has_email: number; needs_email: number }>();

  for (const p of providers) {
    const cityName = p.city || "(No City)";
    const existing = cityMap.get(cityName) || { total: 0, has_email: 0, needs_email: 0 };
    existing.total++;
    if (p.email && p.email.trim()) {
      existing.has_email++;
    } else {
      existing.needs_email++;
    }
    cityMap.set(cityName, existing);
  }

  return Array.from(cityMap.entries())
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.total - a.total); // Sort by total descending
}

interface OutreachProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  slug: string | null;
  tracking_id: string | null;
  stage: OutreachStage;
  stage_changed_at: string | null;
  notes: string | null;
  // For claimed providers
  verification_state?: "verified" | "pending" | "unverified" | "not_required" | "rejected" | null;
}

interface ActiveState {
  id: string;
  state_code: string;
  state_name: string;
  status: "active" | "paused" | "completed";
  added_at: string;
  total_providers: number;
  not_contacted: number;
  in_sequence: number;
  needs_call: number;
  called: number;
  claimed: number;
  archived: number;
  hidden: number;
  stats_refreshed_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string | undefined | null): string {
  if (!isoDate) return "—";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Editable Provider Contact - with Edit mode for existing emails
function ProviderContactEditor({
  providerId,
  providerSlug,
  email: initialEmail,
  suggestedEmail,
  emailSource,
  emailFoundUrl,
  phone,
  onEmailUpdate,
}: {
  providerId: string;
  providerSlug?: string | null;
  email: string | null;
  suggestedEmail?: string | null;
  emailSource?: string | null;
  emailFoundUrl?: string | null;
  phone: string | null;
  onEmailUpdate?: (newEmail: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail || suggestedEmail || "");
  const [isEditing, setIsEditing] = useState(!initialEmail); // Start in edit mode if no email
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Source info from find (local state for manual find, props for auto-find)
  const [localSource, setLocalSource] = useState<string | null>(null);
  const [localFoundUrl, setLocalFoundUrl] = useState<string | null>(null);

  // Use props if available, otherwise local state
  const displaySource = emailSource || localSource;
  const displayFoundUrl = emailFoundUrl || localFoundUrl;

  // Email verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const verifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trust score state
  const [trustScoreStatus, setTrustScoreStatus] = useState<TrustScoreStatus>("idle");
  const [trustScoreReason, setTrustScoreReason] = useState("");

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (verifyDebounceRef.current) {
        clearTimeout(verifyDebounceRef.current);
      }
    };
  }, []);

  // Sync internal state when prop changes (e.g., from external refresh or suggested email)
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setIsEditing(false);
    } else if (suggestedEmail) {
      setEmail(suggestedEmail);
      setIsEditing(true); // Keep in edit mode so admin can review and save
    } else {
      setEmail("");
      setIsEditing(true);
    }
    setVerificationStatus("idle");
    setTrustScoreStatus("idle");
    setTrustScoreReason("");
    setLocalSource(null);
    setLocalFoundUrl(null);
  }, [initialEmail, suggestedEmail]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Verify email address
  const verifyEmail = useCallback(async (emailToVerify: string): Promise<VerificationStatus> => {
    if (!emailToVerify || !emailToVerify.includes("@")) return "idle";

    try {
      const res = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify }),
      });

      if (!res.ok) return "unknown";
      const data = await res.json();
      const result = data.results?.[0];
      if (!result) return "unknown";

      return result.status as VerificationStatus;
    } catch {
      return "unknown";
    }
  }, []);

  // Fetch trust score for email
  const fetchTrustScore = useCallback(async (emailToCheck: string): Promise<{ level: TrustScoreStatus; reason: string }> => {
    if (!emailToCheck || !providerSlug) return { level: "idle", reason: "" };

    try {
      const res = await fetch("/api/admin/connections/preview-trust-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug, email: emailToCheck }),
      });

      if (!res.ok) return { level: "idle", reason: "" };
      const data = await res.json();
      return { level: data.level || "idle", reason: data.reason || "" };
    } catch {
      return { level: "idle", reason: "" };
    }
  }, [providerSlug]);

  // Run verification and trust scoring in parallel
  const verifyAndScore = useCallback(async (emailToCheck: string) => {
    setVerificationStatus("verifying");
    setTrustScoreStatus("scoring");

    const [verifyStatus, trustResult] = await Promise.all([
      verifyEmail(emailToCheck),
      fetchTrustScore(emailToCheck),
    ]);

    setVerificationStatus(verifyStatus);
    setTrustScoreStatus(trustResult.level);
    setTrustScoreReason(trustResult.reason);

    return verifyStatus;
  }, [verifyEmail, fetchTrustScore]);

  // Auto-verify when suggested email is received from auto-lookup
  useEffect(() => {
    if (suggestedEmail && !initialEmail) {
      // Suggested email received - trigger verification
      verifyAndScore(suggestedEmail);
    }
  }, [suggestedEmail, initialEmail, verifyAndScore]);

  // Debounced verification on blur
  const handleBlur = useCallback(() => {
    if (!isValidEmail) {
      setVerificationStatus("idle");
      setTrustScoreStatus("idle");
      return;
    }

    if (verifyDebounceRef.current) {
      clearTimeout(verifyDebounceRef.current);
    }

    verifyDebounceRef.current = setTimeout(async () => {
      await verifyAndScore(email.trim());
    }, 300);
  }, [email, isValidEmail, verifyAndScore]);

  async function handleSave() {
    if (!email.trim() || !isValidEmail) return;

    // Clear any pending blur verification to prevent race condition
    if (verifyDebounceRef.current) {
      clearTimeout(verifyDebounceRef.current);
      verifyDebounceRef.current = null;
    }

    setSaving(true);
    setError(null);

    // Verify before save if not already verified
    if (verificationStatus === "idle" || verificationStatus === "verifying") {
      const status = await verifyAndScore(email.trim());

      // Warn on risky/invalid
      if (status === "invalid") {
        setError("This email appears invalid. Click Save again to override.");
        setSaving(false);
        return;
      }
      if (status === "risky") {
        setError("This email may bounce (catch-all). Click Save again to override.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/provider-outreach/update-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId, email: email.trim() }),
      });

      if (res.ok) {
        setSaved(true);
        setIsEditing(false);
        setError(null);
        onEmailUpdate?.(email.trim());
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEmail(initialEmail || "");
    setIsEditing(false);
    setError(null);
    setVerificationStatus("idle");
  }

  async function handleFind() {
    setFinding(true);
    setError(null);
    setLocalSource(null);
    setLocalFoundUrl(null);

    try {
      const res = await fetch("/api/admin/provider-outreach/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId }),
      });

      const data = await res.json();

      if (data.email) {
        setEmail(data.email);
        setLocalSource(data.source || null);
        setLocalFoundUrl(data.foundUrl || null);
        // Trigger verification and trust score for the found email
        await verifyAndScore(data.email);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("No email found");
      }
    } catch {
      setError("Lookup failed");
    } finally {
      setFinding(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <div className="flex items-center gap-1.5">
        {isEditing ? (
          // Edit mode: input + Find + Save + Cancel
          <>
            <input
              type="email"
              placeholder="email@provider.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setSaved(false);
                setVerificationStatus("idle");
                setTrustScoreStatus("idle");
                setLocalSource(null);
                setLocalFoundUrl(null);
              }}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              className="w-52 px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 placeholder:text-gray-300 transition"
              disabled={saving}
              autoFocus={!!initialEmail}
            />
            {/* Verification and trust score badges */}
            {(verificationStatus !== "idle" || trustScoreStatus !== "idle") && (
              <div className="flex items-center gap-2">
                <EmailVerificationBadge status={verificationStatus} showHelperText />
                <TrustScoreBadge status={trustScoreStatus} reason={trustScoreReason} />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFind();
              }}
              disabled={finding || saving}
              className="shrink-0 px-2 py-1 text-xs font-medium text-teal-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {finding ? "..." : "✦ Find"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={saving || !isValidEmail}
              className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition ${
                isValidEmail
                  ? "text-white bg-teal-600 hover:bg-teal-700"
                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {saving ? "..." : "Save"}
            </button>
            {initialEmail && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                disabled={saving}
                className="shrink-0 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
            )}
            {error && <span className="text-xs text-amber-600 shrink-0">{error}</span>}
            {/* Source info */}
            {displaySource && (
              <span className="text-xs text-gray-500">
                Found via {displaySource === "scrape" ? "web scraping" : "AI analysis"}
                {displayFoundUrl && (
                  <>
                    {" · "}
                    <a
                      href={displayFoundUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View source
                    </a>
                  </>
                )}
              </span>
            )}
          </>
        ) : (
          // Display mode: show email + verification badge + Edit button
          <>
            <span className="text-sm text-gray-700">{email}</span>
            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="shrink-0 px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Phone - inline */}
      {phone && (
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {formatPhone(phone)}
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// City Row Component (collapsed/expanded)
// ─────────────────────────────────────────────────────────────────────────────

interface CityRowProps {
  city: CityStats;
  stage: OutreachStage;
  isExpanded: boolean;
  onToggle: () => void;
  providers: OutreachProvider[];
  loadingProviders: boolean;
  selectedProviders: Set<string>;
  onToggleProvider: (providerId: string) => void;
  onSelectAllInCity: (providerIds: string[]) => void;
  onEmailSaved: (providerId: string, newEmail: string) => void;
  onOpenActionModal: (provider: OutreachProvider) => void;
}

function CityRow({
  city,
  stage,
  isExpanded,
  onToggle,
  providers,
  loadingProviders,
  selectedProviders,
  onToggleProvider,
  onSelectAllInCity,
  onEmailSaved,
  onOpenActionModal,
}: CityRowProps) {
  const [emailFilter, setEmailFilter] = useState<"all" | "with" | "without">("all");

  // Auto email lookup state
  const [lookingUpEmails, setLookingUpEmails] = useState<Set<string>>(new Set());
  const [foundEmails, setFoundEmails] = useState<Map<string, { email: string; source: string | null; foundUrl: string | null }>>(new Map());
  const [lookupErrors, setLookupErrors] = useState<Map<string, string>>(new Map());
  const lookupAttemptedRef = useRef<Set<string>>(new Set());
  const lookupCancelledRef = useRef(false);

  // Memoize cityProviders to avoid unnecessary useEffect re-runs
  const cityProviders = useMemo(
    () => providers.filter((p) => (p.city || "(No City)") === city.city),
    [providers, city.city]
  );

  // Auto email lookup when city is expanded
  useEffect(() => {
    if (!isExpanded || loadingProviders) {
      // City collapsed or still loading - mark as cancelled to ignore pending results
      lookupCancelledRef.current = true;
      return;
    }

    // City expanded and providers loaded - allow lookups
    lookupCancelledRef.current = false;

    // Find providers without email that we haven't tried looking up yet
    const providersToLookup = cityProviders.filter(
      (p) => !p.email && !lookupAttemptedRef.current.has(p.provider_id) && !lookingUpEmails.has(p.provider_id)
    );

    if (providersToLookup.length === 0) return;

    // Mark these as attempted so we don't retry on re-render
    providersToLookup.forEach((p) => lookupAttemptedRef.current.add(p.provider_id));

    // Start lookups for each provider (limit concurrent to avoid overwhelming)
    const lookupEmail = async (provider: OutreachProvider) => {
      if (lookupCancelledRef.current) return;

      setLookingUpEmails((prev) => new Set(prev).add(provider.provider_id));

      try {
        const res = await fetch("/api/admin/provider-outreach/find-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider_id: provider.provider_id }),
        });

        // Check if cancelled before processing result
        if (lookupCancelledRef.current) return;

        const data = await res.json();

        if (data.email) {
          if (data.source === "existing") {
            // Provider already has email in DB - sync to local state
            if (!lookupCancelledRef.current) {
              onEmailSaved(provider.provider_id, data.email);
            }
          } else {
            // Found a NEW email - store it locally for admin to review and save
            // Do NOT auto-save to database
            if (!lookupCancelledRef.current) {
              setFoundEmails((prev) => new Map(prev).set(provider.provider_id, {
                email: data.email,
                source: data.source || null,
                foundUrl: data.foundUrl || null,
              }));
            }
          }
        } else if (!lookupCancelledRef.current) {
          // No email found - store the error or a default message
          const errorMsg = data.error || "No email found";
          setLookupErrors((prev) => new Map(prev).set(provider.provider_id, errorMsg));
        }
      } catch {
        if (!lookupCancelledRef.current) {
          setLookupErrors((prev) => new Map(prev).set(provider.provider_id, "Lookup failed"));
        }
      } finally {
        if (!lookupCancelledRef.current) {
          setLookingUpEmails((prev) => {
            const next = new Set(prev);
            next.delete(provider.provider_id);
            return next;
          });
        }
      }
    };

    // Stagger lookups to avoid rate limits (max 3 concurrent)
    const queue = [...providersToLookup];
    const runNext = () => {
      if (lookupCancelledRef.current) return;
      const provider = queue.shift();
      if (provider) {
        lookupEmail(provider).finally(() => {
          if (queue.length > 0 && !lookupCancelledRef.current) runNext();
        });
      }
    };

    // Start up to 3 concurrent lookups
    // Capture count before loop since queue.shift() mutates the array
    const concurrentCount = Math.min(3, queue.length);
    for (let i = 0; i < concurrentCount; i++) {
      runNext();
    }

    // Cleanup when city is collapsed or component unmounts
    return () => {
      lookupCancelledRef.current = true;
    };
    // Note: lookingUpEmails is intentionally not in deps - we read it in the filter
    // but don't want to re-trigger when it changes (that would cause loops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, loadingProviders, cityProviders]);

  const filteredProviders =
    emailFilter === "with" ? cityProviders.filter((p) => p.email && p.email.trim()) :
    emailFilter === "without" ? cityProviders.filter((p) => !p.email || !p.email.trim()) :
    cityProviders;

  const allSelected = filteredProviders.length > 0 && filteredProviders.every((p) => selectedProviders.has(p.provider_id));
  const someSelected = filteredProviders.some((p) => selectedProviders.has(p.provider_id)) && !allSelected;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* City Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Expand Icon */}
        <div className="w-5 shrink-0">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
          </svg>
        </div>

        {/* City Name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900">{city.city}</span>
        </div>

        {/* Stats - different display based on stage */}
        <div className="flex items-center gap-6 text-sm">
          {stage === "not_contacted" ? (
            // Not contacted: show ready/needs email breakdown
            <>
              <div className="text-center">
                <span className="font-semibold text-gray-900 tabular-nums">{city.total}</span>
                <span className="text-gray-400 ml-1">total</span>
              </div>
              <div className="text-center">
                <span className="font-semibold text-emerald-600 tabular-nums">{city.has_email}</span>
                <span className="text-gray-400 ml-1">ready</span>
              </div>
              <div className="text-center">
                <span className="font-semibold text-amber-600 tabular-nums">{city.needs_email}</span>
                <span className="text-gray-400 ml-1">needs email</span>
              </div>
            </>
          ) : (
            // Other stages: just show count
            <div className="text-center">
              <span className="font-semibold text-gray-900 tabular-nums">{city.total}</span>
              <span className="text-gray-400 ml-1">{city.total === 1 ? "provider" : "providers"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded: Provider List */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100">
          {loadingProviders ? (
            <div className="p-6 text-center">
              <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          ) : cityProviders.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">No providers in this city</p>
          ) : (
            <>
              {/* Filter & Select Bar */}
              <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-6">
                {/* Select all */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => {
                      if (allSelected) {
                        filteredProviders.forEach((p) => {
                          if (selectedProviders.has(p.provider_id)) {
                            onToggleProvider(p.provider_id);
                          }
                        });
                      } else {
                        onSelectAllInCity(filteredProviders.map((p) => p.provider_id));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">
                    Select all {filteredProviders.length}
                  </span>
                </label>

                {/* Show only with email */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailFilter === "with"}
                    onChange={(e) => setEmailFilter(e.target.checked ? "with" : "all")}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Show only with email</span>
                </label>

                {/* Show only without email */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailFilter === "without"}
                    onChange={(e) => setEmailFilter(e.target.checked ? "without" : "all")}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Show only without email</span>
                </label>
              </div>

              {/* Provider Cards */}
              <div className="divide-y divide-gray-100">
                {filteredProviders.map((provider) => (
                  <div key={provider.provider_id} className="group px-5 py-3 pl-10 flex items-center gap-3 hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedProviders.has(provider.provider_id)}
                      onChange={() => onToggleProvider(provider.provider_id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                    />

                    {/* Provider Name + Category */}
                    <div className="w-56 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={provider.slug ? `/admin/directory/${provider.slug}` : "#"}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate text-sm"
                        >
                          {provider.provider_name}
                        </Link>
                        {provider.slug && (
                          <Link
                            href={`/admin/directory/${provider.slug}`}
                            className="text-xs text-gray-400 hover:text-primary-600 shrink-0"
                          >
                            View
                          </Link>
                        )}
                      </div>
                      {provider.provider_category && (
                        <p className="text-xs text-gray-500 truncate">{provider.provider_category}</p>
                      )}
                    </div>

                    {/* Contact Info - inline */}
                    <div className="flex-1 min-w-0">
                      {/* Claimed providers: read-only display with verification badge */}
                      {provider.stage === "claimed" ? (
                        <div className="flex items-center gap-3">
                          {/* Email (read-only) */}
                          {provider.email && (
                            <span className="text-sm text-gray-700">{provider.email}</span>
                          )}
                          {/* Phone */}
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone.replace(/\D/g, "")}`}
                              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formatPhone(provider.phone)}
                            </a>
                          )}
                          {/* Verification badge */}
                          {provider.verification_state === "verified" || provider.verification_state === "not_required" ? (
                            <span className="inline-flex items-center gap-1 text-primary-600" title="Verified">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-medium">Verified</span>
                            </span>
                          ) : provider.verification_state === "pending" ? (
                            <a
                              href={`/admin/verification?search=${encodeURIComponent(provider.provider_name || "")}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                              title="Click to review verification"
                            >
                              Pending Verification
                            </a>
                          ) : provider.verification_state === "unverified" ? (
                            <a
                              href={`/admin/verification?search=${encodeURIComponent(provider.provider_name || "")}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                              title="Click to verify this provider"
                            >
                              Unverified
                            </a>
                          ) : provider.verification_state === "rejected" ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              Rejected
                            </span>
                          ) : (
                            <a
                              href={`/admin/verification?search=${encodeURIComponent(provider.provider_name || "")}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              title="Click to verify this provider"
                            >
                              Needs Review
                            </a>
                          )}
                        </div>
                      ) : lookingUpEmails.has(provider.provider_id) ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
                          <span>Finding email...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ProviderContactEditor
                            providerId={provider.provider_id}
                            providerSlug={provider.slug}
                            email={provider.email}
                            suggestedEmail={foundEmails.get(provider.provider_id)?.email}
                            emailSource={foundEmails.get(provider.provider_id)?.source}
                            emailFoundUrl={foundEmails.get(provider.provider_id)?.foundUrl}
                            phone={provider.phone}
                            onEmailUpdate={(newEmail) => onEmailSaved(provider.provider_id, newEmail)}
                          />
                          {/* Show lookup result if no email */}
                          {!provider.email && !foundEmails.has(provider.provider_id) && lookupErrors.has(provider.provider_id) && (
                            <span className="text-xs text-amber-600">
                              {lookupErrors.get(provider.provider_id)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions button - ellipsis icon, opens modal */}
                    {/* Show for all stages except claimed (archived can be unarchived) */}
                    {stage !== "claimed" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActionModal(provider);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 transition-all text-gray-300 hover:text-gray-600"
                        title="Actions"
                      >
                        {/* Ellipsis vertical icon */}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Show count if filtered */}
              {emailFilter !== "all" && filteredProviders.length < cityProviders.length && (
                <div className="px-5 py-2 text-xs text-gray-400 border-t border-gray-100">
                  Showing {filteredProviders.length} of {cityProviders.length} providers
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProviderOutreachPage() {
  // Active states (new "Add State" workflow)
  const [activeStates, setActiveStates] = useState<ActiveState[]>([]);
  const [loadingActiveStates, setLoadingActiveStates] = useState(true);
  const totalUsStates = US_STATES.length; // Constant, not state

  // Selected state (from active states or fallback)
  const [selectedState, setSelectedState] = useState<string>("");

  // Date range for PulseHeader
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });

  // Stage tab
  const [stage, setStage] = useState<OutreachStage>("not_contacted");

  // Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchResult, setIsSearchResult] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cities data (for not_contacted tab)
  const [cities, setCities] = useState<CityStats[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);

  // Providers data
  const [providers, setProviders] = useState<OutreachProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Stage counts
  const [stageCounts, setStageCounts] = useState<Record<OutreachStage, number>>({
    not_contacted: 0,
    in_sequence: 0,
    needs_call: 0,
    called: 0,
    claimed: 0,
    archived: 0,
    hidden: 0,
  });

  // Expanded cities (for not_contacted tab)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Selected providers
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  // Stats section expanded state
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add State modal state
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [addStateSearch, setAddStateSearch] = useState("");
  const [addingState, setAddingState] = useState<string | null>(null);

  // State actions menu (for refresh, status change, delete)
  const [stateActionsMenu, setStateActionsMenu] = useState<string | null>(null);
  const [stateActionLoading, setStateActionLoading] = useState<string | null>(null);

  // State selector dropdown in header
  const [showStateSelector, setShowStateSelector] = useState(false);

  // Action modal state
  const [actionModalProvider, setActionModalProvider] = useState<OutreachProvider | null>(null);
  const [selectedAction, setSelectedAction] = useState<"called" | "archived" | "hidden" | "unhide" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  // Unarchive preview state
  const [unarchivePreview, setUnarchivePreview] = useState<{
    archived_questions_count: number;
    connections_affected_count: number;
    loading: boolean;
  } | null>(null);
  const [unarchivePreviewConfirmed, setUnarchivePreviewConfirmed] = useState(false);

  // Sequence confirmation modal state
  const [showSequenceConfirm, setShowSequenceConfirm] = useState(false);
  const [sequenceConfirmProviders, setSequenceConfirmProviders] = useState<OutreachProvider[]>([]);
  const [showSequencePreview, setShowSequencePreview] = useState(false);
  const [sequencePreviewData, setSequencePreviewData] = useState<{
    providers: Array<{
      provider_id: string;
      provider_name: string;
      email: string | null;
      valid: boolean;
      errors: string[];
      emails: Array<{
        day: number;
        templateKey: string;
        subject: string;
        bodyPreview: string;
        html: string;
      }>;
    }>;
    cadence: Array<{
      day: number;
      templateKey: string;
      description: string;
    }>;
    summary: {
      total: number;
      valid: number;
      invalid: number;
    };
  } | null>(null);
  const [sequencePreviewLoading, setSequencePreviewLoading] = useState(false);
  // For batch preview: which provider to show and which email day
  const [previewProviderId, setPreviewProviderId] = useState<string | null>(null);
  const [previewDay, setPreviewDay] = useState<number>(0);

  // Standardized archive reasons (same codes as Questions/Connections)
  // Archive = Stop all outreach. Provider is invalid, out of business, or explicitly declined.
  const ARCHIVE_REASONS = [
    { value: "uninterested_provider", label: "Provider declined / Not interested" },
    { value: "provider_requested_no_emails", label: "Provider requested no contact" },
    { value: "out_of_business", label: "Out of business / Permanently closed" },
    { value: "invalid_provider", label: "Invalid listing (fake/spam)" },
    { value: "duplicate", label: "Duplicate of another listing" },
    { value: "wrong_contact_info", label: "Unable to verify provider exists" },
    { value: "inactive", label: "Inactive / No response" },
    { value: "inactive_multiple_attempts", label: "Inactive after multiple attempts" },
    { value: "fax_only", label: "Fax only / No email" },
    { value: "relocated", label: "Relocated" },
    { value: "compliance_issue", label: "Compliance issue" },
    { value: "merged", label: "Merged with another provider" },
    { value: "other", label: "Other" },
  ];

  const HIDE_REASONS = [
    { value: "test_account", label: "Test account" },
    { value: "duplicate", label: "Duplicate entry" },
    { value: "data_quality", label: "Data quality issue" },
    { value: "other", label: "Other" },
  ];

  // Standardized unarchive reasons - direct positive inverses of each archive reason
  const UNARCHIVE_REASONS = [
    { value: "archived_in_error", label: "Mistakenly archived" },
    { value: "provider_now_interested", label: "Provider now interested" },
    { value: "provider_now_wants_contact", label: "Provider now wants contact" },
    { value: "business_confirmed_operating", label: "Business confirmed operating" },
    { value: "provider_verified_valid", label: "Provider verified as valid" },
    { value: "not_a_duplicate", label: "Confirmed not a duplicate" },
    { value: "provider_existence_verified", label: "Provider existence verified" },
    { value: "provider_now_responsive", label: "Provider now responsive" },
    { value: "email_obtained", label: "Email address obtained" },
    { value: "new_contact_info_obtained", label: "New contact info obtained" },
    { value: "compliance_resolved", label: "Compliance issue resolved" },
    { value: "not_merged", label: "Confirmed separate provider" },
    { value: "other", label: "Other" },
  ];

  // Keep legacy UNHIDE_REASONS for hidden -> not_contacted transition
  const UNHIDE_REASONS = [
    { value: "ready_for_outreach", label: "Ready for outreach" },
    { value: "hidden_in_error", label: "Hidden in error" },
    { value: "data_issue_resolved", label: "Data issue resolved" },
    { value: "other", label: "Other" },
  ];

  // Close action modal and reset state
  const closeActionModal = () => {
    setActionModalProvider(null);
    setSelectedAction(null);
    setActionReason("");
    setActionNotes("");
    setUnarchivePreview(null);
    setUnarchivePreviewConfirmed(false);
  };

  // Fetch sequence preview from launch-sequence API
  const fetchSequencePreview = useCallback(async (providerIds: string[]) => {
    if (providerIds.length === 0) return;

    setSequencePreviewLoading(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/launch-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_ids: providerIds, dry_run: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setSequencePreviewData(data);
        // Set initial preview provider to first valid one
        const firstValid = data.providers?.find((p: { valid: boolean }) => p.valid);
        if (firstValid) {
          setPreviewProviderId(firstValid.provider_id);
        }
        setPreviewDay(0); // Start with Day 0 (intro email)
      } else {
        console.error("Failed to fetch sequence preview");
        setSequencePreviewData(null);
      }
    } catch (error) {
      console.error("Error fetching sequence preview:", error);
      setSequencePreviewData(null);
    } finally {
      setSequencePreviewLoading(false);
    }
  }, []);

  // Fetch active states
  const fetchActiveStates = useCallback(async () => {
    setLoadingActiveStates(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/states");
      if (res.ok) {
        const data = await res.json();
        setActiveStates(data.states || []);
        // Auto-select first state if none selected (prefer active, then any)
        if (!selectedState && data.states?.length > 0) {
          const firstActive = data.states.find((s: ActiveState) => s.status === "active");
          const firstState = firstActive || data.states[0];
          if (firstState) {
            setSelectedState(firstState.state_code);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch active states:", err);
    } finally {
      setLoadingActiveStates(false);
    }
  }, [selectedState]);

  // Fetch cities for not_contacted stage
  const fetchCities = useCallback(async () => {
    if (!selectedState) return;
    setLoadingCities(true);

    try {
      const res = await fetch(`/api/admin/provider-outreach/cities?state=${selectedState}`);
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities || []);
        setTotalUnclaimed(data.total_unclaimed || 0);
      }
    } catch (err) {
      console.error("Failed to fetch cities:", err);
    } finally {
      setLoadingCities(false);
    }
  }, [selectedState]);

  // Fetch providers for current stage/state (or search)
  const fetchProviders = useCallback(async (city?: string, searchTerm?: string) => {
    if (!selectedState) return;
    setLoadingProviders(true);

    try {
      const params = new URLSearchParams({
        state: selectedState,
        stage,
      });
      if (city) params.set("city", city);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/admin/provider-outreach?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setIsSearchResult(!!data.is_search);
        if (data.stage_counts) {
          setStageCounts(data.stage_counts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
    } finally {
      setLoadingProviders(false);
    }
  }, [selectedState, stage]);

  // Debounce search input by 300ms
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Effect: fetch active states on mount
  useEffect(() => {
    fetchActiveStates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect: close dropdowns when clicking outside
  useEffect(() => {
    if (!stateActionsMenu && !showStateSelector) return;
    const handleClickOutside = () => {
      setStateActionsMenu(null);
      setShowStateSelector(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [stateActionsMenu, showStateSelector]);

  // Effect: fetch cities when state changes (for not_contacted tab, when not searching)
  useEffect(() => {
    if (stage === "not_contacted" && !debouncedSearch) {
      fetchCities();
    }
  }, [selectedState, stage, debouncedSearch, fetchCities]);

  // Effect: fetch providers and stage counts when state/stage/search changes
  useEffect(() => {
    if (selectedState) {
      fetchProviders(undefined, debouncedSearch || undefined);
    }
  }, [selectedState, stage, debouncedSearch, fetchProviders]);

  // Effect: fetch providers when a city is expanded (only when not searching)
  useEffect(() => {
    if (stage === "not_contacted" && expandedCities.size > 0 && !debouncedSearch) {
      fetchProviders();
    }
  }, [expandedCities, stage, debouncedSearch, fetchProviders]);

  // Clear selection, providers, and stage counts when stage/state/search changes
  useEffect(() => {
    setSelectedProviders(new Set());
    setExpandedCities(new Set());
    setProviders([]);
    // Clear stage counts when STATE changes (not stage) to avoid showing stale data
    // Stage counts are state-level, so changing stage within same state keeps counts
  }, [stage, selectedState, debouncedSearch]);

  // Separate effect to clear stage counts only when state changes
  const prevStateRef = useRef(selectedState);
  useEffect(() => {
    if (prevStateRef.current !== selectedState) {
      setStageCounts({
        not_contacted: 0,
        in_sequence: 0,
        needs_call: 0,
        called: 0,
        claimed: 0,
        archived: 0,
        hidden: 0,
      });
      prevStateRef.current = selectedState;
    }
  }, [selectedState]);

  // Show toast helper
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle adding a state
  const handleAddState = async (stateCode: string) => {
    setAddingState(stateCode);
    try {
      const res = await fetch("/api/admin/provider-outreach/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state_code: stateCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add state");
      }
      // Refresh active states list
      await fetchActiveStates();
      // Select the newly added state
      setSelectedState(stateCode);
      // Close modal and reset
      setShowAddStateModal(false);
      setAddStateSearch("");
      showToast(`${data.state?.state_name || stateCode} added to active states`, "success");
    } catch (err) {
      console.error("Failed to add state:", err);
      showToast(err instanceof Error ? err.message : "Failed to add state", "error");
    } finally {
      setAddingState(null);
    }
  };

  // Handle refreshing stats for a state
  const handleRefreshStateStats = async (stateCode: string) => {
    setStateActionLoading(stateCode);
    setStateActionsMenu(null);
    try {
      const res = await fetch(`/api/admin/provider-outreach/states/${stateCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_stats" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to refresh stats");
      }
      // Update the state in our local list
      setActiveStates((prev) =>
        prev.map((s) => (s.state_code === stateCode ? { ...s, ...data.state } : s))
      );
      showToast(`Stats refreshed for ${data.state?.state_name || stateCode}`, "success");
    } catch (err) {
      console.error("Failed to refresh stats:", err);
      showToast(err instanceof Error ? err.message : "Failed to refresh stats", "error");
    } finally {
      setStateActionLoading(null);
    }
  };

  // Handle updating state status (active/paused/completed)
  const handleUpdateStateStatus = async (stateCode: string, newStatus: "active" | "paused" | "completed") => {
    setStateActionLoading(stateCode);
    setStateActionsMenu(null);
    try {
      const res = await fetch(`/api/admin/provider-outreach/states/${stateCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      // Update the state in our local list
      setActiveStates((prev) =>
        prev.map((s) => (s.state_code === stateCode ? { ...s, ...data.state } : s))
      );
      const statusLabels = { active: "Active", paused: "Paused", completed: "Completed" };
      showToast(`${data.state?.state_name || stateCode} marked as ${statusLabels[newStatus]}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setStateActionLoading(null);
    }
  };

  // Handle deleting a state
  const handleDeleteState = async (stateCode: string, stateName: string) => {
    setStateActionsMenu(null); // Close menu before showing confirm dialog
    if (!confirm(`Remove ${stateName} from active states? This won't delete any provider data.`)) {
      return;
    }
    setStateActionLoading(stateCode);
    try {
      const res = await fetch(`/api/admin/provider-outreach/states/${stateCode}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove state");
      }
      // Remove from local list
      setActiveStates((prev) => prev.filter((s) => s.state_code !== stateCode));
      // If this was the selected state, clear selection
      if (selectedState === stateCode) {
        setSelectedState("");
      }
      showToast(data.message || `${stateName} removed`, "success");
    } catch (err) {
      console.error("Failed to delete state:", err);
      showToast(err instanceof Error ? err.message : "Failed to remove state", "error");
    } finally {
      setStateActionLoading(null);
    }
  };

  // Toggle city expansion
  const toggleCity = (cityName: string) => {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(cityName)) {
        next.delete(cityName);
      } else {
        next.add(cityName);
      }
      return next;
    });
  };

  // Toggle provider selection
  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Select all providers in a city
  const selectAllInCity = (providerIds: string[]) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      providerIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Update stage for selected providers
  // Optionally pass specific providerIds (for filtered actions like "only with email")
  const updateStage = async (newStage: OutreachStage, providerIds?: string[]) => {
    const idsToUpdate = providerIds || Array.from(selectedProviders);
    if (idsToUpdate.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_ids: idsToUpdate,
          stage: newStage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Moved ${data.updated + data.created} provider(s) to ${STAGE_LABELS[newStage]}`, "success");
        setSelectedProviders(new Set());

        // Refresh data
        if (stage === "not_contacted") {
          fetchCities();
          fetchProviders();
        } else {
          fetchProviders();
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update stage", "error");
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      showToast("Failed to update stage", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick action for single provider (from modal)
  // If requiresReasonValidation is true, reason is required (archive/unarchive actions)
  const handleQuickAction = async (
    providerId: string,
    action: "not_contacted" | "called" | "archived" | "hidden",
    reason?: string | null,
    notes?: string | null,
    requiresReasonValidation?: boolean
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_ids: [providerId],
          stage: action,
          reason: requiresReasonValidation ? reason : undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const actionLabel = action === "not_contacted" ? "Unhidden" : action === "called" ? "Called" : action === "hidden" ? "Hidden" : "Archived";
        showToast(`Marked as ${actionLabel}`, "success");

        // Refresh data
        if (stage === "not_contacted") {
          fetchCities();
          fetchProviders();
        } else {
          fetchProviders();
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update", "error");
      }
    } catch (err) {
      console.error("Failed to quick action:", err);
      showToast("Failed to update", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Get selected providers with email (for "Move to In Sequence" eligibility)
  const selectedProvidersWithEmail = providers.filter(
    (p) => selectedProviders.has(p.provider_id) && p.email && p.email.trim()
  );
  const selectedWithEmailCount = selectedProvidersWithEmail.length;

  // Available actions based on current stage
  // Note: "Mark Claimed" is NOT included because Claimed auto-syncs from business_profiles
  // Note: Archive removed from bulk actions - use individual provider modal instead
  const getAvailableActions = (): { stage: OutreachStage; label: string; color: string; requiresEmail?: boolean }[] => {
    switch (stage) {
      case "not_contacted":
        // Only "Move to In Sequence" - requires email
        return [
          { stage: "in_sequence", label: "Move to In Sequence", color: "bg-primary-600 hover:bg-primary-700", requiresEmail: true },
        ];
      case "in_sequence":
        return [
          { stage: "needs_call", label: "Needs Call", color: "bg-amber-600 hover:bg-amber-700" },
          { stage: "called", label: "Mark Called", color: "bg-purple-600 hover:bg-purple-700" },
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-500 hover:bg-gray-600" },
        ];
      case "needs_call":
        return [
          { stage: "called", label: "Mark Called", color: "bg-purple-600 hover:bg-purple-700" },
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-500 hover:bg-gray-600" },
        ];
      case "called":
        // Called is terminal for outreach - we've done our part
        // Only allow going back in case of error
        return [
          { stage: "needs_call", label: "Back to Needs Call", color: "bg-amber-600 hover:bg-amber-700" },
        ];
      case "hidden":
        // Hidden is NOT terminal - can unhide
        return [
          { stage: "not_contacted", label: "Unhide", color: "bg-blue-600 hover:bg-blue-700" },
        ];
      default:
        // Terminal stages (archived, claimed) - allow moving back to not_contacted
        return [
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-600 hover:bg-gray-700" },
        ];
    }
  };

  const tabs = OUTREACH_STAGES.map((s) => ({
    value: s,
    label: STAGE_LABELS[s],
    count: stageCounts[s],
    isTerminal: TERMINAL_STAGES.includes(s),
  }));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* PulseHeader with funnel metrics */}
      <PulseHeader
        title="Provider Cold Outreach"
        kpiSuffix="claimed"
        statsPath={selectedState ? `/api/admin/provider-outreach/stats?state=${selectedState}&metric=funnel` : undefined}
        range={range}
        onRangeChange={setRange}
        actions={
          <div className="flex items-center gap-3">
            {/* Search input - only enabled when a state is selected */}
            {selectedState && (
              <div className="relative w-64">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setDebouncedSearch("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* State selector dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStateSelector(!showStateSelector);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  selectedState
                    ? "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    : "bg-primary-600 border-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {selectedState
                  ? US_STATES.find((s) => s.value === selectedState)?.label || selectedState
                  : "Select State"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* State selector dropdown */}
              {showStateSelector && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-96 overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Existing states */}
                  {activeStates.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Your States ({activeStates.length})
                      </div>
                      <div className="overflow-y-auto max-h-64">
                        {activeStates.map((state) => {
                          const isSelected = selectedState === state.state_code;
                          const progress = state.total_providers > 0
                            ? Math.round((state.claimed / state.total_providers) * 100)
                            : 0;
                          return (
                            <button
                              key={state.state_code}
                              onClick={() => {
                                setSelectedState(state.state_code);
                                setShowStateSelector(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                                isSelected ? "bg-primary-50" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={`text-sm font-medium ${isSelected ? "text-primary-700" : "text-gray-900"}`}>
                                  {state.state_name}
                                </span>
                                <span className="text-xs text-gray-400">({state.state_code})</span>
                                {state.status === "completed" && <span className="text-xs text-emerald-600">✓</span>}
                                {state.status === "paused" && <span className="text-xs text-amber-600">⏸</span>}
                              </div>
                              <span className="text-xs text-gray-400">{progress}%</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-100" />
                    </>
                  )}

                  {/* Loading indicator */}
                  {loadingActiveStates && (
                    <div className="px-3 py-4 text-center text-gray-400">
                      <svg className="animate-spin h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}

                  {/* Add State button */}
                  <button
                    onClick={() => {
                      setShowStateSelector(false);
                      setShowAddStateModal(true);
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add State
                  </button>
                </div>
              )}
            </div>

            {/* State actions menu (when a state is selected) */}
            {selectedState && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStateActionsMenu(stateActionsMenu === selectedState ? null : selectedState);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="State actions"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* Actions dropdown */}
                {stateActionsMenu === selectedState && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleRefreshStateStats(selectedState)}
                      disabled={stateActionLoading === selectedState}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {stateActionLoading === selectedState ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Refresh Stats
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {(() => {
                      const currentState = activeStates.find(s => s.state_code === selectedState);
                      if (!currentState) return null;
                      return (
                        <>
                          {currentState.status !== "active" && (
                            <button
                              onClick={() => handleUpdateStateStatus(selectedState, "active")}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Mark Active
                            </button>
                          )}
                          {currentState.status !== "paused" && (
                            <button
                              onClick={() => handleUpdateStateStatus(selectedState, "paused")}
                              className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-gray-50"
                            >
                              Mark Paused
                            </button>
                          )}
                          {currentState.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStateStatus(selectedState, "completed")}
                              className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-gray-50"
                            >
                              Mark Completed
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        const stateName = activeStates.find(s => s.state_code === selectedState)?.state_name || selectedState;
                        handleDeleteState(selectedState, stateName);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove State
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Stage Tabs - only show when a state is selected */}
      {selectedState && (
        <div className="flex gap-1 mb-6 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStage(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                stage === tab.value
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400 tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Collapsible Funnel Stats - only show when a state is selected */}
      {selectedState && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${statsExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Outreach Funnel</span>
          </button>

          {statsExpanded && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <FunnelStat
                label="In Sequence"
                value={stageCounts.in_sequence}
                subtitle="actively receiving emails"
              />
              <FunnelStat
                label="Needs Call"
                value={stageCounts.needs_call}
                subtitle="sequence complete"
              />
              <FunnelStat
                label="Called"
                value={stageCounts.called}
                subtitle="awaiting response"
              />
              <FunnelStat
                label="Claimed"
                value={stageCounts.claimed}
                highlight
                subtitle="success"
              />
              <FunnelStat
                label="Claim Rate"
                value={
                  stageCounts.in_sequence + stageCounts.needs_call + stageCounts.called + stageCounts.claimed > 0
                    ? Math.round(
                        (stageCounts.claimed /
                          (stageCounts.in_sequence + stageCounts.needs_call + stageCounts.called + stageCounts.claimed)) *
                          100
                      )
                    : 0
                }
                format="percent"
                subtitle="of providers who entered sequence"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Bar (when items selected) - hidden during search since providers may be from different stages */}
      {selectedProviders.size > 0 && !isSearchResult && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-900">
            {selectedProviders.size} provider{selectedProviders.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            {getAvailableActions().map((action) => {
              // For actions requiring email, only count/enable for providers with email
              const eligibleCount = action.requiresEmail ? selectedWithEmailCount : selectedProviders.size;
              const isDisabled = actionLoading || eligibleCount === 0;

              // Build label with count for email-required actions
              let label = action.label;
              if (action.requiresEmail && selectedWithEmailCount !== selectedProviders.size) {
                // Show count when not all selected have email
                label = selectedWithEmailCount > 0
                  ? `Move ${selectedWithEmailCount} to In Sequence`
                  : "Move to In Sequence";
              }

              return (
                <button
                  key={action.stage}
                  onClick={() => {
                    if (action.requiresEmail) {
                      // Show confirmation modal for starting sequence
                      setSequenceConfirmProviders(selectedProvidersWithEmail);
                      setShowSequenceConfirm(true);
                      // Fetch preview data for the modal
                      fetchSequencePreview(selectedProvidersWithEmail.map(p => p.provider_id));
                    } else {
                      updateStage(action.stage);
                    }
                  }}
                  disabled={isDisabled}
                  title={action.requiresEmail && eligibleCount === 0 ? "No selected providers have email" : undefined}
                  className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedProviders(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content - Search results (flat list) or City-grouped view */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!selectedState ? (
          // No state selected - prompt user to select a state from the header
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a state to begin</h3>
            <p className="text-sm text-gray-500">
              Use the state selector above to choose which state to work on
            </p>
          </div>
        ) : isSearchResult ? (
          // Search results: flat list with stage badges
          <>
            <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="w-5" />
              <div className="flex-1">Provider</div>
              <div className="w-24">City</div>
              <div className="w-28">Stage</div>
              <div className="w-10" />
            </div>
            {loadingProviders ? (
              <div className="p-8 text-center">
                <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              </div>
            ) : providers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No providers found matching &quot;{debouncedSearch}&quot;</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {providers.map((provider) => (
                  <div key={provider.provider_id} className="group px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedProviders.has(provider.provider_id)}
                      onChange={() => toggleProvider(provider.provider_id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                    />
                    {/* Provider Name + Category */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={provider.slug ? `/admin/directory/${provider.slug}` : "#"}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate text-sm"
                        >
                          {provider.provider_name}
                        </Link>
                        {provider.email && (
                          <span className="text-xs text-gray-500 truncate">{provider.email}</span>
                        )}
                      </div>
                      {provider.provider_category && (
                        <p className="text-xs text-gray-500 truncate">{provider.provider_category}</p>
                      )}
                    </div>
                    {/* City */}
                    <div className="w-24 text-sm text-gray-600 truncate">
                      {provider.city || "—"}
                    </div>
                    {/* Stage Badge */}
                    <div className="w-28">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        provider.stage === "claimed" ? "bg-emerald-100 text-emerald-700" :
                        provider.stage === "in_sequence" ? "bg-blue-100 text-blue-700" :
                        provider.stage === "needs_call" ? "bg-amber-100 text-amber-700" :
                        provider.stage === "called" ? "bg-purple-100 text-purple-700" :
                        provider.stage === "archived" ? "bg-gray-100 text-gray-600" :
                        provider.stage === "hidden" ? "bg-gray-100 text-gray-500" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {STAGE_LABELS[provider.stage]}
                      </span>
                    </div>
                    {/* Actions - hide for claimed only (archived can be unarchived) */}
                    <div className="w-10">
                      {!["claimed"].includes(provider.stage) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionModalProvider(provider);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 transition-all text-gray-300 hover:text-gray-600"
                          title="Actions"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Search results summary */}
            {!loadingProviders && providers.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
                Found {providers.length} provider{providers.length === 1 ? "" : "s"} matching &quot;{debouncedSearch}&quot;
              </div>
            )}
          </>
        ) : (
          // Normal city-grouped view
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="w-5" />
              <div className="flex-1">City</div>
              <div className="w-48 text-right">Providers</div>
            </div>

            {(() => {
              // For not_contacted, use the cities API data; for other stages, compute from providers
              const displayCities = stage === "not_contacted" ? cities : computeCityStatsFromProviders(providers);
              const isLoading = stage === "not_contacted" ? loadingCities : loadingProviders;
              const emptyMessage = stage === "not_contacted"
                ? `No unclaimed providers in ${selectedState}`
                : `No providers in ${STAGE_LABELS[stage]}`;

              if (isLoading) {
                return (
                  <div className="p-8 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                  </div>
                );
              }

              if (displayCities.length === 0) {
                return (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">{emptyMessage}</p>
                  </div>
                );
              }

              return (
                <div>
                  {displayCities.map((city) => (
                    <CityRow
                      key={city.city}
                      city={city}
                      stage={stage}
                      isExpanded={expandedCities.has(city.city)}
                      onToggle={() => toggleCity(city.city)}
                      providers={providers}
                      loadingProviders={loadingProviders}
                      selectedProviders={selectedProviders}
                      onToggleProvider={toggleProvider}
                      onSelectAllInCity={selectAllInCity}
                      onEmailSaved={(providerId, newEmail) => {
                        // Update local providers state immediately
                        setProviders((prev) =>
                          prev.map((p) =>
                            p.provider_id === providerId ? { ...p, email: newEmail } : p
                          )
                        );
                        // Refresh cities to update counts (for not_contacted)
                        if (stage === "not_contacted") {
                          fetchCities();
                        }
                      }}
                      onOpenActionModal={setActionModalProvider}
                    />
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Summary */}
      {stage === "not_contacted" && !loadingCities && !isSearchResult && (
        <div className="mt-4 text-sm text-gray-500">
          {totalUnclaimed.toLocaleString()} unclaimed providers in {selectedState} across {cities.length} cities
        </div>
      )}

      {/* Provider Action Modal */}
      {actionModalProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={closeActionModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Provider Actions</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {actionModalProvider.provider_name}
              </p>
            </div>

            {/* Step 1: Select Action */}
            {!selectedAction && (
              <div className="p-4 space-y-2">
                {/* Unarchive - only show if provider is currently archived */}
                {actionModalProvider.stage === "archived" && (
                  <button
                    onClick={async () => {
                      setSelectedAction("unhide");
                      // Fetch unarchive preview
                      setUnarchivePreview({ archived_questions_count: 0, connections_affected_count: 0, loading: true });
                      try {
                        const res = await fetch(`/api/admin/provider-outreach/unarchive-preview?provider_id=${actionModalProvider.provider_id}`);
                        if (res.ok) {
                          const data = await res.json();
                          setUnarchivePreview({
                            archived_questions_count: data.archived_questions_count || 0,
                            connections_affected_count: data.connections_affected_count || 0,
                            loading: false,
                          });
                        } else {
                          setUnarchivePreview(null);
                        }
                      } catch {
                        setUnarchivePreview(null);
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Unarchive</p>
                        <p className="text-xs text-gray-500">Restore to Not Contacted for outreach</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Unhide - only show if provider is currently hidden */}
                {actionModalProvider.stage === "hidden" && (
                  <button
                    onClick={() => setSelectedAction("unhide")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Unhide</p>
                        <p className="text-xs text-gray-500">Return to Not Contacted for outreach</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Mark as Called - show for active stages that haven't been called yet */}
                {["not_contacted", "in_sequence", "needs_call"].includes(actionModalProvider.stage) && (
                  <button
                    onClick={() => setSelectedAction("called")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-purple-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Mark as Called</p>
                        <p className="text-xs text-gray-500">We called them - ball is in their court</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Archive - only show if NOT already archived */}
                {actionModalProvider.stage !== "archived" && (
                  <button
                    onClick={() => setSelectedAction("archived")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Archive</p>
                        <p className="text-xs text-gray-500">Stop all outreach to this provider</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Hide - only show if provider is NOT already hidden or archived */}
                {actionModalProvider.stage !== "hidden" && actionModalProvider.stage !== "archived" && (
                  <button
                    onClick={() => setSelectedAction("hidden")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Hide</p>
                        <p className="text-xs text-gray-500">Skip for this sequence (test accounts)</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Confirm with Reason */}
            {selectedAction && (
              <div className="p-4 space-y-4">
                {/* Back button */}
                <button
                  onClick={() => {
                    // If we're in the preview step (unarchive not yet confirmed), go back to action selection
                    // If we're in the reason step (preview confirmed), go back to preview step
                    if (selectedAction === "unhide" && actionModalProvider?.stage === "archived" && unarchivePreviewConfirmed) {
                      setUnarchivePreviewConfirmed(false);
                      setActionReason("");
                      setActionNotes("");
                    } else {
                      setSelectedAction(null);
                      setActionReason("");
                      setActionNotes("");
                      setUnarchivePreview(null);
                      setUnarchivePreviewConfirmed(false);
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {selectedAction === "unhide" && actionModalProvider?.stage === "archived" && unarchivePreviewConfirmed ? "Back to Preview" : "Back"}
                </button>

                {/* Unarchive Preview Step - show impact before reason selection */}
                {selectedAction === "unhide" && actionModalProvider?.stage === "archived" && !unarchivePreviewConfirmed && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-sm font-medium text-gray-900">Unarchive Provider</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        This will restore the provider to active outreach across all systems.
                      </p>
                    </div>

                    {/* Loading state */}
                    {unarchivePreview?.loading && (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading impact preview...</span>
                      </div>
                    )}

                    {/* Fallback when API fetch failed */}
                    {!unarchivePreview && (
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Unable to load impact preview. You can still proceed with unarchiving.
                          </p>
                        </div>
                        <button
                          onClick={() => setUnarchivePreviewConfirmed(true)}
                          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                          Continue to Reason Selection
                        </button>
                      </div>
                    )}

                    {/* Impact preview */}
                    {unarchivePreview && !unarchivePreview.loading && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Cross-system impact:</p>

                        {/* Questions impact */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-blue-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Questions eligibility restored
                            </p>
                            <p className="text-xs text-gray-500">
                              Provider will be eligible to receive new questions
                            </p>
                          </div>
                        </div>

                        {/* Connections impact */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-purple-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {unarchivePreview.connections_affected_count > 0
                                ? `${unarchivePreview.connections_affected_count} connection${unarchivePreview.connections_affected_count === 1 ? "" : "s"} will resume followups`
                                : "No connections with paused followups"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {unarchivePreview.connections_affected_count > 0
                                ? "Followup email sequences will be re-enabled"
                                : "No followup sequences to resume"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setUnarchivePreviewConfirmed(true)}
                          className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                          Continue to Reason Selection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Standard confirmation flow - show for non-unarchive actions OR after unarchive preview is confirmed */}
                {(selectedAction !== "unhide" || actionModalProvider?.stage !== "archived" || unarchivePreviewConfirmed) && (
                  <>
                    {/* Action description */}
                    <div className={`p-3 rounded-lg ${
                      selectedAction === "called" ? "bg-purple-50 border border-purple-200" :
                      selectedAction === "archived" ? "bg-amber-50 border border-amber-200" :
                      selectedAction === "unhide" && actionModalProvider?.stage === "archived" ? "bg-emerald-50 border border-emerald-200" :
                      selectedAction === "unhide" ? "bg-blue-50 border border-blue-200" :
                      "bg-gray-50 border border-gray-200"
                    }`}>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAction === "called" ? "Mark as Called" :
                         selectedAction === "archived" ? "Archive Provider" :
                         selectedAction === "unhide" && actionModalProvider?.stage === "archived" ? "Unarchive Provider" :
                         selectedAction === "unhide" ? "Unhide Provider" :
                         "Hide Provider"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selectedAction === "called" ? "Provider will be moved to Called tab. We've done our part - ball is in their court." :
                         selectedAction === "archived" ? "Provider will be archived and removed from active outreach. This also stops emails from Questions and Connections." :
                         selectedAction === "unhide" && actionModalProvider?.stage === "archived" ? "Provider will be restored to Not Contacted and will receive outreach again. This also restores Questions and Connections emails." :
                         selectedAction === "unhide" ? "Provider will return to Not Contacted and be available for outreach." :
                         "Provider will be hidden from this sequence but can be unhidden later."}
                      </p>
                    </div>

                    {/* Reason dropdown - not needed for "called" */}
                    {selectedAction !== "called" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Reason
                        </label>
                        <select
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          <option value="">Select a reason...</option>
                          {(selectedAction === "archived" ? ARCHIVE_REASONS :
                            selectedAction === "unhide" ? (
                              // If provider was archived, use UNARCHIVE_REASONS; otherwise UNHIDE_REASONS
                              actionModalProvider?.stage === "archived" ? UNARCHIVE_REASONS : UNHIDE_REASONS
                            ) :
                            HIDE_REASONS
                          ).map((reason) => (
                            <option key={reason.value} value={reason.value}>{reason.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Notes textarea - not needed for "called" */}
                    {selectedAction !== "called" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Notes <span className="text-gray-400 font-normal">{actionReason === "other" ? "(required)" : "(optional)"}</span>
                        </label>
                        <textarea
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Add any additional context..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              {/* Show Confirm button only when not in unarchive preview step */}
              {selectedAction && !(selectedAction === "unhide" && actionModalProvider?.stage === "archived" && !unarchivePreviewConfirmed) && (
                <button
                  onClick={async () => {
                    // "called" doesn't require a reason
                    if (selectedAction !== "called") {
                      if (!actionReason) return;
                      if (actionReason === "other" && !actionNotes.trim()) return;
                    }
                    // Map "unhide" to "not_contacted" stage
                    const stageToSet = selectedAction === "unhide" ? "not_contacted" : selectedAction;
                    // Detect if this is an unarchive scenario (moving from archived to not_contacted)
                    const isUnarchiving = actionModalProvider.stage === "archived" && stageToSet === "not_contacted";
                    await handleQuickAction(
                      actionModalProvider.provider_id,
                      stageToSet,
                      actionReason,
                      actionNotes.trim() || null,
                      isUnarchiving || selectedAction === "archived"
                    );
                    closeActionModal();
                  }}
                  disabled={
                    actionLoading ||
                    (selectedAction !== "called" && !actionReason) ||
                    (selectedAction !== "called" && actionReason === "other" && !actionNotes.trim())
                  }
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAction === "called" ? "bg-purple-600 hover:bg-purple-700" :
                    selectedAction === "archived" ? "bg-amber-600 hover:bg-amber-700" :
                    selectedAction === "unhide" && actionModalProvider?.stage === "archived" ? "bg-emerald-600 hover:bg-emerald-700" :
                    selectedAction === "unhide" ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {actionLoading ? "..." : "Confirm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sequence Confirmation Modal */}
      {showSequenceConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={actionLoading ? undefined : () => {
            setShowSequenceConfirm(false);
            setSequencePreviewData(null);
            setPreviewProviderId(null);
            setPreviewDay(0);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Start Email Sequence</h3>
              <p className="text-sm text-gray-500 mt-1">
                {sequenceConfirmProviders.length} provider{sequenceConfirmProviders.length === 1 ? "" : "s"} will receive the outreach sequence
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {/* Summary */}
              {sequencePreviewData && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-medium text-gray-900">{sequencePreviewData.summary.valid}</span> ready to send
                    </span>
                    {sequencePreviewData.summary.invalid > 0 && (
                      <span className="text-amber-600">
                        <span className="font-medium">{sequencePreviewData.summary.invalid}</span> missing email
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Provider list */}
              <div className="mb-5">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Providers
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100 max-h-32 overflow-y-auto">
                  {sequencePreviewLoading ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">Loading preview...</div>
                  ) : sequencePreviewData ? (
                    sequencePreviewData.providers.map((p) => (
                      <div key={p.provider_id} className="px-3 py-2 flex items-center justify-between">
                        <span className={`text-sm truncate ${p.valid ? "text-gray-900" : "text-gray-400"}`}>
                          {p.provider_name}
                        </span>
                        <div className="flex items-center gap-2 ml-2">
                          {p.valid ? (
                            <span className="text-xs text-gray-500 truncate">{p.email}</span>
                          ) : (
                            <span className="text-xs text-amber-600">{p.errors[0]}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    sequenceConfirmProviders.map((p) => (
                      <div key={p.provider_id} className="px-3 py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-900 truncate">{p.provider_name}</span>
                        <span className="text-xs text-gray-500 truncate ml-2">{p.email}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Email Preview Accordion */}
              <div>
                <button
                  onClick={() => setShowSequencePreview((s) => !s)}
                  className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 border border-gray-100"
                >
                  <span className="text-sm font-medium text-gray-700">Preview Email Sequence</span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showSequencePreview ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSequencePreview && (
                  <div className="mt-3 space-y-4">
                    {sequencePreviewLoading ? (
                      <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 text-center text-sm text-gray-500">
                        Loading email previews...
                      </div>
                    ) : sequencePreviewData?.cadence ? (
                      <>
                        {/* Provider selector for batch preview */}
                        {sequencePreviewData.providers.filter(p => p.valid).length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Preview for:</span>
                            <select
                              value={previewProviderId || ""}
                              onChange={(e) => setPreviewProviderId(e.target.value)}
                              className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
                            >
                              {sequencePreviewData.providers.filter(p => p.valid).map((p) => (
                                <option key={p.provider_id} value={p.provider_id}>
                                  {p.provider_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Day selector tabs */}
                        <div className="flex gap-2 border-b border-gray-200">
                          {sequencePreviewData.cadence.map((step) => (
                            <button
                              key={step.day}
                              onClick={() => setPreviewDay(step.day)}
                              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                previewDay === step.day
                                  ? "border-primary-600 text-primary-600"
                                  : "border-transparent text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              Day {step.day}
                            </button>
                          ))}
                        </div>

                        {/* Email preview */}
                        {(() => {
                          const selectedProvider = sequencePreviewData.providers.find(
                            p => p.provider_id === previewProviderId && p.valid
                          ) || sequencePreviewData.providers.find(p => p.valid);
                          const selectedEmail = selectedProvider?.emails.find(e => e.day === previewDay);
                          const stepInfo = sequencePreviewData.cadence.find(c => c.day === previewDay);

                          if (!selectedEmail) return (
                            <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 text-center text-sm text-gray-500">
                              No email preview available
                            </div>
                          );

                          return (
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                              {/* Email header */}
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                    {stepInfo?.description || `Day ${previewDay}`}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {previewDay === 0 ? "Sent immediately" : `Sent ${previewDay} days after start`}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <p><span className="font-medium text-gray-600">To:</span> {selectedProvider?.email}</p>
                                  <p><span className="font-medium text-gray-600">From:</span> TJ Falohun &lt;tj@olera.care&gt;</p>
                                  <p><span className="font-medium text-gray-600">Subject:</span> {selectedEmail.subject}</p>
                                </div>
                              </div>
                              {/* Email body - rendered HTML */}
                              <div
                                className="p-4 text-sm"
                                style={{ maxHeight: "300px", overflowY: "auto" }}
                                dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                              />
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      // Fallback for when preview data is not available
                      <>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Day 0</span>
                            <span className="text-xs text-gray-400">Immediate</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">Introduction Email</p>
                          <p className="text-xs text-gray-500 mt-1">Explains value of claiming profile on Olera</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Day 3</span>
                            <span className="text-xs text-gray-400">+3 days</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">Follow-up Email</p>
                          <p className="text-xs text-gray-500 mt-1">Gentle reminder about the profile</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Day 7</span>
                            <span className="text-xs text-gray-400">+7 days</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">Final Email</p>
                          <p className="text-xs text-gray-500 mt-1">Last outreach before moving to calls</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
              <button
                onClick={() => {
                  setShowSequenceConfirm(false);
                  setShowSequencePreview(false);
                  setSequencePreviewData(null);
                  setPreviewProviderId(null);
                  setPreviewDay(0);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Only include providers that are valid (have email)
                  const validProviderIds = sequencePreviewData
                    ? sequencePreviewData.providers.filter(p => p.valid).map(p => p.provider_id)
                    : sequenceConfirmProviders.map(p => p.provider_id);
                  await updateStage("in_sequence", validProviderIds);
                  setShowSequenceConfirm(false);
                  setShowSequencePreview(false);
                  setSequencePreviewData(null);
                  setPreviewProviderId(null);
                  setPreviewDay(0);
                }}
                disabled={actionLoading || sequencePreviewLoading || (sequencePreviewData?.summary.valid === 0)}
                className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Starting..." : sequencePreviewLoading ? "Loading..." : "Start Sequence"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add State Modal */}
      {showAddStateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => {
            setShowAddStateModal(false);
            setAddStateSearch("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Add State</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select a state to start outreach work
              </p>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  value={addStateSearch}
                  onChange={(e) => setAddStateSearch(e.target.value)}
                  placeholder="Search states..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
            </div>

            {/* State List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {(() => {
                const addedCodes = new Set(activeStates.map((s) => s.state_code));
                const availableStates = US_STATES.filter(
                  (s) =>
                    !addedCodes.has(s.value) &&
                    (s.label.toLowerCase().includes(addStateSearch.toLowerCase()) ||
                      s.value.toLowerCase().includes(addStateSearch.toLowerCase()))
                );

                if (availableStates.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {addedCodes.size === US_STATES.length
                        ? "All states have been added"
                        : "No matching states found"}
                    </div>
                  );
                }

                return availableStates.map((usState) => (
                  <button
                    key={usState.value}
                    onClick={() => handleAddState(usState.value)}
                    disabled={addingState !== null}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {usState.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {usState.value}
                      </span>
                    </div>
                    {addingState === usState.value ? (
                      <svg className="animate-spin h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddStateModal(false);
                  setAddStateSearch("");
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
