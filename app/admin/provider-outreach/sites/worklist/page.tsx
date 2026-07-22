"use client";

/**
 * Research Phase worklist.
 *
 * Two tabs:
 *   1. Mass email -- providers with verified emails, ready to send
 *   2. Call list  -- providers needing a phone call to get an email
 *
 * Call list implements the three-attempt rule:
 *   - Max 3 attempts per round, spread across different days
 *   - No same-day double calls
 *   - After 3 failed attempts -> Backlog (retry in 2 weeks)
 *   - After 2 full rounds (6 total) -> Exhausted
 *   - Outcomes: got_email, no_answer, gatekeeper, wrong_number, refused
 *
 * All call data persisted in localStorage (demo).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProviderOutreachRefresh } from "@/hooks/useProviderOutreachRefresh";
import { ProviderDrawer } from "@/components/admin/provider-outreach/ProviderDrawer";

/* ─── Types ─── */

const CALL_LOG_KEY = "provider-outreach-call-log";
const MAX_ATTEMPTS_PER_ROUND = 3;
const MAX_ROUNDS = 2;
const BACKLOG_DAYS = 14;

type CallOutcome = "got_email" | "no_answer" | "gatekeeper" | "wrong_number" | "refused";

interface CallAttempt {
  date: string; // ISO
  agent: string;
  outcome: CallOutcome;
  email?: string; // only if got_email
}

interface CallRecord {
  attempts: CallAttempt[];
  round: number; // 1 or 2
  status: "active" | "backlog" | "got_email" | "refused" | "wrong_number" | "exhausted" | "in_basket";
  backlogReturnDate?: string; // ISO date
  email?: string;
}

const OUTCOME_LABELS: Record<CallOutcome, string> = {
  got_email: "Got email",
  no_answer: "No answer / voicemail",
  gatekeeper: "Gatekeeper, could not reach decision maker",
  wrong_number: "Wrong number / disconnected",
  refused: "Refused, do not contact",
};

const OUTCOME_COLORS: Record<CallOutcome, string> = {
  got_email: "text-emerald-700 bg-emerald-50 border-emerald-200",
  no_answer: "text-amber-700 bg-amber-50 border-amber-200",
  gatekeeper: "text-blue-700 bg-blue-50 border-blue-200",
  wrong_number: "text-red-700 bg-red-50 border-red-200",
  refused: "text-red-700 bg-red-50 border-red-200",
};

/* ─── localStorage helpers ─── */

