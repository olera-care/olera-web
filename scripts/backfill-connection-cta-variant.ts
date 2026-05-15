/**
 * Backfill cta_variant into connections metadata from lead_received events.
 *
 * Problem: Historical connections don't have cta_variant in their metadata,
 * but the corresponding lead_received events DO have it.
 *
 * Solution: Join lead_received events to connections via connection_id,
 * then update the connection's metadata with the cta_variant.
 *
 * Usage:
 *   npx tsx scripts/backfill-connection-cta-variant.ts [--dry-run]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      let value = trimmed.slice(eqIndex + 1);
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}
loadEnv();

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const dryRun = process.argv.includes("--dry-run");

async function backfill() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Connection CTA Variant Backfill`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`${"=".repeat(60)}\n`);

  // Get all lead_received events that have both cta_variant and connection_id
  const { data: events, error: eventsErr } = await db
    .from("provider_activity")
    .select("metadata")
    .eq("event_type", "lead_received")
    .not("metadata->>connection_id", "is", null)
    .not("metadata->>cta_variant", "is", null);

  if (eventsErr) {
    console.error("Failed to fetch events:", eventsErr);
    process.exit(1);
  }

  console.log(`Found ${events?.length || 0} lead_received events with cta_variant and connection_id\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events || []) {
    const meta = event.metadata as Record<string, unknown>;
    const connectionId = meta.connection_id as string;
    const ctaVariant = meta.cta_variant as string;
    const sessionId = meta.session_id as string | undefined;

    // Get the connection
    const { data: conn, error: connErr } = await db
      .from("connections")
      .select("id, metadata")
      .eq("id", connectionId)
      .single();

    if (connErr || !conn) {
      console.log(`[SKIP] Connection ${connectionId} not found`);
      skipped++;
      continue;
    }

    const connMeta = (conn.metadata || {}) as Record<string, unknown>;

    // Check if already has cta_variant
    if (connMeta.cta_variant) {
      console.log(`[SKIP] Connection ${connectionId} already has cta_variant: ${connMeta.cta_variant}`);
      skipped++;
      continue;
    }

    // Update the connection
    const newMeta = {
      ...connMeta,
      cta_variant: ctaVariant,
      ...(sessionId && !connMeta.session_id ? { session_id: sessionId } : {}),
      backfilled_cta_variant: true,
      backfilled_at: new Date().toISOString(),
    };

    console.log(`[${dryRun ? "DRY RUN" : "UPDATE"}] Connection ${connectionId}`);
    console.log(`  Adding cta_variant: ${ctaVariant}`);
    if (sessionId && !connMeta.session_id) {
      console.log(`  Adding session_id: ${sessionId}`);
    }

    if (!dryRun) {
      const { error: updateErr } = await db
        .from("connections")
        .update({ metadata: newMeta })
        .eq("id", connectionId);

      if (updateErr) {
        console.log(`  [ERROR] ${updateErr.message}`);
        errors++;
      } else {
        console.log(`  [OK]`);
        updated++;
      }
    } else {
      updated++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Summary:`);
  console.log(`  ${dryRun ? "Would update" : "Updated"}: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  if (errors > 0) console.log(`  Errors: ${errors}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun && updated > 0) {
    console.log("Run without --dry-run to apply changes.\n");
  }
}

backfill().then(() => process.exit(0)).catch(console.error);
