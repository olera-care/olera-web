#!/usr/bin/env node
/**
 * Create a throwaway test provider for verifying the delete cascade.
 *
 * Creates two linked rows:
 *   - olera-providers (the scraped listing — what city pages read)
 *   - business_profiles (a claimed+active BP linked via source_provider_id)
 *
 * Both must exist for the cascade to be meaningfully tested. Without the
 * BP, the bug never manifests (it's the BP fallback that was leaking).
 *
 *   node scripts/create-test-provider.mjs
 *
 * Prints URLs to visit before/after deletion.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// Cleanup mode: hard-delete a previously-created test pair and exit.
if (process.argv[2] === "--cleanup" && process.argv[3]) {
  const cleanupId = process.argv[3];
  await db.from("business_profiles").delete().eq("source_provider_id", cleanupId);
  await db.from("olera-providers").delete().eq("provider_id", cleanupId);
  console.log(`Hard-deleted ${cleanupId}`);
  process.exit(0);
}

const stamp = Date.now().toString(36);
const PROVIDER_ID = `test-cascade-${stamp}`;
const SLUG = `olera-test-listing-delete-me-${stamp}`;
const NAME = `Olera Test Listing (delete me) #${stamp}`;
const CITY = "Boulder";
const STATE = "CO";
const CATEGORY_OP = "Assisted Living";       // olera-providers vocabulary
const CATEGORY_BP = "assisted_living";        // business_profiles vocabulary

// 1. Create olera-providers row.
const { error: opErr } = await db.from("olera-providers").insert({
  provider_id: PROVIDER_ID,
  slug: SLUG,
  provider_name: NAME,
  provider_category: CATEGORY_OP,
  city: CITY,
  state: STATE,
  provider_description: "INTERNAL TEST LISTING — safe to delete via /admin/directory to verify the delete-cascade fix.",
  deleted: false,
});
if (opErr) {
  console.error("olera-providers insert failed:", opErr);
  process.exit(1);
}

// 2. Create linked business_profiles row (claimed + active).
const { error: bpErr } = await db.from("business_profiles").insert({
  source_provider_id: PROVIDER_ID,
  slug: SLUG,
  type: "organization",
  category: CATEGORY_BP,
  display_name: NAME,
  description: "INTERNAL TEST LISTING — claimed BP linked to the scraped row above.",
  city: CITY,
  state: STATE,
  claim_state: "claimed",
  is_active: true,
});
if (bpErr) {
  // Roll back the OP so we don't leave half-state
  await db.from("olera-providers").delete().eq("provider_id", PROVIDER_ID);
  console.error("business_profiles insert failed (OP rolled back):", bpErr);
  process.exit(1);
}

const base = "https://staging-olera2-web.vercel.app";
console.log(`Test provider created:\n`);
console.log(`  provider_id: ${PROVIDER_ID}`);
console.log(`  slug:        ${SLUG}\n`);
console.log("Visit these (in this order):\n");
console.log("  BEFORE you delete:");
console.log(`    1. ${base}/admin/directory  → find the row, confirm 'Published'`);
console.log(`    2. ${base}/provider/${SLUG}  → should render the provider page (200)\n`);
console.log("  THEN delete via /admin/directory (click the trash icon, enter any reason).\n");
console.log("  AFTER you delete:");
console.log(`    3. ${base}/admin/directory  → row hidden under 'Published' tab, visible under 'Deleted'`);
console.log(`    4. ${base}/provider/${SLUG}  → should 301-redirect to /assisted-living/co/boulder`);
console.log(`    5. ${base}/assisted-living/co/boulder  → row should NOT appear (may need to bypass ISR cache; see note)\n`);
console.log("Notes:");
console.log("  • City page ISR caches for 1h. If you visit it BEFORE the delete, the cached HTML may still show the provider until the cache expires. Best to visit it ONLY after delete.");
console.log("  • To re-test, hit Restore in the admin and the BP reactivates → provider returns to public surface.");
console.log("  • Permanent cleanup (hard-delete instead of leaving soft-deleted):");
console.log(`      node scripts/create-test-provider.mjs --cleanup ${PROVIDER_ID}`);
