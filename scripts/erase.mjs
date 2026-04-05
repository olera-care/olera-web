#!/usr/bin/env node

/**
 * Test Data Eraser — wipes test accounts/profiles from Supabase
 *
 * Usage:
 *   node scripts/erase.mjs --email <email>              # Preview what would be deleted
 *   node scripts/erase.mjs --email <email> --confirm     # Actually delete
 *   node scripts/erase.mjs --provider <name>             # Preview provider archive
 *   node scripts/erase.mjs --provider <name> --confirm   # Actually archive
 *   node scripts/erase.mjs --provider <name> --pick 2    # Pick match #2
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Protected emails (never erase) ──────────────────────────────
const PROTECTED_EMAILS = ["tfalohun@gmail.com", "logan@olera.care"];

// ── .env.local parser ───────────────────────────────────────────
function parseEnvFile() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // Try current directory first, then parent (for worktrees)
  const paths = [
    resolve(__dirname, "../.env.local"),
    resolve(__dirname, "../../olera-web/.env.local"),
    "/Users/tfalohun/Desktop/olera-web/.env.local",
  ];

  let content;
  for (const p of paths) {
    try {
      content = readFileSync(p, "utf-8");
      break;
    } catch {
      continue;
    }
  }
  if (!content) throw new Error("Could not find .env.local");

  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// ── Supabase client ─────────────────────────────────────────────
function getClient() {
  const env = parseEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  return createClient(url, key);
}

// ── Helpers ─────────────────────────────────────────────────────
function countOrZero(result) {
  if (result.error) return { count: 0, error: result.error.message };
  return { count: result.data?.length ?? 0 };
}

function log(msg) { console.log(`  ${msg}`); }
function logTable(label, count, error) {
  const status = error ? `⚠ error: ${error}` : `${count} record${count !== 1 ? "s" : ""}`;
  console.log(`  │ ${label.padEnd(30)} ${status}`);
}

// ── Email lookup ────────────────────────────────────────────────
async function lookupByEmail(sb, email) {
  // 1. Find auth user
  const { data: { users }, error: authErr } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) throw new Error(`Auth lookup failed: ${authErr.message}`);
  const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) return null;

  // 2. Find account
  const { data: account } = await sb
    .from("accounts")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  // 3. Find profiles
  const profiles = [];
  if (account) {
    const { data } = await sb
      .from("business_profiles")
      .select("*")
      .eq("account_id", account.id);
    if (data) profiles.push(...data);
  }

  const profileIds = profiles.map(p => p.id);
  const sourceProviderIds = profiles.map(p => p.source_provider_id).filter(Boolean);

  // 4. Count related records
  const counts = {};

  // Connections
  if (profileIds.length > 0) {
    const orFilter = profileIds.map(id => `from_profile_id.eq.${id},to_profile_id.eq.${id}`).join(",");
    const r = await sb.from("connections").select("id").or(orFilter);
    counts.connections = countOrZero(r);
  } else {
    counts.connections = { count: 0 };
  }

  // Reviews by account
  if (account) {
    const r = await sb.from("reviews").select("id").eq("account_id", account.id);
    counts.reviews = countOrZero(r);
  } else {
    counts.reviews = { count: 0 };
  }

  // Provider questions by auth user
  const r_pq = await sb.from("provider_questions").select("id").eq("asker_user_id", authUser.id);
  counts.provider_questions = countOrZero(r_pq);

  // Email log
  const r_el = await sb.from("email_log").select("id").eq("recipient", email);
  counts.email_log = countOrZero(r_el);

  // WhatsApp log (by profile phones)
  const phones = profiles.map(p => p.phone).filter(Boolean);
  if (phones.length > 0) {
    const r = await sb.from("whatsapp_log").select("id").in("recipient", phones);
    counts.whatsapp_log = countOrZero(r);
  } else {
    counts.whatsapp_log = { count: 0 };
  }

  // WhatsApp conversations
  if (profileIds.length > 0) {
    const r = await sb.from("whatsapp_conversations").select("id").in("profile_id", profileIds);
    counts.whatsapp_conversations = countOrZero(r);
  } else {
    counts.whatsapp_conversations = { count: 0 };
  }

  // Provider activity
  if (profileIds.length > 0) {
    const r = await sb.from("provider_activity").select("id").in("profile_id", profileIds);
    counts.provider_activity = countOrZero(r);
  } else {
    counts.provider_activity = { count: 0 };
  }

  // Seeker activity
  if (profileIds.length > 0) {
    const r = await sb.from("seeker_activity").select("id").in("profile_id", profileIds);
    counts.seeker_activity = countOrZero(r);
  } else {
    counts.seeker_activity = { count: 0 };
  }

  // Feature waitlist
  const r_fw1 = await sb.from("feature_waitlist").select("id").eq("email", email);
  let fwCount = countOrZero(r_fw1).count;
  if (profileIds.length > 0) {
    const r_fw2 = await sb.from("feature_waitlist").select("id").in("profile_id", profileIds);
    fwCount = Math.max(fwCount, countOrZero(r_fw2).count); // Overlap possible
  }
  counts.feature_waitlist = { count: fwCount };

  // Disputes
  if (sourceProviderIds.length > 0) {
    const r = await sb.from("disputes").select("id").in("provider_id", sourceProviderIds);
    counts.disputes = countOrZero(r);
  } else {
    counts.disputes = { count: 0 };
  }

  // Removal requests
  if (sourceProviderIds.length > 0) {
    const r = await sb.from("removal_requests").select("id").in("provider_id", sourceProviderIds);
    counts.removal_requests = countOrZero(r);
  } else {
    counts.removal_requests = { count: 0 };
  }

  // Provider image metadata
  if (sourceProviderIds.length > 0) {
    const r = await sb.from("provider_image_metadata").select("id").in("provider_id", sourceProviderIds);
    counts.provider_image_metadata = countOrZero(r);
  } else {
    counts.provider_image_metadata = { count: 0 };
  }

  // Memberships
  if (account) {
    const r = await sb.from("memberships").select("id").eq("account_id", account.id);
    counts.memberships = countOrZero(r);
  } else {
    counts.memberships = { count: 0 };
  }

  // Interviews
  if (profileIds.length > 0) {
    const orFilter = profileIds.map(id => `provider_profile_id.eq.${id},student_profile_id.eq.${id}`).join(",");
    const r = await sb.from("interviews").select("id").or(orFilter);
    counts.interviews = countOrZero(r);
  } else {
    counts.interviews = { count: 0 };
  }

  // MedJobs experience logs
  if (profileIds.length > 0) {
    const orFilter = profileIds.map(id => `student_profile_id.eq.${id},provider_profile_id.eq.${id}`).join(",");
    const r = await sb.from("medjobs_experience_logs").select("id").or(orFilter);
    counts.medjobs_experience_logs = countOrZero(r);
  } else {
    counts.medjobs_experience_logs = { count: 0 };
  }

  // MedJobs job posts
  if (profileIds.length > 0) {
    const r = await sb.from("medjobs_job_posts").select("id").in("provider_profile_id", profileIds);
    counts.medjobs_job_posts = countOrZero(r);
  } else {
    counts.medjobs_job_posts = { count: 0 };
  }

  return { authUser, account, profiles, profileIds, sourceProviderIds, counts };
}

// ── Provider lookup ─────────────────────────────────────────────
async function lookupByProvider(sb, name) {
  const { data, error } = await sb
    .from("business_profiles")
    .select("id, display_name, type, category, city, state, email, claim_state, is_active, source_provider_id, account_id")
    .ilike("display_name", `%${name}%`)
    .limit(20);

  if (error) throw new Error(`Provider lookup failed: ${error.message}`);
  return data || [];
}

async function countProviderRelated(sb, profile) {
  const pid = profile.id;
  const spid = profile.source_provider_id;
  const counts = {};

  // Connections
  const r_conn = await sb.from("connections").select("id").or(`from_profile_id.eq.${pid},to_profile_id.eq.${pid}`);
  counts.connections = countOrZero(r_conn);

  // Reviews (by provider_id text field)
  if (spid) {
    const r = await sb.from("reviews").select("id").eq("provider_id", spid);
    counts.reviews = countOrZero(r);
  } else {
    counts.reviews = { count: 0 };
  }

  // Provider questions
  if (spid) {
    const r = await sb.from("provider_questions").select("id").eq("provider_id", spid);
    counts.provider_questions = countOrZero(r);
  } else {
    counts.provider_questions = { count: 0 };
  }

  // Provider activity
  const r_pa = await sb.from("provider_activity").select("id").eq("profile_id", pid);
  counts.provider_activity = countOrZero(r_pa);

  // Interviews
  const r_int = await sb.from("interviews").select("id").or(`provider_profile_id.eq.${pid},student_profile_id.eq.${pid}`);
  counts.interviews = countOrZero(r_int);

  // Disputes
  if (spid) {
    const r = await sb.from("disputes").select("id").eq("provider_id", spid);
    counts.disputes = countOrZero(r);
  } else {
    counts.disputes = { count: 0 };
  }

  // Removal requests
  if (spid) {
    const r = await sb.from("removal_requests").select("id").eq("provider_id", spid);
    counts.removal_requests = countOrZero(r);
  } else {
    counts.removal_requests = { count: 0 };
  }

  // Provider image metadata
  if (spid) {
    const r = await sb.from("provider_image_metadata").select("id").eq("provider_id", spid);
    counts.provider_image_metadata = countOrZero(r);
  } else {
    counts.provider_image_metadata = { count: 0 };
  }

  return counts;
}

// ── Email erase ─────────────────────────────────────────────────
async function eraseEmail(sb, data) {
  const { authUser, account, profiles, profileIds, sourceProviderIds, counts } = data;
  const errors = [];

  async function del(table, filter) {
    const { error } = await filter;
    if (error) errors.push(`${table}: ${error.message}`);
    else log(`✓ ${table}`);
  }

  // 1. Text-reference tables (no FK cascade)
  if (account) {
    await del("reviews", sb.from("reviews").delete().eq("account_id", account.id));
  }
  await del("provider_questions", sb.from("provider_questions").delete().eq("asker_user_id", authUser.id));
  await del("email_log", sb.from("email_log").delete().eq("recipient", authUser.email));

  const phones = profiles.map(p => p.phone).filter(Boolean);
  if (phones.length > 0) {
    await del("whatsapp_log", sb.from("whatsapp_log").delete().in("recipient", phones));
  }

  if (profileIds.length > 0) {
    await del("whatsapp_conversations", sb.from("whatsapp_conversations").delete().in("profile_id", profileIds));
    await del("provider_activity", sb.from("provider_activity").delete().in("profile_id", profileIds));
    await del("seeker_activity", sb.from("seeker_activity").delete().in("profile_id", profileIds));
    await del("feature_waitlist", sb.from("feature_waitlist").delete().in("profile_id", profileIds));
  }
  // Also clean waitlist by email
  await del("feature_waitlist (email)", sb.from("feature_waitlist").delete().eq("email", authUser.email));

  if (sourceProviderIds.length > 0) {
    await del("disputes", sb.from("disputes").delete().in("provider_id", sourceProviderIds));
    await del("removal_requests", sb.from("removal_requests").delete().in("provider_id", sourceProviderIds));
    await del("provider_image_metadata", sb.from("provider_image_metadata").delete().in("provider_id", sourceProviderIds));
  }

  // 2. Cascade-triggering deletes
  if (profileIds.length > 0) {
    const orFilter = profileIds.map(id => `from_profile_id.eq.${id},to_profile_id.eq.${id}`).join(",");
    await del("connections", sb.from("connections").delete().or(orFilter));
  }

  if (account) {
    await del("business_profiles", sb.from("business_profiles").delete().eq("account_id", account.id));
    await del("memberships", sb.from("memberships").delete().eq("account_id", account.id));
    await del("accounts", sb.from("accounts").delete().eq("id", account.id));
  }

  // 3. Auth user
  const { error: authDelErr } = await sb.auth.admin.deleteUser(authUser.id);
  if (authDelErr) errors.push(`auth.users: ${authDelErr.message}`);
  else log("✓ auth.users (deleted)");

  return errors;
}

// ── Provider erase (archive) ────────────────────────────────────
async function eraseProvider(sb, profile, counts) {
  const pid = profile.id;
  const spid = profile.source_provider_id;
  const errors = [];

  async function del(table, filter) {
    const { error } = await filter;
    if (error) errors.push(`${table}: ${error.message}`);
    else log(`✓ ${table}`);
  }

  // 1. Clean text-reference tables
  if (spid) {
    await del("reviews", sb.from("reviews").delete().eq("provider_id", spid));
    await del("provider_questions", sb.from("provider_questions").delete().eq("provider_id", spid));
    await del("disputes", sb.from("disputes").delete().eq("provider_id", spid));
    await del("removal_requests", sb.from("removal_requests").delete().eq("provider_id", spid));
    await del("provider_image_metadata", sb.from("provider_image_metadata").delete().eq("provider_id", spid));
  }

  await del("provider_activity", sb.from("provider_activity").delete().eq("profile_id", pid));

  // 2. Connections
  await del("connections", sb.from("connections").delete().or(`from_profile_id.eq.${pid},to_profile_id.eq.${pid}`));

  // 3. Interviews
  await del("interviews", sb.from("interviews").delete().or(`provider_profile_id.eq.${pid},student_profile_id.eq.${pid}`));

  // 4. Archive the profile
  const { error: archiveErr } = await sb
    .from("business_profiles")
    .update({
      claim_state: "archived",
      is_active: false,
      account_id: null,
    })
    .eq("id", pid);

  if (archiveErr) errors.push(`archive profile: ${archiveErr.message}`);
  else log("✓ business_profiles (archived)");

  return errors;
}

// ── Preview printers ────────────────────────────────────────────
function previewEmail(email, data) {
  const { authUser, account, profiles, counts } = data;
  console.log(`\n  Found for ${email}:`);
  console.log("  ┌──────────────────────────────────────────────────┐");
  console.log(`  │ auth.users              1 user (uid: ${authUser.id.slice(0, 8)}...)`);
  console.log(`  │ accounts                ${account ? "1 account" : "none"}`);
  console.log(`  │ business_profiles       ${profiles.length} profile${profiles.length !== 1 ? "s" : ""}`);
  for (const p of profiles) {
    console.log(`  │   - "${p.display_name}" (${p.type})`);
  }
  for (const [table, { count, error }] of Object.entries(counts)) {
    if (count > 0 || error) {
      logTable(table, count, error);
    }
  }
  console.log("  └──────────────────────────────────────────────────┘");
  console.log("\n  ⚠️  This will PERMANENTLY DELETE all of the above.");
  console.log("  Re-run with --confirm to execute.\n");
}

function previewProvider(profile, counts) {
  console.log(`\n  Provider: "${profile.display_name}"`);
  console.log(`  Type: ${profile.type} | Category: ${profile.category || "—"}`);
  console.log(`  Location: ${profile.city}, ${profile.state}`);
  console.log(`  Claim state: ${profile.claim_state} | Active: ${profile.is_active}`);
  console.log("  ┌──────────────────────────────────────────────────┐");
  for (const [table, { count, error }] of Object.entries(counts)) {
    if (count > 0 || error) {
      logTable(table, count, error);
    }
  }
  console.log("  └──────────────────────────────────────────────────┘");
  console.log("\n  This will ARCHIVE the profile (claim_state → 'archived', is_active → false)");
  console.log("  and delete all related records listed above.");
  console.log("  Re-run with --confirm to execute.\n");
}

// ── CLI ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) { flags.email = args[++i]; }
    else if (args[i] === "--provider" && args[i + 1]) { flags.provider = args[++i]; }
    else if (args[i] === "--pick" && args[i + 1]) { flags.pick = parseInt(args[++i], 10); }
    else if (args[i] === "--confirm") { flags.confirm = true; }
  }

  if (!flags.email && !flags.provider) {
    console.log("Usage:");
    console.log("  node scripts/erase.mjs --email <email>");
    console.log("  node scripts/erase.mjs --provider <name>");
    console.log("  Add --confirm to execute (default is preview only)");
    console.log("  Add --pick <N> to select from multiple provider matches");
    process.exit(1);
  }

  const sb = getClient();

  // ── Email mode ──────────────────────────────────────────────
  if (flags.email) {
    const email = flags.email.toLowerCase();

    if (PROTECTED_EMAILS.includes(email)) {
      console.log(`\n  🛡️  ${email} is PROTECTED — cannot erase.\n`);
      process.exit(1);
    }

    console.log(`\n  Looking up ${email}...`);
    const data = await lookupByEmail(sb, email);

    if (!data) {
      console.log(`  No auth user found for ${email}\n`);
      process.exit(0);
    }

    if (!flags.confirm) {
      previewEmail(email, data);
      process.exit(0);
    }

    console.log(`\n  Erasing ${email}...\n`);
    const errors = await eraseEmail(sb, data);

    if (errors.length > 0) {
      console.log("\n  ⚠️  Completed with errors:");
      for (const e of errors) console.log(`    - ${e}`);
    } else {
      console.log(`\n  ✅ Erased. ${email} is clean for reuse.\n`);
    }
  }

  // ── Provider mode ───────────────────────────────────────────
  if (flags.provider) {
    console.log(`\n  Searching for "${flags.provider}"...`);
    const matches = await lookupByProvider(sb, flags.provider);

    if (matches.length === 0) {
      console.log(`  No providers found matching "${flags.provider}"\n`);
      process.exit(0);
    }

    // Disambiguate
    let selected;
    if (matches.length === 1) {
      selected = matches[0];
    } else if (flags.pick && flags.pick >= 1 && flags.pick <= matches.length) {
      selected = matches[flags.pick - 1];
    } else {
      console.log(`\n  Found ${matches.length} matches:\n`);
      matches.forEach((m, i) => {
        console.log(`    ${i + 1}. "${m.display_name}" (${m.type}) — ${m.city}, ${m.state} [${m.claim_state}]`);
      });
      console.log(`\n  Re-run with --pick <N> to select one.\n`);
      process.exit(0);
    }

    // Check if already archived
    if (selected.claim_state === "archived" && !selected.is_active) {
      console.log(`  "${selected.display_name}" is already archived.\n`);
      process.exit(0);
    }

    const counts = await countProviderRelated(sb, selected);

    if (!flags.confirm) {
      previewProvider(selected, counts);
      process.exit(0);
    }

    console.log(`\n  Archiving "${selected.display_name}"...\n`);
    const errors = await eraseProvider(sb, selected, counts);

    if (errors.length > 0) {
      console.log("\n  ⚠️  Completed with errors:");
      for (const e of errors) console.log(`    - ${e}`);
    } else {
      console.log(`\n  ✅ Archived. "${selected.display_name}" is hidden from public.\n`);
    }
  }
}

main().catch((err) => {
  console.error(`\n  ❌ Fatal error: ${err.message}\n`);
  process.exit(1);
});
