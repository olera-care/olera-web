"use client";

/**
 * ProviderDrawer - Airbnb-inspired detail drawer for provider outreach
 *
 * Slides from right, shows all provider details in a clean layout.
 * Reduces visual clutter in the main provider row by moving secondary
 * information here (Apollo contacts, notes, activity, full actions).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { DrawerShell } from "@/components/admin/medjobs/DrawerShell";
import { EmailHistoryPopover } from "@/components/admin/provider-outreach/EmailHistoryPopover";

// ─────────────────────────────────────────────────────────────────────────────
// Types (copied from page.tsx for standalone use)
// ─────────────────────────────────────────────────────────────────────────────

type OutreachStage =
  | "not_contacted"
  | "in_sequence"
  | "needs_call"
  | "re_engage"
  | "not_interested"
  | "claimed"
  | "archived";

interface ApolloContact {
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  linkedin_url: string | null;
  found_at: string;
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
  stage: OutreachStage;
  notes: string | null;
  questions_count?: number;
  leads_count?: number;
  apollo_contact?: ApolloContact | null;
  email_source?: "organization" | "decision_maker" | null;
  assigned_to: string | null;
  emails_sent?: number;
  sequence_status?: {
    last_email_at?: string;
    failed_step?: number;
    failed_reason?: string;
  };
  // Follow Up queue fields
  due_date?: string | null;
  resend_count?: number;
  needs_call_reason?: string | null;
  engagement?: {
    emails_sent: number;
    opens: number;
    clicks: number;
    resends: number;
  };
  // Alternative Channels (re_engage) fields
  re_engage_channel?: string | null;
  re_engage_entered_at?: string | null;
  fax_number?: string | null;
  mail_address?: string | null;
  contact_form_url?: string | null;
}

interface Note {
  id: string;
  provider_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
  admin_name: string | null;
}

interface ProviderDrawerProps {
  provider: OutreachProvider;
  onClose: () => void;
  // Inline editing callbacks
  onEmailUpdate?: (providerId: string, email: string, emailSource?: "decision_maker") => void;
  onPhoneUpdate?: (providerId: string, phone: string | null) => void;
  // Action callbacks (use providerId to avoid type mismatches with page's full OutreachProvider)
  onLaunchSequence?: (providerId: string) => void;
  onMarkNotInterested?: (providerId: string, reason?: string) => void;
  onArchive?: (providerId: string) => void;
  onRemove?: (providerId: string, providerName: string) => void;
  onMoveToReady?: (providerId: string) => void;
  // Reset to Ready with Apollo email (for in_sequence providers)
  onResetToReadyWithApollo?: (providerId: string) => Promise<boolean>;
  // Apollo callbacks
  onContactFound?: (providerId: string, contact: ApolloContact) => void;
  // Outcome callback (for Follow Up and Alt Channels actions)
  onOutcomeRecorded?: (providerId: string, stageChanged: boolean) => void;
  // Current UI context
  activeTab?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Follow Up Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RESEND_COUNT = 2;

const NEEDS_CALL_REASON_LABELS: Record<string, string> = {
  sequence_exhausted: "Sequence done",
  sequence_completed: "Sequence done",
  clicked_not_claimed: "Clicked",
  replied: "Replied",
  email_bounced: "Bounced",
  manual: "Manual",
};

function getTodayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

// Days until a future date (positive = future, negative = overdue)
function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const today = new Date(getTodayISO());
  const targetDate = new Date(dateStr);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDueDateBadge(dateStr: string | null): { text: string; className: string } {
  if (!dateStr) {
    return { text: "Due today", className: "bg-amber-100 text-amber-700" };
  }

  const daysDiff = daysUntil(dateStr);

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

function getNeedsCallReasonChip(reason: string | null): { label: string; className: string } | null {
  if (!reason) return null;
  const label = NEEDS_CALL_REASON_LABELS[reason] || reason;
  switch (reason) {
    case "sequence_exhausted":
    case "sequence_completed":
      return { label, className: "bg-blue-50 text-blue-700" };
    case "clicked_not_claimed":
      return { label, className: "bg-emerald-50 text-emerald-700" };
    case "replied":
      return { label, className: "bg-purple-50 text-purple-700" };
    case "email_bounced":
      return { label, className: "bg-red-50 text-red-700" };
    case "manual":
    default:
      return { label, className: "bg-gray-100 text-gray-600" };
  }
}

function getFollowUpReasonExplanation(provider: OutreachProvider): string {
  const reason = provider.needs_call_reason;
  const engagement = provider.engagement || { emails_sent: 0, opens: 0, clicks: 0, resends: 0 };

  switch (reason) {
    case "replied":
      return "Provider replied to an email — this is a hot lead.";
    case "clicked_not_claimed":
      return `Provider clicked ${engagement.clicks} time${engagement.clicks !== 1 ? "s" : ""} but didn't claim.`;
    case "sequence_exhausted":
    case "sequence_completed":
      if (engagement.opens > 0) {
        return `Provider opened ${engagement.opens} email${engagement.opens !== 1 ? "s" : ""} but didn't click.`;
      } else {
        return "No email engagement detected.";
      }
    case "email_bounced":
      return "Email bounced — contact info needs to be updated.";
    case "manual":
      return "Manually added to follow-up queue.";
    default:
      return "Ready for follow-up.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
      {children}
    </h3>
  );
}

function SectionDivider() {
  return <div className="border-t border-gray-200 my-8" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Section (Email + Phone with inline edit)
// ─────────────────────────────────────────────────────────────────────────────

function ContactSection({
  provider,
  onEmailUpdate,
  onPhoneUpdate,
}: {
  provider: OutreachProvider;
  onEmailUpdate?: (email: string) => void;
  onPhoneUpdate?: (phone: string | null) => void;
}) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [emailValue, setEmailValue] = useState(provider.email || "");
  const [phoneValue, setPhoneValue] = useState(provider.phone || "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function handleSaveEmail() {
    if (!emailValue.trim()) return;
    setSavingEmail(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id, email: emailValue.trim() }),
      });
      if (res.ok) {
        onEmailUpdate?.(emailValue.trim());
        setEditingEmail(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailError(data.error || "Failed to save");
      }
    } catch {
      setEmailError("Network error");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePhone() {
    setSavingPhone(true);
    setPhoneError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id, phone: phoneValue.trim() }),
      });
      if (res.ok) {
        onPhoneUpdate?.(phoneValue.trim() || null);
        setEditingPhone(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setPhoneError(data.error || "Failed to save");
      }
    } catch {
      setPhoneError("Network error");
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <div>
      <SectionHeader>Contact</SectionHeader>

      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 w-16">Email</span>
        {editingEmail ? (
          <div className="flex items-center gap-2 flex-1 ml-3">
            <input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEmail();
                if (e.key === "Escape") {
                  e.stopPropagation(); // Prevent drawer from closing
                  setEditingEmail(false);
                  setEmailValue(provider.email || "");
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSaveEmail}
              disabled={savingEmail || !emailValue.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savingEmail ? "..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditingEmail(false);
                setEmailValue(provider.email || "");
                setEmailError(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            {emailError && <span className="text-xs text-red-500">{emailError}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1 ml-3">
            {provider.email ? (
              <>
                <a
                  href={`mailto:${provider.email}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {provider.email}
                </a>
                <EmailHistoryPopover providerId={provider.provider_id} currentEmail={provider.email} />
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">No email</span>
            )}
            <button
              onClick={() => {
                setEditingEmail(true);
                setEmailValue(provider.email || "");
              }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 w-16">Phone</span>
        {editingPhone ? (
          <div className="flex items-center gap-2 flex-1 ml-3">
            <input
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="(555) 123-4567"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePhone();
                if (e.key === "Escape") {
                  e.stopPropagation(); // Prevent drawer from closing
                  setEditingPhone(false);
                  setPhoneValue(provider.phone || "");
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savingPhone ? "..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditingPhone(false);
                setPhoneValue(provider.phone || "");
                setPhoneError(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            {phoneError && <span className="text-xs text-red-500">{phoneError}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1 ml-3">
            {provider.phone ? (
              <a
                href={`tel:${provider.phone.replace(/\D/g, "")}`}
                className="text-sm text-primary-600 hover:underline"
              >
                {formatPhone(provider.phone)}
              </a>
            ) : (
              <span className="text-sm text-gray-400 italic">No phone</span>
            )}
            <button
              onClick={() => {
                setEditingPhone(true);
                setPhoneValue(provider.phone || "");
              }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision Maker Section (Apollo data - clean, no colored boxes)
// ─────────────────────────────────────────────────────────────────────────────

function DecisionMakerSection({
  provider,
  onUseEmail,
  onContactFound,
  onResetToReadyWithApollo,
}: {
  provider: OutreachProvider;
  onUseEmail?: (email: string) => void;
  onContactFound?: (contact: ApolloContact) => void;
  onResetToReadyWithApollo?: () => Promise<boolean>;
}) {
  const [finding, setFinding] = useState(false);
  const [using, setUsing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localContact, setLocalContact] = useState<ApolloContact | null>(
    provider.apollo_contact || null
  );

  const contact = localContact;
  const isActive = provider.email_source === "decision_maker";
  const emailsMatch = contact?.email?.toLowerCase() === provider.email?.toLowerCase();
  const isInSequence = provider.stage === "in_sequence";

  async function handleFind() {
    setFinding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/find-decision-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.contact?.email) {
        const foundContact: ApolloContact = {
          email: data.contact.email,
          first_name: data.contact.first_name,
          last_name: data.contact.last_name,
          title: data.contact.title,
          linkedin_url: data.contact.linkedin_url,
          found_at: new Date().toISOString(),
        };
        setLocalContact(foundContact);
        // Notify parent to sync state
        onContactFound?.(foundContact);
      } else {
        setError("No decision-maker found");
      }
    } catch {
      setError("Lookup failed");
    } finally {
      setFinding(false);
    }
  }

  async function handleUseEmail() {
    if (!contact?.email || using) return;
    setUsing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          email: contact.email,
          confirm_apollo: true,
        }),
      });
      if (res.ok) {
        onUseEmail?.(contact.email);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update");
      }
    } catch {
      setError("Failed to update");
    } finally {
      setUsing(false);
    }
  }

  async function handleResetToReady() {
    if (!onResetToReadyWithApollo || resetting) return;
    setResetting(true);
    setError(null);
    try {
      const success = await onResetToReadyWithApollo();
      if (!success) {
        setError("Failed to reset");
      }
    } catch {
      setError("Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <SectionHeader>Decision Maker (Apollo)</SectionHeader>

      {!contact ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleFind}
            disabled={finding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
          >
            {finding ? (
              <>
                <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                Finding...
              </>
            ) : (
              "Find Decision Maker"
            )}
          </button>
          {error && <span className="text-sm text-amber-600">{error}</span>}
        </div>
      ) : (
        <div className="space-y-1">
          {/* Name - bold */}
          <p className="font-medium text-gray-900">
            {[contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unknown"}
          </p>

          {/* Title · Email · LinkedIn - all inline */}
          {(contact.title || contact.email || contact.linkedin_url) && (
            <p className="text-sm text-gray-500">
              {contact.title}
              {contact.title && contact.email && <span className="mx-1.5">·</span>}
              {contact.email}
              {(contact.title || contact.email) && contact.linkedin_url && <span className="mx-1.5">·</span>}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  LinkedIn
                </a>
              )}
            </p>
          )}

          {/* Action buttons - only show when needed */}
          {(!isActive && !emailsMatch && contact.email) || (isInSequence && contact?.email && !emailsMatch && onResetToReadyWithApollo) ? (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {!isActive && !emailsMatch && contact.email && (
                <button
                  onClick={handleUseEmail}
                  disabled={using}
                  className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                >
                  {using ? "Updating..." : "Use This Email"}
                </button>
              )}
              {isInSequence && contact?.email && !emailsMatch && onResetToReadyWithApollo && (
                <button
                  onClick={handleResetToReady}
                  disabled={resetting}
                  className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Reset to Ready with This Email"}
                </button>
              )}
              {error && <span className="text-sm text-amber-600">{error}</span>}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes Section
// ─────────────────────────────────────────────────────────────────────────────

function NotesSection({ provider }: { provider: OutreachProvider }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(
          `/api/admin/provider-outreach/notes?provider_id=${encodeURIComponent(provider.provider_id)}`
        );
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, [provider.provider_id]);

  const handleSubmit = useCallback(async () => {
    if (!newNote.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          note: newNote.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNote("");
      } else {
        setSubmitError("Failed to add note");
      }
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  }, [newNote, provider.provider_id, submitting]);

  return (
    <div>
      <SectionHeader>Notes</SectionHeader>

      {/* Add note input */}
      <div className="mb-5">
        <textarea
          ref={textareaRef}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={2}
          disabled={submitting}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
            // Prevent ESC from bubbling to drawer and closing it while editing
            if (e.key === "Escape") {
              e.stopPropagation();
              // Clear the note and blur the textarea
              setNewNote("");
              textareaRef.current?.blur();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
            {submitError && <span className="text-xs text-red-500">{submitError}</span>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!newNote.trim() || submitting}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <span className="w-5 h-5 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No notes yet</p>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">{note.admin_name || "Unknown"}</span>
                <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Section (Questions & Leads)
// ─────────────────────────────────────────────────────────────────────────────

function ActivitySection({ provider }: { provider: OutreachProvider }) {
  const questionsCount = provider.questions_count ?? 0;
  const leadsCount = provider.leads_count ?? 0;

  return (
    <div>
      <SectionHeader>Activity</SectionHeader>
      <div className="flex items-center gap-6">
        <div>
          <span className="text-2xl font-semibold text-gray-900">{questionsCount}</span>
          <span className="ml-1.5 text-sm text-gray-500">Questions</span>
        </div>
        <div>
          <span className="text-2xl font-semibold text-gray-900">{leadsCount}</span>
          <span className="ml-1.5 text-sm text-gray-500">Leads</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Follow Up Section (for needs_call stage)
// ─────────────────────────────────────────────────────────────────────────────

function FollowUpSection({
  provider,
}: {
  provider: OutreachProvider;
}) {
  const dueBadge = formatDueDateBadge(provider.due_date || null);
  const reasonChip = getNeedsCallReasonChip(provider.needs_call_reason || null);
  const explanation = getFollowUpReasonExplanation(provider);
  const engagement = provider.engagement || { emails_sent: 0, opens: 0, clicks: 0, resends: 0 };
  const resendCount = provider.resend_count ?? 0;

  return (
    <div>
      <SectionHeader>Follow Up Status</SectionHeader>

      {/* Due date and reason badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${dueBadge.className}`}>
          {dueBadge.text}
        </span>
        {reasonChip && (
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${reasonChip.className}`}>
            {reasonChip.label}
          </span>
        )}
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-700 mb-4">{explanation}</p>

      {/* Engagement stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Emails:</span>
          <span className="font-medium text-gray-900">{engagement.emails_sent}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Opens:</span>
          <span className="font-medium text-gray-900">{engagement.opens}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Clicks:</span>
          <span className="font-medium text-gray-900">{engagement.clicks}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Resends:</span>
          <span className="font-medium text-gray-900">{resendCount}/{MAX_RESEND_COUNT}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Alternative Channels Section (for re_engage stage)
// ─────────────────────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, { label: string; className: string }> = {
  fax: { label: "Fax", className: "bg-purple-50 text-purple-700" },
  direct_mail: { label: "Direct Mail", className: "bg-teal-50 text-teal-700" },
  contact_form: { label: "Contact Form", className: "bg-orange-50 text-orange-700" },
  linkedin: { label: "LinkedIn", className: "bg-blue-50 text-blue-700" },
  re_engage: { label: "Email Resend", className: "bg-gray-100 text-gray-700" },
};

function daysSince(dateString: string | null): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function ReEngageSection({
  provider,
}: {
  provider: OutreachProvider;
}) {
  const channel = provider.re_engage_channel;
  const channelInfo = channel ? CHANNEL_LABELS[channel] || { label: channel, className: "bg-gray-100 text-gray-600" } : null;
  const waitDays = daysSince(provider.re_engage_entered_at || null);

  return (
    <div>
      <SectionHeader>Alternative Channel Status</SectionHeader>

      {/* Channel and wait time */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {channelInfo && (
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${channelInfo.className}`}>
            {channelInfo.label}
          </span>
        )}
        <span className="text-sm text-gray-600">
          {waitDays === 0 ? "Added today" : waitDays === 1 ? "1 day in stage" : `${waitDays} days in stage`}
        </span>
      </div>

      {/* Channel-specific details */}
      {channel === "fax" && provider.fax_number && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Fax sent to:</span>
            <span className="font-medium text-gray-900">{provider.fax_number}</span>
          </div>
        </div>
      )}

      {channel === "direct_mail" && provider.mail_address && (
        <div className="mb-4 p-3 bg-teal-50 rounded-lg">
          <div className="text-sm">
            <span className="text-gray-500">Postcard sent to:</span>
            <p className="font-medium text-gray-900 mt-1 whitespace-pre-line">{provider.mail_address}</p>
          </div>
        </div>
      )}

      {channel === "contact_form" && provider.contact_form_url && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Form submitted:</span>
            <a
              href={provider.contact_form_url.startsWith("http") ? provider.contact_form_url : `https://${provider.contact_form_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline truncate max-w-[200px]"
            >
              {provider.contact_form_url}
            </a>
          </div>
        </div>
      )}

      {/* Warning if waiting too long */}
      {waitDays >= 30 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            No response after {waitDays} days.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions Section
// ─────────────────────────────────────────────────────────────────────────────

function ActionsSection({
  provider,
  onLaunchSequence,
  onMarkNotInterested,
  onArchive,
  onRemove,
  onMoveToReady,
  onOutcomeRecorded,
  onClose,
  activeTab,
}: {
  provider: OutreachProvider;
  onLaunchSequence?: (providerId: string) => void;
  onMarkNotInterested?: (providerId: string) => void;
  onArchive?: (providerId: string) => void;
  onRemove?: (providerId: string, providerName: string) => void;
  onMoveToReady?: (providerId: string) => void;
  onOutcomeRecorded?: (providerId: string, stageChanged: boolean) => void;
  onClose?: () => void;
  activeTab?: string;
}) {
  // Confirmation states for each action
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Resend requires call confirmation checkbox
  const [confirmedCall, setConfirmedCall] = useState(false);

  const isTerminal = ["claimed", "archived"].includes(provider.stage);
  const canLaunch = provider.stage === "not_contacted" && provider.email;
  const isFollowUp = provider.stage === "needs_call";
  const resendCount = provider.resend_count ?? 0;
  const resendDisabled = resendCount >= MAX_RESEND_COUNT;

  // Generic outcome handler for Follow Up actions
  async function handleRecordOutcome(outcome: string) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/record-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id, outcome }),
      });
      if (res.ok) {
        setActionSuccess(outcome);
        setConfirmAction(null);
        setConfirmedCall(false);
        onOutcomeRecorded?.(provider.provider_id, true);
        setTimeout(() => onClose?.(), 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed");
      }
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendClaimLink() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/send-claim-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.provider_id }),
      });
      if (res.ok) {
        setActionSuccess("claim_link");
        setConfirmAction(null);
        setTimeout(() => onClose?.(), 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to send");
      }
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMoveToReady() {
    if (!onMoveToReady) return;
    setActionLoading(true);
    try {
      await onMoveToReady(provider.provider_id);
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  }

  function cancelConfirm() {
    setConfirmAction(null);
    setConfirmedCall(false);
    setActionError(null);
  }

  // Compact button styles
  const primaryBtn = "px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const outlineBtn = "px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const plainBtn = "px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition";

  // Show success message
  if (actionSuccess) {
    const messages: Record<string, string> = {
      claim_link: "Claim link sent",
      resend_link: "Resent, moving to Alt Channels",
      try_fax: "Moved to Alt Channels (Fax)",
      try_contact_form: "Moved to Alt Channels (Contact Form)",
      try_direct_mail: "Moved to Alt Channels (Direct Mail)",
    };
    return (
      <div>
        <SectionHeader>Actions</SectionHeader>
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {messages[actionSuccess] || "Done"}
        </div>
      </div>
    );
  }

  // Show confirmation dialog
  if (confirmAction) {
    const configs: Record<string, { title: string; requiresCall?: boolean; confirmText: string }> = {
      launch: { title: "Launch email sequence for this provider?", confirmText: "Launch" },
      claim_link: { title: "Send claim link email?", confirmText: "Send" },
      resend_link: { title: "Resend claim link and move to Alt Channels?", requiresCall: true, confirmText: "Resend" },
      try_fax: { title: "Move to Alternative Channels (Fax)?", requiresCall: true, confirmText: "Move to Fax" },
      try_contact_form: { title: "Move to Alternative Channels (Contact Form)?", requiresCall: true, confirmText: "Move to Contact Form" },
      try_direct_mail: { title: "Move to Alternative Channels (Direct Mail)?", requiresCall: true, confirmText: "Move to Direct Mail" },
      move_to_ready: { title: "Move back to Call & Confirm?", confirmText: "Move" },
      not_interested: { title: "Mark as Not Interested?", confirmText: "Confirm" },
      archive: { title: "Archive this provider?", confirmText: "Archive" },
      remove: { title: `Remove ${provider.provider_name} from outreach?`, confirmText: "Remove" },
    };
    const config = configs[confirmAction];
    if (!config) return null;

    return (
      <div>
        <SectionHeader>Actions</SectionHeader>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-3">
          <p className="text-sm text-gray-700">{config.title}</p>
          {config.requiresCall && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedCall}
                onChange={(e) => setConfirmedCall(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">I called and confirmed this action</span>
            </label>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirmAction === "launch") {
                  onLaunchSequence?.(provider.provider_id);
                  onClose?.(); // Close drawer after triggering
                } else if (confirmAction === "claim_link") {
                  handleSendClaimLink();
                } else if (confirmAction === "move_to_ready") {
                  handleMoveToReady();
                } else if (confirmAction === "not_interested") {
                  onMarkNotInterested?.(provider.provider_id);
                  onClose?.();
                } else if (confirmAction === "archive") {
                  onArchive?.(provider.provider_id);
                  onClose?.();
                } else if (confirmAction === "remove") {
                  onRemove?.(provider.provider_id, provider.provider_name);
                  onClose?.();
                } else {
                  handleRecordOutcome(confirmAction);
                }
              }}
              disabled={actionLoading || (config.requiresCall && !confirmedCall)}
              className={confirmAction === "remove" ? `${outlineBtn} text-red-600 border-red-300 hover:bg-red-50` : primaryBtn}
            >
              {actionLoading ? "..." : config.confirmText}
            </button>
            <button onClick={cancelConfirm} className={plainBtn}>Cancel</button>
            {actionError && <span className="text-xs text-red-500">{actionError}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader>Actions</SectionHeader>
      <div className="flex flex-wrap items-center gap-2">
        {/* Launch Sequence - primary, only for not_contacted with email */}
        {canLaunch && onLaunchSequence && (
          <button onClick={() => setConfirmAction("launch")} className={primaryBtn}>
            Launch Sequence
          </button>
        )}

        {/* Send Claim Link - for non-follow-up active stages */}
        {!isTerminal && !isFollowUp && provider.email && (
          <button onClick={() => setConfirmAction("claim_link")} className={canLaunch ? outlineBtn : primaryBtn}>
            Send Claim Link
          </button>
        )}

        {/* Follow Up specific actions - move to alternative channels */}
        {isFollowUp && (
          <>
            {/* Resend Claim Link */}
            {provider.email && (
              <button
                onClick={() => setConfirmAction("resend_link")}
                disabled={resendDisabled}
                title={resendDisabled ? `Limit reached (${MAX_RESEND_COUNT} max)` : undefined}
                className={outlineBtn}
              >
                Resend Link{resendDisabled ? " (max)" : ""}
              </button>
            )}
            {/* Alternative channel buttons */}
            <button onClick={() => setConfirmAction("try_fax")} className={outlineBtn}>
              Fax
            </button>
            <button onClick={() => setConfirmAction("try_contact_form")} className={outlineBtn}>
              Contact Form
            </button>
            <button onClick={() => setConfirmAction("try_direct_mail")} className={outlineBtn}>
              Direct Mail
            </button>
          </>
        )}

        {/* Move to Ready - for needs_call, re_engage, or not_interested */}
        {["needs_call", "re_engage", "not_interested"].includes(provider.stage) && provider.email && onMoveToReady && (
          <button onClick={() => setConfirmAction("move_to_ready")} className={outlineBtn}>
            Move to Ready
          </button>
        )}

        {/* Mark Not Interested */}
        {!isTerminal && provider.stage !== "not_interested" && onMarkNotInterested && (
          <button onClick={() => setConfirmAction("not_interested")} className={outlineBtn}>
            Not Interested
          </button>
        )}

        {/* Archive */}
        {provider.stage !== "archived" && onArchive && (
          <button onClick={() => setConfirmAction("archive")} className={outlineBtn}>
            Archive
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Remove */}
        {activeTab !== "hidden" && onRemove && (
          <button onClick={() => setConfirmAction("remove")} className={`${plainBtn} text-red-500 hover:text-red-600`}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ProviderDrawer Component
// ─────────────────────────────────────────────────────────────────────────────

export function ProviderDrawer({
  provider,
  onClose,
  onEmailUpdate,
  onPhoneUpdate,
  onLaunchSequence,
  onMarkNotInterested,
  onArchive,
  onRemove,
  onMoveToReady,
  onResetToReadyWithApollo,
  onContactFound,
  onOutcomeRecorded,
  activeTab,
}: ProviderDrawerProps) {
  // Determine if we should show Follow Up section
  const showFollowUpSection = provider.stage === "needs_call" || activeTab === "follow_up";
  // Determine if we should show Alternative Channels section
  const showReEngageSection = provider.stage === "re_engage" || activeTab === "re_engage";
  // Header content with link to provider admin page
  const header = (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{provider.provider_name}</h2>
        {provider.slug && (
          <Link
            href={`/admin/directory/${provider.slug}`}
            className="text-gray-400 hover:text-primary-600 transition-colors"
            title="Open provider page"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500">
        {[provider.provider_category, [provider.city, provider.state].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );

  // Actions footer for sticky bottom
  const actionsFooter = (
    <ActionsSection
      provider={provider}
      onLaunchSequence={onLaunchSequence}
      onMarkNotInterested={onMarkNotInterested}
      onArchive={onArchive}
      onRemove={onRemove}
      onMoveToReady={onMoveToReady}
      onOutcomeRecorded={onOutcomeRecorded}
      onClose={onClose}
      activeTab={activeTab}
    />
  );

  return (
    <DrawerShell onClose={onClose} header={header} footer={actionsFooter}>
      <div className="py-2">
        {/* Contact Section */}
        <ContactSection
          provider={provider}
          onEmailUpdate={(email) => onEmailUpdate?.(provider.provider_id, email)}
          onPhoneUpdate={(phone) => onPhoneUpdate?.(provider.provider_id, phone)}
        />

        <SectionDivider />

        {/* Decision Maker Section */}
        <DecisionMakerSection
          provider={provider}
          onUseEmail={(email) => onEmailUpdate?.(provider.provider_id, email, "decision_maker")}
          onContactFound={(contact) => onContactFound?.(provider.provider_id, contact)}
          onResetToReadyWithApollo={
            onResetToReadyWithApollo
              ? () => onResetToReadyWithApollo(provider.provider_id)
              : undefined
          }
        />

        <SectionDivider />

        {/* Follow Up Section - only for needs_call stage */}
        {showFollowUpSection && (
          <>
            <FollowUpSection provider={provider} />
            <SectionDivider />
          </>
        )}

        {/* Alternative Channels Section - only for re_engage stage */}
        {showReEngageSection && (
          <>
            <ReEngageSection provider={provider} />
            <SectionDivider />
          </>
        )}

        {/* Notes Section */}
        <NotesSection provider={provider} />

        <SectionDivider />

        {/* Activity Section */}
        <ActivitySection provider={provider} />
      </div>
    </DrawerShell>
  );
}
