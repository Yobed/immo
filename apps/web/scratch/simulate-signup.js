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
  console.log("Simulating signup via client-side Supabase client...");
  
  // We use a random email to avoid "already registered"
  const email = `test_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = "TestPassword123!";
  
  console.log(`Signing up with email: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: `https://www.bogbesgroup.com/callback?next=/profil`,
      data: {
        full_name: "Test Sign Up",
        role: "locataire",
        referral_code: null,
      },
    },
  });

  if (error) {
    console.error("Signup Failed!");
    console.error("Error Code:", error.status);
    console.error("Error Message:", error.message);
  } else {
    console.log("Signup Succeeded!");
    console.log("User details:", JSON.stringify(data.user, null, 2));
  }
}

main().catch(console.error);
