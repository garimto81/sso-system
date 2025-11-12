// Vercel Serverless Function Entry Point
try {
  console.log('🔍 [Vercel] Initializing serverless function...');
  console.log('🔍 [Vercel] Environment check:');
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log('   - VERCEL:', process.env.VERCEL);
  console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   - SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');
} catch (err) {
  console.error('❌ [Vercel] Environment check failed:', err);
}

let app;
try {
  const module = await import('../src/index.js');
  app = module.default;
  console.log('✅ [Vercel] App initialized successfully');
} catch (err) {
  console.error('❌ [Vercel] Failed to initialize app:', err);
  console.error('❌ [Vercel] Error stack:', err.stack);

  // Return error handler for debugging
  app = (req, res) => {
    res.status(500).json({
      error: 'Server Initialization Failed',
      message: err.message,
      stack: err.stack,
      env_check: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        JWT_SECRET: !!process.env.JWT_SECRET,
        SESSION_SECRET: !!process.env.SESSION_SECRET
      }
    });
  };
}

export default app;
