#!/usr/bin/env node

/**
 * Backfill email_events from Resend for emails sent in the last 30 days.
 *
 * The Resend webhook (lib/resend-events.ts + app/api/resend/webhook/route.ts)
 * only captures events that arrive AFTER the webhook is wired up. To populate
 * the new email_events table + email_log denormalized columns with history
 * already retained by Resend (~30 day window), this script:
 *
 *   1. Pulls every email_log row from the last 30 days where resend_id is set
 *      AND we haven't already seen any events (delivered_at IS NULL).
 *   2. Calls Resend's GET /emails/:id for each — returns current state, not
 *      history. So we synthesize ONE pseudo-event per row reflecting the
 *      last_event Resend reports right now, with deterministic svix_id
 *      (`backfill-{resend_id}`) so re-runs are idempotent at the DB level
 *      (same UNIQUE constraint as live events).
 *   3. Updates the email_log denormalized columns from that pseudo-event,
 *      same monotonic logic as the live webhook.
 *
 * This is a one-shot script — invoke manually after wiring webhooks.
 * Default dry-run; pass --apply to commit. Throttled to ~2 req/sec to stay
 * under Resend's rate limit.
 *
 * Usage:
 *   node scripts/backfill-resend-events.js          # Dry run (default)
 *   node scripts/backfill-resend-events.js --apply   # Apply changes
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);
const dryRun = !process.argv.includes("--apply");

const THROTTLE_MS = 500; // ~2 req/sec — well under Resend's limit
const WINDOW_DAYS = 30;

// Map Resend's last_event field to our event_type enum
const EVENT_TYPE_MAP = {
  sent: "sent",
  delivered: "delivered",
  delivery_delayed: "delivery_delayed",
  opened: "opened",
  clicked: "clicked",
  bounced: "bounced",
  complained: "complained",
  failed: "failed",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n=== Backfill email_events from Resend ${dryRun ? "(DRY RUN)" : "(APPLYING)"} ===\n`);

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await db
    .from("email_log")
    .select("id, resend_id, recipient, subject, created_at")
    .gte("created_at", since)
    .not("resend_id", "is", null)
    .is("delivered_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Failed to fetch email_log rows:", error);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No backfill candidates. Nothing to do.\n");
    return;
  }

  console.log(`Found ${rows.length} email_log row(s) to backfill.\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const eventCounts = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prefix = `[${i + 1}/${rows.length}] ${row.resend_id}`;

    let emailStatus;
    try {
      const result = await resend.emails.get(row.resend_id);
      // Resend SDK returns { data, error } envelope; surface API errors
      // (e.g., 404 for IDs the dashboard already purged) instead of
      // silently treating them as "no last_event".
      if (result?.error) {
        console.warn(`${prefix} — Resend API error:`, result.error.message || result.error);
        failed++;
        await sleep(THROTTLE_MS);
        continue;
      }
      emailStatus = result?.data;
    } catch (err) {
      console.warn(`${prefix} — Resend GET threw:`, err.message || err);
      failed++;
      await sleep(THROTTLE_MS);
      continue;
    }

    // Resend returns the current state. last_event reflects the most recent
    // lifecycle transition (e.g., "delivered", "opened", "bounced").
    const lastEvent = emailStatus?.last_event;
    if (!lastEvent || !EVENT_TYPE_MAP[lastEvent]) {
      console.log(`${prefix} — no actionable last_event ('${lastEvent}'); skipping`);
      skipped++;
      await sleep(THROTTLE_MS);
      continue;
    }

    const eventType = EVENT_TYPE_MAP[lastEvent];
    const occurredAt = emailStatus?.created_at || row.created_at;
    eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;

    if (dryRun) {
      console.log(`${prefix} — would record '${eventType}' @ ${occurredAt}`);
      succeeded++;
      await sleep(THROTTLE_MS);
      continue;
    }

    // 1. Insert pseudo-event with deterministic svix_id (idempotent on re-run)
    const { error: insertErr } = await db.from("email_events").insert({
      svix_id: `backfill-${row.resend_id}`,
      email_log_id: row.id,
      resend_id: row.resend_id,
      event_type: eventType,
      occurred_at: occurredAt,
      payload: { _backfill: true, resend_status: emailStatus },
    });
    if (insertErr && insertErr.code !== "23505") {
      console.warn(`${prefix} — email_events insert failed:`, insertErr.message);
      failed++;
      await sleep(THROTTLE_MS);
      continue;
    }

    // 2. Update email_log denormalized columns (same monotonic logic as live)
    const update = { last_event_type: eventType, last_event_at: occurredAt };
    if (eventType === "delivered") update.delivered_at = occurredAt;
    if (eventType === "opened") update.first_opened_at = occurredAt;
    if (eventType === "clicked") update.first_clicked_at = occurredAt;
    if (eventType === "bounced") update.bounced_at = occurredAt;
    if (eventType === "complained") update.complained_at = occurredAt;

    const { error: updateErr } = await db
      .from("email_log")
      .update(update)
      .eq("id", row.id);
    if (updateErr) {
      console.warn(`${prefix} — email_log update failed:`, updateErr.message);
    }

    console.log(`${prefix} — recorded '${eventType}'`);
    succeeded++;
    await sleep(THROTTLE_MS);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  console.log(`\nEvent breakdown:`);
  for (const [t, c] of Object.entries(eventCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${c}`);
  }
  if (dryRun) {
    console.log(`\nDry run complete. Re-run with --apply to commit.\n`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
