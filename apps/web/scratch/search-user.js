const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}="(.*)"`, 'm')) || envContent.match(new RegExp(`^${name}=(.*)`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceRole = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    persistSession: false
  }
});

async function main() {
  const searchTerm = 'yvesdonald10';
  console.log(`Searching for users with email containing "${searchTerm}"...`);

  // Search auth.users
  const { data: { users }, error: usersQuery } = await supabase.auth.admin.listUsers();
  if (usersQuery) {
    console.error("Error listing auth users:", usersQuery.message);
  } else {
    const matchUsers = users.filter(u => u.email && u.email.toLowerCase().includes(searchTerm));
    console.log(`Found ${matchUsers.length} matching users in auth.users:`);
    matchUsers.forEach(u => {
      console.log(`- ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Confirmed: ${u.confirmed_at ? `YES (at ${u.confirmed_at})` : 'NO'}`);
      console.log(`  Last Login: ${u.last_sign_in_at}`);
      console.log(`  Created: ${u.created_at}`);
      console.log(`  Metadata:`, JSON.stringify(u.raw_user_meta_data));
    });
  }

  // Search profiles
  const { data: profiles, error: profQuery } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', `%${searchTerm}%`);
  
  if (profQuery) {
    console.error("Error searching profiles:", profQuery.message);
  } else {
    console.log(`\nFound ${profiles.length} matching profiles in public.profiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Email: ${p.email}, Name: ${p.full_name}, Role: ${p.role}`);
    });
  }
}

main().catch(console.error);
