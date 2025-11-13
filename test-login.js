// Test Backend login API
// Node.js 18+ has built-in fetch

const BACKEND_URL = 'https://sso-backend-eight.vercel.app';

async function testLogin() {
  console.log('Testing Backend login API...');
  console.log('URL:', `${BACKEND_URL}/auth/login`);

  const credentials = {
    email: 'admin@sso.local',
    password: 'Test1234!'
  };

  console.log('Credentials:', JSON.stringify(credentials, null, 2));

  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Access token:', data.access_token?.substring(0, 20) + '...');
      console.log('User role:', data.user?.role);
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();
