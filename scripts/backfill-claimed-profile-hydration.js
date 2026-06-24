#!/usr/bin/env node
/**
 * Backfill: hydrate claimed/materialized business_profiles from their directory
 * listing (the "one record" model). Earlier MedJobs claim/materialize paths
 * created THIN business_profiles (contact fields only) and projected the
 * directory's photos/description/services at render via a client overlay. We've
 * switched to hydrating at claim time; this fixes rows created before that.
 *
 * For each business_profiles row linked to an olera-providers listing (via the
 * top-level source_provider_id column OR the legacy metadata.source_provider_id),
 * copy the directory's display data in where the profile is missing it:
 *   - description  (from provider_description)
 *   - care_types   (from provider_category + main_category)
 *   - category     (mapped from provider_category)
 *   - image_url    (from provider_logo)
 *   - metadata.images (parsed from provider_images)
 * It NEVER overwrites a value the provider already set (their edits win).
 * It also migrates legacy metadata.source_provider_id → the top-level column.
 *
 * Usage:
 *   node scripts/backfill-claimed-profile-hydration.js          # dry-run (counts)
 *   node scripts/backfill-claimed-profile-hydration.js --run    # apply
 *   node scripts/backfill-claimed-profile-hydration.js --run --limit 100
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const RUN = process.argv.includes("--run");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity;

// Mirror lib/types/provider SUPABASE_CAT_TO_PROFILE_CATEGORY (kept inline so the
// script has no TS import). Update both if categories change.
const CAT_MAP = {
  "Assisted Living": "assisted_living",
  "Memory Care": "memory_care",
  "Nursing Home": "nursing_home",
  "Independent Living": "independent_living",
  "Home Care (Non-medical)": "home_care",
  "Home Health Care": "home_health",
  Hospice: "hospice",
};

function parseImages(s) {
  return s ? s.split(" | ").map((x) => x.trim()).filter(Boolean) : [];
}

async function main() {
  console.log(`[backfill] ${RUN ? "RUN" : "DRY-RUN"} — hydrating claimed profiles from directory\n`);

  // Pull claimed/materialized profiles. Page through to beat the 1k cap.
  const PAGE = 1000;
  let from = 0;
  let scanned = 0;
  let needHydration = 0;
  let updated = 0;
  let migratedLink = 0;

  for (;;) {
    const { data: rows, error } = await supabase
      .from("business_profiles")
      .select("id, source_provider_id, description, care_types, image_url, category, metadata")
      .in("type", ["organization", "caregiver"])
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error("[backfill] read error:", error.message); break; }
    if (!rows || rows.length === 0) break;

    for (const bp of rows) {
      if (scanned >= LIMIT) break;
      scanned++;

      // Resolve the directory link (top-level column, else legacy metadata).
      const meta = bp.metadata || {};
      const srcId = bp.source_provider_id || meta.source_provider_id || null;
      if (!srcId) continue;

      const { data: dir } = await supabase
        .from("olera-providers")
        .select("provider_description, provider_category, main_category, provider_images, provider_logo")
        .eq("provider_id", srcId)
        .maybeSingle();
      if (!dir) continue;

      const careTypes = [dir.provider_category, dir.main_category]
        .filter((v) => typeof v === "string" && v.trim() !== "")
        .filter((v, i, a) => a.indexOf(v) === i);
      const images = parseImages(dir.provider_images);

      const patch = {};
      // Only fill where the provider hasn't set their own value (edits win).
      if (!bp.description && dir.provider_description) patch.description = dir.provider_description;
      if ((!bp.care_types || bp.care_types.length === 0) && careTypes.length) patch.care_types = careTypes;
      if (!bp.category && dir.provider_category && CAT_MAP[dir.provider_category]) patch.category = CAT_MAP[dir.provider_category];
      if (!bp.image_url && dir.provider_logo) patch.image_url = dir.provider_logo;
      const hasMetaImages = Array.isArray(meta.images) && meta.images.length > 0;
      const needMetaImages = !hasMetaImages && images.length > 0;
      // Standardize the link onto the top-level column.
      const needLinkMigration = !bp.source_provider_id && !!meta.source_provider_id;

      if (Object.keys(patch).length === 0 && !needMetaImages && !needLinkMigration) continue;
      needHydration++;

      if (needMetaImages) patch.metadata = { ...meta, images };
      if (needLinkMigration) patch.source_provider_id = srcId;

      if (RUN) {
        const { error: upErr } = await supabase.from("business_profiles").update(patch).eq("id", bp.id);
        if (upErr) { console.error(`[backfill] update ${bp.id} failed:`, upErr.message); continue; }
        updated++;
        if (needLinkMigration) migratedLink++;
      }
    }

    if (scanned >= LIMIT || rows.length < PAGE) break;
    from += PAGE;
  }

  console.log(`\n[backfill] scanned=${scanned} needHydration=${needHydration} ${RUN ? `updated=${updated} migratedLink=${migratedLink}` : "(dry-run — re-run with --run to apply)"}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
