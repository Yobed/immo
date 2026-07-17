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
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

// Instantiate with Anon Key (exactly like the client browser)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = "test_agent_bogbes_new@gmail.com";
  const password = "TestPassword123!";
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.log("Full error details:", JSON.stringify(error, null, 2));
  }
}

main().catch(console.error);
