"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Profile, FamilyMetadata } from "@/lib/types";

interface ReachOutDrawerProps {
  family: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (familyId: string, message: string, saveAsDefault: boolean, usedAi: boolean) => Promise<boolean>;
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
  /** Mode: "compose" for new outreach, "view" for viewing sent outreach */
  mode?: "compose" | "view";
  /** The message that was sent (for view mode) */
  sentMessage?: string;
  /** When the message was sent (for view mode) */
  sentAt?: string;
  /** Status of the outreach (for view mode) */
  outreachStatus?: "pending" | "connected" | "declined";
  /** Callback when AI message generation succeeds - for analytics tracking */
  onAIGenerate?: (familyId: string, tone: string) => void;
  /** Profile status for inactive family handling */
  profileStatus?: "active" | "paused" | "found_care" | "deleted";
}

// ── Helpers ──

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "?";
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

  // Handle generic names gracefully
  const isGenericName = !firstName ||
    firstName.toLowerCase() === "family" ||
    firstName.toLowerCase() === "care" ||
    firstName.toLowerCase() === "seeker";
  const greeting = isGenericName ? "Hi there" : `Hi ${firstName}`;

  // Build care context
  const allCare = [...careTypes, ...careNeeds];
  const careList = allCare.length > 0 ? allCare.slice(0, 2).join(" and ") : "";

  // Determine urgency for appropriate tone
  const isUrgent = timeline === "as_soon_as_possible" || timeline === "immediate";
  const isExploring = timeline === "just_researching" || timeline === "exploring";

  // Full profile with care info - be specific
  if (profileState === "full" && careList) {
    if (isUrgent) {
      return `${greeting},

I saw you're looking for ${careList} soon. We specialize in exactly this and have availability.

Would a quick call work to discuss your needs?

${providerName}`;
    }

    return `${greeting},

I noticed you're looking for ${careList}. We'd love to help — our team has experience with exactly this.

Feel free to reach out when you're ready to chat.

${providerName}`;
  }

  // Full or partial profile without specific care types - be warm but brief
  if (profileState === "full" || profileState === "partial") {
    if (isExploring) {
      return `${greeting},

I saw your profile and wanted to introduce myself. No pressure at all — happy to answer any questions when you're ready.

${providerName}`;
    }

    return `${greeting},

I came across your profile and wanted to reach out. We're a local care provider and I'd love to learn more about what you're looking for.

${providerName}`;
  }

  // Minimal profile - keep it simple and low-pressure
  return `${greeting},

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
  mode = "compose",
  sentMessage,
  sentAt,
  outreachStatus,
  onAIGenerate,
  profileStatus = "active",
}: ReachOutDrawerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedAi, setUsedAi] = useState(false); // Track if current message used AI generation
  const [step, setStep] = useState<"profile" | "message">("profile");
  const [showSuccess, setShowSuccess] = useState(false);
  const isViewMode = mode === "view";
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text: string, field: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  // Extract family data
  const meta = family ? (family.metadata as FamilyMetadata) : null;
  const displayName = family?.display_name || "Family";
  const firstName = displayName.split(" ")[0];
  const isGenericFirstName = !firstName ||
    firstName.toLowerCase() === "family" ||
    firstName.toLowerCase() === "care" ||
    firstName.toLowerCase() === "seeker";
  const personalGreeting = isGenericFirstName ? "Hi there" : `Hi ${firstName}`;
  const initials = getInitials(displayName);
  const location = family ? [family.city, family.state].filter(Boolean).join(", ") : "";
  const careNeeds = meta?.care_needs || [];
  const careTypes = family?.care_types || [];
  const primaryCareType = careTypes[0];
  const familyQuote = meta?.about_situation;
  const paymentMethods = meta?.payment_methods || [];
  const publishedAt = meta?.care_post?.published_at || family?.created_at;
  const whoNeedsCare = formatWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient, meta?.age);
  const contactPreference = meta?.contact_preference;
  const schedulePreference = meta?.schedule_preference;
  const whoNeedsCareParsed = parseWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient);

  // Contact information (only shown for connected state)
  const familyPhone = family?.phone;
  const familyEmail = family?.email;

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

  // Build "Care details" items - combine care needs, timeline, who, payment, profile stats
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
    return careNeeds.join(", ");
  };

  const getPaymentLabel = (): string | null => {
    if (paymentMethods.length === 0) return null;
    return paymentMethods.join(", ");
  };

  // Format preferences (contact + schedule) as a single combined label
  const getPreferencesLabel = (): string | null => {
    const parts: string[] = [];

    // Format contact preference with clearer labels
    if (contactPreference) {
      const contactMap: Record<string, string> = {
        call: "Prefers phone calls",
        phone: "Prefers phone calls",
        text: "Prefers text messages",
        sms: "Prefers text messages",
        email: "Prefers email",
      };
      const formatted = contactMap[contactPreference.toLowerCase()] || `Prefers ${contactPreference}`;
      parts.push(formatted);
    }

    // Format schedule preference with proper labels
    if (schedulePreference) {
      const schedule = schedulePreference.trim().toLowerCase();
      if (schedule) {
        const scheduleMap: Record<string, string> = {
          mornings: "Mornings",
          afternoons: "Afternoons",
          evenings: "Evenings",
          overnight: "Overnight",
          full_time: "Full-time",
          "full-time": "Full-time",
          flexible: "Flexible",
          weekdays: "Weekdays",
          weekends: "Weekends",
        };
        const formatted = scheduleMap[schedule] || schedule.charAt(0).toUpperCase() + schedule.slice(1).replace(/_/g, " ");
        parts.push(formatted);
      }
    }

    if (parts.length === 0) return null;
    return parts.join(", ");
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
          setUsedAi(true); // Mark as AI-generated only on success
          // Track AI generation event AFTER successful generation
          if (onAIGenerate) {
            onAIGenerate(family.id, "default");
          }
        } else {
          // API returned empty message, fall back to local generation (not AI)
          setMessage(generateDefaultMessage({
            firstName,
            careTypes,
            careNeeds,
            timeline: meta?.timeline,
            whoNeedsCare: meta?.who_needs_care,
            profileState,
            providerName,
          }));
          // Don't set usedAi or track - this is template, not AI
        }
      } else {
        // Fallback to local generation (not AI)
        setMessage(generateDefaultMessage({
          firstName,
          careTypes,
          careNeeds,
          timeline: meta?.timeline,
          whoNeedsCare: meta?.who_needs_care,
          profileState,
          providerName,
        }));
        // Don't set usedAi or track - this is template, not AI
      }
    } catch {
      clearTimeout(timeoutId);

      // Fallback to local generation (handles timeout and network errors - not AI)
      setMessage(generateDefaultMessage({
        firstName,
        careTypes,
        careNeeds,
        timeline: meta?.timeline,
        whoNeedsCare: meta?.who_needs_care,
        profileState,
        providerName,
      }));
      // Don't set usedAi or track - this is template, not AI
    } finally {
      setIsGenerating(false);
    }
  }, [family, providerProfile, firstName, careTypes, careNeeds, meta?.timeline, meta?.who_needs_care, providerName, providerLocation, profileState, onAIGenerate]);

  // Smart starter message - contextual but incomplete, inviting personalization
  // Key design: NO signature, references what we know, clearly needs more
  const getStarterMessage = useCallback(() => {
    // Build context based on what we know about the family
    const care = primaryCareType || (careNeeds.length > 0 ? careNeeds[0] : null);
    const loc = location;

    // Check urgency for tone
    const tl = meta?.timeline as string | undefined;
    const isUrgent = tl === "as_soon_as_possible" || tl === "immediate";

    // Build the contextual opener - show we actually read their profile
    let context = "";
    if (care && loc) {
      context = `I saw you're looking for ${care.toLowerCase()} in ${loc}`;
    } else if (care) {
      context = `I noticed you're looking for help with ${care.toLowerCase()}`;
    } else if (loc) {
      context = `I saw your post looking for care in ${loc}`;
    } else {
      context = `I came across your profile`;
    }

    // Add urgency acknowledgment if they need help soon
    const urgencyNote = isUrgent ? ", and I know timing matters" : "";

    // The message: contextual but clearly incomplete
    // No signature forces them to add who they are
    return `${personalGreeting},

${context}${urgencyNote}. I'd love to help.

`;
  }, [personalGreeting, primaryCareType, careNeeds, location, meta?.timeline]);

  // Track previous family to detect fresh drawer opens vs. mid-session updates
  const prevFamilyIdRef = useRef<string | null>(null);

  // Initialize message when drawer opens (fresh open only, not mid-session mode changes)
  useEffect(() => {
    if (isOpen && family) {
      const isFreshOpen = prevFamilyIdRef.current !== family.id;
      prevFamilyIdRef.current = family.id;

      // Only reset these on fresh drawer open, not when isViewMode changes mid-session
      if (isFreshOpen) {
        setSaveAsDefault(false);
        setQuoteExpanded(false);
        setIsGenerating(false);
        setShowSuccess(false);
        setCopiedField(null);
        setUsedAi(false); // Reset AI tracking for new conversation
      }

      if (isViewMode) {
        // View mode: show sent message (step doesn't matter - we show both profile and message)
        setMessage(sentMessage || "");
      } else {
        // Compose mode: start at profile step
        setStep("profile");
        if (defaultMessage) {
          setMessage(defaultMessage);
        } else {
          // Use simple starter - no API call, instant
          setMessage(getStarterMessage());
        }
      }
    }

    // Reset tracking when drawer closes
    if (!isOpen) {
      prevFamilyIdRef.current = null;
    }
  }, [isOpen, family, defaultMessage, getStarterMessage, isViewMode, sentMessage]);

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

  // Cleanup focus timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Auto-resize textarea to fit content
  // Runs when: message changes, step changes to "message", or view mode changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || isViewMode || step !== "message") return;

    // Get CSS min/max heights (respects responsive breakpoints)
    const computedStyle = window.getComputedStyle(textarea);
    const minHeight = parseInt(computedStyle.minHeight) || 160;
    const maxHeight = parseInt(computedStyle.maxHeight) || 400;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = "auto";

    // Calculate new height within CSS bounds
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
  }, [message, isViewMode, step]);

  const handleSend = async () => {
    if (!family || !message.trim() || sending) return;
    const success = await onSend(family.id, message.trim(), saveAsDefault, usedAi);
    // Only show success state if send actually succeeded
    if (success) {
      setShowSuccess(true);
    }
  };

  const handleViewOutreach = () => {
    router.push("/provider/outreach?status=pending");
    onClose();
  };

  const handleDone = () => {
    onClose();
  };

  const handleConnect = () => {
    setStep("message");
    // Clear any existing timeout before setting a new one
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = setTimeout(() => {
      textareaRef.current?.focus();
      focusTimeoutRef.current = null;
    }, 100);
  };

  const handleBack = () => {
    setStep("profile");
  };

  if (!family) return null;

  // Build care details items
  const timelineItem = getTimelineLabel();
  const careNeedsValue = getCareNeedsLabel();
  const paymentValue = getPaymentLabel();
  const preferencesValue = getPreferencesLabel();
  const memberSinceValue = family.created_at ? memberSince(family.created_at) : null;

  // ── Sticky Header Content ──
  // Status tag for view mode (matches lead detail drawer pattern)
  const statusTag = isViewMode && outreachStatus ? (
    outreachStatus === "pending" ? (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-medium leading-none bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
        Pending
      </span>
    ) : outreachStatus === "connected" ? (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-medium leading-none bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
        Connected
      </span>
    ) : outreachStatus === "declined" ? (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-medium leading-none bg-gray-50 text-gray-500 border border-gray-200 shrink-0">
        Declined
      </span>
    ) : null
  ) : null;

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
        <div className="flex items-center gap-2">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 truncate">{displayName}</h2>
          {statusTag}
        </div>
        {location && (
          <p className="text-sm text-gray-600 truncate">{location}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm">
          <span className="text-gray-500">{isViewMode && sentAt ? "Sent" : "Posted"}</span>{" "}
          <span className="font-semibold text-gray-700">{isViewMode && sentAt ? timeAgo(sentAt) : timeAgo(publishedAt)}</span>
        </p>
      </div>
    </div>
  );

  // ── Profile Section (About + Care details) ──
  const ProfileSection = (
    <div className="space-y-6">
      {/* About Their Situation */}
      {displayDescription ? (
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

      {/* Care details - consolidated section */}
      <div className={displayDescription ? "mt-2" : ""}>
          <p className="text-lg font-semibold text-gray-900 mb-3">
            Care details
          </p>
          <div className="space-y-3">
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

            {/* Preferences (contact + schedule) */}
            {preferencesValue && (
              <div>
                <p className="text-sm text-gray-500">Preferences</p>
                <p className="text-base font-medium text-gray-700">{preferencesValue}</p>
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
            {memberSinceValue && (
              <div>
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-base font-medium text-gray-700">{memberSinceValue}</p>
              </div>
            )}

            {/* Profile status */}
            <div>
              <p className="text-sm text-gray-500">Profile status</p>
              <p className={`text-base font-medium flex items-center gap-1.5 ${
                profileStatus === "active" ? "text-emerald-600"
                  : profileStatus === "paused" ? "text-amber-600"
                  : profileStatus === "found_care" ? "text-blue-600"
                  : "text-gray-500"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  profileStatus === "active" ? "bg-emerald-500"
                    : profileStatus === "paused" ? "bg-amber-500"
                    : profileStatus === "found_care" ? "bg-blue-500"
                    : "bg-gray-400"
                }`} />
                {profileStatus === "active" ? "Profile Active"
                  : profileStatus === "paused" ? "Profile Paused"
                  : profileStatus === "found_care" ? "Found Care"
                  : "No Longer Active"}
              </p>
            </div>
          </div>
        </div>
    </div>
  );

  // ── Contact Info Section (Connected state only) ──
  const ContactInfoSection = outreachStatus === "connected" && (familyPhone || familyEmail) ? (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-primary-800">Contact Information</p>
      </div>
      <div className="space-y-3">
        {/* Phone */}
        {familyPhone && (
          <div className="flex items-center justify-between gap-3 bg-white rounded-lg px-3.5 py-3 border border-primary-100">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <p className="text-[15px] font-semibold text-gray-900 truncate">{familyPhone}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${familyPhone}`}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                aria-label="Call"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(familyPhone, "phone")}
                className={`p-2 rounded-lg border transition-colors ${
                  copiedField === "phone"
                    ? "bg-primary-100 border-primary-200 text-primary-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                aria-label={copiedField === "phone" ? "Copied!" : "Copy phone"}
              >
                {copiedField === "phone" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Email */}
        {familyEmail && (
          <div className="flex items-center justify-between gap-3 bg-white rounded-lg px-3.5 py-3 border border-primary-100">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="text-[15px] font-semibold text-gray-900 truncate">{familyEmail}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`mailto:${familyEmail}`}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                aria-label="Send email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(familyEmail, "email")}
                className={`p-2 rounded-lg border transition-colors ${
                  copiedField === "email"
                    ? "bg-primary-100 border-primary-200 text-primary-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                aria-label={copiedField === "email" ? "Copied!" : "Copy email"}
              >
                {copiedField === "email" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // ── Scrollable Content (Profile step for compose mode) ──
  const ScrollableContent = ProfileSection;

  // ── Message Section ──
  // Format sent date for view mode
  const formatSentDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ── Message Section (Compose Mode) ──
  const MessageSectionCompose = (
    <div className="space-y-4">
      {/* Textarea with resize indicator */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isGenerating}
          className={`w-full min-h-[280px] lg:min-h-[160px] max-h-[500px] lg:max-h-[400px] px-4 py-3.5 text-base leading-relaxed bg-white border border-gray-200 rounded-xl resize-y overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600 transition-colors placeholder:text-gray-400 ${
            isGenerating ? "opacity-50 animate-pulse" : ""
          }`}
          placeholder={isGenericFirstName ? "Hi! I'd love to help with your care needs..." : `Hi ${firstName}! I'd love to help with your care needs...`}
        />
        {/* Resize grip indicator */}
        <div className="absolute bottom-1.5 right-1.5 pointer-events-none text-gray-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
            <circle cx="18" cy="18" r="1.5" />
          </svg>
        </div>
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-lg shadow-sm">
              <svg className="w-4 h-4 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
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
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600/30 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-500">Save as default</span>
        </label>
        <button
          type="button"
          onClick={() => generateMessage()}
          disabled={isGenerating}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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

  // ── Message Section (View Mode) ──
  const MessageSectionView = (
    <div className="space-y-3">
      {/* Section header + timestamp (compact) */}
      <div>
        <p className="text-lg font-semibold text-gray-900">Your message</p>
        {sentAt && (
          <p className="text-sm text-gray-500 mt-0.5">
            Sent {formatSentDate(sentAt)}
          </p>
        )}
      </div>

      {/* Read-only message display */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
        <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {message || "No message content"}
        </p>
      </div>

      {/* Declined feedback */}
      {outreachStatus === "declined" && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            {firstName} indicated this wasn&apos;t a good fit.
          </p>
        </div>
      )}
    </div>
  );

  const MessageSection = isViewMode ? MessageSectionView : MessageSectionCompose;

  // ── Success Section (After Send) ──
  const SuccessSection = (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <Image
        src="/message-sent.png"
        alt="Message sent"
        width={180}
        height={180}
        className="mb-6"
      />
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
        Message sent!
      </h3>
      <p className="text-[15px] text-gray-500 max-w-xs leading-relaxed mb-8">
        {isGenericFirstName
          ? "We'll notify you when they respond."
          : `We'll notify you when ${firstName} responds.`}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={handleViewOutreach}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          View Outreach
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="flex-1 px-4 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );

  // ── Sticky Footer Content (Compose Mode) ──
  // Messaging rules:
  // - "deleted" profile → always block (they left the platform)
  // - "found_care" + connected → allow (established relationship, might need follow-up)
  // - "found_care" + not connected → block (they found care elsewhere)
  // - "paused" → allow (they're still active, just not seeking new connections)
  const isConnected = outreachStatus === "connected";
  const isDeleted = profileStatus === "deleted";
  const isFoundCare = profileStatus === "found_care";
  const isPaused = profileStatus === "paused";
  // Block messaging only if deleted, or found_care without an established connection
  const isInactive = isDeleted || (isFoundCare && !isConnected);

  const StickyFooterCompose = (
    <>
      {sendError && (
        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
          <p className="text-sm text-rose-600">{sendError}</p>
        </div>
      )}
      {isPaused && (
        <div className="mb-3 px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-sm text-amber-700">
            <span className="font-medium">This family has paused their search.</span>{" "}
            You can still send a message — they&apos;ll see it when they resume.
          </p>
        </div>
      )}
      {isFoundCare && isConnected && (
        <div className="mb-3 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">This family found care.</span>{" "}
            You&apos;re still connected — feel free to stay in touch.
          </p>
        </div>
      )}
      {isInactive && (
        <div className="mb-3 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{isFoundCare ? "This family found care." : "This family\u0027s profile is no longer active."}</span>{" "}
            {isFoundCare ? "They\u0027ve resolved their care needs." : "They may have left the platform or their needs changed."}
          </p>
        </div>
      )}
      <div>
        {isInactive ? (
          <button
            disabled
            className="w-full px-4 py-3.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isFoundCare ? "Family found care" : "Profile no longer active"}
          </button>
        ) : !isVerified ? (
          <button
            onClick={onVerifyClick}
            className="w-full px-4 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center gap-2"
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
            className="w-full px-4 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      {!isInactive && (
        <p className="text-sm text-center text-gray-500 mt-3">
          {isGenericFirstName ? "They" : firstName} will see your profile{" "}
          <span className="text-gray-400">·</span>{" "}
          <Link href="/provider/profile" className="font-medium text-primary-600 hover:text-primary-700">
            Edit
          </Link>
        </p>
      )}
    </>
  );

  // ── Sticky Footer Content (View Mode) ──
  const StickyFooterView = (
    <div className="space-y-3">
      {outreachStatus === "connected" ? (
        <Link
          href="/provider/inbox"
          className="w-full px-4 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          Continue in Inbox
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center"
        >
          Close
        </button>
      )}
    </div>
  );

  const StickyFooter = isViewMode ? StickyFooterView : StickyFooterCompose;

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
          inset-x-0 bottom-0 h-[95dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]
          lg:inset-y-0 lg:top-0 lg:right-0 lg:left-auto lg:bottom-0 lg:w-[640px] lg:max-w-[calc(100vw-24px)] lg:h-screen lg:rounded-none lg:pb-0
          ${isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MOBILE LAYOUT (two-step flow for compose, single view for view mode) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden flex flex-col h-full">
          {/* Mobile drag handle */}
          <div className="pt-3 pb-2 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {showSuccess ? (
            // Success state: full-screen success message
            <div className="flex-1 flex items-center justify-center px-5 py-8">
              {SuccessSection}
            </div>
          ) : (
            <>
              {/* Mobile sticky header */}
              <div className="shrink-0 px-5 pb-4 border-b border-gray-100">
                {isViewMode ? (
                  // View mode: always show family header
                  StickyHeader
                ) : step === "message" ? (
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
                    <span className="text-lg font-semibold text-gray-900">
                      {isGenericFirstName ? "Your message" : `Message to ${firstName}`}
                    </span>
                  </div>
                ) : (
                  StickyHeader
                )}
              </div>

              {/* Mobile scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {isViewMode ? (
                  // View mode: contact info (if connected), profile, and message together
                  <div className="space-y-6">
                    {ContactInfoSection}
                    {ProfileSection}
                    <div className="border-t border-gray-100 pt-6">
                      {MessageSection}
                    </div>
                  </div>
                ) : (
                  // Compose mode: two-step flow
                  step === "profile" ? ScrollableContent : MessageSection
                )}
              </div>

              {/* Mobile sticky footer */}
              <div className="shrink-0 border-t border-gray-100 px-5 pt-4 pb-4 bg-white">
                {isViewMode ? (
                  StickyFooter
                ) : step === "profile" ? (
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    Reach Out
                  </button>
                ) : (
                  StickyFooter
                )}
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DESKTOP LAYOUT (two-step flow for compose, single view for view mode) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:flex-col lg:h-full">
          {showSuccess ? (
            // Success state: centered success message
            <div className="flex-1 flex items-center justify-center px-6 py-8">
              {SuccessSection}
            </div>
          ) : (
            <>
              {/* Desktop sticky header */}
              <div className="shrink-0 px-6 py-5 border-b border-gray-100">
                {isViewMode ? (
                  // View mode: always show family header
                  StickyHeader
                ) : step === "message" ? (
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
                    <span className="text-lg font-semibold text-gray-900">
                      {isGenericFirstName ? "Your message" : `Message to ${firstName}`}
                    </span>
                  </div>
                ) : (
                  StickyHeader
                )}
              </div>

              {/* Desktop scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isViewMode ? (
                  // View mode: contact info (if connected), profile, and message together
                  <div className="space-y-6">
                    {ContactInfoSection}
                    {ProfileSection}
                    <div className="border-t border-gray-100 pt-6">
                      {MessageSection}
                    </div>
                  </div>
                ) : (
                  // Compose mode: two-step flow
                  step === "profile" ? ScrollableContent : MessageSection
                )}
              </div>

              {/* Desktop sticky footer */}
              <div className="shrink-0 border-t border-gray-100 px-6 pt-4 pb-5 bg-white">
                {isViewMode ? (
                  StickyFooter
                ) : step === "profile" ? (
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    Reach Out
                  </button>
                ) : (
                  StickyFooter
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
