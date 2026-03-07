import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DUMMY_SLUGS = [
  'complete-guide-to-home-health',
  'paying-for-assisted-living',
  'home-health-vs-home-care',
  'memory-care-checklist',
  'nursing-home-vs-assisted-living',
  'independent-living-guide',
];

console.log(`Deleting ${DUMMY_SLUGS.length} dummy articles...`);

const { data, error } = await sb
  .from('content_articles')
  .delete()
  .in('slug', DUMMY_SLUGS)
  .select('slug');

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Deleted ${data.length} articles:`);
  data.forEach(a => console.log(`  - ${a.slug}`));
}
