import { createClient } from "@supabase/supabase-js";
import { scoreClaimTrust, extractDomainFromWebsite } from "@/lib/claim-trust";

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

// Check for --dry-run flag
const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No database updates will be made\n");
  }

  console.log("Fetching affected providers...");

  const { data: providers, error } = await db
    .from("business_profiles")
    .select("id, slug, display_name, email, city, state, website, account_id")
    .eq("claim_state", "claimed")
    .is("verification_state", null)
    .is("claim_trust_level", null)
    .not("account_id", "is", null);

  if (error || !providers) {
    console.error("Failed to fetch:", error);
    return;
  }

  console.log(`Found ${providers.length} providers to backfill\n`);

  let processed = 0;
  let errors = 0;
  const trustLevelCounts = { high: 0, medium: 0, low: 0 };

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (provider) => {
      try {
        const trustResult = await scoreClaimTrust({
          email: provider.email || "unknown@example.com",
          providerName: provider.display_name || provider.slug,
          providerCity: provider.city,
          providerState: provider.state,
          providerDomain: extractDomainFromWebsite(provider.website),
        });

        const verificationState = trustResult.level === "high"
          ? "not_required"
          : "unverified";

        trustLevelCounts[trustResult.level]++;

        if (!isDryRun) {
          const { error: updateErr } = await db
            .from("business_profiles")
            .update({
              verification_state: verificationState,
              claim_trust_level: trustResult.level,
              claim_trust_reason: trustResult.reason,
            })
            .eq("id", provider.id);

          if (updateErr) {
            console.error(`❌ Failed to update ${provider.slug}:`, updateErr.message);
            errors++;
            return;
          }
        }

        processed++;
        const prefix = isDryRun ? "🔍" : "✓";
        console.log(`${prefix} ${provider.slug} → ${trustResult.level} (${verificationState}) - ${trustResult.reason}`);
      } catch (err) {
        console.error(`❌ Error processing ${provider.slug}:`, err);
        errors++;
      }
    }));

    if (i + BATCH_SIZE < providers.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Backfill ${isDryRun ? "preview" : "complete"}:`);
  console.log(`  Total processed: ${processed}`);
  console.log(`  Errors: ${errors}`);

  if (processed > 0) {
    console.log(`\nTrust level distribution:`);
    console.log(`  High (not_required): ${trustLevelCounts.high} (${((trustLevelCounts.high / processed) * 100).toFixed(1)}%)`);
    console.log(`  Medium (unverified): ${trustLevelCounts.medium} (${((trustLevelCounts.medium / processed) * 100).toFixed(1)}%)`);
    console.log(`  Low (unverified): ${trustLevelCounts.low} (${((trustLevelCounts.low / processed) * 100).toFixed(1)}%)`);
  } else {
    console.log(`\nNo providers were processed.`);
  }

  if (isDryRun) {
    console.log(`\n💡 Run without --dry-run to apply these changes`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(console.error);
