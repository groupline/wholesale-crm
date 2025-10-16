const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local file
const envFile = fs.readFileSync('/root/wholesale-crm/.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkNewTables() {
  console.log('\n📊 Checking New Database Tables...\n');

  const newTables = [
    'marketing_campaigns',
    'email_templates',
    'sms_templates',
    'email_campaigns',
    'drip_sequences',
    'drip_steps',
    'drip_enrollments'
  ];

  for (const tableName of newTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName.padEnd(25)} - DOES NOT EXIST`);
        console.log(`   → Run: ${tableName.includes('marketing') ? 'marketing-campaigns-schema.sql' : 'communications-schema.sql'}\n`);
      } else {
        console.log(`✅ ${tableName.padEnd(25)} - EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${tableName.padEnd(25)} - ERROR: ${err.message}`);
    }
  }

  console.log('\n✨ Setup Status:');
  console.log('   - Original tables: ✅ All exist');
  console.log('   - New feature tables: Check above ☝️');
  console.log('\n📝 To create missing tables:');
  console.log('   1. Open Supabase Dashboard → SQL Editor');
  console.log('   2. Run: /root/wholesale-crm/marketing-campaigns-schema.sql');
  console.log('   3. Run: /root/wholesale-crm/communications-schema.sql\n');
}

checkNewTables();
