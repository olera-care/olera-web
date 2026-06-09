import { createClient } from "@supabase/supabase-js";
import { scoreClaimTrust, extractDomainFromWebsite } from "@/lib/claim-trust";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isDryRun) {
    console.log("🔍 DRY RUN - No changes will be made\n");
  }

  console.log("Fetching providers who viewed leads but have no accounts...");

  // Get all providers with lead_opened events
  const { data: activities } = await db
    .from("provider_activity")
    .select("provider_id")
    .eq("event_type", "lead_opened");

  const viewerSlugs = new Set(activities?.map(a => a.provider_id) || []);

  // Get provider profiles that match
  const { data: providers, error } = await db
    .from("business_profiles")
    .select("id, slug, display_name, email, city, state, website, account_id, claim_state")
    .in("type", ["organization", "caregiver"])
    .is("account_id", null);

  if (error || !providers) {
    console.error("Failed to fetch:", error);
    return;
  }

  // Filter to only those who viewed leads
  const filtered = providers.filter(p =>
    viewerSlugs.has(p.slug) || viewerSlugs.has(p.id)
  );

  if (filtered.length === 0) {
    console.log("✅ No providers need backfilling");
    return;
  }

  console.log(`Found ${filtered.length} providers to backfill\n`);

  let processed = 0;
  let errors = 0;
  const trustLevelCounts = { high: 0, medium: 0, low: 0 };

  for (const provider of filtered) {
    if (!provider.email) {
      console.log(`⚠️  ${provider.slug} - no email, skipping`);
      continue;
    }

    const email = provider.email.trim().toLowerCase();

    try {
      if (!isDryRun) {
        // 1. Get or create auth user
        let userId: string | undefined;

        // First try to create the user
        const { data: newUser, error: createError } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
        });

        if (newUser?.user) {
          userId = newUser.user.id;
        } else if (createError?.message?.includes("already been registered")) {
          // User exists - paginate through all users to find them
          let page = 1;
          let found = false;
          while (!found && page < 20) {  // Max 20 pages = 1000 users
            const { data: listData } = await db.auth.admin.listUsers({
              page,
              perPage: 50
            });

            if (!listData?.users || listData.users.length === 0) break;

            const existing = listData.users.find(u => u.email?.toLowerCase() === email);
            if (existing) {
              userId = existing.id;
              found = true;
            }
            page++;
          }
        }

        if (!userId) {
          console.log(`⚠️  ${provider.slug} - couldn't find/create user ${email}`);
          errors++;
          continue;
        }

        // 2. Get or create account
        let accountId: string | undefined;

        // Check if account exists first
        const { data: existingAccount } = await db
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingAccount) {
          accountId = existingAccount.id;
        } else {
          // Create new account
          const displayName = provider.display_name || email.split("@")[0] || "Provider";
          const { data: newAccount, error: accountError } = await db
            .from("accounts")
            .insert({
              user_id: userId,
              display_name: displayName,
              onboarding_completed: true,
              active_profile_id: provider.id,
            })
            .select("id")
            .single();

          if (accountError && accountError.code !== "23505") {
            throw accountError;
          }

          if (newAccount) {
            accountId = newAccount.id;
          } else {
            // Race condition - try to get it again
            const { data: raceAccount } = await db
              .from("accounts")
              .select("id")
              .eq("user_id", userId)
              .single();
            accountId = raceAccount?.id;
          }
        }

        if (!accountId) {
          console.log(`⚠️  ${provider.slug} - couldn't create/find account`);
          errors++;
          continue;
        }

        // 3. Score trust
        const trustResult = await scoreClaimTrust({
          email,
          providerName: provider.display_name || provider.slug,
          providerCity: provider.city,
          providerState: provider.state,
          providerDomain: extractDomainFromWebsite(provider.website),
        });

        trustLevelCounts[trustResult.level]++;

        const verificationState = trustResult.level === "high"
          ? "not_required"
          : "unverified";

        // 4. Link profile to account
        const { error: linkError } = await db
          .from("business_profiles")
          .update({
            account_id: accountId,
            claim_state: "claimed",
            verification_state: verificationState,
            claim_trust_level: trustResult.level,
            claim_trust_reason: trustResult.reason,
          })
          .eq("id", provider.id);

        if (linkError) {
          console.log(`❌ ${provider.slug}: ${linkError.message}`);
          errors++;
          continue;
        }

        console.log(`✅ ${provider.slug} → ${trustResult.level} (${verificationState})`);
        processed++;
      } else {
        console.log(`🔍 Would process: ${provider.slug} (${email})`);
        processed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err: any) {
      console.error(`❌ ${provider.slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Backfill ${isDryRun ? "preview" : "complete"}:`);
  console.log(`  Total processed: ${processed}`);
  console.log(`  Errors: ${errors}`);

  if (!isDryRun && processed > 0) {
    console.log(`\nTrust level distribution:`);
    console.log(`  High (not_required): ${trustLevelCounts.high}`);
    console.log(`  Medium (unverified): ${trustLevelCounts.medium}`);
    console.log(`  Low (unverified): ${trustLevelCounts.low}`);
  }

  if (isDryRun) {
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(console.error);
