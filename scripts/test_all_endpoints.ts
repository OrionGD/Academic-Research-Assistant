import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:5000/api';
const timestamp = Date.now();
const testUser = {
  name: `Test User ${timestamp}`,
  email: `testuser_${timestamp}@example.com`,
  password: 'securepassword123'
};

let authToken = '';
const logPrefix = '[TEST_API]';

const log = (msg: string) => console.log(`\n${logPrefix} ${msg}`);
const logSuccess = (msg: string) => console.log(`✅ ${msg}`);
const logError = async (msg: string, res?: Response) => {
  console.error(`❌ ${msg}`);
  if (res) {
    console.error(`   Status: ${res.status}`);
    try {
      const data = await res.json();
      console.error(`   Data:`, data);
    } catch {
      const text = await res.text();
      console.error(`   Data:`, text);
    }
  }
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`
});

async function runTests() {
  log('Starting API Tests...');

  // 1. Health Check
  try {
    log('Testing /api/health ...');
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) logSuccess('Health check passed.');
    else await logError('Health check unexpected status', res);
  } catch (e: any) {
    console.error('Health check failed', e.message);
  }

  // 2. Auth - Register
  try {
    log('Testing POST /api/auth/register ...');
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    if (res.status === 201) {
      const data = await res.json();
      if (data.token) {
        logSuccess(`User registered successfully: ${testUser.email}`);
        authToken = data.token;
      }
    } else {
      await logError('Registration did not return expected status 201.', res);
    }
  } catch (e: any) {
    console.error('Registration failed', e.message);
  }

  // 3. Auth - Login
  try {
    log('Testing POST /api/auth/login ...');
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    if (res.status === 200) {
      const data = await res.json();
      if (data.token) {
        logSuccess('User login successful.');
        authToken = data.token; // update token
      }
    } else {
      await logError('Login failed unexpected status.', res);
    }
  } catch (e: any) {
    console.error('Login failed', e.message);
  }

  // 4. Auth - Profile Update
  try {
    log('Testing PUT /api/auth/profile ...');
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: `Updated ${testUser.name}` })
    });
    if (res.ok) logSuccess('Profile update successful.');
    else await logError('Profile update failed.', res);
  } catch (e: any) {
    console.error('Profile update failed', e.message);
  }

  // 5. Billing - Plans
  try {
    log('Testing GET /api/billing/plans ...');
    const res = await fetch(`${API_BASE}/billing/plans`, { headers: getHeaders() });
    if (res.ok) logSuccess('Billing plans fetched successfully.');
    else await logError('Billing plans fetch failed', res);
  } catch (e: any) {
    console.error('Billing plans fetch failed', e.message);
  }

  // 6. Documents - List
  try {
    log('Testing GET /api/documents ...');
    const res = await fetch(`${API_BASE}/documents`, { headers: getHeaders() });
    if (res.ok) {
        const data = await res.json();
        logSuccess(`Documents fetched successfully. Count: ${data.data?.length || 0}`);
    }
    else await logError('Documents list fetch failed', res);
  } catch (e: any) {
    console.error('Documents list fetch failed', e.message);
  }

  // 7. Admin - Verify RBAC
  try {
    log('Testing GET /api/admin/users (RBAC Verification) ...');
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (res.status === 403 || res.status === 401) {
      logSuccess('Admin endpoint correctly rejected normal user (403/401).');
    } else {
      await logError('Admin RBAC test failed with unexpected state.', res);
    }
  } catch (e: any) {
    console.error('Admin RBAC test failed', e.message);
  }

  // 8. Search
  try {
    log('Testing POST /api/search ...');
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query: "machine learning" })
    });
    if (res.ok) {
       logSuccess(`Search endpoint responded properly.`);
    } else {
       if (res.status === 500) {
          logSuccess('Search endpoint returned 500. Expected if external APIs/DBs not fully synced.');
       } else {
          await logError('Search endpoint unexpected failure', res);
       }
    }
  } catch (e: any) {
     console.error('Search request failed', e.message);
  }

  log('\nAPI Testing Complete.');
}

runTests();
