"use client";

/**
 * Provider detail drawer for Provider Outreach.
 *
 * Top: Priority / Agent / Stage dropdowns
 * Contact cards with expandable email send area.
 * Email preview template below.
 */

import { useEffect, useRef, useState } from "react";
import { DrawerShell } from "@/components/admin/medjobs/DrawerShell";
import { LogCallModal, type CallLog } from "@/components/admin/provider-outreach/LogCallModal";

const PROVIDER_META_KEY = "provider-outreach-meta";
const CALL_LOG_KEY = "provider-outreach-call-logs";

function getCallLogs(providerId: string): CallLog[] {
  try {
    const raw = localStorage.getItem(CALL_LOG_KEY);
    const all: CallLog[] = raw ? JSON.parse(raw) : [];
    return all.filter((l) => l.providerId === providerId);
  } catch { return []; }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const OUTCOME_LABELS: Record<string, { icon: string; text: string }> = {
  confirmed: { icon: "\u260E", text: "Reached on the phone." },
  meeting_booked: { icon: "\uD83D\uDCC5", text: "Meeting booked." },
  no_answer: { icon: "\uD83D\uDCDE", text: "Called - no answer. Row reappears on the next phone day." },
  voicemail: { icon: "\uD83D\uDCDE", text: "Called - left voicemail. Row reappears on the next phone day." },
  not_interested: { icon: "\u2716", text: "Not interested. Remaining outreach cancelled." },
  claimed: { icon: "\u2705", text: "They claimed their profile." },
  interested_following_up: { icon: "\uD83D\uDD04", text: "Interested, following up." },
  couldnt_reach: { icon: "\uD83D\uDCDE", text: "Couldn't reach them. Try again tomorrow." },
};

interface ProviderRow {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  slug?: string | null;
  google_rating?: number | null;
  status: string;
}

interface ProviderDrawerProps {
  provider: ProviderRow;
  onClose: () => void;
  /** Optional engagement signals to display in the activity section (e.g. from leads). */
  engagement?: string[];
  /** "lead" hides the stage dropdown and uses lead-specific call outcomes. */
  variant?: "default" | "lead";
}

interface DecisionMaker {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface ProviderMeta {
  priority: string;
  agent: string;
  stage: string;
  notes: string;
  decisionMakers?: DecisionMaker[];
  research?: {
    businessName?: string;
    phone?: string;
    email?: string;
    address?: string;
    fax?: string;
    contactForm?: string;
    sourceUrl?: string;
  };
}

const AGENTS = ["Chantel Wright", "Unassigned"];

const STAGES = [
  { value: "active", label: "Active" },
  { value: "backlog", label: "Backlog" },
  { value: "exhausted", label: "Exhausted" },
  { value: "do_not_contact", label: "Do not contact" },
];

function getProviderMeta(providerId: string): ProviderMeta {
  try {
    const raw = localStorage.getItem(PROVIDER_META_KEY);
    const all: Record<string, ProviderMeta> = raw ? JSON.parse(raw) : {};
    return all[providerId] || { priority: "medium", agent: "Chantel Wright", stage: "active", notes: "" };
  } catch {
    return { priority: "medium", agent: "Chantel Wright", stage: "active", notes: "" };
  }
}

function saveProviderMeta(providerId: string, meta: ProviderMeta) {
  try {
    const raw = localStorage.getItem(PROVIDER_META_KEY);
    const all: Record<string, ProviderMeta> = raw ? JSON.parse(raw) : {};
    all[providerId] = meta;
    localStorage.setItem(PROVIDER_META_KEY, JSON.stringify(all));
  } catch {}
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1")) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

/* ── Dropdown component ── */
function InlineDropdown({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string; dotColor?: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {icon}
        {current?.dotColor && (
          <span className={`inline-block h-2 w-2 rounded-sm ${current.dotColor}`} />
        )}
        <span className="font-medium">{current?.label || value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                o.value === value ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {o.dotColor && <span className={`inline-block h-2.5 w-2.5 rounded-sm ${o.dotColor}`} />}
                {o.label}
              </span>
              {o.value === value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-primary-600">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProviderDrawer({ provider, onClose, engagement, variant = "default" }: ProviderDrawerProps) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailValue, setEmailValue] = useState(provider.email || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Provider meta (priority, agent, stage)
  const [meta, setMeta] = useState<ProviderMeta>(() => getProviderMeta(provider.provider_id));
  const [showLogCall, setShowLogCall] = useState(false);

  // Decision makers
  const [showAddDM, setShowAddDM] = useState(false);
  const [dmName, setDmName] = useState("");
  const [dmRole, setDmRole] = useState("");
  const [dmEmail, setDmEmail] = useState("");

  function addDecisionMaker() {
    if (!dmName.trim()) return;
    const dm: DecisionMaker = {
      id: crypto.randomUUID(),
      name: dmName.trim(),
      role: dmRole.trim(),
      email: dmEmail.trim(),
    };
    const updated = { ...meta, decisionMakers: [...(meta.decisionMakers || []), dm] };
    setMeta(updated);
    saveProviderMeta(provider.provider_id, updated);
    setDmName("");
    setDmRole("");
    setDmEmail("");
    setShowAddDM(false);
  }

  function removeDecisionMaker(id: string) {
    const updated = { ...meta, decisionMakers: (meta.decisionMakers || []).filter((d) => d.id !== id) };
    setMeta(updated);
    saveProviderMeta(provider.provider_id, updated);
  }

  // Collapsible sections
  const [researchOpen, setResearchOpen] = useState(true);

  // Activity log
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => getCallLogs(provider.provider_id));
  const callCount = callLogs.length;
  const lastOutcome = callLogs.length > 0 ? callLogs[0].outcome : null;

  function refreshCallLogs() {
    setCallLogs(getCallLogs(provider.provider_id));
  }

  function getNextStep(): string {
    if (callCount === 0) return "First call needed";
    if (lastOutcome === "confirmed" || lastOutcome === "meeting_booked") return "Send follow-up email";
    if (lastOutcome === "not_interested") return "Closed";
    if (lastOutcome === "no_answer" || lastOutcome === "voicemail") return `Call ${callCount + 1} needed`;
    return `Call ${callCount + 1} needed`;
  }

  // Enrichment state
  const [enriching, setEnriching] = useState<"phone" | "email" | "all" | null>(null);
  const [foundPhone, setFoundPhone] = useState<string | null>(null);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  async function enrich(mode: "phone" | "email" | "all") {
    setEnriching(mode);
    setEnrichError(null);
    try {
      const res = await fetch("/api/admin/provider-outreach/enrich-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.provider_id, mode }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      if (mode === "all") {
        if (data.phone?.value) setFoundPhone(data.phone.value);
        if (data.email?.value) {
          setFoundEmail(data.email.value);
          setEmailValue(data.email.value);
        }
        if (!data.phone?.value && !data.email?.value) setEnrichError("No contact info found");
      } else if (mode === "phone") {
        if (data.value) setFoundPhone(data.value);
        else setEnrichError("No phone found");
      } else if (mode === "email") {
        if (data.value) {
          setFoundEmail(data.value);
          setEmailValue(data.value);
        } else setEnrichError("No email found");
      }
    } catch {
      setEnrichError("Lookup failed");
    } finally {
      setEnriching(null);
    }
  }

  const displayPhone = foundPhone || (provider.phone ? formatPhone(provider.phone) : null);
  const displayEmail = foundEmail || provider.email;

  // Inline editing for contact cards
  const [editingPhone, setEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState(provider.phone || "");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editEmailVal, setEditEmailVal] = useState(provider.email || "");
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editWebsiteValue, setEditWebsiteValue] = useState(provider.website || "");
  const [researchSaved, setResearchSaved] = useState(false);

  function updateMeta(field: keyof ProviderMeta, value: string | ProviderMeta["research"]) {
    const updated = { ...meta, [field]: value };
    setMeta(updated);
    saveProviderMeta(provider.provider_id, updated);
  }

  function saveEmailToMeta(email: string) {
    const r = { ...(meta.research || {}), email: email.trim() };
    const updated = { ...meta, research: r };
    setMeta(updated);
    saveProviderMeta(provider.provider_id, updated);
  }

  function savePhoneToMeta(phone: string) {
    const r = { ...(meta.research || {}), phone: phone.trim() };
    const updated = { ...meta, research: r };
    setMeta(updated);
    saveProviderMeta(provider.provider_id, updated);
  }

  async function handleSend() {
    if (!emailValue) return;
    setSending(true);
    try {
      await fetch("/api/admin/provider-outreach/send-first-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          email: emailValue,
          provider_category: provider.provider_category,
          city: provider.city,
          state: provider.state,
        }),
      });
      setSent(true);
      setEmailExpanded(false);
    } catch {
      // fail silently for now
    } finally {
      setSending(false);
    }
  }

  const header = (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 leading-tight">
        {provider.provider_name}
      </h2>
      <p className="mt-0.5 text-sm text-gray-500">
        {[provider.provider_category, location].filter(Boolean).join(" · ")}
      </p>
    </div>
  );

  return (
    <>
    <DrawerShell onClose={onClose} header={header}>
      {/* Status controls */}
      <section className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <InlineDropdown
            label="Agent"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            value={meta.agent}
            options={AGENTS.map((a) => ({ value: a, label: a }))}
            onChange={(v) => updateMeta("agent", v)}
          />
          {variant !== "lead" && (
            <InlineDropdown
              label="Stage"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              value={meta.stage}
              options={STAGES}
              onChange={(v) => updateMeta("stage", v)}
            />
          )}
        </div>
      </section>

      {/* Call status + next step */}
      <section className="mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {callCount === 0 ? "No calls yet" : `Call ${callCount}`}
            </p>
            <p className="text-xs text-gray-400">{getNextStep()}</p>
          </div>
          {callCount > 0 && lastOutcome && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              lastOutcome === "confirmed" || lastOutcome === "meeting_booked"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : lastOutcome === "not_interested"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {lastOutcome === "confirmed" ? "Spoke" : lastOutcome === "meeting_booked" ? "Meeting" : lastOutcome === "no_answer" ? "No answer" : lastOutcome === "voicemail" ? "Voicemail" : "Not interested"}
            </span>
          )}
        </div>
      </section>

      {/* Contact cards */}
      <section className="mb-6">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">Contact</h3>
        <div className="space-y-3">

          {/* Phone */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              {editingPhone ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={editPhoneValue}
                      onChange={(e) => setEditPhoneValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { setEditingPhone(false); savePhoneToMeta(editPhoneValue); } }}
                      autoFocus
                      placeholder="Enter phone number"
                      className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-b border-primary-300"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">Phone</p>
                  </div>
                  <button
                    onClick={() => { setEditingPhone(false); savePhoneToMeta(editPhoneValue); }}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors shrink-0"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => { setEditPhoneValue(displayPhone || provider.phone || ""); setEditingPhone(true); }}>
                  <p className="text-sm font-medium text-gray-900">
                    {displayPhone || "No phone on file"}
                  </p>
                  <p className="text-xs text-gray-400">Phone{foundPhone && !provider.phone ? " · found via scrape" : ""} · click to edit</p>
                </div>
              )}
            </div>
            {displayPhone || editPhoneValue ? (
              <button onClick={() => setShowLogCall(true)} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors shrink-0 ml-2">
                Log call
              </button>
            ) : (
              <button
                onClick={() => enrich("phone")}
                disabled={enriching !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50 shrink-0 ml-2"
              >
                {enriching === "phone" ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
                Find phone
              </button>
            )}
          </div>

          {/* Email row */}
          {!sent && (
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                  emailExpanded
                    ? "border-primary-300 bg-primary-50/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors shrink-0 ${
                    emailExpanded ? "bg-primary-100" : "bg-gray-100"
                  }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={emailExpanded ? "text-primary-600" : "text-gray-600"}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                    </svg>
                  </div>
                  {editingEmail ? (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={editEmailVal}
                          onChange={(e) => { setEditEmailVal(e.target.value); setEmailValue(e.target.value); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { setEditingEmail(false); saveEmailToMeta(editEmailVal); } }}
                          autoFocus
                          placeholder="Enter email address"
                          className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-b border-primary-300"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">Email</p>
                      </div>
                      <button
                        onClick={() => { setEditingEmail(false); saveEmailToMeta(editEmailVal); }}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="cursor-pointer flex-1 min-w-0" onClick={() => { setEditEmailVal(displayEmail || ""); setEditingEmail(true); }}>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayEmail || "No email on file"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {displayEmail ? "Click to edit" : "Click to add an email"}
                      </p>
                    </div>
                  )}
                </div>
                {!editingEmail && (
                  <button
                    onClick={() => setEmailExpanded(!emailExpanded)}
                    className="shrink-0 ml-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${emailExpanded ? "rotate-90 text-primary-500" : "text-gray-300"}`}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>
              {!displayEmail && !editEmailVal && (
                <button
                  onClick={() => enrich("email")}
                  disabled={enriching !== null}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                >
                  {enriching === "email" ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                  Find email
                </button>
              )}
            </div>
          )}

          {/* Sent confirmation (replaces email row after send) */}
          {sent && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">Sent to {emailValue}</p>
                  <p className="text-xs text-emerald-600/70">Moved to In Basket. Tracking clicks and replies.</p>
                </div>
              </div>
            </div>
          )}

          {/* Website */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              {editingWebsite ? (
                <div className="flex-1">
                  <input
                    type="text"
                    value={editWebsiteValue}
                    onChange={(e) => setEditWebsiteValue(e.target.value)}
                    onBlur={() => setEditingWebsite(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") setEditingWebsite(false); }}
                    autoFocus
                    placeholder="Enter website URL"
                    className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-b border-primary-300"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Website</p>
                </div>
              ) : (
                <div className="min-w-0 cursor-pointer" onClick={() => { setEditWebsiteValue(provider.website || ""); setEditingWebsite(true); }}>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {(editWebsiteValue || provider.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "") || "No website on file"}
                  </p>
                  <p className="text-xs text-gray-400">Website · click to edit</p>
                </div>
              )}
            </div>
            {(editWebsiteValue || provider.website) && (
              <a
                href={(editWebsiteValue || provider.website || "").startsWith("http") ? (editWebsiteValue || provider.website || "") : `https://${editWebsiteValue || provider.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0 ml-2"
              >
                Visit
              </a>
            )}
          </div>
          {/* Olera page */}
          {provider.slug && (
            <a
              href={`/provider/${provider.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700">View public provider page</p>
                  <p className="text-xs text-gray-400">Olera listing</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          )}

          {/* Find all button when both missing */}
          {!displayPhone && !displayEmail && (
            <button
              onClick={() => enrich("all")}
              disabled={enriching !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
            >
              {enriching === "all" ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              {enriching === "all" ? "Searching..." : "Find phone and email"}
            </button>
          )}

          {/* Enrich error */}
          {enrichError && (
            <p className="text-xs text-red-500 text-center">{enrichError}</p>
          )}
        </div>
      </section>

      {/* Engagement signals (from leads / tracking) */}
      {engagement && engagement.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Engagement</h3>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
              {engagement.length} {engagement.length === 1 ? "signal" : "signals"}
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
            {engagement.map((e, i) => {
              const isReply = /replied|respond/i.test(e);
              const isClick = /click/i.test(e);
              const isOpen = /open/i.test(e);
              const isPaused = /paused/i.test(e);
              const icon = isReply ? "\u{1F4AC}" : isClick ? "\u{1F517}" : isOpen ? "\u{1F4E8}" : isPaused ? "\u23F8\uFE0F" : "\u{1F4CB}";
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-base mt-0.5 shrink-0 w-6 text-center">{icon}</span>
                  <p className="text-sm text-gray-900 flex-1">{e}</p>
                </div>
              );
            })}
          </div>
          {/* Next step recommendation */}
          <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/50 px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-800">Recommended: Call this provider</p>
              <p className="text-xs text-primary-600/70 mt-0.5">They engaged with the sequence. A call now has the highest chance of conversion.</p>
            </div>
          </div>
        </section>
      )}

      {/* Past Activity */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Past Activity</h3>
          {callCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
              {callCount} {callCount === 1 ? "call" : "calls"} made
            </span>
          )}
        </div>
        {callLogs.length === 0 && (!engagement || engagement.length === 0) ? (
          <p className="text-sm text-gray-300">No activity yet</p>
        ) : callLogs.length === 0 ? (
          <p className="text-sm text-gray-300">No calls yet</p>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {callLogs.map((log, i) => {
              const info = OUTCOME_LABELS[log.outcome] || { icon: "\u260E", text: "Call logged." };
              return (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="text-base mt-0.5 shrink-0 w-6 text-center">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{info.text}</p>
                    {log.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5">{log.notes}</p>
                    )}
                    {log.followUpEmail && (
                      <p className="text-xs text-primary-600 mt-0.5">Follow-up email sent: {log.followUpEmail.subject}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-gray-400">{timeAgo(log.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Research section (collapsible) */}
      <section className="mb-6">
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => setResearchOpen(!researchOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Research</h3>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              className={`text-gray-400 transition-transform ${researchOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {researchOpen && (
          <div className="px-5 pb-5">

          {/* Business Name */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-900 mb-1.5 block">Business Name</label>
            <input
              type="text"
              value={meta.research?.businessName ?? provider.provider_name}
              onChange={(e) => updateMeta("research", { ...(meta.research || {}), businessName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* General Contact */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">General Contact</h4>
            {provider.website && (
              <a
                href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                source
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            )}
          </div>

          <div className="space-y-2.5">
            {([
              { label: "PHONE", field: "phone" as const, fallback: "Not on file", defaultValue: displayPhone || provider.phone || "" },
              { label: "EMAIL", field: "email" as const, fallback: "Not on file", defaultValue: displayEmail || provider.email || "" },
              { label: "ADDRESS", field: "address" as const, fallback: "Not on file", defaultValue: "" },
              { label: "FAX", field: "fax" as const, fallback: "Not on file", defaultValue: "" },
              { label: "CONTACT FORM", field: "contactForm" as const, fallback: "Not on file", defaultValue: "" },
            ]).map((row) => {
              const val = meta.research?.[row.field] ?? row.defaultValue;
              return (
                <div key={row.label} className="flex items-start gap-3">
                  {val ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="inline-block w-4 h-4 mt-0.5 shrink-0 border-b-2 border-gray-300" />
                  )}
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 w-[80px] shrink-0 mt-0.5">{row.label}</span>
                  <input
                    type="text"
                    value={val || ""}
                    onChange={(e) => {
                      const r = { ...(meta.research || {}), [row.field]: e.target.value };
                      const updated = { ...meta, research: r };
                      setMeta(updated);
                      saveProviderMeta(provider.provider_id, updated);
                    }}
                    placeholder={row.fallback}
                    className="flex-1 text-sm text-gray-900 placeholder:text-gray-300 bg-transparent outline-none rounded-lg border border-gray-200 px-3 py-1.5 hover:border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                  />
                </div>
              );
            })}
          </div>

          {/* Save research button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                saveProviderMeta(provider.provider_id, meta);
                setResearchSaved(true);
                setTimeout(() => setResearchSaved(false), 2000);
              }}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
            >
              {researchSaved ? "Saved!" : "Save"}
            </button>
          </div>
          </div>
          )}
        </div>
      </section>

      {/* Decision Makers */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Decision Makers ({(meta.decisionMakers || []).length})
          </h3>
          <button
            onClick={() => setShowAddDM(!showAddDM)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            + Add decision maker
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          People at this agency. Anyone with an email becomes a selectable recipient at launch, alongside the general contact.
        </p>

        {/* Add form */}
        {showAddDM && (
          <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-4 mb-3 space-y-2.5">
            <input
              type="text"
              value={dmName}
              onChange={(e) => setDmName(e.target.value)}
              placeholder="Name"
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="text"
              value={dmRole}
              onChange={(e) => setDmRole(e.target.value)}
              placeholder="Role (e.g. Administrator, Owner)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="email"
              value={dmEmail}
              onChange={(e) => setDmEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={addDecisionMaker}
                disabled={!dmName.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddDM(false); setDmName(""); setDmRole(""); setDmEmail(""); }}
                className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Decision maker list */}
        <div className="space-y-2">
          {(meta.decisionMakers || []).map((dm) => (
            <div key={dm.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{dm.name}</span>
                {dm.role && <span className="text-gray-400"> · {dm.role}</span>}
                {dm.email && <span className="text-gray-400"> · {dm.email}</span>}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {dm.email && (
                  <span className="text-xs text-gray-400">emailable</span>
                )}
                <button
                  onClick={() => removeDecisionMaker(dm.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Send first email area (expanded below contact cards) ── */}
      {emailExpanded && !sent && (
        <section className="mb-6">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">
            Send first email
          </h3>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Verify email address
            </label>
            <input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              autoFocus
              placeholder="Enter email address..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white mb-4"
            />

            <p className="text-xs text-gray-400 mb-4">
              This sends the first outreach email and moves the provider to In Basket.
              They will be scored as hot, warm, or cold based on clicks and replies.
            </p>

            {/* Email preview */}
            <div className="rounded-lg border border-gray-200 bg-white mb-4 overflow-hidden">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-5 pt-4 pb-2">Email Preview</p>
              <div className="px-5 pb-5">
                <p className="text-sm font-semibold text-primary-700 mb-3">Olera</p>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Welcome to Olera</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Hi {provider.provider_name.split(/\s+/)[0]}, you&apos;re all set up and ready to connect with families looking for care from <span className="font-semibold">{provider.provider_name}</span>.
                </p>

                <p className="text-sm font-semibold text-gray-900 mb-2">Here&apos;s what happens next:</p>
                <ul className="text-sm text-gray-700 leading-relaxed space-y-1.5 mb-4 list-disc pl-5">
                  <li>Families browsing Olera will find your listing and can reach out directly</li>
                  <li>You&apos;ll get an email notification for each new inquiry</li>
                  <li>Respond promptly, families appreciate timely replies</li>
                </ul>

                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Your profile is 58% complete. Providers with complete profiles get more inquiries from families.
                </p>

                <div className="mb-4">
                  <span className="inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white">
                    View Your Dashboard
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  Want to stand out? <span className="text-primary-700 underline">Complete your profile</span> to attract more families.
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Questions? <span className="underline">Contact us</span> &mdash; we&apos;re here to help you succeed.
                </p>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400">&copy; 2026 Olera &middot; olera.care</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSend}
                disabled={!emailValue || sending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send first email"}
              </button>
              <button
                onClick={() => { setEmailExpanded(false); setEmailValue(provider.email || ""); }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Research Notes */}
      <section className="mb-6">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">Research Notes</h3>
        <textarea
          value={meta.notes}
          onChange={(e) => updateMeta("notes", e.target.value)}
          placeholder="Source of contact info, agency character, hiring activity, anything else worth remembering."
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </section>

    </DrawerShell>

      {showLogCall && (
        <LogCallModal
          providerName={provider.provider_name}
          providerLocation={[provider.city, provider.state].filter(Boolean).join(", ")}
          providerId={provider.provider_id}
          onLog={() => { setShowLogCall(false); refreshCallLogs(); }}
          onCancel={() => setShowLogCall(false)}
          variant={variant}
          context={variant === "lead" && engagement?.length ? engagement[0] : undefined}
          providerEmail={displayEmail || provider.email}
        />
      )}
    </>
  );
}
