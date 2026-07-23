"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { US_STATES } from "@/lib/us-states";
import EmailVerificationBadge, { type VerificationStatus } from "@/components/admin/EmailVerificationBadge";
import TrustScoreBadge, { type TrustScoreStatus } from "@/components/admin/TrustScoreBadge";
import { AdminChip } from "@/components/admin/provider-outreach/AdminChip";
import { AdminFilterChips, type AdminCounts } from "@/components/admin/provider-outreach/AdminFilterChips";
import { AdminAutocomplete } from "@/components/admin/provider-outreach/AdminAutocomplete";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// Database stages
const OUTREACH_STAGES = [
  "not_contacted",
  "in_sequence",
  "needs_call",
  "re_engage",
  "not_interested",  // Soft terminal: no outreach, but questions/connections flow
  "claimed",
  "archived",  // Hard terminal: system-wide block
] as const;

type OutreachStage = (typeof OUTREACH_STAGES)[number];

// UI tabs - "needs_email" and "ready" are filtered views of "not_contacted"
type UITab = "needs_email" | "ready" | Exclude<OutreachStage, "not_contacted">;

const UI_TABS: UITab[] = [
  "needs_email",
  "ready",
  "in_sequence",
  "needs_call",  // Displayed as "Follow Up"
  "re_engage",
  "not_interested",  // Soft terminal
  "claimed",
  "archived",  // Hard terminal
];

const UI_TAB_LABELS: Record<UITab, string> = {
  needs_email: "Needs Email",
  ready: "Ready",
  in_sequence: "In Sequence",
  needs_call: "Follow Up",
  re_engage: "Re-Engage",
  not_interested: "Not Interested",
  claimed: "Claimed",
  archived: "Archived",
};

// Database stage labels (for search results showing provider's actual stage)
const STAGE_LABELS: Record<OutreachStage, string> = {
  not_contacted: "Not Contacted",
  in_sequence: "In Sequence",
  needs_call: "Follow Up",
  re_engage: "Re-Engage",
  not_interested: "Not Interested",
  claimed: "Claimed",
  archived: "Archived",
};

// Terminal stages - no more outreach
// not_interested = soft (questions/connections still flow)
// archived = hard (system-wide block)
const TERMINAL_STAGES: OutreachStage[] = ["claimed", "not_interested", "archived"];

// Follow Up queue limits (must match backend config)
const MAX_RESEND_COUNT = 2;
const MAX_NO_ANSWER_COUNT = 3;

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
  // Follow-up queue fields
  due_date: string | null;
  resend_count: number;
  no_answer_count: number;
  needs_call_reason: string | null;
  // Re-engage cycle fields
  cycle_number: number;
  re_engage_entered_at: string | null;
  // Assignment
  assigned_to: string | null;
  // For claimed providers
  verification_state?: "verified" | "pending" | "unverified" | "not_required" | "rejected" | null;
  // Email verification status from email_verifications table
  email_verification_status?: "valid" | "invalid" | "risky" | "unknown" | null;
  // Whether email has been manually overridden/trusted
  is_email_overridden?: boolean;
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
  re_engage: number;
  claimed: number;
  archived: number;
  stats_refreshed_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Map UI tab to API parameters (stage + optional email_filter)
function getApiParamsForTab(tab: UITab): { stage: OutreachStage; emailFilter?: "needs_email" | "has_email" } {
  if (tab === "needs_email") {
    return { stage: "not_contacted", emailFilter: "needs_email" };
  }
  if (tab === "ready") {
    return { stage: "not_contacted", emailFilter: "has_email" };
  }
  return { stage: tab as OutreachStage };
}

// Check if a UI tab represents the "not_contacted" stage (needs_email or ready)
function isNotContactedTab(tab: UITab): boolean {
  return tab === "needs_email" || tab === "ready";
}

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

// Labels for why a provider is in the Follow Up queue
const NEEDS_CALL_REASON_LABELS: Record<string, string> = {
  sequence_completed: "Sequence done",
  clicked_not_claimed: "Clicked",
  replied: "Replied",
  manual: "Manual",
};

function getNeedsCallReasonChip(reason: string | null): { label: string; className: string } | null {
  if (!reason) return null;
  const label = NEEDS_CALL_REASON_LABELS[reason] || reason;
  // Different colors for different reasons
  switch (reason) {
    case "sequence_completed":
      return { label, className: "bg-blue-50 text-blue-700" };
    case "clicked_not_claimed":
      return { label, className: "bg-emerald-50 text-emerald-700" };
    case "replied":
      return { label, className: "bg-purple-50 text-purple-700" };
    case "manual":
    default:
      return { label, className: "bg-gray-100 text-gray-600" };
  }
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
  emailVerificationStatus,
  isEmailOverridden,
}: {
  providerId: string;
  providerSlug?: string | null;
  email: string | null;
  suggestedEmail?: string | null;
  emailSource?: string | null;
  emailFoundUrl?: string | null;
  phone: string | null;
  onEmailUpdate?: (newEmail: string) => void;
  /** Pre-fetched email verification status from database */
  emailVerificationStatus?: "valid" | "invalid" | "risky" | "unknown" | null;
  /** Whether email has been manually overridden/trusted */
  isEmailOverridden?: boolean;
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

  // Email override state (for one-click trust action)
  const [isOverriding, setIsOverriding] = useState(false);
  const [locallyOverridden, setLocallyOverridden] = useState(false);
  // Combine database state (prop) with local action state
  const isOverridden = isEmailOverridden || locallyOverridden;

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

  // One-click override for risky/invalid emails
  async function handleOverride() {
    if (!email || isOverriding) return;

    setIsOverriding(true);
    try {
      const res = await fetch("/api/admin/email-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          providerSlug: providerSlug || providerId,
          reason: "admin",
        }),
      });

      if (res.ok) {
        setLocallyOverridden(true);
      }
    } catch {
      // Silent fail - button will remain visible for retry
    } finally {
      setIsOverriding(false);
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
            {/* Email verification status and override */}
            {isOverridden ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Trusted
              </span>
            ) : emailVerificationStatus && emailVerificationStatus !== "valid" ? (
              <>
                <EmailVerificationBadge status={emailVerificationStatus} />
                {/* One-click trust button for risky/invalid emails */}
                {(emailVerificationStatus === "risky" || emailVerificationStatus === "invalid") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOverride();
                    }}
                    disabled={isOverriding}
                    className="shrink-0 px-2 py-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition disabled:opacity-50"
                    title="Mark this email as trusted"
                  >
                    {isOverriding ? "..." : "Trust"}
                  </button>
                )}
              </>
            ) : null}
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
  activeTab: UITab;
  isExpanded: boolean;
  onToggle: () => void;
  providers: OutreachProvider[];
  loadingProviders: boolean;
  selectedProviders: Set<string>;
  onToggleProvider: (providerId: string) => void;
  onSelectAllInCity: (providerIds: string[]) => void;
  onEmailSaved: (providerId: string, newEmail: string) => void;
  onOpenActionModal: (provider: OutreachProvider) => void;
  onRemoveProvider: (provider: OutreachProvider) => void;
  // City assignment
  cityOwnerId: string | null;
  cityOwnerName: string | null;
  isEditingAssignment: boolean;
  onStartEditAssignment: () => void;
  onAssignCity: (ownerId: string | null, ownerName: string | null) => void;
  onCancelEditAssignment: () => void;
}

