/**
 * SCORE ONLY. No writes, no model calls.
 *
 * For every pending draft where the family answered "no Medicaid", ask the
 * picker what it would choose NOW that base Medicaid is no longer struck from
 * the ladder, and compare it to what the family is currently holding. Their
 * pick was made while the gate was still broken.
 *
 * Mirrors composeNavigatorDraft's invocation exactly: same facts builder, same
 * accountId/stateAbbrev, no exclude (this is a plain re-pick, not a recompose).
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";
import { selectFirstStepProgram } from "../lib/family-comms/benefits-cascade.server";
import { familyBenefitsFacts } from "../lib/family-comms/benefits-guidance.server";

(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await db.from("business_profiles").select("*")
    .not("metadata->benefits_navigator", "is", null).limit(5000);
  if (error) throw error;

  const targets = (data || []).filter((p) => {
    const nav = p.metadata?.benefits_navigator;
    return nav?.status === "pending" && p.metadata?.medicaid_status === "doesNotHave";
  });

  console.log(`${targets.length} pending drafts from families who answered "no Medicaid"\n`);
  const change: string[] = [], same: string[] = [], none: string[] = [];
  for (const profile of targets) {
    const nav = profile.metadata.benefits_navigator;
    const short = profile.id.slice(0, 8);
    const current = nav.pick?.programId;
    const facts = familyBenefitsFacts(profile);
    const pick = await selectFirstStepProgram(db, {
      accountId: profile.account_id,
      stateAbbrev: profile.state || null,
      facts,
    });
    const now = pick?.programId ?? null;
    const line = `  ${short}  ${nav.pick?.stateId}  ${current}  ->  ${now ?? "(nothing qualifies)"}`;
    if (!now) none.push(line);
    else if (now !== current) change.push(line);
    else same.push(line);
  }
  console.log(`WOULD CHANGE (${change.length}):`); change.forEach((l) => console.log(l));
  console.log(`\nunchanged, pick already right (${same.length}):`); same.forEach((l) => console.log(l));
  if (none.length) { console.log(`\nno qualifying program (${none.length}):`); none.forEach((l) => console.log(l)); }
})();
