import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateBriefToken, generateQuizToken, type QuizQuestion } from "@/lib/claim-tokens";
import { familyBenefitsFacts, type FamilyBenefitsFacts } from "@/lib/family-comms/benefits-guidance.server";
import type { BenefitProgram, AreaAgency } from "@/lib/types/benefits";

/**
 * GET /api/family-brief?pid=<program id>&tok=<brief token>
 *
 * Read-only JSON for the program brief (/family/program/[pid]) — the guided
 * "Learn more" destination between the guidance email and the dense article.
 * Fully programmatic: everything renders from the sbf_* rows joined with the
 * family's known facts at request time; nothing is authored per program.
 *
 * The checklist is the quiz wearing useful clothes: requirements we can verify
 * from known facts render as met; unknown facts render with one-tap chips
 * (quiz tokens → POST /api/family-quiz; the client re-fetches this endpoint
 * after each tap so checkmarks resolve in place). Income limits are shown as
 * information only — we never ask for income or budget.
 *
 * First step waterfall: the program's own phone + what_to_say (federal rows,
 * ~99% coverage) → the family's local Area Agency on Aging (state rows carry
 * no scripts) → the benefits finder.
 */

interface ChecklistItem {
  label: string;
  status: "met" | "unknown" | "notMet" | "info";
  chip?: { question: QuizQuestion; options: { label: string; tok: string }[] };
}

function trimDescription(text: string, maxLen = 320): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 1).trimEnd() + "…" : clean;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pid = url.searchParams.get("pid") || "";
  const token = url.searchParams.get("tok") || "";
  const invalid = (error: string) => NextResponse.json({ ok: false, error }, { status: 400 });

  const v = validateBriefToken(token);
  if (!pid || !v.valid) return invalid("expired");
  const { familyProfileId, email } = v;

  try {
    const db = getServiceClient();

    // Program lives in one of two tables; try state first (528 vs 76 rows).
    let program: BenefitProgram | null = null;
    let isState = true;
    {
      const { data } = await db.from("sbf_state_programs").select("*").eq("id", pid).maybeSingle();
      program = (data as BenefitProgram | null) || null;
      if (!program) {
        const { data: fed } = await db.from("sbf_federal_programs").select("*").eq("id", pid).maybeSingle();
        program = (fed as BenefitProgram | null) || null;
        isState = false;
      }
    }
    if (!program || program.is_active === false) return invalid("not_found");

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, state, care_types, metadata")
      .eq("id", familyProfileId)
      .maybeSingle();
    const facts: FamilyBenefitsFacts = profile
      ? familyBenefitsFacts(profile)
      : { state: null, careTypes: [], financialPath: null, medicaidStatus: null, veteranStatus: null, age: null };

    const chipFor = (question: QuizQuestion, options: { label: string; answer: string }[]) => ({
      question,
      options: options.map((o) => ({ label: o.label, tok: generateQuizToken(familyProfileId, question, o.answer, email) })),
    });

    const checklist: ChecklistItem[] = [];
    if (isState && program.state_code && facts.state) {
      checklist.push(
        program.state_code === facts.state
          ? { label: `You live in ${program.state_code} — this program covers your state`, status: "met" }
          : { label: `This is a ${program.state_code} program; you're in ${facts.state}`, status: "notMet" },
      );
    }
    if (program.min_age != null) {
      if (facts.age == null) {
        checklist.push({
          label: `Age ${program.min_age}+`,
          status: "unknown",
          chip: chipFor("age", [
            { label: "Under 65", answer: "60" },
            { label: "65–74", answer: "70" },
            { label: "75–84", answer: "80" },
            { label: "85+", answer: "87" },
          ]),
        });
      } else {
        checklist.push(
          facts.age >= program.min_age
            ? { label: `Age ${program.min_age}+ — met`, status: "met" }
            : { label: `Age ${program.min_age}+ — not yet`, status: "notMet" },
        );
      }
    }
    if (program.requires_medicaid) {
      if (facts.medicaidStatus === "alreadyHas") checklist.push({ label: "Has Medicaid — met", status: "met" });
      else if (facts.medicaidStatus === "doesNotHave") checklist.push({ label: "Requires Medicaid", status: "notMet" });
      else
        checklist.push({
          label: "Requires Medicaid",
          status: "unknown",
          chip: chipFor("medicaid", [
            { label: "Yes, already have it", answer: "alreadyHas" },
            { label: "Applying / not sure", answer: "notSure" },
            { label: "No", answer: "doesNotHave" },
          ]),
        });
    }
    if (program.requires_veteran === true) {
      if (facts.veteranStatus === "yes") checklist.push({ label: "Veteran or surviving spouse — met", status: "met" });
      else if (facts.veteranStatus === "no") checklist.push({ label: "For veterans and surviving spouses", status: "notMet" });
      else
        checklist.push({
          label: "For veterans and surviving spouses",
          status: "unknown",
          chip: chipFor("veteran", [
            { label: "Yes", answer: "yes" },
            { label: "No", answer: "no" },
          ]),
        });
    }
    if (program.max_income_single != null) {
      checklist.push({
        label: `Income limits apply (around $${Math.round(program.max_income_single).toLocaleString()}/mo for one person). The program confirms this with you — you don't need to share it here.`,
        status: "info",
      });
    }

    // First-step waterfall: program's own script → local AAA → finder.
    let firstStep: { source: string; phone: string | null; script: string | null } | null = null;
    if (program.phone || program.what_to_say) {
      firstStep = { source: program.name, phone: program.phone || null, script: program.what_to_say || null };
    } else if (facts.state) {
      const { data: agencies } = await db
        .from("sbf_area_agencies")
        .select("name, phone, what_to_say")
        .eq("state_code", facts.state)
        .eq("is_active", true)
        .order("name")
        .limit(1);
      const aaa = (agencies as Pick<AreaAgency, "name" | "phone" | "what_to_say">[] | null)?.[0];
      if (aaa) firstStep = { source: `${aaa.name} (your local Area Agency on Aging)`, phone: aaa.phone || null, script: aaa.what_to_say || null };
    }

    return NextResponse.json({
      ok: true,
      program: {
        name: program.name,
        savingsRange: program.savings_range || null,
        description: trimDescription(program.description),
        isState,
        applyUrl: program.application_url || program.website || program.waiver_library_url || null,
      },
      checklist,
      firstStep,
    });
  } catch (e) {
    console.error("[family-brief] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
