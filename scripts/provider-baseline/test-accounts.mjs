#!/usr/bin/env node
/**
 * Test accounts for every role on the provider page, pointed at two "(Test)"
 * home care listings so no request or question ever reaches a real agency.
 *
 *   node scripts/provider-baseline/test-accounts.mjs create   # idempotent
 *   node scripts/provider-baseline/test-accounts.mjs status
 *   node scripts/provider-baseline/test-accounts.mjs reset    # after a QA run
 *
 * Rows are written directly, so no welcome email or signup event fires.
 * Every address is a tj+hc-…@olera.care alias: sign-in codes land in TJ's
 * inbox. The claimer and the team member are deliberately email-only: their
 * first sign-in is part of what gets tested, so it must stay real.
 *
 * Production has no test switch on requests: a request to a test listing
 * still raises the team's lead alert. Name the listing "(Test)" in any alert
 * and nobody acts on it.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const LISTINGS = {
  claimed: {
    provider_id: "test-baseline-hc-claimed",
    slug: "test-baseline-home-care-claimed",
    provider_name: "(Test) Baseline Home Care, Claimed",
  },
  unclaimed: {
    provider_id: "test-baseline-hc-unclaimed",
    slug: "test-baseline-home-care-unclaimed",
    provider_name: "(Test) Baseline Home Care, Unclaimed",
  },
};

export const ROLES = {
  guest: { email: "tj+hc-guest@olera.care", note: "No account. Use this address when requesting or asking as a guest." },
  family: { email: "tj+hc-family@olera.care", name: "Test Family", note: "Signed-in family with a family profile." },
  returning: { email: "tj+hc-family@olera.care", note: "The same family after its first request to the claimed test listing; that request is made on the first QA run." },
  claimer: { email: "tj+hc-claimer@olera.care", note: "No account yet, by design. Claims the unclaimed test listing; run reset afterwards." },
  owner: { email: "tj+hc-owner@olera.care", name: "Test Owner", note: "Owns the claimed test listing (verified)." },
  team: { email: "tj+hc-team@olera.care", note: "Team login on the claimed test listing. No account until first sign-in, by design." },
  admin: { email: "tj@olera.care", note: "Existing master admin. No new admin is created." },
};

const BASE_LISTING = {
  provider_category: "Home Care (Non-medical)",
  city: "College Station",
  state: "TX",
  zipcode: "77840",
  provider_description:
    "INTERNAL TEST LISTING for provider page QA. Requests and questions sent here reach Olera staff, not an agency.",
  deleted: false,
};

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function ensureUser(email, name) {
  const existing = await findUser(email);
  if (existing) return existing;
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw new Error(`create user ${email}: ${error.message}`);
  return data.user;
}

async function ensureAccount(user, name) {
  const found = await must(db.from("accounts").select("*").eq("user_id", user.id).maybeSingle(), "read account");
  if (found) return found;
  return must(
    db.from("accounts").insert({ user_id: user.id, display_name: name, onboarding_completed: true }).select("*").single(),
    "create account",
  );
}

async function ensureListing(listing, extra) {
  const found = await must(
    db.from("olera-providers").select("provider_id").eq("provider_id", listing.provider_id).maybeSingle(),
    "read listing",
  );
  if (found) return;
  await must(db.from("olera-providers").insert({ ...BASE_LISTING, ...listing, ...extra }), `create ${listing.slug}`);
}

async function create() {
  await ensureListing(LISTINGS.claimed, { lower_price: 28, upper_price: 34, contact_for_price: "false" });
  await ensureListing(LISTINGS.unclaimed, {
    lower_price: 25,
    upper_price: 30,
    contact_for_price: "false",
    email: "tj+hc-unclaimed@olera.care",
  });

  // Family: account plus a family profile, as signup would leave it.
  const famUser = await ensureUser(ROLES.family.email, ROLES.family.name);
  const famAcct = await ensureAccount(famUser, ROLES.family.name);
  let fam = await must(
    db.from("business_profiles").select("id").eq("account_id", famAcct.id).eq("type", "family").maybeSingle(),
    "read family profile",
  );
  if (!fam) {
    fam = await must(
      db
        .from("business_profiles")
        .insert({
          account_id: famAcct.id,
          slug: "test-baseline-family",
          type: "family",
          display_name: ROLES.family.name,
          email: ROLES.family.email,
          city: "College Station",
          state: "TX",
          care_types: [],
          claim_state: "claimed",
          verification_state: "unverified",
          source: "user_created",
          is_active: true,
          metadata: {},
        })
        .select("id")
        .single(),
      "create family profile",
    );
  }
  await must(db.from("accounts").update({ active_profile_id: fam.id }).eq("id", famAcct.id), "set family active");

  // Owner: a verified claim on the claimed listing, with the owner's own rate.
  const ownUser = await ensureUser(ROLES.owner.email, ROLES.owner.name);
  const ownAcct = await ensureAccount(ownUser, ROLES.owner.name);
  let org = await must(
    db.from("business_profiles").select("id").eq("source_provider_id", LISTINGS.claimed.provider_id).maybeSingle(),
    "read owner profile",
  );
  if (!org) {
    org = await must(
      db
        .from("business_profiles")
        .insert({
          account_id: ownAcct.id,
          source_provider_id: LISTINGS.claimed.provider_id,
          slug: `${LISTINGS.claimed.slug}-bp`,
          type: "organization",
          category: "home_care_agency",
          display_name: LISTINGS.claimed.provider_name,
          description: BASE_LISTING.provider_description,
          email: ROLES.owner.email,
          city: "College Station",
          state: "TX",
          zip: "77840",
          care_types: ["Home Care"],
          claim_state: "claimed",
          verification_state: "verified",
          source: "user_created",
          is_active: true,
          claimed_at: new Date().toISOString(),
          metadata: { hourly_rate_min: 30, hourly_rate_max: 36, alert_emails: [ROLES.owner.email] },
        })
        .select("id")
        .single(),
      "create owner profile",
    );
  }
  await must(db.from("accounts").update({ active_profile_id: org.id }).eq("id", ownAcct.id), "set owner active");

  // Team login: a member row only; the account is made on first sign-in.
  const member = await must(
    db.from("business_profile_members").select("id").eq("profile_id", org.id).eq("email", ROLES.team.email).maybeSingle(),
    "read member",
  );
  if (!member) {
    await must(
      db.from("business_profile_members").insert({ profile_id: org.id, email: ROLES.team.email, role: "staff", added_by: "provider-baseline" }),
      "create member",
    );
  }
  await status();
}

async function status() {
  const rows = [];
  for (const [role, r] of Object.entries(ROLES)) {
    const u = role === "guest" ? null : await findUser(r.email);
    rows.push({ role, email: r.email, auth_user: u ? "yes" : "no", note: r.note });
  }
  console.table(rows);
  for (const l of Object.values(LISTINGS)) {
    const d = await must(db.from("olera-providers").select("slug, deleted").eq("provider_id", l.provider_id).maybeSingle(), "listing");
    const bp = await must(db.from("business_profiles").select("claim_state, verification_state, is_active").eq("source_provider_id", l.provider_id), "claims");
    console.log(`${l.slug}: ${d ? (d.deleted ? "deleted" : "live") : "missing"}; claims: ${JSON.stringify(bp)}`);
  }
}

/** Undo what a QA run leaves behind on the test listings. */
async function reset() {
  const unclaimedClaims = await must(
    db.from("business_profiles").select("id, account_id").eq("source_provider_id", LISTINGS.unclaimed.provider_id),
    "read claims",
  );
  for (const c of unclaimedClaims) {
    await must(db.from("accounts").update({ active_profile_id: null }).eq("active_profile_id", c.id), "detach claim");
    await must(db.from("business_profiles").delete().eq("id", c.id), "remove claim");
  }
  console.log(`Removed ${unclaimedClaims.length} claim(s) on the unclaimed listing.`);
  console.log("Requests and questions are left in place: they are the returning-family state and the record of the run.");
}

const cmd = process.argv[2];
if (cmd === "create") await create();
else if (cmd === "status") await status();
else if (cmd === "reset") await reset();
else {
  console.log("usage: node scripts/provider-baseline/test-accounts.mjs create|status|reset");
  process.exitCode = 1;
}
