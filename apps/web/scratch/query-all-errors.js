const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  console.log("Querying all error logs in last 7 days...");
  const { data: logs, error } = await supabase
    .from('error_logs')
    .select('*')
    .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log(`Found ${logs.length} error logs:`);
    logs.forEach(log => {
      console.log(`[${log.created_at}] [${log.level}] [Route: ${log.route}] ${log.message}`);
      console.log(`  Context:`, JSON.stringify(log.context));
    });
  }
}

main().catch(console.error);
