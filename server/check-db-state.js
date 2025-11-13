/**
 * Database State Check Script
 * Checks auth.users and profiles tables for admin@test.com
 */

import { supabaseAdmin } from './src/utils/supabase.js';

async function checkDatabaseState() {
  try {
    console.log('=== CHECKING DATABASE STATE ===\n');

    // 1. Check auth.users
    console.log('1. Checking auth.users table...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const adminUser = users.users.find(u => u.email === 'admin@test.com');

    if (!adminUser) {
      console.log('❌ Admin user NOT FOUND in auth.users');
      console.log('   All users:', users.users.map(u => ({ email: u.email, id: u.id })));
      return;
    }

    console.log('✅ Admin user found in auth.users');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Created:', adminUser.created_at);
    console.log('   Confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');

    // 2. Check profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      console.log('   Error code:', profileError.code);
      console.log('   Error details:', profileError.details);
      console.log('   Error hint:', profileError.hint);

      // Try fetching all profiles to see what exists
      const { data: allProfiles, error: allError } = await supabaseAdmin
        .from('profiles')
        .select('*');

      if (allError) {
        console.error('   ❌ Cannot fetch any profiles:', allError);
      } else {
        console.log('   All profiles in table:', allProfiles);
      }
      return;
    }

    if (!profile) {
      console.log('❌ Profile NOT FOUND for user:', adminUser.id);

      // Check all profiles
      const { data: allProfiles } = await supabaseAdmin
        .from('profiles')
        .select('*');
      console.log('   All profiles:', allProfiles);
      return;
    }

    console.log('✅ Profile found');
    console.log('   ID:', profile.id);
    console.log('   Role:', profile.role);
    console.log('   Display Name:', profile.display_name);
    console.log('   Created:', profile.created_at);

    // 3. Test the exact query from auth.js
    console.log('\n3. Testing exact query from auth.js...');
    const { data: testProfile, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (testError) {
      console.error('❌ Query failed:', testError);
      console.log('   This is the EXACT error from login!');
    } else {
      console.log('✅ Query successful');
      console.log('   Role:', testProfile.role);
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS status...');
    const { data: tableInfo } = await supabaseAdmin
      .rpc('get_table_rls_status', { table_name: 'profiles' })
      .catch(() => ({ data: null }));

    if (tableInfo) {
      console.log('   RLS enabled:', tableInfo.rls_enabled);
    } else {
      console.log('   (Cannot determine RLS status - need custom function)');
    }

  } catch (error) {
    console.error('\n❌ SCRIPT ERROR:', error);
    console.error('   Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

checkDatabaseState();
