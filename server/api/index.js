// Vercel Serverless Function Entry Point
console.log('🔍 [Vercel] Initializing serverless function...');
console.log('🔍 [Vercel] Environment check:');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - VERCEL:', process.env.VERCEL);
console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   - SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');

// Import app synchronously
import app from '../src/index.js';

export default app;
