#!/usr/bin/env node
/**
 * READ-ONLY investigation of @wehaveprepared.com fraud accounts.
 * No writes. Builds the ground-truth picture for the cleanup script.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function parseEnv() {
  const content = readFileSync("/Users/tfalohun/Desktop/olera-web/.env.local", "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = parseEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const DOMAIN = "@wehaveprepared.com";

// 1. All auth users on the domain
async function authUsers() {
  const matches = [];
  let page = 1;
  while (true) {
    const { data: { users }, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    matches.push(...users.filter(u => u.email?.toLowerCase().endsWith(DOMAIN)));
    if (users.length < 1000) break;
    page++;
  }
  return matches;
}

async function main() {
  const users = await authUsers();
  console.log(`\n=== AUTH USERS on ${DOMAIN}: ${users.length} ===`);
  const userIds = users.map(u => u.id);

  // accounts for these auth users
  const { data: accounts } = await sb.from("accounts").select("id,user_id,active_profile_id,display_name").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  console.log(`\n=== ACCOUNTS linked to those users: ${accounts?.length ?? 0} ===`);
  const accountIds = (accounts ?? []).map(a => a.id);

  // all business_profiles tied to those accounts (any type)
  const { data: bps } = await sb
    .from("business_profiles")
    .select("id,account_id,type,category,display_name,email,claim_state,verification_state,source,source_provider_id,is_active")
    .in("account_id", accountIds.length ? accountIds : ["00000000-0000-0000-0000-000000000000"]);

  // also profiles by email match (covers account_id=null orphans)
  const { data: bpsByEmail } = await sb
    .from("business_profiles")
    .select("id,account_id,type,category,display_name,email,claim_state,verification_state,source,source_provider_id,is_active")
    .ilike("email", `%${DOMAIN}`);

  const byId = new Map();
  for (const r of [...(bps ?? []), ...(bpsByEmail ?? [])]) byId.set(r.id, r);
  const allBps = [...byId.values()];

  const fam = allBps.filter(b => b.type === "family");
  const prov = allBps.filter(b => b.type !== "family");

  console.log(`\n=== BUSINESS_PROFILES total: ${allBps.length} ===`);
  console.log(`  family profiles:   ${fam.length}`);
  console.log(`  provider profiles: ${prov.length}`);

  console.log(`\n--- FAMILY profiles (to DELETE) ---`);
  for (const f of fam) console.log(`  ${f.id} | acct=${f.account_id} | ${f.email} | "${f.display_name}" | active=${f.is_active}`);

  console.log(`\n--- PROVIDER profiles (to UNCLAIM) ---`);
  for (const p of prov) {
    console.log(`  ${p.id} | acct=${p.account_id} | ${p.email} | "${p.display_name}" | type=${p.type} | claim=${p.claim_state} | verif=${p.verification_state} | source=${p.source} | src_pid=${p.source_provider_id}`);
  }

  // source breakdown — seeded vs user-created vs claimed_from_directory
  const srcCounts = {};
  for (const p of prov) srcCounts[p.source ?? "null"] = (srcCounts[p.source ?? "null"] || 0) + 1;
  console.log(`\n--- provider profile 'source' breakdown ---`);
  console.log(JSON.stringify(srcCounts, null, 2));

  // accounts with BOTH a family and provider profile (the dual-profile fraud signature)
  const accFam = new Set(fam.map(f => f.account_id));
  const accProv = new Set(prov.map(p => p.account_id));
  const dual = [...accFam].filter(a => a && accProv.has(a));
  console.log(`\n=== DUAL-PROFILE accounts (family AND provider): ${dual.length} ===`);
  for (const a of dual) {
    const acct = (accounts ?? []).find(x => x.id === a);
    const u = users.find(x => x.id === acct?.user_id);
    console.log(`  acct=${a} email=${u?.email}`);
  }

  // sanity: do any of these source_provider_ids map to olera-providers? (must NOT be deleted)
  const pids = [...new Set(prov.map(p => p.source_provider_id).filter(Boolean))];
  if (pids.length) {
    const { data: dir } = await sb.from("olera-providers").select("provider_id,provider_name").in("provider_id", pids);
    console.log(`\n=== olera-providers directory rows referenced: ${dir?.length ?? 0} (these stay untouched) ===`);
    for (const d of dir ?? []) console.log(`  ${d.provider_id} | ${d.provider_name}`);
  }

  console.log(`\n=== ID LISTS FOR SCRIPT ===`);
  console.log(`AUTH_USER_IDS=${JSON.stringify(userIds)}`);
  console.log(`ACCOUNT_IDS=${JSON.stringify(accountIds)}`);
  console.log(`FAMILY_BP_IDS=${JSON.stringify(fam.map(f => f.id))}`);
  console.log(`PROVIDER_BP_IDS=${JSON.stringify(prov.map(p => p.id))}`);
}

main().catch(e => { console.error(e); process.exit(1); });
