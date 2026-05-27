"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Profile, FamilyMetadata } from "@/lib/types";

interface ReachOutDrawerProps {
  family: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (familyId: string, message: string, saveAsDefault: boolean) => Promise<void>;
  defaultMessage?: string;
  providerProfile?: Profile | null;
  /** @deprecated Not used in redesigned drawer */
  providerCareTypes?: string[];
  /** @deprecated Not used in redesigned drawer */
  providerPaymentMethods?: string[];
  sending?: boolean;
  sendError?: string | null;
  /** Whether the provider is verified (can send messages) */
  isVerified?: boolean;
  /** Callback when unverified provider clicks send - opens verification modal */
  onVerifyClick?: () => void;
}

// ── Helpers ──

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #7fbfb5, #5a9e94)", // teal/mint
    "linear-gradient(135deg, #9683b5, #7c6a9a)", // purple/violet
    "linear-gradient(135deg, #7a8fa8, #5d7490)", // slate/blue
    "linear-gradient(135deg, #b59683, #9a7c6a)", // terracotta
    "linear-gradient(135deg, #a89683, #8a7a68)", // warm brown
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "Recently";

  const now = Date.now();
  const then = new Date(dateStr).getTime();

  // Handle invalid dates
  if (isNaN(then)) return "Recently";

  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Handle future dates or same-day posts
  if (diffDays < 0) return "Today";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

