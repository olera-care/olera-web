require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get questions that are archived with needs_provider_email=true
  const { data: archivedWithFlag } = await db
    .from('provider_questions')
    .select('id, provider_id, status, metadata, created_at')
    .eq('status', 'archived');

  const withFlag = archivedWithFlag.filter(q => {
    const meta = q.metadata || {};
    return meta.needs_provider_email === true;
  });

  console.log('Total archived questions with needs_provider_email flag:', withFlag.length);

  // Get unique provider IDs from these archived questions
  const providerIds = [...new Set(withFlag.map(q => q.provider_id).filter(Boolean))];
  console.log('Unique provider IDs in archived questions with flag:', providerIds.length);

  // Check which of these providers exist
  const { data: bpProviders } = await db
    .from('business_profiles')
    .select('slug, is_active')
    .in('slug', providerIds);

  const { data: oleraProviders } = await db
    .from('olera-providers')
    .select('slug, deleted')
    .in('slug', providerIds);

  const existingProviders = new Set();
  (bpProviders || []).forEach(p => existingProviders.add(p.slug));
  (oleraProviders || []).filter(p => p.deleted !== true).forEach(p => existingProviders.add(p.slug));

  const orphanIds = providerIds.filter(id => !existingProviders.has(id));
  console.log('Provider IDs that DO exist:', providerIds.length - orphanIds.length);
  console.log('Provider IDs that DO NOT exist (orphans):', orphanIds.length);

  // Count questions per orphan provider
  const orphanQuestionCount = withFlag.filter(q => orphanIds.includes(q.provider_id)).length;
  console.log('Questions to non-existent providers (matches 18 we archived):', orphanQuestionCount);

  // Show the orphan provider IDs
  if (orphanIds.length > 0) {
    console.log('\nOrphan provider IDs:');
    orphanIds.forEach(id => console.log('  -', id));
  }
}
check().catch(console.error);
