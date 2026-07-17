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
  const email = 'yvesdonald10@gmail.com';
  console.log(`Updating user profile role to "agence" for ${email}...`);

  // 1. Update public.profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'agence' })
    .eq('email', email)
    .select();

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
  } else {
    console.log("Updated Profile:", profile);
  }

  // 2. Also update auth.users metadata if needed, so that future triggers or syncs don't overwrite it
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
  } else {
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      console.log(`Found auth user ID ${user.id}, updating raw_user_meta_data...`);
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { ...user.raw_user_meta_data, role: 'agence' } }
      );
      if (updateError) {
        console.error("Error updating auth user metadata:", updateError.message);
      } else {
        console.log("Successfully updated auth user metadata:", updatedUser.user.raw_user_meta_data);
      }
    } else {
      console.log("Auth user not found.");
    }
  }
}

main().catch(console.error);
