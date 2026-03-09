import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const checks = [
  'home-care-vs-assisted-living-a-brief-guide-to-long-term-care-decisions',  // Logan → Dr. Logan
  'complete-guide-to-advance-care-planning-for-family-caregivers',           // Laura Herman CCF
  'what-is-the-va-caregiver-functional-assessment',                          // care_types added
  'how-to-prove-primary-caregiver-custody',                                  // tags fixed
  'alzheimer-s-disease-understanding-the-7-stages-and-identifying-symptoms', // memory-care added
];

const { data } = await sb.from('content_articles')
  .select('slug,author_name,author_role,care_types,tags')
  .in('slug', checks);

for (const a of data) {
  console.log(`\n${a.slug}`);
  console.log(`  author: ${a.author_name}`);
  console.log(`  role: ${(a.author_role || '(empty)').substring(0, 80)}...`);
  console.log(`  care_types: [${(a.care_types || []).join(', ')}]`);
  console.log(`  tags: [${(a.tags || []).join(', ')}]`);
}
