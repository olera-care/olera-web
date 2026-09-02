/**
 * MEASURE ONLY. No writes.
 *
 * Runs the REAL matcher (matchPrograms, imported not reimplemented) for actual
 * families who answered "no Medicaid", once as the code stands and once with
 * requires_medicaid demoted from hard-disqualify to boost-only, and diffs the
 * result sets.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";
import { matchPrograms } from "../app/api/benefits/match/route";

(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: fed } = await db.from("sbf_federal_programs").select("*").eq("is_active", true);
  const { data: profiles } = await db.from("business_profiles").select("id,state,metadata")
    .not("metadata->benefits_navigator", "is", null).limit(5000);

  const targets = (profiles || []).filter((p) => {
    const nav = p.metadata?.benefits_navigator;
    return nav?.status === "pending" && p.metadata?.medicaid_status === "doesNotHave" && p.state;
  }).slice(0, 8);

  console.log(`${targets.length} real "no Medicaid" families\n`);

  for (const p of targets) {
    const { data: st } = await db.from("sbf_state_programs").select("*")
      .eq("state_code", p.state!.toUpperCase()).eq("is_active", true);

    const answers = {
      age: p.metadata?.age ?? null,
      incomeRange: p.metadata?.income_range ?? null,
      medicaidStatus: p.metadata?.medicaid_status ?? null,
      veteranStatus: p.metadata?.veteran_status ?? null,
      primaryNeeds: p.metadata?.primary_needs ?? p.metadata?.care_needs ?? [],
      carePreference: p.metadata?.care_preference ?? null,
      stateCode: p.state,
    } as never;

    const before = matchPrograms((fed || []) as never, (st || []) as never, answers).map((m: never) => (m as { program: { name: string } }).program.name);
    // Simulate the fix: the flag may boost, never exclude.
    const stRelaxed = (st || []).map((r) => ({ ...r, requires_medicaid: false }));
    const fedRelaxed = (fed || []).map((r) => ({ ...r, requires_medicaid: false }));
    const after = matchPrograms(fedRelaxed as never, stRelaxed as never, answers).map((m: never) => (m as { program: { name: string } }).program.name);

    const gained = after.filter((n) => !before.includes(n));
    console.log(`${p.id.slice(0, 8)}  ${p.state}  results ${before.length} -> ${after.length}`);
    if (gained.length) gained.forEach((n) => console.log(`     + ${n}  (rank ${after.indexOf(n) + 1} of ${after.length})`));
    else console.log(`     (no change)`);
  }
})();
