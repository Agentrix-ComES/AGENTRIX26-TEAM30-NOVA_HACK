(async () => {
  const base = 'http://localhost:5000/api/auth';
  const now = Date.now();
  const testEmail = `testuser+${now}@example.com`;
  const testPhone = `07${Math.floor(10000000 + Math.random()*90000000)}`;
  const password = 'password123';

  const headers = { 'Content-Type': 'application/json' };

  const log = (label, obj) => console.log('\n=== ' + label + ' ===\n', JSON.stringify(obj, null, 2));

  // 1) Register
  try {
    const res = await fetch(`${base}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test User', email: testEmail, phone: testPhone, password, district: 'colombo' })
    });
    const json = await res.json();
    log('Register Response', { status: res.status, body: json });
  } catch (err) {
    console.error('Register request failed', err);
  }

  // 2) Login with correct credentials
  try {
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ identifier: testEmail, password })
    });
    const json = await res.json();
    log('Login (correct) Response', { status: res.status, body: json });
  } catch (err) {
    console.error('Login (correct) request failed', err);
  }

  // 3) Login with wrong password
  try {
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ identifier: testEmail, password: 'wrongpass' })
    });
    const json = await res.json();
    log('Login (wrong password) Response', { status: res.status, body: json });
  } catch (err) {
    console.error('Login (wrong) request failed', err);
  }

  // 4) Register duplicate (same email)
  try {
    const res = await fetch(`${base}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test User 2', email: testEmail, phone: testPhone, password, district: 'colombo' })
    });
    const json = await res.json();
    log('Register Duplicate Response', { status: res.status, body: json });
  } catch (err) {
    console.error('Register duplicate request failed', err);
  }

})();
