// Test Frontend /api/auth/login endpoint
const FRONTEND_URL = 'https://sso-frontend-ecyva32fq-garimto81s-projects.vercel.app';

async function testFrontendLogin() {
  console.log('Testing Frontend /api/auth/login...');
  console.log('URL:', `${FRONTEND_URL}/api/auth/login`);

  const credentials = {
    email: 'admin@sso.local',
    password: 'Test1234!'
  };

  console.log('Credentials:', JSON.stringify(credentials, null, 2));

  try {
    const response = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nResponse body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Frontend login API successful!');
    } else {
      console.log('\n❌ Frontend login API failed');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFrontendLogin();
