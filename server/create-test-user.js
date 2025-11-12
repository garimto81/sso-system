import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Creating test user: user@test.com...');

// Create user
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@test.com',
  password: 'Test1234!',
  email_confirm: true,
  user_metadata: {
    role: 'user'
  }
});

if (error) {
  console.error('Error creating user:', error);
  process.exit(1);
}

console.log('User created:', data.user.id, data.user.email);

// Update profile to set role to 'user'
const { error: updateError } = await supabase
  .from('profiles')
  .update({ role: 'user' })
  .eq('id', data.user.id);

if (updateError) {
  console.error('Error updating profile:', updateError);
  process.exit(1);
}

console.log('Profile updated with role: user');

// Verify
const { data: profile } = await supabase
  .from('profiles')
  .select('email, role')
  .eq('id', data.user.id)
  .single();

console.log('Verification:', profile);
console.log('✅ Test user created successfully!');
