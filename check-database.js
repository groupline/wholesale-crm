const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owmffmdtppjlixssljcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bWZmbWR0cHBqbGl4c3NsamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDc5OTcsImV4cCI6MjA3NjA4Mzk5N30.r4kMBE_xCeUlHu9vwdqiv9NtRZqcbH8YxvA3By1BkyM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking database tables...\n');

  const tables = [
    'sellers',
    'properties',
    'investors',
    'deals',
    'tasks',
    'activities'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.padEnd(15)} - NOT FOUND (${error.message})`);
      } else {
        console.log(`✅ ${table.padEnd(15)} - EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(15)} - ERROR: ${err.message}`);
    }
  }

  console.log('\nDatabase check complete.');
}

checkTables().then(() => process.exit(0)).catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
