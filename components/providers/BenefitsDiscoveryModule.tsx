"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  House,
  Coin,
  Brain,
  HandHeart,
  Spinner,
} from "@phosphor-icons/react";

/** Minimal program shape passed from server — keeps client bundle small */
export interface BenefitsProgram {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  savingsRange?: string;
  programType?: string;
  structuredEligibility?: {
    ageRequirement?: string;
    incomeTable?: Array<{ householdSize: number; monthlyLimit: number }>;
  };
}

interface BenefitsDiscoveryModuleProps {
  providerState: string; // 2-letter abbreviation (e.g., "TX")
  stateId: string;       // slug (e.g., "texas")
  stateName: string;
  topPrograms: BenefitsProgram[];
  allPrograms: BenefitsProgram[];
  providerName?: string;
  providerSlug?: string;
}

// ─── URL helpers ─────────────────────────────────────────────────────────
function benefitsUrl(stateId: string): string {
  return `/benefits/${stateId}`;
}

function programUrl(stateId: string, programId: string): string {
  return `/benefits/${stateId}/${programId}`;
}

// ─── Savings helpers ─────────────────────────────────────────────────────
function extractTopSavings(savingsRange?: string): string | null {
  if (!savingsRange) return null;
  const matches = savingsRange.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

function shortSavings(savingsRange?: string): string | null {
  const top = extractTopSavings(savingsRange);
  if (!top) return null;
  return `Up to ${top}/yr`;
}

function plainDescription(tagline?: string): string | null {
  if (!tagline) return null;
  return tagline.split(/\.\s|,\s(?![0-9])/)[0];
}

// ─── Care need categories ────────────────────────────────────────────────
type CareNeed = "stayingAtHome" | "payingForCare" | "memoryHealth" | "companionship";

const CARE_NEED_OPTIONS: Array<{
  value: CareNeed;
  label: string;
  description: string;
  icon: typeof House;
}> = [
  { value: "stayingAtHome", label: "Staying at home", description: "Personal care, daily tasks, mobility help", icon: House },
  { value: "payingForCare", label: "Paying for care", description: "Medicare, financial assistance, cash help", icon: Coin },
  { value: "memoryHealth", label: "Memory & health care", description: "Dementia care, medical support", icon: Brain },
  { value: "companionship", label: "Companionship & support", description: "Social activities, caregiver support", icon: HandHeart },
];

// ─── Care need keyword matching ──────────────────────────────────────────
function matchesCareNeed(program: BenefitsProgram, careNeed: CareNeed | null): boolean {
  if (!careNeed) return true;
  const text = `${program.name} ${program.shortName} ${program.tagline || ""}`.toLowerCase();
  switch (careNeed) {
    case "stayingAtHome":
      return /\b(home care|home.based|hcbs|community.based|in.home|attendant|adult day|waiver|personal care|daily|stay home)\b/.test(text);
    case "payingForCare":
      return /\b(medicare savings|financial|cash|premium|snap|food|ssi|pension|assistance|qmb|slmb|pharmac|low.income|groceries|pay)\b/.test(text);
    case "memoryHealth":
      return /\b(memory|alzheimer|dementia|medical|health|pace|medicaid|nursing|hospice|prescription)\b/.test(text);
    case "companionship":
      return /\b(companion|support|caregiver|respite|social)\b/.test(text);
    default:
      return true;
  }
}

// ─── Income bracket matching ─────────────────────────────────────────────
type IncomeRange = "under1500" | "under2500" | "under4000" | "over4000" | "preferNotToSay";

const INCOME_MAX: Record<IncomeRange, number | null> = {
  under1500: 1500,
  under2500: 2500,
  under4000: 4000,
  over4000: Infinity,
  preferNotToSay: null,
};

function matchesIncome(program: BenefitsProgram, incomeRange: IncomeRange | ""): boolean {
  if (!incomeRange || incomeRange === "preferNotToSay") return true;
  const max = INCOME_MAX[incomeRange as IncomeRange];
  if (max === null || max === Infinity) return true;
  const row1 = program.structuredEligibility?.incomeTable?.[0];
  if (!row1?.monthlyLimit) return true; // No income limit data → include (don't exclude programs we can't evaluate)
  // Include if program's limit is at or above user's income (they qualify)
  return row1.monthlyLimit >= max;
}

// ─── Screener filter ─────────────────────────────────────────────────────
type MedicaidStatus = "alreadyHas" | "doesNotHave" | "notSure" | "";

function filterPrograms(
  programs: BenefitsProgram[],
  careNeed: CareNeed | null,
  age: string,
  medicaid: MedicaidStatus,
  incomeRange: IncomeRange | "",
): BenefitsProgram[] {
  return programs.filter((p) => {
    // Care need filter
    if (careNeed && !matchesCareNeed(p, careNeed)) return false;

    // Age filter
    const ageNum = parseInt(age);
    if (ageNum && p.structuredEligibility?.ageRequirement) {
      const ageReq = parseInt(p.structuredEligibility.ageRequirement);
      if (ageReq && ageNum < ageReq) return false;
    }

    // Medicaid filter — if "doesNotHave", exclude Medicaid-dependent programs
    if (medicaid === "doesNotHave") {
      const nameAndTag = `${p.name} ${p.tagline || ""}`.toLowerCase();
      if (nameAndTag.includes("medicaid") && !nameAndTag.includes("savings")) return false;
    }

    // Income filter
    if (!matchesIncome(p, incomeRange)) return false;

    // Resources/navigators always included
    if (p.programType === "resource" || p.programType === "navigator") return true;

    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════

type Step = "care-need" | "age" | "financial" | "results" | "save";

export default function BenefitsDiscoveryModule({
  providerState,
  stateId,
  stateName,
  topPrograms,
  allPrograms,
  providerName,
  providerSlug,
}: BenefitsDiscoveryModuleProps) {
  const [step, setStep] = useState<Step>("care-need");
  const [careNeed, setCareNeed] = useState<CareNeed | null>(null);
  const [age, setAge] = useState("");
  const [medicaid, setMedicaid] = useState<MedicaidStatus>("");
  const [incomeRange, setIncomeRange] = useState<IncomeRange | "">("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startTrackedRef = useRef(false);
  const savedMatchCountRef = useRef<number | null>(null);
  const [quotedQuestion, setQuotedQuestion] = useState<string | null>(null);
  const [echoVisible, setEchoVisible] = useState(false);

  // ─── Spotlight handoff from Q&A section ───────────────────────────
  // When a caregiver submits a question, the room quiets around us:
  // body gets `benefits-spotlight-active`, siblings fade, the page bg
  // warms to cream. We hold the quoted question as an italic serif line
  // above the header and smooth-scroll into view. Perena/Wispr Flow move —
  // no glow on the card, the environment does the work.
  useEffect(() => {
    let pendingTimeouts: number[] = [];

    function clearPending() {
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
      pendingTimeouts = [];
    }

    function handleQuestionSubmitted(e: Event) {
      const detail = (e as CustomEvent<{ question: string }>).detail;
      if (!detail?.question) return;

      // Clear any in-flight spotlight from a previous submission so a rapid
      // second submit doesn't get cut short by the first timer.
      clearPending();
      setEchoVisible(false);
      setQuotedQuestion(detail.question);

      // Defensive blur: if the caregiver just submitted from a text input
      // (or the enrichment field on a page without benefits), drop focus so
      // a) the browser doesn't fight our scroll, and b) subsequent typing
      // doesn't land in an off-screen input.
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === "function") active.blur();

      // Delay scroll one frame so the echo mounts before we animate.
      // Respect prefers-reduced-motion — jump instantly instead of animating.
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        const el = document.getElementById("benefits");
        if (el) {
          el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        }
        document.body.classList.add("benefits-spotlight-active");
      });

      // Echo line fades in after the scroll has a moment to settle
      pendingTimeouts.push(
        window.setTimeout(() => setEchoVisible(true), 450),
      );

      // Spotlight holds briefly, then the room returns to normal.
      // The echo line stays — it's the caregiver's own words, not a toast.
      pendingTimeouts.push(
        window.setTimeout(() => {
          document.body.classList.remove("benefits-spotlight-active");
        }, 2700),
      );
    }

    window.addEventListener("olera:question-submitted", handleQuestionSubmitted);
    return () => {
      window.removeEventListener("olera:question-submitted", handleQuestionSubmitted);
      clearPending();
      document.body.classList.remove("benefits-spotlight-active");
    };
  }, []);

  // Fire-and-forget: notify Slack + log that a user started the intake.
  // Guarded so re-selecting a care-need card (or going back/forward) only fires once per session.
  function trackStart(selectedCareNeed: CareNeed) {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;
    const label = CARE_NEED_OPTIONS.find((o) => o.value === selectedCareNeed)?.label || selectedCareNeed;
    try {
      fetch("/api/benefits/track-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careNeedLabel: label,
          stateCode: providerState,
          stateName,
          providerName: providerName || null,
          providerSlug: providerSlug || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // swallow — tracking must never block the UX
    }
  }

  // Live match count (based on whatever's been answered so far)
  const matchingPrograms = useMemo(
    () => filterPrograms(allPrograms, careNeed, age, medicaid, incomeRange),
    [allPrograms, careNeed, age, medicaid, incomeRange],
  );

  if (topPrograms.length === 0) return null;

  // ─── Handle save submission ───────────────────────────────────────────
  // IMPORTANT: We use window.location.href (full page reload) instead of
  // router.push (client-side nav). Reason: the Supabase browser client is
  // a module-level singleton that was initialized on the provider page
  // BEFORE any auth cookies existed. When the server writes session cookies
  // via Set-Cookie headers on our POST response, the browser stores them,
  // but the stale Supabase client singleton never re-reads them because
  // client-side navigation keeps the same React root + same module state.
  //
  // Full page reload throws away the singleton, fresh page load re-reads
  // cookies from scratch, AuthProvider sees the session, welcome page
  // renders the personalized state. ~500ms extra vs router.push but it
  // actually works.
  async function handleSave() {
    setSaveError(null);
    if (!firstName.trim() || !email.trim() || !email.includes("@")) {
      setSaveError("Please enter your name and a valid email.");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch("/api/benefits/save-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careNeed,
          age: age ? parseInt(age) : null,
          medicaidStatus: medicaid || null,
          incomeRange: incomeRange || null,
          stateCode: providerState,
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          matchedPrograms: matchingPrograms.map((p) => ({
            programId: p.id,
            stateId,
            name: p.name,
            shortName: p.shortName,
            programType: p.programType,
            savingsRange: p.savingsRange,
          })),
          matchCount: matchingPrograms.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error || "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      // Name/email captured → reveal results inline on the provider page.
      // The user can click through to /welcome from the results CTA, which
      // does the full-page reload needed to refresh the Supabase client singleton.
      setSaving(false);
      setStep("results");
      // Track the match count the server actually saved, for the welcome redirect
      savedMatchCountRef.current = data.matchCount || matchingPrograms.length;
      return;
    } catch (err) {
      console.error("[BenefitsDiscoveryModule] Save failed:", err);
      setSaveError("Network error. Please try again.");
      setSaving(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER — state machine
  // ═════════════════════════════════════════════════════════════════════

  // ─── Progress indicator + back button wrapper ─────────────────────────
  // Step 4 (save) starts EMPTY and fills as the user types — see render block.
  // Step 5 (results) is the reveal after save succeeds.
  const baseStepNum =
    step === "care-need" ? 1 :
    step === "age" ? 2 :
    step === "financial" ? 3 :
    step === "save" ? 3 :
    step === "results" ? 5 :
    1;
  const totalSteps = 5;
  // For step 4 (save): compute partial fill of the 4th segment based on form completeness
  const saveProgress = (() => {
    if (step !== "save") return 0;
    let p = 0;
    if (firstName.trim().length > 0) p += 0.5;
    if (email.trim().length > 0 && email.includes("@")) p += 0.5;
    return p;
  })();

  const StepHeader = ({ onBack }: { onBack?: () => void }) => (
    <div className="flex items-center gap-3 mb-6">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}
      <div className="flex-1 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          // Segments 1-3: binary (filled once that step is reached).
          // Segment 4 (the save gate): partial fill driven by name+email completeness,
          //   pulses softly when empty to telegraph "you're not done yet".
          // Segment 5 (the results reveal): fills once save succeeds.
          const isSaveSegment = i === 3;
          if (isSaveSegment) {
            const fill = step === "save" ? saveProgress * 100 : step === "results" ? 100 : 0;
            const isPulsing = step === "save" && saveProgress === 0;
            return (
              <div key={i} className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden relative">
                <div
                  className={`h-full bg-gray-900 rounded-full transition-all duration-300 ${isPulsing ? "animate-pulse opacity-60" : ""}`}
                  style={{ width: isPulsing ? "12%" : `${fill}%` }}
                />
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < baseStepNum ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );

  // ─── Step 1: Care need (first sequence — entry point) ───────────────
  if (step === "care-need") {
    // Build typographic support strip — top programs by savings, name only
    const stripPrograms = topPrograms
      .concat(allPrograms.filter((p) => !topPrograms.find((t) => t.id === p.id)))
      .slice(0, 8)
      .map((p) => p.shortName || p.name);
    const remainingCount = Math.max(0, allPrograms.length - stripPrograms.length);

    return (
      <div>
        <StepHeader />

        {/* ── Echo of the caregiver's question (appears after Q&A submit) ──
            Italic serif, quiet. Proves the page heard them. Not a toast —
            it stays in place as context for the rest of the flow. */}
        {quotedQuestion && (
          <p
            className={`benefits-echo-line ${echoVisible ? "is-visible" : ""} font-display italic text-[15px] text-gray-500 mb-3 leading-relaxed`}
          >
            You just asked: <span className="text-gray-700">&ldquo;{quotedQuestion}&rdquo;</span>
          </p>
        )}

        <h2 className="text-2xl font-bold text-gray-900 font-display">
          Families like yours qualify for help.
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {stateName} has {allPrograms.length} programs. What kind of help does your family need?
        </p>

        {/* Care need cards — the main visual focal point */}
        <div className="space-y-2 mb-10">
          {CARE_NEED_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = careNeed === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setCareNeed(opt.value);
                  trackStart(opt.value);
                  setTimeout(() => setStep("age"), 180);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                  isSelected
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isSelected ? "text-white" : "text-gray-600"}`}
                  weight="duotone"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{opt.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Typographic support strip — Perena-style ─────────────────
            Quiet evidence that real programs exist behind the cards.
            No pills, no chrome, just typography. */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[11px] font-medium tracking-[0.1em] text-gray-400 uppercase">
              Programs
            </p>
            <Link
              href={benefitsUrl(stateId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] tracking-wide text-gray-400 hover:text-gray-600 transition-colors"
            >
              Browse all →
            </Link>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {stripPrograms.map((name, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-300"> · </span>}
                <span className="text-gray-600">{name}</span>
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-gray-400"> · +{remainingCount} more</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // ─── Step 2: Age ──────────────────────────────────────────────────────
  if (step === "age") {
    const canContinue = age && parseInt(age) > 0;
    return (
      <div>
        <StepHeader onBack={() => setStep("care-need")} />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          How old is your loved one?
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Most programs are for adults 60+ — we&apos;ll filter to the right ones.
        </p>

        <input
          type="number"
          placeholder="e.g. 72"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canContinue) setStep("financial"); }}
          className="w-full px-4 py-4 text-lg rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200 outline-none transition-colors mb-4"
          autoFocus
        />

        <button
          onClick={() => setStep("financial")}
          disabled={!canContinue}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
            canContinue
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4" weight="bold" />
        </button>
      </div>
    );
  }

  // ─── Step 3: Financial situation ──────────────────────────────────────
  if (step === "financial") {
    const canContinue = medicaid && incomeRange;
    return (
      <div>
        <StepHeader onBack={() => setStep("age")} />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          What&apos;s their financial situation?
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          This helps us match programs that fit. We never share this.
        </p>

        {/* Medicaid */}
        <p className="text-sm font-semibold text-gray-900 mb-2">Are they on Medicaid?</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { value: "alreadyHas", label: "Yes" },
            { value: "doesNotHave", label: "No" },
            { value: "notSure", label: "Not sure" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMedicaid(opt.value as MedicaidStatus)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                medicaid === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Income */}
        <p className="text-sm font-semibold text-gray-900 mb-2">Monthly income</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "under1500", label: "Under $1,500" },
            { value: "under2500", label: "$1,500–$2,500" },
            { value: "under4000", label: "$2,500–$4,000" },
            { value: "over4000", label: "Over $4,000" },
            { value: "preferNotToSay", label: "Prefer not to say" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIncomeRange(opt.value as IncomeRange)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                incomeRange === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep("save")}
          disabled={!canContinue}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
            canContinue
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          See my results
          <ArrowRight className="w-4 h-4" weight="bold" />
        </button>
      </div>
    );
  }

  // ─── Step 5: Results reveal (post-gate) ───────────────────────────────
  if (step === "results") {
    const ageNum = parseInt(age);
    const contextBits: string[] = [];
    if (ageNum) contextBits.push(`age ${ageNum}`);
    if (careNeed) {
      const opt = CARE_NEED_OPTIONS.find((o) => o.value === careNeed);
      if (opt) contextBits.push(opt.label.toLowerCase());
    }
    if (medicaid === "alreadyHas") contextBits.push("on Medicaid");
    else if (medicaid === "doesNotHave") contextBits.push("not on Medicaid");

    return (
      <div>
        <StepHeader />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          {firstName ? `${firstName}, you` : "You"} may qualify for {matchingPrograms.length} {matchingPrograms.length === 1 ? "program" : "programs"}
        </h2>
        {contextBits.length > 0 && (
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Based on {contextBits.join(", ")}
          </p>
        )}

        {matchingPrograms.length === 0 ? (
          <>
            <div className="rounded-xl bg-gray-50 p-5 mb-6">
              <p className="text-sm text-gray-700">
                No exact matches based on what you shared. But don&apos;t give up — there may be other programs we can help you find.
              </p>
            </div>
            <Link
              href={benefitsUrl(stateId)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Browse all {stateName} programs
              <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
            <button
              onClick={() => setStep("care-need")}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Adjust my answers
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {matchingPrograms.slice(0, 4).map((p) => {
                const savings = shortSavings(p.savingsRange);
                const desc = plainDescription(p.tagline);
                return (
                  <Link
                    key={p.id}
                    href={programUrl(stateId, p.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 hover:bg-gray-100 px-4 py-3.5 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                        {p.shortName || p.name}
                      </p>
                      {desc && <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>}
                    </div>
                    <span className="flex items-center gap-2 shrink-0">
                      {savings && <span className="text-sm text-gray-500">{savings}</span>}
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </span>
                  </Link>
                );
              })}
              {matchingPrograms.length > 4 && (
                <p className="text-xs text-gray-400 pl-4 pt-1">
                  + {matchingPrograms.length - 4} more {matchingPrograms.length - 4 === 1 ? "match" : "matches"}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const matchCount = savedMatchCountRef.current ?? matchingPrograms.length;
                window.location.href = `/welcome?from=benefits&matches=${matchCount}`;
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Go to my dashboard
              <ArrowRight className="w-4 h-4" weight="bold" />
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Your matches are saved. Your dashboard has providers in your area and next steps.
            </p>
          </>
        )}
      </div>
    );
  }

  // ─── Step 4: Save gate (name + email) — now BEFORE results ───────────
  // Typeform-style: one big question, huge underlined inputs, warm microcopy.
  // The match count is teased in the headline so the user knows what they're
  // unlocking — "loss aversion" pull instead of a cold form.
  if (step === "save") {
    const matchCount = matchingPrograms.length;
    const canSubmit = !saving && firstName.trim().length > 0 && email.includes("@");
    const greeting = firstName.trim()
      ? `Nice to meet you, ${firstName.trim().split(/\s+/)[0]}.`
      : "We found programs for your family.";

    return (
      <div>
        <StepHeader onBack={() => setStep("financial")} />

        {/* ── Big headline — teases the reveal behind the gate ─────────── */}
        <p className="text-[11px] font-medium tracking-[0.12em] text-gray-400 uppercase mb-3">
          {matchCount > 0 ? `${matchCount} ${matchCount === 1 ? "match" : "matches"} ready` : "Almost there"}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display leading-[1.1] mb-3">
          {matchCount > 0 ? (
            <>
              {greeting}
              <br />
              <span className="text-gray-500">Where should we send your {matchCount === 1 ? "match" : "matches"}?</span>
            </>
          ) : (
            <>Where should we send your results?</>
          )}
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          No password. Just a magic link so you can come back anytime.
        </p>

        {/* ── Typeform-style underlined inputs ─────────────────────────── */}
        <div className="space-y-8 mb-8">
          <div>
            <label htmlFor="benefits-name" className="text-[11px] font-medium tracking-[0.12em] text-gray-400 uppercase mb-2 block">
              1 · Your first name
            </label>
            <input
              id="benefits-name"
              type="text"
              placeholder="Sarah"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("benefits-email")?.focus();
                }
              }}
              className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-gray-900 px-0 py-2 text-2xl md:text-3xl font-display text-gray-900 placeholder:text-gray-300 outline-none transition-colors"
              autoFocus
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="benefits-email" className="text-[11px] font-medium tracking-[0.12em] text-gray-400 uppercase mb-2 block">
              2 · Your email
            </label>
            <input
              id="benefits-email"
              type="email"
              inputMode="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleSave(); }}
              className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-gray-900 px-0 py-2 text-2xl md:text-3xl font-display text-gray-900 placeholder:text-gray-300 outline-none transition-colors"
              autoComplete="email"
            />
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-600 mb-4">{saveError}</p>
        )}

        {/* ── Big, inviting primary button + keyboard hint ─────────────── */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold text-base transition-all ${
              canSubmit
                ? "bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] shadow-lg shadow-gray-900/10"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Spinner className="w-5 h-5 animate-spin" weight="bold" />
                Saving your matches...
              </>
            ) : (
              <>
                Show me my {matchCount === 1 ? "match" : matchCount > 0 ? `${matchCount} matches` : "results"}
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </button>
          {canSubmit && !saving && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              or press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-[10px]">Enter ↵</kbd>
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
