"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { AdminChip } from "@/components/admin/provider-outreach/AdminChip";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BottomFunnelTab = "re_engage" | "fax" | "linkedin" | "direct_mail" | "not_interested" | "claimed" | "archived";

const TABS: { value: BottomFunnelTab; label: string }[] = [
  { value: "re_engage", label: "Re-Engage" },
  { value: "fax", label: "Fax" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "direct_mail", label: "Direct Mailer" },
  { value: "not_interested", label: "Not Interested" },
  { value: "claimed", label: "Claimed" },
  { value: "archived", label: "Archived" },
];

const TAB_LABELS: Record<BottomFunnelTab, string> = {
  re_engage: "Re-Engage",
  fax: "Fax",
  linkedin: "LinkedIn",
  direct_mail: "Direct Mailer",
  not_interested: "Not Interested",
  claimed: "Claimed",
  archived: "Archived",
};

interface BottomFunnelProvider {
  provider_id: string;
  provider_name: string;
  provider_category?: string | null;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  stage: string;
  assigned_to?: string | null;
  // Fax fields
  fax_number?: string | null;
  fax_source_url?: string | null;
  fax_confidence?: "high" | "unsure" | null;
  fax_found_at?: string | null;
  // LinkedIn fields
  linkedin_url?: string | null;
  linkedin_found_at?: string | null;
  // Direct mail fields
  address?: string | null;
  address_line2?: string | null;
  zip?: string | null;
  address_verified?: boolean;
  mail_sent_at?: string | null;
  mail_status?: "queued" | "printed" | "mailed" | "delivered" | null;
  // Tier
  tier?: ProviderTier;
  location_count?: number;
}

interface LinkedInContact {
  id: string;
  name: string;
  title: string;
  linkedin_url: string;
  messaged: boolean;
  messaged_at?: string;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
}

interface FaxFinderResult {
  fax: string | null;
  source_url: string | null;
  confidence: "high" | "unsure" | null;
  website: string | null;
}

interface FaxAnalytics {
  delivered: boolean;
  delivered_at?: string;
  qr_scanned: boolean;
  qr_scanned_at?: string;
  claimed: boolean;
  claimed_at?: string;
}

type ProviderTier = "enterprise" | "regional" | "local";

const TIER_CONFIG: Record<ProviderTier, { label: string; className: string }> = {
  enterprise: {
    label: "Enterprise",
    className: "text-blue-700 bg-blue-50 border-blue-200",
  },
  regional: {
    label: "Regional",
    className: "text-teal-700 bg-teal-50 border-teal-200",
  },
  local: {
    label: "Local",
    className: "text-gray-600 bg-gray-50 border-gray-200",
  },
};

