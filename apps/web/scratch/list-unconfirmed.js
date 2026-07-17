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
  console.log("Fetching all auth users to find unconfirmed accounts...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error.message);
    return;
  }
  
  const unconfirmed = users.filter(u => !u.confirmed_at);
  console.log(`Found ${unconfirmed.length} unconfirmed users out of ${users.length} total users:`);
  
  unconfirmed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  unconfirmed.forEach(u => {
    console.log(`- Created: ${u.created_at}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Last Sign In: ${u.last_sign_in_at}`);
    console.log(`  Metadata:`, JSON.stringify(u.raw_user_meta_data));
  });
}

main().catch(console.error);
