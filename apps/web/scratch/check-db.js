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

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    persistSession: false
  }
});

async function main() {
  console.log("Connecting to Supabase at", supabaseUrl);
  
  // 1. Check recent error logs
  console.log("\n--- RECENT ERROR LOGS ---");
  const { data: errors, error: errQuery } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (errQuery) {
    console.error("Error querying error_logs:", errQuery.message);
  } else {
    errors.forEach(e => {
      console.log(`[${e.created_at}] [${e.level}] ${e.message}`);
      console.log(`  Source: ${e.source}, Route: ${e.route}`);
      console.log(`  Context:`, JSON.stringify(e.context));
      if (e.stack) console.log(`  Stack: ${e.stack.substring(0, 150)}...`);
    });
  }

  // 2. Check recently registered users in public.profiles
  console.log("\n--- RECENT PROFILES ---");
  const { data: profiles, error: profQuery } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (profQuery) {
    console.error("Error querying profiles:", profQuery.message);
  } else {
    profiles.forEach(p => {
      console.log(`[${p.created_at}] ID: ${p.id}, Email: ${p.email}, Name: ${p.full_name}, Role: ${p.role}`);
    });
  }

  // 3. Query auth.users via supabase admin API
  console.log("\n--- RECENT AUTH USERS ---");
  const { data: { users }, error: usersQuery } = await supabase.auth.admin.listUsers();
  if (usersQuery) {
    console.error("Error listing auth users:", usersQuery.message);
  } else {
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    users.slice(0, 10).forEach(u => {
      console.log(`[${u.created_at}] ID: ${u.id}, Email: ${u.email}, Confirmed: ${u.confirmed_at ? 'YES' : 'NO'}, Last Login: ${u.last_sign_in_at}`);
    });
  }
}

main().catch(console.error);
