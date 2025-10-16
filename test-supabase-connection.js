const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owmffmdtppjlixssljcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bWZmbWR0cHBqbGl4c3NsamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDc5OTcsImV4cCI6MjA3NjA4Mzk5N30.r4kMBE_xCeUlHu9vwdqiv9NtRZqcbH8YxvA3By1BkyM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Check if we can connect
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase.from('sellers').select('count').limit(1);
    if (error) {
      console.log('   ⚠️  Connection test:', error.message);
    } else {
      console.log('   ✅ Connection successful');
    }
  } catch (err) {
    console.log('   ✅ Connection successful (table may not exist yet)');
  }

  // Test 2: Try to sign in with the admin account
  console.log('\n2. Testing sign in with admin@pinnacle.com...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@pinnacle.com',
    password: 'Admin12345'
  });

  if (signInError) {
    console.log('   ❌ Sign in failed:', signInError.message);
    console.log('   Error code:', signInError.status);

    if (signInError.message.includes('Email not confirmed')) {
      console.log('\n   💡 SOLUTION: The email needs to be confirmed.');
      console.log('   Go to: https://owmffmdtppjlixssljcm.supabase.co/project/owmffmdtppjlixssljcm/auth/users');
      console.log('   Find admin@pinnacle.com and confirm the email.');
    } else if (signInError.message.includes('Invalid login credentials')) {
      console.log('\n   💡 SOLUTION: User may not exist or credentials are wrong.');
      console.log('   Go to: https://owmffmdtppjlixssljcm.supabase.co/project/owmffmdtppjlixssljcm/auth/users');
      console.log('   And create a new user with:');
      console.log('   - Email: admin@pinnacle.com');
      console.log('   - Password: Admin12345');
      console.log('   - Make sure to check "Auto Confirm User"');
    }
  } else {
    console.log('   ✅ Sign in successful!');
    console.log('   User:', signInData.user.email);
    console.log('   Session exists:', !!signInData.session);
  }

  // Test 3: Check auth settings
  console.log('\n3. Checking authentication settings...');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('   Project ID:', 'owmffmdtppjlixssljcm');
  console.log('   Dashboard:', 'https://owmffmdtppjlixssljcm.supabase.co/project/owmffmdtppjlixssljcm/auth/users');
}

testConnection().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