function memberSince(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  // Handle invalid dates
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatWhoNeedsCare(value: string | undefined, age: number | undefined): string | null {
  if (!value) return null;
  const mapping: Record<string, string> = {
    self: "Self",
    parent: "Parent",
    spouse: "Spouse",
    other: "Family member",
    "Myself": "Self",
    "My parent": "Parent",
    "My spouse": "Spouse",
    "Someone else": "Family member",
    myself: "Self",
    my_parent: "Parent",
    my_spouse: "Spouse",
    someone_else: "Family member",
  };
  const who = mapping[value] || value;
  return age ? `${who}, ${age} years old` : who;
}

// Parse who needs care into structured format for description generation
function parseWhoNeedsCare(value: string | undefined): { relationship: string; isSelf: boolean } | null {
  if (!value) return null;
  const lower = value.toLowerCase().replace(/_/g, " ");
  if (lower === "self" || lower === "myself") {
    return { relationship: "themselves", isSelf: true };
  }
  const mapping: Record<string, string> = {
    parent: "parent",
    "my parent": "parent",
    spouse: "spouse",
    "my spouse": "spouse",
    other: "family member",
    "someone else": "family member",
  };
  const relationship = mapping[lower] || value;
  return { relationship, isSelf: false };
}

// Generate a rich description when user hasn't written one (same as FamilyMatchCard)
function generateDescription(params: {
  name: string;
  who: { relationship: string; isSelf: boolean } | null;
  age: number | undefined;
  careType: string | null;
  careNeeds: string[];
  location: string;
  urgency: string | undefined;
}): string | null {
  const { name, who, age, careType, careNeeds, location, urgency } = params;

  // Need at least some meaningful data to generate
  if (!who && !careType && careNeeds.length === 0 && !location) return null;

  // Use first name for personalization (or skip if generic)
  const firstName = name && name !== "Family" && name.toLowerCase() !== "care seeker"
    ? name.split(" ")[0]
    : null;

  const sentences: string[] = [];

  // ── First sentence: Who + care type + location ──
  let s1 = "";
  if (urgency === "exploring") {
    s1 = firstName ? `${firstName} is exploring` : "Exploring";
    s1 += careType ? ` ${careType} options` : " care options";
  } else {
    s1 = firstName ? `${firstName} is looking for` : "Looking for";
    s1 += careType ? ` ${careType}` : " care";
  }

  if (who) {
    if (who.isSelf) {
      s1 += age ? ` for themselves (age ${age})` : " for themselves";
    } else {
      const recipientDesc = age ? `${age}-year-old ${who.relationship}` : who.relationship;
      s1 += ` for their ${recipientDesc}`;
    }
  }

  if (location) s1 += ` in ${location}`;
  sentences.push(s1 + ".");

  // ── Second sentence: Care needs + timeline ──
  if (careNeeds.length > 0 || (urgency && urgency !== "exploring")) {
    let s2 = "They're";

    if (careNeeds.length > 0) {
      const needsList = [...careNeeds].map(n => n.toLowerCase());
      if (needsList.length === 1) {
        s2 += ` looking for help with ${needsList[0]}`;
      } else if (needsList.length === 2) {
        s2 += ` looking for help with ${needsList[0]} and ${needsList[1]}`;
      } else {
        const last = needsList.pop();
        s2 += ` looking for help with ${needsList.join(", ")}, and ${last}`;
      }

      if (urgency && urgency !== "exploring") {
        const timelineText = urgency === "ASAP"
          ? "ideally starting as soon as possible"
          : `hoping to start ${urgency}`;
        s2 += `, ${timelineText}`;
      }
    } else if (urgency && urgency !== "exploring") {
      const timelineText = urgency === "ASAP"
        ? "hoping to start as soon as possible"
        : `hoping to start ${urgency}`;
      s2 += ` ${timelineText}`;
    }

    sentences.push(s2 + ".");
  }

  return sentences.length > 0 ? sentences.join(" ") : null;
}

// Calculate profile completeness
function calculateCompleteness(family: Profile, meta: FamilyMetadata | null): number {
  if (meta?.profile_completeness !== undefined) {
    return meta.profile_completeness;
  }

  let score = 0;
  const hasRealName = family.display_name?.trim() && family.display_name.toLowerCase() !== "care seeker";

  const weights = {
    photo: 2,
    display_name: 5,
    display_name_real: 5,
    city: 8,
    email: 10,
    phone: 12,
    contact_preference: 2,
    who_needs_care: 10,
    age: 2,
    about_situation: 4,
    care_types: 8,
    care_needs: 6,
    timeline: 12,
    schedule_preference: 2,
    payment_methods: 12,
  };

  if (family.image_url?.trim()) score += weights.photo;
  if (family.display_name?.trim()) score += weights.display_name;
  if (hasRealName) score += weights.display_name_real;
  if (family.city?.trim()) score += weights.city;
  if (family.email?.trim()) score += weights.email;
  if (family.phone?.trim()) score += weights.phone;
  if (meta?.contact_preference) score += weights.contact_preference;
  if (meta?.who_needs_care || meta?.relationship_to_recipient) score += weights.who_needs_care;
  if (meta?.age) score += weights.age;
  if (family.description?.trim() || meta?.about_situation?.trim()) score += weights.about_situation;
  if (family.care_types && family.care_types.length > 0) score += weights.care_types;
  if (meta?.care_needs && meta.care_needs.length > 0) score += weights.care_needs;
  if (meta?.timeline) score += weights.timeline;
  if (meta?.schedule_preference) score += weights.schedule_preference;
  if (meta?.payment_methods && meta.payment_methods.length > 0) score += weights.payment_methods;

  return Math.min(100, score);
}

// Generate a smart default message based on what we know
function generateDefaultMessage(params: {
  firstName: string;
  careTypes: string[];
  careNeeds: string[];
  timeline: string | undefined;
  whoNeedsCare: string | undefined;
  profileState: "full" | "partial" | "minimal";
  providerName: string;
}): string {
  const { firstName, careTypes, careNeeds, timeline, profileState, providerName } = params;

  // Build care context
  const allCare = [...careTypes, ...careNeeds];
  const careList = allCare.length > 0 ? allCare.slice(0, 2).join(" and ") : "";

  // Determine urgency for appropriate tone
  const isUrgent = timeline === "as_soon_as_possible" || timeline === "immediate";
  const isExploring = timeline === "just_researching" || timeline === "exploring";

  // Full profile with care info - be specific
  if (profileState === "full" && careList) {
    if (isUrgent) {
      return `Hi ${firstName},

I saw you're looking for ${careList} soon. We specialize in exactly this and have availability.

Would a quick call work to discuss your needs?

${providerName}`;
    }

    return `Hi ${firstName},

I noticed you're looking for ${careList}. We'd love to help — our team has experience with exactly this.

Feel free to reach out when you're ready to chat.

${providerName}`;
  }

  // Full or partial profile without specific care types - be warm but brief
  if (profileState === "full" || profileState === "partial") {
    if (isExploring) {
      return `Hi ${firstName},

I saw your profile and wanted to introduce myself. No pressure at all — happy to answer any questions when you're ready.

${providerName}`;
    }

    return `Hi ${firstName},

I came across your profile and wanted to reach out. We're a local care provider and I'd love to learn more about what you're looking for.

${providerName}`;
  }

  // Minimal profile - keep it simple and low-pressure
  return `Hi ${firstName},

I wanted to introduce myself. We're here to help whenever you're ready — no pressure at all.

${providerName}`;
}

export default function ReachOutDrawer({
  family,
  isOpen,
  onClose,
  onSend,
  defaultMessage = "",
  providerProfile,
  sending = false,
  sendError,
  isVerified = true,
  onVerifyClick,
}: ReachOutDrawerProps) {
  const [message, setMessage] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"profile" | "message">("profile");
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract family data
  const meta = family ? (family.metadata as FamilyMetadata) : null;
  const displayName = family?.display_name || "Family";
  const firstName = displayName.split(" ")[0];
  const initials = getInitials(displayName);
  const location = family ? [family.city, family.state].filter(Boolean).join(", ") : "";
  const careNeeds = meta?.care_needs || [];
  const careTypes = family?.care_types || [];
  const primaryCareType = careTypes[0];
  const familyQuote = meta?.about_situation;
  const paymentMethods = meta?.payment_methods || [];
  const publishedAt = meta?.care_post?.published_at || family?.created_at;
  const whoNeedsCare = formatWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient, meta?.age);
  const whoNeedsCareParsed = parseWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient);

  // Map timeline to urgency text for description generation
  const urgencyMap: Record<string, string> = {
    as_soon_as_possible: "ASAP",
    immediate: "ASAP",
    within_a_month: "in about a month",
    within_1_month: "in about a month",
    in_a_few_months: "in a few months",
    within_3_months: "in a few months",
    just_researching: "exploring",
    exploring: "exploring",
  };
  const urgency = meta?.timeline ? urgencyMap[meta.timeline as string] : undefined;

  // Generate description if user hasn't written one
  const generatedDescription = !familyQuote ? generateDescription({
    name: displayName,
    who: whoNeedsCareParsed,
    age: meta?.age,
    careType: primaryCareType || null,
    careNeeds,
    location,
    urgency,
  }) : null;

  const displayDescription = familyQuote || generatedDescription;

  // Calculate profile state
  const completeness = family ? calculateCompleteness(family, meta) : 0;
  const profileState: "full" | "partial" | "minimal" =
    completeness >= 70 ? "full" :
    completeness >= 30 ? "partial" : "minimal";

  // Provider data
  const providerName = providerProfile?.display_name || "Your Business";
  const providerLocation = providerProfile
    ? [providerProfile.city, providerProfile.state].filter(Boolean).join(", ")
    : "";

  // Build "At a glance" items - combine care needs, timeline, who, payment, profile stats
  const getTimelineLabel = (): { label: string; value: string } | null => {
    const tl = meta?.timeline as string | undefined;
    if (!tl && !primaryCareType) return null;

    const care = primaryCareType || "care";
    const isExploring = tl === "just_researching" || tl === "exploring";
    const isAsap = tl === "as_soon_as_possible" || tl === "immediate";
    const isMonth = tl === "within_a_month" || tl === "within_1_month";
    const isFewMonths = tl === "in_a_few_months" || tl === "within_3_months";

    if (isExploring) return { label: "Exploring", value: care };
    if (isAsap) return { label: "Needs", value: `${care} ASAP` };
    if (isMonth) return { label: "Needs", value: `${care} in ~1 month` };
    if (isFewMonths) return { label: "Needs", value: `${care} in 2-3 months` };
    if (primaryCareType) return { label: "Looking for", value: care };
    return null;
  };

  const getCareNeedsLabel = (): string | null => {
    if (careNeeds.length === 0) return null;
    // Limit to 4 items to avoid very long inline text
    if (careNeeds.length <= 4) {
      return careNeeds.join(", ");
    }
    return `${careNeeds.slice(0, 4).join(", ")} +${careNeeds.length - 4} more`;
  };

  const getPaymentLabel = (): string | null => {
    if (paymentMethods.length === 0) return null;
    // Limit to 3 items for payment methods
    if (paymentMethods.length <= 3) {
      return paymentMethods.join(", ");
    }
    return `${paymentMethods.slice(0, 3).join(", ")} +${paymentMethods.length - 3} more`;
  };

  // Generate AI message with timeout
  const generateMessage = useCallback(async () => {
    if (!family || !providerProfile) return;

    setIsGenerating(true);

    // Create abort controller with 15 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/matches/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyFirstName: firstName,
          careTypes: [...careTypes, ...careNeeds],
          timeline: meta?.timeline,
          whoNeedsCare: meta?.who_needs_care,
          providerName,
          providerLocation,
          profileState,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message.trim()) {
          setMessage(data.message);
        } else {
          // API returned empty message, fall back to local generation
          setMessage(generateDefaultMessage({
            firstName,
            careTypes,
            careNeeds,
            timeline: meta?.timeline,
            whoNeedsCare: meta?.who_needs_care,
            profileState,
            providerName,
          }));
        }
      } else {
        // Fallback to local generation
        setMessage(generateDefaultMessage({
          firstName,
          careTypes,
          careNeeds,
          timeline: meta?.timeline,
          whoNeedsCare: meta?.who_needs_care,
          profileState,
          providerName,
        }));
      }
    } catch {
      clearTimeout(timeoutId);

      // Fallback to local generation (handles timeout and network errors)
      setMessage(generateDefaultMessage({
        firstName,
        careTypes,
        careNeeds,
        timeline: meta?.timeline,
        whoNeedsCare: meta?.who_needs_care,
        profileState,
        providerName,
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [family, providerProfile, firstName, careTypes, careNeeds, meta?.timeline, meta?.who_needs_care, providerName, providerLocation, profileState]);

  // Simple starter message - no API call, fast and personal
  const getStarterMessage = useCallback(() => {
    return `Hi ${firstName},

I came across your profile and wanted to reach out.

${providerName}`;
  }, [firstName, providerName]);

  // Initialize message when drawer opens
  useEffect(() => {
    if (isOpen && family) {
      setSaveAsDefault(false);
      setStep("profile");
      setQuoteExpanded(false);
      setIsGenerating(false);

      if (defaultMessage) {
        setMessage(defaultMessage);
      } else {
        // Use simple starter - no API call, instant
        setMessage(getStarterMessage());
      }
    }
  }, [isOpen, family, defaultMessage, getStarterMessage]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!family || !message.trim() || sending) return;
    await onSend(family.id, message.trim(), saveAsDefault);
  };

  const handleConnect = () => {
    setStep("message");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleBack = () => {
    setStep("profile");
  };

  if (!family) return null;

  // Build at-a-glance items
  const timelineItem = getTimelineLabel();
  const careNeedsValue = getCareNeedsLabel();
  const paymentValue = getPaymentLabel();

  // ── Sticky Header Content ──
  const StickyHeader = (
    <div className="flex items-center gap-3">
      {family.image_url ? (
        <Image
          src={family.image_url}
          alt={displayName}
          width={48}
          height={48}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-semibold text-white shrink-0"
          style={{ background: avatarGradient(displayName) }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 truncate">{displayName}</h2>
        {location && (
          <p className="text-sm text-gray-600 truncate">{location}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm">
          <span className="text-gray-500">Posted</span>{" "}
          <span className="font-semibold text-gray-700">{timeAgo(publishedAt)}</span>
        </p>
      </div>
    </div>
  );

  // ── Scrollable Content (Profile + At a glance + Message) ──
  const ScrollableContent = (
    <div className="space-y-6">
      {/* About Their Situation */}
      {profileState === "minimal" ? (
        <div className="px-4 py-3 bg-amber-50/60 border-l-2 border-amber-300 rounded-r-lg">
          <p className="text-sm text-amber-800/90 leading-relaxed">
            This family is just getting started. A warm, no-pressure introduction works best here.
          </p>
        </div>
      ) : displayDescription ? (
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            About their situation
          </p>
          <p
            className={`text-base text-gray-700 leading-relaxed ${!quoteExpanded ? 'line-clamp-3' : ''}`}
          >
            {familyQuote ? `"${displayDescription}"` : displayDescription}
          </p>
          {displayDescription.length > 150 && !quoteExpanded && (
            <button
              type="button"
              onClick={() => setQuoteExpanded(true)}
              className="text-base font-medium text-gray-900 underline underline-offset-2 mt-1 hover:text-gray-700"
            >
              more
            </button>
          )}
        </div>
      ) : null}

      {/* At a glance - consolidated section */}
      {profileState !== "minimal" && (
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-4">
            At a glance
          </p>
          <div className="space-y-4">
            {/* Timeline + Care Type */}
            {timelineItem && (
              <div>
                <p className="text-sm text-gray-500">{timelineItem.label}</p>
                <p className="text-base font-medium text-gray-700">{timelineItem.value}</p>
              </div>
            )}

            {/* Care Needs */}
            {careNeedsValue && (
              <div>
                <p className="text-sm text-gray-500">Help with</p>
                <p className="text-base font-medium text-gray-700">{careNeedsValue}</p>
              </div>
            )}

            {/* Who needs care */}
            {whoNeedsCare && (
              <div>
                <p className="text-sm text-gray-500">Who needs care</p>
                <p className="text-base font-medium text-gray-700">{whoNeedsCare}</p>
              </div>
            )}

            {/* Payment */}
            {paymentValue && (
              <div>
                <p className="text-sm text-gray-500">Can pay via</p>
                <p className="text-base font-medium text-gray-700">{paymentValue}</p>
              </div>
            )}

            {/* Profile completeness */}
            <div>
              <p className="text-sm text-gray-500">Profile</p>
              <p className="text-base font-medium text-gray-700">{completeness}% complete</p>
            </div>

            {/* Member since */}
            {family.created_at && (
              <div>
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-base font-medium text-gray-700">{memberSince(family.created_at)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── Message Section ──
  const MessageSection = (
    <div className="space-y-4">
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isGenerating}
          className={`w-full min-h-[160px] px-4 py-3.5 text-base leading-relaxed bg-white border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-[#2a7a6e]/40 focus:border-[#2a7a6e] transition-all placeholder:text-gray-400 ${
            isGenerating ? "opacity-50 animate-pulse" : ""
          }`}
          placeholder={`Hi ${firstName}! I'd love to help with your care needs...`}
        />
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-lg shadow-sm">
              <svg className="w-4 h-4 animate-spin text-[#2a7a6e]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Generating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#2a7a6e] focus:ring-[#2a7a6e]/30 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-500">Save as default</span>
        </label>
        <button
          type="button"
          onClick={() => generateMessage()}
          disabled={isGenerating}
          className="text-sm font-medium text-[#2a7a6e] hover:text-[#1f5c54] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
              Generate with AI
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Sticky Footer Content ──
  const StickyFooter = (
    <>
      {sendError && (
        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
          <p className="text-sm text-rose-600">{sendError}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        {!isVerified ? (
          <button
            onClick={onVerifyClick}
            className="flex-[2] px-4 py-3.5 bg-[#2a7a6e] text-white text-sm font-semibold rounded-xl hover:bg-[#236860] active:bg-[#1f5c54] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            Verify to message
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || isGenerating}
            className="flex-[2] px-4 py-3.5 bg-[#2a7a6e] text-white text-sm font-semibold rounded-xl hover:bg-[#236860] active:bg-[#1f5c54] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                Send Message
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-sm text-center text-gray-500 mt-3">
        {firstName} will see your profile{" "}
        <span className="text-gray-400">·</span>{" "}
        <Link href="/provider/profile" className="font-medium text-[#2a7a6e] hover:text-[#1f5c54]">
          Edit
        </Link>
      </p>
    </>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed z-[70] bg-white shadow-2xl flex flex-col will-change-transform transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[95dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]
          lg:inset-y-0 lg:top-0 lg:right-0 lg:left-auto lg:bottom-0 lg:w-[640px] lg:max-w-[calc(100vw-24px)] lg:h-screen lg:max-h-none lg:rounded-none lg:pb-0
          ${isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MOBILE LAYOUT (two-step flow) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden flex flex-col h-full">
          {/* Mobile drag handle */}
          <div className="pt-3 pb-2 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Mobile sticky header */}
          <div className="shrink-0 px-5 pb-4 border-b border-gray-100">
            {step === "message" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Back to profile"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900">Message to {firstName}</span>
              </div>
            ) : (
              StickyHeader
            )}
          </div>

          {/* Mobile scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {step === "profile" ? ScrollableContent : MessageSection}
          </div>

          {/* Mobile sticky footer */}
          <div className="shrink-0 border-t border-gray-100 px-5 pt-4 pb-4 bg-white">
            {step === "profile" ? (
              <button
                onClick={handleConnect}
                className="w-full px-4 py-3.5 bg-[#2a7a6e] text-white text-sm font-semibold rounded-xl hover:bg-[#236860] active:bg-[#1f5c54] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                Send a Message
              </button>
            ) : (
              StickyFooter
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DESKTOP LAYOUT (two-step flow, same as mobile) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:flex-col lg:h-full">
          {/* Desktop sticky header */}
          <div className="shrink-0 px-6 py-5 border-b border-gray-100">
            {step === "message" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Back to profile"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900">Message to {firstName}</span>
              </div>
            ) : (
              StickyHeader
            )}
          </div>

          {/* Desktop scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {step === "profile" ? ScrollableContent : MessageSection}
          </div>

          {/* Desktop sticky footer */}
          <div className="shrink-0 border-t border-gray-100 px-6 pt-4 pb-5 bg-white">
            {step === "profile" ? (
              <button
                onClick={handleConnect}
                className="w-full px-4 py-3.5 bg-[#2a7a6e] text-white text-sm font-semibold rounded-xl hover:bg-[#236860] active:bg-[#1f5c54] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                Send a Message
              </button>
            ) : (
              StickyFooter
            )}
          </div>
        </div>
      </div>
    </>
  );
}
