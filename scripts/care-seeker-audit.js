/**
 * Care Seeker Audit Script
 *
 * Run with: node scripts/care-seeker-audit.js
 *
 * Queries the database to understand care seeker engagement state:
 * - Total care seekers
 * - Profile completeness breakdown
 * - Published vs unpublished
 * - Nudge status (who's been nudged, who hasn't)
 * - Age distribution (how long they've been dormant)
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env.local if environment variables aren't set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex);
          let value = trimmed.slice(eqIndex + 1);
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey);

function pct(n, total) {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

async function audit() {
  console.log("\n🔍 CARE SEEKER AUDIT\n");
  console.log("=".repeat(60));

  // Fetch all family profiles
  const { data: families, error } = await db
    .from("business_profiles")
    .select("id, display_name, email, city, state, care_types, metadata, created_at, account_id")
    .eq("type", "family")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Query error:", error);
    return;
  }

  if (!families?.length) {
    console.log("No care seekers found");
    return;
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Categorize
  let total = families.length;
  let hasEmail = 0;
  let hasAccount = 0;

  // Profile completeness
  let hasLocation = 0;
  let hasCareTypes = 0;
  let profileComplete = 0;
  let profileIncomplete = 0;

  // Published status
  let published = 0;
  let unpublished = 0;

  // Nudge status
  let goLiveReminderSent = 0;
  let profileIncompleteReminderSent = 0;
  let providerRecommendationSent = 0;
  let dormantReengagementSent = 0;
  let postConnectionFollowupSent = 0;
  let neverNudged = 0;
  let allNudgesSent = 0;

  // Age buckets
  let age0to7 = 0;
  let age7to14 = 0;
  let age14to30 = 0;
  let age30to60 = 0;
  let age60to90 = 0;
  let age90plus = 0;

  // Problem groups
  let dormantUnpublished = [];
  let incompleteNeverNudged = [];
  let completeButNotLive = [];

  for (const f of families) {
    const meta = f.metadata || {};
    const carePost = meta.care_post;
    const isLive = carePost?.status === "active";
    const hasCareTypesFlag = f.care_types && f.care_types.length > 0;
    const hasLocationFlag = !!(f.city && f.state);
    const isComplete = hasCareTypesFlag && hasLocationFlag;
    const ageMs = now - new Date(f.created_at).getTime();
    const ageDays = ageMs / oneDay;

    // Basic counts
    if (f.email) hasEmail++;
    if (f.account_id) hasAccount++;
    if (hasLocationFlag) hasLocation++;
    if (hasCareTypesFlag) hasCareTypes++;
    if (isComplete) profileComplete++;
    else profileIncomplete++;
    if (isLive) published++;
    else unpublished++;

    // Nudge status
    const glrSent = !!meta.go_live_reminder_sent;
    const pirSent = !!meta.profile_incomplete_reminder_sent;
    const prSent = !!meta.provider_recommendation_sent;
    const drSent = !!meta.dormant_reengagement_sent;
    const pcfSent = !!meta.post_connection_followup_sent;

    if (glrSent) goLiveReminderSent++;
    if (pirSent) profileIncompleteReminderSent++;
    if (prSent) providerRecommendationSent++;
    if (drSent) dormantReengagementSent++;
    if (pcfSent) postConnectionFollowupSent++;

    const anyNudgeSent = glrSent || pirSent || prSent || drSent || pcfSent;
    if (!anyNudgeSent) neverNudged++;

    if (drSent && (glrSent || pirSent)) allNudgesSent++;

    // Age buckets
    if (ageDays <= 7) age0to7++;
    else if (ageDays <= 14) age7to14++;
    else if (ageDays <= 30) age14to30++;
    else if (ageDays <= 60) age30to60++;
    else if (ageDays <= 90) age60to90++;
    else age90plus++;

    // Problem group 1: Dormant + unpublished + already nudged (stuck)
    if (!isLive && ageDays > 14 && anyNudgeSent) {
      dormantUnpublished.push(f);
    }

    // Problem group 2: Incomplete + never nudged (fell through cracks)
    if (!isComplete && !anyNudgeSent && ageDays > 3) {
      incompleteNeverNudged.push(f);
    }

    // Problem group 3: Complete but not live (ready to publish)
    if (isComplete && !isLive) {
      completeButNotLive.push(f);
    }
  }

  // Print results
  console.log("\n📊 TOTALS\n");
  console.log(`Total care seekers:        ${total}`);
  console.log(`  └─ With email:           ${hasEmail} (${pct(hasEmail, total)})`);
  console.log(`  └─ With account:         ${hasAccount} (${pct(hasAccount, total)})`);

  console.log("\n📋 PROFILE COMPLETENESS\n");
  console.log(`Has location (city+state): ${hasLocation} (${pct(hasLocation, total)})`);
  console.log(`Has care types:            ${hasCareTypes} (${pct(hasCareTypes, total)})`);
  console.log(`Profile COMPLETE:          ${profileComplete} (${pct(profileComplete, total)})`);
  console.log(`Profile INCOMPLETE:        ${profileIncomplete} (${pct(profileIncomplete, total)})`);

  console.log("\n🌐 PUBLISHED STATUS\n");
  console.log(`Published (live):          ${published} (${pct(published, total)})`);
  console.log(`UNPUBLISHED:               ${unpublished} (${pct(unpublished, total)})`);

  console.log("\n📧 NUDGE STATUS (each sent once, ever)\n");
  console.log(`Go Live Reminder sent:           ${goLiveReminderSent} (${pct(goLiveReminderSent, total)})`);
  console.log(`Profile Incomplete sent:         ${profileIncompleteReminderSent} (${pct(profileIncompleteReminderSent, total)})`);
  console.log(`Provider Recommendation sent:    ${providerRecommendationSent} (${pct(providerRecommendationSent, total)})`);
  console.log(`Dormant Re-engagement sent:      ${dormantReengagementSent} (${pct(dormantReengagementSent, total)})`);
  console.log(`Post-Connection Follow-up sent:  ${postConnectionFollowupSent} (${pct(postConnectionFollowupSent, total)})`);
  console.log(`─────────────────────────────────`);
  console.log(`NEVER nudged at all:             ${neverNudged} (${pct(neverNudged, total)})`);
  console.log(`Exhausted nudge funnel:          ${allNudgesSent} (${pct(allNudgesSent, total)})`);

  console.log("\n📅 AGE DISTRIBUTION\n");
  console.log(`0-7 days old:              ${age0to7} (${pct(age0to7, total)})`);
  console.log(`7-14 days old:             ${age7to14} (${pct(age7to14, total)})`);
  console.log(`14-30 days old:            ${age14to30} (${pct(age14to30, total)})`);
  console.log(`30-60 days old:            ${age30to60} (${pct(age30to60, total)})`);
  console.log(`60-90 days old:            ${age60to90} (${pct(age60to90, total)})`);
  console.log(`90+ days old:              ${age90plus} (${pct(age90plus, total)})`);

  console.log("\n" + "=".repeat(60));
  console.log("⚠️  PROBLEM GROUPS (Opportunities for Re-engagement)");
  console.log("=".repeat(60));

  console.log(`\n1. STUCK: Dormant + Unpublished + Already Nudged: ${dormantUnpublished.length}`);
  console.log(`   (14+ days old, never published, already received nudges — system gave up on them)\n`);

  console.log(`2. MISSED: Incomplete + Never Nudged: ${incompleteNeverNudged.length}`);
  console.log(`   (3+ days old, profile incomplete, never received any nudge — fell through cracks)\n`);

  console.log(`3. READY: Complete but Not Live: ${completeButNotLive.length}`);
  console.log(`   (Profile is complete, just need to publish — lowest friction to convert)\n`);

  // Show sample of the "stuck" group
  if (dormantUnpublished.length > 0) {
    console.log("\n" + "-".repeat(60));
    console.log("Sample: STUCK care seekers (first 15)");
    console.log("-".repeat(60));
    console.log("\nName                           | Email                          | Location       | Complete | Age");
    console.log("-".repeat(105));

    for (const f of dormantUnpublished.slice(0, 15)) {
      const name = (f.display_name || "—").slice(0, 30).padEnd(30);
      const email = (f.email || "—").slice(0, 30).padEnd(30);
      const location = f.city && f.state ? `${f.city}, ${f.state}`.slice(0, 14).padEnd(14) : "—".padEnd(14);
      const complete = (f.care_types?.length && f.city && f.state) ? "Yes" : "No ";
      const ageDays = Math.floor((now - new Date(f.created_at).getTime()) / oneDay);
      console.log(`${name} | ${email} | ${location} | ${complete}      | ${ageDays}d`);
    }
  }

  // Show sample of "ready to publish" group
  if (completeButNotLive.length > 0) {
    console.log("\n" + "-".repeat(60));
    console.log("Sample: READY TO PUBLISH care seekers (first 15)");
    console.log("-".repeat(60));
    console.log("\nName                           | Email                          | Location       | Age");
    console.log("-".repeat(95));

    for (const f of completeButNotLive.slice(0, 15)) {
      const name = (f.display_name || "—").slice(0, 30).padEnd(30);
      const email = (f.email || "—").slice(0, 30).padEnd(30);
      const location = f.city && f.state ? `${f.city}, ${f.state}`.slice(0, 14).padEnd(14) : "—".padEnd(14);
      const ageDays = Math.floor((now - new Date(f.created_at).getTime()) / oneDay);
      console.log(`${name} | ${email} | ${location} | ${ageDays}d`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Audit complete.\n");
}

audit().catch(console.error);
