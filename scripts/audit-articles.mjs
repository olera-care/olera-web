import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data } = await sb.from('content_articles').select('id,slug,title,author_name,author_role,care_types,tags,category').eq('status', 'published').order('title');

// Group by author
const byAuthor = {};
data.forEach(a => {
  const name = a.author_name || 'Unknown';
  if (!byAuthor[name]) byAuthor[name] = [];
  byAuthor[name].push(a);
});

console.log('=== AUTHORS ===');
Object.entries(byAuthor).forEach(([name, articles]) => {
  const rolesSet = new Set(articles.map(a => a.author_role || '(empty)'));
  console.log(`${name}: ${articles.length} articles, roles: ${JSON.stringify([...rolesSet])}`);
});

console.log('\n=== CARE_TYPES DISTRIBUTION ===');
const ctCounts = {};
let emptyCt = 0;
data.forEach(a => {
  if (!a.care_types || a.care_types.length === 0) { emptyCt++; return; }
  a.care_types.forEach(ct => { ctCounts[ct] = (ctCounts[ct] || 0) + 1; });
});
console.log(`Empty care_types: ${emptyCt} / ${data.length}`);
Object.entries(ctCounts).sort((a, b) => b[1] - a[1]).forEach(([ct, n]) => console.log(`  ${ct}: ${n}`));

console.log('\n=== TAGS DISTRIBUTION ===');
const tagCounts = {};
let emptyTags = 0;
data.forEach(a => {
  if (!a.tags || a.tags.length === 0) { emptyTags++; return; }
  a.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
});
console.log(`Empty tags: ${emptyTags} / ${data.length}`);
Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`));

console.log('\n=== ALL ARTICLES (title | author | care_types | tags) ===');
data.forEach(a => {
  const ct = (a.care_types || []).join(', ') || '(none)';
  const tg = (a.tags || []).join(', ') || '(none)';
  console.log(`  ${a.slug}`);
  console.log(`    title: ${a.title}`);
  console.log(`    author: ${a.author_name} | care_types: [${ct}] | tags: [${tg}]`);
});
