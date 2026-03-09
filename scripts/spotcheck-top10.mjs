import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const TOP_10_SLUGS = [
  'what-is-the-va-caregiver-functional-assessment',
  'does-blue-cross-blue-shield-cover-caregiver-expenses',
  'how-to-prove-primary-caregiver-custody',
  'average-cost-of-a-live-in-caregiver',
  'elder-transportation-services-a-guide-to-safe-and-reliable-options',
  'can-a-caregiver-receive-benefits-from-social-security',
  'your-legal-rights-as-a-family-caregiver',
  'can-a-caregiver-dispense-medication',
  'does-medicare-pay-for-family-caregivers',
  'does-social-security-pay-for-a-caregiver',
];

const { data, error } = await sb.from('content_articles')
  .select('slug,title,meta_title,meta_description,excerpt,author_name,author_role,care_types,tags,reading_time,published_at,canonical_url,noindex,structured_data_type,content_html')
  .in('slug', TOP_10_SLUGS);

if (error) { console.error(error); process.exit(1); }

// Sort by the order above
const sorted = TOP_10_SLUGS.map(s => data.find(d => d.slug === s)).filter(Boolean);

for (const a of sorted) {
  const html = a.content_html || '';
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, ''));
  const firstP = html.match(/<p[^>]*>(.*?)<\/p>/i);
  const firstPText = firstP ? firstP[1].replace(/<[^>]+>/g, '').substring(0, 150) : '(none)';

  console.log(`\n${'='.repeat(80)}`);
  console.log(`ARTICLE: ${a.slug}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`  title: ${a.title}`);
  console.log(`  meta_title: ${a.meta_title || '(empty)'}`);
  console.log(`  meta_description: ${(a.meta_description || '(empty)').substring(0, 120)}`);
  console.log(`  excerpt: ${(a.excerpt || '(empty)').substring(0, 120)}`);
  console.log(`  excerpt=meta_desc: ${a.excerpt === a.meta_description}`);
  console.log(`  author: ${a.author_name} | role: ${a.author_role ? 'SET' : '(empty)'}`);
  console.log(`  care_types: [${(a.care_types || []).join(', ')}]`);
  console.log(`  tags: [${(a.tags || []).join(', ')}]`);
  console.log(`  reading_time: ${a.reading_time}`);
  console.log(`  published_at: ${a.published_at}`);
  console.log(`  canonical: ${a.canonical_url || '(auto)'}`);
  console.log(`  noindex: ${a.noindex}`);
  console.log(`  structured_data_type: ${a.structured_data_type}`);
  console.log(`  content_length: ${html.length}`);
  console.log(`  h2_count: ${h2s.length}`);
  console.log(`  h2s: ${JSON.stringify(h2s)}`);
  console.log(`  first_paragraph: ${firstPText}...`);
}
