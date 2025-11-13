#!/usr/bin/env node
/**
 * Verify Admin User
 *
 * Quick script to check if admin user exists
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAdmin() {
  try {
    // Check auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) throw usersError;

    const adminUser = users.users.find(u => u.email === 'admin@test.com');

    if (!adminUser) {
      console.log('❌ Admin user not found in auth.users');
      return;
    }

    console.log('✅ Admin user found in auth.users');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Created: ${new Date(adminUser.created_at).toISOString()}`);

    // Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.log('⚠️  Profile not found in profiles table');
      console.log(`   Error: ${profileError.message}`);
      return;
    }

    console.log('\n✅ Profile found in profiles table');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Display Name: ${profile.display_name || 'N/A'}`);

    if (profile.role === 'admin') {
      console.log('\n🎉 Admin user is properly configured!');
    } else {
      console.log(`\n⚠️  Warning: User role is '${profile.role}', not 'admin'`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyAdmin();
