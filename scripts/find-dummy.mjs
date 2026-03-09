import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data } = await sb.from('content_articles').select('slug,title,author_name,published_at,content_html,content_json,created_at').eq('status', 'published').order('created_at', { ascending: false });

console.log('=== ARTICLES WITH NO REAL CONTENT ===\n');
let count = 0;
for (const a of data) {
  const hasHtml = a.content_html && a.content_html.length > 100;
  const hasJson = a.content_json && Object.keys(a.content_json).length > 0;
  if (!hasHtml && !hasJson) {
    count++;
    console.log(`${a.slug}`);
    console.log(`  title: ${a.title}`);
    console.log(`  author: ${a.author_name}`);
    console.log(`  published: ${a.published_at}`);
    console.log(`  created: ${a.created_at}`);
    console.log(`  html length: ${(a.content_html || '').length}`);
    console.log();
  }
}
console.log(`Total: ${count} / ${data.length} articles have no real content`);

// Also check: which authors ONLY appear on dummy articles?
const dummyAuthors = new Set();
const realAuthors = new Set();
for (const a of data) {
  const hasContent = (a.content_html && a.content_html.length > 100) || (a.content_json && Object.keys(a.content_json).length > 0);
  if (hasContent) {
    realAuthors.add(a.author_name);
  } else {
    dummyAuthors.add(a.author_name);
  }
}
console.log('\nAuthors ONLY on dummy articles (no real content):');
for (const a of dummyAuthors) {
  if (!realAuthors.has(a)) {
    console.log(`  - ${a}`);
  }
}