function CityRow({
  city,
  activeTab,
  isExpanded,
  onToggle,
  providers,
  loadingProviders,
  selectedProviders,
  onToggleProvider,
  onSelectAllInCity,
  onEmailSaved,
  onOpenActionModal,
  onRemoveProvider,
  cityOwnerId,
  cityOwnerName,
  isEditingAssignment,
  onStartEditAssignment,
  onAssignCity,
  onCancelEditAssignment,
}: CityRowProps) {
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

  const allSelected = cityProviders.length > 0 && cityProviders.every((p) => selectedProviders.has(p.provider_id));
  const someSelected = cityProviders.some((p) => selectedProviders.has(p.provider_id)) && !allSelected;

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

        {/* City Name + Owner */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-medium text-gray-900">{city.city}</span>
          {/* City Owner Assignment */}
          {isEditingAssignment ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <AdminAutocomplete
                selectedAdminId={cityOwnerId}
                selectedAdminName={cityOwnerName}
                onSelect={(id, name) => onAssignCity(id, name)}
                onClose={onCancelEditAssignment}
                placeholder="Assign to..."
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEditAssignment();
              }}
              className="flex items-center gap-1 text-sm hover:underline"
              title={cityOwnerId ? "Change assignment" : "Assign city"}
            >
              <AdminChip
                adminId={cityOwnerId}
                adminName={cityOwnerName}
                size="sm"
              />
            </button>
          )}
        </div>

        {/* Stats - show count relevant to the active tab */}
        <div className="flex items-center gap-6 text-sm">
          {activeTab === "needs_email" ? (
            <div className="text-center">
              <span className="font-semibold text-amber-600 tabular-nums">{city.needs_email}</span>
              <span className="text-gray-400 ml-1">{city.needs_email === 1 ? "provider" : "providers"}</span>
            </div>
          ) : activeTab === "ready" ? (
            <div className="text-center">
              <span className="font-semibold text-emerald-600 tabular-nums">{city.has_email}</span>
              <span className="text-gray-400 ml-1">{city.has_email === 1 ? "provider" : "providers"}</span>
            </div>
          ) : (
            // Other stages: show total count
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
                        cityProviders.forEach((p) => {
                          if (selectedProviders.has(p.provider_id)) {
                            onToggleProvider(p.provider_id);
                          }
                        });
                      } else {
                        onSelectAllInCity(cityProviders.map((p) => p.provider_id));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">
                    Select all {cityProviders.length}
                  </span>
                </label>
              </div>

              {/* Provider Cards */}
              <div className="divide-y divide-gray-100">
                {cityProviders.map((provider) => (
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
                            emailVerificationStatus={provider.email_verification_status}
                            isEmailOverridden={provider.is_email_overridden}
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
                    {/* Show for all tabs except claimed (archived can be unarchived) */}
                    {activeTab !== "claimed" && (
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

                    {/* Remove from outreach (trash icon) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveProvider(provider);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 transition-all text-gray-300 hover:text-red-500"
                      title="Remove from outreach"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Follow Up Queue Component (Due Date Grouped)
// ─────────────────────────────────────────────────────────────────────────────

interface FollowUpQueueProps {
  providers: OutreachProvider[];
  loading: boolean;
  onOutcomeRecorded: (providerId: string, stageChanged: boolean) => void;
  onProviderUpdated: (providerId: string, updates: Partial<OutreachProvider>) => void;
  onStageChange: (providerId: string, newStage: OutreachStage) => Promise<void>;
  onRemoveProvider: (provider: OutreachProvider) => void;
  onArchive: (provider: OutreachProvider) => void;
  adminNameLookup: Map<string, string>;
}

// Helper: get today's date as ISO string (YYYY-MM-DD) in UTC
// Uses UTC to match server/database which also use UTC, ensuring consistent comparisons
function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper: calculate days difference from today
function getDaysDiff(dateStr: string | null): number {
  if (!dateStr) return 0;
  const today = new Date(getTodayISO());
  const dueDate = new Date(dateStr);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: format due date badge
function formatDueDateBadge(dateStr: string | null): { text: string; className: string } {
  if (!dateStr) {
    // Legacy record without due_date - show as due today since it needs attention
    return { text: "Due today", className: "bg-amber-100 text-amber-700" };
  }

  const daysDiff = getDaysDiff(dateStr);

  if (daysDiff < 0) {
    const daysOverdue = Math.abs(daysDiff);
    return {
      text: daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`,
      className: "bg-red-100 text-red-700",
    };
  } else if (daysDiff === 0) {
    return { text: "Due today", className: "bg-amber-100 text-amber-700" };
  } else if (daysDiff === 1) {
    return { text: "Tomorrow", className: "bg-blue-100 text-blue-700" };
  } else {
    return { text: `In ${daysDiff} days`, className: "bg-gray-100 text-gray-600" };
  }
}

// Expandable provider row for Follow Up queue
function FollowUpProviderRow({
  provider,
  isExpanded,
  onToggle,
  onOutcomeRecorded,
  onProviderUpdated,
  onStageChange,
  onRemoveProvider,
  onArchive,
  adminNameLookup,
}: {
  provider: OutreachProvider;
  isExpanded: boolean;
  onToggle: () => void;
  onOutcomeRecorded: (stageChanged: boolean) => void;
  onProviderUpdated: (updates: Partial<OutreachProvider>) => void;
  onStageChange: (newStage: OutreachStage) => Promise<void>;
  onRemoveProvider: () => void;
  onArchive: () => void;
  adminNameLookup: Map<string, string>;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [stageChangeLoading, setStageChangeLoading] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const dueBadge = formatDueDateBadge(provider.due_date);
  const resendDisabled = provider.resend_count >= MAX_RESEND_COUNT;
  const noAnswerWarning = provider.no_answer_count === MAX_NO_ANSWER_COUNT - 1;

  // Confirmation modal content for each outcome
  // Note: No "claimed_on_call" case - auto-claim detection handles claims automatically
  const getConfirmationContent = (outcome: string) => {
    switch (outcome) {
      case "resend_link":
        return {
          title: "Resend Claim Link",
          description: "The provider requested to receive the claim link again.",
          details: [
            "Provider will stay in the Follow Up queue",
            `Due date will be pushed to ${addDaysFormatted(3)}`,
            `This is resend #${provider.resend_count + 1} of ${MAX_RESEND_COUNT} allowed`,
          ],
          confirmLabel: "Yes, resend link",
          confirmClass: "bg-gray-800 hover:bg-gray-900 text-white",
        };
      case "schedule_callback":
        return {
          title: "Schedule Callback",
          description: "Set a specific date to call this provider back.",
          details: [
            "Provider will stay in the Follow Up queue",
            `Due date will be set to ${callbackDate ? new Date(callbackDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "(select a date)"}`,
            "They will appear in the appropriate section based on that date",
          ],
          confirmLabel: "Confirm callback",
          confirmClass: "bg-gray-800 hover:bg-gray-900 text-white",
        };
      case "no_answer":
        if (noAnswerWarning) {
          return {
            title: "No Answer (3rd Attempt)",
            description: "This is the third time the provider didn't answer.",
            details: [
              "Provider will be moved to the Re-Engage stage",
              "They will no longer appear in the Follow Up queue",
              "Consider re-engaging via email sequence later",
            ],
            confirmLabel: "Yes, move to Re-Engage",
            confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
          };
        }
        return {
          title: "No Answer",
          description: "The provider did not answer the call.",
          details: [
            "Provider will stay in the Follow Up queue",
            `Due date will be pushed to ${addDaysFormatted(2)}`,
            `This is attempt #${provider.no_answer_count + 1} of 3 before moving to Re-Engage`,
          ],
          confirmLabel: "Yes, mark as no answer",
          confirmClass: "bg-gray-800 hover:bg-gray-900 text-white",
        };
      case "wrong_contact":
        return {
          title: "Wrong Contact Info",
          description: "The contact information for this provider is incorrect.",
          details: [
            "Provider will be moved back to Not Contacted",
            "Their email will be cleared from the system",
            "You'll need to find correct contact info before re-engaging",
          ],
          confirmLabel: "Yes, clear contact info",
          confirmClass: "bg-gray-800 hover:bg-gray-900 text-white",
        };
      case "not_interested":
        return {
          title: "Not Interested",
          description: "The provider explicitly declined to claim their profile.",
          details: [
            "Provider will be moved to the Not Interested stage (soft terminal)",
            "They will no longer receive any outreach emails or calls",
            "Questions and connections can still flow to them",
            "Use Archive instead for a full system-wide block",
          ],
          confirmLabel: "Yes, mark as not interested",
          confirmClass: "bg-gray-800 hover:bg-gray-900 text-white",
        };
      default:
        return null;
    }
  };

  // Helper to format date for display
  function addDaysFormatted(days: number): string {
    const result = new Date();
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const handleOutcome = async (outcome: string) => {
    setSubmitting(outcome);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        provider_id: provider.provider_id,
        outcome,
      };
      if (notes.trim()) {
        body.notes = notes.trim();
      }
      if (outcome === "schedule_callback" && callbackDate) {
        body.callback_date = callbackDate;
      }

      const res = await fetch("/api/admin/provider-outreach/record-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state or notify parent
        if (data.stage_changed) {
          onOutcomeRecorded(true);
        } else {
          // Update provider in place with new counts/due_date
          onProviderUpdated({
            due_date: data.new_due_date ?? provider.due_date,
            resend_count: data.resend_count ?? provider.resend_count,
            no_answer_count: data.no_answer_count ?? provider.no_answer_count,
          });
          onOutcomeRecorded(false);
        }
        // Reset form
        setNotes("");
        setCallbackDate("");
        setShowDatePicker(false);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to record outcome");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(null);
      setPendingOutcome(null);
    }
  };

  const confirmationContent = pendingOutcome ? getConfirmationContent(pendingOutcome) : null;

  // Close action menu when clicking outside
  useEffect(() => {
    if (!showActionMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionMenu]);

  // Handle stage change from action menu
  const handleStageMove = async (newStage: OutreachStage) => {
    setStageChangeLoading(true);
    setShowActionMenu(false);
    try {
      await onStageChange(newStage);
    } catch {
      setError("Failed to move provider");
    } finally {
      setStageChangeLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Collapsed Row */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Expand Chevron */}
        <div className="w-5 shrink-0">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
          </svg>
        </div>

        {/* Provider Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={provider.slug ? `/admin/directory/${provider.slug}` : "#"}
              className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {provider.provider_name}
            </Link>
            <AdminChip
              adminId={provider.assigned_to}
              adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
              size="sm"
              showUnassigned={true}
            />
          </div>
          {provider.provider_category && (
            <p className="text-xs text-gray-500 truncate">{provider.provider_category}</p>
          )}
        </div>

        {/* Phone */}
        <div className="w-32 shrink-0">
          {provider.phone ? (
            <a
              href={`tel:${provider.phone.replace(/\D/g, "")}`}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {formatPhone(provider.phone)}
            </a>
          ) : (
            <span className="text-sm text-gray-400">No phone</span>
          )}
        </div>

        {/* Email */}
        <div className="w-44 shrink-0 truncate">
          {provider.email ? (
            <a
              href={`mailto:${provider.email}`}
              className="text-sm text-gray-600 hover:text-primary-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {provider.email}
            </a>
          ) : (
            <span className="text-sm text-gray-400">No email</span>
          )}
        </div>

        {/* Reason Chip */}
        <div className="w-24 shrink-0">
          {(() => {
            const reasonChip = getNeedsCallReasonChip(provider.needs_call_reason);
            return reasonChip ? (
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${reasonChip.className}`}>
                {reasonChip.label}
              </span>
            ) : null;
          })()}
        </div>

        {/* Due Date Badge */}
        <div className="w-32 shrink-0">
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${dueBadge.className}`}>
            {dueBadge.text}
          </span>
        </div>

        {/* Counters (subtle) */}
        <div className="w-20 shrink-0 text-xs text-gray-400">
          {provider.resend_count > 0 && <span className="mr-2">R:{provider.resend_count}</span>}
          {provider.no_answer_count > 0 && <span>NA:{provider.no_answer_count}</span>}
        </div>

        {/* Actions menu (three dots) */}
        <div className="relative shrink-0" ref={actionMenuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowActionMenu(!showActionMenu);
            }}
            disabled={stageChangeLoading}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 transition-all text-gray-300 hover:text-gray-600 disabled:opacity-50"
            title="More actions"
          >
            {stageChangeLoading ? (
              <span className="block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            )}
          </button>

          {/* Dropdown menu */}
          {showActionMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Move to stage
              </div>
              <button
                onClick={() => handleStageMove("not_contacted")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ready
              </button>
              <button
                onClick={() => handleStageMove("in_sequence")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                In Sequence
              </button>
              <button
                onClick={() => handleStageMove("re_engage")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Re-Engage
              </button>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Terminal
              </div>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setPendingOutcome("not_interested");
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Not Interested
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  onArchive();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Archive
              </button>
            </div>
          )}
        </div>

        {/* Remove from outreach (trash icon) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveProvider();
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 transition-all text-gray-300 hover:text-red-500 shrink-0"
          title="Remove from outreach"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Expanded: Outcome Buttons */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-4">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Date Picker for Schedule Callback */}
          {showDatePicker && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-gray-600">Callback date:</label>
              <input
                type="date"
                value={callbackDate}
                onChange={(e) => setCallbackDate(e.target.value)}
                min={getTodayISO()}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => {
                  if (callbackDate) {
                    setPendingOutcome("schedule_callback");
                  }
                }}
                disabled={!callbackDate || submitting !== null}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm date
              </button>
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  setCallbackDate("");
                }}
                className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Outcome Buttons - subtle outlined tags */}
          {/* Note: No "Claimed on call" button - auto-claim detection handles this automatically */}
          {/* when provider claims via any method (email, MedJobs, questions, direct website) */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Resend link */}
            <button
              onClick={() => setPendingOutcome("resend_link")}
              disabled={submitting !== null || resendDisabled}
              title={resendDisabled ? `Resend limit reached (${MAX_RESEND_COUNT} max)` : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors disabled:cursor-not-allowed ${
                resendDisabled
                  ? "text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Resend link{resendDisabled && " (max)"}
            </button>

            {/* Schedule callback */}
            <button
              onClick={() => setShowDatePicker(true)}
              disabled={submitting !== null || showDatePicker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Schedule callback
            </button>

            {/* No answer */}
            <button
              onClick={() => setPendingOutcome("no_answer")}
              disabled={submitting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              No answer{noAnswerWarning && " (→ Re-Engage)"}
            </button>

            {/* Wrong contact */}
            <button
              onClick={() => setPendingOutcome("wrong_contact")}
              disabled={submitting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Wrong contact
            </button>

            {/* Not interested (soft terminal) */}
            <button
              onClick={() => setPendingOutcome("not_interested")}
              disabled={submitting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:text-gray-800 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Not interested
            </button>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add call notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Confirmation Modal */}
          {pendingOutcome && confirmationContent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
              <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">{confirmationContent.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{provider.provider_name}</p>
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-700 mb-4">{confirmationContent.description}</p>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">What will happen:</p>
                    <ul className="space-y-1.5">
                      {confirmationContent.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-gray-400 mt-0.5">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {notes.trim() && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Note attached:</p>
                      <p className="text-sm text-blue-800">{notes.trim()}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => setPendingOutcome(null)}
                    disabled={submitting !== null}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleOutcome(pendingOutcome)}
                    disabled={submitting !== null}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmationContent.confirmClass}`}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      confirmationContent.confirmLabel
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FollowUpQueue({ providers, loading, onOutcomeRecorded, onProviderUpdated, onStageChange, onRemoveProvider, onArchive, adminNameLookup }: FollowUpQueueProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  // Group providers by due date sections
  const today = getTodayISO();

  // Note: Providers with null due_date are legacy records that entered needs_call
  // before the migration. Treat them as "Due Today" since they need attention.
  const overdue = providers.filter((p) => p.due_date && p.due_date < today);
  const dueToday = providers.filter((p) => !p.due_date || p.due_date === today);
  const upcoming = providers.filter((p) => p.due_date && p.due_date > today);

  // Sort each group by due_date ASC (oldest first)
  const sortByDueDate = (a: OutreachProvider, b: OutreachProvider) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  };

  overdue.sort(sortByDueDate);
  dueToday.sort(sortByDueDate);
  upcoming.sort(sortByDueDate);

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No providers in Follow Up queue</p>
      </div>
    );
  }

  const renderSection = (
    title: string,
    items: OutreachProvider[],
    headerClassName: string
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2 last:mb-0">
        <div className={`px-5 py-2 text-xs font-semibold uppercase tracking-wide ${headerClassName}`}>
          {title} ({items.length})
        </div>
        {items.map((provider) => (
          <FollowUpProviderRow
            key={provider.provider_id}
            provider={provider}
            isExpanded={expandedProviders.has(provider.provider_id)}
            onToggle={() => toggleProvider(provider.provider_id)}
            onOutcomeRecorded={(stageChanged) => {
              if (stageChanged) {
                // Remove from expanded since it's leaving the queue
                setExpandedProviders((prev) => {
                  const next = new Set(prev);
                  next.delete(provider.provider_id);
                  return next;
                });
              }
              onOutcomeRecorded(provider.provider_id, stageChanged);
            }}
            onProviderUpdated={(updates) => onProviderUpdated(provider.provider_id, updates)}
            onStageChange={async (newStage) => {
              await onStageChange(provider.provider_id, newStage);
              // Remove from expanded since provider is leaving the queue
              setExpandedProviders((prev) => {
                const next = new Set(prev);
                next.delete(provider.provider_id);
                return next;
              });
            }}
            onRemoveProvider={() => onRemoveProvider(provider)}
            onArchive={() => onArchive(provider)}
            adminNameLookup={adminNameLookup}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {renderSection("Overdue", overdue, "bg-red-50 text-red-700 border-b border-red-100")}
      {renderSection("Due Today", dueToday, "bg-amber-50 text-amber-700 border-b border-amber-100")}
      {renderSection("Upcoming", upcoming, "bg-gray-50 text-gray-600 border-b border-gray-100")}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-Engage Queue Component
// ─────────────────────────────────────────────────────────────────────────────

interface ReEngageQueueProps {
  providers: OutreachProvider[];
  loading: boolean;
  onReEngageAction: (providerId: string, result: { action: string; new_stage: string }) => void;
  onArchive: (provider: OutreachProvider) => void;
  adminNameLookup: Map<string, string>;
}

// Helper: calculate days since a date
function daysSince(dateString: string | null): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function ReEngageQueue({ providers, loading, onReEngageAction, onArchive, adminNameLookup }: ReEngageQueueProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleReEngage = async (provider: OutreachProvider) => {
    setActionLoading(provider.provider_id);
    try {
      const res = await fetch("/api/admin/provider-outreach/re-engage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process re-engage action");
      }

      const result = await res.json();
      onReEngageAction(provider.provider_id, result);
    } catch (err) {
      console.error("Re-engage error:", err);
      alert(err instanceof Error ? err.message : "Failed to process re-engage action");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No providers in Re-Engage queue</p>
      </div>
    );
  }

  // Sort by re_engage_entered_at (oldest first - most urgent)
  const sorted = [...providers].sort((a, b) => {
    if (!a.re_engage_entered_at && !b.re_engage_entered_at) return 0;
    if (!a.re_engage_entered_at) return 1;
    if (!b.re_engage_entered_at) return -1;
    return a.re_engage_entered_at.localeCompare(b.re_engage_entered_at);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="flex-1">Provider</div>
        <div className="w-20 text-center">Cycle</div>
        <div className="w-28 text-center">Waiting</div>
        <div className="w-56 text-right">Actions</div>
      </div>

      {/* Provider rows */}
      {sorted.map((provider) => {
        const waitDays = daysSince(provider.re_engage_entered_at);
        const isLoading = actionLoading === provider.provider_id;
        const isCycle2 = provider.cycle_number === 2;

        return (
          <div
            key={provider.provider_id}
            className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            {/* Provider info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900 truncate">
                  {provider.provider_name}
                </span>
                <AdminChip
                  adminId={provider.assigned_to}
                  adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
                  size="sm"
                  showUnassigned={true}
                />
              </div>
              <div className="text-xs text-gray-500 truncate">
                {provider.city}, {provider.state} {provider.email && `• ${provider.email}`}
              </div>
            </div>

            {/* Cycle badge */}
            <div className="w-20 text-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isCycle2
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                Cycle {provider.cycle_number}
              </span>
            </div>

            {/* Wait time */}
            <div className="w-28 text-center">
              <span className={`text-sm ${waitDays >= 30 ? "text-emerald-600 font-medium" : "text-gray-600"}`}>
                {waitDays} day{waitDays !== 1 ? "s" : ""}
              </span>
              {waitDays >= 30 && (
                <div className="text-[10px] text-emerald-600">Ready</div>
              )}
            </div>

            {/* Actions */}
            <div className="w-56 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleReEngage(provider)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCycle2
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : isCycle2 ? (
                  "Archive (2 cycles done)"
                ) : (
                  "Re-engage now"
                )}
              </button>

              <button
                type="button"
                onClick={() => onArchive(provider)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        {providers.length} provider{providers.length !== 1 ? "s" : ""} in Re-Engage queue
        {" • "}
        {providers.filter(p => daysSince(p.re_engage_entered_at) >= 30).length} ready for action (30+ days)
      </div>
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

  // Active UI tab (needs_email and ready are filtered views of not_contacted)
  const [activeTab, setActiveTab] = useState<UITab>("needs_email");

  // Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchResult, setIsSearchResult] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Admin filter state (replaces My Assignments checkbox)
  const [adminCounts, setAdminCounts] = useState<AdminCounts>({});
  const [selectedAdminFilter, setSelectedAdminFilter] = useState<string | null>(null);

  // All admins for name lookup (fetched once)
  interface AdminUser {
    id: string;
    email: string;
    display_name: string | null;
  }
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Legacy: kept for backwards compatibility with assigned_to=me URL param
  const myAssignmentsOnly = false; // No longer used, but kept for query param handling

  // Cities data (for needs_email and ready tabs)
  const [cities, setCities] = useState<CityStats[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);

  // City owners for assignment
  interface CityOwner {
    city: string;
    owner_id: string | null;
    owner_name: string | null;
  }
  const [cityOwners, setCityOwners] = useState<Map<string, CityOwner>>(new Map());
  const [editingCityAssignment, setEditingCityAssignment] = useState<string | null>(null);

  // Providers data
  const [providers, setProviders] = useState<OutreachProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Stage counts (includes needs_email and ready for UI tabs)
  interface TabCounts extends Record<OutreachStage, number> {
    needs_email: number;
    ready: number;
  }
  const [stageCounts, setStageCounts] = useState<TabCounts>({
    not_contacted: 0,
    in_sequence: 0,
    needs_call: 0,
    re_engage: 0,
    not_interested: 0,
    claimed: 0,
    archived: 0,
    needs_email: 0,
    ready: 0,
  });

  // Admin name lookup from allAdmins + admin_counts (fallback)
  const adminNameLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    // First, add all admins
    for (const admin of allAdmins) {
      const name = admin.display_name || admin.email.split("@")[0];
      lookup.set(admin.id, name);
    }
    // Then, add/update from admin_counts (in case they have more recent names)
    for (const [adminId, data] of Object.entries(adminCounts)) {
      if (adminId !== "unassigned" && data.display_name) {
        lookup.set(adminId, data.display_name);
      }
    }
    return lookup;
  }, [allAdmins, adminCounts]);

  // Expanded cities (for not_contacted tab)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Selected providers
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  // Stats section expanded state
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Global claimed count (fetched separately, not derived from active states)
  const [globalClaimedCount, setGlobalClaimedCount] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add State modal state
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [addStateSearch, setAddStateSearch] = useState("");
  const [addingState, setAddingState] = useState<string | null>(null);
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});
  const [loadingStateCounts, setLoadingStateCounts] = useState(false);
  const [stateCountsError, setStateCountsError] = useState(false);

  // State actions menu (for refresh, status change, delete)
  const [stateActionsMenu, setStateActionsMenu] = useState<string | null>(null);
  const [stateActionLoading, setStateActionLoading] = useState<string | null>(null);

  // Delete state confirmation modal
  const [stateToDelete, setStateToDelete] = useState<{ code: string; name: string } | null>(null);
  const [deletingState, setDeletingState] = useState(false);

  // State selector dropdown in header
  const [showStateSelector, setShowStateSelector] = useState(false);

  // Action modal state
  const [actionModalProvider, setActionModalProvider] = useState<OutreachProvider | null>(null);
  const [selectedAction, setSelectedAction] = useState<"archived" | "unhide" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  // Unarchive preview state
  const [unarchivePreview, setUnarchivePreview] = useState<{
    archived_questions_count: number;
    connections_affected_count: number;
    loading: boolean;
  } | null>(null);
  const [unarchivePreviewConfirmed, setUnarchivePreviewConfirmed] = useState(false);

  // Remove from outreach confirmation state
  const [pendingRemoval, setPendingRemoval] = useState<{
    providerId: string;
    providerName: string;
    stage: string;
  } | null>(null);
  const [removingProvider, setRemovingProvider] = useState(false);

  // Sequence confirmation modal state
  const [showSequenceConfirm, setShowSequenceConfirm] = useState(false);
  const [sequenceConfirmProviders, setSequenceConfirmProviders] = useState<OutreachProvider[]>([]);
  const [sequenceAssigneeId, setSequenceAssigneeId] = useState<string | null>(null);
  const [sequenceAssigneeName, setSequenceAssigneeName] = useState<string | null>(null);
  const [showAssigneeAutocomplete, setShowAssigneeAutocomplete] = useState(false);
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
  const [sequencePreviewError, setSequencePreviewError] = useState<string | null>(null);
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


  // Global stats computed from activeStates
  const globalStats = useMemo(() => {
    const codes = activeStates.map(s => s.state_code);
    // Truncate state list after 5 to avoid overflow
    const statesList = codes.length <= 5
      ? codes.join(" · ")
      : `${codes.slice(0, 5).join(" · ")} +${codes.length - 5} more`;

    const stats = {
      totalStates: activeStates.length,
      statesList,
      totalProviders: 0,
      inSequence: 0,
      needsCall: 0,
    };
    for (const state of activeStates) {
      stats.totalProviders += state.total_providers;
      stats.inSequence += state.in_sequence;
      stats.needsCall += state.needs_call;
    }
    return stats;
  }, [activeStates]);

  // Close action modal and reset state
  const closeActionModal = () => {
    setActionModalProvider(null);
    setSelectedAction(null);
    setActionReason("");
    setActionNotes("");
    setUnarchivePreview(null);
    setUnarchivePreviewConfirmed(false);
  };

  // Remove provider from outreach (delete tracking row, not the provider itself)
  const handleRemoveFromOutreach = async () => {
    if (!pendingRemoval) return;

    setRemovingProvider(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: pendingRemoval.providerId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove provider");
      }

      // Remove from local state
      setProviders((prev) => prev.filter((p) => p.provider_id !== pendingRemoval.providerId));

      // Update stage counts
      const oldStage = pendingRemoval.stage as OutreachStage;
      if (oldStage === "not_contacted") {
        // Could be in needs_email or ready - refresh cities
        fetchCities();
      } else {
        setStageCounts((prev) => ({
          ...prev,
          [oldStage]: Math.max(0, (prev[oldStage] || 0) - 1),
        }));
      }

      showToast(`Removed ${pendingRemoval.providerName} from outreach`, "success");
      setPendingRemoval(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove provider";
      showToast(message, "error");
    } finally {
      setRemovingProvider(false);
    }
  };

  // Fetch sequence preview from launch-sequence API
  const fetchSequencePreview = useCallback(async (providerIds: string[]) => {
    if (providerIds.length === 0) return;

    setSequencePreviewLoading(true);
    setSequencePreviewError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/launch-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_ids: providerIds, dry_run: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setSequencePreviewData(data);
        setSequencePreviewError(null);
        // Set initial preview provider to first valid one
        const firstValid = data.providers?.find((p: { valid: boolean }) => p.valid);
        if (firstValid) {
          setPreviewProviderId(firstValid.provider_id);
        }
        setPreviewDay(0); // Start with Day 0 (intro email)
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `API error: ${res.status}`;
        console.error("Failed to fetch sequence preview:", errorMsg);
        setSequencePreviewError(errorMsg);
        setSequencePreviewData(null);
      }
    } catch (error) {
      console.error("Error fetching sequence preview:", error);
      setSequencePreviewError(error instanceof Error ? error.message : "Network error");
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

  // Fetch all admins (for name lookup)
  const fetchAllAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/admins");
      if (res.ok) {
        const data = await res.json();
        setAllAdmins(data.admins || []);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

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

  // Fetch city owners for the selected state
  const fetchCityOwners = useCallback(async () => {
    if (!selectedState) return;

    try {
      const res = await fetch(`/api/admin/provider-outreach/assign-city?state=${selectedState}`);
      if (res.ok) {
        const data = await res.json();
        const ownerMap = new Map<string, CityOwner>();
        for (const owner of data.city_owners || []) {
          ownerMap.set(owner.city, owner);
        }
        setCityOwners(ownerMap);
      } else {
        // Non-critical: just log, don't show toast
        console.error("Failed to fetch city owners: API returned", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch city owners:", err);
    }
  }, [selectedState]);

  // Assign city to an admin
  const assignCity = async (city: string, ownerId: string | null, ownerName: string | null) => {
    if (!selectedState) return;

    try {
      const res = await fetch("/api/admin/provider-outreach/assign-city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: selectedState,
          city,
          owner_id: ownerId,
          owner_name: ownerName,
        }),
      });

      if (res.ok) {
        // Update local state
        setCityOwners((prev) => {
          const next = new Map(prev);
          next.set(city, { city, owner_id: ownerId, owner_name: ownerName });
          return next;
        });
        setEditingCityAssignment(null);
        showToast(ownerId ? `Assigned ${city} to ${ownerName}` : `Unassigned ${city}`, "success");
        // Refresh providers to update assigned_to on individual rows and filter chip counts
        fetchProviders();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to assign city", "error");
      }
    } catch (err) {
      console.error("Failed to assign city:", err);
      showToast("Failed to assign city", "error");
    }
  };

  // Fetch providers for current tab/state (or search)
  const fetchProviders = useCallback(async (city?: string, searchTerm?: string) => {
    if (!selectedState) return;
    setLoadingProviders(true);

    try {
      // Map UI tab to API parameters
      const { stage, emailFilter } = getApiParamsForTab(activeTab);
      const params = new URLSearchParams({
        state: selectedState,
        stage,
      });
      if (emailFilter) params.set("email_filter", emailFilter);
      if (city) params.set("city", city);
      if (searchTerm) params.set("search", searchTerm);
      // Handle admin filter - "unassigned" filters for null assigned_to
      if (selectedAdminFilter && selectedAdminFilter !== "unassigned") {
        params.set("assigned_to", selectedAdminFilter);
      }

      const res = await fetch(`/api/admin/provider-outreach?${params}`);
      if (res.ok) {
        const data = await res.json();
        let filteredProviders = data.providers || [];
        // Client-side filter for "unassigned" since API doesn't support null filter directly
        if (selectedAdminFilter === "unassigned") {
          filteredProviders = filteredProviders.filter((p: OutreachProvider) => !p.assigned_to);
        }
        setProviders(filteredProviders);
        setIsSearchResult(!!data.is_search);
        if (data.stage_counts) {
          setStageCounts(data.stage_counts);
        }
        // Use API admin_counts if provided, otherwise compute from provider list
        if (data.admin_counts && Object.keys(data.admin_counts).length > 0) {
          setAdminCounts(data.admin_counts);
        } else {
          // Compute admin counts from provider list (for not_contacted stage)
          const computed: AdminCounts = {};
          for (const p of data.providers || []) {
            const key = p.assigned_to || "unassigned";
            if (!computed[key]) {
              computed[key] = { count: 0 };
            }
            computed[key].count++;
          }
          setAdminCounts(computed);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to fetch providers", "error");
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
      showToast("Failed to fetch providers", "error");
    } finally {
      setLoadingProviders(false);
    }
  }, [selectedState, activeTab, selectedAdminFilter]);

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

  // Effect: fetch global claimed count on mount (truly global, not filtered by active states)
  useEffect(() => {
    const fetchGlobalClaimed = async () => {
      try {
        const res = await fetch("/api/admin/provider-outreach/stats?metric=claimed");
        if (res.ok) {
          const data = await res.json();
          setGlobalClaimedCount(data.total ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch global claimed count:", err);
      }
    };
    fetchGlobalClaimed();
  }, []);

  // Effect: fetch provider counts when Add State modal opens
  useEffect(() => {
    if (!showAddStateModal) return;

    const fetchStateCounts = async () => {
      setLoadingStateCounts(true);
      setStateCountsError(false);
      try {
        const res = await fetch("/api/admin/provider-outreach/states/counts");
        if (res.ok) {
          const data = await res.json();
          const countsMap: Record<string, number> = {};
          for (const item of data.counts || []) {
            countsMap[item.state_code] = item.provider_count;
          }
          setStateCounts(countsMap);
        } else {
          setStateCountsError(true);
        }
      } catch (err) {
        console.error("Failed to fetch state counts:", err);
        setStateCountsError(true);
      } finally {
        setLoadingStateCounts(false);
      }
    };

    fetchStateCounts();
  }, [showAddStateModal]);

  // Effect: fetch all admins on mount (for name lookup)
  useEffect(() => {
    fetchAllAdmins();
  }, [fetchAllAdmins]);

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

  // Effect: fetch cities when state changes (for needs_email/ready tabs, when not searching)
  useEffect(() => {
    if (isNotContactedTab(activeTab) && !debouncedSearch) {
      fetchCities();
    }
  }, [selectedState, activeTab, debouncedSearch, fetchCities]);

  // Effect: fetch city owners when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCityOwners();
    }
  }, [selectedState, fetchCityOwners]);

  // Effect: fetch providers and stage counts when state/tab/search changes
  useEffect(() => {
    if (selectedState) {
      fetchProviders(undefined, debouncedSearch || undefined);
    }
  }, [selectedState, activeTab, debouncedSearch, fetchProviders]);

  // Effect: fetch providers when a city is expanded (only when not searching)
  useEffect(() => {
    if (isNotContactedTab(activeTab) && expandedCities.size > 0 && !debouncedSearch) {
      fetchProviders();
    }
  }, [expandedCities, activeTab, debouncedSearch, fetchProviders]);

  // Clear selection, providers, and stage counts when tab/state/search changes
  useEffect(() => {
    setSelectedProviders(new Set());
    setExpandedCities(new Set());
    setProviders([]);
    // Clear stage counts when STATE changes (not tab) to avoid showing stale data
    // Stage counts are state-level, so changing tab within same state keeps counts
  }, [activeTab, selectedState, debouncedSearch]);

  // Separate effect to clear stage counts only when state changes
  const prevStateRef = useRef(selectedState);
  useEffect(() => {
    if (prevStateRef.current !== selectedState) {
      setStageCounts({
        not_contacted: 0,
        in_sequence: 0,
        needs_call: 0,
        re_engage: 0,
        not_interested: 0,
        claimed: 0,
        archived: 0,
        needs_email: 0,
        ready: 0,
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

  // Handle deleting a state - shows confirmation modal
  const handleDeleteState = (stateCode: string, stateName: string) => {
    setStateActionsMenu(null); // Close menu before showing modal
    setStateToDelete({ code: stateCode, name: stateName });
  };

  // Actually perform the deletion after confirmation
  const confirmDeleteState = async () => {
    if (!stateToDelete) return;
    const { code: stateCode, name: stateName } = stateToDelete;
    setDeletingState(true);
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
      setStateToDelete(null);
    } catch (err) {
      console.error("Failed to delete state:", err);
      showToast(err instanceof Error ? err.message : "Failed to remove state", "error");
    } finally {
      setDeletingState(false);
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
        // Use UI_TAB_LABELS for the target stage display
        const stageLabel = UI_TAB_LABELS[newStage as UITab] || newStage;
        showToast(`Moved ${data.updated + data.created} provider(s) to ${stageLabel}`, "success");
        setSelectedProviders(new Set());

        // Refresh data
        if (isNotContactedTab(activeTab)) {
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
    action: "not_contacted" | "archived",
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
        const actionLabel = action === "not_contacted" ? "Restored" : "Archived";
        showToast(`Marked as ${actionLabel}`, "success");

        // Refresh data
        if (isNotContactedTab(activeTab)) {
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

  // Available actions based on current tab
  // Note: "Mark Claimed" is NOT included because Claimed auto-syncs from business_profiles
  // Note: Archive removed from bulk actions - use individual provider modal instead
  const getAvailableActions = (): { stage: OutreachStage; label: string; color: string; requiresEmail?: boolean }[] => {
    switch (activeTab) {
      case "needs_email":
        // Providers without email - can only add email (no bulk actions)
        return [];
      case "ready":
        // Providers with email - can move to sequence
        return [
          { stage: "in_sequence", label: "Move to In Sequence", color: "bg-primary-600 hover:bg-primary-700", requiresEmail: true },
        ];
      case "in_sequence":
        return [
          { stage: "needs_call", label: "Move to Follow Up", color: "bg-amber-600 hover:bg-amber-700" },
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-500 hover:bg-gray-600" },
        ];
      case "needs_call":  // Follow Up - no bulk actions, use individual outcome buttons instead
        return [];
      case "re_engage":
        return [
          { stage: "in_sequence", label: "Move to In Sequence", color: "bg-primary-600 hover:bg-primary-700" },
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-500 hover:bg-gray-600" },
        ];
      default:
        // Terminal stages (archived, claimed) - allow moving back to not_contacted
        return [
          { stage: "not_contacted", label: "Reset to Not Contacted", color: "bg-gray-600 hover:bg-gray-700" },
        ];
    }
  };

  // Build tabs from UI_TABS with correct counts
  const tabs = UI_TABS.map((tab) => ({
    value: tab,
    label: UI_TAB_LABELS[tab],
    count: stageCounts[tab] ?? 0,
    isTerminal: TERMINAL_STAGES.includes(tab as OutreachStage),
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

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Provider Cold Outreach</h1>
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
                  setStateActionsMenu(null);
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
                {selectedState ? (
                  <>
                    {(() => {
                      const currentState = activeStates.find(s => s.state_code === selectedState);
                      if (!currentState) return null;
                      if (currentState.status === "completed") {
                        return (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        );
                      }
                      return (
                        <span className={`w-2 h-2 rounded-full ${currentState.status === "paused" ? "bg-amber-500" : "bg-green-500"}`} />
                      );
                    })()}
                    {US_STATES.find((s) => s.value === selectedState)?.label || selectedState}
                  </>
                ) : (
                  "Select State"
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStateSelector && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-96 overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeStates.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Your States ({activeStates.length})
                      </div>
                      <div className="overflow-y-auto max-h-64">
                        {activeStates.map((state) => {
                          const isSelected = selectedState === state.state_code;
                          return (
                            <button
                              key={state.state_code}
                              onClick={() => {
                                setSelectedState(state.state_code);
                                setShowStateSelector(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${isSelected ? "bg-primary-50" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {state.status === "completed" ? (
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className={`w-2 h-2 rounded-full ${state.status === "paused" ? "bg-amber-500" : "bg-green-500"}`} />
                                )}
                                <span className={`text-sm font-medium ${isSelected ? "text-primary-700" : "text-gray-900"}`}>{state.state_name}</span>
                                <span className="text-xs text-gray-400">({state.state_code})</span>
                              </div>
                              <span className="text-xs text-gray-400">{state.total_providers.toLocaleString()}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-100" />
                    </>
                  )}
                  {loadingActiveStates && (
                    <div className="px-3 py-4 text-center text-gray-400">
                      <svg className="animate-spin h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}
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

            {selectedState && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStateSelector(false);
                    setStateActionsMenu(stateActionsMenu === selectedState ? null : selectedState);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="State actions"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {stateActionsMenu === selectedState && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleRefreshStateStats(selectedState)} disabled={stateActionLoading === selectedState} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
                      {stateActionLoading === selectedState ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      )}
                      Refresh Stats
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {(() => {
                      const currentState = activeStates.find(s => s.state_code === selectedState);
                      if (!currentState) return null;
                      return (
                        <>
                          {currentState.status !== "active" && <button onClick={() => handleUpdateStateStatus(selectedState, "active")} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Mark Active</button>}
                          {currentState.status !== "paused" && <button onClick={() => handleUpdateStateStatus(selectedState, "paused")} className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-gray-50">Mark Paused</button>}
                          {currentState.status !== "completed" && <button onClick={() => handleUpdateStateStatus(selectedState, "completed")} className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-gray-50">Mark Completed</button>}
                        </>
                      );
                    })()}
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { const stateName = activeStates.find(s => s.state_code === selectedState)?.state_name || selectedState; handleDeleteState(selectedState, stateName); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Remove State</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat Boxes */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3" title="Number of states you've added for outreach work">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Active States</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{globalStats.totalStates}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">{globalStats.statesList || "No states added"}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3" title="Total providers across all active states">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Providers</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{globalStats.totalProviders.toLocaleString()}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">across active states</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3" title="Providers who have claimed their profile (all states)">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Claimed</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{globalClaimedCount !== null ? globalClaimedCount.toLocaleString() : "—"}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">all states, all time</p>
          </div>
        </div>
      </div>

      {/* Stage Tabs - only show when a state is selected */}
      {selectedState && (
        <div className="flex items-center justify-between mb-6 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.value
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
        </div>
      )}

      {/* Admin Filter Chips - show on tabs where assignment applies */}
      {selectedState && ["needs_email", "ready", "in_sequence", "needs_call", "re_engage", "not_interested"].includes(activeTab) && (
        <AdminFilterChips
          adminCounts={adminCounts}
          totalCount={
            activeTab === "needs_email" ? stageCounts.needs_email :
            activeTab === "ready" ? stageCounts.ready :
            activeTab === "in_sequence" ? stageCounts.in_sequence :
            activeTab === "needs_call" ? stageCounts.needs_call :
            activeTab === "re_engage" ? stageCounts.re_engage :
            activeTab === "not_interested" ? stageCounts.not_interested :
            0
          }
          selectedAdminId={selectedAdminFilter}
          onSelect={(adminId) => setSelectedAdminFilter(adminId)}
          tabKey={activeTab}
        />
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
                label="Follow Up"
                value={stageCounts.needs_call}
                subtitle="sequence complete"
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
                  stageCounts.in_sequence + stageCounts.needs_call + stageCounts.claimed > 0
                    ? Math.round(
                        (stageCounts.claimed /
                          (stageCounts.in_sequence + stageCounts.needs_call + stageCounts.claimed)) *
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
                      setShowSequencePreview(true); // Auto-expand preview accordion
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

      {/* Search mode info - show when providers selected during search */}
      {selectedProviders.size > 0 && isSearchResult && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedProviders.size} provider{selectedProviders.size === 1 ? "" : "s"} selected
            </span>
            <span className="text-xs text-gray-400">— Use the action menu (•••) on each row to move providers</span>
          </div>
          <button
            onClick={() => setSelectedProviders(new Set())}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Content - Search results (flat list) or City-grouped view */}
      <div className="bg-white rounded-xl border border-gray-200">
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
                    {/* Stage Badge + Assignment */}
                    <div className="w-28 flex items-center gap-1.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        provider.stage === "claimed" ? "bg-emerald-100 text-emerald-700" :
                        provider.stage === "in_sequence" ? "bg-blue-100 text-blue-700" :
                        provider.stage === "needs_call" ? "bg-amber-100 text-amber-700" :
                        provider.stage === "re_engage" ? "bg-blue-100 text-blue-700" :
                        provider.stage === "archived" ? "bg-gray-100 text-gray-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {STAGE_LABELS[provider.stage]}
                      </span>
                      <AdminChip
                        adminId={provider.assigned_to}
                        adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
                        size="sm"
                        showUnassigned={true}
                      />
                    </div>
                    {/* Actions - hide for claimed only (archived can be unarchived) */}
                    <div className="w-10 flex items-center gap-1">
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
                      {/* Remove from outreach (trash icon) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingRemoval({
                            providerId: provider.provider_id,
                            providerName: provider.provider_name,
                            stage: provider.stage,
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 transition-all text-gray-300 hover:text-red-500"
                        title="Remove from outreach"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
        ) : activeTab === "needs_call" ? (
          // Follow Up tab: due-date grouped queue view
          <FollowUpQueue
            providers={providers}
            loading={loadingProviders}
            onOutcomeRecorded={(providerId, stageChanged) => {
              if (stageChanged) {
                // Provider left the queue - remove from local state
                setProviders((prev) => prev.filter((p) => p.provider_id !== providerId));
                // Optimistically decrement needs_call count
                setStageCounts((prev) => ({
                  ...prev,
                  needs_call: Math.max(0, prev.needs_call - 1),
                }));
              }
              // Refresh to get updated counts
              fetchProviders();
            }}
            onProviderUpdated={(providerId, updates) => {
              // Update provider in place (new due_date, counters, etc.)
              setProviders((prev) =>
                prev.map((p) =>
                  p.provider_id === providerId ? { ...p, ...updates } : p
                )
              );
            }}
            onStageChange={async (providerId, newStage) => {
              // Call update-stage API directly
              const res = await fetch("/api/admin/provider-outreach/update-stage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  provider_ids: [providerId],
                  stage: newStage,
                }),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update stage");
              }
              // Remove from local state (provider left Follow Up)
              setProviders((prev) => prev.filter((p) => p.provider_id !== providerId));
              // Update stage counts
              setStageCounts((prev) => ({
                ...prev,
                needs_call: Math.max(0, prev.needs_call - 1),
                [newStage]: (prev[newStage] || 0) + 1,
              }));
              // Refresh to sync
              fetchProviders();
            }}
            onRemoveProvider={(provider) => {
              setPendingRemoval({
                providerId: provider.provider_id,
                providerName: provider.provider_name,
                stage: provider.stage,
              });
            }}
            onArchive={(provider) => {
              setActionModalProvider(provider);
            }}
            adminNameLookup={adminNameLookup}
          />
        ) : activeTab === "re_engage" ? (
          // Re-Engage tab: cycle-aware queue view
          <ReEngageQueue
            providers={providers}
            loading={loadingProviders}
            onReEngageAction={(providerId, result) => {
              // Provider moved out of re_engage - remove from local state
              setProviders((prev) => prev.filter((p) => p.provider_id !== providerId));
              // Update stage counts
              setStageCounts((prev) => ({
                ...prev,
                re_engage: Math.max(0, prev.re_engage - 1),
                ...(result.new_stage === "not_contacted" && { ready: prev.ready + 1 }),
                ...(result.new_stage === "not_interested" && { not_interested: prev.not_interested + 1 }),
                ...(result.new_stage === "archived" && { archived: prev.archived + 1 }),
              }));
              // Refresh to sync
              fetchProviders();
            }}
            onArchive={(provider) => {
              setActionModalProvider(provider);
            }}
            adminNameLookup={adminNameLookup}
          />
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
              // For needs_email/ready tabs, use the cities API data; for other stages, compute from providers
              // Filter to only show cities with providers for the active tab
              let displayCities = isNotContactedTab(activeTab) ? cities : computeCityStatsFromProviders(providers);
              if (activeTab === "needs_email") {
                displayCities = displayCities.filter((c) => c.needs_email > 0);
              } else if (activeTab === "ready") {
                displayCities = displayCities.filter((c) => c.has_email > 0);
              }
              const isLoading = isNotContactedTab(activeTab) ? loadingCities : loadingProviders;
              const emptyMessage = isNotContactedTab(activeTab)
                ? `No ${activeTab === "needs_email" ? "providers needing email" : "ready providers"} in ${selectedState}`
                : `No providers in ${UI_TAB_LABELS[activeTab]}`;

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
                      activeTab={activeTab}
                      isExpanded={expandedCities.has(city.city)}
                      onToggle={() => toggleCity(city.city)}
                      providers={providers}
                      loadingProviders={loadingProviders}
                      selectedProviders={selectedProviders}
                      onToggleProvider={toggleProvider}
                      onSelectAllInCity={selectAllInCity}
                      onEmailSaved={(providerId, newEmail) => {
                        // Update local providers state
                        // On "Needs Email" tab, remove the provider (it now has email, belongs in "Ready")
                        // On other tabs, just update the email field
                        if (activeTab === "needs_email") {
                          setProviders((prev) => prev.filter((p) => p.provider_id !== providerId));
                          // Optimistically update tab counts: needs_email -1, ready +1
                          setStageCounts((prev) => ({
                            ...prev,
                            needs_email: Math.max(0, prev.needs_email - 1),
                            ready: prev.ready + 1,
                          }));
                        } else {
                          setProviders((prev) =>
                            prev.map((p) =>
                              p.provider_id === providerId ? { ...p, email: newEmail } : p
                            )
                          );
                        }
                        // Refresh cities to update counts (for needs_email/ready tabs)
                        if (isNotContactedTab(activeTab)) {
                          fetchCities();
                        }
                      }}
                      onOpenActionModal={setActionModalProvider}
                      onRemoveProvider={(provider) => {
                        setPendingRemoval({
                          providerId: provider.provider_id,
                          providerName: provider.provider_name,
                          stage: provider.stage,
                        });
                      }}
                      cityOwnerId={cityOwners.get(city.city)?.owner_id || null}
                      cityOwnerName={cityOwners.get(city.city)?.owner_name || null}
                      isEditingAssignment={editingCityAssignment === city.city}
                      onStartEditAssignment={() => setEditingCityAssignment(city.city)}
                      onAssignCity={(ownerId, ownerName) => assignCity(city.city, ownerId, ownerName)}
                      onCancelEditAssignment={() => setEditingCityAssignment(null)}
                    />
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Summary */}
      {isNotContactedTab(activeTab) && !loadingCities && !isSearchResult && (
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

                {/* Remove Assignment - only show if provider is assigned */}
                {actionModalProvider.assigned_to && (
                  <button
                    onClick={async () => {
                      setActionLoading(true);
                      try {
                        const res = await fetch("/api/admin/provider-outreach/update-assignment", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider_id: actionModalProvider.provider_id,
                            assigned_to: null,
                          }),
                        });
                        if (res.ok) {
                          closeActionModal();
                          fetchProviders();
                        }
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Remove Assignment</p>
                        <p className="text-xs text-gray-500">Unassign this provider so anyone can pick it up</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Move to Stage Section */}
                {!["claimed", "archived"].includes(actionModalProvider.stage) && (
                  <>
                    <div className="border-t border-gray-100 my-3" />
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">Move to Stage</p>
                    <div className="grid grid-cols-2 gap-2">
                      {actionModalProvider.stage !== "not_contacted" && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const res = await fetch("/api/admin/provider-outreach/update-stage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  provider_ids: [actionModalProvider.provider_id],
                                  stage: "not_contacted",
                                }),
                              });
                              if (res.ok) {
                                showToast("Moved to Ready", "success");
                                closeActionModal();
                                fetchProviders();
                                if (isNotContactedTab(activeTab)) fetchCities();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                showToast(err.error || "Failed to move provider", "error");
                              }
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Ready
                        </button>
                      )}
                      {actionModalProvider.stage !== "in_sequence" && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const res = await fetch("/api/admin/provider-outreach/update-stage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  provider_ids: [actionModalProvider.provider_id],
                                  stage: "in_sequence",
                                }),
                              });
                              if (res.ok) {
                                showToast("Moved to In Sequence", "success");
                                closeActionModal();
                                fetchProviders();
                                if (isNotContactedTab(activeTab)) fetchCities();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                showToast(err.error || "Failed to move provider", "error");
                              }
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                        >
                          In Sequence
                        </button>
                      )}
                      {actionModalProvider.stage !== "needs_call" && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const res = await fetch("/api/admin/provider-outreach/update-stage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  provider_ids: [actionModalProvider.provider_id],
                                  stage: "needs_call",
                                }),
                              });
                              if (res.ok) {
                                showToast("Moved to Follow Up", "success");
                                closeActionModal();
                                fetchProviders();
                                if (isNotContactedTab(activeTab)) fetchCities();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                showToast(err.error || "Failed to move provider", "error");
                              }
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-3 py-2 text-sm text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                          Follow Up
                        </button>
                      )}
                      {actionModalProvider.stage !== "re_engage" && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const res = await fetch("/api/admin/provider-outreach/update-stage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  provider_ids: [actionModalProvider.provider_id],
                                  stage: "re_engage",
                                }),
                              });
                              if (res.ok) {
                                showToast("Moved to Re-Engage", "success");
                                closeActionModal();
                                fetchProviders();
                                if (isNotContactedTab(activeTab)) fetchCities();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                showToast(err.error || "Failed to move provider", "error");
                              }
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-3 py-2 text-sm text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                        >
                          Re-Engage
                        </button>
                      )}
                    </div>
                  </>
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
                    if (selectedAction === "unhide" && unarchivePreviewConfirmed) {
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
                  {selectedAction === "unhide" && unarchivePreviewConfirmed ? "Back to Preview" : "Back"}
                </button>

                {/* Unarchive Preview Step - show impact before reason selection */}
                {selectedAction === "unhide" && !unarchivePreviewConfirmed && (
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
                {(selectedAction !== "unhide" || unarchivePreviewConfirmed) && (
                  <>
                    {/* Action description */}
                    <div className={`p-3 rounded-lg ${
                      selectedAction === "archived" ? "bg-amber-50 border border-amber-200" :
                      selectedAction === "unhide" ? "bg-emerald-50 border border-emerald-200" :
                      "bg-gray-50 border border-gray-200"
                    }`}>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAction === "archived" ? "Archive Provider" :
                         selectedAction === "unhide" ? "Unarchive Provider" :
                         "Unknown Action"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selectedAction === "archived" ? "Provider will be archived and removed from active outreach. This also stops emails from Questions and Connections." :
                         selectedAction === "unhide" ? "Provider will be restored to Not Contacted and will receive outreach again. This also restores Questions and Connections emails." :
                         ""}
                      </p>
                    </div>

                    {/* Reason dropdown */}
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
                        {(selectedAction === "archived" ? ARCHIVE_REASONS : UNARCHIVE_REASONS).map((reason) => (
                          <option key={reason.value} value={reason.value}>{reason.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes textarea */}
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
              {selectedAction && !(selectedAction === "unhide" && !unarchivePreviewConfirmed) && (
                <button
                  onClick={async () => {
                    if (!actionReason) return;
                    if (actionReason === "other" && !actionNotes.trim()) return;
                    // Map "unhide" to "not_contacted" stage
                    const stageToSet = selectedAction === "unhide" ? "not_contacted" : selectedAction;
                    // Detect if this is an unarchive scenario (moving from archived to not_contacted)
                    const isUnarchiving = selectedAction === "unhide";
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
                    !actionReason ||
                    (actionReason === "other" && !actionNotes.trim())
                  }
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAction === "archived" ? "bg-amber-600 hover:bg-amber-700" :
                    selectedAction === "unhide" ? "bg-emerald-600 hover:bg-emerald-700" :
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
            setSequenceAssigneeId(null);
            setSequenceAssigneeName(null);
            setShowAssigneeAutocomplete(false);
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

              {/* Assigned To */}
              <div className="mb-5">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Assigned To
                </h4>
                <div className="flex items-center gap-2">
                  {showAssigneeAutocomplete ? (
                    <div className="flex-1">
                      <AdminAutocomplete
                        selectedAdminId={sequenceAssigneeId}
                        selectedAdminName={sequenceAssigneeName}
                        onSelect={(id, name) => {
                          setSequenceAssigneeId(id);
                          setSequenceAssigneeName(name);
                          setShowAssigneeAutocomplete(false);
                        }}
                        onClose={() => setShowAssigneeAutocomplete(false)}
                        placeholder="Search admins..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAssigneeAutocomplete(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <AdminChip
                        adminId={sequenceAssigneeId}
                        adminName={sequenceAssigneeName}
                        size="sm"
                      />
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

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
                    ) : sequencePreviewError ? (
                      <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-center text-sm text-red-600">
                        <p className="font-medium">Failed to load email preview</p>
                        <p className="mt-1 text-xs text-red-500">{sequencePreviewError}</p>
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
                                  <p><span className="font-medium text-gray-600">From:</span> Dr. Logan DuBose · Olera &lt;noreply@oleracare.com&gt;</p>
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
                          <p className="text-xs text-gray-500 mt-1">Profile gaps and value proposition</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Day 7</span>
                            <span className="text-xs text-gray-400">+7 days</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">Demand-loss Email</p>
                          <p className="text-xs text-gray-500 mt-1">What families couldn't ask you</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Day 14</span>
                            <span className="text-xs text-gray-400">+14 days</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">Summary Email</p>
                          <p className="text-xs text-gray-500 mt-1">Everything in one place</p>
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
                  setSequencePreviewError(null);
                  setPreviewProviderId(null);
                  setPreviewDay(0);
                  setSequenceAssigneeId(null);
                  setSequenceAssigneeName(null);
                  setShowAssigneeAutocomplete(false);
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

                  if (validProviderIds.length === 0) return;

                  setActionLoading(true);
                  try {
                    // Call launch-sequence API to create tracking records and email tasks
                    const res = await fetch("/api/admin/provider-outreach/launch-sequence", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        provider_ids: validProviderIds,
                        dry_run: false,
                        assigned_to: sequenceAssigneeId,
                      }),
                    });

                    if (res.ok) {
                      const data = await res.json();
                      showToast(`Started sequence for ${data.launched} provider(s)`, "success");
                      setSelectedProviders(new Set());
                      // Refresh data
                      if (isNotContactedTab(activeTab)) {
                        fetchCities();
                        fetchProviders();
                      } else {
                        fetchProviders();
                      }
                    } else {
                      const err = await res.json();
                      showToast(err.error || "Failed to start sequence", "error");
                    }
                  } catch (err) {
                    console.error("Failed to start sequence:", err);
                    showToast("Failed to start sequence", "error");
                  } finally {
                    setActionLoading(false);
                  }

                  setShowSequenceConfirm(false);
                  setShowSequencePreview(false);
                  setSequencePreviewData(null);
                  setSequencePreviewError(null);
                  setPreviewProviderId(null);
                  setPreviewDay(0);
                  setSequenceAssigneeId(null);
                  setSequenceAssigneeName(null);
                  setShowAssigneeAutocomplete(false);
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
              {loadingStateCounts ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (() => {
                const addedCodes = new Set(activeStates.map((s) => s.state_code));
                const availableStates = US_STATES.filter(
                  (s) =>
                    !addedCodes.has(s.value) &&
                    (s.label.toLowerCase().includes(addStateSearch.toLowerCase()) ||
                      s.value.toLowerCase().includes(addStateSearch.toLowerCase()))
                )
                  // Sort by provider count descending if we have counts, otherwise alphabetically
                  .sort((a, b) =>
                    stateCountsError
                      ? a.label.localeCompare(b.label)
                      : (stateCounts[b.value] || 0) - (stateCounts[a.value] || 0)
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

                return availableStates.map((usState) => {
                  const count = stateCounts[usState.value];
                  const hasCount = !stateCountsError && count !== undefined;
                  return (
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
                        {hasCount && (
                          <span className="text-xs text-gray-400">
                            {count.toLocaleString()} provider{count !== 1 ? "s" : ""}
                          </span>
                        )}
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
                  );
                });
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

      {/* Delete State Confirmation Modal */}
      {stateToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => !deletingState && setStateToDelete(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Remove {stateToDelete.name}?</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This will remove the state from your active list. Provider data will not be deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setStateToDelete(null)}
                disabled={deletingState}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteState}
                disabled={deletingState}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingState && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Remove State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from outreach confirmation dialog */}
      {pendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Remove from outreach</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove this provider from the outreach system?
            </p>
            <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This only removes them from outreach tracking. Their provider profile and directory listing will remain unchanged.
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{pendingRemoval.providerName}</p>
              <p className="mt-1 text-xs text-gray-500">
                Current stage: {STAGE_LABELS[pendingRemoval.stage as OutreachStage] || pendingRemoval.stage}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setPendingRemoval(null)}
                disabled={removingProvider}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveFromOutreach}
                disabled={removingProvider}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removingProvider ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
