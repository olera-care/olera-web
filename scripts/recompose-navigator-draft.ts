/**
 * Local recompose of a pending navigator draft — same flow as the admin
 * drawer's navigator_recompose action, run against this checkout's pipeline
 * bundle. Used 2026-08-04 after the AZ PACE removal (the drawer's recompose
 * needs a deployed bundle; this runs the corrected data immediately).
 *
 *   npx tsx scripts/recompose-navigator-draft.ts <profile-email> [--write]
 *
 * Without --write: composes and prints the draft (read-only).
 * With --write: replaces the pending draft with the new one (fresh-read merge).
 */
import { readFileSync } from "node:fs";
import {
  composeNavigatorDraft,
  pickSnapshot,
  readBenefitsNavigator,
} from "@/lib/family-comms/benefits-navigator.server";
import { getServiceClient } from "@/lib/admin";

// Load env the way local pipeline scripts do (worktrees carry no .env.local).
for (const line of readFileSync("/Users/tfalohun/Desktop/olera-web/.env.local", "utf8").split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#")) {
    const k = line.slice(0, eq).trim();
    if (!process.env[k]) process.env[k] = line.slice(eq + 1).trim();
  }
}

async function main() {
  const email = process.argv[2];
  const write = process.argv.includes("--write");
  const excludeArg = process.argv.find((a) => a.startsWith("--exclude="));
  const exclude = excludeArg
    ? excludeArg.slice("--exclude=".length).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const reasonArg = process.argv.find((a) => a.startsWith("--reason="));
  if (!email) {
    throw new Error(
      "usage: recompose-navigator-draft.ts <email> [--write] [--exclude=id,id] [--reason=slug]",
    );
  }

  const db = getServiceClient();
  const { data: profile } = await db
    .from("business_profiles")
    .select("id, email, phone, phone_validity, metadata, account_id, display_name, state, city, care_types")
    .eq("email", email)
    .maybeSingle();
  if (!profile) throw new Error(`no profile for ${email}`);

  const meta = (profile.metadata as Record<string, unknown>) || {};
  const navigator = readBenefitsNavigator(meta);
  if (navigator.status !== "pending" || !navigator.body) {
    throw new Error(`no pending draft (status: ${navigator.status})`);
  }
  const intakeAt = (meta as { benefits_results?: { completed_at?: string } }).benefits_results
    ?.completed_at;
  if (!intakeAt || !profile.account_id) throw new Error("family is missing intake data");

  console.log(`old pick: ${navigator.pick?.programId} (${navigator.pick?.stateId})`);
  if (exclude.length) console.log(`excluding: ${exclude.join(", ")}`);
  const draft = await composeNavigatorDraft(db, {
    profileId: profile.id,
    accountId: profile.account_id,
    displayName: profile.display_name || null,
    state: profile.state || null,
    city: profile.city || null,
    careTypes: (profile.care_types as string[] | null) || [],
    intakeAt,
    profileMeta: meta,
    factsRow: profile,
    exclude,
  });
  if (!draft) throw new Error("no qualifying first-step program with current data");

  console.log(`new pick: ${draft.pick.programId} (${draft.pick.stateId})`);
  console.log(`subject: ${draft.subject}\n`);
  console.log(draft.body);
  console.log(`\nSMS: ${draft.sms ?? "(none)"}`);

  if (!write) {
    console.log("\n(read-only — rerun with --write to replace the pending draft)");
    return;
  }

  const navStamp = {
    status: "pending",
    composed_at: new Date().toISOString(),
    subject: draft.subject,
    body: draft.body,
    sms: draft.sms,
    model: "claude-opus-5",
    pick: pickSnapshot(draft.pick),
    provider_count: draft.providerCount,
    recomposed_reason: reasonArg
      ? reasonArg.slice("--reason=".length)
      : "program-removed-2026-08-04-factcheck",
  };
  const { data: freshRow } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profile.id)
    .maybeSingle();
  const freshMeta = (freshRow?.metadata as Record<string, unknown> | null) || meta;
  freshMeta.benefits_navigator = navStamp;
  const { error } = await db
    .from("business_profiles")
    .update({ metadata: { ...freshMeta } })
    .eq("id", profile.id);
  if (error) throw error;
  console.log("\nWROTE new pending draft.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