function getAllCallRecords(): Record<string, CallRecord> {
  try {
    const raw = localStorage.getItem(CALL_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getCallRecord(providerId: string): CallRecord {
  const all = getAllCallRecords();
  return all[providerId] || { attempts: [], round: 1, status: "active" };
}

function saveCallRecord(providerId: string, record: CallRecord) {
  try {
    const all = getAllCallRecords();
    all[providerId] = record;
    localStorage.setItem(CALL_LOG_KEY, JSON.stringify(all));
  } catch {}
}

function isSameDay(d1: string, d2: Date): boolean {
  const a = new Date(d1);
  return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
}

function calledToday(record: CallRecord): boolean {
  const now = new Date();
  return record.attempts.some((a) => isSameDay(a.date, now));
}

function formatAttemptTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${time}`;
}

function roundAttempts(record: CallRecord): number {
  const roundStart = (record.round - 1) * MAX_ATTEMPTS_PER_ROUND;
  return record.attempts.length - roundStart;
}

/* ─── Constants ─── */

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota",
  MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina",
  ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

interface BucketCounts {
  email_ready: number;
  call_for_email: number;
  needs_research: number;
  total: number;
}

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

type CallListView = "in_basket" | "active" | "backlog" | "exhausted" | "refused";

function getDefaultEmailContent(providerName: string): { subject: string; body: string } {
  const firstName = providerName.split(/\s+/)[0];
  return {
    subject: `What makes ${providerName} special?`,
    body: `Hi ${firstName},\n\nOlera is a free directory families use when they're looking at senior care in their area. We've already created a page for ${providerName}, and there's probably some details that need your personal touch.\n\nClaiming it is free and takes about three minutes. Once it's yours you can correct anything that's off, add photos and tell your story, and answer families when they ask you something.\n\nAnd when a family does reach out, they come straight to you. No referral fee, nothing passed along to anyone else.\n\nHave a look and let me know what you think. If you'd rather I just walk you through it, call me and I'll do it with you.\n\nGraize`,
  };
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1")) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

/* ─── Call Log Modal ─── */

function CallLogModal({ provider, onDone, onCancel }: {
  provider: ProviderRow;
  onDone: (outcome: CallOutcome, email?: string) => void;
  onCancel: () => void;
}) {
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [email, setEmail] = useState("");

  const record = getCallRecord(provider.provider_id);
  const attemptNum = roundAttempts(record) + 1;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Log call attempt</h2>
        <p className="text-sm text-gray-500 mb-1">{provider.provider_name}</p>
        <p className="text-xs text-gray-400 mb-4">
          {provider.phone ? formatPhone(provider.phone) : "No phone"} · Attempt {attemptNum} of {MAX_ATTEMPTS_PER_ROUND} (Round {record.round})
        </p>

        <div className="space-y-2 mb-4">
          {(Object.keys(OUTCOME_LABELS) as CallOutcome[]).map((key) => (
            <button
              key={key}
              onClick={() => setOutcome(key)}
              className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-all ${
                outcome === key
                  ? `${OUTCOME_COLORS[key]} border-2 font-medium`
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {OUTCOME_LABELS[key]}
            </button>
          ))}
        </div>

        {outcome === "got_email" && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="provider@example.com"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => outcome && onDone(outcome, outcome === "got_email" ? email : undefined)}
            disabled={!outcome || (outcome === "got_email" && !email.trim())}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            Log attempt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Send Email Modal ─── */

function SendEmailModal({ provider, sending, subject, body, onSubjectChange, onBodyChange, onCancel, onSend }: {
  provider: ProviderRow;
  sending: boolean;
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Send intro email</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              This is a scraped email so it might be a general inbox, but someone might answer.
            </p>
          </div>

          <div className="px-6 pb-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">To</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 bg-gray-50">
                <span className="text-sm text-gray-900">{provider.email}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">scraped</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Provider</label>
              <p className="text-sm text-gray-900">{provider.provider_name}</p>
              <p className="text-xs text-gray-500">{[provider.city, provider.provider_category].filter(Boolean).join(" · ")}</p>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Editable email body */}
          <div className="px-6 pb-4">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Email body</label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 leading-relaxed placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
            />

            {/* Signature preview (not editable) */}
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/grazie.png" alt="Graize Belandres" width={40} height={40} className="rounded-lg" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Graize Belandres</p>
                  <p className="text-[11px] text-gray-500">Assistant to Dr. Logan DuBose</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">&copy; 2026 Olera · olera.care</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 flex items-center justify-between px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function StateDashboardPage() {
  const searchParams = useSearchParams();
  const stateParam = searchParams?.get("state")?.toUpperCase() || "";
  const stateName = STATE_NAMES[stateParam] || stateParam;

  const [counts, setCounts] = useState<BucketCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const [callView, setCallView] = useState<CallListView>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [rowsTotal, setRowsTotal] = useState(0);
  const [rowsPage, setRowsPage] = useState(1);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [callProvider, setCallProvider] = useState<ProviderRow | null>(null);
  const [emailProvider, setEmailProvider] = useState<ProviderRow | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState<Set<string>>(new Set());
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Force re-render after logging a call
  const [callLogVersion, setCallLogVersion] = useState(0);

  const perPage = 50;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setRowsPage(1); }, [debouncedSearch]);

  const fetchStats = useCallback(async () => {
    if (!stateParam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/provider-outreach/providers?state=${stateParam}&counts_only=1`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [stateParam]);

  const fetchRows = useCallback(async () => {
    if (!stateParam) return;
    setRowsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("state", stateParam);
      params.set("bucket", "call_for_email");
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(rowsPage));
      params.set("per_page", String(perPage));
      const res = await fetch(`/api/admin/provider-outreach/providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setRowsTotal(data.total || 0);
      }
    } catch {
      setRows([]);
      setRowsTotal(0);
    } finally {
      setRowsLoading(false);
    }
  }, [stateParam, debouncedSearch, rowsPage]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useProviderOutreachRefresh(() => { fetchStats(); fetchRows(); });

  // Process call attempt
  function handleCallLogged(providerId: string, outcome: CallOutcome, email?: string) {
    const record = getCallRecord(providerId);

    record.attempts.push({
      date: new Date().toISOString(),
      agent: "Chantel Wright",
      outcome,
      email,
    });

    if (outcome === "got_email" && email) {
      record.status = "got_email";
      record.email = email;
    } else if (outcome === "refused") {
      record.status = "refused";
    } else if (outcome === "wrong_number") {
      record.status = "wrong_number";
    } else {
      // no_answer or gatekeeper
      const attemptsThisRound = roundAttempts(record);
      if (attemptsThisRound >= MAX_ATTEMPTS_PER_ROUND) {
        if (record.round >= MAX_ROUNDS) {
          record.status = "exhausted";
        } else {
          record.status = "backlog";
          const returnDate = new Date();
          returnDate.setDate(returnDate.getDate() + BACKLOG_DAYS);
          record.backlogReturnDate = returnDate.toISOString();
        }
      }
    }

    saveCallRecord(providerId, record);
    setCallProvider(null);
    setCallLogVersion((v) => v + 1);
  }

  // Check backlog for providers due today and promote them
  useEffect(() => {
    const all = getAllCallRecords();
    const now = new Date();
    let changed = false;
    for (const [id, rec] of Object.entries(all)) {
      if (rec.status === "backlog" && rec.backlogReturnDate && new Date(rec.backlogReturnDate) <= now) {
        rec.status = "active";
        rec.round += 1;
        delete rec.backlogReturnDate;
        all[id] = rec;
        changed = true;
      }
    }
    if (changed) {
      try { localStorage.setItem(CALL_LOG_KEY, JSON.stringify(all)); } catch {}
    }
  }, [callLogVersion]);

  // Seed demo backlog + exhausted providers from the first loaded rows
  const SEED_VERSION = "v2"; // bump to re-seed with new logic
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || rows.length < 10) return;
    const all = getAllCallRecords();
    const alreadySeeded = typeof window !== "undefined" && localStorage.getItem("po-seed-version") === SEED_VERSION;
    const hasBacklog = Object.values(all).some((r) => r.status === "backlog");
    const hasExhausted = Object.values(all).some((r) => r.status === "exhausted");
    if (alreadySeeded && hasBacklog && hasExhausted) return;
    // Clear old seeds if version changed
    if (!alreadySeeded) {
      for (const [id, rec] of Object.entries(all)) {
        if (rec.status === "backlog" || rec.status === "exhausted") delete all[id];
      }
      try { localStorage.setItem(CALL_LOG_KEY, JSON.stringify(all)); } catch {}
    }

    // Pick providers that don't already have records - mix of with/without email
    const unused = rows.filter((r) => !all[r.provider_id]);
    const withEmail = unused.filter((r) => r.email);
    const withoutEmail = unused.filter((r) => !r.email);
    if (withEmail.length < 4 && withoutEmail.length < 4) return;

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const makeAttempts = (count: number, startDaysAgo: number): CallAttempt[] =>
      Array.from({ length: count }, (_, i) => ({
        date: daysAgo(startDaysAgo - i * 3),
        agent: "Chantel Wright",
        outcome: (i % 2 === 0 ? "no_answer" : "gatekeeper") as CallOutcome,
      }));

    // Mix: 2 with email + 2 without for each bucket
    const pickMixed = (emailPool: ProviderRow[], noEmailPool: ProviderRow[], startIdx: number) => {
      const picks: ProviderRow[] = [];
      picks.push(...emailPool.slice(startIdx, startIdx + 2));
      picks.push(...noEmailPool.slice(startIdx, startIdx + 2));
      return picks;
    };

    if (!hasBacklog) {
      const picks = pickMixed(withEmail, withoutEmail, 0);
      for (let i = 0; i < picks.length; i++) {
        const p = picks[i];
        const returnDate = new Date(now.getTime() + (42 + i * 5) * 86400000);
        all[p.provider_id] = {
          attempts: makeAttempts(3, 14 + i * 2),
          round: 1,
          status: "backlog",
          backlogReturnDate: returnDate.toISOString(),
        };
      }
    }

    if (!hasExhausted) {
      const picks = pickMixed(withEmail, withoutEmail, 2);
      for (let i = 0; i < picks.length; i++) {
        const p = picks[i];
        all[p.provider_id] = {
          attempts: makeAttempts(6, 60 + i * 3),
          round: 2,
          status: "exhausted",
        };
      }
    }

    try {
      localStorage.setItem(CALL_LOG_KEY, JSON.stringify(all));
      localStorage.setItem("po-seed-version", SEED_VERSION);
    } catch {}
    seededRef.current = true;
    setCallLogVersion((v) => v + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Compute call list counts
  const allRecords = getAllCallRecords();
  const inBasketCount = Object.values(allRecords).filter((r) => r.status === "in_basket").length;
  const backlogCount = Object.values(allRecords).filter((r) => r.status === "backlog").length;
  const backlogDueCount = Object.values(allRecords).filter((r) =>
    r.status === "backlog" && r.backlogReturnDate && new Date(r.backlogReturnDate) <= new Date()
  ).length;
  const exhaustedCount = Object.values(allRecords).filter((r) => r.status === "exhausted").length;
  const refusedCount = Object.values(allRecords).filter((r) => r.status === "refused").length;

  // Filter call list rows based on view
  function filterCallRows(allRows: ProviderRow[]): ProviderRow[] {
    return allRows.filter((row) => {
      const rec = allRecords[row.provider_id];
      if (!rec) return callView === "active"; // no record = active
      if (rec.status === "in_basket" && callView !== "in_basket") return false;

      switch (callView) {
        case "in_basket":
          return rec.status === "in_basket";
        case "active":
          return rec.status === "active" && !calledToday(rec);
        case "backlog":
          return rec.status === "backlog";
        case "exhausted":
          return rec.status === "exhausted";
        case "refused":
          return rec.status === "refused";
        default:
          return true;
      }
    });
  }

  const displayRows = filterCallRows(rows);
  const totalPages = Math.ceil(rowsTotal / perPage);

  if (loading && !counts) {
    return <p className="py-12 text-center text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <Link href="/admin/provider-outreach/sites" className="text-gray-400 hover:text-gray-700 transition-colors">
          Cities
        </Link>
        <span className="text-gray-300">&rsaquo;</span>
        <span className="text-gray-500">{stateName}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Research Phase</h1>
        <p className="text-sm text-gray-500">
          Call providers to get the right and accurate email. {(counts?.call_for_email ?? 0).toLocaleString()} providers need calling in {stateName}.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Call list sub-tabs */}
      <div className="flex items-center gap-5 border-b border-gray-200 mb-0">
        {([
          { key: "in_basket" as CallListView, label: "In Basket", count: inBasketCount },
          { key: "active" as CallListView, label: "Active", count: counts?.call_for_email },
          { key: "backlog" as CallListView, label: "Backlog", count: backlogCount, badge: backlogDueCount > 0 ? `${backlogDueCount} due` : undefined },
          { key: "exhausted" as CallListView, label: "Exhausted", count: exhaustedCount },
          { key: "refused" as CallListView, label: "Do not contact", count: refusedCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCallView(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              callView === tab.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 tabular-nums text-gray-400">{tab.count}</span>
            )}
            {tab.badge && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Provider list */}
      <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white mt-0">
        {rowsLoading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
        ) : displayRows.length === 0 ? (
          <div className="py-12 text-center px-6">
            {debouncedSearch ? (
              <p className="text-sm text-gray-500">No providers match your search.</p>
            ) : callView === "in_basket" ? (
              <p className="text-sm text-gray-500">No providers in the In Basket yet.</p>
            ) : callView === "backlog" ? (
              <>
                <p className="text-sm font-medium text-gray-700">No providers in backlog</p>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                  Providers move here after 3 call attempts with no contact. They return to the active list automatically after 2 months for another round.
                </p>
              </>
            ) : callView === "exhausted" ? (
              <>
                <p className="text-sm font-medium text-gray-700">No exhausted providers</p>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                  Providers land here after completing both call rounds with no contact. Consider sending them a physical flyer as a last-touch effort.
                </p>
              </>
            ) : callView === "refused" ? (
              <>
                <p className="text-sm font-medium text-gray-700">No providers on the do-not-contact list</p>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                  These providers have asked to have their page removed. Do not contact them again.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">All caught up. No providers to call right now.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayRows.map((row) => {
              const record = getCallRecord(row.provider_id);
              const attemptsThisRound = roundAttempts(record);
              const totalAttempts = record.attempts.length;
              const lastAttempt = record.attempts.length > 0 ? record.attempts[record.attempts.length - 1] : null;
              const isCalledToday = calledToday(record);

              return (
                <div
                  key={row.provider_id}
                  className={`px-5 py-4 transition-colors ${
                    isCalledToday && callView === "active"
                      ? "bg-gray-50/50 opacity-60"
                      : "hover:bg-gray-50 cursor-pointer"
                  }`}
                  onClick={() => !isCalledToday && setSelectedProvider(row)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {row.provider_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {[row.city, row.provider_category].filter(Boolean).join(" · ") || "--"}
                      </p>
                      {lastAttempt ? (
                        <p className="text-[11px] text-gray-300 mt-0.5">
                          Last active {new Date(lastAttempt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-300 mt-0.5">No activity yet</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Phone number */}
                      {row.phone && (
                        <span className="text-sm tabular-nums text-gray-600">{formatPhone(row.phone)}</span>
                      )}

                      {/* Call button */}
                      {callView === "active" && row.phone && !isCalledToday && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setCallProvider(row); }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          Call
                        </button>
                      )}

                      {/* In Basket badge */}
                      {callView === "in_basket" && (
                        <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                          Moved to In Basket
                        </span>
                      )}

                      {/* Called today badge */}
                      {callView === "active" && isCalledToday && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400">
                          Called today
                        </span>
                      )}

                      {/* Backlog return date + email status */}
                      {callView === "backlog" && (
                        <>
                          {record.backlogReturnDate && (
                            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              new Date(record.backlogReturnDate) <= new Date()
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-gray-200 bg-gray-50 text-gray-500"
                            }`}>
                              {new Date(record.backlogReturnDate) <= new Date()
                                ? "Ready to retry"
                                : `Returns ${new Date(record.backlogReturnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                              }
                            </span>
                          )}
                          {row.email ? (
                            emailSent.has(row.provider_id) ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                Email sent
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); const defaults = getDefaultEmailContent(row.provider_name); setEmailSubject(defaults.subject); setEmailBody(defaults.body); setEmailProvider(row); }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Email on file
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">No email</span>
                          )}
                        </>
                      )}

                      {/* Exhausted badge + email status */}
                      {callView === "exhausted" && (
                        <>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400">
                            {totalAttempts} attempts, no contact
                          </span>
                          {row.email ? (
                            emailSent.has(row.provider_id) ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                Email sent
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); const defaults = getDefaultEmailContent(row.provider_name); setEmailSubject(defaults.subject); setEmailBody(defaults.body); setEmailProvider(row); }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Email on file
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">No email</span>
                          )}
                        </>
                      )}

                      {/* Refused badge */}
                      {callView === "refused" && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          Do not contact
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attempt info (visible in the row for all agents) */}
                  {totalAttempts > 0 && (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-medium text-gray-500">
                        Attempt {attemptsThisRound} of {MAX_ATTEMPTS_PER_ROUND}
                        {record.round > 1 && ` (Round ${record.round})`}
                      </span>
                      {lastAttempt && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-[11px] text-gray-400">
                            Last tried {formatAttemptTime(lastAttempt.date)}
                          </span>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${OUTCOME_COLORS[lastAttempt.outcome]}`}>
                            {OUTCOME_LABELS[lastAttempt.outcome]}
                          </span>
                        </>
                      )}
                      {lastAttempt && (
                        <span className="text-[11px] text-gray-400">
                          by {lastAttempt.agent.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-gray-400 tabular-nums">Page {rowsPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setRowsPage((p) => Math.max(1, p - 1))}
                disabled={rowsPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setRowsPage((p) => Math.min(totalPages, p + 1))}
                disabled={rowsPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Provider detail drawer */}
      {selectedProvider && (
        <ProviderDrawer
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}

      {/* Call log modal */}
      {callProvider && (
        <CallLogModal
          provider={callProvider}
          onDone={(outcome, email) => handleCallLogged(callProvider.provider_id, outcome, email)}
          onCancel={() => setCallProvider(null)}
        />
      )}

      {/* Send first email modal (backlog/exhausted) */}
      {emailProvider && (
        <SendEmailModal
          provider={emailProvider}
          sending={emailSending}
          subject={emailSubject}
          body={emailBody}
          onSubjectChange={setEmailSubject}
          onBodyChange={setEmailBody}
          onCancel={() => setEmailProvider(null)}
          onSend={async () => {
            setEmailSending(true);
            try {
              await fetch("/api/admin/provider-outreach/send-first-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  provider_id: emailProvider.provider_id,
                  provider_name: emailProvider.provider_name,
                  to: emailProvider.email,
                  subject: emailSubject,
                  body: emailBody,
                }),
              });
            } catch {}
            setEmailSent((prev) => new Set(prev).add(emailProvider.provider_id));
            setEmailSending(false);
            setEmailProvider(null);
          }}
        />
      )}
    </div>
  );
}