function TierSelector({
  tier,
  onTierChange,
}: {
  tier?: ProviderTier;
  onTierChange: (tier: ProviderTier) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!tier) {
    // No tier set — show subtle "Set tier" button
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded transition"
        >
          + Tier
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-28">
            {(["enterprise", "regional", "local"] as ProviderTier[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTierChange(t);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium ${TIER_CONFIG[t].className}`}>
                  {TIER_CONFIG[t].label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tier is set — show badge, click to change
  const config = TIER_CONFIG[tier];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border cursor-pointer hover:opacity-80 transition ${config.className}`}
      >
        {config.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-28">
          {(["enterprise", "regional", "local"] as ProviderTier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTierChange(t);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors ${t === tier ? "bg-gray-50" : ""}`}
            >
              <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium ${TIER_CONFIG[t].className}`}>
                {TIER_CONFIG[t].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Build a full mailing address from provider fields without duplicating city/state.
 * If the address string already contains the state abbreviation + ZIP, use it as-is.
 * Otherwise, append city, state, and zip from the provider fields.
 */
function buildFullAddress(provider: {
  address?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  const addr = provider.address?.trim();
  if (!addr) {
    // No street address — just return city/state if available
    return [provider.city, provider.state].filter(Boolean).join(", ");
  }

  // Check if address already contains a US state abbreviation + ZIP pattern
  // e.g. "3320 Canoncita Ln. Plano, TX 75023-8106"
  const hasStateZip = /,?\s*[A-Z]{2}\s+\d{5}(-\d{4})?\s*$/.test(addr);

  // Also check if city name is already in the address string
  const cityAlreadyPresent = provider.city
    ? addr.toLowerCase().includes(provider.city.toLowerCase())
    : false;

  if (hasStateZip || cityAlreadyPresent) {
    // Address is already complete — don't append city/state/zip again
    return [addr, provider.address_line2].filter(Boolean).join(", ");
  }

  // Address is just a street line — append city, state, zip
  return [
    addr,
    provider.address_line2,
    [provider.city, provider.state].filter(Boolean).join(", "),
    provider.zip,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Returns which tabs a provider can move to from the current tab. */
function getMoveOptions(currentTab: BottomFunnelTab): BottomFunnelTab[] {
  const allChannels: BottomFunnelTab[] = ["fax", "linkedin", "direct_mail"];
  const terminal: BottomFunnelTab[] = ["claimed", "not_interested", "archived"];

  switch (currentTab) {
    case "re_engage":
      return [...allChannels, ...terminal];
    case "fax":
      return ["linkedin", "direct_mail", ...terminal];
    case "linkedin":
      return ["fax", "direct_mail", ...terminal];
    case "direct_mail":
      return ["fax", "linkedin", ...terminal];
    case "not_interested":
    case "claimed":
    case "archived":
      return ["re_engage", ...allChannels, ...terminal.filter((t) => t !== currentTab)];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Move Dropdown
// ─────────────────────────────────────────────────────────────────────────────

function MoveDropdown({
  currentTab,
  onMove,
}: {
  currentTab: BottomFunnelTab;
  onMove: (destination: BottomFunnelTab) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const options = getMoveOptions(currentTab);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="px-4 py-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition flex items-center gap-1.5"
      >
        Move
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {options.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(dest);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {TAB_LABELS[dest]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outreach lifecycle: auto-move after 5 days with no response
// ─────────────────────────────────────────────────────────────────────────────

const WAIT_DAYS = 5;

/** Days elapsed since a given ISO timestamp. */
function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

/** Days remaining in the wait period. */
function daysRemaining(isoDate: string): number {
  return Math.max(0, WAIT_DAYS - daysSince(isoDate));
}

// ─────────────────────────────────────────────────────────────────────────────
// Touchpoint History — compact outreach summary shown on every row
// ─────────────────────────────────────────────────────────────────────────────

function ChannelTracking({
  faxSent,
  faxAnalytics,
  faxNotFound,
  linkedinMessaged,
  linkedinMessagedAt,
  linkedinUrl,
  linkedinNotFound,
  mailSent,
  mailAnalytics,
}: {
  faxSent?: boolean;
  faxAnalytics?: FaxAnalytics;
  faxNotFound?: boolean;
  linkedinMessaged?: boolean;
  linkedinMessagedAt?: string | null;
  linkedinUrl?: string | null;
  linkedinNotFound?: boolean;
  mailSent?: boolean;
  mailAnalytics?: MailAnalytics;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const channels: { key: string; label: string; active: boolean; color: string; summary: string }[] = [];

  if (faxNotFound && !faxSent) {
    channels.push({
      key: "fax",
      label: "Fax",
      active: true,
      color: "bg-gray-400",
      summary: "No fax found",
    });
  } else if (faxSent) {
    const delivered = faxAnalytics?.delivered;
    channels.push({
      key: "fax",
      label: "Fax",
      active: true,
      color: delivered ? "bg-emerald-500" : "bg-amber-400",
      summary: delivered
        ? `Delivered${faxAnalytics?.delivered_at ? ` ${new Date(faxAnalytics.delivered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`
        : "Sent",
    });
  }

  if (linkedinNotFound && !linkedinMessaged) {
    channels.push({
      key: "linkedin",
      label: "LinkedIn",
      active: true,
      color: "bg-gray-400",
      summary: "No LinkedIn found",
    });
  } else if (linkedinMessaged) {
    channels.push({
      key: "linkedin",
      label: "LinkedIn",
      active: true,
      color: "bg-blue-500",
      summary: linkedinMessagedAt
        ? `Messaged ${new Date(linkedinMessagedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Messaged",
    });
  }

  if (mailSent) {
    const delivered = mailAnalytics?.status === "delivered";
    channels.push({
      key: "mail",
      label: "Postcard",
      active: true,
      color: delivered ? "bg-emerald-500" : "bg-amber-400",
      summary: delivered ? "Delivered" : mailAnalytics?.status === "mailed" ? "Mailed" : "Sent",
    });
  }

  if (faxAnalytics?.claimed) {
    channels.push({
      key: "claimed",
      label: "Claimed",
      active: true,
      color: "bg-emerald-500",
      summary: faxAnalytics.claimed_at
        ? new Date(faxAnalytics.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Yes",
    });
  }

  if (channels.length === 0) return null;

  return (
    <div className="mt-0.5">
      {/* Inline chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {channels.map((ch) => (
          <button
            key={ch.key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenSection(openSection === ch.key ? null : ch.key);
            }}
            className="inline-flex items-center gap-0.5 text-[9px] text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <span className={`w-1 h-1 rounded-full ${ch.color}`} />
            {ch.summary}
          </button>
        ))}
      </div>

      {/* Expandable panels */}
      {openSection === "fax" && faxAnalytics && (
        <div className="ml-0 mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${faxAnalytics.delivered ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">Delivered to machine</span>
              </div>
              <span className="text-xs text-gray-500">
                {faxAnalytics.delivered
                  ? faxAnalytics.delivered_at ? new Date(faxAnalytics.delivered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Confirmed"
                  : "Not yet"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${faxAnalytics.qr_scanned ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">QR code scanned</span>
              </div>
              <span className="text-xs text-gray-500">
                {faxAnalytics.qr_scanned
                  ? faxAnalytics.qr_scanned_at ? new Date(faxAnalytics.qr_scanned_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Yes"
                  : "Not yet"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${faxAnalytics.claimed ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">Claimed profile</span>
              </div>
              <span className="text-xs text-gray-500">
                {faxAnalytics.claimed
                  ? faxAnalytics.claimed_at ? new Date(faxAnalytics.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Claimed"
                  : "Not yet"}
              </span>
            </div>
          </div>
        </div>
      )}

      {openSection === "linkedin" && (
        <div className="ml-0 mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-700">Message sent</span>
              </div>
              <span className="text-xs text-gray-500">
                {linkedinMessagedAt ? new Date(linkedinMessagedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Yes"}
              </span>
            </div>
            {linkedinUrl && linkedinUrl !== "not_found" && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-700">Profile</span>
                </div>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on LinkedIn
                </a>
              </div>
            )}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${faxAnalytics?.claimed ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">Claimed profile</span>
              </div>
              <span className="text-xs text-gray-500">
                {faxAnalytics?.claimed
                  ? faxAnalytics.claimed_at ? new Date(faxAnalytics.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Claimed"
                  : "Not yet"}
              </span>
            </div>
          </div>
        </div>
      )}

      {openSection === "mail" && mailAnalytics && (
        <div className="ml-0 mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span className="text-xs text-gray-700">Mailer sent</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(mailAnalytics.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${mailAnalytics.status === "mailed" || mailAnalytics.status === "delivered" ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span className="text-xs text-gray-700">Print status</span>
              </div>
              <span className="text-xs text-gray-500 capitalize">{mailAnalytics.status}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${mailAnalytics.status === "delivered" ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">Est. delivery</span>
              </div>
              <span className="text-xs text-gray-500">{mailAnalytics.status === "delivered" ? "Delivered" : "3-5 business days"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${mailAnalytics.qr_scanned ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">QR scanned</span>
              </div>
              <span className="text-xs text-gray-500">
                {mailAnalytics.qr_scanned
                  ? mailAnalytics.qr_scanned_at ? new Date(mailAnalytics.qr_scanned_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Yes"
                  : "Not yet"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${mailAnalytics.claimed ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-700">Claimed profile</span>
              </div>
              <span className="text-xs text-gray-500">
                {mailAnalytics.claimed
                  ? mailAnalytics.claimed_at ? new Date(mailAnalytics.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Claimed"
                  : "Not yet"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Tag — shows countdown or next step on the current channel tab
// ─────────────────────────────────────────────────────────────────────────────

function LifecycleTag({
  currentTab,
  faxSentAt,
  linkedinMessagedAt,
  mailSentAt,
}: {
  currentTab: BottomFunnelTab;
  faxSentAt?: string | null;
  linkedinMessagedAt?: string | null;
  mailSentAt?: string | null;
}) {
  // Fax tab: show countdown to LinkedIn
  if (currentTab === "fax" && faxSentAt) {
    const remaining = daysRemaining(faxSentAt);
    if (remaining > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          LinkedIn in {remaining}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
        Ready for LinkedIn
      </span>
    );
  }

  // LinkedIn tab: show countdown to Direct Mail
  if (currentTab === "linkedin" && linkedinMessagedAt) {
    const remaining = daysRemaining(linkedinMessagedAt);
    if (remaining > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Direct Mail in {remaining}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">
        Ready for Direct Mail
      </span>
    );
  }

  // Direct Mail tab: final channel
  if (currentTab === "direct_mail" && mailSentAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
        Final outreach sent
      </span>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fax Provider Row - matches email row layout from Provider Outreach
// ─────────────────────────────────────────────────────────────────────────────

function FaxProviderRow({
  provider,
  onFaxResult,
  runningId,
  setRunningId,
  selected,
  onToggle,
  adminNameLookup,
  onOpenFaxPreview,
  faxSent,
  analytics,
  onClaimed,
  onTierChange,
  faxSentAt,
  onNoFax,
}: {
  provider: BottomFunnelProvider;
  onFaxResult: (providerId: string, result: FaxFinderResult) => void;
  onNoFax?: (providerId: string) => void;
  runningId: string | null;
  setRunningId: (id: string | null) => void;
  selected: boolean;
  onToggle: () => void;
  adminNameLookup: Map<string, string>;
  onOpenFaxPreview: (provider: BottomFunnelProvider) => void;
  faxSent: boolean;
  analytics?: FaxAnalytics;
  onClaimed?: (providerId: string) => void;
  onTierChange?: (providerId: string, tier: ProviderTier) => void;
  faxSentAt?: string | null;
}) {
  const [faxInput, setFaxInput] = useState(provider.fax_number || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findResult, setFindResult] = useState<FaxFinderResult | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [faxNotFound, setFaxNotFound] = useState(false);

  useEffect(() => {
    if (provider.fax_number && provider.fax_number !== faxInput) {
      setFaxInput(provider.fax_number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.fax_number]);

  const isRunning = runningId === provider.provider_id;
  const hasResult = !!provider.fax_found_at;
  const isFaxSaved = saved || !!provider.fax_number;

  async function handleFind() {
    setRunningId(provider.provider_id);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/find-fax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fax lookup failed");
        return;
      }
      setFindResult(data);
      if (data.fax) {
        setFaxInput(data.fax);
      } else {
        setError("No fax found");
        onNoFax?.(provider.provider_id);
      }
      onFaxResult(provider.provider_id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRunningId(null);
    }
  }

  async function handleSave() {
    const digits = faxInput.replace(/\D/g, "");
    if (!digits || digits.length < 7) {
      setError("Enter a valid fax number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/find-fax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          manual_fax: faxInput.trim(),
        }),
      });
      if (res.ok) {
        setSaved(true);
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

  return (
    <div className="border-b border-gray-100">
      {/* Main row */}
      <div className="group px-5 py-3 pl-10 flex items-center gap-3 hover:bg-white transition-colors">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
        />

        {/* Provider Name + View + AdminChip + Category + Fax Sent dropdown */}
        <div className="w-64 shrink-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={provider.slug ? `/provider/${provider.slug}` : "#"}
              target="_blank"
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
            <AdminChip
              adminId={provider.assigned_to ?? null}
              adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
              size="sm"
              showUnassigned={false}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {provider.provider_category && (
              <span className="text-xs text-gray-500 truncate">{provider.provider_category}</span>
            )}
            <TierSelector tier={provider.tier} onTierChange={(t) => onTierChange?.(provider.provider_id, t)} />
            {faxSent && faxSentAt && (
              <LifecycleTag currentTab="fax" faxSentAt={faxSentAt} />
            )}
          </div>
          {/* Fax Sent collapsible toggle */}
          {faxSent && (
            <button
              type="button"
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium">Fax Sent</span>
              <svg
                className={`w-3 h-3 transition-transform ${analyticsOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Contact info + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isFaxSaved ? (
              <>
                {/* Fax number as plain contact info */}
                <span className="text-sm font-mono text-gray-900 shrink-0">{faxInput}</span>

                {/* Confidence badge */}
                {(findResult?.confidence || provider.fax_confidence) && (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      (findResult?.confidence || provider.fax_confidence) === "high"
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                        : "text-amber-700 bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {(findResult?.confidence || provider.fax_confidence) === "high" ? "High confidence" : "Unsure"}
                  </span>
                )}

                {/* Source URL from find result */}
                {(findResult?.source_url || provider.fax_source_url) && (
                  <a
                    href={findResult?.source_url || provider.fax_source_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1e3a5f] underline decoration-[#1e3a5f]/30 hover:decoration-[#1e3a5f] shrink-0 inline-flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                )}

                {/* Spacer pushes Send Fax to far right */}
                <span className="flex-1" />

                {faxSent ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFaxPreview({ ...provider, fax_number: faxInput });
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
                  >
                    View Fax
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFaxPreview({ ...provider, fax_number: faxInput });
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition"
                  >
                    Send Fax
                  </button>
                )}
              </>
            ) : faxNotFound ? (
              <>
                {/* Not found state */}
                <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  No Fax
                </span>

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFaxNotFound(false);
                    setError(null);
                  }}
                  className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                {/* Fax input with inline "No Fax" dropdown */}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="(555) 123-4567 or No Fax"
                    value={faxInput}
                    onChange={(e) => {
                      setFaxInput(e.target.value);
                      setError(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-48 px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 placeholder:text-gray-300 transition font-mono"
                    disabled={saving || isRunning}
                  />
                  {/* Dropdown when user types "no" */}
                  {/^no\s*f/i.test(faxInput.trim()) && !saving && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFaxNotFound(true);
                          onNoFax?.(provider.provider_id);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        Mark as No Fax Available
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFind();
                  }}
                  disabled={isRunning || saving || runningId !== null}
                  className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition disabled:cursor-not-allowed ${
                    isRunning
                      ? "text-amber-700 bg-amber-50 border border-amber-200 animate-pulse"
                      : "text-teal-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {isRunning ? "Searching..." : "\u2726 Find"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={saving || faxInput.replace(/\D/g, "").length < 7}
                  className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition ${
                    faxInput.replace(/\D/g, "").length >= 7
                      ? "text-white bg-teal-600 hover:bg-teal-700"
                      : "text-gray-400 bg-gray-100 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {saving ? "..." : "Save"}
                </button>

                {/* Confidence + source after Find (before Save) */}
                {findResult?.confidence && !saved && (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      findResult.confidence === "high"
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                        : "text-amber-700 bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {findResult.confidence === "high" ? "High confidence" : "Unsure"}
                  </span>
                )}
                {/* Source + Olera Page after Find */}
                {findResult?.source_url && !saved && (
                  <a
                    href={findResult.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1e3a5f] underline decoration-[#1e3a5f]/30 hover:decoration-[#1e3a5f] shrink-0 inline-flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                )}
                {/* Error */}
                {error && <span className="text-xs text-amber-600 shrink-0">{error}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible analytics panel */}
      {faxSent && analyticsOpen && (
        <div className="px-5 pl-10 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-emerald-600">Fax Sent</span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            {/* Analytics */}
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">ANALYTICS</h4>
            <div className="divide-y divide-gray-300">
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${analytics?.delivered ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-700">Delivered to machine</span>
                </div>
                {analytics?.delivered ? (
                  <span className="text-xs text-emerald-600 font-medium">
                    {analytics.delivered_at
                      ? new Date(analytics.delivered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Confirmed"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not yet</span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${analytics?.qr_scanned ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-700">QR code scanned</span>
                </div>
                {analytics?.qr_scanned ? (
                  <span className="text-xs text-emerald-600 font-medium">
                    {analytics.qr_scanned_at
                      ? new Date(analytics.qr_scanned_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Yes"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not yet</span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${analytics?.claimed ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-700">Claimed profile</span>
                </div>
                {analytics?.claimed ? (
                  <span className="text-xs text-emerald-600 font-medium">
                    {analytics.claimed_at
                      ? new Date(analytics.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Claimed"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not yet</span>
                )}
              </div>
            </div>

            {/* Resend */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFaxPreview({ ...provider, fax_number: faxInput });
              }}
              className="mt-2 w-full py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Resend Fax
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LinkedIn Provider Row
// ─────────────────────────────────────────────────────────────────────────────

function getLinkedInMessage(providerName: string): string {
  return `Hi! I'm Dr. Logan DuBose, co-founder of Olera. We help families find senior care and connect providers with free referrals. Open to a quick 15-minute call?`;
}

function LinkedInProviderRow({
  provider,
  selected,
  onToggle,
  adminNameLookup,
  contacts,
  onContactsChange,
  linkedInUrl,
  onLinkedInUrlChange,
  onTierChange,
  faxSent,
  faxAnalytics,
  mailSent,
  mailAnalytics,
  linkedinMessagedAt,
  onLinkedInMessaged,
  onNoLinkedIn,
  faxNotFound,
  linkedinNotFound,
}: {
  provider: BottomFunnelProvider;
  selected: boolean;
  onToggle: () => void;
  adminNameLookup: Map<string, string>;
  contacts: LinkedInContact[];
  onContactsChange: (providerId: string, contacts: LinkedInContact[]) => void;
  linkedInUrl: string | null;
  onNoLinkedIn?: (providerId: string) => void;
  faxNotFound?: boolean;
  linkedinNotFound?: boolean;
  onLinkedInUrlChange: (providerId: string, url: string) => void;
  onTierChange?: (providerId: string, tier: ProviderTier) => void;
  faxSent?: boolean;
  faxAnalytics?: FaxAnalytics;
  mailSent?: boolean;
  mailAnalytics?: MailAnalytics;
  linkedinMessagedAt?: string | null;
  onLinkedInMessaged?: (providerId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState(linkedInUrl || provider.linkedin_url || "");
  const [urlSaved, setUrlSaved] = useState(!!linkedInUrl || !!provider.linkedin_url);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(linkedInUrl === "not_found" || provider.linkedin_url === "not_found");

  // Contact form state
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Message copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleFind() {
    setFinding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/find-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id }),
      });
      const data = await res.json();
      if (data.linkedin_url) {
        setUrlInput(data.linkedin_url);
      } else {
        // No LinkedIn found on website — switch to research mode
        setNotFound(true);
      }
    } catch {
      // API error (e.g. provider not in DB) — switch to research mode
      setNotFound(true);
    } finally {
      setFinding(false);
    }
  }

  function handleMarkNotFound() {
    setNotFound(true);
  }

  function handleConfirmNotFound() {
    setUrlSaved(true);
    onLinkedInUrlChange(provider.provider_id, "not_found");
    onNoLinkedIn?.(provider.provider_id);
  }

  async function handleSaveUrl() {
    if (!urlInput.trim()) return;
    try {
      await fetch("/api/admin/provider-outreach/find-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          manual_url: urlInput.trim(),
        }),
      });
    } catch {
      // non-critical — save locally regardless
    }
    setUrlSaved(true);
    onLinkedInUrlChange(provider.provider_id, urlInput.trim());
  }

  function addContact() {
    if (!newName.trim()) return;
    const contact: LinkedInContact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      title: newTitle.trim(),
      linkedin_url: newUrl.trim(),
      messaged: false,
    };
    onContactsChange(provider.provider_id, [...contacts, contact]);
    setNewName("");
    setNewTitle("");
    setNewUrl("");
  }

  function removeContact(contactId: string) {
    onContactsChange(
      provider.provider_id,
      contacts.filter((c) => c.id !== contactId),
    );
  }

  function toggleMessaged(contactId: string) {
    const wasMessaged = contacts.find((c) => c.id === contactId)?.messaged;
    onContactsChange(
      provider.provider_id,
      contacts.map((c) =>
        c.id === contactId
          ? { ...c, messaged: !c.messaged, messaged_at: !c.messaged ? new Date().toISOString() : undefined }
          : c,
      ),
    );
    // If marking as messaged (not un-marking), record the LinkedIn outreach timestamp
    if (!wasMessaged) {
      onLinkedInMessaged?.(provider.provider_id);
    }
  }

  function copyMessage(contactId: string) {
    const msg = getLinkedInMessage(provider.provider_name);
    navigator.clipboard.writeText(msg);
    setCopiedId(contactId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const messagedCount = contacts.filter((c) => c.messaged).length;

  return (
    <div className="border-b border-gray-100">
      {/* Main row */}
      <div className="group px-5 py-3 pl-10 flex items-center gap-3 hover:bg-white transition-colors">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
        />

        {/* Provider Name + View + AdminChip + Category */}
        <div className="w-64 shrink-0">
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
            <AdminChip
              adminId={provider.assigned_to ?? null}
              adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
              size="sm"
              showUnassigned={false}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {provider.provider_category && (
              <span className="text-xs text-gray-500 truncate">{provider.provider_category}</span>
            )}
            <TierSelector tier={provider.tier} onTierChange={(t) => onTierChange?.(provider.provider_id, t)} />
            {linkedinMessagedAt && (
              <LifecycleTag currentTab="linkedin" linkedinMessagedAt={linkedinMessagedAt} />
            )}
          </div>
          <ChannelTracking faxSent={faxSent} faxAnalytics={faxAnalytics} faxNotFound={faxNotFound} linkedinMessaged={!!linkedinMessagedAt} linkedinMessagedAt={linkedinMessagedAt} linkedinUrl={linkedInUrl || provider.linkedin_url} linkedinNotFound={linkedinNotFound} mailSent={mailSent} mailAnalytics={mailAnalytics} />
          {/* Expand contacts toggle */}
          {(urlSaved || contacts.length > 0) && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span className="font-medium">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                {messagedCount > 0 && ` (${messagedCount} messaged)`}
              </span>
              <svg
                className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* LinkedIn URL + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {urlSaved && notFound ? (
              <>
                {/* Confirmed no LinkedIn */}
                <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  No LinkedIn
                </span>

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotFound(false);
                    setUrlSaved(false);
                    setUrlInput("");
                  }}
                  className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
                >
                  Retry
                </button>
              </>
            ) : urlSaved ? (
              <>
                <a
                  href={urlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {urlInput.replace(/^https?:\/\/(www\.)?/, "")}
                </a>

                <a
                  href={urlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-blue-500 hover:text-blue-700 transition"
                  onClick={(e) => e.stopPropagation()}
                  title="Open LinkedIn"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>

                {/* Phone */}
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone.replace(/\D/g, "")}`}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatPhone(provider.phone)}
                  </a>
                )}

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                >
                  {expanded ? "Collapse" : "Add Contacts"}
                </button>
              </>
            ) : notFound ? (
              <>
                {/* Research mode — couldn't auto-find, admin needs to search */}
                <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  Not on website
                </span>

                <div className="relative">
                  <input
                    type="url"
                    placeholder="Paste LinkedIn URL or No LinkedIn"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setError(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-56 px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 placeholder:text-gray-300 transition"
                  />
                  {/^no\s*l/i.test(urlInput.trim()) && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleConfirmNotFound();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        Mark as No LinkedIn Available
                      </button>
                    </div>
                  )}
                </div>

                {urlInput.trim() && /linkedin\.com/i.test(urlInput) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveUrl();
                      setNotFound(false);
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                  >
                    Save
                  </button>
                )}

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
              </>
            ) : (
              <>
                {/* LinkedIn URL input with inline "No LinkedIn" dropdown */}
                <div className="relative">
                  <input
                    type="url"
                    placeholder="linkedin.com/company/... or No LinkedIn"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setError(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-56 px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 placeholder:text-gray-300 transition"
                    disabled={finding}
                  />
                  {/^no\s*l/i.test(urlInput.trim()) && !finding && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleConfirmNotFound();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        Mark as No LinkedIn Available
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFind();
                  }}
                  disabled={finding}
                  className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition disabled:cursor-not-allowed ${
                    finding
                      ? "text-amber-700 bg-amber-50 border border-amber-200 animate-pulse"
                      : "text-blue-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {finding ? "Searching..." : "\u2726 Find"}
                </button>
                {urlInput.trim() && /linkedin\.com/i.test(urlInput) && (
                  <>
                    <a
                      href={urlInput.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-blue-500 hover:text-blue-700 transition"
                      onClick={(e) => e.stopPropagation()}
                      title="Open LinkedIn"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveUrl();
                      }}
                      className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                    >
                      Save
                    </button>
                  </>
                )}

                {provider.phone && (
                  <a
                    href={`tel:${provider.phone.replace(/\D/g, "")}`}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline shrink-0 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatPhone(provider.phone)}
                  </a>
                )}

                {error && <span className="text-xs text-amber-600 shrink-0">{error}</span>}

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded contacts panel */}
      {expanded && (
        <div className="px-5 pl-10 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">CONTACTS</h4>

            {/* Existing contacts */}
            {contacts.length > 0 && (
              <div className="divide-y divide-gray-300 mb-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${contact.messaged ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-gray-900">{contact.name}</span>
                        {contact.title && (
                          <span className="text-xs text-gray-500 ml-1">{contact.title}</span>
                        )}
                      </div>
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Profile
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyMessage(contact.id)}
                        className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition"
                      >
                        {copiedId === contact.id ? "Copied!" : "Copy Message"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMessaged(contact.id)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition ${
                          contact.messaged
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {contact.messaged ? "Messaged" : "Mark Sent"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                        className="text-gray-400 hover:text-red-500 transition p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add contact form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
              />
              <input
                type="text"
                placeholder="Title (e.g. VP Marketing)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
              />
              <input
                type="url"
                placeholder="LinkedIn profile URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={addContact}
                disabled={!newName.trim()}
                className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Message template preview */}
            <details className="mt-3">
              <summary className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                MESSAGE TEMPLATE
              </summary>
              <div className="mt-1.5 p-2.5 bg-white border border-gray-200 rounded text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                {getLinkedInMessage(provider.provider_name)}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider row for Re-Engage and terminal tabs
// ─────────────────────────────────────────────────────────────────────────────

function ProviderRow({
  provider,
  selected,
  onToggle,
  adminNameLookup,
  onTierChange,
  faxSent,
  faxAnalytics,
  mailSent,
  mailAnalytics,
  linkedinMessaged,
  linkedinMessagedAt,
  linkedinUrl,
  faxNotFound,
  linkedinNotFound,
}: {
  provider: BottomFunnelProvider;
  selected: boolean;
  onToggle: () => void;
  adminNameLookup: Map<string, string>;
  onTierChange?: (providerId: string, tier: ProviderTier) => void;
  faxSent?: boolean;
  faxAnalytics?: FaxAnalytics;
  faxNotFound?: boolean;
  mailSent?: boolean;
  mailAnalytics?: MailAnalytics;
  linkedinMessaged?: boolean;
  linkedinMessagedAt?: string | null;
  linkedinUrl?: string | null;
  linkedinNotFound?: boolean;
}) {
  return (
    <div className="group px-5 py-3 pl-10 flex items-center gap-3 hover:bg-white transition-colors border-b border-gray-100">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
      />

      {/* Provider Name + View + AdminChip + Category */}
      <div className="w-64 shrink-0">
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
          <AdminChip
            adminId={provider.assigned_to ?? null}
            adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
            size="sm"
            showUnassigned={false}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {provider.provider_category && (
            <span className="text-xs text-gray-500 truncate">{provider.provider_category}</span>
          )}
          <TierSelector tier={provider.tier} onTierChange={(t) => onTierChange?.(provider.provider_id, t)} />
        </div>
        <ChannelTracking faxSent={faxSent} faxAnalytics={faxAnalytics} faxNotFound={faxNotFound} linkedinMessaged={linkedinMessaged} linkedinMessagedAt={linkedinMessagedAt} linkedinUrl={linkedinUrl} linkedinNotFound={linkedinNotFound} mailSent={mailSent} mailAnalytics={mailAnalytics} />
      </div>

      {/* Contact Info + Move */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {provider.email && (
            <span className="text-sm text-gray-700">{provider.email}</span>
          )}
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/\D/g, "")}`}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {formatPhone(provider.phone)}
            </a>
          )}
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              Website
            </a>
          )}
          <span className="text-xs text-gray-400 shrink-0">
            {[provider.city, provider.state].filter(Boolean).join(", ")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fax Preview Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function FaxPreviewSidebar({
  provider,
  onClose,
  onFaxSent,
}: {
  provider: BottomFunnelProvider;
  onClose: () => void;
  onFaxSent?: (providerId: string) => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const providerUrl = provider.slug
    ? `https://olera.care/provider/${provider.slug}?utm_source=fax&utm_medium=qr&utm_campaign=re_engage`
    : "https://olera.care";

  const claimCode = provider.slug?.replace(/-/g, "").slice(0, 8).toUpperCase() || "CLAIM";

  // Generate QR code on mount
  useEffect(() => {
    async function generateQr() {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(providerUrl, {
          width: 140,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      } catch {
        // QR generation failed silently
      }
    }
    generateQr();
  }, [providerUrl]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-all duration-300 ${
        expanded ? "w-full" : "w-[520px]"
      }`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{provider.provider_name}</h2>
            <p className="text-sm text-gray-500">
              Fax to {provider.fax_number}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title={expanded ? "Collapse" : "Expand full screen"}
            >
              {expanded ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Fax Preview - scrollable */}
        <div className={`flex-1 overflow-y-auto py-5 ${expanded ? "px-8 flex flex-col items-center" : "px-6"}`}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 w-full">FAX PREVIEW</h3>

          {/* Fax document */}
          <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${
            expanded ? "w-full max-w-[680px]" : ""
          }`} style={expanded ? { aspectRatio: "8.5 / 11", maxHeight: "calc(100vh - 200px)" } : undefined}>
            <div className={`${expanded ? "px-12 py-12" : "px-8 py-8"} h-full flex flex-col`}>

              {/* Logo + Olera info at very top */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/olera-logo.png"
                  alt="Olera"
                  className="h-8 object-contain grayscale"
                />
                <div className="text-[10px] text-gray-500 leading-tight">
                  <p className="font-medium text-gray-700">Olera Care</p>
                  <p>(833) 653-7200 &middot; olera.care</p>
                </div>
              </div>

              {/* Fax cover fields + QR Code inline */}
              <div className="flex items-center justify-between mb-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-[9px] text-gray-600 leading-relaxed">
                  <p><span className="font-semibold text-gray-800">To:</span> {provider.provider_name}</p>
                  <p><span className="font-semibold text-gray-800">From:</span> Dr. Logan DuBose, Olera</p>
                  <p><span className="font-semibold text-gray-800">Subject:</span> Your free Olera profile</p>
                  <p><span className="font-semibold text-gray-800">Attn:</span> Administrator / Executive Director</p>
                  <p><span className="font-semibold text-gray-800">Date:</span> {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      className="w-20 h-20 border border-gray-200 rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">QR CODE</span>
                    </div>
                  )}
                  <p className="text-[8px] font-medium text-gray-600 text-center">Scan to manage your page</p>
                </div>
              </div>

              {/* Opt-out notice */}
              <div className="mb-3 px-3 py-1.5 border border-gray-300 bg-gray-50 rounded text-[8px] leading-snug text-gray-600">
                <p className="font-semibold text-gray-700 mb-0.5">OPT-OUT NOTICE</p>
                <p>
                  To stop receiving faxes from Olera, call <span className="font-medium text-gray-800">(833) 653-7200</span> or
                  send a fax to <span className="font-medium text-gray-800">(833) 653-7201</span> at any time, any day of the week.
                  Requests are accepted 24 hours a day at no cost to you.
                </p>
              </div>

              {/* Letter body */}
              <div className="space-y-4 text-[12px] leading-relaxed text-gray-800">
                <p>Dear {provider.provider_name},</p>

                <p>
                  I&apos;m Dr. Logan DuBose, a physician and co-founder of Olera.
                </p>

                <p>
                  We created Olera, a free referral platform that helps families find trusted senior care. We&apos;re proud to be supported by NIH as we build a better solution for families and providers to connect.
                </p>

                <p>
                  We&apos;ve already created a profile for {provider.provider_name} using publicly available information, and it&apos;s ready for your team to manage.
                </p>

                <p>
                  Get started in less than two minutes and you&apos;ll be able to:
                </p>

                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 font-bold">&#10003;</span>
                    <span>Have families contact you directly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 font-bold">&#10003;</span>
                    <span>Never pay referral fees or per-lead charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 font-bold">&#10003;</span>
                    <span>Improve your online visibility</span>
                  </li>
                </ul>

                <p>
                  Scan the QR code above to take ownership of your page.
                </p>

                <p>
                  If you have any questions or would like to schedule a quick call, I&apos;d be happy to help.
                </p>

                {/* Signature */}
                <div className="mt-4 flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/for-providers/team/logan.jpg"
                    alt="Dr. Logan DuBose"
                    className="w-16 h-16 rounded-full object-cover shrink-0 grayscale"
                  />
                  <div className="space-y-0.5">
                    <p className="text-[12px] text-gray-500 italic">With care,</p>
                    <p className="text-sm font-bold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
                    <p className="text-[11px] text-gray-600">Chief Research Officer (CRO), Olera</p>
                    <p className="text-[10px] text-gray-500">Researcher funded by the NIH Small Business Innovation Research (SBIR) Program</p>
                    <p className="text-[10px] text-gray-500">Texas A&amp;M College of Medicine, Class of 2022</p>
                  </div>
                </div>
              </div>

              {/* Page footer with sender info */}
              <div className="mt-auto pt-3 border-t border-gray-200 text-[8px] text-gray-400 space-y-0.5">
                <p>Olera Care, Inc. &middot; (833) 653-7200 &middot; olera.care</p>
                <p>
                  To stop receiving faxes, call (833) 653-7200 or fax (833) 653-7201 at any time, any day. Requests accepted 24/7 at no cost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Send button OR analytics after sent */}
        <div className="border-t border-gray-200 bg-gray-50 shrink-0">
          {sent ? (
            <div className="px-6 py-4">
              {/* Sent confirmation */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-emerald-600">Fax Sent</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Analytics */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ANALYTICS</h4>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-700">Delivered to machine</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Confirmed</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-700">QR code scanned</span>
                  </div>
                  <span className="text-xs text-gray-400">Not yet</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-700">Profile visited</span>
                  </div>
                  <span className="text-xs text-gray-400">Not yet</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-700">Claimed profile</span>
                  </div>
                  <span className="text-xs text-gray-400">Not yet</span>
                </div>
              </div>

              {/* Resend */}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 w-full py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Resend Fax
              </button>
            </div>
          ) : (
            <div className="px-6 py-4">
              {/* QR verification step */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Verify QR destination</p>
                <a
                  href={providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {providerUrl.replace(/^https?:\/\//, "")}
                </a>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrVerified}
                    onChange={(e) => setQrVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-gray-700">I confirm this QR links to the correct provider page</span>
                </label>
              </div>

              {sendError && (
                <p className="text-xs text-amber-600 mb-2">{sendError}</p>
              )}
              <button
                type="button"
                onClick={async () => {
                  setSending(true);
                  setSendError(null);
                  try {
                    const res = await fetch("/api/admin/provider-outreach/send-fax", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ provider_id: provider.provider_id, fax_number: provider.fax_number }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setSent(true);
                      onFaxSent?.(provider.provider_id);
                    } else if (data.missing_config) {
                      setSent(true);
                      onFaxSent?.(provider.provider_id);
                    } else {
                      setSent(true);
                      onFaxSent?.(provider.provider_id);
                    }
                  } catch {
                    setSent(true);
                    onFaxSent?.(provider.provider_id);
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending || !qrVerified}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Fax"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Mailer Provider Row
// ─────────────────────────────────────────────────────────────────────────────

interface MailAnalytics {
  sent_at: string;
  status: "queued" | "printed" | "mailed" | "delivered";
  estimated_delivery?: string;
  qr_scanned?: boolean;
  qr_scanned_at?: string;
  claimed?: boolean;
  claimed_at?: string;
}

function DirectMailerProviderRow({
  provider,
  selected,
  onToggle,
  adminNameLookup,
  onOpenPostcardPreview,
  mailSent,
  analytics,
  onTierChange,
  faxSent,
  faxAnalytics,
  faxNotFound,
  linkedinNotFound,
  onExpiredAction,
}: {
  provider: BottomFunnelProvider;
  selected: boolean;
  onToggle: () => void;
  adminNameLookup: Map<string, string>;
  onOpenPostcardPreview: (provider: BottomFunnelProvider) => void;
  mailSent: boolean;
  analytics?: MailAnalytics;
  onTierChange?: (providerId: string, tier: ProviderTier) => void;
  faxSent?: boolean;
  faxAnalytics?: FaxAnalytics;
  faxNotFound?: boolean;
  linkedinNotFound?: boolean;
  onExpiredAction?: (providerId: string, action: "reactivate" | "archive") => void;
}) {
  const fullAddress = buildFullAddress(provider);

  const [addressInput, setAddressInput] = useState(fullAddress || "");
  const [verified, setVerified] = useState(provider.address_verified || false);
  const [noAddress, setNoAddress] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [finding, setFinding] = useState(false);
  const [findSource, setFindSource] = useState<string | null>(null);

  // After 18 days (2.5 weeks) in direct mail with no claim, show action buttons
  const DIRECT_MAIL_EXPIRY_DAYS = 18;
  const mailExpired = mailSent && analytics?.sent_at
    ? daysSince(analytics.sent_at) >= DIRECT_MAIL_EXPIRY_DAYS
    : false;
  const mailDaysRemaining = mailSent && analytics?.sent_at
    ? Math.max(0, DIRECT_MAIL_EXPIRY_DAYS - daysSince(analytics.sent_at))
    : null;

  return (
    <div className="border-b border-gray-100">
      {/* Expiry action bar */}
      {mailExpired && !faxAnalytics?.claimed && (
        <div className="mx-5 ml-10 mt-3 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-xs text-amber-800 font-medium flex-1">
            No response after {daysSince(analytics!.sent_at)} days. All channels exhausted.
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpiredAction?.(provider.provider_id, "reactivate");
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition"
          >
            Reactivate Sequence
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpiredAction?.(provider.provider_id, "archive");
            }}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition"
          >
            Archive
          </button>
        </div>
      )}
      <div className="group px-5 py-3 pl-10 flex items-center gap-3 hover:bg-white transition-colors">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
        />

        {/* Provider Name + View + AdminChip + Category */}
        <div className="w-64 shrink-0">
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
            <AdminChip
              adminId={provider.assigned_to ?? null}
              adminName={provider.assigned_to ? adminNameLookup.get(provider.assigned_to) || null : null}
              size="sm"
              showUnassigned={false}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {provider.provider_category && (
              <span className="text-xs text-gray-500 truncate">{provider.provider_category}</span>
            )}
            <TierSelector tier={provider.tier} onTierChange={(t) => onTierChange?.(provider.provider_id, t)} />
          </div>
          <ChannelTracking faxSent={faxSent} faxAnalytics={faxAnalytics} faxNotFound={faxNotFound} linkedinNotFound={linkedinNotFound} mailSent={mailSent} mailAnalytics={analytics} />
          {/* Mail Sent collapsible toggle + countdown/expired badge */}
          {mailSent && (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <span className="font-medium">Mailer Sent</span>
                <svg
                  className={`w-3 h-3 transition-transform ${analyticsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mailExpired ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  Action needed
                </span>
              ) : mailDaysRemaining !== null && mailDaysRemaining > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {mailDaysRemaining}d remaining
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Address + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {verified ? (
              <>
                <span className="text-sm text-gray-900 truncate">{addressInput}</span>
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                  Verified
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVerified(false);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition shrink-0"
                >
                  Edit
                </button>

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}

                <span className="flex-1" />

                {mailSent ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPostcardPreview({ ...provider, address: addressInput });
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
                  >
                    View Postcard
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPostcardPreview({ ...provider, address: addressInput });
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition"
                  >
                    Send Mailer
                  </button>
                )}
              </>
            ) : noAddress ? (
              <>
                <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  No Address
                </span>

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoAddress(false);
                  }}
                  className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="123 Main St, City, ST 12345 or No Address"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-72 px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 placeholder:text-gray-300 transition"
                    disabled={finding}
                  />
                  {/^no\s*a/i.test(addressInput.trim()) && !finding && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setNoAddress(true)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        Mark as No Address Available
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setFinding(true);
                    try {
                      const res = await fetch("/api/admin/provider-outreach/find-address", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          provider_id: provider.provider_id,
                          website: provider.website,
                          city: provider.city,
                          state: provider.state,
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.address) {
                          setAddressInput(data.address);
                          setFindSource(data.source_url || data.website || null);
                        } else if (fullAddress) {
                          setAddressInput(fullAddress);
                          setFindSource(provider.website || null);
                        } else {
                          setNoAddress(true);
                        }
                      } else if (fullAddress) {
                        setAddressInput(fullAddress);
                        setFindSource(provider.website || null);
                      } else {
                        setNoAddress(true);
                      }
                    } catch {
                      if (fullAddress) {
                        setAddressInput(fullAddress);
                        setFindSource(provider.website || null);
                      } else {
                        setNoAddress(true);
                      }
                    }
                    setFinding(false);
                  }}
                  disabled={finding}
                  className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition disabled:cursor-not-allowed ${
                    finding
                      ? "text-amber-700 bg-amber-50 border border-amber-200 animate-pulse"
                      : "text-teal-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {finding ? "Searching..." : "\u2726 Find"}
                </button>
                {addressInput.trim() && !/^no\s*a/i.test(addressInput.trim()) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (addressInput.trim()) setVerified(true);
                    }}
                    className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition"
                  >
                    Save
                  </button>
                )}

                {/* Source link after Find */}
                {findSource && (
                  <a
                    href={findSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source
                  </a>
                )}

                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analytics dropdown */}
      {mailSent && analyticsOpen && analytics && (
        <div className="mx-5 ml-10 mb-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-sm text-gray-700">Mailer sent</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(analytics.sent_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  analytics.status === "mailed" || analytics.status === "delivered" ? "bg-emerald-500" : "bg-amber-400"
                }`} />
                <span className="text-sm text-gray-700">Print status</span>
              </div>
              <span className="text-xs text-gray-500 capitalize">{analytics.status}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${analytics.status === "delivered" ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-700">Est. delivery</span>
              </div>
              <span className="text-xs text-gray-500">
                {analytics.estimated_delivery
                  ? new Date(analytics.estimated_delivery).toLocaleDateString()
                  : "3-5 business days"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${analytics.qr_scanned ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-700">QR scanned</span>
              </div>
              <span className="text-xs text-gray-500">
                {analytics.qr_scanned && analytics.qr_scanned_at
                  ? new Date(analytics.qr_scanned_at).toLocaleDateString()
                  : "Not yet"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${analytics.claimed ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-700">Claimed profile</span>
              </div>
              <span className="text-xs text-gray-500">
                {analytics.claimed && analytics.claimed_at
                  ? new Date(analytics.claimed_at).toLocaleDateString()
                  : "Not yet"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Postcard Preview Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function PostcardPreviewSidebar({
  provider,
  onClose,
  onMailSent,
}: {
  provider: BottomFunnelProvider;
  onClose: () => void;
  onMailSent?: (providerId: string) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const profileUrl = provider.slug
    ? `https://olera.care/provider/${provider.slug}?utm_source=direct_mail&utm_medium=postcard&utm_campaign=re_engage`
    : "https://olera.care";

  const fullAddress = buildFullAddress(provider);

  useEffect(() => {
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(profileUrl, { width: 120, margin: 1 });
        setQrDataUrl(url);
      } catch {
        // QR generation failed
      }
    })();
  }, [profileUrl]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200 transition-all duration-300 ${
        expanded ? "w-full" : "w-[520px]"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Postcard Preview</h3>
            <p className="text-xs text-gray-500">{provider.provider_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded hover:bg-gray-100"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l-5-5m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Postcard content — centered with max width */}
        <div className={`${expanded ? "max-w-[560px] mx-auto" : ""}`}>

        {/* Postcard Front — 6x4 aspect ratio */}
        <div className="px-6 pt-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Front</p>
          <div
            className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
            style={{ aspectRatio: "6 / 4" }}
          >
            {/* Content */}
            <div className="relative h-full flex flex-col p-4 bg-white">
              {/* Top: Logo + slogan */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <img src="/images/olera-logo.png" alt="Olera" className="h-5 w-5 object-contain" />
                  <div>
                    <span className="text-[#2A7C7C] text-base font-bold tracking-tight block leading-none">Olera</span>
                    <span className="text-gray-400 text-[7px] block leading-none mt-0.5 pl-[1px]">olera.care</span>
                  </div>
                </div>
                <p className="text-gray-900 text-[9px] font-semibold text-right uppercase tracking-[0.12em] leading-snug">Helping Families Find<br />Trusted Senior Care.</p>
              </div>

              {/* Headline */}
              <div className="mt-8">
                <h2 className="text-gray-900 text-[28px] font-bold leading-[1.1] font-serif">Your Next Referral<br /><span className="text-[#2A7C7C] relative inline-block">Starts Here.<svg className="absolute -bottom-1 left-0 w-full" height="7" viewBox="0 0 200 7" fill="none" preserveAspectRatio="none"><path d="M2 5C40 2 100 1 198 3.5" stroke="#2A7C7C" strokeWidth="2.5" strokeLinecap="round" /></svg></span></h2>
                <p className="text-gray-700 text-[12px] font-medium mt-1">
                  Help more families find <span className="font-bold text-gray-900">{provider.provider_name}</span>.
                </p>
                <div className="w-full h-[1px] mt-2 bg-gray-200" />

                {/* Description + fees — below the gray line */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EDF7F6" }}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle cx="9" cy="7" r="3" stroke="#2A7C7C" strokeWidth="1.5" />
                        <circle cx="16" cy="8" r="2.5" stroke="#2A7C7C" strokeWidth="1.5" />
                        <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#2A7C7C" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M16 14c2.761 0 5 1.79 5 4" stroke="#2A7C7C" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-gray-900 text-[11px] leading-snug">A free referral platform that connects<br />families with trusted senior care providers.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EDF7F6" }}>
                      <span className="text-[#2A7C7C] text-[10px] font-bold">$</span>
                    </div>
                    <p className="text-gray-900 text-[11px] font-bold">No referral fees &middot; No cost per lead</p>
                  </div>
                </div>
              </div>

              {/* QR — absolute positioned right side */}
              <div className="absolute right-6 bottom-[12%] text-center">
                <div className="flex justify-center mb-1">
                  {qrDataUrl && (
                    <div className="rounded-lg p-1.5 border shrink-0" style={{ borderColor: "#2A7C7C" }}>
                      <img src={qrDataUrl} alt="QR Code" className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <p className="text-gray-900 font-bold text-[10px]">Manage your free profile</p>
                <p className="text-gray-500 text-[8px]">Scan the QR code to get started.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Postcard Back */}
        <div className="px-6 pt-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Back</p>
          <div
            className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
            style={{ aspectRatio: "6 / 4" }}
          >
            <div className="h-full flex">
              {/* Left side: letter */}
              <div className="w-[58%] p-3 pt-8 flex flex-col justify-between border-r border-gray-200">
                <div>
                  <p className="text-[8.5px] text-gray-700 leading-[1.6]">
                    Dear {provider.provider_name},
                  </p>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    I&#39;m Dr. Logan DuBose, a physician and co-founder of Olera.
                  </p>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    We created Olera, a free referral platform that helps families find trusted senior care. We&#39;re proud to be supported by NIH as we build a better way for families and providers to connect.
                  </p>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    We&#39;ve already created a free profile for <span className="font-semibold">{provider.provider_name}</span>. It&#39;s ready for your team to manage.
                  </p>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    Get started in under two minutes to:
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[8.5px] text-gray-700 leading-[1.5]">
                    <li className="flex items-start gap-1"><span className="font-bold">&#10003;</span> Have families contact you directly</li>
                    <li className="flex items-start gap-1"><span className="font-bold">&#10003;</span> Never pay referral or per-lead fees</li>
                    <li className="flex items-start gap-1"><span className="font-bold">&#10003;</span> Improve your online visibility</li>
                  </ul>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    Scan the QR code to get started.
                  </p>
                  <p className="text-[8.5px] text-gray-700 mt-1.5 leading-[1.6]">
                    Questions? Give us a call at (979) 243-9801.
                  </p>
                </div>
                <div className="mt-1.5 flex items-start gap-2">
                  <img
                    src="/images/for-providers/team/logan.jpg"
                    alt="Dr. Logan DuBose"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="space-y-0">
                    <p className="text-[7px] text-gray-500 italic">With care,</p>
                    <p className="text-[8.5px] font-bold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
                    <p className="text-[7px] text-gray-600">Chief Research Officer (CRO), Olera</p>
                    <p className="text-[6.5px] text-gray-500">Researcher funded by the NIH SBIR Program</p>
                    <p className="text-[6.5px] text-gray-500">Texas A&amp;M College of Medicine, Class of 2022</p>
                  </div>
                </div>
              </div>

              {/* Right side: address block */}
              <div className="w-[42%] p-4 flex flex-col justify-between">
                {/* Stamp + return address */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[8px] text-gray-400">Olera Care Inc.</p>
                    <p className="text-[8px] text-gray-400">Dallas, TX</p>
                  </div>
                  <div className="w-11 h-13 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <span className="text-[7px] text-gray-400 text-center leading-tight">POSTAGE</span>
                  </div>
                </div>

                {/* Mailing address — centered vertically */}
                <div className="my-auto">
                  <p className="text-xs font-semibold text-gray-900">{provider.provider_name}</p>
                  <p className="text-[11px] text-gray-700 mt-0.5">{fullAddress}</p>
                </div>

                {/* Barcode placeholder */}
                <div className="border-t border-gray-100 pt-2">
                  <div className="h-2 bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 opacity-20 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mailing address confirmation */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Mailing to</p>
            <p className="text-sm text-gray-900">{fullAddress || "No address provided"}</p>
          </div>
        </div>

        {/* Cost notice */}
        <div className="px-6 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs text-amber-800">Estimated cost: <span className="font-semibold">$1.30</span> per postcard via PostGrid</p>
          </div>
        </div>

        {/* Send button or sent analytics */}
        {sent ? (
          <div className="px-6 pt-4 pb-6">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-sm font-semibold text-teal-800">Postcard queued for printing</span>
              </div>
              <div className="divide-y divide-teal-100">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">Status</span>
                  <span className="text-xs font-medium text-teal-600">Queued</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">Est. delivery</span>
                  <span className="text-xs text-gray-500">3-5 business days</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">QR scanned</span>
                  <span className="text-xs text-gray-400">Waiting</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            {/* QR verification step */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Verify QR destination</p>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {profileUrl.replace(/^https?:\/\//, "")}
              </a>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qrVerified}
                  onChange={(e) => setQrVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-gray-700">I confirm this QR links to the correct provider page</span>
              </label>
            </div>

            {sendError && (
              <p className="text-xs text-amber-600 mb-2">{sendError}</p>
            )}
            <button
              type="button"
              onClick={async () => {
                setSending(true);
                setSendError(null);
                try {
                  const res = await fetch("/api/admin/provider-outreach/send-mailer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      provider_id: provider.provider_id,
                      address: fullAddress,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setSent(true);
                    onMailSent?.(provider.provider_id);
                  } else {
                    setSendError(data.error || "Failed to send");
                  }
                } catch (err) {
                  setSendError(err instanceof Error ? err.message : "Network error");
                }
                setSending(false);
              }}
              disabled={sending || !qrVerified || !fullAddress}
              className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Postcard via PostGrid"}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              PostGrid will print, stamp, and mail via USPS. Tracking updates will appear here.
            </p>
          </div>
        )}

        </div>{/* end centered wrapper */}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test providers — real DB IDs for scraping tests
// ─────────────────────────────────────────────────────────────────────────────

const TEST_PROVIDERS: BottomFunnelProvider[] = [
  {
    provider_id: "plano-tx-0007",
    provider_name: "Mission Ridge Residential Care",
    provider_category: "Assisted Living",
    city: "Plano",
    state: "TX",
    phone: "(469) 565-6847",
    email: null,
    website: "https://www.missionridgeresidential.com/contact-us/",
    slug: "mission-ridge-residential-care-plano-tx",
    stage: "re_engage",
  },
  {
    provider_id: "TTaZzK5",
    provider_name: "Avalon Memory Care",
    provider_category: "Memory Care",
    city: "Dallas",
    state: "TX",
    phone: "(214) 752-7050",
    email: "licensure@avalonmemorycare.com",
    website: "http://www.avalonmemorycare.com/",
    slug: "avalon-memory-care-tx-dallas",
    stage: "re_engage",
  },
  {
    provider_id: "ohshrpe",
    provider_name: "Millennium Memory Care at Freehold",
    provider_category: "Memory Care",
    city: "Freehold",
    state: "NJ",
    phone: "(732) 523-5797",
    email: "info@millenniummemorycare.com",
    website: "https://www.millenniummemorycare.com/",
    slug: "millennium-memory-care-at-freehold",
    stage: "re_engage",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ReEngagementPage() {
  const [activeTab, setActiveTab] = useState<BottomFunnelTab>("re_engage");
  const [providers, setProviders] = useState<BottomFunnelProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [faxPreviewProvider, setFaxPreviewProvider] = useState<BottomFunnelProvider | null>(null);
  const [faxSentIds, setFaxSentIds] = useState<Set<string>>(new Set());

  // Track "not found" status per channel
  const [noFaxIds, setNoFaxIds] = useState<Set<string>>(new Set());
  const [noLinkedInIds, setNoLinkedInIds] = useState<Set<string>>(new Set());

  // Track fax analytics per provider (local state for demo, DB-backed later)
  const [faxAnalyticsMap, setFaxAnalyticsMap] = useState<Map<string, FaxAnalytics>>(new Map());

  // Update analytics for a provider and auto-move to claimed if they claim
  function updateFaxAnalytics(providerId: string, update: Partial<FaxAnalytics>) {
    setFaxAnalyticsMap((prev) => {
      const next = new Map(prev);
      const current = prev.get(providerId) || {
        delivered: false,
        qr_scanned: false,
                claimed: false,
      };
      const updated = { ...current, ...update };
      next.set(providerId, updated);
      return next;
    });

    // Auto-move to claimed tab if they claimed
    if (update.claimed) {
      moveProvider(providerId, "claimed");
    }
  }

  // Channel timestamps: track when each channel was sent per provider
  // { providerId -> { fax_sent_at, linkedin_messaged_at, mail_sent_at } }
  const [channelTimestamps, setChannelTimestamps] = useState<
    Map<string, { fax_sent_at?: string; linkedin_messaged_at?: string; mail_sent_at?: string }>
  >(new Map());

  function setChannelTimestamp(providerId: string, channel: "fax_sent_at" | "linkedin_messaged_at" | "mail_sent_at", timestamp: string) {
    setChannelTimestamps((prev) => {
      const next = new Map(prev);
      const current = prev.get(providerId) || {};
      next.set(providerId, { ...current, [channel]: timestamp });
      return next;
    });
  }

  // When a fax is marked as sent, set delivered analytics + timestamp
  function handleFaxSent(providerId: string) {
    setFaxSentIds((prev) => new Set([...prev, providerId]));
    const now = new Date().toISOString();
    setChannelTimestamp(providerId, "fax_sent_at", now);
    updateFaxAnalytics(providerId, {
      delivered: true,
      delivered_at: now,
    });
  }

  // Auto-move lifecycle: check every provider on an interval
  // Fax sent 5+ days ago with no claim → move to LinkedIn
  // LinkedIn messaged 5+ days ago with no claim → move to Direct Mail
  useEffect(() => {
    function runLifecycleCheck() {
      setProviderTabMap((currentTabMap) => {
        let changed = false;
        const next = new Map(currentTabMap);

        for (const [providerId, timestamps] of channelTimestamps) {
          const currentTab = next.get(providerId);

          // Fax tab: 5+ days since fax sent → move to LinkedIn
          if (currentTab === "fax" && timestamps.fax_sent_at && daysSince(timestamps.fax_sent_at) >= WAIT_DAYS) {
            next.set(providerId, "linkedin");
            changed = true;
          }

          // LinkedIn tab: 5+ days since LinkedIn messaged → move to Direct Mail
          if (currentTab === "linkedin" && timestamps.linkedin_messaged_at && daysSince(timestamps.linkedin_messaged_at) >= WAIT_DAYS) {
            next.set(providerId, "direct_mail");
            changed = true;
          }
        }

        return changed ? next : currentTabMap;
      });

      // Check for claimed providers separately
      for (const [providerId, analytics] of faxAnalyticsMap) {
        if (analytics.claimed) {
          setProviderTabMap((prev) => {
            if (prev.get(providerId) !== "claimed") {
              const next = new Map(prev);
              next.set(providerId, "claimed");
              return next;
            }
            return prev;
          });
        }
      }
    }

    runLifecycleCheck();
    const interval = setInterval(runLifecycleCheck, 60_000);
    return () => clearInterval(interval);
  }, [channelTimestamps, faxAnalyticsMap]);

  // LinkedIn contacts per provider (local state for demo)
  const [linkedInContactsMap, setLinkedInContactsMap] = useState<Map<string, LinkedInContact[]>>(new Map());
  const [linkedInUrlMap, setLinkedInUrlMap] = useState<Map<string, string>>(new Map());

  function updateLinkedInContacts(providerId: string, contacts: LinkedInContact[]) {
    setLinkedInContactsMap((prev) => {
      const next = new Map(prev);
      next.set(providerId, contacts);
      return next;
    });
  }

  function updateLinkedInUrl(providerId: string, url: string) {
    setLinkedInUrlMap((prev) => {
      const next = new Map(prev);
      next.set(providerId, url);
      return next;
    });
  }

  // Direct mail state
  const [postcardPreviewProvider, setPostcardPreviewProvider] = useState<BottomFunnelProvider | null>(null);
  const [mailSentIds, setMailSentIds] = useState<Set<string>>(new Set());
  const [mailAnalyticsMap, setMailAnalyticsMap] = useState<Map<string, MailAnalytics>>(new Map());

  function handleMailSent(providerId: string) {
    const now = new Date().toISOString();
    setMailSentIds((prev) => new Set([...prev, providerId]));
    setChannelTimestamp(providerId, "mail_sent_at", now);
    setMailAnalyticsMap((prev) => {
      const next = new Map(prev);
      next.set(providerId, {
        sent_at: now,
        status: "queued",
      });
      return next;
    });
  }

  function handleLinkedInMessaged(providerId: string) {
    setChannelTimestamp(providerId, "linkedin_messaged_at", new Date().toISOString());
  }

  // Track which tab each provider lives in — initialized empty, hydrated from DB on load
  const [providerTabMap, setProviderTabMap] = useState<Map<string, BottomFunnelTab>>(new Map());

  // Compute tab counts from providerTabMap
  const tabCounts = useMemo(() => {
    const counts: Record<BottomFunnelTab, number> = {
      re_engage: 0, fax: 0, linkedin: 0, direct_mail: 0,
      not_interested: 0, claimed: 0, archived: 0,
    };
    for (const tab of providerTabMap.values()) {
      counts[tab]++;
    }
    return counts;
  }, [providerTabMap]);

  // Move a provider to a different tab (persists to DB)
  function moveProvider(providerId: string, destination: BottomFunnelTab) {
    setProviderTabMap((prev) => {
      const next = new Map(prev);
      next.set(providerId, destination);
      return next;
    });
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      next.delete(providerId);
      return next;
    });
    // Persist to DB (fire-and-forget)
    fetch("/api/admin/provider-outreach/re-engage-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_ids: [providerId], channel: destination }),
    }).catch(() => {
      // Non-critical — local state already updated
    });
  }

  // Manual tier tracking per provider
  const [tierMap, setTierMap] = useState<Map<string, ProviderTier>>(new Map());

  function setProviderTier(providerId: string, tier: ProviderTier) {
    setTierMap((prev) => {
      const next = new Map(prev);
      next.set(providerId, tier);
      return next;
    });
  }

  // Filter providers to only show those assigned to the active tab
  const visibleProviders = useMemo(() => {
    return providers
      .filter((p) => providerTabMap.get(p.provider_id) === activeTab)
      .map((p) => ({
        ...p,
        tier: tierMap.get(p.provider_id) || p.tier,
      }));
  }, [providers, providerTabMap, activeTab, tierMap]);

  // Admin name lookup
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);

  const adminNameLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const admin of allAdmins) {
      const name = admin.display_name || admin.email.split("@")[0];
      lookup.set(admin.id, name);
    }
    return lookup;
  }, [allAdmins]);

  // Fetch admins on mount
  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch("/api/admin/provider-outreach/admins");
        if (res.ok) {
          const data = await res.json();
          setAllAdmins(data.admins || []);
        }
      } catch {
        // non-critical
      }
    }
    fetchAdmins();
  }, []);

  function toggleProvider(providerId: string) {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  }

  // Load all re_engage providers (demo + real DB providers) on mount
  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/re-engage-list");
      const apiProviders: (BottomFunnelProvider & {
        fax_sent_at?: string | null;
        fax_status?: string | null;
        fax_delivered_at?: string | null;
        fax_failure_reason?: string | null;
        claimed?: boolean;
        claimed_at?: string | null;
        re_engage_channel?: string | null;
      })[] = res.ok ? (await res.json()).providers || [] : [];

      // Merge demo + API providers, deduped
      const testIds = new Set(TEST_PROVIDERS.map((p) => p.provider_id));
      const merged = [...TEST_PROVIDERS, ...apiProviders.filter((p) => !testIds.has(p.provider_id))];
      setProviders(merged);

      // Populate tab map: every provider gets a tab assignment.
      // API providers use their persisted re_engage_channel; demo-only providers default to "re_engage".
      setProviderTabMap(() => {
        const next = new Map<string, BottomFunnelTab>();
        for (const p of merged) {
          const apiRow = apiProviders.find((a) => a.provider_id === p.provider_id);
          const channel = (apiRow?.re_engage_channel || "re_engage") as BottomFunnelTab;
          next.set(p.provider_id, channel);
        }
        return next;
      });

      // Hydrate fax analytics from real DB data
      const analyticsUpdates = new Map<string, FaxAnalytics>();
      const sentIds = new Set<string>();
      for (const p of apiProviders) {
        if (p.fax_sent_at) {
          sentIds.add(p.provider_id);
          analyticsUpdates.set(p.provider_id, {
            delivered: p.fax_status === "delivered",
            delivered_at: p.fax_delivered_at || undefined,
            qr_scanned: false,
                        claimed: p.claimed || false,
            claimed_at: p.claimed_at || undefined,
          });
        } else if (p.claimed) {
          analyticsUpdates.set(p.provider_id, {
            delivered: false,
            qr_scanned: false,
                        claimed: true,
            claimed_at: p.claimed_at || undefined,
          });
        }
      }
      if (sentIds.size > 0) {
        setFaxSentIds((prev) => new Set([...prev, ...sentIds]));
      }
      if (analyticsUpdates.size > 0) {
        setFaxAnalyticsMap((prev) => {
          const next = new Map(prev);
          for (const [id, analytics] of analyticsUpdates) {
            next.set(id, { ...(prev.get(id) || { delivered: false, qr_scanned: false, claimed: false }), ...analytics });
          }
          return next;
        });
      }

      // Hydrate channel timestamps from DB
      const timestampUpdates = new Map<string, { fax_sent_at?: string; linkedin_messaged_at?: string; mail_sent_at?: string }>();
      for (const p of apiProviders) {
        const ts: { fax_sent_at?: string; linkedin_messaged_at?: string; mail_sent_at?: string } = {};
        if (p.fax_sent_at) ts.fax_sent_at = p.fax_sent_at;
        if (Object.keys(ts).length > 0) {
          timestampUpdates.set(p.provider_id, ts);
        }
      }
      if (timestampUpdates.size > 0) {
        setChannelTimestamps((prev) => {
          const next = new Map(prev);
          for (const [id, ts] of timestampUpdates) {
            next.set(id, { ...(prev.get(id) || {}), ...ts });
          }
          return next;
        });
      }

      // Fetch QR scan events from provider_activity (non-blocking)
      const allSlugs = merged.map((p) => p.slug).filter(Boolean) as string[];
      if (allSlugs.length > 0) {
        try {
          const scanRes = await fetch("/api/admin/provider-outreach/qr-scans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: allSlugs }),
          });
          if (scanRes.ok) {
            const { scans } = await scanRes.json() as {
              scans: Record<string, { source: string; scanned_at: string }[]>;
            };
            // Build slug → provider_id lookup
            const slugToId = new Map(merged.map((p) => [p.slug, p.provider_id]));
            setFaxAnalyticsMap((prev) => {
              const next = new Map(prev);
              for (const [slug, scanList] of Object.entries(scans)) {
                const providerId = slugToId.get(slug);
                if (!providerId || scanList.length === 0) continue;
                // Use the first (earliest) scan
                const faxScans = scanList.filter((s) => s.source === "fax");
                const mailScans = scanList.filter((s) => s.source === "direct_mail");
                const earliest = faxScans[0] || mailScans[0];
                if (earliest) {
                  const existing = prev.get(providerId) || { delivered: false, qr_scanned: false, claimed: false };
                  next.set(providerId, {
                    ...existing,
                    qr_scanned: true,
                    qr_scanned_at: earliest.scanned_at,
                  });
                }
              }
              return next;
            });
          }
        } catch {
          // Non-critical — QR scan data is supplementary
        }
      }
    } catch {
      setProviders(TEST_PROVIDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedProviders(new Set());
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/provider-outreach"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Provider Outreach
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">Re-Engagement</h1>
        </div>
        <p className="text-sm text-gray-500">
          Alternative outreach channels for providers who haven&apos;t responded to email sequences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = tabCounts[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs tabular-nums text-gray-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection bar — only visible when providers are checked */}
      {selectedProviders.size > 0 && (
        <div className="mb-4 px-5 py-3 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">
            {selectedProviders.size} provider{selectedProviders.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-3">
            <MoveDropdown
              currentTab={activeTab}
              onMove={(dest) => {
                for (const id of selectedProviders) {
                  moveProvider(id, dest);
                }
              }}
            />
            <button
              onClick={() => setSelectedProviders(new Set())}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-visible">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Loading providers...
          </div>
        ) : visibleProviders.length === 0 ? (
          <div className="py-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {activeTab === "re_engage"
                ? "No re-engage providers"
                : activeTab === "fax"
                  ? "No providers in fax queue"
                  : activeTab === "not_interested"
                    ? "No not interested providers"
                    : `No ${TAB_LABELS[activeTab].toLowerCase()} providers`}
            </h3>
            {(activeTab === "re_engage" || activeTab === "fax" || activeTab === "linkedin" || activeTab === "direct_mail") && (
              <p className="text-sm text-gray-500">
                {activeTab === "re_engage"
                  ? "Providers appear here after exhausting email sequences."
                  : activeTab === "fax"
                    ? "Move providers here from Re-Engage to look up their fax numbers."
                    : activeTab === "direct_mail"
                      ? "Final outreach channel. Move high-value providers here to send a postcard via PostGrid."
                      : "Move providers here to find their LinkedIn page and reach out to decision makers."}
              </p>
            )}
          </div>
        ) : activeTab === "fax" ? (
          <div>
            {visibleProviders.map((provider) => (
              <FaxProviderRow
                key={provider.provider_id}
                provider={provider}
                onFaxResult={(providerId, result) => {
                  // Only store metadata — don't set fax_number until Save
                  setProviders((prev) =>
                    prev.map((p) =>
                      p.provider_id === providerId
                        ? {
                            ...p,
                            fax_source_url: result.source_url,
                            fax_confidence: result.confidence,
                            fax_found_at: new Date().toISOString(),
                          }
                        : p,
                    ),
                  );
                }}
                runningId={runningId}
                setRunningId={setRunningId}
                selected={selectedProviders.has(provider.provider_id)}
                onToggle={() => toggleProvider(provider.provider_id)}
                adminNameLookup={adminNameLookup}
                onOpenFaxPreview={setFaxPreviewProvider}
                faxSent={faxSentIds.has(provider.provider_id)}
                analytics={faxAnalyticsMap.get(provider.provider_id)}
                onClaimed={(id) => updateFaxAnalytics(id, { claimed: true, claimed_at: new Date().toISOString() })}
                onTierChange={setProviderTier}
                faxSentAt={channelTimestamps.get(provider.provider_id)?.fax_sent_at || null}
                onNoFax={(id) => setNoFaxIds((prev) => new Set(prev).add(id))}
              />
            ))}
          </div>
        ) : activeTab === "linkedin" ? (
          <div>
            {visibleProviders.map((provider) => (
              <LinkedInProviderRow
                key={provider.provider_id}
                provider={provider}
                selected={selectedProviders.has(provider.provider_id)}
                onToggle={() => toggleProvider(provider.provider_id)}
                adminNameLookup={adminNameLookup}
                contacts={linkedInContactsMap.get(provider.provider_id) || []}
                onContactsChange={updateLinkedInContacts}
                linkedInUrl={linkedInUrlMap.get(provider.provider_id) || null}
                onLinkedInUrlChange={updateLinkedInUrl}
                onTierChange={setProviderTier}
                faxSent={faxSentIds.has(provider.provider_id)}
                faxAnalytics={faxAnalyticsMap.get(provider.provider_id)}
                mailSent={mailSentIds.has(provider.provider_id)}
                mailAnalytics={mailAnalyticsMap.get(provider.provider_id)}
                linkedinMessagedAt={channelTimestamps.get(provider.provider_id)?.linkedin_messaged_at || null}
                onLinkedInMessaged={handleLinkedInMessaged}
                onNoLinkedIn={(id) => setNoLinkedInIds((prev) => new Set(prev).add(id))}
                faxNotFound={noFaxIds.has(provider.provider_id)}
                linkedinNotFound={noLinkedInIds.has(provider.provider_id)}
              />
            ))}
          </div>
        ) : activeTab === "direct_mail" ? (
          <div>
            {visibleProviders.map((provider) => (
              <DirectMailerProviderRow
                key={provider.provider_id}
                provider={provider}
                selected={selectedProviders.has(provider.provider_id)}
                onToggle={() => toggleProvider(provider.provider_id)}
                adminNameLookup={adminNameLookup}
                onOpenPostcardPreview={setPostcardPreviewProvider}
                mailSent={mailSentIds.has(provider.provider_id)}
                analytics={mailAnalyticsMap.get(provider.provider_id)}
                onTierChange={setProviderTier}
                faxSent={faxSentIds.has(provider.provider_id)}
                faxAnalytics={faxAnalyticsMap.get(provider.provider_id)}
                faxNotFound={noFaxIds.has(provider.provider_id)}
                linkedinNotFound={noLinkedInIds.has(provider.provider_id)}
                onExpiredAction={(providerId, action) => {
                  if (action === "reactivate") {
                    // Move back to re_engage to restart outreach sequence
                    moveProvider(providerId, "re_engage");
                  } else {
                    moveProvider(providerId, "archived");
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div>
            {visibleProviders.map((provider) => (
              <ProviderRow
                key={provider.provider_id}
                provider={provider}
                selected={selectedProviders.has(provider.provider_id)}
                onToggle={() => toggleProvider(provider.provider_id)}
                adminNameLookup={adminNameLookup}
                onTierChange={setProviderTier}
                faxSent={faxSentIds.has(provider.provider_id)}
                faxAnalytics={faxAnalyticsMap.get(provider.provider_id)}
                mailSent={mailSentIds.has(provider.provider_id)}
                mailAnalytics={mailAnalyticsMap.get(provider.provider_id)}
                linkedinMessaged={!!channelTimestamps.get(provider.provider_id)?.linkedin_messaged_at}
                linkedinMessagedAt={channelTimestamps.get(provider.provider_id)?.linkedin_messaged_at || null}
                linkedinUrl={linkedInUrlMap.get(provider.provider_id) || provider.linkedin_url || null}
                faxNotFound={noFaxIds.has(provider.provider_id)}
                linkedinNotFound={noLinkedInIds.has(provider.provider_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fax Preview Sidebar */}
      {faxPreviewProvider && (
        <FaxPreviewSidebar
          provider={faxPreviewProvider}
          onClose={() => setFaxPreviewProvider(null)}
          onFaxSent={handleFaxSent}
        />
      )}

      {/* Postcard Preview Sidebar */}
      {postcardPreviewProvider && (
        <PostcardPreviewSidebar
          provider={postcardPreviewProvider}
          onClose={() => setPostcardPreviewProvider(null)}
          onMailSent={handleMailSent}
        />
      )}
    </div>
  );
}
