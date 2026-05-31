require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("=".repeat(60));
  console.log("CHECKING ACTIVE QUESTIONS FOR ORPHAN PROVIDERS");
  console.log("=".repeat(60));

  // Get ACTIVE questions (not archived, not rejected) with needs_provider_email=true
  const { data: questions } = await db
    .from('provider_questions')
    .select('id, provider_id, status, metadata, created_at')
    .neq('status', 'archived')
    .neq('status', 'rejected');

  const activeWithFlag = questions.filter(q => {
    const meta = q.metadata || {};
    return meta.needs_provider_email === true;
  });

  console.log('\nActive questions with needs_provider_email flag:', activeWithFlag.length);

  // Get unique provider IDs
  const providerIds = [...new Set(activeWithFlag.map(q => q.provider_id).filter(Boolean))];
  console.log('Unique provider IDs:', providerIds.length);

  // Check which providers exist
  const { data: bpProviders } = await db
    .from('business_profiles')
    .select('slug, email, is_active')
    .in('slug', providerIds);

  const { data: oleraProviders } = await db
    .from('olera-providers')
    .select('slug, email, deleted')
    .in('slug', providerIds);

  // Build provider status map
  const providerStatus = new Map();

  // From business_profiles
  (bpProviders || []).forEach(p => {
    providerStatus.set(p.slug, {
      exists: true,
      hasEmail: !!p.email,
      isArchived: p.is_active === false,
      source: 'business_profiles'
    });
  });

  // From olera-providers (only if not deleted and not in business_profiles)
  (oleraProviders || []).forEach(p => {
    if (p.deleted === true) return;
    if (!providerStatus.has(p.slug)) {
      providerStatus.set(p.slug, {
        exists: true,
        hasEmail: !!p.email,
        isArchived: false,
        source: 'olera-providers'
      });
    }
  });

  // Categorize questions
  const orphanQuestions = [];
  const archivedProviderQuestions = [];
  const hasEmailQuestions = [];
  const validQuestions = [];

  for (const q of activeWithFlag) {
    const status = providerStatus.get(q.provider_id);
    if (!status) {
      orphanQuestions.push(q);
    } else if (status.isArchived) {
      archivedProviderQuestions.push(q);
    } else if (status.hasEmail) {
      hasEmailQuestions.push(q);
    } else {
      validQuestions.push(q);
    }
  }

  console.log('\n--- BREAKDOWN ---');
  console.log('Provider NOT FOUND (orphan):', orphanQuestions.length, '(should be 0 after archiving)');
  console.log('Provider ARCHIVED:', archivedProviderQuestions.length);
  console.log('Provider HAS EMAIL:', hasEmailQuestions.length);
  console.log('Provider NEEDS EMAIL (valid):', validQuestions.length);

  if (orphanQuestions.length > 0) {
    console.log('\n!!! ORPHAN QUESTIONS FOUND (should not happen) !!!');
    orphanQuestions.forEach(q => {
      console.log('  - Question ID:', q.id, 'Provider ID:', q.provider_id);
    });
  }

  if (archivedProviderQuestions.length > 0) {
    console.log('\nQuestions to ARCHIVED providers (will be filtered by code fix):');
    const uniqueArchived = [...new Set(archivedProviderQuestions.map(q => q.provider_id))];
    uniqueArchived.forEach(pid => {
      const count = archivedProviderQuestions.filter(q => q.provider_id === pid).length;
      console.log('  -', pid, ':', count, 'questions');
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Without code fix, "needs email" count would be:', activeWithFlag.length);
  console.log('With code fix, "needs email" count will be:', validQuestions.length);
  console.log('Difference (filtered out):', activeWithFlag.length - validQuestions.length);
}

check().catch(console.error);
