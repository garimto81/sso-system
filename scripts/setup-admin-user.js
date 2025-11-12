#!/usr/bin/env node

/**
 * Setup Admin User
 *
 * Admin 계정을 빠르게 생성하는 스크립트
 *
 * 사용법:
 *   node scripts/setup-admin-user.js
 *   node scripts/setup-admin-user.js --email=admin@example.com --password=secret123
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('   Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CLI arguments parsing
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  console.log('\n🔧 SSO Admin User Setup\n');

  // Get email and password
  const email = args.email || await prompt('Enter admin email: ');
  const password = args.password || await prompt('Enter password (min 8 chars): ');

  // Validate
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('\n⏳ Creating admin user...');

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists. Updating role to admin...');

        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);

        if (existingUser) {
          // Update profile role
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);

          if (updateError) throw updateError;

          console.log('✅ Role updated to admin for existing user');
          console.log(`\n📧 Email: ${email}`);
          console.log('👤 Role: admin');
          return;
        }
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Update profile role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.warn('⚠️  Warning: Could not update profile role');
      console.warn('   Profile might not exist yet (trigger will create it)');
    }

    console.log('\n✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log('👤 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🧪 Test login with:');
    console.log(`curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${email}","password":"${password}"}'`);

    console.log('\n⚠️  Security reminder:');
    console.log('   - Change password in production');
    console.log('   - Use strong passwords (16+ chars)');
    console.log('   - Enable 2FA if available\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    process.exit(1);
  }
}

createAdminUser();
