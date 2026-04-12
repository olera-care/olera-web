"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  House,
  Coin,
  Brain,
  HandHeart,
  Spinner,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

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
}

// ─── URL helpers ─────────────────────────────────────────────────────────
function benefitsUrl(stateId: string): string {
  if (stateId === "texas") return "/texas/benefits";
  return `/senior-benefits/${stateId}`;
}

function programUrl(stateId: string, programId: string): string {
  if (stateId === "texas") return `/texas/benefits/${programId}`;
  return `/senior-benefits/${stateId}/${programId}`;
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

type Step = "hook" | "care-need" | "age" | "financial" | "results" | "save";

export default function BenefitsDiscoveryModule({
  providerState,
  stateId,
  stateName,
  topPrograms,
  allPrograms,
}: BenefitsDiscoveryModuleProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("hook");
  const [careNeed, setCareNeed] = useState<CareNeed | null>(null);
  const [age, setAge] = useState("");
  const [medicaid, setMedicaid] = useState<MedicaidStatus>("");
  const [incomeRange, setIncomeRange] = useState<IncomeRange | "">("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Live match count (based on whatever's been answered so far)
  const matchingPrograms = useMemo(
    () => filterPrograms(allPrograms, careNeed, age, medicaid, incomeRange),
    [allPrograms, careNeed, age, medicaid, incomeRange],
  );

  if (topPrograms.length === 0) return null;

  const heroSavings = extractTopSavings(topPrograms[0]?.savingsRange);

  // ─── Handle save submission ───────────────────────────────────────────
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
        setSaveError(data.error || "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      // If API returned session tokens, set them so the user is instantly logged in
      if (data.session?.accessToken && data.session?.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken,
        });
      }
      // Redirect to welcome page in fresh-from-benefits state
      router.push(`/welcome?from=benefits&matches=${data.matchCount || matchingPrograms.length}`);
    } catch (err) {
      console.error("[BenefitsDiscoveryModule] Save failed:", err);
      setSaveError("Network error. Please try again.");
      setSaving(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER — state machine
  // ═════════════════════════════════════════════════════════════════════

  // ─── Hook (initial state) ─────────────────────────────────────────────
  if (step === "hook") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          Your family may qualify for help
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {stateName} has {allPrograms.length} programs — families save up to {heroSavings || "thousands"}/yr
        </p>

        <div className="space-y-2 mb-6">
          {topPrograms.map((p) => {
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
        </div>

        <button
          onClick={() => setStep("care-need")}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
        >
          See what your family qualifies for
          <ArrowRight className="w-4 h-4" weight="bold" />
        </button>

        <Link
          href={benefitsUrl(stateId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-600 hover:text-primary-500 transition-colors"
        >
          View all {stateName} programs
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // ─── Progress indicator + back button wrapper ─────────────────────────
  const currentStepNum = step === "care-need" ? 1 : step === "age" ? 2 : step === "financial" ? 3 : step === "results" ? 4 : 5;
  const totalSteps = 5;

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
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentStepNum ? "bg-gray-900" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );

  // ─── Step 1: Care need ────────────────────────────────────────────────
  if (step === "care-need") {
    return (
      <div>
        <StepHeader onBack={() => setStep("hook")} />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          What kind of help are they looking for?
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Pick the one that fits best — we&apos;ll tailor the results.
        </p>

        <div className="space-y-2 mb-4">
          {CARE_NEED_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = careNeed === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setCareNeed(opt.value);
                  // Auto-advance
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
          onClick={() => setStep("results")}
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

  // ─── Step 4: Results reveal (ungated) ─────────────────────────────────
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
        <StepHeader onBack={() => setStep("financial")} />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          You may qualify for {matchingPrograms.length} {matchingPrograms.length === 1 ? "program" : "programs"}
        </h2>
        {contextBits.length > 0 && (
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Based on {contextBits.join(", ")}
          </p>
        )}

        {matchingPrograms.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-5 mb-6">
            <p className="text-sm text-gray-700">
              No exact matches based on what you shared. But don&apos;t give up — there may be other programs we can help you find. Try browsing all {stateName} programs or adjusting your answers.
            </p>
          </div>
        ) : (
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
        )}

        <button
          onClick={() => setStep("save")}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
        >
          Save my matches and find providers who accept them
          <ArrowRight className="w-4 h-4" weight="bold" />
        </button>
        <p className="text-xs text-gray-400 mt-3 text-center">
          We&apos;ll set up your dashboard with your benefits, providers in your area, and next steps.
        </p>
      </div>
    );
  }

  // ─── Step 5: Save (name + email) ──────────────────────────────────────
  if (step === "save") {
    return (
      <div>
        <StepHeader onBack={() => setStep("results")} />
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          One last step.
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          We&apos;ll save your matches and use what you told us to find providers in {stateName} who accept these programs.
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label htmlFor="benefits-name" className="text-xs text-gray-500 mb-1 block">Your first name</label>
            <input
              id="benefits-name"
              type="text"
              placeholder="Sarah"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200 outline-none transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="benefits-email" className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              id="benefits-email"
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !saving) handleSave(); }}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200 outline-none transition-colors"
            />
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-red-600 mb-3">{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !firstName.trim() || !email.includes("@")}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
            saving || !firstName.trim() || !email.includes("@")
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {saving ? (
            <>
              <Spinner className="w-4 h-4 animate-spin" weight="bold" />
              Setting up your dashboard...
            </>
          ) : (
            <>
              Save and find providers
              <ArrowRight className="w-4 h-4" weight="bold" />
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-3 text-center">
          No password needed. We&apos;ll send a link so you can come back anytime.
        </p>
      </div>
    );
  }

  return null;
}
