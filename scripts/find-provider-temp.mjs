import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findProvider() {
  // First find the user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }
  
  const user = users.users.find(u => u.email === 'uiuxesther@gmail.com');
  
  if (!user) {
    console.log('User not found with that email');
    return;
  }
  
  console.log('Found user:', user.id, user.email);
  
  // Find account
  const { data: account, error: accError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();
    
  if (accError || !account) {
    console.log('No account found');
    return;
  }
  
  // Find provider profile
  const { data: profiles, error: profError } = await supabase
    .from('business_profiles')
    .select('id, display_name, slug, type, verification_state, email')
    .eq('account_id', account.id);
    
  if (profError) {
    console.error('Error fetching profiles:', profError);
    return;
  }
  
  console.log('\nProfiles for this account:');
  profiles.forEach(p => {
    console.log(`  - ${p.display_name} (${p.type})`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Slug: ${p.slug}`);
    console.log(`    Verification: ${p.verification_state || 'NULL'}`);
  });
}

findProvider();
